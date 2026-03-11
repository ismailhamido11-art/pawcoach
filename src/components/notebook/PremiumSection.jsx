import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Pill, FileText, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { RecordRow } from "./SectionVaccins";
import { isValidDate } from "@/utils/healthStatus";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 };

const GATE_CONTENT = {
  vet_visit: {
    Icon: Stethoscope,
    title: "Suivi veterinaire complet",
    description: "Note chaque visite, garde l'historique et partage-le avec ton veto en un tap. Plus jamais de 'c'etait quand deja ?'",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  medication: {
    Icon: Pill,
    title: "Gestion des traitements",
    description: "Enregistre les medicaments, doses et frequences. Recois des rappels pour ne jamais oublier un traitement.",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  note: {
    Icon: FileText,
    title: "Notes libres",
    description: "Consigne tout ce qui compte : comportements inhabituels, questions pour le veto, observations quotidiennes.",
    color: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
};

export default function PremiumSection({ type, records = [], dogId, isPremium, onDelete, onRecordAdded, config }) {
  const navigate = useNavigate();
  const filtered = records.filter(r => r.type === type).sort((a, b) => new Date(b.date) - new Date(a.date));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", date: new Date().toISOString().split("T")[0], nextDate: "", details: "" });

  if (!isPremium) {
    const gate = GATE_CONTENT[type] || GATE_CONTENT.note;
    const GateIcon = gate.Icon;
    return (
      <div className={`rounded-2xl border p-6 mx-1 mt-2 ${gate.color}`}>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className={`w-14 h-14 rounded-2xl ${gate.iconBg} flex items-center justify-center`}>
            <GateIcon className={`w-7 h-7 ${gate.iconColor}`} />
          </div>
          <p className="font-bold text-foreground text-base">{gate.title}</p>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            {gate.description}
          </p>
          <Button onClick={() => navigate(createPageUrl("Premium") + "?from=notebook")} className="rounded-xl gradient-warm border-0 text-white font-semibold px-6 h-11 mt-1">
            Passer Premium
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Titre requis"); return; }
    setSaving(true);
    try {
      const payload = {
        dog_id: dogId,
        type,
        title: form.title.trim(),
        date: form.date,
      };
      if (form.nextDate) payload.next_date = form.nextDate;
      if (form.details.trim()) payload.details = form.details.trim();

      const record = await base44.entities.HealthRecord.create(payload);
      if (onRecordAdded) onRecordAdded(record);
      toast.success("Enregistre !");
      setForm({ title: "", date: new Date().toISOString().split("T")[0], nextDate: "", details: "" });
      setShowForm(false);
    } catch (e) {
      console.error("PremiumSection save error:", e);
      toast.error("Erreur lors de l'enregistrement");
    }
    setSaving(false);
  };

  const ConfigIcon = config.Icon;

  return (
    <div className="space-y-3">
      {/* Add button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={spring}
        onClick={() => setShowForm(!showForm)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white ${config.btnClass}`}
      >
        {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? "Fermer" : config.addLabel}
      </motion.button>

      {/* Inline form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className={`rounded-2xl border p-4 space-y-3 ${config.bgClass} ${config.borderClass}`}>
              <div>
                <label className="text-xs font-medium text-foreground">Titre *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={config.placeholder}
                  className="mt-1 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Date</label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="mt-1 bg-white"
                  />
                </div>
                {config.showNextDate && (
                  <div>
                    <label className="text-xs font-medium text-foreground">Prochain</label>
                    <Input
                      type="date"
                      value={form.nextDate}
                      onChange={(e) => setForm(f => ({ ...f, nextDate: e.target.value }))}
                      className="mt-1 bg-white"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Details</label>
                <Textarea
                  value={form.details}
                  onChange={(e) => setForm(f => ({ ...f, details: e.target.value }))}
                  placeholder="Details optionnels..."
                  className="mt-1 bg-white min-h-[60px]"
                />
              </div>
              <Button onClick={handleSave} disabled={saving || !form.title.trim()} className={`w-full text-white ${config.btnClass}`}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && !showForm && (
        <div className="text-center py-8">
          <ConfigIcon className={`w-8 h-8 mx-auto mb-2 ${config.textClass} opacity-40`} />
          <p className="text-muted-foreground text-sm">{config.emptyText}</p>
        </div>
      )}

      {/* Records list */}
      {filtered.map(r => (
        <RecordRow key={r.id} record={r} onDelete={onDelete}
          icon={<ConfigIcon className={`w-4 h-4 ${config.textClass}`} />}
          accentClass={`${config.bgClass} ${config.borderClass}`}
          extra={isValidDate(r.next_date) ? (
            <span className="text-xs text-emerald-600 font-medium">
              Prochain : {new Date(r.next_date).toLocaleDateString("fr-FR")}
            </span>
          ) : null}
        />
      ))}
    </div>
  );
}
