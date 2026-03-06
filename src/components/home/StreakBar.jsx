import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

const LEVELS = [
  { min: 1,  max: 2,  label: "Debutant",   color: "#94a3b8" },
  { min: 3,  max: 6,  label: "Regulier",   color: "#10b981" },
  { min: 7,  max: 13, label: "Assidu",     color: "#3b82f6" },
  { min: 14, max: 29, label: "Champion",   color: "#8b5cf6" },
  { min: 30, max: 99, label: "Legendaire", color: "#d97706" },
  { min: 100, max: Infinity, label: "Mythique", color: "#ef4444" },
];

export default function StreakBar({ streak }) {
  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  if (current === 0) return null;

  const level = LEVELS.find(l => current >= l.min && current <= l.max) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progress = nextLevel ? ((current - level.min) / (nextLevel.min - level.min)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mx-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-border/30 px-4 py-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4" style={{ color: level.color }} />
          <span className="text-lg font-black" style={{ color: level.color }}>{current}</span>
          <span className="text-xs text-muted-foreground font-medium">jours</span>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold" style={{ color: level.color }}>{level.label}</span>
            {nextLevel && (
              <span className="text-[10px] text-muted-foreground">{nextLevel.label} dans {nextLevel.min - current}j</span>
            )}
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
            />
          </div>
        </div>

        {current >= longest && longest > 1 && (
          <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
            <Trophy className="w-3 h-3 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-600">Record</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
