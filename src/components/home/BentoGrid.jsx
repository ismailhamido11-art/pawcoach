import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Utensils, Dumbbell, MessageCircle, ChevronRight } from "lucide-react";
import { tapScale, hoverGlow } from "@/lib/animations";
/**
 * BentoGrid — Navigation grid premium light (fond blanc, ombres douces)
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
      <p className="text-xs font-semibold text-muted-foreground mb-2">Explorer</p>
      <motion.div
        className="grid grid-cols-2 gap-3"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {NAV_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.label}
              variants={item}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(26,77,62,0.15)" }}
            >
              <Link to={createPageUrl(tile.page) + (tile.tab ? `?tab=${tile.tab}` : "")}>
                <div
                  className="relative overflow-hidden rounded-2xl p-4 min-h-[110px] flex flex-col justify-between bg-white border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-transform"
                >
                  {/* Tache de couleur douce en arriere-plan */}
                  <div
                    className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-[0.08]"
                    style={{ background: tile.iconColor }}
                  />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: tile.iconColor + "15", border: `1.5px solid ${tile.iconColor}30` }}
                      >
                        <Icon style={{ color: tile.iconColor, width: 18, height: 18 }} />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{tile.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-2">{tile.sub}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
