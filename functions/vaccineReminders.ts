import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — use service role
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all vaccine records with next_date
    const vaccines = await base44.asServiceRole.entities.HealthRecord.filter({ type: "vaccine" });
    const upcoming = vaccines.filter(v => {
      if (!v.next_date) return false;
      const due = new Date(v.next_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 14;
    });

    let sent = 0;
    for (const vaccine of upcoming) {
      // Get the dog
      const dogs = await base44.asServiceRole.entities.Dog.filter({ id: vaccine.dog_id });
      if (!dogs.length) continue;
      const dog = dogs[0];

      // Get the owner's user record
      const users = await base44.asServiceRole.entities.User.filter({ email: dog.owner });
      if (!users.length) continue;
      const user = users[0];

      // Only send for premium users (role === "admin")
      if (user.role !== "admin") continue;

      const dueDate = new Date(vaccine.next_date);
      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
      const formattedDate = dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "PawCoach",
        subject: `🐾 Rappel vaccin pour ${dog.name}`,
        body: `Bonjour !\n\nRappel vaccin pour ${dog.name} : le vaccin "${vaccine.title}" est prévu le ${formattedDate} (dans ${diffDays} jour${diffDays > 1 ? "s" : ""}).\n\nPense à prendre rendez-vous chez ton vétérinaire. 🏥\n\n— PawCoach`,
      });
      sent++;
    }

    return Response.json({ ok: true, checked: upcoming.length, sent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});