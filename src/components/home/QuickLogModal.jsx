import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scale, Droplets, Footprints, FileText, Check, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function FieldRow({ icon: Icon, label, unit, value, onChange, placeholder, type = "number", color }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <input
          type={type}
          inputMode={type === "number" ? "decimal" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-foreground font-semibold text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {unit && <span className="text-xs text-muted-foreground font-medium flex-shrink-0">{unit}</span>}
    </div>
  );
}

export default function QuickLogModal({ dog, user, onClose, onSaved }) {
  const [weight, setWeight] = useState("");
  const [water, setWater] = useState("");
  const [walk, setWalk] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const hasData = weight || water || walk || notes;

  const handleSave = async () => {
    if (!hasData || saving) return;
    setSaving(true);
    const payload = {
      dog_id: dog.id,
      owner_email: user.email,
      date: getTodayString(),
    };
    if (weight) payload.weight = parseFloat(weight);
    if (water) payload.water_ml = parseInt(water);
    if (walk) payload.walk_minutes = parseInt(walk);
    if (notes) payload.notes = notes;

    await base44.entities.DailyLog.create(payload);
    setSaving(false);
    if (onSaved) onSaved(payload);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <h2 className="font-black text-foreground text-base">Saisie rapide</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Dog name */}
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs text-muted-foreground">
              Pour <span className="font-bold text-foreground">{dog?.name}</span> · {getTodayString()}
            </p>
          </div>

          {/* Fields */}
          <div className="px-5">
            <FieldRow icon={Scale} label="Poids" unit="kg" color="#3b82f6"
              value={weight} onChange={setWeight} placeholder="Ex: 12.5" />
            <FieldRow icon={Droplets} label="Eau bue" unit="ml" color="#06b6d4"
              value={water} onChange={setWater} placeholder="Ex: 500" />
            <FieldRow icon={Footprints} label="Balade" unit="min" color="#10b981"
              value={walk} onChange={setWalk} placeholder="Ex: 30" />
            <FieldRow icon={FileText} label="Notes" unit={null} color="#8b5cf6"
              type="text" value={notes} onChange={setNotes} placeholder="Observations libres..." />
          </div>

          {/* Save button */}
          <div className="px-5 py-4">
            <button
              onClick={handleSave}
              disabled={!hasData || saving}
              className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              style={{ background: hasData ? "linear-gradient(135deg, #0f4c3a, #2d9f82)" : undefined }}
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                : <><Check className="w-4 h-4" /> Enregistrer</>
              }
            </button>
          </div>
          <div className="pb-safe h-4" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}