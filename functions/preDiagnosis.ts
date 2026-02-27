import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { symptoms, duration, additional_info, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies } = await req.json();

  if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

  const prompt = `Tu es un assistant vétérinaire IA spécialisé dans la santé canine. Tu dois analyser les symptômes décrits et produire un pré-diagnostic structuré et professionnel.

IMPORTANT: Tu n'es PAS un vétérinaire. Ton rôle est de préparer un rapport préliminaire qui aidera le vétérinaire lors de la consultation. Utilise un vocabulaire médical/vétérinaire approprié.

INFORMATIONS SUR LE CHIEN:
- Nom: ${dog_name || 'Non renseigné'}
- Race: ${dog_breed || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${dog_age || 'Non renseigné'}
- Problèmes de santé connus: ${health_issues || 'Aucun'}
- Allergies connues: ${allergies || 'Aucune'}

SYMPTÔMES DÉCRITS PAR LE PROPRIÉTAIRE:
${symptoms}

DURÉE DES SYMPTÔMES:
${duration || 'Non précisée'}

INFORMATIONS SUPPLÉMENTAIRES:
${additional_info || 'Aucune'}

Génère un rapport structuré au format JSON avec les champs suivants:
- observations: string (résumé clinique des symptômes rapportés, en termes vétérinaires)
- possible_causes: array de strings (3 à 5 pistes diagnostiques possibles, de la plus probable à la moins probable)
- urgency_level: "low" | "medium" | "high" | "emergency" (évaluation du niveau d'urgence)
- urgency_explanation: string (explication du niveau d'urgence)
- immediate_advice: array de strings (2 à 4 conseils immédiats pour le propriétaire en attendant la consultation)
- vet_questions: array de strings (3 à 5 questions que le vétérinaire pourrait poser, pour que le propriétaire se prépare)
- important_note: string (rappel que ceci n'est pas un diagnostic définitif)`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: {
      type: "object",
      properties: {
        observations: { type: "string" },
        possible_causes: { type: "array", items: { type: "string" } },
        urgency_level: { type: "string", enum: ["low", "medium", "high", "emergency"] },
        urgency_explanation: { type: "string" },
        immediate_advice: { type: "array", items: { type: "string" } },
        vet_questions: { type: "array", items: { type: "string" } },
        important_note: { type: "string" }
      }
    }
  });

  return Response.json(result);
});