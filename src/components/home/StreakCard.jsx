import { motion } from "framer-motion";
import { Flame, Trophy, Zap } from "lucide-react";

const STREAK_LEVELS = [
  { min: 1,  max: 2,  label: "Débutant",    color: "#94a3b8", emoji: "🌱" },
  { min: 3,  max: 6,  label: "Régulier",    color: "#10b981", emoji: "🌿" },
  { min: 7,  max: 13, label: "Assidu",      color: "#3b82f6", emoji: "⚡" },
  { min: 14, max: 29, label: "Champion",    color: "#8b5cf6", emoji: "🏆" },
  { min: 30, max: 99, label: "Légendaire",  color: "#f59e0b", emoji: "🔥" },
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
      className="mx-5 bg-white rounded-3xl p-5 shadow-sm border border-border/30 overflow-hidden relative"
    >
      {/* Fond décoratif */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
        style={{ background: level.color }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-2xl">{level.emoji}</span>
            <div>
              <p className="font-bold text-foreground text-sm">{level.label}</p>
              <p className="text-xs text-muted-foreground">Niveau actuel</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black" style={{ color: level.color }}>{current}</p>
          <p className="text-xs text-muted-foreground font-medium">jours consécutifs</p>
        </div>
      </div>

      {/* Barre de progression vers le niveau suivant */}
      {nextLevel && (
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-muted-foreground">Prochain : {nextLevel.emoji} {nextLevel.label}</span>
            <span className="text-[10px] font-bold text-muted-foreground">{nextLevel.min - current} j restants</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Record perso */}
      {longest > 0 && (
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 relative z-10">
          <Trophy className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs text-muted-foreground">
            Record personnel : <strong className="text-foreground">{longest} jours</strong>
          </span>
        </div>
      )}
    </motion.div>
  );
}