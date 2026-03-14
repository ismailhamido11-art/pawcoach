import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Syringe, Plus, X, Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { VACCINE_REFERENCE, getVaccineDisplayName, isValidDate } from "@/utils/healthStatus";
import { spring } from "@/lib/animations";

const VACCINE_OPTIONS = Object.entries(VACCINE_REFERENCE).map(([key, ref]) => ({
  key,
  name: ref.name,
  shortName: ref.shortName,
  category: ref.category,
  frequencyMonths: ref.frequencyMonths,
}));

export default function SectionVaccins({ records = [], dogId, onDelete, onRecordAdded }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vaccineKey: "", customTitle: "", date: new Date().toISOString().split("T")[0], nextDate: "" });

  const vaccines = records.filter(r => r.type === "vaccine").sort((a, b) => new Date(b.date) - new Date(a.date));

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const getReminderInfo = (record) => {
    let dateToUse = record.next_date;
    let isEstimated = false;

    if (!isValidDate(dateToUse)) {
      if (!isValidDate(record.date)) return null;
      const d = new Date(record.date);
      d.setFullYear(d.getFullYear() + 1);
      dateToUse = d.toISOString().split('T')[0];
      isEstimated = true;
    }

    const nextDateObj = new Date(dateToUse);
    if (isNaN(nextDateObj.getTime())) return null;
    const isOverdue = nextDateObj < todayDate;

    return {
      dateStr: dateToUse,
      isEstimated,
      isOverdue,
      text: isOverdue ? "En retard" : (isEstimated ? "Rappel estime" : "Rappel")
    };
  };

  const handleSave = async () => {
    const selected = VACCINE_OPTIONS.find(v => v.key === form.vaccineKey);
    const title = selected ? selected.name : form.customTitle.trim();
    if (!title || !form.date) {
      toast.error("Choisis un vaccin et indique la date d'injection.");
      return;
    }

    setSaving(true);
    try {
      // Auto-calculate next_date from vaccine frequency if not provided
      let nextDate = form.nextDate;
      if (!nextDate && selected) {
        const d = new Date(form.date);
        d.setMonth(d.getMonth() + selected.frequencyMonths);
        nextDate = d.toISOString().split("T")[0];
      }

      const record = await base44.entities.HealthRecord.create({
        dog_id: dogId,
        type: "vaccine",
        title,
        date: form.date,
        next_date: nextDate || undefined,
      });

      if (onRecordAdded) onRecordAdded(record);
      toast.success("Vaccin enregistré !");
      setShowAddForm(false);
      setForm({ vaccineKey: "", customTitle: "", date: new Date().toISOString().split("T")[0], nextDate: "" });
    } catch (e) {
      toast.error("Impossible d'enregistrer ce vaccin. Réessaie.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Add vaccine button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={spring}
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ajouter un vaccin
      </motion.button>

      {/* Inline add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-primary/20 rounded-2xl p-4 space-y-3 shadow-sm">
              <p className="text-sm font-bold text-foreground">Enregistrer un vaccin</p>

              {/* Vaccine selector */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Vaccin</label>
                <select
                  value={form.vaccineKey}
                  onChange={e => setForm(p => ({ ...p, vaccineKey: e.target.value, customTitle: "" }))}
                  className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2.5 bg-background"
                >
                  <option value="">-- Choisir un vaccin --</option>
                  <optgroup label="Essentiels">
                    {VACCINE_OPTIONS.filter(v => v.category === "core").map(v => (
                      <option key={v.key} value={v.key}>{v.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Recommandés">
                    {VACCINE_OPTIONS.filter(v => v.category === "recommended").map(v => (
                      <option key={v.key} value={v.key}>{v.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Optionnels">
                    {VACCINE_OPTIONS.filter(v => v.category === "optional").map(v => (
                      <option key={v.key} value={v.key}>{v.name}</option>
                    ))}
                  </optgroup>
                  <option value="custom">Autre (saisie libre)</option>
                </select>
              </div>

              {/* Custom title input (only if "custom" selected) */}
              {form.vaccineKey === "custom" && (
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Nom du vaccin</label>
                  <Input
                    value={form.customTitle}
                    onChange={e => setForm(p => ({ ...p, customTitle: e.target.value }))}
                    placeholder="Ex: Vaccin polyvalent"
                    className="mt-1 rounded-xl"
                  />
                </div>
              )}

              {/* Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date du vaccin</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2.5 bg-background"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Prochain rappel</label>
                  <input
                    type="date"
                    value={form.nextDate}
                    onChange={e => setForm(p => ({ ...p, nextDate: e.target.value }))}
                    placeholder="Auto-calculé"
                    className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2.5 bg-background"
                  />
                  {!form.nextDate && form.vaccineKey && form.vaccineKey !== "custom" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Auto-calculé selon la fréquence WSAVA</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 rounded-xl" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1" />Enregistrement...</> : <><Check className="w-3.5 h-3.5 mr-1" />Enregistrer</>}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing records */}
      {vaccines.length === 0 && !showAddForm ? (
        <EmptyState emoji="💉" text="Aucun vaccin enregistré" />
      ) : (
        vaccines.map(r => {
          const reminder = getReminderInfo(r);
          return (
            <RecordRow key={r.id} record={r} onDelete={onDelete}
              icon={<Syringe className="w-4 h-4 text-blue-600" />}
              accentClass="bg-blue-50 border-blue-100"
              extra={reminder ? (
                <span className={`text-xs font-medium flex items-center gap-1 mt-1 ${reminder.isOverdue ? 'text-destructive' : 'text-emerald-600'}`}>
                  <Calendar className="w-3 h-3" /> {reminder.text} : {fmtDate(reminder.dateStr)}
                </span>
              ) : null}
            />
          );
        })
      )}

    </div>
  );
}

function fmtDate(d) {
  if (!isValidDate(d)) return "";
  return new Date(d).toLocaleDateString("fr-FR");
}

function EmptyState({ emoji, text }) {
  return (
    <div className="text-center py-8">
      <p className="text-3xl mb-2">{emoji}</p>
      <p className="text-muted-foreground text-sm">{text}</p>
    </div>
  );
}

export function RecordRow({ record, onDelete, icon, accentClass, extra }) {
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border bg-white`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${accentClass || "bg-muted border-border"}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{getVaccineDisplayName(record.title)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(record.date)}</p>
        {extra}
        {record.details && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.details}</p>}
      </div>
      <button onClick={() => onDelete(record.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}