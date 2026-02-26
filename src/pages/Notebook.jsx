import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Syringe, Stethoscope, Weight, Pill, AlertTriangle, FileText, X, ChevronDown
} from "lucide-react";

const TYPES = [
  { value: "vaccine", label: "Vaccin", icon: Syringe, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { value: "vet_visit", label: "Visite vét.", icon: Stethoscope, color: "bg-purple-50 text-purple-600 border-purple-200" },
  { value: "weight", label: "Poids", icon: Weight, color: "bg-teal-50 text-primary border-teal-200" },
  { value: "medication", label: "Médicament", icon: Pill, color: "bg-amber-50 text-amber-600 border-amber-200" },
  { value: "allergy", label: "Allergie", icon: AlertTriangle, color: "bg-red-50 text-red-600 border-red-200" },
  { value: "note", label: "Note", icon: FileText, color: "bg-gray-50 text-gray-600 border-gray-200" },
];

const TYPE_MAP = Object.fromEntries(TYPES.map(t => [t.value, t]));

export default function Notebook() {
  const [dog, setDog] = useState(null);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [form, setForm] = useState({ type: "vaccine", title: "", date: "", next_date: "", details: "", value: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const dogs = await base44.entities.Dog.filter({ owner: user.email });
    if (dogs.length > 0) {
      setDog(dogs[0]);
      const recs = await base44.entities.HealthRecord.filter({ dog_id: dogs[0].id });
      setRecords(recs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.date || !dog) return;
    setSaving(true);
    const rec = await base44.entities.HealthRecord.create({
      dog_id: dog.id,
      type: form.type,
      title: form.title,
      date: form.date,
      next_date: form.next_date || null,
      details: form.details || null,
      value: form.value ? parseFloat(form.value) : null,
    });
    setRecords(prev => [rec, ...prev]);
    setForm({ type: "vaccine", title: "", date: "", next_date: "", details: "", value: "" });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.HealthRecord.delete(id);
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filtered = activeFilter === "all" ? records : records.filter(r => r.type === activeFilter);

  // Weight chart data
  const weightRecords = records
    .filter(r => r.type === "weight" && r.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      <div className="gradient-primary pt-10 pb-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl mb-1">Carnet de santé</h1>
            <p className="text-white/70 text-sm">
              {dog ? `Suivi de ${dog.name}` : "Chargement..."}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="h-10 px-4 bg-white text-primary font-semibold rounded-xl shadow-none hover:bg-white/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Add form */}
        {showForm && (
          <Card className="shadow-none border-primary/30 bg-secondary/30 animate-slide-up">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Nouvelle entrée</h3>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Type selector */}
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium tap-scale transition-all ${
                      form.type === t.value
                        ? t.color + " border-2"
                        : "bg-white text-muted-foreground border-border"
                    }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <Input
                placeholder="Titre (ex: Vaccin Rage, Visite contrôle...)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="h-11 rounded-xl border-border bg-white"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date *</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="h-11 rounded-xl border-border bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {form.type === "weight" ? "Poids (kg)" : "Prochain RDV"}
                  </Label>
                  {form.type === "weight" ? (
                    <Input
                      type="number"
                      placeholder="Ex: 8.5"
                      value={form.value}
                      onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                      className="h-11 rounded-xl border-border bg-white"
                    />
                  ) : (
                    <Input
                      type="date"
                      value={form.next_date}
                      onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
                      className="h-11 rounded-xl border-border bg-white"
                    />
                  )}
                </div>
              </div>

              <Textarea
                placeholder="Détails, notes, observations..."
                value={form.details}
                onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                className="rounded-xl border-border bg-white resize-none text-sm"
                rows={2}
              />

              <Button
                onClick={handleSave}
                disabled={!form.title || !form.date || saving}
                className="w-full h-11 rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-primary/25"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Weight summary */}
        {weightRecords.length > 0 && (
          <Card className="shadow-none border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Courbe de poids</h3>
                <span className="text-xs text-muted-foreground">{weightRecords.length} mesures</span>
              </div>
              <div className="flex items-end gap-1.5 h-16">
                {weightRecords.slice(-8).map((r, i) => {
                  const allValues = weightRecords.map(w => w.value);
                  const min = Math.min(...allValues);
                  const max = Math.max(...allValues);
                  const range = max - min || 1;
                  const height = Math.max(20, ((r.value - min) / range) * 80 + 20);
                  const isLast = i === weightRecords.slice(-8).length - 1;
                  return (
                    <div key={r.id} className="flex flex-col items-center gap-1 flex-1">
                      <span className={`text-[9px] font-medium ${isLast ? "text-primary" : "text-muted-foreground"}`}>
                        {r.value}
                      </span>
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${isLast ? "bg-primary" : "bg-secondary"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Dernier poids : <strong className="text-foreground">{weightRecords[weightRecords.length - 1]?.value} kg</strong>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter("all")}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
              activeFilter === "all" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border"
            }`}
          >
            Tout ({records.length})
          </button>
          {TYPES.map(t => {
            const count = records.filter(r => r.type === t.value).length;
            if (count === 0) return null;
            return (
              <button
                key={t.value}
                onClick={() => setActiveFilter(t.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                  activeFilter === t.value ? t.color + " border-2" : "bg-white text-muted-foreground border-border"
                }`}
              >
                <t.icon className="w-3 h-3" />
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Records list */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-muted-foreground text-sm">Aucune entrée pour l'instant.</p>
              <p className="text-xs text-muted-foreground mt-1">Appuyez sur + Ajouter pour commencer</p>
            </div>
          ) : (
            filtered.map(record => {
              const typeCfg = TYPE_MAP[record.type];
              return (
                <div
                  key={record.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-white"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeCfg.color}`}>
                    <typeCfg.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{record.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.date).toLocaleDateString("fr-FR")}
                      </p>
                      {record.value && record.type === "weight" && (
                        <span className="text-xs font-medium text-primary">{record.value} kg</span>
                      )}
                      {record.next_date && (
                        <span className="text-xs text-amber-600 font-medium">
                          Rappel : {new Date(record.next_date).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                    {record.details && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.details}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav currentPage="Notebook" />
    </div>
  );
}