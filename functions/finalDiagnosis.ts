import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { symptoms, duration, additional_info, image_url, preliminary_observations, followup_questions, user_answers, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies } = await req.json();

  if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

  // Build Q&A section
  const qaSection = followup_questions.map(q => {
    const answer = user_answers[q.id] || 'Non répondu';
    return `Q: ${q.question}\nR: ${answer}`;
  }).join('\n\n');

  const prompt = `Tu es un assistant vétérinaire IA spécialisé dans la santé canine.

PHASE 2 - ANALYSE FINALE: Tu as maintenant TOUTES les informations nécessaires pour produire un rapport de pré-diagnostic complet et détaillé.

INFORMATIONS SUR LE CHIEN:
- Nom: ${dog_name || 'Non renseigné'}
- Race: ${dog_breed || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${dog_age || 'Non renseigné'}
- Problèmes de santé connus: ${health_issues || 'Aucun'}
- Allergies connues: ${allergies || 'Aucune'}

SYMPTÔMES INITIAUX:
${symptoms}

DURÉE: ${duration || 'Non précisée'}

INFOS SUPPLÉMENTAIRES: ${additional_info || 'Aucune'}

${image_url ? "NOTE: Le propriétaire a fourni une photo des symptômes. Intègre tes observations visuelles dans le rapport." : ""}

PREMIÈRE ANALYSE:
${preliminary_observations}

QUESTIONS DE SUIVI ET RÉPONSES DU PROPRIÉTAIRE:
${qaSection}

Génère un rapport COMPLET et DÉTAILLÉ au format JSON:
- observations: string (résumé clinique détaillé intégrant les symptômes initiaux ET les réponses aux questions de suivi, en termes vétérinaires)
- possible_causes: array de strings (3 à 5 pistes diagnostiques, de la plus probable à la moins, en intégrant les infos des réponses)
- urgency_level: "low" | "medium" | "high" | "emergency"
- urgency_explanation: string
- immediate_advice: array de strings (3 à 5 conseils immédiats précis et personnalisés)
- important_note: string (rappel que ceci n'est pas un diagnostic définitif)`;

  const fileUrls = image_url ? [image_url] : undefined;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    file_urls: fileUrls,
    response_json_schema: {
      type: "object",
      properties: {
        observations: { type: "string" },
        possible_causes: { type: "array", items: { type: "string" } },
        urgency_level: { type: "string", enum: ["low", "medium", "high", "emergency"] },
        urgency_explanation: { type: "string" },
        immediate_advice: { type: "array", items: { type: "string" } },
        important_note: { type: "string" }
      }
    }
  });

  return Response.json(result);
});