import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, dogName, dogBreed, dogBirthDate, activityLevel, healthIssues, goals, weeklyWalkMinutes, mode, problemId, problemLabel, problemDescription } = await req.json();
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

    // ═══════════════════════════════════════════════════════════
    // MODE BEHAVIOR — Programme anti-problème 7 jours
    // ═══════════════════════════════════════════════════════════
    if (mode === "behavior") {
      if (!problemId || !problemLabel) {
        return Response.json({ error: 'problemId and problemLabel required for behavior mode' }, { status: 400 });
      }

      const behaviorPrompt = `Tu es un éducateur canin certifié et comportementaliste expert. Génère un programme personnalisé de 7 jours pour résoudre un problème de comportement.

CHIEN :
- Nom : ${dogName || "chien"}
- Race : ${dogBreed || "inconnue"}
- Âge : ${ageLabel}
- Niveau d'activité : ${activityLabels[activityLevel] || activityLevel || "modéré"}
- Problèmes de santé : ${healthIssues || "aucun"}

PROBLÈME À RÉSOUDRE : ${problemLabel}
Description : ${problemDescription || ""}

RÈGLES ABSOLUES :
- Uniquement du renforcement positif — JAMAIS de punition, collier étrangleur ou méthode coercitive
- Progression TRÈS graduelle — si le chien régresse, on recule d'un jour
- Adapter les exercices à la race (${dogBreed || "race inconnue"}) et à l'âge (${ageLabel})
- Chaque jour : 1-2 exercices pratiques (15-30 min max) + conseil d'environnement
- Les exercices doivent être concrets et actionnables par un propriétaire non-expert
- Jour 1 = observation/évaluation, Jour 7 = consolidation
- Langue : français naturel, tutoiement

Réponds en JSON avec ce format exact :
{
  "program_title": "<titre motivant avec le nom du chien>",
  "problem_id": "${problemId}",
  "problem_label": "${problemLabel}",
  "duration_days": 7,
  "summary": "<résumé motivant en 2-3 phrases>",
  "days": [
    {
      "day": 1,
      "day_name": "Jour 1",
      "theme": "<thème du jour>",
      "exercises": [
        {
          "name": "<nom clair de l'exercice>",
          "duration_min": <minutes>,
          "description": "<instructions concrètes et actionnables>",
          "tips": "<conseil pratique spécifique à la race ou au contexte>"
        }
      ],
      "environment_tips": "<comment aménager l'environnement pour ce jour>",
      "do": ["<bonne pratique 1>", "<bonne pratique 2>"],
      "dont": ["<erreur courante à éviter 1>", "<erreur courante à éviter 2>"]
    }
  ],
  "emergency_protocol": "<quoi faire si la situation dégénère pendant le programme>",
  "when_to_see_pro": "<signes clairs qu'il faut consulter un comportementaliste>",
  "progress_indicators": ["<signe d'amélioration observable 1>", "<signe 2>", "<signe 3>"],
  "dog_name": "${dogName || "chien"}"
}`;

      const behaviorResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: behaviorPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            program_title: { type: "string" },
            problem_id: { type: "string" },
            problem_label: { type: "string" },
            duration_days: { type: "number" },
            summary: { type: "string" },
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  day_name: { type: "string" },
                  theme: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        duration_min: { type: "number" },
                        description: { type: "string" },
                        tips: { type: "string" }
                      }
                    }
                  },
                  environment_tips: { type: "string" },
                  do: { type: "array", items: { type: "string" } },
                  dont: { type: "array", items: { type: "string" } }
                }
              }
            },
            emergency_protocol: { type: "string" },
            when_to_see_pro: { type: "string" },
            progress_indicators: { type: "array", items: { type: "string" } },
            dog_name: { type: "string" }
          }
        }
      });

      return Response.json({ success: true, program: behaviorResult });
    }

    // ═══════════════════════════════════════════════════════════
    // MODE STANDARD — Programme d'entraînement 4 semaines
    // ═══════════════════════════════════════════════════════════
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
          weeks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                week: { type: "number" },
                theme: { type: "string" },
                focus: { type: "string" },
                daily_sessions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      type: { type: "string" },
                      duration_min: { type: "number" },
                      activity: { type: "string" },
                      tips: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          breed_specific_tips: { type: "array", items: { type: "string" } },
          warning_signs: { type: "array", items: { type: "string" } },
          progression_indicators: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({ success: true, program: result });
  } catch (error) {
    console.error('generateTrainingProgram error:', error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});