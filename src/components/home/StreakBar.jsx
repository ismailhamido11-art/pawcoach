import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, Trophy, Footprints } from "lucide-react";

const LEVELS = [
  { min: 1,  max: 2,  label: "Débutant",   color: "#94a3b8" },
  { min: 3,  max: 6,  label: "Régulier",   color: "#10b981" },
  { min: 7,  max: 13, label: "Assidu",     color: "#3b82f6" },
  { min: 14, max: 29, label: "Champion",   color: "#8b5cf6" },
  { min: 30, max: 99, label: "Légendaire", color: "#d97706" },
  { min: 100, max: Infinity, label: "Mythique", color: "#ef4444" },
];

function getNextBadge({ streak, exercises, dailyLogs }) {
  const currentStreak = streak?.current_streak || 0;
  const completedExercises = (exercises || []).filter(e => e.completed).length;
  const walkDays = (dailyLogs || []).filter(l => (l.walk_minutes || 0) > 0).length;
  const candidates = [];

  if (currentStreak < 3) candidates.push({ emoji: "🔥", name: "En forme", current: currentStreak, target: 3 });
  else if (currentStreak < 7) candidates.push({ emoji: "⚡", name: "Habitude", current: currentStreak, target: 7 });
  else if (currentStreak < 30) candidates.push({ emoji: "👑", name: "Légende", current: currentStreak, target: 30 });

  if (completedExercises < 1) candidates.push({ emoji: "✨", name: "Coach débutant", current: 0, target: 1 });
  else if (completedExercises < 3) candidates.push({ emoji: "🎓", name: "Coach expert", current: completedExercises, target: 3 });

  if (walkDays < 1) candidates.push({ emoji: "🐾", name: "1re balade", current: 0, target: 1 });
  else if (walkDays < 7) candidates.push({ emoji: "📅", name: "Régulier", current: walkDays, target: 7 });

  return candidates.sort((a, b) => (b.current / b.target) - (a.current / a.target))[0] || null;
}

export default function StreakBar({ streak, walkStreak = 0, exercises, dailyLogs }) {
  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  const nextBadge = getNextBadge({ streak, exercises, dailyLogs });
  if (current === 0 && walkStreak < 2 && !nextBadge) return null;

  const level = current > 0 ? (LEVELS.find(l => current >= l.min && current <= l.max) || LEVELS[0]) : null;
  const nextLevel = level ? LEVELS[LEVELS.indexOf(level) + 1] : null;
  const progress = nextLevel && level ? ((current - level.min) / (nextLevel.min - level.min)) * 100 : (level ? 100 : 0);

  return (
    <div className="mx-4 space-y-2">
      {/* Check-in streak */}
      {current > 0 && level && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border px-4 py-3 shadow-sm relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${level.color}06 100%)`,
            borderColor: `${level.color}20`,
          }}
        >
          <div
            className="absolute -top-4 -left-4 w-16 h-16 rounded-full opacity-[0.07]"
            style={{ background: level.color }}
          />

          <div className="relative flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${level.color}20, ${level.color}10)`,
                  border: `1px solid ${level.color}25`,
                }}
              >
                <Flame className="w-4 h-4" style={{ color: level.color }} />
              </div>
              <span className="text-lg font-black" style={{ color: level.color }}>{current}</span>
              <span className="text-[10px] text-muted-foreground font-medium">jours</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold" style={{ color: level.color }}>{level.label}</span>
                {nextLevel && (
                  <span className="text-[10px] text-muted-foreground">{nextLevel.label} dans {nextLevel.min - current}j</span>
                )}
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${level.color}, ${level.color}cc)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
                />
              </div>
            </div>

            {current >= longest && longest > 1 && (
              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <Trophy className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600">Record</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Walk streak chip — merged from standalone badge (DASH-06) */}
      {walkStreak >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2"
        >
          <Footprints className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-bold text-blue-700">{walkStreak}j de balade d'affilee</span>
          {walkStreak >= 7 && <span className="text-xs font-bold text-blue-500 ml-auto">Record !</span>}
        </motion.div>
      )}

      {/* Next badge chip — compact teaser (DASH-10: merged from BadgeTeaser) */}
      {nextBadge && (
        <Link to={createPageUrl("Achievements")}>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2"
          >
            <span className="text-base leading-none">{nextBadge.emoji}</span>
            <span className="text-xs font-bold text-foreground flex-1 truncate">
              {nextBadge.name}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-12 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  style={{ width: `${Math.max(5, Math.round((nextBadge.current / nextBadge.target) * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-amber-600 font-bold">{nextBadge.current}/{nextBadge.target}</span>
            </div>
          </motion.div>
        </Link>
      )}
    </div>
  );
}
