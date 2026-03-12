import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ScanLine, Scale, Dumbbell, MapPin, BookOpen } from "lucide-react";

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
                className="flex flex-col items-center gap-1.5 w-[56px] py-1"
              >
                <div className="relative">
                  {/* Subtle pulse ring on idle */}
                  <motion.div
                    className="absolute inset-[-3px] rounded-2xl opacity-0"
                    animate={{ opacity: [0, 0.3, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                    style={{ background: `radial-gradient(circle, ${action.color}20 0%, transparent 70%)` }}
                  />
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border relative"
                    style={{
                      background: `linear-gradient(135deg, ${action.color}18, ${action.color}08)`,
                      borderColor: `${action.color}25`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: action.color }} />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
