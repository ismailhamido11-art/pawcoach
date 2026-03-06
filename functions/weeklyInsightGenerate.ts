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

    // Fetch all data upfront to avoid N+1 queries
    const [allCheckins, allProgress, allScans] = await Promise.all([
      base44.asServiceRole.entities.DailyCheckin.list(),
      base44.asServiceRole.entities.UserProgress.list(),
      base44.asServiceRole.entities.FoodScan.list(),
    ]);

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    let generated = 0;

    // Fetch all users upfront for premium check
    const allUsers = await base44.asServiceRole.entities.User.list();
    const userMap = {};
    for (const u of allUsers || []) userMap[u.email] = u;

    for (const dog of dogs) {
      // Premium gate: only generate insights for premium users
      const owner = userMap[dog.owner];
      if (!owner) continue; // Skip orphaned dogs (owner deleted)
      const ownerIsPremium = owner.is_premium || (owner.trial_expires_at && new Date(owner.trial_expires_at) > new Date());
      if (!ownerIsPremium) continue;

      // Filter DailyCheckins for this dog within the week
      const checkins = (allCheckins || []).filter(c =>
        c.dog_id === dog.id && c.date >= weekStart && c.date <= weekEnd
      );

      const checkinCount = checkins.length;
      if (checkinCount === 0) continue; // No activity, skip

      // Calculate averages
      const avgMood = Math.round((checkins.reduce((s, c) => s + (c.mood || 0), 0) / checkinCount) * 100) / 100;
      const avgEnergy = Math.round((checkins.reduce((s, c) => s + (c.energy || 0), 0) / checkinCount) * 100) / 100;
      const avgAppetite = Math.round((checkins.reduce((s, c) => s + (c.appetite || 0), 0) / checkinCount) * 100) / 100;

      // Count exercises completed this week
      const exercisesCompleted = (allProgress || []).filter(p =>
        p.dog_id === dog.id && p.completed && p.completed_date >= weekStart && p.completed_date <= weekEnd
      ).length;

      // Count food scans this week
      const scansDone = (allScans || []).filter(s => {
        if (s.dog_id !== dog.id || !s.timestamp) return false;
        const scanDate = s.timestamp.slice(0, 10);
        return scanDate >= weekStart && scanDate <= weekEnd;
      }).length;

      // Generate AI summary
      let summary = "";
      let highlights = "";
      let recommendations = "";

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

        const systemPrompt = `Tu es PawCoach. Génère un bilan hebdomadaire pour ${dog.name} (${dog.breed}).${personalityNote}${statusNote} ${toneInstruction} Tutoie. 3-5 phrases max. Réponds en JSON avec: summary (bilan général), highlights (2-3 points clés), recommendations (2-3 conseils pour la semaine prochaine).`;
        const userMessage = `Bilan de la semaine du ${weekStart} au ${weekEnd} pour ${dog.name}: ${checkinCount} check-ins, humeur moyenne ${avgMood}/4, energie moyenne ${avgEnergy}/3, appetit moyen ${avgAppetite}/3, ${exercisesCompleted} exercices completes, ${scansDone} scans alimentaires.`;

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
              }
            } catch {
              summary = content;
            }
          }
        } catch (e) {
          console.warn(`AI generation failed for dog ${dog.id}:`, e.message);
        }
      }

      // Stringify arrays if needed
      if (typeof highlights === "object") highlights = JSON.stringify(highlights);
      if (typeof recommendations === "object") recommendations = JSON.stringify(recommendations);

      // Dedup: skip if insight already exists for this dog + week
      const existing = await base44.asServiceRole.entities.WeeklyInsight.filter({ dog_id: dog.id, week_start: weekStart });
      if (existing && existing.length > 0) continue;

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

      generated++;
    }

    return Response.json({ ok: true, generated });

  } catch (error) {
    console.error("weeklyInsightGenerate error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});