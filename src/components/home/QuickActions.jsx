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
                className="flex flex-col items-center gap-1.5 w-[60px] py-1"
              >
                <div className="relative">
                  {/* Pulse ring */}
                  <motion.div
                    className="absolute inset-[-4px] rounded-2xl"
                    animate={{ opacity: [0, 0.5, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                    style={{ background: `${action.color}30` }}
                  />
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md relative"
                    style={{
                      background: `linear-gradient(135deg, ${action.color}cc, ${action.color}99)`,
                      border: `1.5px solid ${action.color}`,
                    }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-foreground">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
