import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { symptoms, duration, additional_info, image_url, preliminary_observations, followup_questions, user_answers, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies, personality_tags, dog_status } = await req.json();

    if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

    // Sanitize user inputs to prevent prompt injection and limit length
    const sanitize = (s, max = 2000) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    // Null safety: handle missing followup_questions
    const questions = Array.isArray(followup_questions) ? followup_questions : [];
    const answers = user_answers || {};

    // Build Q&A section
    const qaSection = questions.length > 0
      ? questions.map(q => {
          const answer = sanitize(answers[q.id], 500) || 'Non répondu';
          return `Q: ${sanitize(q.question, 500)}\nR: ${answer}`;
        }).join('\n\n')
      : 'Aucune question complémentaire.';

    const prompt = `Tu es un assistant IA qui aide les proprietaires de chiens a preparer leur visite veterinaire. Tu NE poses PAS de diagnostic — tu structures les observations pour que le veterinaire ait un dossier complet.

PHASE 2 - BILAN COMPLET: Tu as maintenant TOUTES les informations necessaires pour produire un bilan de preparation visite veterinaire complet et detaille.

INFORMATIONS SUR LE CHIEN:
- Nom: ${sanitize(dog_name, 100) || 'Non renseigné'}
- Race: ${sanitize(dog_breed, 100) || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${sanitize(dog_age, 100) || 'Non renseigné'}
- Problèmes de santé connus: ${sanitize(health_issues, 500) || 'Aucun'}
- Allergies connues: ${sanitize(allergies, 500) || 'Aucune'}
${(() => { try { const tags = JSON.parse(personality_tags || "[]"); return tags.length > 0 ? `- Personnalité : ${tags.join(", ")} (ex: un chien anxieux peut avoir des symptômes liés au stress)` : ""; } catch { return ""; } })()}
${dog_status && dog_status !== "healthy" ? `- Statut actuel : ${dog_status === "recovering" ? "En convalescence (adapter les recommandations en conséquence, pas d'exercice intense)" : dog_status === "traveling" ? "En voyage/déplacement (stress potentiel)" : dog_status}` : ""}

SYMPTÔMES INITIAUX:
${sanitize(symptoms)}

DURÉE: ${sanitize(duration, 500) || 'Non précisée'}

INFOS SUPPLÉMENTAIRES: ${sanitize(additional_info) || 'Aucune'}

${image_url ? "NOTE: Le propriétaire a fourni une photo des symptômes. Intègre tes observations visuelles dans le rapport." : ""}

PREMIÈRE ANALYSE:
${preliminary_observations || 'Non disponible'}

QUESTIONS DE SUIVI ET RÉPONSES DU PROPRIÉTAIRE:
${qaSection}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, de references a des sites internet, ni de citations de recherche dans ta reponse. Ecris comme un professionnel de sante animale qui prepare un dossier pour le veterinaire. Ne pose JAMAIS de diagnostic — tu structures les observations et suggeres des pistes a explorer avec le veto.

Genere un bilan COMPLET et DETAILLE au format JSON:
- observations: string (resume structure des observations du proprietaire, en termes que le veterinaire pourra exploiter immediatement)
- possible_causes: array de strings (3 a 5 pistes a explorer avec le veterinaire, formulees comme "a verifier avec votre veto")
- urgency_level: "low" | "medium" | "high" | "emergency"
- urgency_explanation: string (aide le proprietaire a decider quand consulter)
- immediate_advice: array de strings (3 a 5 mesures de confort en attendant la visite)
- important_note: string (rappel que ce bilan est un outil de preparation, pas un diagnostic — seul le veterinaire peut poser un diagnostic)`;

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
      important_note: result.important_note || "Ce bilan a ete genere par une IA pour faciliter votre visite veterinaire. Seul votre veterinaire peut poser un diagnostic."
    });

  } catch (error) {
    console.error("finalDiagnosis error:", error.message);
    return Response.json({
      error: "Une erreur est survenue lors du diagnostic. Réessaie dans quelques instants.",
      observations: "L'analyse n'a pas pu être complétée. Réessaie ou consulte directement un vétérinaire.",
      possible_causes: [],
      urgency_level: "medium",
      urgency_explanation: "Impossible de déterminer le niveau d'urgence suite à une erreur technique.",
      immediate_advice: ["Consulte un vétérinaire si les symptômes persistent ou s'aggravent."],
      important_note: "Ce rapport n'a pas pu être généré correctement. Consulte un vétérinaire."
    }, { status: 500 });
  }
});