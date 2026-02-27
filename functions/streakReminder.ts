import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all data upfront
    const [streaks, dogs, users] = await Promise.all([
      base44.asServiceRole.entities.Streak.list(),
      base44.asServiceRole.entities.Dog.list(),
      base44.asServiceRole.entities.User.list(),
    ]);

    const dogMap = {};
    for (const d of dogs || []) dogMap[d.id] = d;

    const userMap = {};
    for (const u of users || []) userMap[u.email] = u;

    let remindersSent = 0;

    for (const s of streaks || []) {
      if (s.current_streak < 3 || s.last_activity_date === today) continue;

      const dog = dogMap[s.dog_id];
      if (!dog) continue;

      const user = userMap[s.owner_email];
      if (!user || !user.email) continue;

      const graceNote = s.grace_days_remaining > 0
        ? `\n\nBonne nouvelle : tu as encore ${s.grace_days_remaining} jour${s.grace_days_remaining > 1 ? "s" : ""} de grâce si jamais tu ne peux pas aujourd'hui. Mais autant en profiter maintenant ! 💪`
        : "";

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "PawCoach",
        subject: `🔥 Ton streak de ${s.current_streak} jours avec ${dog.name} !`,
        body: `Salut ${user.full_name?.split(" ")[0] || "toi"} ! 🐾\n\nTu as un super streak de ${s.current_streak} jours avec ${dog.name}, bravo ! 🎉\n\nN'oublie pas de faire ton check-in du jour pour garder ta série en vie. Un petit check-in, un scan ou un exercice de dressage — tout compte !${graceNote}\n\nÀ tout de suite sur PawCoach !\n\n— PawCoach 🐾`,
      });

      remindersSent++;
    }

    return Response.json({ ok: true, reminders_sent: remindersSent });

  } catch (error) {
    console.error("streakReminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});