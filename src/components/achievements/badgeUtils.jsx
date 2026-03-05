import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const BADGE_META = {
  first_walk:        { name: "Première balade",    emoji: "🐾", points: 10,  category: "walk" },
  walk_30min:        { name: "Marcheur",            emoji: "👟", points: 20,  category: "walk" },
  walk_7days:        { name: "Régulier",            emoji: "📅", points: 50,  category: "walk" },
  walk_marathon:     { name: "Ultra Marcheur",      emoji: "🏅", points: 200, category: "walk" },
  first_program:     { name: "Coach débutant",      emoji: "✨", points: 15,  category: "training" },
  training_3programs:{ name: "Coach expert",        emoji: "🎓", points: 300, category: "training" },
  streak_3:          { name: "En forme",            emoji: "🔥", points: 30,  category: "streak" },
  streak_7:          { name: "Habitude",            emoji: "⚡", points: 75,  category: "streak" },
  streak_30:         { name: "Légende",             emoji: "👑", points: 250, category: "streak" },
  points_100:        { name: "100 points",          emoji: "⭐", points: 0,   category: "milestone" },
  points_500:        { name: "500 points",          emoji: "🌟", points: 0,   category: "milestone" },
  points_1000:       { name: "Maître PawCoach",     emoji: "💎", points: 0,   category: "milestone" },
};

async function checkPointMilestones(dogId, ownerEmail) {
  const all = await base44.entities.DogAchievement.filter({ dog_id: dogId });
  const total = (all || []).reduce((s, a) => s + (a.points_awarded || 0), 0);
  if (total >= 100) await unlockBadge(dogId, ownerEmail, "points_100");
  if (total >= 500) await unlockBadge(dogId, ownerEmail, "points_500");
  if (total >= 1000) await unlockBadge(dogId, ownerEmail, "points_1000");
}

export async function unlockBadge(dogId, ownerEmail, badgeId) {
  const meta = BADGE_META[badgeId];
  if (!meta) return;

  const existing = await base44.entities.DogAchievement.filter({ dog_id: dogId, badge_id: badgeId });
  if (existing && existing.length > 0) return;

  await base44.entities.DogAchievement.create({
    dog_id: dogId,
    owner_email: ownerEmail,
    badge_id: badgeId,
    badge_name: meta.name,
    badge_emoji: meta.emoji,
    points_awarded: meta.points,
    category: meta.category,
    unlocked_at: new Date().toISOString(),
  });

  toast.success(`${meta.emoji} Badge déverrouillé : ${meta.name}${meta.points > 0 ? ` (+${meta.points} pts)` : ""} !`, {
    duration: 4000,
  });

  if (meta.points > 0) await checkPointMilestones(dogId, ownerEmail);
}

export async function checkWalkBadges(dogId, ownerEmail, logs) {
  const totalMinutes = (logs || []).reduce((s, l) => s + (l.walk_minutes || 0), 0);
  const walkDays = (logs || []).filter(l => (l.walk_minutes || 0) > 0).length;
  const todayLog = logs?.[0];

  if (walkDays >= 1) await unlockBadge(dogId, ownerEmail, "first_walk");
  if (todayLog?.walk_minutes >= 30) await unlockBadge(dogId, ownerEmail, "walk_30min");
  if (totalMinutes >= 1000) await unlockBadge(dogId, ownerEmail, "walk_marathon");

  // Check 7 consecutive days
  if (logs && logs.length >= 7) {
    const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    let consecutive = 0;
    let prev = null;
    for (const log of sorted) {
      if (!log.walk_minutes || log.walk_minutes === 0) continue;
      if (!prev) { consecutive = 1; prev = log.date; continue; }
      const d1 = new Date(log.date), d2 = new Date(prev);
      const diff = Math.round((d2 - d1) / 86400000);
      if (diff === 1) { consecutive++; prev = log.date; }
      else break;
    }
    if (consecutive >= 7) await unlockBadge(dogId, ownerEmail, "walk_7days");
  }
}

export async function checkTrainingBadges(dogId, ownerEmail) {
  const existing = await base44.entities.DogAchievement.filter({ dog_id: dogId, badge_id: "first_program" });
  if (!existing || existing.length === 0) {
    await unlockBadge(dogId, ownerEmail, "first_program");
  } else if (existing.length >= 3) {
    await unlockBadge(dogId, ownerEmail, "training_3programs");
  }
}

export async function checkStreakBadges(dogId, ownerEmail) {
  const streaks = await base44.entities.Streak.filter({ dog_id: dogId });
  const streak = streaks?.[0];
  if (!streak) return;
  if (streak.current_streak >= 3) await unlockBadge(dogId, ownerEmail, "streak_3");
  if (streak.current_streak >= 7) await unlockBadge(dogId, ownerEmail, "streak_7");
  if (streak.current_streak >= 30) await unlockBadge(dogId, ownerEmail, "streak_30");
}