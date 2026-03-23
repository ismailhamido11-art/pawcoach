import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages: rawMessages, dogId, imageUrl, mode = "chat" } = await req.json();

    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });

    // Sanitize helper — used throughout to prevent prompt injection
    const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');

    // Validate imageUrl to prevent SSRF
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        const allowedHosts = ['base44.app', 'amazonaws.com', 's3.amazonaws.com'];
        if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
          return Response.json({ error: 'Invalid image URL' }, { status: 400 });
        }
      } catch {
        return Response.json({ error: 'Invalid image URL' }, { status: 400 });
      }
    }

    // Server-side quota check (prevents multi-tab bypass)
    const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
    if (!isPremium) {
      const today = new Date().toISOString().split("T")[0];
      let remaining = user.messages_remaining ?? 10;
      const lastReset = user.messages_daily_reset;

      // Daily reset: give 10 free messages per day (unified pool)
      if (remaining <= 0 && lastReset !== today) {
        remaining = 10;
      }

      if (remaining <= 0) {
        return Response.json({ error: 'quota_exceeded', messages_remaining: 0 }, { status: 429 });
      }

      // Decrement server-side (atomic relative to this request)
      const newRemaining = remaining - 1;
      await base44.asServiceRole.entities.User.update(user.id, {
        messages_remaining: newRemaining,
        messages_daily_reset: today,
      });
      // Will be returned in response
      user._messagesRemaining = newRemaining;
    }

    // Filter messages to only allow safe roles, limit history to prevent prompt injection / cost abuse
    const messages = (rawMessages || []).filter(m => m.role === 'user' || m.role === 'assistant').slice(-20).map(m => ({
      role: m.role,
      content: String(m.content || '').substring(0, 2000),
    }));

    // Fetch dog profile server-side
    const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
    const dog = dogs?.[0];
    if (!dog) return Response.json({ error: 'Dog not found' }, { status: 400 });
    if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // ═══════════════════════════════════════════════════════════
    // DOG BRAIN — Fetch ALL relevant data in parallel
    // ═══════════════════════════════════════════════════════════
    const [
      checkins,
      healthRecords,
      foodScans,
      streaks,
      weeklyInsights,
      dailyLogs,
      userProgress,
      dietPrefs,
      nutritionPlans,
      diagnosisReports,
      growthEntries,
      bookmarks,
    ] = await Promise.all([
      base44.asServiceRole.entities.DailyCheckin.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.HealthRecord.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.FoodScan.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.Streak.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.WeeklyInsight.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.DailyLog.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.UserProgress.filter({ user_email: user.email }).catch(() => []),
      base44.asServiceRole.entities.DietPreferences.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.NutritionPlan.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.DiagnosisReport.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.GrowthEntry.filter({ dog_id: dogId }).catch(() => []),
      base44.asServiceRole.entities.Bookmark.filter({ dog_id: dogId }).catch(() => []),
    ]);

    // ═══════════════════════════════════════════════════════════
    // Build DOG MEMORY — smart summaries of all data
    // ═══════════════════════════════════════════════════════════
    const today = new Date();
    const daysAgo = (dateStr: string) => {
      if (!dateStr) return 999;
      const d = new Date(dateStr);
      return Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    };
    const formatDateFr = (dateStr: string) => {
      if (!dateStr) return "";
      const d = daysAgo(dateStr);
      if (d === 0) return "aujourd'hui";
      if (d === 1) return "hier";
      if (d < 7) return `il y a ${d} jours`;
      if (d < 30) return `il y a ${Math.floor(d / 7)} semaine(s)`;
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    };

    // --- Well-being trends (last 7 days) ---
    let wellbeingMemory = "";
    const recentCheckins = (checkins || [])
      .filter(c => daysAgo(c.date) <= 7)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (recentCheckins.length > 0) {
      const moodMap = { great: "excellent", good: "bon", neutral: "neutre", bad: "mauvais", terrible: "tres mauvais" };
      const energyMap = { high: "haute", medium: "moyenne", low: "basse" };
      const appetiteMap = { normal: "normal", increased: "augmente", decreased: "diminue", none: "aucun" };
      const moods = recentCheckins.map(c => moodMap[c.mood] || c.mood).filter(Boolean);
      const energies = recentCheckins.map(c => energyMap[c.energy] || c.energy).filter(Boolean);
      const appetites = recentCheckins.map(c => appetiteMap[c.appetite] || c.appetite).filter(Boolean);
      const latestNote = recentCheckins.find(c => c.notes)?.notes;
      wellbeingMemory = `\nBIEN-ETRE (7 derniers jours, ${recentCheckins.length} check-ins) :`;
      wellbeingMemory += `\n- Humeurs : ${moods.join(", ")}`;
      wellbeingMemory += `\n- Energie : ${energies.join(", ")}`;
      wellbeingMemory += `\n- Appetit : ${appetites.join(", ")}`;
      if (latestNote) wellbeingMemory += `\n- Derniere note : "${sanitize(latestNote, 200)}"`;
      const latestBehaviorNote = recentCheckins.find(c => c.behavior_notes)?.behavior_notes;
      if (latestBehaviorNote) wellbeingMemory += `\n- Observation comportement : "${sanitize(latestBehaviorNote, 200)}"`;
      // Symptoms from F11
      const symptomCheckins = recentCheckins.filter(c => c.symptoms?.length > 0);
      if (symptomCheckins.length > 0) {
        const symptomCounts: Record<string, number> = {};
        symptomCheckins.forEach(c => (c.symptoms || []).forEach((s: string) => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; }));
        wellbeingMemory += `\n- Symptomes signales : ${Object.entries(symptomCounts).map(([s, n]) => `${s} (${n}x)`).join(", ")}`;
      }
    }

    // --- Health records (recent) ---
    let healthMemory = "";
    const sortedRecords = (healthRecords || [])
      .sort((a, b) => new Date(b.date || b.created_date).getTime() - new Date(a.date || a.created_date).getTime());
    const recentVaccines = sortedRecords.filter(r => r.type === "vaccine").slice(0, 5);
    const recentVetVisits = sortedRecords.filter(r => r.type === "vet_visit").slice(0, 3);
    const weightRecords = sortedRecords.filter(r => r.type === "weight").slice(0, 5);
    const upcomingRecords = sortedRecords.filter(r => r.next_date && daysAgo(r.next_date) < 0 && daysAgo(r.next_date) > -60);
    if (recentVaccines.length > 0 || recentVetVisits.length > 0 || weightRecords.length > 0 || upcomingRecords.length > 0) {
      healthMemory = "\nSANTE :";
      if (recentVaccines.length > 0) {
        healthMemory += `\n- Vaccins : ${recentVaccines.map(v => `${v.title} (${formatDateFr(v.date)}${v.next_date ? `, prochain : ${formatDateFr(v.next_date)}` : ""})`).join(", ")}`;
      }
      if (recentVetVisits.length > 0) {
        healthMemory += `\n- Visites veto : ${recentVetVisits.map(v => `${v.title || "visite"} ${formatDateFr(v.date)}${v.details ? ` — ${v.details.substring(0, 80)}` : ""}`).join("; ")}`;
      }
      if (weightRecords.length >= 2) {
        const latestVal = parseFloat(weightRecords[0].value);
        const previousVal = parseFloat(weightRecords[1].value);
        if (!isNaN(latestVal) && !isNaN(previousVal)) {
          const diff = (latestVal - previousVal).toFixed(1);
          healthMemory += `\n- Poids : ${latestVal} kg (${Number(diff) > 0 ? "+" : ""}${diff} kg depuis ${formatDateFr(weightRecords[1].date)})`;
        } else if (!isNaN(latestVal)) {
          healthMemory += `\n- Dernier poids enregistre : ${latestVal} kg (${formatDateFr(weightRecords[0].date)})`;
        }
      } else if (weightRecords.length === 1) {
        const val = parseFloat(weightRecords[0].value);
        if (!isNaN(val)) healthMemory += `\n- Dernier poids enregistre : ${val} kg (${formatDateFr(weightRecords[0].date)})`;
      }
      if (upcomingRecords.length > 0) {
        healthMemory += `\n- A VENIR : ${upcomingRecords.map(r => `${r.title} le ${new Date(r.next_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`).join(", ")}`;
      }
      const activeMeds = sortedRecords.filter(r => r.type === "medication" && daysAgo(r.date || r.created_date) <= 90).slice(0, 5);
      if (activeMeds.length > 0) {
        healthMemory += `\n- Medicaments : ${activeMeds.map(m => `${m.title}${m.details ? ` (${String(m.details).substring(0, 60)})` : ""} ${formatDateFr(m.date)}`).join(", ")}`;
      }
    }

    // --- Food scans (recent) ---
    let nutritionMemory = "";
    const recentScans = (foodScans || [])
      .sort((a, b) => new Date(b.timestamp || b.created_date).getTime() - new Date(a.timestamp || a.created_date).getTime())
      .slice(0, 5);
    if (recentScans.length > 0) {
      const verdictFr = (v: string) => v === "safe" ? "sur" : v === "caution" ? "a surveiller" : "TOXIQUE";
      nutritionMemory = `\nNUTRITION :`;
      const latestScanDays = daysAgo(recentScans[0].timestamp || recentScans[0].created_date);
      const scanLabel = latestScanDays <= 7 ? "cette semaine" : latestScanDays <= 30 ? "ce mois" : `il y a ${Math.floor(latestScanDays / 30)} mois`;
      nutritionMemory += `\n- Aliments scannes (${scanLabel}) : ${recentScans.map(s => `${s.food_name} (${verdictFr(s.verdict)}, ${s.score}/10)`).join(", ")}`;
    }
    // Diet preferences (DietPreferences entity)
    const dietPref = (dietPrefs || [])[0];
    if (dietPref) {
      const prefParts: string[] = [];
      try {
        const brands = dietPref.preferred_brands ? JSON.parse(dietPref.preferred_brands) : [];
        if (Array.isArray(brands) && brands.length > 0) prefParts.push(`marques preferees: ${brands.join(", ")}`);
      } catch {}
      if (dietPref.disliked_foods) prefParts.push(`aliments refuses: ${dietPref.disliked_foods}`);
      const budgetLabels: Record<string, string> = { low: "economique (<30EUR)", medium: "standard (30-70EUR)", high: "premium (>70EUR)" };
      if (dietPref.budget_monthly) prefParts.push(`budget: ${budgetLabels[dietPref.budget_monthly] || dietPref.budget_monthly}`);
      if (dietPref.organic_preference) prefParts.push("preference bio/naturel");
      try {
        const times = dietPref.meal_times ? JSON.parse(dietPref.meal_times) : {};
        const timeParts: string[] = [];
        if (times.morning) timeParts.push(`matin ${times.morning}`);
        if (times.noon) timeParts.push(`midi ${times.noon}`);
        if (times.evening) timeParts.push(`soir ${times.evening}`);
        if (timeParts.length > 0) prefParts.push(`horaires: ${timeParts.join(", ")}`);
      } catch {}
      if (dietPref.portions_per_day) prefParts.push(`${dietPref.portions_per_day} repas/jour`);
      if (dietPref.notes) prefParts.push(`notes proprio: ${sanitize(dietPref.notes, 100)}`);
      if (prefParts.length > 0) {
        nutritionMemory += `\n- Preferences alimentaires : ${prefParts.join(", ")}`;
      }
    }

    // --- Activity (walks, last 7 days) ---
    let activityMemory = "";
    const recentLogs = (dailyLogs || [])
      .filter(l => daysAgo(l.date) <= 7)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (recentLogs.length > 0) {
      const totalMinutes = recentLogs.reduce((sum, l) => sum + (l.walk_minutes || 0), 0);
      const totalDistance = recentLogs.reduce((sum, l) => sum + (l.walk_distance_km || 0), 0);
      activityMemory = `\nACTIVITE (7 derniers jours) :`;
      activityMemory += `\n- ${recentLogs.length} jour(s) de balade, ${totalMinutes} min au total${totalDistance ? `, ${totalDistance.toFixed(1)} km` : ""}`;
      activityMemory += `\n- Moyenne : ${Math.round(totalMinutes / recentLogs.length)} min/jour`;
      // Walk mood summary
      const moodCounts: Record<string, number> = {};
      recentLogs.forEach(l => { if (l.walk_mood) moodCounts[l.walk_mood] = (moodCounts[l.walk_mood] || 0) + 1; });
      if (Object.keys(moodCounts).length > 0) {
        activityMemory += `\n- Humeur post-balade : ${Object.entries(moodCounts).map(([m, n]) => `${m} (${n}x)`).join(", ")}`;
      }
      // Walk behavior tags
      const tagCounts: Record<string, number> = {};
      recentLogs.forEach(l => {
        if (l.walk_tags) { try { const tags = JSON.parse(l.walk_tags); if (Array.isArray(tags)) tags.forEach((t: string) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }); } catch {} }
      });
      if (Object.keys(tagCounts).length > 0) {
        activityMemory += `\n- Comportements en balade : ${Object.entries(tagCounts).map(([t, n]) => `${t} (${n}x)`).join(", ")}`;
      }
      // Walk notes (includes park names when detected nearby)
      const recentNotes = recentLogs
        .filter(l => l.notes)
        .slice(0, 5)
        .map(l => l.notes);
      if (recentNotes.length > 0) {
        activityMemory += `\n- Notes de balade : ${recentNotes.join(" | ").substring(0, 300)}`;
      }
      const waterLogs = recentLogs.filter(l => l.water_bowls && l.water_bowls > 0);
      if (waterLogs.length > 0) {
        const avgWater = (waterLogs.reduce((sum, l) => sum + l.water_bowls, 0) / waterLogs.length).toFixed(1);
        activityMemory += `\n- Hydratation : ${avgWater} bol(s)/jour en moyenne (${waterLogs.length} jour(s) renseignes)`;
      }
    }

    // --- Streak ---
    let streakMemory = "";
    const streak = (streaks || [])
      .sort((a, b) => new Date(b.last_activity_date || b.created_date || 0).getTime() - new Date(a.last_activity_date || a.created_date || 0).getTime())[0];
    if (streak && (streak.current_streak || 0) > 0) {
      streakMemory = `\nENGAGEMENT :`;
      streakMemory += `\n- Streak actuel : ${streak.current_streak} jour(s) consecutif(s)`;
      if (streak.longest_streak) streakMemory += ` (record : ${streak.longest_streak})`;
    }

    // --- Training progress ---
    let trainingMemory = "";
    const completedExercises = (userProgress || []).filter(p => p.completed && p.dog_id === dogId);
    if (completedExercises.length > 0) {
      trainingMemory = `\nDRESSAGE :`;
      trainingMemory += `\n- ${completedExercises.length} exercice(s) termine(s)`;
      const exerciseNames = completedExercises.slice(0, 10).map(p => p.exercise_id).filter(Boolean);
      if (exerciseNames.length > 0) trainingMemory += ` : ${exerciseNames.join(", ")}${completedExercises.length > 10 ? ` (+${completedExercises.length - 10} autres)` : ""}`;
    }

    // --- Latest weekly insight ---
    let insightMemory = "";
    const latestInsight = (weeklyInsights || [])
      .sort((a, b) => new Date(b.week_start || b.created_date).getTime() - new Date(a.week_start || a.created_date).getTime())
      .find(i => daysAgo(i.week_start || i.created_date) <= 60);
    if (latestInsight?.summary) {
      const summary = latestInsight.summary.substring(0, 200);
      insightMemory = `\nDERNIER BILAN HEBDO : ${summary}${latestInsight.summary.length > 200 ? "..." : ""}`;
    }

    // --- Recent pre-consultations ---
    let diagnosticMemory = "";
    const recentDiagnoses = (diagnosisReports || [])
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
      .filter(d => daysAgo(d.created_date) <= 180)
      .slice(0, 3);
    if (recentDiagnoses.length > 0) {
      diagnosticMemory = `\nPRE-CONSULTATIONS RECENTES :`;
      recentDiagnoses.forEach(d => {
        const urgencyFr = { low: "faible", medium: "modere", high: "eleve", emergency: "URGENCE" };
        diagnosticMemory += `\n- ${formatDateFr(d.created_date)} : symptomes "${String(d.symptoms || "").substring(0, 100)}"`;
        if (d.urgency_level) diagnosticMemory += ` (urgence : ${urgencyFr[d.urgency_level] || d.urgency_level})`;
      });
    }

    // --- Growth data (BCS, height) ---
    let growthMemory = "";
    const latestGrowth = (growthEntries || [])
      .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];
    if (latestGrowth) {
      growthMemory = `\nCROISSANCE :`;
      if (latestGrowth.height_cm) growthMemory += `\n- Taille : ${latestGrowth.height_cm} cm (${formatDateFr(latestGrowth.created_date)})`;
      if (latestGrowth.body_condition_score) growthMemory += `\n- Score corporel (BCS) : ${latestGrowth.body_condition_score}/9`;
      if (latestGrowth.weight_kg) growthMemory += `\n- Dernier poids mesure : ${latestGrowth.weight_kg} kg`;
    }

    // --- Active programs (fitness/behavior) ---
    let programMemory = "";
    const activePrograms = (bookmarks || []).filter((b: any) =>
      (b.source === "fitness_program" || b.source === "behavior_program") && b.content &&
      daysAgo(b.updated_date || b.created_date) <= 30
    );
    if (activePrograms.length > 0) {
      programMemory = `\nPROGRAMMES ACTIFS :`;
      activePrograms.slice(0, 2).forEach((b: any) => {
        try {
          const content = typeof b.content === "string" ? JSON.parse(b.content) : b.content;
          const type = b.source === "fitness_program" ? "Forme" : "Comportement";
          const completed = content.completed_days ? Object.values(content.completed_days).filter(Boolean).length : 0;
          programMemory += `\n- Programme ${type} : ${content.title || "Sans titre"} (${completed}/7 jours completes)`;
          if (content.bilan) programMemory += ` — bilan feeling: ${content.bilan.feeling}/5`;
        } catch {}
      });
    }

    // --- Active nutrition plan ---
    let nutritionPlanMemory = "";
    const activePlans = (nutritionPlans || []).filter((p: any) => p.is_active);
    const activePlan = activePlans.length > 0
      ? activePlans.sort((a: any, b: any) => (b.generated_at || "").localeCompare(a.generated_at || ""))[0]
      : null;
    if (activePlan) {
      try {
        const planData = JSON.parse(activePlan.plan_text);
        if (planData.days && Array.isArray(planData.days)) {
          const startDate = planData.start_date;
          const elapsed = startDate ? Math.floor((today.getTime() - new Date(startDate + "T00:00:00").getTime()) / 86400000) : null;
          const dayNumber = elapsed !== null && elapsed >= 0 ? Math.min(elapsed + 1, 7) : null;
          const isExpired = elapsed !== null && elapsed >= 7;
          nutritionPlanMemory = `\nPLAN REPAS ACTIF :`;
          nutritionPlanMemory += `\n- ${planData.calories_per_day || "?"} kcal/jour, ${planData.quantity_summary || ""}`;
          if (isExpired) {
            nutritionPlanMemory += `\n- EXPIRE (genere il y a ${elapsed} jours) — suggerer d'en generer un nouveau`;
          } else if (dayNumber) {
            nutritionPlanMemory += `\n- Jour ${dayNumber}/7`;
            const todayDay = planData.days[dayNumber - 1];
            if (todayDay) {
              nutritionPlanMemory += ` — Matin: ${todayDay.morning?.food || "?"}, Soir: ${todayDay.evening?.food || "?"}`;
            }
          }
          if (planData.supplements?.length > 0) nutritionPlanMemory += `\n- Complements: ${planData.supplements.join(", ")}`;
          if (planData.avoid?.length > 0) nutritionPlanMemory += `\n- A eviter: ${planData.avoid.join(", ")}`;
        }
      } catch {}
      if (activePlan.notes) {
        nutritionPlanMemory += `\n- Note du proprio: "${String(activePlan.notes).substring(0, 100)}"`;
      }
    }

    // --- Behavior summary (persistent, updated weekly by CRON) ---
    let behaviorMemory = "";
    if (dog.behavior_summary) {
      behaviorMemory = `\nPROFIL COMPORTEMENTAL (memoire longue duree) :\n${dog.behavior_summary}`;
    }

    // Assemble the full DOG MEMORY
    const dogMemory = [wellbeingMemory, healthMemory, nutritionMemory, nutritionPlanMemory, activityMemory, streakMemory, trainingMemory, insightMemory, diagnosticMemory, growthMemory, programMemory, behaviorMemory]
      .filter(s => s.length > 0)
      .join("\n");

    // ═══════════════════════════════════════════════════════════
    // Build personalization context
    // ═══════════════════════════════════════════════════════════
    const toneInstructions = {
      encouraging: "Ton chaleureux et encourageant. Felicite les efforts, valorise les progres.",
      direct: "Ton direct et concis. Essentiel d'abord, pas de fioritures.",
      pedagogical: "Ton pedagogique. Explique le 'pourquoi' derriere chaque conseil.",
    };
    const toneInstruction = user.coach_tone ? (toneInstructions[user.coach_tone] || "") : "";

    const topicLabels = { health: "sante", nutrition: "nutrition", training: "dressage", behavior: "comportement" };
    let topicsInstruction = "";
    try {
      const topics = JSON.parse(user.coach_topics || "[]");
      if (Array.isArray(topics) && topics.length > 0) {
        topicsInstruction = `Le proprietaire s'interesse particulierement a : ${topics.map(t => topicLabels[t] || t).join(", ")}.`;
      }
    } catch {}

    let personalityContext = "";
    try {
      const tags = JSON.parse(dog.personality_tags || "[]");
      if (Array.isArray(tags) && tags.length > 0) {
        personalityContext = `Personnalite : ${tags.join(", ")}.`;
      }
    } catch {}

    const statusMessages = {
      recovering: "ATTENTION : ce chien est en convalescence. Pas d'exercices intenses. Priorite repos et alimentation douce.",
      traveling: "Ce chien est en deplacement. Prendre en compte le stress, changements de routine, precautions sanitaires.",
    };
    const statusContext = dog.status && dog.status !== "healthy" ? (statusMessages[dog.status] || "") : "";

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

    // ═══════════════════════════════════════════════════════════
    // Build SYSTEM PROMPT — "Intelligent Brain"
    // ═══════════════════════════════════════════════════════════
    // Sanitize user-controlled strings before prompt injection
    const safeDogName = sanitize(dog.name, 50);
    const safeDogBreed = sanitize(dog.breed, 50);

    const dogProfile = [
      `- Nom : ${safeDogName}`,
      `- Race : ${safeDogBreed || "Non renseignee"}`,
      ageStr ? `- Age : ${ageStr}` : null,
      dog.weight ? `- Poids : ${dog.weight} kg` : null,
      dog.sex ? `- Sexe : ${dog.sex === "male" ? "Male" : "Femelle"}` : null,
      dog.neutered !== undefined ? `- Sterilise : ${dog.neutered ? "Oui" : "Non"}` : null,
      dog.activity_level ? `- Niveau d'activite : ${dog.activity_level}` : null,
      dog.environment ? `- Environnement : ${dog.environment}` : null,
      dog.allergies ? `- Allergies : ${sanitize(dog.allergies, 200)}` : null,
      dog.health_issues ? `- Problemes de sante : ${dog.health_issues}` : null,
      dog.vet_name ? `- Veterinaire : ${dog.vet_name}${dog.vet_city ? ` (${dog.vet_city})` : ""}` : null,
      personalityContext ? `- ${personalityContext}` : null,
      statusContext ? `- ${statusContext}` : null,
      dog.owner_goal ? `- Objectif du proprietaire : ${sanitize(dog.owner_goal, 150)}` : null,
      dog.diet_type ? `- Alimentation : ${dog.diet_type}${dog.diet_brand ? ` (${dog.diet_brand})` : ""}` : null,
      dog.diet_restrictions ? `- Restrictions alimentaires : ${dog.diet_restrictions}` : null,
      dog.next_vet_appointment ? `- Prochain RDV veterinaire : ${formatDateFr(dog.next_vet_appointment)}` : null,
    ].filter(Boolean).join("\n");

    const todayFr = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    const roleIntro = mode === "nutrition"
      ? `Tu es NutriCoach, le coach nutrition canin expert de PawCoach. Tu donnes des conseils nutritionnels personnalises et recommandes des aliments adaptes.`
      : `Tu es PawCoach, le coach bien-etre canin intelligent. Tu es l'expert personnel de ${safeDogName} — tu connais son historique, sa sante, son alimentation, son activite et son caractere.`;

    const systemPrompt = `${roleIntro}

DATE : ${todayFr}

PROFIL DU CHIEN :
${dogProfile}
${dogMemory ? `\n═══ MEMOIRE DE ${safeDogName.toUpperCase()} ═══${dogMemory}` : ""}

INTERPRETATION DES DONNEES — REGLE CRITIQUE :
- Si une section de memoire est ABSENTE, le proprietaire n'a pas encore utilise cette fonctionnalite. Ne fais AUCUNE supposition negative.
- "Pas de check-in" ≠ "le chien va mal". Le proprio n'a simplement pas rempli.
- "Pas de donnees hydratation" ≠ "le chien ne boit pas". Le suivi eau est rarement rempli.
- "Pas de balade enregistree" ≠ "le chien ne sort pas". Le proprio n'a pas utilise le GPS.
- "Pas de scan alimentaire" ≠ "mauvaise alimentation". Le proprio n'a pas encore scanne.
- Quand tu as des donnees, base tes reponses dessus. Quand il n'y en a pas, NE COMBLE PAS le vide par des suppositions — propose plutot de commencer a tracker ("Tu veux qu'on suive X ensemble ?").
- FRAICHEUR : les donnees des 7 derniers jours sont les plus fiables. Au-dela, contextualise avec la date.
- TENDANCES : ne signale une tendance que si tu as au moins 3 points de donnees. Un seul point n'est pas une tendance.
${dog.owner_goal ? `\nOBJECTIF PRINCIPAL : "${sanitize(dog.owner_goal, 150)}" — Oriente naturellement tes conseils vers cet objectif. Par exemple si l'objectif est "perte de poids", privilegie les conseils nutrition/exercice. Si c'est "socialisation", oriente vers les balades et le comportement. Ne repete pas l'objectif mot pour mot a chaque message, mais garde-le en tete.` : ""}

