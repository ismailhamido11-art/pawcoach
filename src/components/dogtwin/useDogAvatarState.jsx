/**
 * Hook : calcule le healthScore et le mood à partir des vraies données
 * Sources : DailyCheckin, Streak, HealthRecord, FoodScan
 */
export function useDogAvatarState({ checkins = [], streak = null, records = [], scans = [] }) {
  // --- MOOD (basé sur les 2 derniers check-ins) ---
  const lastTwo = checkins.slice(-2);
  let mood = "neutral";

  if (lastTwo.length > 0) {
    const latest = lastTwo[lastTwo.length - 1];
    const avgMood = lastTwo.reduce((s, c) => s + (c.mood || 2), 0) / lastTwo.length;
    const avgEnergy = lastTwo.reduce((s, c) => s + (c.energy || 2), 0) / lastTwo.length;

    if (avgMood >= 3.5 && avgEnergy >= 2.5) mood = "excited";
    else if (avgMood >= 2.8 && avgEnergy >= 2) mood = "happy";
    else if (avgMood <= 1.5 || avgEnergy <= 1.3) mood = "tired";
    else mood = "neutral";
  }

  // --- HEALTH SCORE ---
  let score = 50; // base
  let factors = 0;

  // 1. Checkins récents (30 pts max)
  if (checkins.length > 0) {
    const recentCheckins = checkins.slice(-7);
    const avgMood = recentCheckins.reduce((s, c) => s + (c.mood || 2), 0) / recentCheckins.length;
    const avgEnergy = recentCheckins.reduce((s, c) => s + (c.energy || 2), 0) / recentCheckins.length;
    const avgAppetite = recentCheckins.reduce((s, c) => s + (c.appetite || 2), 0) / recentCheckins.length;
    // mood: 1-4 → 0-10, energy: 1-3 → 0-10, appetite: 1-3 → 0-10
    score += ((avgMood - 1) / 3) * 12;
    score += ((avgEnergy - 1) / 2) * 10;
    score += ((avgAppetite - 1) / 2) * 8;
    factors += 30;
  }

  // 2. Streak (15 pts max)
  if (streak) {
    const streakScore = Math.min(streak.current_streak / 14, 1) * 15;
    score += streakScore;
    factors += 15;
  }

  // 3. Vaccins à jour (10 pts)
  const vaccines = records.filter(r => r.type === "vaccine");
  const hasRecentVaccine = vaccines.some(v => {
    if (!v.date) return false;
    const diffDays = (Date.now() - new Date(v.date).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < 365;
  });
  if (hasRecentVaccine) score += 10;
  factors += 10;

  // Normalise entre 40-98
  const rawScore = score;
  const normalized = Math.min(98, Math.max(40, Math.round(rawScore)));

  return { healthScore: normalized, mood };
}