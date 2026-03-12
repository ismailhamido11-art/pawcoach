import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Utensils, Dumbbell, MessageCircle, ChevronRight } from "lucide-react";
/**
 * BentoGrid — Navigation grid with PawMascot illustrations (DASH-07)
 */
const NAV_TILES = [
  { icon: Heart,         iconColor: "#2d9f82", label: "Santé",     sub: "Carnet, vaccins, poids",  page: "Sante",    mascot: "/mascot/paw-health.jpg",    gradient: "linear-gradient(135deg, #0f3d2e 0%, #1a5c42 50%, #0d4a35 100%)" },
  { icon: Utensils,      iconColor: "#059669", label: "Nutrition",  sub: "Scans, plans repas",      page: "Nutri",    mascot: "/mascot/paw-eating.jpg",    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)" },
  { icon: Dumbbell,      iconColor: "#6366f1", label: "Dressage",   sub: "Exercices, programmes",   page: "Activite", tab: "dressage", mascot: "/mascot/paw-training.jpg", gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)" },
  { icon: MessageCircle, iconColor: "#8b5cf6", label: "Chat IA",    sub: "Questions santé",         page: "Chat",     mascot: "/mascot/paw-curious.jpg",   gradient: "linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #6d28d9 100%)" },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function BentoGrid() {
  return (
    <div className="px-4">
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {NAV_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <motion.div key={tile.label} variants={item} whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}>
              <Link to={createPageUrl(tile.page) + (tile.tab ? `?tab=${tile.tab}` : "")}>
                <div
                  className="relative overflow-hidden rounded-2xl p-3.5 min-h-[150px] flex flex-col justify-between shadow-sm border transition-transform"
                  style={{
                    background: tile.gradient,
                    borderColor: `${tile.iconColor}40`,
                  }}
                >
                  {/* Decorative mascot — visible companion */}
                  <div className="absolute -bottom-3 -right-3 w-20 h-20 opacity-[0.55] pointer-events-none rounded-full overflow-hidden">
                    <img src={tile.mascot} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          background: `${tile.iconColor}35`,
                          border: `1.5px solid ${tile.iconColor}60`,
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: tile.iconColor }} />
                      </div>
                      <span className="text-sm font-bold text-white">{tile.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </div>
                  <p className="text-[11px] text-white/60 font-medium mt-2">{tile.sub}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
