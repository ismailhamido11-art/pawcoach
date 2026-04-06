import { corsHeaders } from '../_shared/cors.ts'
import { requireAuth, requireDogOwnership } from '../_shared/auth.ts'
import { checkActionCredit, consumeActionCredit } from '../_shared/quota.ts'
import { invokeLLM } from '../_shared/openrouter.ts'
import { createServiceClient } from '../_shared/supabase-client.ts'
import { sanitize } from '../_shared/sanitize.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const user = await requireAuth(req)

    const { dogId } = await req.json()

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

    // Fetch dog profile — context for activity prompt
    const { data: dog, error: dogError } = await serviceClient
      .from('dogs')
      .select('name, breed, weight, birth_date, activity_level, health_issues')
      .eq('id', dogId)
      .single()

    if (dogError || !dog) {
      return new Response(
        JSON.stringify({ error: 'Dog not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Compute age text
    let ageText = ''
    if (dog.birth_date) {
      const ageMs = Date.now() - new Date(dog.birth_date).getTime()
      const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44))
      ageText = ageMonths >= 12 ? `${Math.floor(ageMonths / 12)} ans` : `${ageMonths} mois`
    }

    const prompt =
      `Tu es un coach sportif expert en activité physique canine. Génère un programme d'exercices personnalisé sur 7 jours pour ce chien.

PROFIL DU CHIEN:
- Nom: ${sanitize(dog.name, 100)}
- Race: ${sanitize(dog.breed, 100) || 'Non renseignée'}
- Poids: ${dog.weight ? dog.weight + ' kg' : 'Non renseigné'}
- Âge: ${ageText || 'Non renseigné'}
- Niveau d'activité: ${sanitize(dog.activity_level, 100) || 'Non renseigné'}
- Problèmes de santé: ${sanitize(dog.health_issues, 500) || 'Aucun'}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, ni de références à des sites internet. Inclure un rappel de consulter un vétérinaire si le chien a des problèmes de santé.

Génère un programme d'exercices sur 7 jours adapté au profil du chien. Chaque jour doit avoir une activité adaptée à son niveau et son état de santé.

Réponds UNIQUEMENT en JSON strict avec ces champs exactement:
{
  "program_name": "string (nom du programme, ex: Programme Vitalité 7 jours)",
  "duration_days": 7,
  "exercises": [
    {
      "day": nombre entier (1 à 7),
      "title": "string (nom de l'exercice)",
      "description": "string (description détaillée de l'exercice)",
      "duration_min": nombre entier (durée en minutes),
      "type": "walk" | "play" | "training" | "rest"
    }
  ]
}

IMPORTANT: Le tableau "exercises" doit contenir exactement 7 éléments (un par jour). Les types autorisés sont uniquement: "walk", "play", "training", "rest".`

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
    const programName = typeof result.program_name === 'string' && result.program_name
      ? result.program_name
      : "Programme d'activité 7 jours"
    const exercises = Array.isArray(result.exercises) ? result.exercises : []

    const programData = { program_name: programName, duration_days: 7, exercises }

    // Save to bookmarks
    const { data: bookmark, error: insertError } = await serviceClient
      .from('bookmarks')
      .insert({
        owner_id: user.id,
        dog_id: dogId,
        source: 'fitness_program',
        title: programName,
        content: JSON.stringify(programData),
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('Insert bookmarks error:', insertError.message)
      return new Response(
        JSON.stringify({ error: 'Failed to save activity program' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        program: {
          id: bookmark.id,
          program_name: programName,
          duration_days: 7,
          exercises,
          disclaimer:
            "Ce programme est généré par une IA. Consultez votre vétérinaire avant de commencer si votre chien a des problèmes de santé.",
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    // Auth/quota errors are Response objects — pass them through directly
    if (err instanceof Response) return err
    console.error('activity-program error:', err instanceof Error ? err.message : String(err))
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
