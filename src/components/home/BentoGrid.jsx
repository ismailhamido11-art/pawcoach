import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Utensils, Dumbbell, MessageCircle, ChevronRight } from "lucide-react";

/**
 * BentoGrid — Pure navigation grid (DASH-07: no scores, no duplication with DogRadarHero arcs)
 */
const NAV_TILES = [
  { icon: Heart,         iconColor: "#2d9f82", label: "Santé",     sub: "Carnet, vaccins, poids",  page: "Sante" },
  { icon: Utensils,      iconColor: "#059669", label: "Nutrition",  sub: "Scans, plans repas",      page: "Nutri" },
  { icon: Dumbbell,      iconColor: "#6366f1", label: "Dressage",   sub: "Exercices, programmes",   page: "Activite", tab: "dressage" },
  { icon: MessageCircle, iconColor: "#8b5cf6", label: "Chat IA",    sub: "Questions santé",         page: "Chat" },
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
                  className="relative overflow-hidden rounded-2xl p-3.5 min-h-[80px] flex flex-col justify-between shadow-sm border transition-transform"
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${tile.iconColor}08 100%)`,
                    borderColor: `${tile.iconColor}20`,
                  }}
                >
                  <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-[0.07]" style={{ background: tile.iconColor }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${tile.iconColor}20, ${tile.iconColor}10)`,
                          border: `1px solid ${tile.iconColor}25`,
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
