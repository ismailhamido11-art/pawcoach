import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { RecordRow } from "./SectionVaccins";

export default function PremiumSection({ type, records, dogId, isPremium, onAdd, onDelete, config }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().split("T")[0], next_date: "", details: "" });
  const [saving, setSaving] = useState(false);

  const filtered = records.filter(r => r.type === type).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    const rec = await base44.entities.HealthRecord.create({
      dog_id: dogId,
      type,
      title: form.title,
      date: form.date,
      next_date: form.next_date || null,
      details: form.details || null,
    });
    onAdd(rec);
    setForm({ title: "", date: new Date().toISOString().split("T")[0], next_date: "", details: "" });
    setShowForm(false);
    setSaving(false);
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-7 h-7 text-amber-500" />
        </div>
        <p className="font-bold text-foreground">Fonctionnalité Premium</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Passe à Premium pour accéder à la section {config.label} et à toutes les fonctionnalités du carnet de santé.
        </p>
        <Button className="rounded-xl gradient-warm border-0 text-white font-semibold px-6">
          Passer Premium 🌟
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showForm && (
        <div className={`${config.bgClass} border ${config.borderClass} rounded-2xl p-4 space-y-3 animate-slide-up`}>
          <div className="flex items-center justify-between">
            <p className={`font-semibold text-sm ${config.textClass}`}>{config.addLabel}</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 opacity-50" /></button>
          </div>
          <Input placeholder={config.placeholder} value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="h-10 rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-10 rounded-xl bg-white" />
            </div>
            {config.showNextDate && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Prochain RDV</Label>
                <Input type="date" value={form.next_date} onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
                  className="h-10 rounded-xl bg-white" />
              </div>
            )}
          </div>
          <Textarea placeholder="Détails, observations..." value={form.details}
            onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
            className="rounded-xl bg-white resize-none text-sm" rows={2} />
          <Button onClick={handleSave} disabled={!form.title || !form.date || saving}
            className={`w-full h-10 rounded-xl ${config.btnClass} text-white font-semibold border-0`}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      )}

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">{config.emoji}</p>
          <p className="text-muted-foreground text-sm">{config.emptyText}</p>
        </div>
      )}

      {filtered.map(r => (
        <RecordRow key={r.id} record={r} onDelete={onDelete}
          icon={<config.Icon className={`w-4 h-4 ${config.textClass}`} />}
          accentClass={`${config.bgClass} ${config.borderClass}`}
          extra={r.next_date && (
            <span className="text-xs text-amber-600 font-medium">
              Prochain : {new Date(r.next_date).toLocaleDateString("fr-FR")}
            </span>
          )}
        />
      ))}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline"
          className={`w-full h-10 rounded-xl ${config.borderClass} ${config.textClass} font-semibold gap-2 hover:opacity-80`}>
          <Plus className="w-4 h-4" /> {config.addLabel}
        </Button>
      )}
    </div>
  );
}