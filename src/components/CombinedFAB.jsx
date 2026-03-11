import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useBackClose from "@/hooks/useBackClose";
import { Plus, X, MessageCircle, Scale, Droplets, Footprints, FileText, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { checkWalkBadges } from "@/components/achievements/badgeUtils";
import { getTodayString } from "@/utils/recommendations";

const FIELDS = [
  { key: "weight_kg", icon: Scale, label: "Poids", unit: "kg", type: "number", placeholder: "Ex: 12.5", color: "#3b82f6", bg: "bg-blue-50", min: 0.1, max: 200 },
  { key: "walk_minutes", icon: Footprints, label: "Balade", unit: "min", type: "number", placeholder: "Ex: 30", color: "#10b981", bg: "bg-emerald-50", min: 0, max: 1440 },
  { key: "water_bowls", icon: Droplets, label: "Eau", unit: "bols", type: "number", placeholder: "Ex: 3", color: "#06b6d4", bg: "bg-cyan-50", min: 0, max: 20 },
  { key: "notes", icon: FileText, label: "Note", unit: "", type: "text", placeholder: "Observation...", color: "#8b5cf6", bg: "bg-violet-50" },
];

export default function CombinedFAB({ dog, user, onLogSaved }) {
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));
  const [activeTab, setActiveTab] = useState("log"); // "log" ou "chat"
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateFields = () => {
    const newErrors = {};
    FIELDS.forEach(f => {
      if (f.type === "number" && form[f.key] !== "" && form[f.key] !== undefined) {
        const val = parseFloat(form[f.key]);
        if (isNaN(val)) newErrors[f.key] = "Valeur invalide";
        else if (f.min !== undefined && val < f.min) newErrors[f.key] = `Min ${f.min} ${f.unit}`;
        else if (f.max !== undefined && val > f.max) newErrors[f.key] = `Max ${f.max} ${f.unit}`;
      }
    });
    return newErrors;
  };

  const handleSave = async () => {
    if (!dog || saving) return;
    const hasData = Object.values(form).some(v => v !== "" && v !== undefined && v !== null);
    if (!hasData) { setOpen(false); return; }

    const validationErrors = validateFields();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

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

    const existing = await base44.entities.DailyLog.filter({ dog_id: dog.id, date: payload.date });
    if (existing && existing.length > 0) {
      await base44.entities.DailyLog.update(existing[0].id, payload);
    } else {
      await base44.entities.DailyLog.create(payload);
    }

    // Trigger walk badge check if walk was logged
    if (payload.walk_minutes > 0) {
      try {
        const allLogs = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 60);
        checkWalkBadges(dog.id, user?.email, allLogs).catch(() => {});
      } catch {}
    }

    setSaving(false);
    setSaved(true);
    onLogSaved?.();
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
            role="dialog"
            aria-label="Log rapide"
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl"
            style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-2.5 mb-3" />

            {/* Tabs */}
            <div className="flex gap-2 px-5 mb-4 border-b border-border">
              <button
                onClick={() => setActiveTab("log")}
                className={`pb-2.5 px-2 text-sm font-bold transition-colors ${
                  activeTab === "log" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                Log rapide
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`pb-2.5 px-2 text-sm font-bold transition-colors ${
                  activeTab === "chat" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
                }`}
              >
                Chat
              </button>
              <button aria-label="Fermer" onClick={() => setOpen(false)} className="ml-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            {activeTab === "log" ? (
              <>
                <p className="text-xs text-muted-foreground px-5 mb-3">Remplis ce que tu veux, rien n'est obligatoire</p>
                <div className="px-5 space-y-2.5">
                  {FIELDS.map(({ key, icon: Icon, label, unit, type, placeholder, color, bg, min, max }) => (
                    <div key={key} className={`flex items-center gap-2.5 ${bg} rounded-xl px-3.5 py-2.5 ${errors[key] ? "ring-2 ring-red-400" : ""}`}>
                      <div className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-muted-foreground mb-0.5">{label}</p>
                        {type === "text" ? (
                          <textarea
                            aria-label={label}
                            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 resize-none outline-none"
                            rows={1}
                            placeholder={placeholder}
                            value={form[key] || ""}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              aria-label={label}
                              className="flex-1 bg-transparent text-xs font-bold text-foreground placeholder:text-muted-foreground/50 outline-none"
                              type="number"
                              placeholder={placeholder}
                              value={form[key] || ""}
                              onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(prev => { const n = {...prev}; delete n[key]; return n; }); }}
                              inputMode="decimal"
                              min={min}
                              max={max}
                            />
                            {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
                          </div>
                        )}
                        {errors[key] && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors[key]}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 mt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all ${saved ? "" : "gradient-primary"}`}
                    style={saved ? { background: "#10b981" } : {}}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                    {saved ? "Enregistré !" : saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">Accède au chat avec ton coach IA PawCoach pour des conseils personnalisés.</p>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate(createPageUrl("Chat"));
                  }}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm bg-gradient-to-br from-primary to-accent"
                >
                  Ouvrir le chat
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        aria-label="Ajouter un log rapide"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.9 }}
        animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="fixed right-5 z-[45] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center gradient-primary"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </motion.button>
    </>
  );
}