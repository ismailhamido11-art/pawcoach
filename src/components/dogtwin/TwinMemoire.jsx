import { motion } from "framer-motion";
import { Clock, Syringe, UtensilsCrossed, Stethoscope, TrendingUp, Sparkles } from "lucide-react";

const TIMELINE = [
  {
    date: "2 mars 2026",
    type: "correlation",
    icon: Sparkles,
    color: "#a78bfa",
    title: "IA détecte une corrélation",
    desc: "Depuis le changement de croquettes Royal Canin Maxi (+18 j), l'énergie matinale de Max a augmenté de +23%.",
    ai: true,
  },
  {
    date: "14 fév 2026",
    type: "food",
    icon: UtensilsCrossed,
    color: "#f59e0b",
    title: "Changement d'alimentation",
    desc: "Passage de Purina Pro à Royal Canin Maxi Adult 26. Transition progressive sur 7 jours.",
    ai: false,
  },
  {
    date: "3 fév 2026",
    type: "vet",
    icon: Stethoscope,
    color: "#60a5fa",
    title: "Visite vétérinaire",
    desc: "Dr. Martin — Bilan annuel. Tout normal. Légère surcharge pondérale (+0.8 kg). Conseille de réduire les friandises.",
    ai: false,
  },
  {
    date: "20 jan 2026",
    type: "vaccine",
    icon: Syringe,
    color: "#34d399",
    title: "Rappel vaccin CHPPi",
    desc: "Vaccin annuel administré par Dr. Martin. Prochain rappel : janvier 2027.",
    ai: false,
  },
  {
    date: "8 jan 2026",
    type: "alert",
    icon: TrendingUp,
    color: "#ff6b8a",
    title: "Pic d'énergie inhabituel",
    desc: "3 jours consécutifs avec énergie score > 95. IA note : coïncide avec visite d'un autre chien à la maison.",
    ai: true,
  },
];

export default function TwinMemoire() {
  return (
    <div className="px-4 pt-3 pb-8 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Mémoire vivante</p>
          <p className="text-white/40 text-[10px]">Historique annoté par l'IA</p>
        </div>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />

        <div className="space-y-4">
          {TIMELINE.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative flex gap-4 pl-10"
              >
                {/* Dot on line */}
                <div
                  className="absolute left-0 w-8 h-8 rounded-xl flex items-center justify-center border"
                  style={{
                    background: item.color + "20",
                    borderColor: item.color + "40",
                    boxShadow: item.ai ? `0 0 10px ${item.color}44` : "none",
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                </div>

                {/* Card */}
                <div
                  className="flex-1 rounded-2xl p-3.5"
                  style={{
                    background: item.ai ? item.color + "10" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${item.ai ? item.color + "30" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-white font-bold text-xs leading-snug flex-1">{item.title}</p>
                    {item.ai && (
                      <span
                        className="flex-shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: item.color + "30", color: item.color }}
                      >
                        IA
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">{item.desc}</p>
                  <p className="text-white/25 text-[10px] mt-1.5">{item.date}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}