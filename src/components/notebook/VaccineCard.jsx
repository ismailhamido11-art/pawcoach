import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Syringe, ChevronDown, ChevronUp, Calendar, AlertTriangle, CheckCircle, Clock, HelpCircle, Plus, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const STATUS_CONFIG = {
  up_to_date: { label: "A jour", Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  due_soon: { label: "Bientot", Icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  overdue: { label: "En retard", Icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  never: { label: "Non fait", Icon: HelpCircle, color: "text-muted-foreground", bg: "bg-secondary", border: "border-border" },
};

const CATEGORY_ORDER = ["core", "recommended", "optional"];

function InlineVaccineForm({ vaccineKey, data, dogId, onRecordAdded, onClose }) {
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
      toast.success(`${ref.shortName} enregistre !`);
      onClose();
    } catch (e) {
      console.error("InlineVaccineForm save error:", e);
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
      <div className="mx-3.5 mb-3.5 bg-white rounded-xl border border-primary/20 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-foreground">Enregistrer : {data.ref.shortName}</p>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
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
          Prochain rappel auto-calcule : tous les {data.ref.frequencyMonths >= 12 ? `${data.ref.frequencyMonths / 12} an${data.ref.frequencyMonths > 12 ? "s" : ""}` : `${data.ref.frequencyMonths} mois`}
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
            <><Check className="w-3.5 h-3.5" /> Enregistrer</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

function VaccineRow({ vaccineKey, data, expanded, onToggle, dogId, onRecordAdded }) {
  const [showForm, setShowForm] = useState(false);
  const cfg = STATUS_CONFIG[data.status];
  const Icon = cfg.Icon;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

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
          <p className="text-sm font-semibold text-foreground">{data.ref.shortName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Icon className={`w-3 h-3 ${cfg.color}`} />
            <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
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
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-xs text-foreground leading-relaxed">{data.ref.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">{data.ref.urgency}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {data.lastRecord && (
                  <div className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2.5 py-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[11px] text-foreground font-medium">
                      Dernier : {fmtDate(data.lastRecord.date)}
                    </span>
                  </div>
                )}
                {data.nextDue && (
                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${data.status === "overdue" ? "bg-red-100" : "bg-white/80"}`}>
                    <Clock className={`w-3 h-3 ${data.status === "overdue" ? "text-red-500" : "text-muted-foreground"}`} />
                    <span className={`text-[11px] font-medium ${data.status === "overdue" ? "text-red-600" : "text-foreground"}`}>
                      {data.status === "overdue" ? "Etait prevu" : "Prochain"} : {fmtDate(data.nextDue)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2.5 py-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Frequence : tous les {data.ref.frequencyMonths >= 12 ? `${data.ref.frequencyMonths / 12} an${data.ref.frequencyMonths > 12 ? "s" : ""}` : `${data.ref.frequencyMonths} mois`}
                  </span>
                </div>
              </div>
              {/* CTA: inline form to record this vaccine */}
              {(data.status === "overdue" || data.status === "never") && dogId && !showForm && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => { e.stopPropagation(); setShowForm(true); }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Enregistrer ce vaccin
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline save form — appears directly in the card */}
      <AnimatePresence>
        {showForm && (
          <InlineVaccineForm
            vaccineKey={vaccineKey}
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

export default function VaccineCard({ vaccineMap, dogId, onRecordAdded }) {
  const [expandedKey, setExpandedKey] = useState(null);

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
              <p className="text-[10px] text-muted-foreground">Reference WSAVA 2024 — France</p>
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
              />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
