import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date().toISOString().slice(0, 10);

    // TECH-02: Hard cap on Streak.list() to prevent full table scan at scale.
    // Base44 SDK filter operators for numeric comparison are not documented — using list() with slice guard.
    const allStreaks = await base44.asServiceRole.entities.Streak.list().catch(() => []);
    if ((allStreaks || []).length > 2000) {
      console.warn(`streakReminder: ${allStreaks.length} streaks — exceeds safe limit of 2000, processing first 2000 only`);
    }
    const streaks = (allStreaks || []).slice(0, 2000);

    // Filter active streaks in-memory first, then fetch only relevant dogs/users
    const activeStreaks = streaks.filter(s => s.current_streak >= 3 && s.last_activity_date !== today);
    const uniqueDogIds = [...new Set(activeStreaks.map(s => s.dog_id).filter(Boolean))];

    const dogMap: Record<string, any> = {};
    for (const dogId of uniqueDogIds) {
      const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
      if (dogs?.[0]) dogMap[dogId] = dogs[0];
    }
    const uniqueOwnerEmails = [...new Set(Object.values(dogMap).map((d: any) => d.owner).filter(Boolean))];
    const userMap: Record<string, any> = {};
    for (const email of uniqueOwnerEmails) {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users?.[0]) userMap[email as string] = users[0];
    }

    let remindersSent = 0;
    const notifiedEmails = new Set<string>(); // deduplicate: one email per user regardless of dog count

    for (const s of activeStreaks) {

      const dog = dogMap[s.dog_id];
      if (!dog) continue;

      const user = userMap[dog.owner];
      if (!user || !user.email) continue;
      if (notifiedEmails.has(user.email)) continue; // already sent for this user (multi-dog)
      notifiedEmails.add(user.email);

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
    console.error("streakReminder error:", error?.message || String(error));
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});