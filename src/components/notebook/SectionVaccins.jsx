import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Syringe, Plus, X, Calendar } from "lucide-react";

export default function SectionVaccins({ records, dogId, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", next_date: "" });
  const [saving, setSaving] = useState(false);

  const vaccines = records.filter(r => r.type === "vaccine").sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    const rec = await base44.entities.HealthRecord.create({
      dog_id: dogId,
      type: "vaccine",
      title: form.title,
      date: form.date,
      next_date: form.next_date || null,
    });
    onAdd(rec);
    try {
      const u = await base44.auth.me();
      await base44.auth.updateMe({ points: (u.points || 0) + 20 });
    } catch(e) {}
    setForm({ title: "", date: "", next_date: "" });
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-blue-700">Nouveau vaccin</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-blue-400" /></button>
          </div>
          <Input placeholder="Nom du vaccin (ex: Rage, CHPL...)" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="h-10 rounded-xl bg-white border-blue-200" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date administrée *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-10 rounded-xl bg-white border-blue-200" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Prochain rappel</Label>
              <Input type="date" value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
                className="h-10 rounded-xl bg-white border-blue-200" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={!form.title || !form.date || saving}
            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      )}

      {vaccines.length === 0 && !showForm ? (
        <EmptyState emoji="💉" text="Aucun vaccin enregistré" />
      ) : (
        vaccines.map(r => (
          <RecordRow key={r.id} record={r} onDelete={onDelete}
            icon={<Syringe className="w-4 h-4 text-blue-600" />}
            accentClass="bg-blue-50 border-blue-100"
            extra={r.next_date && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Rappel : {fmtDate(r.next_date)}
              </span>
            )}
          />
        ))
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline"
          className="w-full h-10 rounded-xl border-blue-200 text-blue-600 font-semibold gap-2 hover:bg-blue-50">
          <Plus className="w-4 h-4" /> Ajouter un vaccin
        </Button>
      )}
    </div>
  );
}

function fmtDate(d) { return new Date(d).toLocaleDateString("fr-FR"); }

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
        <p className="font-semibold text-sm text-foreground">{record.title}</p>
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