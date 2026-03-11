import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Lightweight vaccine name resolution for emails (mirrors frontend healthStatus.js)
const VACCINE_NAMES: Record<string, string> = {
  chp: "Carre, Hepatite, Parvovirose",
  leptospirose: "Leptospirose",
  rage: "Rage",
  toux_chenil: "Toux de chenil",
  piroplasmose: "Piroplasmose",
  leishmaniose: "Leishmaniose",
};
const VACCINE_ALIASES: Record<string, string> = {
  chp: "chp", chppi: "chp", carre: "chp", hepatite: "chp", parvo: "chp", parvovirose: "chp",
  dhpp: "chp", dhlpp: "chp", rubarth: "chp", dappi: "chp", dapp: "chp",
  lepto: "leptospirose", leptospirose: "leptospirose",
  rage: "rage", rabies: "rage", antirabique: "rage",
  toux: "toux_chenil", chenil: "toux_chenil", bordetella: "toux_chenil", kennel: "toux_chenil",
  piro: "piroplasmose", piroplasmose: "piroplasmose", babesiose: "piroplasmose", babesia: "piroplasmose", tique: "piroplasmose",
  leishma: "leishmaniose", leishmaniose: "leishmaniose", phlebotome: "leishmaniose",
};
function resolveVaccineName(title: string): string {
  if (!title) return "";
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [alias, key] of Object.entries(VACCINE_ALIASES)) {
    if (lower.includes(alias)) return VACCINE_NAMES[key] || title;
  }
  return title;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This is a scheduled function — use service role
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all data upfront to avoid N+1 queries
    const vaccines = await base44.asServiceRole.entities.HealthRecord.filter({ type: "vaccine" });
    const allDogs = await base44.asServiceRole.entities.Dog.list();
    const allUsers = await base44.asServiceRole.entities.User.list();

    const dogMap = new Map((allDogs || []).map(d => [d.id, d]));
    const userMap = new Map((allUsers || []).map(u => [u.email, u]));

    // Only send reminders at specific intervals: 14, 7, 3, 1, 0 days before
    const REMINDER_DAYS = [14, 7, 3, 1, 0];
    const todayStr = today.toISOString().slice(0, 10);

    const upcoming = (vaccines || []).filter(v => {
      if (!v.next_date) return false;
      const due = new Date(v.next_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && REMINDER_DAYS.includes(diffDays);
    });

    let sent = 0;
    for (const vaccine of upcoming) {
      // Skip if already reminded today (dedup)
      if (vaccine.reminder_sent_date === todayStr) continue;

      // Get the dog
      const dog = dogMap.get(vaccine.dog_id);
      if (!dog) continue;

      // Get the owner's user record
      const user = userMap.get(dog.owner);
      if (!user) continue;

      const dueDate = new Date(vaccine.next_date);
      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
      const formattedDate = dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: user.email,
        from_name: "PawCoach",
        subject: `🐾 Rappel vaccin pour ${dog.name}`,
        body: `Bonjour !\n\nRappel vaccin pour ${dog.name} : le vaccin "${resolveVaccineName(vaccine.title)}" est prévu le ${formattedDate} (dans ${diffDays} jour${diffDays > 1 ? "s" : ""}).\n\nPense à prendre rendez-vous chez ton vétérinaire. 🏥\n\n— PawCoach`,
      });

      // Mark as reminded today (prevents duplicate sends)
      try {
        await base44.asServiceRole.entities.HealthRecord.update(vaccine.id, { reminder_sent_date: todayStr });
      } catch (updateErr) {
        console.warn(`vaccineReminders: failed to update reminder_sent_date for vaccine ${vaccine.id}:`, updateErr?.message || String(updateErr));
      }
      sent++;
    }

    return Response.json({ ok: true, checked: upcoming.length, sent });
  } catch (error) {
    console.error("vaccineReminders error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});