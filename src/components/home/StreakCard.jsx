import { motion } from "framer-motion";
import { Trophy, Flame } from "lucide-react";

const STREAK_LEVELS = [
  { min: 1,  max: 2,  label: "Débutant",   color: "#94a3b8", emoji: "🌱" },
  { min: 3,  max: 6,  label: "Régulier",   color: "#10b981", emoji: "🌿" },
  { min: 7,  max: 13, label: "Assidu",     color: "#3b82f6", emoji: "⚡" },
  { min: 14, max: 29, label: "Champion",   color: "#8b5cf6", emoji: "🏆" },
  { min: 30, max: 99, label: "Légendaire", color: "#f59e0b", emoji: "🔥" },
  { min: 100, max: Infinity, label: "Mythique", color: "#ef4444", emoji: "🚀" },
];

export default function StreakCard({ streak }) {
  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  if (current === 0) return null;

  const level = STREAK_LEVELS.find(l => current >= l.min && current <= l.max) || STREAK_LEVELS[0];
  const nextLevel = STREAK_LEVELS[STREAK_LEVELS.indexOf(level) + 1];
  const progress = nextLevel ? ((current - level.min) / (nextLevel.min - level.min)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, type: "spring" }}
      className="mx-5 rounded-3xl overflow-hidden shadow-sm border border-border/30"
      style={{ background: "white" }}
    >
      {/* Top accent */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${level.color}, ${level.color}66)` }} />

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${level.color}15` }}>
              {level.emoji}
            </div>
            <div>
              <p className="font-black text-foreground text-sm">{level.label}</p>
              <p className="text-xs text-muted-foreground">Niveau en cours</p>
            </div>
          </div>
          <div className="text-right">
            <motion.p
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-4xl font-black leading-none"
              style={{ color: level.color }}
            >
              {current}
            </motion.p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">jours consécutifs</p>
          </div>
        </div>

        {/* Progress to next level */}
        {nextLevel && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">Prochain niveau : {nextLevel.emoji} {nextLevel.label}</span>
              <span className="text-[11px] font-bold" style={{ color: level.color }}>{nextLevel.min - current}j</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${level.color}, ${level.color}bb)` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ delay: 0.6, duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Record */}
        {longest > 0 && (
          <div className="flex items-center gap-1.5 pt-3 border-t border-border/40">
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-muted-foreground">
              Record : <strong className="text-foreground">{longest} jours</strong>
            </span>
            {current >= longest && current > 0 && (
              <span className="ml-auto text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                🏆 Nouveau record !
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}