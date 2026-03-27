import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — use service role
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch medications upfront (filtered by type — avoids loading all HealthRecords)
    const medications = await base44.asServiceRole.entities.HealthRecord.filter({ type: "medication" });

    // Only send reminders at specific intervals: 14, 7, 3, 1, 0 days before
    const REMINDER_DAYS = [14, 7, 3, 1, 0];
    const todayStr = today.toISOString().slice(0, 10);

    const upcoming = (medications || []).filter(r => {
      if (!r.next_date) return false;
      const due = new Date(r.next_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && REMINDER_DAYS.includes(diffDays);
    });

    // Build dog and user maps from upcoming medications only (targeted — avoids Dog.list/User.list)
    const uniqueDogIds = [...new Set((upcoming || []).map(r => r.dog_id).filter(Boolean))];
    const dogMap = new Map<string, any>();
    for (const dogId of uniqueDogIds) {
      const dogs = await base44.asServiceRole.entities.Dog.filter({ id: dogId });
      if (dogs?.[0]) dogMap.set(dogId, dogs[0]);
    }
    const uniqueOwnerEmails = [...new Set([...dogMap.values()].map(d => d.owner).filter(Boolean))];
    const userMap = new Map<string, any>();
    for (const email of uniqueOwnerEmails) {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users?.[0]) userMap.set(email, users[0]);
    }

    let sent = 0;
    for (const record of upcoming) {
      // Skip if already reminded today (dedup)
      if (record.reminder_sent_date === todayStr) continue;

      // Get the dog
      const dog = dogMap.get(record.dog_id);
      if (!dog) continue;

      // Get the owner's user record
      const user = userMap.get(dog.owner);
      if (!user) continue;

      // No premium filter — all users receive medication reminders
      const dueDate = new Date(record.next_date);
      const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "PawCoach",
        subject: `Rappel médicament pour ${dog.name}`,
        body: `Bonjour !\n\nRappel médicament pour ${dog.name} : "${record.title}" est prévu le ${formattedDate} (dans ${diffDays} jour${diffDays > 1 ? "s" : ""}).\n\nPense à renouveler ou administrer ce médicament. 💊\n\n— PawCoach`,
      });

      // Mark as reminded today (prevents duplicate sends)
      try {
        await base44.asServiceRole.entities.HealthRecord.update(record.id, { reminder_sent_date: todayStr });
      } catch (updateErr) {
        console.warn(`medicationReminders: failed to update reminder_sent_date for record ${record.id}:`, updateErr?.message || String(updateErr));
      }
      sent++;
    }

    return Response.json({ ok: true, checked: upcoming.length, sent });
  } catch (error) {
    console.error("medicationReminders error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
