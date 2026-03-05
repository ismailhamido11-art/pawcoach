import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

// Runs daily (scheduled automation)
// Sends reminder emails to users whose trial expires in 3 days or 1 day

Deno.serve(async (req) => {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    if (cronSecret !== Deno.env.get("CRON_SECRET")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const now = new Date();

    // Get all users with an active trial (not yet paid)
    const users = await base44.asServiceRole.entities.User.filter({
      is_premium: false
    });

    if (!users?.length) {
      return Response.json({ ok: true, sent: 0, message: "No trial users found" });
    }

    // Get all dogs for name personalization
    const dogs = await base44.asServiceRole.entities.Dog.list();
    const dogsByOwner: Record<string, { name: string }> = {};
    for (const d of dogs || []) {
      if (d.owner && !dogsByOwner[d.owner]) {
        dogsByOwner[d.owner] = d;
      }
    }

    let sent = 0;

    for (const user of users) {
      if (!user.trial_expires_at) continue;

      const expiresAt = new Date(user.trial_expires_at);
      if (expiresAt <= now) continue; // Already expired

      const diffMs = expiresAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Only send on day 3 and day 1
      if (daysLeft !== 3 && daysLeft !== 1) continue;

      const dog = dogsByOwner[user.email];
      const dogName = dog?.name || "ton chien";
      const firstName = user.full_name?.split(" ")[0] || "toi";

      let subject: string;
      let body: string;

      if (daysLeft === 3) {
        subject = `⏳ Ton essai Premium expire dans 3 jours, ${firstName}`;
        body = [
          `Salut ${firstName} !`,
          "",
          `Ton essai Premium PawCoach expire dans 3 jours.`,
          "",
          `Pendant cet essai, tu as pu profiter de :`,
          `• Chat IA illimité pour ${dogName}`,
          `• Scans alimentaires illimités`,
          `• Tous les exercices de dressage`,
          `• Rappels santé et résumés mensuels`,
          "",
          `Pour continuer sans interruption, abonne-toi dès maintenant à partir de 5 €/mois.`,
          "",
          `→ Ouvre PawCoach et va dans Profil > Mon abonnement`,
          "",
          `— PawCoach 🐾`,
        ].join("\n");
      } else {
        subject = `🔔 Dernier jour ! L'essai Premium de ${dogName} expire demain`;
        body = [
          `Salut ${firstName} !`,
          "",
          `C'est le dernier jour de ton essai Premium PawCoach.`,
          "",
          `Demain, tu perdras l'accès à :`,
          `• Le chat IA illimité (retour à 5 messages/jour)`,
          `• Les scans alimentaires illimités (retour à 3/semaine)`,
          `• Les exercices avancés de dressage`,
          `• Les rappels santé automatiques`,
          "",
          `Abonne-toi maintenant pour ne rien perdre — à partir de 5 €/mois (59,99 €/an).`,
          "",
          `→ Ouvre PawCoach et va dans Profil > Mon abonnement`,
          "",
          `— PawCoach 🐾`,
        ].join("\n");
      }

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          from_name: "PawCoach",
          subject,
          body
        });
        console.log(`Trial reminder (${daysLeft}d) sent to ${user.email} for ${dogName}`);
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send to ${user.email}:`, emailErr.message);
      }
    }

    return Response.json({ ok: true, sent, total_users: users.length });

  } catch (error) {
    console.error("trialExpiryReminder error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
