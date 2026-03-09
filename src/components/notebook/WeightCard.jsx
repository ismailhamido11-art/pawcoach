import { useMemo } from "react";
import { motion } from "framer-motion";
import { Weight, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const DIRECTION_CONFIG = {
  stable: { Icon: Minus, color: "text-emerald-600", bg: "bg-emerald-50", label: "Poids stable" },
  up: { Icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", label: "En hausse" },
  down: { Icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50", label: "En baisse" },
  unknown: { Icon: Weight, color: "text-muted-foreground", bg: "bg-secondary", label: "Donnees insuffisantes" },
};

export default function WeightCard({ weightTrend, dogName }) {
  if (!weightTrend) return null;

  const config = DIRECTION_CONFIG[weightTrend.direction] || DIRECTION_CONFIG.unknown;
  const Icon = config.Icon;
  const isAlert = Math.abs(weightTrend.changePct) > 5;
  const lastDateFormatted = weightTrend.lastDate
    ? new Date(weightTrend.lastDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const interpretation = useMemo(() => {
    if (weightTrend.current === null) return "Aucune pesee enregistree. Pese ton chien pour commencer le suivi.";
    if (weightTrend.direction === "unknown") return "Une seule pesee. Ajoute-en une autre pour voir la tendance.";
    if (weightTrend.direction === "stable") return `${dogName || "Ton chien"} maintient un poids stable. C'est ideal.`;
    if (weightTrend.direction === "up") {
      if (isAlert) return `Attention : +${weightTrend.changeKg} kg (+${weightTrend.changePct}%) en ${weightTrend.period} jours. Consulte ton veterinaire si la tendance continue.`;
      return `Legere hausse de +${weightTrend.changeKg} kg. A surveiller lors des prochaines pesees.`;
    }
    if (weightTrend.direction === "down") {
      if (isAlert) return `Attention : ${weightTrend.changeKg} kg (${weightTrend.changePct}%) en ${weightTrend.period} jours. Une perte rapide peut indiquer un probleme.`;
      return `Legere baisse de ${weightTrend.changeKg} kg. A surveiller.`;
    }
    return "";
  }, [weightTrend, dogName, isAlert]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.25 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center">
            <Weight className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Suivi du poids</p>
        </div>
      </div>

      <div className="px-4 py-3.5">
        {weightTrend.current !== null ? (
          <div className="space-y-3">
            {/* Current weight + trend */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-3xl font-black text-foreground">{weightTrend.current}</p>
                <p className="text-xs text-muted-foreground font-medium">kg</p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${config.bg}`}>
                <Icon className={`w-4 h-4 ${isAlert ? "text-red-500" : config.color}`} />
                <span className={`text-xs font-bold ${isAlert ? "text-red-600" : config.color}`}>
                  {config.label}
                </span>
                {weightTrend.changeKg !== 0 && weightTrend.direction !== "unknown" && (
                  <span className={`text-[10px] font-medium ${isAlert ? "text-red-500" : config.color} opacity-70`}>
                    ({weightTrend.changeKg > 0 ? "+" : ""}{weightTrend.changeKg} kg)
                  </span>
                )}
              </div>
            </div>

            {/* Interpretation */}
            <div className={`rounded-xl p-3 ${isAlert ? "bg-red-50 border border-red-200" : "bg-secondary"}`}>
              <div className="flex items-start gap-2">
                {isAlert && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                <p className={`text-xs leading-relaxed ${isAlert ? "text-red-700" : "text-muted-foreground"}`}>
                  {interpretation}
                </p>
              </div>
            </div>

            {/* Last weighed */}
            {lastDateFormatted && (
              <p className="text-[10px] text-muted-foreground text-center">
                Derniere pesee : {lastDateFormatted}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Weight className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucune pesee</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoute le poids de {dogName || "ton chien"} pour suivre sa courbe.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
