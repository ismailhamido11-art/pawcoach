import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Utensils, Dumbbell, MessageCircle, ChevronRight } from "lucide-react";
/**
 * BentoGrid — Navigation grid with PawMascot illustrations (DASH-07)
 */
const NAV_TILES = [
  { icon: Heart,         iconColor: "#2d9f82", label: "Santé",     sub: "Carnet, vaccins, poids",  page: "Sante",    mascot: "/mascot/paw-health.jpg" },
  { icon: Utensils,      iconColor: "#059669", label: "Nutrition",  sub: "Scans, plans repas",      page: "Nutri",    mascot: "/mascot/paw-eating.jpg" },
  { icon: Dumbbell,      iconColor: "#6366f1", label: "Dressage",   sub: "Exercices, programmes",   page: "Activite", tab: "dressage", mascot: "/mascot/paw-training.jpg" },
  { icon: MessageCircle, iconColor: "#8b5cf6", label: "Chat IA",    sub: "Questions santé",         page: "Chat",     mascot: "/mascot/paw-curious.jpg" },
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
            <motion.div key={tile.label} variants={item} whileTap={{ scale: 0.96 }}>
              <Link to={createPageUrl(tile.page) + (tile.tab ? `?tab=${tile.tab}` : "")}>
                <div
                  className="relative overflow-hidden rounded-2xl p-3.5 min-h-[100px] flex flex-col justify-between shadow-sm border transition-transform"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${tile.iconColor}08 100%)`,
                    borderColor: `${tile.iconColor}20`,
                  }}
                >
                  {/* Decorative mascot — emotional warmth */}
                  <div className="absolute -bottom-2 -right-2 w-14 h-14 opacity-[0.15] pointer-events-none rounded-full overflow-hidden">
                    <img src={tile.mascot} alt="" className="w-full h-full object-cover" draggable={false} />
                  </div>
                  <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-[0.05]" style={{ background: tile.iconColor }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${tile.iconColor}25, ${tile.iconColor}12)`,
                          border: `1px solid ${tile.iconColor}30`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: tile.iconColor }} />
                      </div>
                      <span className="text-xs font-bold text-foreground">{tile.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium mt-2">{tile.sub}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
