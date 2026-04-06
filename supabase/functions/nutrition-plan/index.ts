import { corsHeaders } from '../_shared/cors.ts'
import { requireAuth, requireDogOwnership } from '../_shared/auth.ts'
import { checkActionCredit, consumeActionCredit } from '../_shared/quota.ts'
import { invokeLLM } from '../_shared/openrouter.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import { sanitize } from '../_shared/sanitize.ts'

/** Returns the ISO date string for the start of the current week (Monday 00:00:00 UTC). */
function getWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysFromMonday)
  monday.setUTCHours(0, 0, 0, 0)
  return monday.toISOString()
}

/** Returns the ISO date string for next Monday 00:00:00 UTC. */
function getNextWeekStart(): string {
  const now = new Date()
  const dayOfWeek = now.getUTCDay()
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilNextMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)
  return nextMonday.toISOString()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const user = await requireAuth(req)

    const { dogId, preferences } = await req.json()

    if (!dogId) {
      return new Response(
        JSON.stringify({ error: 'dogId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify dog ownership before any credit check
    await requireDogOwnership(authHeader, dogId)

    // Check action credit FIRST — blocks LLM call if daily quota exceeded
    await checkActionCredit(authHeader)

    const serviceClient = createServiceClient()

    // Fetch user profile to check premium status
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Weekly quota check for free users — 1 plan/week
    if (!profile.is_premium) {
      const weekStart = getWeekStart()
      const { count, error: countError } = await serviceClient
        .from('nutrition_plans')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .gte('generated_at', weekStart)

      if (countError) {
        console.error('Quota count error:', countError.message)
        return new Response(
          JSON.stringify({ error: 'Unable to verify quota. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      if ((count ?? 0) >= 1) {
        return new Response(
          JSON.stringify({
            error: 'nutrition_plan_quota_exceeded',
            quota_type: 'plan',
            limit: 1,
            used: count,
            next_reset: getNextWeekStart(),
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }

    // Fetch dog profile — full context for nutrition prompt
    const { data: dog, error: dogError } = await serviceClient
      .from('dogs')
      .select(
        'name, breed, weight, birth_date, health_issues, allergies, activity_level, diet_type, diet_brand, diet_restrictions',
      )
      .eq('id', dogId)
      .single()

    if (dogError || !dog) {
      return new Response(
        JSON.stringify({ error: 'Dog not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch diet preferences (optional — unique per dog)
    const { data: dietPrefs } = await serviceClient
      .from('diet_preferences')
      .select('preferred_brands, disliked_foods, portions_per_day, organic_preference, notes')
      .eq('dog_id', dogId)
      .single()
    // Ignore error — dietPrefs may not exist, that's fine

    // Compute age text
    let ageText = ''
    if (dog.birth_date) {
      const ageMs = Date.now() - new Date(dog.birth_date).getTime()
      const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44))
      ageText = ageMonths >= 12 ? `${Math.floor(ageMonths / 12)} ans` : `${ageMonths} mois`
    }

    // Apply input preferences overrides
    const inputAllergies: string[] | undefined = Array.isArray(preferences?.allergies)
      ? preferences.allergies
      : undefined
    const inputDietType: string | undefined = typeof preferences?.diet_type === 'string'
      ? preferences.diet_type
      : undefined

    const effectiveAllergies = inputAllergies && inputAllergies.length > 0
      ? inputAllergies.map((a: string) => sanitize(String(a), 100)).join(', ')
      : sanitize(dog.allergies, 500) || 'Aucune'

    const effectiveDietType = inputDietType
      ? sanitize(inputDietType, 100)
      : sanitize(dog.diet_type, 100) || 'Non renseigné'

    const prompt = `Tu es un nutritionniste expert en alimentation canine. Génère un plan repas personnalisé sur 7 jours pour ce chien.

PROFIL DU CHIEN:
- Nom: ${sanitize(dog.name, 100)}
- Race: ${sanitize(dog.breed, 100) || 'Non renseignée'}
- Poids: ${dog.weight ? dog.weight + ' kg' : 'Non renseigné'}
- Âge: ${ageText || 'Non renseigné'}
- Niveau d'activité: ${sanitize(dog.activity_level, 100) || 'Non renseigné'}
- Problèmes de santé: ${sanitize(dog.health_issues, 500) || 'Aucun'}
- Allergies: ${effectiveAllergies}
- Type d'alimentation actuelle: ${effectiveDietType}
- Marque actuelle: ${sanitize(dog.diet_brand, 200) || 'Non renseignée'}
- Restrictions alimentaires: ${sanitize(dog.diet_restrictions, 500) || 'Aucune'}${dietPrefs ? `
- Aliments à éviter: ${sanitize(dietPrefs.disliked_foods, 300) || 'Aucun'}
- Nombre de repas/jour: ${dietPrefs.portions_per_day ?? 'Non renseigné'}
- Préférence bio: ${dietPrefs.organic_preference ? 'Oui' : 'Non'}` : ''}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, ni de références à des sites internet. Inclure un rappel de consulter un vétérinaire avant tout changement alimentaire.

Génère un plan 7 jours avec 2 repas par jour (matin et soir). Adapte les portions et calories au poids et niveau d'activité du chien.

Réponds UNIQUEMENT en JSON strict avec ces champs exactement:
{
  "days": [
    {
      "day": "string (ex: Lundi)",
      "meals": [
        { "name": "string", "portions": "string (ex: 120g)", "calories": nombre entier, "type": "morning" | "evening" }
      ]
    }
  ],
  "tips": ["string", "string"] (2-3 conseils personnalisés adaptés au profil du chien),
  "total_daily_calories": nombre entier (moyenne journalière),
  "recommended_range": { "min": nombre entier, "max": nombre entier }
}

IMPORTANT: Le tableau "days" doit contenir exactement 7 éléments (Lundi à Dimanche). Chaque jour doit avoir exactement 2 repas (type "morning" et "evening").`

    const raw = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    // LLM succeeded — consume 1 action credit now
    await consumeActionCredit(authHeader)

    let result: any = {}
    try {
      result = JSON.parse(raw)
    } catch {
      // keep empty object fallback
    }

    // Normalize LLM output with safe fallbacks
    const days = Array.isArray(result.days) ? result.days : []
    const tips = Array.isArray(result.tips) ? result.tips : []
    const totalDailyCalories = typeof result.total_daily_calories === 'number'
      ? Math.round(result.total_daily_calories)
      : null
    const recommendedRange = result.recommended_range &&
        typeof result.recommended_range.min === 'number' &&
        typeof result.recommended_range.max === 'number'
      ? { min: Math.round(result.recommended_range.min), max: Math.round(result.recommended_range.max) }
      : null

    const planData = { days, tips, total_daily_calories: totalDailyCalories, recommended_range: recommendedRange }

    // Deactivate previous plans for this dog before inserting the new one
    const { error: deactivateError } = await serviceClient
      .from('nutrition_plans')
      .update({ is_active: false })
      .eq('dog_id', dogId)
      .eq('owner_id', user.id)

    if (deactivateError) {
      console.error('Deactivate old plans error:', deactivateError.message)
    }

    // Insert new plan as active
    const { data: plan, error: insertError } = await serviceClient
      .from('nutrition_plans')
      .insert({
        owner_id: user.id,
        dog_id: dogId,
        plan_text: planData,
        is_active: true,
        dog_weight_at_generation: dog.weight ?? null,
        notes: null,
      })
      .select('id, generated_at')
      .single()

    if (insertError) {
      console.error('Insert nutrition_plans error:', insertError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to save nutrition plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: {
          id: plan.id,
          days,
          tips,
          total_daily_calories: totalDailyCalories,
          recommended_range: recommendedRange,
          disclaimer:
            'Ce plan est généré par une IA. Consultez votre vétérinaire avant tout changement alimentaire.',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    // Auth/quota errors are Response objects — pass them through directly
    if (err instanceof Response) return err
    console.error('nutrition-plan error:', err instanceof Error ? err.message : String(err))
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
