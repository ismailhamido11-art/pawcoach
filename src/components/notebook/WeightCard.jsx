import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Weight, TrendingUp, TrendingDown, Minus, AlertTriangle, Plus, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { spring } from "@/lib/animations";

const DIRECTION_CONFIG = {
  stable: { Icon: Minus, color: "text-emerald-600", bg: "bg-emerald-50", label: "Poids stable" },
  up: { Icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", label: "En hausse" },
  down: { Icon: TrendingDown, color: "text-amber-600", bg: "bg-amber-50", label: "En baisse" },
  unknown: { Icon: Weight, color: "text-muted-foreground", bg: "bg-secondary", label: "Donnees insuffisantes" },
};

function InlineWeightForm({ dogId, onRecordAdded, onClose }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 200) { toast.error("Poids invalide"); return; }
    if (!date) { toast.error("Date requise"); return; }
    setSaving(true);
    try {
      const record = await base44.entities.HealthRecord.create({
        dog_id: dogId,
        type: "weight",
        title: "Pesee",
        date,
        value: w,
      });
      // Auto-update Dog.weight with latest value
      try { await base44.entities.Dog.update(dogId, { weight: w }); } catch {}
      if (onRecordAdded) onRecordAdded(record);
      toast.success("Poids enregistre !");
      onClose();
    } catch (e) {
      console.error("InlineWeightForm save error:", e);
      toast.error("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="overflow-hidden"
    >
      <div className="mx-4 mb-3.5 bg-white rounded-xl border border-primary/20 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Nouvelle pesee</p>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Pese ton chien et note le resultat. Le suivi de la courbe se met a jour automatiquement.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Poids (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 12.5"
              className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2 bg-background"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2 bg-background"
            />
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50"
        >
          {saving ? (
            <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enregistrement...</>
          ) : (
            <><Check className="w-3.5 h-3.5" /> C'est note !</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function WeightCard({ weightTrend, dogName, dogId, onRecordAdded, autoOpenForm, onAutoOpenConsumed }) {
  const [showForm, setShowForm] = useState(false);

  // Auto-open form when deep-linked from NextActionCard
  useEffect(() => {
    if (autoOpenForm && dogId) {
      setShowForm(true);
      onAutoOpenConsumed?.();
    }
  }, [autoOpenForm]);

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
          <div>
            <p className="text-sm font-bold text-foreground">Suivi du poids</p>
            <p className="text-[10px] text-muted-foreground">Pese regulierement pour suivre la courbe</p>
          </div>
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

            {/* Last weighed + CTA */}
            <div className="flex items-center justify-between">
              {lastDateFormatted && (
                <p className="text-[10px] text-muted-foreground">
                  Derniere pesee : {lastDateFormatted}
                </p>
              )}
              {dogId && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold"
                >
                  <Plus className="w-3 h-3" />
                  Nouvelle pesee
                </motion.button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Weight className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">Aucune pesee</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajoute le poids de {dogName || "ton chien"} pour suivre sa courbe.
            </p>
            {dogId && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowForm(true)}
                className="mt-3 mx-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un poids
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Inline form — appears directly in the card */}
      <AnimatePresence>
        {showForm && (
          <InlineWeightForm
            dogId={dogId}
            onRecordAdded={(rec) => { onRecordAdded?.(rec); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
