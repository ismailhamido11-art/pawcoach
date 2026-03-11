import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

function getAllNextBadges({ streak, exercises, dailyLogs }) {
  const currentStreak = streak?.current_streak || 0;
  const completedExercises = (exercises || []).filter(e => e.completed).length;
  const walkDays = (dailyLogs || []).filter(l => (l.walk_minutes || 0) > 0).length;

  const candidates = [];

  // Streak badges
  if (currentStreak < 3)
    candidates.push({ emoji: "🔥", name: "En forme", current: currentStreak, target: 3, unit: "jours de streak", category: "Streak" });
  else if (currentStreak < 7)
    candidates.push({ emoji: "⚡", name: "Habitude", current: currentStreak, target: 7, unit: "jours de streak", category: "Streak" });
  else if (currentStreak < 30)
    candidates.push({ emoji: "👑", name: "Légende", current: currentStreak, target: 30, unit: "jours de streak", category: "Streak" });

  // Training badges
  if (completedExercises < 1)
    candidates.push({ emoji: "✨", name: "Coach débutant", current: 0, target: 1, unit: "programme", category: "Dressage" });
  else if (completedExercises < 3)
    candidates.push({ emoji: "🎓", name: "Coach expert", current: completedExercises, target: 3, unit: "programmes", category: "Dressage" });

  // Walk badges
  if (walkDays < 1)
    candidates.push({ emoji: "🐾", name: "Première balade", current: 0, target: 1, unit: "balade", category: "Activité" });
  else if (walkDays < 7)
    candidates.push({ emoji: "📅", name: "Régulier", current: walkDays, target: 7, unit: "jours de balade", category: "Activité" });

  // Sort by closest to completion
  return candidates.sort((a, b) => (b.current / (b.target || 1)) - (a.current / (a.target || 1)));
}

function BadgeRow({ badge }) {
  const progress = badge.target > 0 ? Math.round((badge.current / badge.target) * 100) : 0;
  const remaining = badge.target - badge.current;

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
        <span className="text-base">{badge.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-xs font-bold text-foreground truncate">{badge.name}</p>
          <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
            {badge.current}/{badge.target}
          </span>
        </div>
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(5, progress)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          encore {remaining} {badge.unit}
        </p>
      </div>
    </div>
  );
}

export default function BadgeTeaser({ streak, exercises, dailyLogs }) {
  const [expanded, setExpanded] = useState(false);
  const badges = getAllNextBadges({ streak, exercises, dailyLogs });

  if (badges.length === 0) return null;

  const first = badges[0];
  const rest = badges.slice(1);
  const progress = Math.round((first.current / first.target) * 100);
  const remaining = first.target - first.current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mx-4"
    >
      <div className="rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* Main teaser — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center gap-3 text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{first.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-foreground truncate">
                Prochain badge : {first.name}
              </p>
              <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                encore {remaining} {first.unit}
              </span>
            </div>
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, progress)}%` }}
                transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
          {rest.length > 0 && (
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            </motion.div>
          )}
        </button>

        {/* Expanded: other badges */}
        <AnimatePresence>
          {expanded && rest.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 border-t border-border/20 pt-2 space-y-0.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Autres badges à débloquer</p>
                {rest.map((badge) => (
                  <BadgeRow key={badge.name} badge={badge} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
