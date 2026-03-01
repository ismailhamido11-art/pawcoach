import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Scale, Droplets, Footprints, FileText, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

const FIELDS = [
  {
    key: "weight_kg",
    icon: Scale,
    label: "Poids",
    unit: "kg",
    type: "number",
    placeholder: "Ex: 12.5",
    color: "#3b82f6",
    bg: "bg-blue-50",
  },
  {
    key: "walk_minutes",
    icon: Footprints,
    label: "Balade",
    unit: "min",
    type: "number",
    placeholder: "Ex: 30",
    color: "#10b981",
    bg: "bg-emerald-50",
  },
  {
    key: "water_bowls",
    icon: Droplets,
    label: "Eau",
    unit: "bols",
    type: "number",
    placeholder: "Ex: 3",
    color: "#06b6d4",
    bg: "bg-cyan-50",
  },
  {
    key: "notes",
    icon: FileText,
    label: "Note",
    unit: "",
    type: "text",
    placeholder: "Observation du jour...",
    color: "#8b5cf6",
    bg: "bg-violet-50",
  },
];

export default function QuickLogFAB({ dog, user, open: controlledOpen, onOpenChange, onLogSaved }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!dog || saving) return;
    const hasData = Object.values(form).some(v => v !== "" && v !== undefined && v !== null);
    if (!hasData) { setOpen(false); return; }

    setSaving(true);
    const payload = {
      dog_id: dog.id,
      date: getTodayString(),
      owner: user?.email || "",
    };
    FIELDS.forEach(f => {
      if (form[f.key] !== "" && form[f.key] !== undefined) {
        payload[f.key] = f.type === "number" ? parseFloat(form[f.key]) : form[f.key];
      }
    });

    await base44.entities.DailyLog.create(payload);
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setForm({});
    }, 1200);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-10"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 mb-5">
              <div>
                <p className="font-black text-foreground text-lg">Log rapide</p>
                <p className="text-xs text-muted-foreground">Remplis ce que tu veux, rien n'est obligatoire</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 space-y-3">
              {FIELDS.map(({ key, icon: Icon, label, unit, type, placeholder, color, bg }) => (
                <div key={key} className={`flex items-center gap-3 ${bg} rounded-2xl px-4 py-3`}>
                  <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-muted-foreground mb-0.5">{label}</p>
                    {type === "text" ? (
                      <textarea
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none"
                        rows={2}
                        placeholder={placeholder}
                        value={form[key] || ""}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/50 outline-none"
                          type="number"
                          placeholder={placeholder}
                          value={form[key] || ""}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          inputMode="decimal"
                        />
                        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div className="px-5 mt-5">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: saved ? "#10b981" : "linear-gradient(135deg, #0f4c3a, #2d9f82)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Enregistré !" : saving ? "Enregistrement..." : "Enregistrer le log"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f4c3a, #2d9f82)" }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </motion.button>
    </>
  );
}