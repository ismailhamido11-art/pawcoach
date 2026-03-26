import { DogAchievement, UserProgress, Streak } from "@/api/entities";
import { toast } from "sonner";
import { PawPrint, Footprints, Calendar, Medal, Sparkles, GraduationCap, Flame, Zap, Crown, Star, Diamond } from "lucide-react";

export const BADGE_META = {
  first_walk:        { name: "Première balade",    Icon: PawPrint,      color: "text-emerald-600", points: 10,  category: "walk" },
  walk_30min:        { name: "Marcheur",            Icon: Footprints,    color: "text-emerald-600", points: 20,  category: "walk" },
  walk_7days:        { name: "Régulier",            Icon: Calendar,      color: "text-blue-600",    points: 50,  category: "walk" },
  walk_marathon:     { name: "Ultra Marcheur",      Icon: Medal,         color: "text-amber-600",   points: 200, category: "walk" },
  first_program:     { name: "Coach débutant",      Icon: Sparkles,      color: "text-violet-500",  points: 15,  category: "training" },
  training_3programs:{ name: "Coach expert",        Icon: GraduationCap, color: "text-indigo-600",  points: 300, category: "training" },
  streak_3:          { name: "En forme",            Icon: Flame,         color: "text-orange-500",  points: 30,  category: "streak" },
  streak_7:          { name: "Habitude",            Icon: Zap,           color: "text-amber-500",   points: 75,  category: "streak" },
  streak_30:         { name: "Légende",             Icon: Crown,         color: "text-amber-600",   points: 250, category: "streak" },
  points_100:        { name: "100 points",          Icon: Star,          color: "text-amber-500",   points: 0,   category: "milestone" },
  points_500:        { name: "500 points",          Icon: Star,          color: "text-amber-400",   points: 0,   category: "milestone" },
  points_1000:       { name: "Maître PawCoach",     Icon: Diamond,       color: "text-violet-500",  points: 0,   category: "milestone" },
};

export function renderBadgeIcon(badge, size = 16) {
  const I = badge.Icon;
  return <I className={`w-${size / 4} h-${size / 4} ${badge.color}`} />;
}

async function checkPointMilestones(dogId, ownerEmail) {
  const all = await DogAchievement.filter({ dog_id: dogId });
  const total = (all || []).reduce((s, a) => s + (a.points_awarded || 0), 0);
  if (total >= 100) await unlockBadge(dogId, ownerEmail, "points_100");
  if (total >= 500) await unlockBadge(dogId, ownerEmail, "points_500");
  if (total >= 1000) await unlockBadge(dogId, ownerEmail, "points_1000");
}

export async function unlockBadge(dogId, ownerEmail, badgeId) {
  const meta = BADGE_META[badgeId];
  if (!meta) return;

  const existing = await DogAchievement.filter({ dog_id: dogId, badge_id: badgeId });
  if (existing && existing.length > 0) return;

  await DogAchievement.create({
    dog_id: dogId,
    owner_email: ownerEmail,
    badge_id: badgeId,
    badge_name: meta.name,
    badge_emoji: meta.name,
    points_awarded: meta.points,
    category: meta.category,
    unlocked_at: new Date().toISOString(),
  });

  toast.success(`Badge déverrouillé : ${meta.name}${meta.points > 0 ? ` (+${meta.points} pts)` : ""} !`, {
    duration: 4000,
  });

  if (meta.points > 0) await checkPointMilestones(dogId, ownerEmail);
}

export async function checkWalkBadges(dogId, ownerEmail, logs) {
  const totalMinutes = (logs || []).reduce((s, l) => s + (l.walk_minutes || 0), 0);
  const walkDays = (logs || []).filter(l => (l.walk_minutes || 0) > 0).length;

  if (walkDays >= 1) await unlockBadge(dogId, ownerEmail, "first_walk");
  if ((logs || []).some(l => (l.walk_minutes || 0) >= 30)) await unlockBadge(dogId, ownerEmail, "walk_30min");
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
  // Count completed training programs (not badge records)
  const progress = await UserProgress.filter({ dog_id: dogId, completed: true });
  const completedCount = progress?.length || 0;
  if (completedCount >= 1) await unlockBadge(dogId, ownerEmail, "first_program");
  if (completedCount >= 3) await unlockBadge(dogId, ownerEmail, "training_3programs");
}

export async function checkStreakBadges(dogId, ownerEmail) {
  const streaks = await Streak.filter({ dog_id: dogId });
  const streak = streaks?.[0];
  if (!streak) return;
  if ((streak.current_streak >= 3) || (streak.longest_streak >= 3)) await unlockBadge(dogId, ownerEmail, "streak_3");
  if ((streak.current_streak >= 7) || (streak.longest_streak >= 7)) await unlockBadge(dogId, ownerEmail, "streak_7");
  if ((streak.current_streak >= 30) || (streak.longest_streak >= 30)) await unlockBadge(dogId, ownerEmail, "streak_30");
}
