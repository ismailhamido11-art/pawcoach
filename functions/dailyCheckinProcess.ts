import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    const { dogId, mood, energy, appetite, notes, symptoms, behavior_notes } = await req.json();

    // Validate inputs
    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });
    if (!Number.isInteger(mood) || mood < 1 || mood > 4) return Response.json({ error: 'mood must be 1-4' }, { status: 400 });
    if (!Number.isInteger(energy) || energy < 1 || energy > 3) return Response.json({ error: 'energy must be 1-3' }, { status: 400 });
    if (!Number.isInteger(appetite) || appetite < 1 || appetite > 3) return Response.json({ error: 'appetite must be 1-3' }, { status: 400 });

    // Fetch dog
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    if (!dogs || !dogs.length) return Response.json({ error: 'Dog not found' }, { status: 400 });
    const dog = dogs[0];
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Calculate age segment
    let ageSegment = "adulte";
    const birthDate = dog.birth_date || dog.date_of_birth;
    if (birthDate) {
      const birth = new Date(birthDate);
      const now = new Date();
      const ageMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (ageMonths < 12) ageSegment = "chiot";
      else if (ageMonths >= 96) ageSegment = "senior"; // 8 years = 96 months
    }

    const segmentContext = ageSegment === "chiot"
      ? "C'est un chiot, insiste sur la socialisation, les dents de lait, la croissance, et les premiers vaccins."
      : ageSegment === "senior"
      ? "C'est un senior, sois attentif aux articulations, à la fatigue, au sommeil, et aux contrôles vétérinaires réguliers."
      : "C'est un adulte, concentre-toi sur l'équilibre exercice/alimentation et le maintien du poids.";

    // Today's date
    const today = new Date().toISOString().slice(0, 10);

    // Check if already checked in today
    const existing = await base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId, date: today });
    if (existing && existing.length > 0) return Response.json({ error: 'Already checked in today' }, { status: 409 });

    // Create DailyCheckin
    const checkinData = {
      dog_id: dogId,
      owner_email: user.email,
      date: today,
      mood,
      energy,
      appetite,
      notes: notes || null,
    };
    if (symptoms?.length) checkinData.symptoms = symptoms;
    if (behavior_notes) checkinData.behavior_notes = behavior_notes;
    const checkin = await base44.asServiceRole.entities.DailyCheckin.create(checkinData);

    // Fetch last 7 check-ins for trend analysis (excluding today)
    const allRecentCheckins = await base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId }).catch(() => []);
    const recentCheckins = (allRecentCheckins || [])
      .filter(c => c.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    let trendContext = "";
    if (recentCheckins.length >= 3) {
      const trends: string[] = [];

      // Mood trend (low = 1-2)
      const recentMoodLow = recentCheckins.slice(0, 3).filter(c => c.mood <= 2).length;
      if (recentMoodLow >= 3) trends.push(`humeur basse signalée ${recentMoodLow} jours de suite`);

      // Energy trend (low = 1)
      const recentEnergyLow = recentCheckins.slice(0, 3).filter(c => c.energy === 1).length;
      if (recentEnergyLow >= 3) trends.push(`fatigue signalée ${recentEnergyLow} jours de suite`);

      // Appetite trend (low = 1)
      const recentAppetiteLow = recentCheckins.slice(0, 3).filter(c => c.appetite === 1).length;
      if (recentAppetiteLow >= 3) trends.push(`appetit reduit ${recentAppetiteLow} jours de suite`);

      // Recurring symptoms
      const symptomCounts: Record<string, number> = {};
      recentCheckins.forEach(c => {
        if (c.symptoms?.length) c.symptoms.forEach((s: string) => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
      });
      Object.entries(symptomCounts).forEach(([s, n]) => {
        if (n >= 2) trends.push(`"${s}" signale ${n} fois sur les 7 derniers jours`);
      });

      if (trends.length > 0) {
        trendContext = `\n\nTENDANCES DETECTEES SUR LES 7 DERNIERS JOURS (utilise-les dans ta reponse si pertinent) : ${trends.join(". ")}.`;
      }
    }

    // Update Streak
    const streaks = await base44.asServiceRole.entities.Streak.filter({ dog_id: dogId });
    let streak;

    if (!streaks || streaks.length === 0) {
      streak = await base44.asServiceRole.entities.Streak.create({
        dog_id: dogId,
        owner_email: user.email,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        grace_days_used: 0,
        grace_days_remaining: 1,
      });
    } else {
      streak = streaks[0];
      const lastDate = streak.last_activity_date;

      if (lastDate !== today) {
        const todayMs = new Date(today).getTime();
        const lastMs = new Date(lastDate).getTime();
        const diffDays = Math.round((todayMs - lastMs) / (1000 * 60 * 60 * 24));

        let currentStreak = streak.current_streak || 0;
        let graceDaysUsed = streak.grace_days_used || 0;
        let graceDaysRemaining = streak.grace_days_remaining ?? 1;

        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays === 2 && graceDaysRemaining > 0) {
          currentStreak += 1;
          graceDaysRemaining -= 1;
          graceDaysUsed += 1;
        } else {
          currentStreak = 1;
          graceDaysUsed = 0;
          graceDaysRemaining = 1;
        }

        const longestStreak = Math.max(streak.longest_streak || 0, currentStreak);

        await base44.asServiceRole.entities.Streak.update(streak.id, {
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          grace_days_used: graceDaysUsed,
          grace_days_remaining: graceDaysRemaining,
        });

        streak = { ...streak, current_streak: currentStreak, longest_streak: longestStreak, last_activity_date: today, grace_days_used: graceDaysUsed, grace_days_remaining: graceDaysRemaining };
      }
    }

    // Generate AI response via OpenRouter
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    let aiResponse = "";

    if (apiKey) {
      // Build enriched dog profile for AI context
      const dogProfileParts = [`${dog.name || "chien"}${dog.breed ? ` (${dog.breed})` : ""}`];
      if (dog.weight) dogProfileParts.push(`${dog.weight}kg`);
      if (dog.owner_goal) dogProfileParts.push(`objectif: ${dog.owner_goal}`);
      if (dog.activity_level) dogProfileParts.push(`activite: ${dog.activity_level}`);
      if (dog.diet_type) dogProfileParts.push(`alimentation: ${dog.diet_type}`);
      if (dog.allergies) dogProfileParts.push(`allergies: ${dog.allergies}`);
      if (dog.health_issues) dogProfileParts.push(`problemes sante: ${dog.health_issues}`);
      if (dog.status && dog.status !== "healthy") dogProfileParts.push(`statut: ${dog.status}`);
      if (dog.personality_tags) {
        try {
          const tags = typeof dog.personality_tags === "string" ? JSON.parse(dog.personality_tags) : dog.personality_tags;
          if (Array.isArray(tags) && tags.length > 0) dogProfileParts.push(`personnalite: ${tags.join(", ")}`);
        } catch (_) { /* ignore parse errors */ }
      }
      const dogProfile = dogProfileParts.join(", ");

      const systemPrompt = `Tu es PawCoach, le compagnon quotidien de ${dogProfile}. Tu commentes le check-in du jour de maniere chaleureuse et personnalisee. Tutoiement, 2-3 phrases max, emojis doux. Adapte ton message selon l'humeur (${mood}/4), l'energie (${energy}/3) et l'appetit (${appetite}/3). Si energie haute, suggere un exercice de dressage. Si appetit faible 1 jour, rassure (c'est normal). Si appetit faible 2+ jours, suggere de surveiller. Si le streak depasse 3 jours, felicite fierement. Un appetit ou une energie basse UN SEUL JOUR n'est PAS un signal d'alarme — c'est normal, ne dramatise pas. ${segmentContext} Ne diagnostique jamais, ne prescris jamais.${trendContext}`;
      const safeSymptoms = Array.isArray(symptoms) ? symptoms.slice(0, 10).map(s => sanitize(s, 50)) : [];
      const safeBehaviorNotes = sanitize(behavior_notes, 500);
      const safeNotes = sanitize(notes, 500);
      const symptomText = safeSymptoms.length ? ` Symptomes signales: ${safeSymptoms.join(', ')}.` : '';
      const behaviorText = safeBehaviorNotes ? ` Observations: ${safeBehaviorNotes}.` : '';
      const userMessage = `Check-in de ${dog.name}: humeur ${mood}/4, energie ${energy}/3, appetit ${appetite}/3. Streak actuel: ${streak.current_streak} jours.${safeNotes ? ' Notes: ' + safeNotes : ''}${symptomText}${behaviorText}`;

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
          max_tokens: 200,
          temperature: 0.8,
        }),
      });

      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        aiResponse = llmData.choices?.[0]?.message?.content || "";
      } else {
        console.error("OpenRouter LLM call failed:", llmResponse.status, await llmResponse.text().catch(() => ""));
        aiResponse = "L'analyse IA est temporairement indisponible. Votre check-in a bien ete enregistre.";
      }
    }

    // Update checkin with AI response
    if (aiResponse) {
      await base44.asServiceRole.entities.DailyCheckin.update(checkin.id, { ai_response: aiResponse });
    }

    return Response.json({
      checkin: { ...checkin, ai_response: aiResponse },
      streak,
      aiResponse,
    });

  } catch (error) {
    console.error("dailyCheckinProcess error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});