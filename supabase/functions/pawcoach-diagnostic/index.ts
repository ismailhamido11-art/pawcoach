import { corsHeaders } from '../_shared/cors.ts'
import { requireAuth, requireDogOwnership } from '../_shared/auth.ts'
import { consumeActionCredit } from '../_shared/quota.ts'
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

    const { dogId, symptoms, symptomCategory, severity, startDate, additionalInfo } = await req.json()

    if (!dogId || !symptoms) {
      return new Response(
        JSON.stringify({ error: 'dogId and symptoms are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (typeof symptoms === 'string' && symptoms.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Symptoms too long. Maximum 2000 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Verify dog ownership via RLS
    await requireDogOwnership(authHeader, dogId)

    // Consume 1 action credit — throws 429 if quota exceeded
    await consumeActionCredit(authHeader)

    const serviceClient = createServiceClient()

    // Fetch dog info for prompt context
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

    // Compute age text
    let ageText = ''
    if (dog.birth_date) {
      const ageMs = Date.now() - new Date(dog.birth_date).getTime()
      const ageMonths = Math.floor(ageMs / (1000 * 60 * 60 * 24 * 30.44))
      ageText = ageMonths >= 12 ? `${Math.floor(ageMonths / 12)} ans` : `${ageMonths} mois`
    }

    const safeSymptoms = sanitize(symptoms, 2000)
    const safeAdditionalInfo = additionalInfo ? sanitize(additionalInfo, 1000) : null
    const safeCategory = symptomCategory ? sanitize(symptomCategory, 200) : null
    const safeSeverity = severity ? sanitize(severity, 100) : null
    const safeDuration = startDate ? `depuis le ${sanitize(startDate, 50)}` : null

    const prompt = `Tu es un assistant IA qui aide les proprietaires de chiens a preparer leur visite veterinaire. Tu NE poses PAS de diagnostic — tu structures les observations pour que le veterinaire ait un dossier complet.

INFORMATIONS SUR LE CHIEN:
- Nom: ${sanitize(dog.name, 100)}
- Race: ${sanitize(dog.breed, 100) || 'Non renseignée'}
- Poids: ${dog.weight ? dog.weight + ' kg' : 'Non renseigné'}
- Âge: ${ageText || 'Non renseigné'}
- Problèmes de santé connus: ${sanitize(dog.health_issues, 500) || 'Aucun'}
- Allergies: ${sanitize(dog.allergies, 500) || 'Aucune'}
- Niveau d'activité: ${sanitize(dog.activity_level, 100) || 'Non renseigné'}

SYMPTÔMES SIGNALÉS:
${safeSymptoms}
${safeCategory ? `\nCATÉGORIE: ${safeCategory}` : ''}${safeSeverity ? `\nSÉVÉRITÉ: ${safeSeverity}` : ''}${safeDuration ? `\nDURÉE: ${safeDuration}` : ''}${safeAdditionalInfo ? `\nINFORMATIONS SUPPLÉMENTAIRES: ${safeAdditionalInfo}` : ''}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, ni de references a des sites internet. Ecris comme un professionnel de sante animale qui prepare un dossier pour le veterinaire. Ne pose JAMAIS de diagnostic — tu structures les observations et suggeres des pistes a explorer avec le veterinaire.

Genere un bilan au format JSON strict avec ces champs exactement:
- observations: string (resume structure des observations, en termes que le veterinaire exploitera immediatement)
- possible_causes: array de 3 a 5 strings (pistes a verifier avec le veterinaire)
- urgency_level: exactement "low", "medium", "high", ou "emergency"
- urgency_explanation: string (aide le proprietaire a decider quand consulter)
- immediate_advice: array de 3 a 5 strings (mesures de confort en attendant la visite)
- important_note: string (rappel que ce bilan est un outil de preparation, pas un diagnostic)`

    const raw = await invokeLLM({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    let result: any = {}
    try {
      result = JSON.parse(raw)
    } catch {
      // keep empty object fallback
    }

    const urgencyLevel = ['low', 'medium', 'high', 'emergency'].includes(result.urgency_level)
      ? result.urgency_level
      : 'medium'

    const diagnosisText = {
      observations: result.observations || 'Analyse non disponible.',
      possible_causes: Array.isArray(result.possible_causes) ? result.possible_causes : [],
      urgency_level: urgencyLevel,
      urgency_explanation: result.urgency_explanation || '',
      immediate_advice: Array.isArray(result.immediate_advice) ? result.immediate_advice : [],
      important_note: result.important_note ||
        'Ce bilan a été généré par une IA pour faciliter votre visite vétérinaire. Seul votre vétérinaire peut poser un diagnostic.',
    }

    // Insert report into DB
    const { data: report, error: insertError } = await serviceClient
      .from('diagnosis_reports')
      .insert({
        dog_id: dogId,
        owner_id: user.id,
        dog_name: dog.name,
        dog_breed: dog.breed,
        dog_weight: dog.weight,
        symptoms: safeSymptoms,
        duration: safeDuration,
        additional_info: safeAdditionalInfo,
        diagnosis_text: diagnosisText,
        urgency_level: urgencyLevel,
        report_date: new Date().toISOString().split('T')[0],
      })
      .select('id, report_date')
      .single()

    if (insertError) {
      console.error('Insert diagnosis_reports error:', insertError.message)
    }

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          id: report?.id ?? null,
          urgency_level: urgencyLevel,
          causes: (Array.isArray(result.possible_causes) ? result.possible_causes : []).map((c: string, i: number) => ({
            name: c,
            probability: Math.round(Math.max(10, 95 - (i * 15))),
          })),
          recommendations: Array.isArray(result.immediate_advice) ? result.immediate_advice : [],
          disclaimer: result.important_note ||
            'Ce bilan a ete genere par une IA pour faciliter votre visite veterinaire. Seul votre veterinaire peut poser un diagnostic.',
          report_date: report?.report_date ?? new Date().toISOString().split('T')[0],
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    // Auth/quota errors are Response objects — pass them through directly
    if (err instanceof Response) return err
    console.error('pawcoach-diagnostic error:', err instanceof Error ? err.message : String(err))
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
