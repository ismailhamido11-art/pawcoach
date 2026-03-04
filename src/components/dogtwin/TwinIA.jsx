import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, AlertTriangle, Lightbulb, Users, Calendar } from "lucide-react";

const PATTERNS = [
  {
    type: "warning",
    icon: TrendingDown,
    color: "#f59e0b",
    title: "Énergie basse le mercredi",
    desc: "Depuis 3 semaines, Max montre 23% moins d'énergie chaque mercredi. Corrélation possible avec les sorties du mardi soir ?",
    confidence: 84,
    days: 21,
  },
  {
    type: "positive",
    icon: TrendingUp,
    color: "#34d399",
    title: "Nutrition améliorée",
    desc: "Depuis le changement de croquettes il y a 18 jours, son appétit a augmenté de +31% et son énergie matin de +18%.",
    confidence: 91,
    days: 18,
  },
  {
    type: "alert",
    icon: AlertTriangle,
    color: "#ff6b8a",
    title: "Pré-alerte digestive",
    desc: "Combinaison inhabituelle : appétit réduit + baisse d'activité sur 2 jours. Surveille les selles et l'hydratation.",
    confidence: 67,
    days: 2,
  },
];

const BENCHMARK = [
  { label: "Énergie", max: 82, score: 81, unit: "vs Labradors 3 ans" },
  { label: "Appétit", max: 88, score: 74, unit: "vs Labradors 3 ans" },
  { label: "Activité", max: 75, score: 81, unit: "vs Labradors 3 ans" },
];

export default function TwinIA() {
  return (
    <div className="px-4 pt-3 pb-8 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Cerveau IA</p>
          <p className="text-white/40 text-[10px]">Analyse sur 90 jours · Mis à jour il y a 2h</p>
        </div>
      </div>

      {/* Patterns */}
      {PATTERNS.map((p, i) => {
        const Icon = p.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-4"
            style={{ background: p.color + "12", border: `1px solid ${p.color}30` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: p.color + "25" }}>
                <Icon className="w-4 h-4" style={{ color: p.color }} />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{p.title}</p>
                <p className="text-white/55 text-xs mt-1 leading-relaxed">{p.desc}</p>
                <div className="flex items-center gap-3 mt-2.5">
                  {/* Confidence bar */}
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-white/30 uppercase tracking-wider">Confiance IA</span>
                      <span className="text-[10px] font-bold" style={{ color: p.color }}>{p.confidence}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.confidence}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-white/30" />
                    <span className="text-[10px] text-white/30">{p.days}j</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Benchmark */}
      <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-xs font-semibold">Comparaison anonyme · 10 847 chiens</span>
        </div>
        <div className="space-y-3">
          {BENCHMARK.map((b, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className="text-white/70 text-xs font-medium">{b.label}</span>
                <span className="text-[10px] text-white/30">{b.unit}</span>
              </div>
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                {/* moyenne chiens similaires */}
                <div className="absolute h-full bg-white/20 rounded-full" style={{ width: `${b.max}%` }} />
                {/* score Max */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.score}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                  className="absolute h-full rounded-full bg-emerald-400"
                  style={{ boxShadow: "0 0 6px #34d39966" }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-emerald-400 font-bold">Max : {b.score}</span>
                <span className="text-[9px] text-white/30">Moyenne : {b.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}