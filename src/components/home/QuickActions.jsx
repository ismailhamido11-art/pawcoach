import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ScanLine, Scale, Dumbbell, MapPin, BookOpen } from "lucide-react";
import { hoverGlow } from "@/lib/animations";

const ACTIONS = [
  { icon: ScanLine, label: "Scanner", page: "Scan", color: "#059669" },
  { icon: Scale, label: "Peser", page: "Sante", tab: "weight", color: "#2d9f82" },
  { icon: Dumbbell, label: "Exercice", page: "Activite", tab: "dressage", color: "#6366f1" },
  { icon: MapPin, label: "Véto", page: "FindVet", color: "#3b82f6" },
  { icon: BookOpen, label: "Guides", page: "Library", color: "#8b5cf6" },
];

export default function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4"
    >
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.92 }}
              className="flex-shrink-0"
            >
              <Link
                to={createPageUrl(action.page) + (action.tab ? `?tab=${action.tab}` : "")}
                className="flex flex-col items-center gap-1.5 w-[60px] py-1"
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.06)] bg-white border border-border/20 relative"
                  {...hoverGlow}
                >
                  <Icon className="w-6 h-6" style={{ color: action.color }} />
                </motion.div>
                <span className="text-[11px] font-semibold text-foreground/70">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
