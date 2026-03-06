import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Runs every hour (scheduled automation)
// Checks each user's walk_reminder_time and sends an email if no activity logged today

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Current time in Paris (handles CET/CEST automatically)
    const now = new Date();
    const parisTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    const localHour = parisTime.getHours();
    const localHourStr = String(localHour).padStart(2, "0") + ":00";
    const today = now.toISOString().slice(0, 10);

    console.log(`walkReminder running for hour slot: ${localHourStr} (today: ${today})`);

    // Get all users with reminders enabled at this hour
    const users = await base44.asServiceRole.entities.User.filter({
      walk_reminder_enabled: true,
      walk_reminder_time: localHourStr
    });

    if (!users?.length) {
      return Response.json({ ok: true, sent: 0, message: "No users scheduled for this hour" });
    }

    const dogs = await base44.asServiceRole.entities.Dog.list();
    const dogsByOwner = {};
    for (const d of dogs || []) {
      if (!dogsByOwner[d.owner]) dogsByOwner[d.owner] = d;
    }

    let sent = 0;

    for (const user of users) {
      const dog = dogsByOwner[user.email];
      if (!dog) continue;

      // Check if walk already logged today
      const logs = await base44.asServiceRole.entities.DailyLog.filter({
        dog_id: dog.id,
        date: today
      });

      const hasWalk = logs?.some(l => l.walk_minutes > 0);
      if (hasWalk) {
        console.log(`${user.email}: already walked today, skipping`);
        continue;
      }

      // No walk logged → send reminder email
      const firstName = user.full_name?.split(" ")[0] || "toi";
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "PawCoach",
        subject: `🐾 ${dog.name} attend sa balade du jour !`,
        body: `Salut ${firstName} !\n\nIl est ${localHourStr} et ${dog.name} n'a pas encore eu sa balade aujourd'hui.\n\nUne petite sortie, même de 10 minutes, fait toute la différence pour sa santé physique et mentale. 🌿\n\nOuvre PawCoach, appuie sur "Démarrer" et partez ensemble ! 🏃‍♀️🐕\n\n— PawCoach 🐾\n\n(Pour désactiver ce rappel, rendez-vous dans Profil > Rappel balade)`
      });

      console.log(`Reminder sent to ${user.email} for ${dog.name}`);
      sent++;
    }

    return Response.json({ ok: true, sent, hour: localHourStr });

  } catch (error) {
    console.error("walkReminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});