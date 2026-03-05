import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, dogName, dogBreed, dogBirthDate, activityLevel, healthIssues, goals, weeklyWalkMinutes } = await req.json();
    if (!dogId) return Response.json({ error: 'Missing dogId' }, { status: 400 });

    // Calculate age
    let ageMonths = null;
    let ageLabel = "inconnu";
    if (dogBirthDate) {
      const birth = new Date(dogBirthDate);
      const now = new Date();
      ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (ageMonths < 12) ageLabel = `${ageMonths} mois (chiot)`;
      else if (ageMonths < 24) ageLabel = `${Math.floor(ageMonths/12)} an(s) (adolescent)`;
      else if (ageMonths < 84) ageLabel = `${Math.floor(ageMonths/12)} ans (adulte)`;
      else ageLabel = `${Math.floor(ageMonths/12)} ans (senior)`;
    }

    const activityLabels = { faible: "faible", modere: "modéré", eleve: "élevé", tres_eleve: "très élevé" };

    const prompt = `Tu es un coach canin expert certifié. Génère un programme d'entraînement personnalisé sur 4 semaines pour ce chien:

- Nom: ${dogName || "chien"}
- Race: ${dogBreed || "inconnue"}
- Âge: ${ageLabel}
- Niveau d'activité actuel: ${activityLabels[activityLevel] || activityLevel || "modéré"}
- Problèmes de santé: ${healthIssues || "aucun"}
- Objectifs: ${goals || "condition physique générale"}
- Temps de balade hebdomadaire actuel: ${weeklyWalkMinutes ? weeklyWalkMinutes + " min/semaine" : "inconnu"}

Génère un programme structuré, progressif et adapté. Inclus:
1. Des séances quotidiennes avec durée et type d'activité
2. Une progression semaine par semaine
3. Des exercices spécifiques à la race (instincts naturels)
4. Des conseils de récupération et repos
5. Des indicateurs de progression

Réponds en JSON avec ce format exact:
{
  "program_title": "<titre accrocheur>",
  "duration_weeks": 4,
  "difficulty": "<débutant|intermédiaire|avancé>",
  "summary": "<résumé en 2-3 phrases du programme>",
  "weekly_goal_minutes": <minutes d'activité totale recommandées par semaine>,
  "weeks": [
    {
      "week": 1,
      "theme": "<thème de la semaine>",
      "focus": "<objectif principal>",
      "daily_sessions": [
        {
          "day": "Lundi",
          "type": "<balade|jeu|exercice mental|repos|entraînement>",
          "duration_min": <minutes>,
          "activity": "<description courte>",
          "tips": "<conseil pratique>"
        }
      ]
    }
  ],
  "breed_specific_tips": ["<conseil 1>", "<conseil 2>", "<conseil 3>"],
  "warning_signs": ["<signe d'épuisement 1>", "<signe 2>"],
  "progression_indicators": ["<indicateur 1>", "<indicateur 2>", "<indicateur 3>"]
}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          program_title: { type: "string" },
          duration_weeks: { type: "number" },
          difficulty: { type: "string" },
          summary: { type: "string" },
          weekly_goal_minutes: { type: "number" },
          weeks: { type: "array" },
          breed_specific_tips: { type: "array" },
          warning_signs: { type: "array" },
          progression_indicators: { type: "array" }
        }
      }
    });

    return Response.json({ success: true, program: result });
  } catch (error) {
    console.error('generateTrainingProgram error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});