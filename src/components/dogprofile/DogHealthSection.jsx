import { useState } from "react";
import { ChevronDown, ChevronUp, Stethoscope, Pencil, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function EditableField({ label, value, fieldKey, onSave, type = "text", multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ [fieldKey]: draft });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
          {!editing && (
            <p className="text-sm text-foreground">{value || <span className="text-muted-foreground italic">Non renseigné</span>}</p>
          )}
        </div>
        {!editing && (
          <button onClick={() => { setDraft(value || ""); setEditing(true); }} className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-4">
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {editing && (
        <div className="space-y-2 mt-2">
          {multiline ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-primary resize-none"
              autoFocus
            />
          ) : (
            <input
              type={type}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1">
              {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
              OK
            </button>
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center gap-1">
              <X className="w-3 h-3" /> Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DogHealthSection({ dog, onSave }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-red-500" />
          </div>
          <span className="font-bold text-sm text-foreground">Santé</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border">
              <EditableField label="Allergies" value={dog.allergies} fieldKey="allergies" onSave={onSave} multiline />
              <EditableField label="Problèmes de santé" value={dog.health_issues} fieldKey="health_issues" onSave={onSave} multiline />
              <EditableField label="Vétérinaire" value={dog.vet_name} fieldKey="vet_name" onSave={onSave} />
              <EditableField label="Ville du vétérinaire" value={dog.vet_city} fieldKey="vet_city" onSave={onSave} />
              <EditableField label="Prochain RDV vétérinaire" value={dog.next_vet_appointment} fieldKey="next_vet_appointment" onSave={onSave} type="date" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}