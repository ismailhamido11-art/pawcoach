import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Shield } from "lucide-react";
import { spring } from "@/lib/animations";

const SCORE_ICONS = {
  Excellent: ShieldCheck,
  Bon: ShieldCheck,
  "À améliorer": AlertTriangle,
  "Attention requise": AlertTriangle,
};

export default function HealthScoreCard({ score, scoreLevel, dogName }) {
  const Icon = SCORE_ICONS[scoreLevel.label] || Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.05 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${scoreLevel.border}`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${scoreLevel.bg}`}>
            <Icon className={`w-5 h-5 ${scoreLevel.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Bilan santé{dogName ? ` de ${dogName}` : ""}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-2xl font-black ${scoreLevel.color}`}>{score}</span>
              <span className="text-sm text-muted-foreground font-medium">/100</span>
              <span className={`text-xs font-bold ml-1 ${scoreLevel.color}`}>{scoreLevel.label}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ backgroundColor: scoreLevel.barColor }}
          />
        </div>
      </div>
    </motion.div>
  );
}
