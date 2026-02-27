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

export default function PremiumSection({ type, records, dogId, isPremium, onDelete, config }) {

  const filtered = records.filter(r => r.type === type).sort((a, b) => new Date(b.date) - new Date(a.date));

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
        <Button onClick={() => window.location.href = '/Premium'} className="rounded-xl gradient-warm border-0 text-white font-semibold px-6">
          Passer Premium 🌟
        </Button>
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
          extra={r.next_date && (
            <span className="text-xs text-amber-600 font-medium">
              Prochain : {new Date(r.next_date).toLocaleDateString("fr-FR")}
            </span>
          )}
        />
      ))}
    </div>
  );
}