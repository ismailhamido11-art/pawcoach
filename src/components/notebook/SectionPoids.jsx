import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Weight, Plus, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SectionPoids({ records, dogId, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ value: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  const weights = records.filter(r => r.type === "weight" && r.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const chartData = weights.map(r => ({
    date: new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    poids: r.value,
    id: r.id,
  }));

  const handleSave = async () => {
    if (!form.value || !form.date) return;
    setSaving(true);
    const rec = await base44.entities.HealthRecord.create({
      dog_id: dogId,
      type: "weight",
      title: `Poids – ${new Date(form.date).toLocaleDateString("fr-FR")}`,
      date: form.date,
      value: parseFloat(form.value),
    });
    onAdd(rec);
    setForm({ value: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      {weights.length >= 2 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Courbe de poids</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => [`${v} kg`, "Poids"]} labelStyle={{ fontSize: 11 }} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
              <Line type="monotone" dataKey="poids" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
          {weights.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Dernier poids : <strong className="text-foreground">{weights[weights.length - 1].value} kg</strong>
            </p>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-teal-700">Nouvelle mesure</p>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-teal-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Poids (kg) *</Label>
              <Input type="number" step="0.1" placeholder="Ex: 8.5" value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="h-10 rounded-xl bg-white border-teal-200" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="h-10 rounded-xl bg-white border-teal-200" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={!form.value || !form.date || saving}
            className="w-full h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold border-0">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      )}

      {weights.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">⚖️</p>
          <p className="text-muted-foreground text-sm">Aucune pesée enregistrée</p>
        </div>
      )}

      {weights.slice().reverse().map(r => (
        <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border bg-teal-50 border-teal-100">
            <Weight className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary text-base">{r.value} kg</p>
            <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("fr-FR")}</p>
          </div>
          <button onClick={() => onDelete(r.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline"
          className="w-full h-10 rounded-xl border-teal-200 text-teal-700 font-semibold gap-2 hover:bg-teal-50">
          <Plus className="w-4 h-4" /> Ajouter un poids
        </Button>
      )}
    </div>
  );
}