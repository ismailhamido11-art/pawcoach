import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

function getNextBadge({ streak, exercises, dailyLogs }) {
  const currentStreak = streak?.current_streak || 0;
  const completedExercises = (exercises || []).filter(e => e.completed).length;
  const walkDays = (dailyLogs || []).filter(l => (l.walk_minutes || 0) > 0).length;

  const candidates = [];

  // Streak badges
  if (currentStreak < 3)
    candidates.push({ emoji: "\uD83D\uDD25", name: "En forme", current: currentStreak, target: 3, unit: "jours de streak" });
  else if (currentStreak < 7)
    candidates.push({ emoji: "\u26A1", name: "Habitude", current: currentStreak, target: 7, unit: "jours de streak" });
  else if (currentStreak < 30)
    candidates.push({ emoji: "\uD83D\uDC51", name: "Legende", current: currentStreak, target: 30, unit: "jours de streak" });

  // Training badges
  if (completedExercises < 1)
    candidates.push({ emoji: "\u2728", name: "Coach debutant", current: 0, target: 1, unit: "programme complete" });
  else if (completedExercises < 3)
    candidates.push({ emoji: "\uD83C\uDF93", name: "Coach expert", current: completedExercises, target: 3, unit: "programmes completes" });

  // Walk badges
  if (walkDays < 1)
    candidates.push({ emoji: "\uD83D\uDC3E", name: "Premiere balade", current: 0, target: 1, unit: "balade logguee" });
  else if (walkDays < 7)
    candidates.push({ emoji: "\uD83D\uDCC5", name: "Regulier", current: walkDays, target: 7, unit: "jours de balade" });

  if (candidates.length === 0) return null;

  // Return the one closest to completion
  return candidates.sort((a, b) => (b.current / b.target) - (a.current / a.target))[0];
}

export default function BadgeTeaser({ streak, exercises, dailyLogs }) {
  const next = getNextBadge({ streak, exercises, dailyLogs });
  if (!next) return null;

  const progress = Math.round((next.current / next.target) * 100);
  const remaining = next.target - next.current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mx-4"
    >
      <Link to={createPageUrl("Profile")}>
        <div className="rounded-2xl border border-border/30 bg-white/80 backdrop-blur-sm px-4 py-3 shadow-sm flex items-center gap-3">
          {/* Badge emoji */}
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{next.emoji}</span>
          </div>

          {/* Info + progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-bold text-foreground truncate">
                Prochain badge : {next.name}
              </p>
              <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                {remaining} {next.unit.split(" ").slice(-1)}
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

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
