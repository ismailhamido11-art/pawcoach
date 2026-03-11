import { base44 } from "@/api/base44Client";
import { getTodayString } from "@/utils/recommendations";

export async function updateStreakSilently(dogId, ownerEmail) {
  try {
    const today = getTodayString();
    const streaks = await base44.entities.Streak.filter({ dog_id: dogId });
    if (streaks?.length > 0) {
      const s = streaks[0];
      if (s.last_activity_date === today) return; // Already updated today — dedup guard
      const lastDate = new Date(s.last_activity_date + "T12:00:00");
      const todayDate = new Date(today + "T12:00:00");
      const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      let newStreak = s.current_streak;
      let graceDaysUsed = s.grace_days_used || 0;
      let graceDaysRemaining = s.grace_days_remaining ?? 1;
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays === 2 && graceDaysRemaining > 0) {
        newStreak += 1;
        graceDaysUsed += 1;
        graceDaysRemaining -= 1;
      } else {
        newStreak = 1;
        graceDaysUsed = 0;
        graceDaysRemaining = 1;
      }
      const newLongest = Math.max(s.longest_streak || 0, newStreak);
      await base44.entities.Streak.update(s.id, {
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
        grace_days_used: graceDaysUsed,
        grace_days_remaining: graceDaysRemaining,
      });
    } else {
      await base44.entities.Streak.create({
        dog_id: dogId,
        owner_email: ownerEmail,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
        grace_days_used: 0,
        grace_days_remaining: 1,
      });
    }
  } catch (e) {
    console.warn("Streak update failed:", e?.message || String(e));
  }
}