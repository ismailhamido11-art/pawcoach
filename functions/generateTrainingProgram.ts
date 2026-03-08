import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, dogName, dogBreed, dogBirthDate, activityLevel, healthIssues, goals, weeklyWalkMinutes, walkDaysLast7, avgWalkMinutes, mode, problemId, problemLabel, problemDescription, previousPrograms, previousBilan } = await req.json();
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
    // MODE STANDARD — Programme d'activité 7 jours (riche)
    // ═══════════════════════════════════════════════════════════
    const breedName = dogBreed || "chien";
    const prompt = `Tu es un coach canin d'élite — éducateur certifié, comportementaliste et passionné de science animale. Tu crées un programme de 7 jours EXCEPTIONNEL qui transforme la relation maître-chien.

CHAQUE JOUR doit être un mini-cours qui :
1. Propose une activité CONCRÈTE avec des étapes précises (pas de vague)
2. Apprend un FAIT SCIENTIFIQUE surprenant au propriétaire (chiffres, études, spécifique à la race)
3. Donne un CONSEIL DE PRO non-évident et actionnable immédiatement
4. Enseigne à LIRE son chien (observation comportementale précise)
5. Propose un DÉFI BONUS amusant et mesurable

PROFIL DU CHIEN :
- Nom : ${dogName || "chien"}
- Race : ${breedName}
- Âge : ${ageLabel}
- Niveau d'activité : ${activityLabels[activityLevel] || activityLevel || "modéré"}
- Santé : ${healthIssues || "aucun problème"}
- Objectifs : ${goals || "bien-être général et lien avec son chien"}
- Balades actuelles : ${weeklyWalkMinutes ? weeklyWalkMinutes + " min/semaine" : "non renseigné"}${walkDaysLast7 != null ? `, ${walkDaysLast7} jours de balade sur 7` : ""}${avgWalkMinutes ? `, moyenne ${avgWalkMinutes} min/sortie` : ""}
${previousBilan ? `
BILAN DU DERNIER PROGRAMME :
${previousBilan.feeling > 0 ? `- Ressenti : ${previousBilan.feeling}/5${previousBilan.feeling <= 2 ? " (pas convaincu — adapter la difficulté, varier les approches)" : previousBilan.feeling >= 4 ? " (très positif — augmenter le challenge)" : ""}` : "- Ressenti : non renseigné"}
- Signes de progression observés : ${previousBilan.observed || 0}
${previousBilan.feedback ? `- Commentaire du propriétaire : "${previousBilan.feedback}"` : ""}
${previousBilan.nextFocus?.length > 0 ? `- Focus demandé : ${previousBilan.nextFocus.join(", ")}` : ""}
UTILISE CE BILAN pour adapter le nouveau programme (difficulté, thèmes, approche).` : ""}

RÈGLES DE QUALITÉ ABSOLUES :

ACTIVITÉS — Être ULTRA-CONCRET avec 3-4 étapes :
- INTERDIT : "Fais un jeu de puzzle" (le propriétaire ne sait pas comment)
- CORRECT : "Prends 3 gobelets opaques. Cache une friandise sous l'un d'eux. Mélange lentement. Récompense dès qu'il touche le bon."
- INTERDIT : "Balade tranquille" (zéro valeur)
- CORRECT : "Balade des 5 sens : laisse ${dogName || "ton chien"} choisir le chemin pendant 15 min. Observe ses 3 spots préférés."

FAITS SURPRENANTS — Des VRAIS chiffres spécifiques à la race :
- INTERDIT : "Les chiens ont un bon odorat" (banal)
- CORRECT : "Le nez d'un ${breedName} contient 300 millions de récepteurs olfactifs. 30 min de reniflage fatigue autant qu'1h de balade."

CONSEILS COACH — NON-ÉVIDENTS :
- INTERDIT : "Sois patient" (creux)
- CORRECT : "Après un exercice mental, laisse ${dogName || "ton chien"} dormir 20 min. C'est pendant le sommeil que le cerveau consolide les apprentissages."

OBSERVATIONS — Apprendre à LIRE son chien :
- INTERDIT : "Observe ton chien" (vague)
- CORRECT : "Si ${dogName || "ton chien"} se lèche les babines sans avoir mangé, c'est un signe d'inconfort. Réduis la difficulté."

PROGRESSION :
- Jour 1-2 : Découverte et observation (facile)
- Jour 3-4 : Stimulation et apprentissage (moyen)
- Jour 5-6 : Challenge et consolidation (avancé)
- Jour 7 : Bilan et célébration

VARIÉTÉ : alterner balade, jeu, exercice mental, repos actif, entraînement
MATÉRIEL : uniquement ce qu'on trouve à la maison (gobelets, serviettes, carton, friandises, corde)
ADAPTATION : tout est adapté à ${breedName} (instincts naturels de la race) et à l'âge (${ageLabel})
${walkDaysLast7 != null && walkDaysLast7 <= 2 ? `ALERTE BALADE : Ce chien ne sort que ${walkDaysLast7} jours sur 7. Inclure des motivations spécifiques pour augmenter les sorties. Proposer des activités d'intérieur en complément.` : ""}
${avgWalkMinutes && avgWalkMinutes < 15 ? `BALADES COURTES : Moyenne ${avgWalkMinutes} min/sortie. Adapter les activités "balade" à des formats courts (10-15 min) et proposer des missions pendant ces balades.` : ""}
${previousPrograms?.length > 0 ? '\nPROGRAMMES DÉJÀ FAITS (varier les thèmes, NE PAS répéter ces programmes) :\n' + previousPrograms.map((p: string) => '- ' + p).join('\n') : ''}
Langue : français, tutoiement, ton coach bienveillant.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          program_title: { type: "string" },
          duration_days: { type: "number" },
          difficulty: { type: "string" },
          summary: { type: "string" },
          program_goal: { type: "string" },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                title: { type: "string" },
                theme: { type: "string" },
                activity: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string" },
                    duration_min: { type: "number" },
                    description: { type: "string" },
                    steps: { type: "array", items: { type: "string" } }
                  }
                },
                fun_fact: { type: "string" },
                coach_tip: { type: "string" },
                observe: { type: "string" },
                bonus_challenge: { type: "string" },
                motivation: { type: "string" }
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