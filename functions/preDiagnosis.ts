import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { symptoms, duration, additional_info, image_url, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies, personality_tags, dog_status } = await req.json();

    if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

    // Sanitize user inputs to prevent prompt injection and limit length
    const sanitize = (s, max = 2000) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    const prompt = `Tu es un assistant IA qui aide les proprietaires de chiens a preparer leur visite veterinaire. Tu NE poses PAS de diagnostic — tu structures les observations du proprietaire pour que le veterinaire ait toutes les informations utiles des le debut de la consultation.

PHASE 1: Tu recois les premieres observations du proprietaire. Tu dois:
1. Resumer les observations de maniere structuree (comme un aide-memoire pour le veto)
2. Generer une liste de questions CIBLEES et PERTINENTES pour completer le tableau clinique. Le veterinaire appreciera d'avoir ces details.

INFORMATIONS SUR LE CHIEN:
- Nom: ${sanitize(dog_name, 100) || 'Non renseigné'}
- Race: ${sanitize(dog_breed, 100) || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${sanitize(dog_age, 100) || 'Non renseigné'}
- Problèmes de santé connus: ${sanitize(health_issues, 500) || 'Aucun'}
- Allergies connues: ${sanitize(allergies, 500) || 'Aucune'}
${(() => { try { const tags = JSON.parse(personality_tags || "[]"); return tags.length > 0 ? `- Personnalité : ${tags.join(", ")}` : ""; } catch { return ""; } })()}
${dog_status && dog_status !== "healthy" ? `- Statut actuel : ${dog_status === "recovering" ? "En convalescence (tenir compte pour les recommandations)" : dog_status === "traveling" ? "En voyage/déplacement" : dog_status}` : ""}

SYMPTÔMES DÉCRITS:
${sanitize(symptoms)}

DURÉE: ${sanitize(duration, 500) || 'Non précisée'}

INFOS SUPPLÉMENTAIRES: ${sanitize(additional_info) || 'Aucune'}

${image_url ? "NOTE: Le propriétaire a aussi envoyé une photo des symptômes. Analyse-la attentivement pour affiner tes questions." : ""}

REGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, de references a des sites internet, ni de citations de recherche dans ta reponse. Ecris comme un professionnel de sante animale qui prepare un dossier pour le veterinaire. Ne pose JAMAIS de diagnostic — tu structures les observations.

Genere un JSON avec:
- preliminary_observations: string (resume structure des observations du proprietaire, 2-3 phrases max — utile pour le veterinaire)
- preliminary_urgency: "low" | "medium" | "high" | "emergency" (estimation pour aider le proprietaire a decider quand consulter)
- followup_questions: array d'objets avec { id: string (q1, q2...), question: string, type: "text" | "yes_no" | "choice", options?: array de strings (seulement si type=choice) }. Genere 4 a 6 questions que le veterinaire poserait typiquement. Par exemple si le chien se gratte l'oreille, demande s'il y a une odeur, un ecoulement, etc.`;

    const fileUrls = image_url ? [image_url] : undefined;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls,
      response_json_schema: {
        type: "object",
        properties: {
          preliminary_observations: { type: "string" },
          preliminary_urgency: { type: "string", enum: ["low", "medium", "high", "emergency"] },
          followup_questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                question: { type: "string" },
                type: { type: "string", enum: ["text", "yes_no", "choice"] },
                options: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Null safety: ensure followup_questions is always an array
    if (!result.followup_questions) {
      result.followup_questions = [];
    }

    return Response.json(result);

  } catch (error) {
    console.error("preDiagnosis error:", error.message);
    return Response.json({
      error: "Une erreur est survenue lors de l'analyse. Réessaie dans quelques instants.",
      preliminary_observations: "L'analyse n'a pas pu être effectuée. Réessaie ou consulte directement un vétérinaire.",
      preliminary_urgency: "medium",
      followup_questions: []
    }, { status: 500 });
  }
});