import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import MobileSelect from "@/components/ui/MobileSelect";

export default function InlineEditCard({
  icon: Icon, iconColor, label, value, sub, subColor,
  editField, editType, editLabel, editOptions, currentValue, onSave,
  min, max
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (editType === "number") {
      const val = parseFloat(draft);
      if (isNaN(val)) { setError("Valeur invalide"); return; }
      if (min !== undefined && val < min) { setError(`Minimum ${min}`); return; }
      if (max !== undefined && val > max) { setError(`Maximum ${max}`); return; }
    }
    setError("");
    setSaving(true);
    await onSave({ [editField]: editType === "number" ? parseFloat(draft) : draft });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-2 relative">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconColor + "18" }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          {!editing && <p className="text-sm font-bold text-foreground truncate">{value}</p>}
          {sub && !editing && <p className={`text-[10px] ${subColor || "text-muted-foreground"}`}>{sub}</p>}
        </div>
        {!editing && (
          <button onClick={() => { setDraft(currentValue ?? ""); setEditing(true); }} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {editing && (
        <div className="space-y-2">
          {editType === "select" ? (
            <select
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-primary"
            >
              {editOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <>
              <input
                type={editType || "text"}
                value={draft}
                onChange={e => { setDraft(e.target.value); setError(""); }}
                className={`w-full text-sm border rounded-xl px-3 py-2 bg-background outline-none focus:ring-1 focus:ring-primary ${error ? "border-red-300" : "border-border"}`}
                placeholder={editLabel}
                autoFocus
                {...(editType === "number" && min !== undefined ? { min } : {})}
                {...(editType === "number" && max !== undefined ? { max } : {})}
              />
              {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1"
            >
              {saving ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-3 h-3" />}
              OK
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