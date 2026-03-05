import { useState } from "react";
import { ChevronDown, ChevronUp, Utensils, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MobileSelect from "@/components/ui/MobileSelect";

const DIET_LABELS = { kibble: "Croquettes", barf: "BARF (cru)", mixed: "Mixte", homemade: "Fait maison" };

function EditableSelect({ label, value, fieldKey, options, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { setSaving(true); await onSave({ [fieldKey]: draft }); setSaving(false); setEditing(false); };
  const displayVal = options ? (options.find(o => o.value === value)?.label || value) : value;

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          {!editing && <p className="text-sm text-foreground">{displayVal || <span className="text-muted-foreground italic">Non renseigné</span>}</p>}
        </div>
        {!editing && (
          <button onClick={() => { setDraft(value || ""); setEditing(true); }} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-4">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {editing && (
        <div className="space-y-2 mt-2">
          {options ? (
            <MobileSelect value={draft} onChange={val => setDraft(val)} options={options} label={label} />
          ) : (
            <input type="text" value={draft} onChange={e => setDraft(e.target.value)} className="w-full border border-border rounded-xl px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-primary" style={{ fontSize: "16px" }} autoFocus />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1">
              {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />} OK
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center gap-1">
              <X className="w-3 h-3" /> Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DogDietSection({ dog, onSave }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="font-bold text-sm text-foreground">Alimentation</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border">
              <EditableSelect label="Type d'alimentation" value={dog.diet_type} fieldKey="diet_type" onSave={onSave}
                options={[
                  { value: "kibble", label: "Croquettes" },
                  { value: "barf", label: "BARF (cru)" },
                  { value: "mixed", label: "Mixte" },
                  { value: "homemade", label: "Fait maison" },
                ]}
              />
              <EditableSelect label="Marque / aliment" value={dog.diet_brand} fieldKey="diet_brand" onSave={onSave} />
              <EditableSelect label="Restrictions alimentaires" value={dog.diet_restrictions} fieldKey="diet_restrictions" onSave={onSave} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}