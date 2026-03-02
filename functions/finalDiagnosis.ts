import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { symptoms, duration, additional_info, image_url, preliminary_observations, followup_questions, user_answers, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies, personality_tags, dog_status } = await req.json();

    if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

    // Null safety: handle missing followup_questions
    const questions = Array.isArray(followup_questions) ? followup_questions : [];
    const answers = user_answers || {};

    // Build Q&A section
    const qaSection = questions.length > 0
      ? questions.map(q => {
          const answer = answers[q.id] || 'Non répondu';
          return `Q: ${q.question}\nR: ${answer}`;
        }).join('\n\n')
      : 'Aucune question complémentaire.';

    const prompt = `Tu es un assistant vétérinaire IA spécialisé dans la santé canine.

PHASE 2 - ANALYSE FINALE: Tu as maintenant TOUTES les informations nécessaires pour produire un rapport de pré-diagnostic complet et détaillé.

INFORMATIONS SUR LE CHIEN:
- Nom: ${dog_name || 'Non renseigné'}
- Race: ${dog_breed || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${dog_age || 'Non renseigné'}
- Problèmes de santé connus: ${health_issues || 'Aucun'}
- Allergies connues: ${allergies || 'Aucune'}
${(() => { try { const tags = JSON.parse(personality_tags || "[]"); return tags.length > 0 ? `- Personnalité : ${tags.join(", ")} (ex: un chien anxieux peut avoir des symptômes liés au stress)` : ""; } catch { return ""; } })()}
${dog_status && dog_status !== "healthy" ? `- Statut actuel : ${dog_status === "recovering" ? "En convalescence (adapter les recommandations en conséquence, pas d'exercice intense)" : dog_status === "traveling" ? "En voyage/déplacement (stress potentiel)" : dog_status}` : ""}

SYMPTÔMES INITIAUX:
${symptoms}

DURÉE: ${duration || 'Non précisée'}

INFOS SUPPLÉMENTAIRES: ${additional_info || 'Aucune'}

${image_url ? "NOTE: Le propriétaire a fourni une photo des symptômes. Intègre tes observations visuelles dans le rapport." : ""}

PREMIÈRE ANALYSE:
${preliminary_observations || 'Non disponible'}

QUESTIONS DE SUIVI ET RÉPONSES DU PROPRIÉTAIRE:
${qaSection}

RÈGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, de références à des sites internet, ni de citations de recherche dans ta réponse. Écris comme un vétérinaire professionnel qui partage ses connaissances directement, sans jamais citer de source.

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

    // Null safety on response fields
    return Response.json({
      observations: result.observations || "Analyse non disponible.",
      possible_causes: Array.isArray(result.possible_causes) ? result.possible_causes : [],
      urgency_level: result.urgency_level || "medium",
      urgency_explanation: result.urgency_explanation || "",
      immediate_advice: Array.isArray(result.immediate_advice) ? result.immediate_advice : [],
      important_note: result.important_note || "Ce pré-diagnostic a été généré par une IA et ne remplace pas l'avis d'un vétérinaire."
    });

  } catch (error) {
    console.error("finalDiagnosis error:", error.message);
    return Response.json({
      error: "Une erreur est survenue lors du diagnostic. Veuillez réessayer.",
      observations: "L'analyse n'a pas pu être complétée. Veuillez réessayer ou consulter directement un vétérinaire.",
      possible_causes: [],
      urgency_level: "medium",
      urgency_explanation: "Impossible de déterminer le niveau d'urgence suite à une erreur technique.",
      immediate_advice: ["Consultez un vétérinaire si les symptômes persistent ou s'aggravent."],
      important_note: "Ce rapport n'a pas pu être généré correctement. Consultez un vétérinaire."
    }, { status: 500 });
  }
});