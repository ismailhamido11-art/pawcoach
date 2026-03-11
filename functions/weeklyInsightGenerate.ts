import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate previous week range (Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // Previous Monday = today - (dayOfWeek + 6) % 7 - 7
    const prevMonday = new Date(today);
    prevMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) - 7);
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6);

    const weekStart = prevMonday.toISOString().slice(0, 10);
    const weekEnd = prevSunday.toISOString().slice(0, 10);

    // Fetch all dogs
    const dogs = await base44.asServiceRole.entities.Dog.list();
    if (!dogs || dogs.length === 0) {
      return Response.json({ ok: true, generated: 0 });
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    let generated = 0;

    // Fetch all users upfront for premium check
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap: Record<string, any> = {};
    for (const u of allUsers || []) userMap[u.email] = u;

    for (const dog of dogs) {
      // Premium gate: only generate insights for premium users
      const owner = userMap[dog.owner];
      if (!owner) continue; // Skip orphaned dogs (owner deleted)
      const ownerIsPremium = owner.is_premium || (owner.trial_expires_at && new Date(owner.trial_expires_at) > new Date());
      if (!ownerIsPremium) continue;

      // Dedup BEFORE LLM call: skip if insight already exists for this dog + week
      const existing = await base44.asServiceRole.entities.WeeklyInsight.filter({ dog_id: dog.id, week_start: weekStart });
      if (existing && existing.length > 0) continue;

      // Fetch data filtered per dog (avoids loading entire DB)
      const [checkins, dogProgress, dogScans, dogDailyLogs, dogHealthRecords] = await Promise.all([
        base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dog.id }).catch(() => []),
        base44.asServiceRole.entities.UserProgress.filter({ dog_id: dog.id }).catch(() => []),
        base44.asServiceRole.entities.FoodScan.filter({ dog_id: dog.id }).catch(() => []),
        base44.asServiceRole.entities.DailyLog.filter({ dog_id: dog.id }).catch(() => []),
        base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dog.id }).catch(() => []),
      ]);

      // Filter DailyCheckins for the week
      const weekCheckins = (checkins || []).filter(c =>
        c.date >= weekStart && c.date <= weekEnd
      );

      const checkinCount = weekCheckins.length;
      if (checkinCount === 0) continue; // No activity, skip

      // Calculate averages
      const avgMood = Math.round((weekCheckins.reduce((s, c) => s + (c.mood || 0), 0) / checkinCount) * 100) / 100;
      const avgEnergy = Math.round((weekCheckins.reduce((s, c) => s + (c.energy || 0), 0) / checkinCount) * 100) / 100;
      const avgAppetite = Math.round((weekCheckins.reduce((s, c) => s + (c.appetite || 0), 0) / checkinCount) * 100) / 100;

      // Count exercises completed this week
      const exercisesCompleted = (dogProgress || []).filter(p =>
        p.completed && p.completed_date >= weekStart && p.completed_date <= weekEnd
      ).length;

      // Count food scans this week
      const scansDone = (dogScans || []).filter(s => {
        if (!s.timestamp) return false;
        const scanDate = s.timestamp.slice(0, 10);
        return scanDate >= weekStart && scanDate <= weekEnd;
      }).length;

      // Walk data from DailyLog
      const weekLogs = (dogDailyLogs || []).filter(l =>
        l.date >= weekStart && l.date <= weekEnd
      );
      const walkDays = weekLogs.filter(l => l.walk_minutes > 0).length;
      const totalWalkMinutes = weekLogs.reduce((s, l) => s + (l.walk_minutes || 0), 0);
      const avgWalkMinutes = walkDays > 0 ? Math.round(totalWalkMinutes / walkDays) : 0;
      const totalWalkKm = weekLogs.reduce((s, l) => s + (l.walk_distance_km || 0), 0);
      // Walk mood distribution
      const moodCounts: Record<string, number> = {};
      weekLogs.forEach(l => { if (l.walk_mood) moodCounts[l.walk_mood] = (moodCounts[l.walk_mood] || 0) + 1; });
      const moodText = Object.keys(moodCounts).length > 0
        ? `, humeur post-balade: ${Object.entries(moodCounts).map(([m, n]) => `${m} (${n}x)`).join(", ")}`
        : "";
      // Walk behavior tags
      const tagCounts: Record<string, number> = {};
      weekLogs.forEach(l => {
        if (l.walk_tags) {
          try { const tags = JSON.parse(l.walk_tags); if (Array.isArray(tags)) tags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }); } catch {}
        }
      });
      const tagText = Object.keys(tagCounts).length > 0
        ? `, comportements en balade: ${Object.entries(tagCounts).map(([t, n]) => `${t} (${n}x)`).join(", ")}`
        : "";

      // Collect symptoms from this week's check-ins
      const weekSymptoms: Record<string, number> = {};
      weekCheckins.forEach(c => {
        if (c.symptoms?.length) c.symptoms.forEach((s: string) => { weekSymptoms[s] = (weekSymptoms[s] || 0) + 1; });
      });
      const symptomText = Object.keys(weekSymptoms).length > 0
        ? `, symptomes signales: ${Object.entries(weekSymptoms).map(([s, n]) => `${s} (${n}x)`).join(", ")}`
        : "";

      // Health events from HealthRecord for this week
      const todayStr = today.toISOString().slice(0, 10);
      const weekHealthRecords = (dogHealthRecords || []).filter(r => r.date >= weekStart && r.date <= weekEnd);
      const healthEvents: string[] = [];

      // Vet visits this week
      const vetVisits = weekHealthRecords.filter(r => r.type === "vet_visit");
      if (vetVisits.length > 0) {
        healthEvents.push(`${vetVisits.length} visite(s) vet cette semaine${vetVisits[0].title ? ` (${String(vetVisits[0].title).substring(0, 50)})` : ""}`);
      }

      // Overdue vaccines (next_date < today)
      const overdueVaccines = (dogHealthRecords || []).filter(r =>
        r.type === "vaccine" && r.next_date && r.next_date < todayStr
      );
      if (overdueVaccines.length > 0) {
        const names = overdueVaccines.slice(0, 3).map(r => String(r.title || "vaccin").substring(0, 30)).join(", ");
        healthEvents.push(`vaccin(s) en retard : ${names}`);
      }

      // Active medications (next_date >= today = still ongoing)
      const activeMeds = (dogHealthRecords || []).filter(r =>
        r.type === "medication" && r.next_date && r.next_date >= todayStr
      );
      if (activeMeds.length > 0) {
        const names = activeMeds.slice(0, 3).map(r => String(r.title || "medicament").substring(0, 30)).join(", ");
        healthEvents.push(`medicament(s) en cours : ${names}`);
      }

      const healthContext = healthEvents.length > 0
        ? `\n\nEVENEMENTS SANTE DE LA SEMAINE (a mentionner si pertinent) : ${healthEvents.join(". ")}.`
        : "";

      // Notes and behavior_notes from check-ins
      const weekNotes: string[] = [];
      weekCheckins.forEach(c => {
        if (c.notes && String(c.notes).trim()) weekNotes.push(String(c.notes).substring(0, 100));
        if (c.behavior_notes && String(c.behavior_notes).trim()) weekNotes.push(String(c.behavior_notes).substring(0, 100));
      });
      const notesContext = weekNotes.length > 0
        ? `\n\nNOTES DU PROPRIETAIRE CETTE SEMAINE : ${weekNotes.slice(0, 5).join(" | ")}.`
        : "";

      // Generate AI summary
      let summary = "";
      let highlights = "";
      let recommendations = "";
      let behaviorSummary = "";

      if (apiKey) {
        // Personalization context
        const toneInstructions = {
          encouraging: "Ton chaleureux et encourageant, félicite les efforts, mets en valeur les progrès.",
          direct: "Ton direct et factuel, va à l'essentiel sans fioritures.",
          pedagogical: "Ton pédagogue, explique le raisonnement derrière chaque observation et conseil.",
        };
        const toneInstruction = owner.coach_tone ? (toneInstructions[owner.coach_tone] || "") : "Sois chaleureux et bienveillant.";

        let personalityNote = "";
        try {
          const tags = JSON.parse(dog.personality_tags || "[]");
          if (Array.isArray(tags) && tags.length > 0) personalityNote = ` Ce chien est décrit comme : ${tags.join(", ")}.`;
        } catch {}

        const statusNote = dog.status === "recovering" ? " Il est en convalescence." : dog.status === "traveling" ? " Il était en voyage cette semaine." : "";

        // Sanitize user-controlled strings before prompt injection
        const safeName = String(dog.name || "").substring(0, 50);
        const safeBreed = String(dog.breed || "").substring(0, 50);

        const prevBehavior = dog.behavior_summary ? `\nProfil comportemental precedent: "${String(dog.behavior_summary).substring(0, 300)}"` : "";

        // ── Enriched dog profile (aligned with pawcoachChat) ──
        const getAge = (birthDate: string) => {
          if (!birthDate) return null;
          const months = Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
          if (months < 1) return "moins d'un mois";
          if (months < 12) return `${months} mois`;
          const years = Math.floor(months / 12);
          const rem = months % 12;
          return rem > 0 ? `${years} an${years > 1 ? 's' : ''} et ${rem} mois` : `${years} an${years > 1 ? 's' : ''}`;
        };
        const ageStr = getAge(dog.birth_date);

        const dogProfile = [
          `- Nom : ${safeName}`,
          `- Race : ${safeBreed || "Non renseignee"}`,
          ageStr ? `- Age : ${ageStr}` : null,
          dog.weight ? `- Poids : ${dog.weight} kg` : null,
          dog.sex ? `- Sexe : ${dog.sex === "male" ? "Male" : "Femelle"}` : null,
          dog.neutered !== undefined ? `- Sterilise : ${dog.neutered ? "Oui" : "Non"}` : null,
          dog.activity_level ? `- Niveau d'activite : ${dog.activity_level}` : null,
          dog.environment ? `- Environnement : ${dog.environment}` : null,
          dog.allergies ? `- Allergies : ${String(dog.allergies).substring(0, 100)}` : null,
          dog.health_issues ? `- Problemes de sante : ${String(dog.health_issues).substring(0, 100)}` : null,
          dog.vet_name ? `- Veterinaire : ${String(dog.vet_name).substring(0, 50)}${dog.vet_city ? ` (${String(dog.vet_city).substring(0, 50)})` : ""}` : null,
          dog.diet_type ? `- Alimentation : ${String(dog.diet_type).substring(0, 50)}${dog.diet_brand ? ` (${String(dog.diet_brand).substring(0, 50)})` : ""}` : null,
          dog.diet_restrictions ? `- Restrictions alimentaires : ${String(dog.diet_restrictions).substring(0, 100)}` : null,
          personalityNote ? `- Personnalite :${personalityNote}` : null,
          statusNote ? `- Statut :${statusNote}` : null,
        ].filter(Boolean).join("\n");

        const ownerGoalLine = dog.owner_goal ? `\nOBJECTIF DU PROPRIETAIRE : ${String(dog.owner_goal).substring(0, 200)}. Oriente le bilan et les recommandations en fonction de cet objectif.` : "";

        // Coach topics from owner preferences
        const topicLabels: Record<string, string> = { health: "sante", nutrition: "nutrition", training: "dressage", behavior: "comportement" };
        let topicsLine = "";
        try {
          const topics = JSON.parse(owner.coach_topics || "[]");
          if (Array.isArray(topics) && topics.length > 0) {
            topicsLine = `\nSujets prioritaires du proprietaire : ${topics.map((t: string) => topicLabels[t] || t).join(", ")}.`;
          }
        } catch {}

        const systemPrompt = `Tu es PawCoach. Genere un bilan hebdomadaire personnalise.\n\nPROFIL DU CHIEN :\n${dogProfile}${prevBehavior}${ownerGoalLine}${topicsLine}\n\nINTERPRETATION DES DONNEES :\n- 0 check-ins = le proprio n'a pas rempli, PAS que le chien va mal.\n- "aucune balade" = pas de GPS utilise, PAS que le chien ne sort pas.\n- 0 scans = fonctionnalite pas utilisee, PAS mauvaise alimentation.\n- Ne signale une tendance que sur 3+ points de donnees.\n- Adapte tes recommandations a l'objectif du proprietaire si present.\n\n${toneInstruction} Tutoie. 3-5 phrases max. Reponds en JSON avec: summary (bilan general), highlights (2-3 points cles), recommendations (2-3 conseils pour la semaine prochaine), behavior_summary (profil comportemental synthetique de ${safeName} en 2-3 phrases — patterns d'humeur, energie, alertes, evolution par rapport au profil precedent si disponible).${healthContext}${notesContext}`;
        const walkText = walkDays > 0 ? `, ${walkDays} jours de balade (${totalWalkMinutes} min total, moyenne ${avgWalkMinutes} min/sortie${totalWalkKm > 0 ? `, ${totalWalkKm.toFixed(1)} km parcourus` : ""}${moodText}${tagText})` : ", aucune balade enregistrée cette semaine";
        const userMessage = `Bilan de la semaine du ${weekStart} au ${weekEnd} pour ${safeName}: ${checkinCount} check-ins, humeur moyenne ${avgMood}/4, energie moyenne ${avgEnergy}/3, appetit moyen ${avgAppetite}/3, ${exercisesCompleted} exercices completes, ${scansDone} scans alimentaires${walkText}${symptomText}.`;

        try {
          const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://pawcoach.app",
              "X-Title": "PawCoach",
            },
            body: JSON.stringify({
              model: "deepseek/deepseek-chat",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
              max_tokens: 300,
              temperature: 0.7,
            }),
          });

          if (llmResponse.ok) {
            const llmData = await llmResponse.json();
            const content = llmData.choices?.[0]?.message?.content || "";
            // Try to parse JSON from the response
            try {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                summary = parsed.summary || "";
                highlights = parsed.highlights || "";
                recommendations = parsed.recommendations || "";
                behaviorSummary = parsed.behavior_summary || "";
              }
            } catch (parseErr) {
              console.warn(`weeklyInsightGenerate: JSON parse failed for dog ${dog.id}, using raw content:`, parseErr?.message || String(parseErr));
              summary = content;
            }
          }
        } catch (e) {
          console.warn(`AI generation failed for dog ${dog.id}:`, e?.message || String(e));
        }
      }

      // Stringify arrays if needed
      if (typeof highlights === "object") highlights = JSON.stringify(highlights);
      if (typeof recommendations === "object") recommendations = JSON.stringify(recommendations);

      // Create WeeklyInsight
      await base44.asServiceRole.entities.WeeklyInsight.create({
        dog_id: dog.id,
        owner_email: dog.owner || "",
        week_start: weekStart,
        checkin_count: checkinCount,
        avg_mood: avgMood,
        avg_energy: avgEnergy,
        avg_appetite: avgAppetite,
        exercises_completed: exercisesCompleted,
        scans_done: scansDone,
        summary,
        highlights,
        recommendations,
        is_read: false,
      });

      // Update Dog.behavior_summary (Memory Coach F07)
      if (behaviorSummary) {
        try {
          await base44.asServiceRole.entities.Dog.update(dog.id, { behavior_summary: behaviorSummary });
        } catch (e) {
          console.warn(`behavior_summary update failed for dog ${dog.id}:`, e?.message || String(e));
        }
      }

      generated++;
    }

    return Response.json({ ok: true, generated });

  } catch (error) {
    console.error("weeklyInsightGenerate error:", error?.message || String(error));
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});