import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { symptoms, duration, additional_info, image_url, dog_name, dog_breed, dog_weight, dog_age, health_issues, allergies } = await req.json();

  if (!symptoms) return Response.json({ error: 'Symptoms required' }, { status: 400 });

  const prompt = `Tu es un assistant vétérinaire IA spécialisé dans la santé canine.

PHASE 1: Tu reçois les premiers symptômes d'un chien. Tu dois:
1. Faire une première analyse rapide des symptômes
2. Générer une liste de questions CIBLÉES et PERTINENTES que le propriétaire devra renseigner pour affiner le diagnostic. Ces questions doivent être basées sur les symptômes décrits.

INFORMATIONS SUR LE CHIEN:
- Nom: ${dog_name || 'Non renseigné'}
- Race: ${dog_breed || 'Non renseignée'}
- Poids: ${dog_weight ? dog_weight + ' kg' : 'Non renseigné'}
- Âge approximatif: ${dog_age || 'Non renseigné'}
- Problèmes de santé connus: ${health_issues || 'Aucun'}
- Allergies connues: ${allergies || 'Aucune'}

SYMPTÔMES DÉCRITS:
${symptoms}

DURÉE: ${duration || 'Non précisée'}

INFOS SUPPLÉMENTAIRES: ${additional_info || 'Aucune'}

${image_url ? "NOTE: Le propriétaire a aussi envoyé une photo des symptômes. Analyse-la attentivement pour affiner tes questions." : ""}

RÈGLE ABSOLUE: Ne mentionne JAMAIS de sources, d'URLs, de liens web, de références à des sites internet, ni de citations de recherche dans ta réponse. Écris comme un vétérinaire professionnel.

Génère un JSON avec:
- preliminary_observations: string (première impression clinique courte, 2-3 phrases max)
- preliminary_urgency: "low" | "medium" | "high" | "emergency" (première estimation d'urgence)
- followup_questions: array d'objets avec { id: string (q1, q2...), question: string, type: "text" | "yes_no" | "choice", options?: array de strings (seulement si type=choice) }. Génère 4 à 6 questions pertinentes basées sur les symptômes. Par exemple si le chien se gratte l'oreille, demande s'il y a une odeur, un écoulement, etc.`;

  const fileUrls = image_url ? [image_url] : undefined;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
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

  return Response.json(result);
});