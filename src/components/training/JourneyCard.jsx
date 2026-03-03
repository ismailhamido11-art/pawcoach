import { Lock, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function JourneyCard({ journey, completedCount, isPremium, isNext, onClick }) {
  const total = journey.exerciseOrders?.length ?? 0;
  const done = completedCount;
  const locked = journey.isPremium && !isPremium;
  const isComplete = done === total && total > 0;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full rounded-3xl border text-left transition-all shadow-sm overflow-hidden ${
        isComplete
          ? "bg-gradient-to-br from-safe/10 to-safe/5 border-safe/30"
          : isNext && !locked
          ? "bg-white border-primary/40 shadow-md shadow-primary/10"
          : locked
          ? "bg-muted/40 border-border"
          : "bg-white border-border"
      }`}
    >
      {/* Top section */}
      <div className="flex items-center gap-4 p-4">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
            locked
              ? "bg-muted"
              : isComplete
              ? "bg-safe/20"
              : "bg-gradient-to-br from-secondary to-secondary/40"
          }`}
        >
          {journey.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className={`font-bold text-base ${locked ? "text-muted-foreground" : "text-foreground"}`}>
              {journey.name}
            </p>
            {locked && (
              <span className="text-[10px] bg-accent/15 text-emerald-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <Lock className="w-2.5 h-2.5" /> Premium
              </span>
            )}
            {isComplete && (
              <span className="text-[10px] bg-safe/15 text-safe font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-2.5 h-2.5" /> Terminé
              </span>
            )}
            {isNext && !locked && !isComplete && (
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                En cours
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{journey.description}</p>
        </div>

        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${locked ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
      </div>

      {/* Progress bar */}
      <div className={`mx-4 mb-4 ${locked ? "opacity-40" : ""}`}>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>{done}/{total} exercices</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="bg-muted rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${isComplete ? "bg-safe" : "bg-primary"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>
    </motion.button>
  );
}