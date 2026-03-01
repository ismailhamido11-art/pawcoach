import { Lock, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function JourneyCard({ journey, completedCount, isPremium, onClick }) {
  const total = journey.exerciseOrders?.length ?? 0;
  const done = completedCount;
  const locked = journey.isPremium && !isPremium;
  const pct = total > 0 ? done / total : 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all shadow-sm ${
        locked
          ? "bg-muted/50 border-border opacity-70"
          : done === total && total > 0
          ? "bg-safe/5 border-safe/30"
          : "bg-white border-border"
      }`}
    >
      {/* Emoji badge */}
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
          locked ? "bg-muted" : "bg-gradient-to-br from-secondary to-secondary/50"
        }`}
      >
        {journey.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`font-bold text-sm ${locked ? "text-muted-foreground" : "text-foreground"}`}>
            {journey.name}
          </p>
          {locked && (
            <span className="text-[10px] bg-accent/15 text-accent font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Premium
            </span>
          )}
          {done === total && total > 0 && (
            <span className="text-[10px] bg-safe/15 text-safe font-bold px-2 py-0.5 rounded-full">
              ✓ Terminé
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-2">{journey.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {journey.exercises.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < done
                  ? "bg-primary scale-110"
                  : i === done && !locked
                  ? "bg-primary/40 ring-2 ring-primary/30"
                  : "bg-muted-foreground/25"
              }`}
            />
          ))}
          <span className="ml-1 text-[10px] text-muted-foreground font-medium">
            {done}/{total}
          </span>
        </div>
      </div>

      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${locked ? "text-muted-foreground/40" : "text-muted-foreground"}`} />
    </motion.button>
  );
}