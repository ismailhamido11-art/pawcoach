import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Syringe, ChevronDown, ChevronUp, Calendar, AlertTriangle, CheckCircle, Clock, HelpCircle, Check, X, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { spring } from "@/lib/animations";

const STATUS_CONFIG = {
  up_to_date: { label: "A jour", Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  due_soon: { label: "Bientot", Icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  overdue: { label: "En retard", Icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  never: { label: "Non fait", Icon: HelpCircle, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border" },
};

const CATEGORY_ORDER = ["core", "recommended", "optional"];

// Status-specific CTA text and guidance
const STATUS_CTA = {
  overdue: { btn: "C'est fait, mettre a jour", guidance: "Ce vaccin est en retard. Si tu y es deja alle, indique la date ci-dessous." },
  due_soon: { btn: "C'est fait, mettre a jour", guidance: "Ce vaccin arrive bientot. Pense a prendre rendez-vous chez ton veto." },
  never: { btn: "Mon chien l'a deja recu", guidance: "Aucun enregistrement pour ce vaccin. Si ton chien l'a deja recu, note-le ici." },
  up_to_date: { btn: "Corriger la date", guidance: "Tout est a jour. Tu peux modifier la date si besoin." },
};

function InlineVaccineForm({ data, dogId, onRecordAdded, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!date) { toast.error("Date requise"); return; }
    setSaving(true);
    try {
      const ref = data.ref;
      const nextDate = new Date(date);
      nextDate.setMonth(nextDate.getMonth() + ref.frequencyMonths);

      const record = await base44.entities.HealthRecord.create({
        dog_id: dogId,
        type: "vaccine",
        title: ref.name,
        date,
        next_date: nextDate.toISOString().split("T")[0],
      });
      if (onRecordAdded) onRecordAdded(record);
      toast.success(`${ref.shortName} mis a jour !`);
      onClose();
    } catch (e) {
      console.error("InlineVaccineForm save error:", e);
      toast.error("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  const isFirstTime = data.status === "never";
  const formTitle = isFirstTime ? `Enregistrer : ${data.ref.shortName}` : `Mettre a jour : ${data.ref.shortName}`;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="overflow-hidden"
    >
      <div className="mx-3.5 mb-3.5 bg-white rounded-xl border border-primary/20 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">{formTitle}</p>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Indique la date de la derniere injection. Le prochain rappel sera calcule automatiquement.
        </p>
        <div>
          <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date du vaccin</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2 bg-background"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Prochain rappel : tous les {data.ref.frequencyMonths >= 12 ? `${data.ref.frequencyMonths / 12} an${data.ref.frequencyMonths > 12 ? "s" : ""}` : `${data.ref.frequencyMonths} mois`}
        </p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-50"
        >
          {saving ? (
            <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enregistrement...</>
          ) : (
            <><Check className="w-3.5 h-3.5" /> Mettre a jour</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function VaccineRow({ vaccineKey, data, expanded, onToggle, dogId, onRecordAdded, onFindVet }) {
  const [showForm, setShowForm] = useState(false);
  const cfg = STATUS_CONFIG[data.status];
  const cta = STATUS_CTA[data.status] || STATUS_CTA.up_to_date;
  const Icon = cfg.Icon;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

  const showFindVet = data.status === "overdue" || data.status === "due_soon";
  const isPrimary = data.status !== "up_to_date";

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${cfg.border} ${cfg.bg}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0">
          <Syringe className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{data.ref.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon className={`w-3 h-3 ${cfg.color}`} />
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            {data.lastRecord && (
              <span className="text-[10px] text-muted-foreground ml-1">
                · {fmtDate(data.lastRecord.date)}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {data.ref.label}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5 pt-0 space-y-2">
              {/* Description + urgency */}
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-xs text-foreground leading-relaxed">{data.ref.description}</p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{data.ref.urgency}</p>
              </div>

              {/* Guidance text — tells user what to do */}
              <div className={`rounded-lg p-2.5 ${data.status === "overdue" ? "bg-red-50 border border-red-100" : data.status === "due_soon" ? "bg-amber-50 border border-amber-100" : "bg-primary/5 border border-primary/10"}`}>
                <p className={`text-xs leading-relaxed font-medium ${data.status === "overdue" ? "text-red-700" : data.status === "due_soon" ? "text-amber-700" : "text-foreground/70"}`}>
                  {cta.guidance}
                </p>
              </div>

              {/* Date pills */}
              <div className="flex gap-2 flex-wrap">
                {data.lastRecord && (
                  <div className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2.5 py-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-foreground font-medium">
                      Dernier : {fmtDate(data.lastRecord.date)}
                    </span>
                  </div>
                )}
                {data.nextDue && (
                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${data.status === "overdue" ? "bg-red-100" : "bg-white/80"}`}>
                    <Clock className={`w-3 h-3 ${data.status === "overdue" ? "text-red-500" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${data.status === "overdue" ? "text-red-600" : "text-foreground"}`}>
                      {data.status === "overdue" ? "Etait prevu" : "Prochain"} : {fmtDate(data.nextDue)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons — visible for ALL statuses */}
              {dogId && !showForm && (
                <div className="flex gap-2 mt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => { e.stopPropagation(); setShowForm(true); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                      isPrimary
                        ? "bg-primary text-white"
                        : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {cta.btn}
                  </motion.button>
                  {showFindVet && onFindVet && (
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={(e) => { e.stopPropagation(); onFindVet(); }}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-border text-xs font-medium text-foreground"
                    >
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      Trouver un veto
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline save form — appears directly in the card */}
      <AnimatePresence>
        {showForm && (
          <InlineVaccineForm
            data={data}
            dogId={dogId}
            onRecordAdded={(rec) => { onRecordAdded?.(rec); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VaccineCard({ vaccineMap, dogId, onRecordAdded, onFindVet, autoExpandKey, onAutoExpandConsumed }) {
  const [expandedKey, setExpandedKey] = useState(null);

  // Auto-expand a specific vaccine row when deep-linked (NextActionCard, URL, etc.)
  // vaccineMap in deps: handles race condition where autoExpandKey arrives before data loads
  useEffect(() => {
    if (autoExpandKey && vaccineMap?.[autoExpandKey]) {
      setExpandedKey(autoExpandKey);
      onAutoExpandConsumed?.();
    }
  }, [autoExpandKey, vaccineMap]);

  if (!vaccineMap) return null;

  // Group by category, ordered
  const grouped = {};
  for (const cat of CATEGORY_ORDER) {
    const items = Object.entries(vaccineMap).filter(([_, v]) => v.ref.category === cat);
    if (items.length > 0) grouped[cat] = items;
  }

  const CATEGORY_LABELS = {
    core: "Vaccins essentiels",
    recommended: "Recommandes",
    optional: "Optionnels (selon mode de vie)",
  };

  // Count issues
  const overdueCount = Object.values(vaccineMap).filter(v => v.status === "overdue").length;
  const dueSoonCount = Object.values(vaccineMap).filter(v => v.status === "due_soon").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.2 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Syringe className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Calendrier vaccinal</p>
              <p className="text-[10px] text-muted-foreground">Appuie sur un vaccin pour le mettre a jour</p>
            </div>
          </div>
          {overdueCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {overdueCount} en retard
            </span>
          )}
          {overdueCount === 0 && dueSoonCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
              {dueSoonCount} bientot
            </span>
          )}
          {overdueCount === 0 && dueSoonCount === 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
              A jour
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {CATEGORY_LABELS[cat]}
            </p>
            {items.map(([key, data]) => (
              <VaccineRow
                key={key}
                vaccineKey={key}
                data={data}
                expanded={expandedKey === key}
                onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
                dogId={dogId}
                onRecordAdded={onRecordAdded}
                onFindVet={onFindVet}
              />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
