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

    const { foodName, imageBase64: _imageBase64, dogId } = await req.json()

    // Validate required input
    if (!foodName || typeof foodName !== 'string') {
      return new Response(
        JSON.stringify({ error: 'foodName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (foodName.length > 200) {
      return new Response(
        JSON.stringify({ error: 'foodName must be 200 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // If dogId provided, verify ownership before any credit check
    if (dogId) {
      await requireDogOwnership(authHeader, dogId)
    }

    // Check action credit BEFORE LLM call — throws 429 if exceeded
    await checkActionCredit(authHeader)

    const safeFoodName = sanitize(foodName, 200)
    const serviceClient = createServiceClient()

    let dogContextBlock = ''

    if (dogId) {
      const { data: dog, error: dogError } = await serviceClient
        .from('dogs')
        .select('name, breed, weight, birth_date, health_issues, allergies, activity_level')
        .eq('id', dogId)
        .single()

      if (dogError || !dog) {
        return new Response(
          JSON.stringify({ error: 'Dog not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      let ageText = ''
      if (dog.birth_date) {
        const ageMs = Date.now() - new Date(dog.birth_date).getTime()
        const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44))
        ageText = ageMonths >= 12 ? `${Math.floor(ageMonths / 12)} ans` : `${ageMonths} mois`
      }

      dogContextBlock = `
CONTEXTE DU CHIEN:
- Nom: ${sanitize(dog.name, 100)}
- Race: ${sanitize(dog.breed, 100) || 'Non renseignée'}
- Poids: ${dog.weight ? dog.weight + ' kg' : 'Non renseigné'}
- Âge: ${ageText || 'Non renseigné'}
- Problèmes de santé connus: ${sanitize(dog.health_issues, 500) || 'Aucun'}
- Allergies connues: ${sanitize(dog.allergies, 500) || 'Aucune'}
- Niveau d'activité: ${sanitize(dog.activity_level, 100) || 'Non renseigné'}
`
    }

    const prompt = `Tu es un assistant IA expert en nutrition canine. Analyse si l'aliment indique est sans danger pour un chien.
${dogContextBlock}
ALIMENT A ANALYSER: ${safeFoodName}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, ni de references a des sites internet. Rappeler systematiquement de consulter un veterinaire.

Reponds UNIQUEMENT en JSON strict avec ces champs exactement:
{
  "food_name": "string (nom normalise de l'aliment)",
  "danger_category": "safe" | "caution" | "toxic",
  "toxicity_score": nombre entier 0-10 (0=tres sur, 10=extremement dangereux),
  "summary": "string (1-2 phrases resume clair et direct)",
  "details": "string (explication detaillee des mecanismes de toxicite ou de securite pour les chiens)",
  "reasons": ["string", "string"] (2-4 raisons cles, concises),
  "emergency_steps": ["string"] ou null (si toxic: etapes urgences prioritaires; sinon null),
  "alternatives": ["string"] ou null (si caution ou toxic: alternatives sures; sinon null),
  "recommendation": "string (conseil pratique pour le proprietaire)"
}`

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

    // Validate and normalize LLM output
    const dangerCategory = ['safe', 'caution', 'toxic'].includes(result.danger_category)
      ? result.danger_category
      : 'caution'

    const toxicityScore = typeof result.toxicity_score === 'number'
      ? Math.min(10, Math.max(0, Math.round(result.toxicity_score)))
      : 5

    // Insert into food_scans only when dogId is provided (dog_id NOT NULL in schema)
    let scanId: string | null = null
    let scanSaved = false

    if (dogId) {
      const { data: scan, error: insertError } = await serviceClient
        .from('food_scans')
        .insert({
          owner_id: user.id,
          dog_id: dogId,
          food_name: safeFoodName,
          photo_url: null,
          verdict: dangerCategory,
          score: toxicityScore,
          summary: result.summary || '',
          details: result.details || '',
          recommendation: result.recommendation || '',
          allergen_alerts: Array.isArray(result.reasons) ? result.reasons : [],
          mode: 'food',
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert food_scans error:', insertError.message)
      } else {
        scanId = scan?.id ?? null
        scanSaved = true
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scan_saved: scanSaved,
        scan: {
          id: scanId,
          food_name: result.food_name || safeFoodName,
          danger_category: dangerCategory,
          toxicity_score: toxicityScore,
          summary: result.summary || 'Analyse non disponible.',
          details: result.details || '',
          reasons: Array.isArray(result.reasons) ? result.reasons : [],
          emergency_steps: Array.isArray(result.emergency_steps) && result.emergency_steps.length > 0
            ? result.emergency_steps
            : null,
          alternatives: Array.isArray(result.alternatives) && result.alternatives.length > 0
            ? result.alternatives
            : null,
          recommendation: result.recommendation || '',
          disclaimer:
            'Ce résultat est généré par une IA à titre indicatif uniquement. Consultez votre vétérinaire en cas de doute ou d\'ingestion accidentelle.',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    // Auth/quota errors are Response objects — pass them through directly
    if (err instanceof Response) return err
    console.error('food-scan error:', err instanceof Error ? err.message : String(err))
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
