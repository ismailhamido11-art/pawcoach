import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dogId, dogName: rawDogName, dogBreed: rawDogBreed, dogBirthDate, activityLevel, healthIssues, goals, weeklyWalkMinutes, walkDaysLast7, avgWalkMinutes, weeklyWalkDistanceKm, walkMoodSummary: rawWalkMood, mode, problemId, problemLabel, problemDescription, previousPrograms: rawPreviousPrograms, previousBilan: rawPreviousBilan } = await req.json();
    if (!dogId) return Response.json({ error: 'Missing dogId' }, { status: 400 });

    // Server-side quota check — prevents client-side bypass
    const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
    if (!isPremium) {
      const ACTION_DAILY_LIMIT = 3;
      const today = new Date().toISOString().split("T")[0];
      let remaining = user.actions_remaining ?? ACTION_DAILY_LIMIT;
      const lastReset = user.actions_daily_reset;

      // Daily reset: restore full quota if date has changed
      if (lastReset !== today) {
        remaining = ACTION_DAILY_LIMIT;
      }

      if (remaining <= 0) {
        return Response.json({ error: "daily_limit_reached", message: "Tu as atteint la limite du jour. Réessaie demain ou passe en Premium." }, { status: 429 });
      }

      // Decrement server-side
      await base44.asServiceRole.entities.User.update(user.id, {
        actions_remaining: remaining - 1,
        actions_daily_reset: today,
      });
    }

    // ═══════════════════════════════════════════════════════════
    // FETCH SERVER-SIDE — Dog + previous programs (Bookmark)
    // ═══════════════════════════════════════════════════════════
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];

    const previousBookmarks = await base44.asServiceRole.entities.Bookmark.filter({ dog_id: dogId }).catch(() => []);
    const pastProgramTitles = (Array.isArray(previousBookmarks) ? previousBookmarks : [])
      .filter((b: any) => b.source === "fitness_program" || b.source === "behavior_program")
      .sort((a: any, b: any) => new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime())
      .map((b: any) => { try { return JSON.parse(b.content)?.title; } catch { return null; } })
      .filter(Boolean)
      .slice(0, 15);

    // Sanitize helper — used throughout to prevent prompt injection
    const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    // Sanitize goals from frontend
    const safeGoals = goals ? sanitize(goals, 200) : null;

    // Sanitize user-controlled strings before prompt injection
    // Prefer server-side dog data, fallback to frontend for non-critical fields
    const dogName = String(dog?.name || rawDogName || "").substring(0, 50);
    const dogBreed = String(dog?.breed || rawDogBreed || "").substring(0, 50);
    const walkMoodSummary = rawWalkMood ? String(rawWalkMood).substring(0, 100) : null;
    const safeWalkDistanceKm = typeof weeklyWalkDistanceKm === 'number' && isFinite(weeklyWalkDistanceKm) ? weeklyWalkDistanceKm : null;
    const previousPrograms = Array.isArray(rawPreviousPrograms) ? rawPreviousPrograms.slice(0, 10).map((p: any) => String(p).substring(0, 100)) : [];
    const previousBilan = rawPreviousBilan ? {
      feeling: typeof rawPreviousBilan.feeling === 'number' ? rawPreviousBilan.feeling : 0,
      observed: rawPreviousBilan.observed,
      feedback: rawPreviousBilan.feedback ? String(rawPreviousBilan.feedback).substring(0, 200) : "",
      nextFocus: Array.isArray(rawPreviousBilan.nextFocus) ? rawPreviousBilan.nextFocus.slice(0, 5).map((f: any) => String(f).substring(0, 50)) : [],
    } : null;

    // Calculate age — prefer server-side birth_date
    let ageMonths = null;
    let ageLabel = "inconnu";
    const birthDateSource = dog?.birth_date || dogBirthDate;
    if (birthDateSource) {
      const birth = new Date(birthDateSource);
      const now = new Date();
      ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (ageMonths < 12) ageLabel = `${ageMonths} mois (chiot)`;
      else if (ageMonths < 24) ageLabel = `${Math.floor(ageMonths/12)} an(s) (adolescent)`;
      else if (ageMonths < 84) ageLabel = `${Math.floor(ageMonths/12)} ans (adulte)`;
      else ageLabel = `${Math.floor(ageMonths/12)} ans (senior)`;
    }

    const activityLabels = { faible: "faible", modere: "modéré", eleve: "élevé", tres_eleve: "très élevé" };

    // Server-side activity level (prefer DB over frontend)
    const safeActivityLevel = dog?.activity_level || activityLevel || "modere";
    const safeHealthIssues = dog?.health_issues || healthIssues || "aucun";

    // ═══════════════════════════════════════════════════════════
    // ENRICHISSEMENT SERVER-SIDE — données profondes du Dog
    // ═══════════════════════════════════════════════════════════
    let personalityLine = "";
    if (dog?.personality_tags) {
      try {
        const tags = JSON.parse(dog.personality_tags);
        if (Array.isArray(tags) && tags.length > 0) {
          personalityLine = `- Personnalité du chien : ${tags.join(", ")}`;
        }
      } catch { /* ignore parse error */ }
    }
    const behaviorLine = dog?.behavior_summary ? `- Profil comportemental : ${sanitize(dog.behavior_summary, 300)}` : "";
    const ownerGoalLine = dog?.owner_goal ? `- Objectif du propriétaire : ${sanitize(dog.owner_goal, 200)}` : "";
    const statusLine = dog?.status === "recovering" ? "- ATTENTION : chien en convalescence. Programme doux uniquement, intensité réduite." : "";
    const dietLine = dog?.diet_type ? `- Alimentation : ${String(dog.diet_type).substring(0, 50)}` : "";
    const sexLine = dog?.sex ? `- Sexe : ${dog.sex}${dog.neutered ? " (stérilisé)" : ""}` : "";
    const allergiesLine = dog?.allergies ? `- Allergies connues : ${sanitize(dog.allergies, 200)}` : "";
    const environmentLine = dog?.environment ? `- Environnement : ${String(dog.environment).substring(0, 100)}` : "";

    // Combine server-side enrichment block (only non-empty lines)
    const enrichmentBlock = [personalityLine, behaviorLine, ownerGoalLine, statusLine, dietLine, sexLine, allergiesLine, environmentLine]
      .filter(Boolean)
      .join("\n");

    // Combine past program titles (from Bookmarks DB + frontend fallback)
    const allPastTitles = [...new Set([...pastProgramTitles, ...previousPrograms.map((p: string) => p)])].slice(0, 20);

    // ═══════════════════════════════════════════════════════════
    // MODE BEHAVIOR — Programme anti-problème 7 jours
    // ═══════════════════════════════════════════════════════════
    if (mode === "behavior") {
      if (!problemId || !problemLabel) {
        return Response.json({ error: 'problemId and problemLabel required for behavior mode' }, { status: 400 });
      }

      const safeProblemLabel = String(problemLabel || "").substring(0, 100);
      const safeProblemDescription = String(problemDescription || "").substring(0, 200);
      const escapedProblemId = String(problemId || "").substring(0, 50).replace(/"/g, '\\"');
      const escapedDogName = String(dogName || "chien").replace(/"/g, '\\"');

      const behaviorPrompt = `Tu es un éducateur canin certifié et comportementaliste expert. Génère un programme personnalisé de 7 jours pour résoudre un problème de comportement.

CHIEN :
- Nom : ${dogName || "chien"}
- Race : ${dogBreed || "inconnue"}
- Âge : ${ageLabel}
- Niveau d'activité : ${activityLabels[safeActivityLevel] || safeActivityLevel || "modéré"}
- Problèmes de santé : ${safeHealthIssues}
${enrichmentBlock ? enrichmentBlock + "\n" : ""}
PROBLÈME À RÉSOUDRE : ${safeProblemLabel}
Description : ${safeProblemDescription}
${allPastTitles.length > 0 ? '\nPROGRAMMES DÉJÀ RÉALISÉS (varier les approches) :\n' + allPastTitles.map((t: string) => '- ' + t).join('\n') : ''}

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
  "problem_id": "${escapedProblemId}",
  "problem_label": "${safeProblemLabel}",
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
  "dog_name": "${escapedDogName}"
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
- Niveau d'activité : ${activityLabels[safeActivityLevel] || safeActivityLevel || "modéré"}
- Santé : ${safeHealthIssues}
- Objectifs : ${safeGoals || dog?.owner_goal || "bien-être général et lien avec son chien"}
${enrichmentBlock ? enrichmentBlock + "\n" : ""}
- Balades actuelles : ${weeklyWalkMinutes ? weeklyWalkMinutes + " min/semaine" : "non renseigné"}${walkDaysLast7 != null ? `, ${walkDaysLast7} jours de balade sur 7` : ""}${avgWalkMinutes ? `, moyenne ${avgWalkMinutes} min/sortie` : ""}${safeWalkDistanceKm ? `, ${safeWalkDistanceKm} km parcourus cette semaine` : ""}
${walkMoodSummary ? `- Ressenti post-balade : ${walkMoodSummary}` : ""}
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
${allPastTitles.length > 0 ? '\nPROGRAMMES DÉJÀ FAITS (varier les thèmes, NE PAS répéter ces programmes) :\n' + allPastTitles.map((t: string) => '- ' + t).join('\n') : ''}
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