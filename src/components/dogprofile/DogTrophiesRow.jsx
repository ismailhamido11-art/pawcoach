import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

function Trophy_({ emoji, label, earned }) {
  return (
    <div className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-20 ${!earned ? "opacity-35" : ""}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${earned ? "bg-emerald-50 border-emerald-200" : "bg-muted border-border"}`}>
        {emoji}
      </div>
      <p className="text-[10px] text-center text-muted-foreground font-medium leading-tight">{label}</p>
    </div>
  );
}

export default function DogTrophiesRow({ streak, progress, scansCount, dailyLogs }) {
  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  const exerciseCount = (progress || []).filter(p => p.completed).length;
  const walkDays = (dailyLogs || []).filter(l => (l.walk_minutes || 0) > 0).length;
  const totalWalkMin = (dailyLogs || []).reduce((s, l) => s + (l.walk_minutes || 0), 0);

  // Longest consecutive walk streak (aligned with badgeUtils walk_7days)
  const walkStreak = useMemo(() => {
    const dates = (dailyLogs || [])
      .filter(l => (l.walk_minutes || 0) > 0)
      .map(l => l.date)
      .sort((a, b) => b.localeCompare(a));
    if (dates.length === 0) return 0;
    let maxStreak = 1, curRun = 1;
    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i - 1]);
      const d2 = new Date(dates[i]);
      const diff = Math.round((d1 - d2) / 86400000);
      if (diff === 1) { curRun++; maxStreak = Math.max(maxStreak, curRun); }
      else curRun = 1;
    }
    return maxStreak;
  }, [dailyLogs]);

  const trophies = [
    { emoji: "🔥", label: "1er streak", earned: longest >= 1 },
    { emoji: "⚡", label: "7 jours", earned: longest >= 7 },
    { emoji: "🏅", label: "30 jours", earned: longest >= 30 },
    { emoji: "🐾", label: "1re balade", earned: walkDays >= 1 },
    { emoji: "👟", label: "30 min+", earned: (dailyLogs || []).some(l => l.walk_minutes >= 30) },
    { emoji: "📅", label: "7j de balade", earned: walkStreak >= 7 },
    { emoji: "🏅", label: "Ultra marcheur", earned: totalWalkMin >= 1000 },
    { emoji: "✨", label: "1er exercice", earned: exerciseCount >= 1 },
    { emoji: "🎓", label: "3 exercices", earned: exerciseCount >= 3 },
    { emoji: "🔍", label: "1er scan", earned: scansCount >= 1 },
    { emoji: "🧪", label: "5 scans", earned: scansCount >= 5 },
    { emoji: "💎", label: "100 jours", earned: longest >= 100 },
  ];

  const earnedCount = trophies.filter(t => t.earned).length;

  return (
    <div className="bg-white rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-emerald-500" />
        </div>
        <p className="font-bold text-sm text-foreground">Trophées</p>
        <span className="ml-auto text-xs text-muted-foreground">{earnedCount}/{trophies.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {trophies.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Trophy_ {...t} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}