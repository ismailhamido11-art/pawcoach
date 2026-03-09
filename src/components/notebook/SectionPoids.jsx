import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Weight, Plus, X, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const spring = { type: "spring", stiffness: 400, damping: 30 };

export default function SectionPoids({ records = [], dogId, onDelete, onRecordAdded }) {
  const [period, setPeriod] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: "", date: new Date().toISOString().split("T")[0] });

  const handleSaveWeight = async () => {
    const w = parseFloat(form.weight);
    if (!w || w <= 0 || w > 200) { toast.error("Poids invalide."); return; }
    if (!form.date) { toast.error("Date requise."); return; }
    setSaving(true);
    try {
      const record = await base44.entities.HealthRecord.create({
        dog_id: dogId,
        type: "weight",
        title: "Pesee",
        date: form.date,
        value: w,
      });
      if (onRecordAdded) onRecordAdded(record);
      toast.success("Poids enregistre !");
      setShowAddForm(false);
      setForm({ weight: "", date: new Date().toISOString().split("T")[0] });
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const allWeights = records.filter(r => r.type === "weight" && r.value)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const now = new Date();
  const getStartDate = () => {
    if (period === "1M") return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    if (period === "6M") return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    if (period === "1Y") return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return new Date(0);
  };
  
  const startDate = getStartDate();
  const weights = allWeights.filter(r => new Date(r.date) >= startDate);

  const chartData = weights.map(r => ({
    date: new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    poids: r.value,
    id: r.id,
  }));

  return (
    <div className="space-y-3">
      {/* Add weight button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={spring}
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-primary text-sm font-semibold hover:bg-emerald-100 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ajouter un poids
      </motion.button>

      {/* Inline add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <p className="text-sm font-bold text-foreground">Enregistrer un poids</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Poids (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                    placeholder="Ex: 12.5"
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full mt-1 text-sm border border-border rounded-xl px-3 py-2.5 bg-background"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 rounded-xl" onClick={handleSaveWeight} disabled={saving}>
                  {saving ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1" />Enregistrement...</> : <><Check className="w-3.5 h-3.5 mr-1" />Enregistrer</>}
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {allWeights.length >= 2 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-foreground">Courbe de poids</p>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {["1M", "6M", "1Y", "All"].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${period === p ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {weights.length >= 2 ? (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v) => [`${v} kg`, "Poids"]} labelStyle={{ fontSize: 11 }} contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="poids" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-xs text-muted-foreground">Pas assez de données sur cette période</div>
          )}
          {weights.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Dernier poids : <strong className="text-foreground">{weights[weights.length - 1].value} kg</strong>
            </p>
          )}
        </div>
      )}

      {weights.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">⚖️</p>
          <p className="text-muted-foreground text-sm">Aucune pesée enregistrée</p>
        </div>
      )}

      {weights.slice().reverse().map(r => (
        <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border bg-emerald-50 border-emerald-100">
            <Weight className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-primary text-base">{r.value} kg</p>
            <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString("fr-FR")}</p>
          </div>
          {onDelete && (
            <button onClick={() => onDelete(r.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}

    </div>
  );
}