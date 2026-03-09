import { motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, ChevronRight } from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const URGENCY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-700",
    btnBg: "bg-red-600 hover:bg-red-700",
  },
  important: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    textColor: "text-amber-700",
    btnBg: "bg-amber-600 hover:bg-amber-700",
  },
  suggested: {
    icon: Info,
    bg: "bg-primary/5",
    border: "border-primary/20",
    iconColor: "text-primary",
    textColor: "text-primary",
    btnBg: "bg-primary hover:bg-primary/90",
  },
  none: {
    icon: CheckCircle,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconColor: "text-emerald-500",
    textColor: "text-emerald-700",
    btnBg: "",
  },
};

export default function NextActionCard({ action, onNavigate }) {
  if (!action) return null;

  const config = URGENCY_CONFIG[action.urgency] || URGENCY_CONFIG.suggested;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 }}
      className={`rounded-2xl border shadow-sm overflow-hidden ${config.bg} ${config.border}`}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${config.textColor}`}>{action.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {action.description}
            </p>
          </div>
        </div>

        {action.ctaLabel && onNavigate && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={spring}
            onClick={() => onNavigate(action.targetTab, action.targetKey)}
            className={`mt-3 w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold ${config.btnBg}`}
          >
            {action.ctaLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
