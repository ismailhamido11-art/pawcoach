import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, text_content, dog_name, dog_breed } = await req.json();

        if (!file_url && !text_content) {
            return Response.json({ error: 'file_url or text_content is required' }, { status: 400 });
        }

        // Server-side quota check — prevents client-side bypass
        const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
        if (!isPremium) {
          const ACTION_DAILY_LIMIT = 3;
          const todayDate = new Date().toISOString().split("T")[0];
          let remaining = user.actions_remaining ?? ACTION_DAILY_LIMIT;
          const lastReset = user.actions_daily_reset;

          // Daily reset: restore full quota if date has changed
          if (lastReset !== todayDate) {
            remaining = ACTION_DAILY_LIMIT;
          }

          if (remaining <= 0) {
            return Response.json({ error: "daily_limit_reached", message: "Tu as atteint la limite du jour. Réessaie demain ou passe en Premium." }, { status: 429 });
          }

          // Decrement server-side
          await base44.asServiceRole.entities.User.update(user.id, {
            actions_remaining: remaining - 1,
            actions_daily_reset: todayDate,
          });
        }

        const dogContext = [
            dog_name ? `nommé "${dog_name}"` : null,
            dog_breed ? `de race ${dog_breed}` : null
        ].filter(Boolean).join(", ");

        const today = new Date().toISOString().split('T')[0];

        const prompt = `Tu es un expert vétérinaire et médical. Analyse ce document de santé${dogContext ? ` pour un chien ${dogContext}` : ''}.

Extrais TOUTES les données de santé présentes. Sois exhaustif : si le document mentionne 5 vaccins, extrais-les tous. Si le document a un tableau de poids avec 10 lignes, extrais les 10.

Pour chaque enregistrement de santé, fournis:
- type: UNIQUEMENT l'une de ces valeurs: "vaccine" | "vet_visit" | "weight" | "medication" | "allergy" | "note"
- title: Nom court et clair (ex: "Vaccin Rage", "Visite de contrôle", "Poids mensuel")
- date: Date au format YYYY-MM-DD. Si pas de date spécifique, utilise ${today}
- next_date: Prochaine date de rappel/RDV si mentionnée (format YYYY-MM-DD), sinon null
- details: Tous les détails pertinents (dosage, observations du vétérinaire, marque du médicament, résultats, etc.)
- value: UNIQUEMENT pour les poids - valeur numérique en kg (nombre uniquement), sinon null

Pour le résumé (summary), décris brièvement ce que tu as trouvé et les points importants à retenir pour le propriétaire.
Pour document_type, indique le type de document (ex: "Carnet de vaccination", "Bilan sanguin", "Email vétérinaire", "Rapport de consultation").

${text_content ? `Texte à analyser:\n\n${text_content}` : ''}`;

        const params = {
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    records: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { type: "string" },
                                title: { type: "string" },
                                date: { type: "string" },
                                next_date: { type: "string" },
                                details: { type: "string" },
                                value: { type: "number" }
                            },
                            required: ["type", "title", "date"]
                        }
                    },
                    summary: { type: "string" },
                    document_type: { type: "string" }
                },
                required: ["records", "summary"]
            }
        };

        if (file_url) {
            params.file_urls = [file_url];
        }

        const result = await base44.integrations.Core.InvokeLLM(params);

        console.log(`Extracted ${result.records?.length || 0} health records from ${result.document_type || 'document'}`);

        return Response.json(result);
    } catch (error) {
        console.error('Error in parseHealthFile:', error);
        return Response.json({ error: error?.message || String(error) }, { status: 500 });
    }
});