import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Pill, FileText } from "lucide-react";
import { RecordRow, isValidDate } from "./SectionVaccins";

const GATE_CONTENT = {
  vet_visit: {
    Icon: Stethoscope,
    title: "Suivi vétérinaire complet",
    description: "Note chaque visite, garde l'historique et partage-le avec ton véto en un tap. Plus jamais de « c'était quand déjà ? »",
    color: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  medication: {
    Icon: Pill,
    title: "Gestion des traitements",
    description: "Enregistre les médicaments, doses et fréquences. Reçois des rappels pour ne jamais oublier un traitement.",
    color: "bg-purple-50 border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  note: {
    Icon: FileText,
    title: "Notes libres",
    description: "Consigne tout ce qui compte : comportements inhabituels, questions pour le véto, observations quotidiennes.",
    color: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
};

export default function PremiumSection({ type, records, dogId, isPremium, onDelete, config }) {
  const navigate = useNavigate();
  const filtered = records.filter(r => r.type === type).sort((a, b) => new Date(b.date) - new Date(a.date));

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
            Débloquer avec Premium ✨
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-3xl mb-2">{config.emoji}</p>
          <p className="text-muted-foreground text-sm">{config.emptyText}</p>
        </div>
      )}

      {filtered.map(r => (
        <RecordRow key={r.id} record={r} onDelete={onDelete}
          icon={<config.Icon className={`w-4 h-4 ${config.textClass}`} />}
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