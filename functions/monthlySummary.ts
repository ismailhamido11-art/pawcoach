import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = lastMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const monthStr = lastMonth.toISOString().slice(0, 7); // "YYYY-MM"

    // Fetch all data upfront to avoid N+1 queries
    const dogs = await base44.asServiceRole.entities.Dog.list();
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allRecords = await base44.asServiceRole.entities.HealthRecord.list();
    const allCheckins = await base44.asServiceRole.entities.DailyCheckin.list().catch(() => []);

    const userMap = new Map((allUsers || []).map(u => [u.email, u]));

    for (const dog of (dogs || [])) {
      // Get owner – premium only
      const user = userMap.get(dog.owner);
      if (!user) continue;
      const isPremium = user.is_premium || (user.trial_expires_at && new Date(user.trial_expires_at) > new Date());
      if (!isPremium) continue;

      // Filter health records in memory for this dog
      const dogRecords = (allRecords || []).filter(r => r.dog_id === dog.id);
      const lastMonthRecords = dogRecords.filter(r => r.date && r.date.startsWith(monthStr));

      const vetVisits = lastMonthRecords.filter(r => r.type === "vet_visit").length;
      const notes = lastMonthRecords.filter(r => r.type === "note").length;

      // Weight change
      const weightRecords = dogRecords.filter(r => r.type === "weight" && r.value)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const lastMonthWeights = weightRecords.filter(r => r.date && r.date.startsWith(monthStr));
      let weightChange = null;
      if (lastMonthWeights.length >= 2) {
        weightChange = (lastMonthWeights[lastMonthWeights.length - 1].value - lastMonthWeights[0].value).toFixed(1);
      } else if (weightRecords.length >= 2) {
        const prev = weightRecords[weightRecords.length - 2];
        const curr = weightRecords[weightRecords.length - 1];
        if (curr.date.startsWith(monthStr)) {
          weightChange = (curr.value - prev.value).toFixed(1);
        }
      }

      const weightLine = weightChange !== null
        ? `• Variation de poids : ${weightChange > 0 ? "+" : ""}${weightChange} kg`
        : "• Poids : pas de nouvelle mesure ce mois-ci";

      // Filter DailyCheckins in memory for this dog this month (loaded upfront to avoid N+1)
      const monthCheckins = (allCheckins || []).filter(c => c.dog_id === dog.id && c.date && c.date.startsWith(monthStr));

      const checkinCount = monthCheckins.length;

      // Calculate averages (only if check-ins exist)
      let checkinStatsLines = "• Check-ins : aucun ce mois-ci";
      if (checkinCount > 0) {
        const avgMood = (monthCheckins.reduce((s, c) => s + (c.mood || 0), 0) / checkinCount).toFixed(1);
        const avgEnergy = (monthCheckins.reduce((s, c) => s + (c.energy || 0), 0) / checkinCount).toFixed(1);
        const avgAppetite = (monthCheckins.reduce((s, c) => s + (c.appetite || 0), 0) / checkinCount).toFixed(1);

        // Recurring symptoms (>= 2 occurrences)
        const symptomCounts: Record<string, number> = {};
        monthCheckins.forEach(c => {
          if (c.symptoms?.length) c.symptoms.forEach((s: string) => { symptomCounts[s] = (symptomCounts[s] || 0) + 1; });
        });
        const recurringSymptoms = Object.entries(symptomCounts)
          .filter(([_, n]) => n >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([s, n]) => `${s} (${n}x)`)
          .join(", ");

        checkinStatsLines = [
          `• Check-ins : ${checkinCount} jours sur le mois`,
          `• Humeur moyenne : ${avgMood}/4`,
          `• Energie moyenne : ${avgEnergy}/3`,
          `• Appetit moyen : ${avgAppetite}/3`,
          recurringSymptoms ? `• Symptomes recurrents : ${recurringSymptoms}` : null,
        ].filter(Boolean).join("\n");
      }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: "PawCoach",
          subject: `🐾 Résumé de ${monthName} pour ${dog.name}`,
          body: `Bonjour !\n\nVoici le résumé du mois de ${monthName} pour ${dog.name} :\n\n${checkinStatsLines}\n${weightLine}\n• Visites vétérinaire : ${vetVisits}\n• Notes de santé ajoutées : ${notes}\n\nBravo pour le suivi de ${dog.name} ! 🌟\n\n— PawCoach`,
        });
      } catch (emailErr) {
        console.error(`monthlySummary email failed for ${user.email}:`, emailErr?.message || String(emailErr));
      }
    }

    return Response.json({ ok: true, processed: (dogs || []).length });
  } catch (error) {
    console.error("monthlySummary error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});