COMMENT TE COMPORTER :
- Tu CONNAIS ${safeDogName} personnellement. Refere-toi a son historique naturellement dans tes reponses.
- Si tu vois des tendances dans les donnees (baisse d'energie, perte de poids, appetit en baisse), mentionne-les proactivement.
- Fais des connexions entre les domaines : nutrition + sante + activite + comportement = une seule vision holistique.
- Si un vaccin ou RDV approche, mentionne-le naturellement.
- Utilise le prenom de ${safeDogName}, tutoie le proprietaire.
- Reponds en francais, sois chaleureux et concis (2-3 paragraphes max).
- Ne pose JAMAIS de diagnostic medical.
- ECHELLE DE SEVERITE (OBLIGATOIRE) :
  * NIVEAU 1 (symptome isole, leger, <24h) : Rassure. "Surveille les 24h". NE PAS mentionner le veto.
  * NIVEAU 2 (persiste 2-3j OU 2 symptomes legers) : "Si ca persiste, un check-up serait bien".
  * NIVEAU 3 (symptomes multiples, >3j, combinaison suspecte) : "Un avis veterinaire serait recommande".
  * NIVEAU 4 (urgence grave : convulsions, saignement, toxique, paralysie) : "Contacte les urgences veterinaires".
  NE PROPOSE JAMAIS le veto pour un symptome isole de moins de 24h. C'est disproportionne et anxiogene.
- Quand tu ne sais pas, dis-le honnetement.
${mode === "nutrition" ? `- Quand tu recommandes des marques, mentionne "Disponible sur Amazon/Zooplus".\n- Utilise des emojis alimentaires.` : `- Utilise des emojis avec parcimonie.`}
${toneInstruction ? `\nTON : ${toneInstruction}` : ""}
${topicsInstruction ? `\nPRIORITES : ${topicsInstruction}` : ""}`;

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing OPENROUTER_API_KEY' }, { status: 500 });

    let model = "deepseek/deepseek-chat";
    const lastUserMessage = messages[messages.length - 1];

    // If there's an image, use GPT-4o vision
    if (imageUrl) {
      model = "openai/gpt-4o";
      const visionMessages = messages.slice(0, -1);
      visionMessages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: imageUrl }
          },
          {
            type: "text",
            text: (lastUserMessage?.content || "Analyse cette image de mon chien.") + "\n\nNote: Decris ce que tu observes. Ne diagnostique jamais. Si tu vois des symptomes inquietants, recommande de consulter un veterinaire."
          }
        ]
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pawcoach.app",
          "X-Title": "PawCoach",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...visionMessages,
          ],
          max_tokens: 700,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return Response.json({ error: err }, { status: response.status });
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return Response.json({ content, messages_remaining: user._messagesRemaining });
    }

    // Text-only with DeepSeek
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pawcoach.app",
        "X-Title": "PawCoach",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return Response.json({ content, messages_remaining: user._messagesRemaining });

  } catch (error) {
    console.error("pawcoachChat error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});