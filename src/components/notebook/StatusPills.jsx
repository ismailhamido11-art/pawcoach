import { motion } from "framer-motion";
import { Syringe, Weight, Stethoscope } from "lucide-react";
import { spring } from "@/lib/animations";

const PILL_ICONS = {
  vaccines: Syringe,
  weight: Weight,
  vet: Stethoscope,
};

const STATUS_STYLES = {
  good: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-400" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  alert: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400" },
  empty: { bg: "bg-secondary", text: "text-muted-foreground", border: "border-border", dot: "bg-muted-foreground" },
};

export default function StatusPills({ pills, onPillClick }) {
  if (!pills || pills.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.15 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      {pills.map((pill, _i) => {
        const style = STATUS_STYLES[pill.status] || STATUS_STYLES.empty;
        const Icon = PILL_ICONS[pill.id];

        return (
          <motion.button
            key={pill.id}
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => onPillClick?.(pill.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border ${style.bg} ${style.border} transition-colors`}
          >
            {Icon && <Icon className={`w-3.5 h-3.5 ${style.text}`} />}
            <div className="text-left">
              <p className={`text-[10px] font-bold ${style.text} leading-none`}>{pill.label}</p>
              <p className={`text-[10px] font-medium ${style.text} opacity-70 mt-0.5 leading-none`}>{pill.value}</p>
            </div>
            <div className={`w-1.5 h-1.5 rounded-full ${style.dot} ml-0.5`} />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
