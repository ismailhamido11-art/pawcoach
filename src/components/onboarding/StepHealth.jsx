import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import VetBookletScanner from "./VetBookletScanner";
import VoiceInput from "@/components/ui/VoiceInput";

export default function StepHealth({ data, onChange, dogName, onVetDataExtracted }) {
  return (
    <div className="space-y-6">
      {/* Vet booklet scanner */}
      <VetBookletScanner dogName={dogName} onDataExtracted={onVetDataExtracted} />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">ou remplis manuellement</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Optional notice */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
        <Info className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-700">
          Ces informations sont <strong>optionnelles</strong>. Tu pourras les compléter plus tard depuis le carnet de santé.
        </p>
      </div>

      {/* Allergies */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Allergies connues
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex: poulet, gluten, acariens..."
            value={data.allergies || ""}
            onChange={e => onChange("allergies", e.target.value)}
            className="h-11 rounded-2xl border-border bg-white shadow-sm"
          />
          <VoiceInput onTranscript={t => onChange("allergies", t)} />
        </div>
      </div>

      {/* Last vaccine */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Dernier vaccin
        </Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Nom du vaccin"
            value={data.last_vaccine || ""}
            onChange={e => onChange("last_vaccine", e.target.value)}
            className="h-11 rounded-2xl border-border bg-white shadow-sm"
          />
          <VoiceInput onTranscript={t => onChange("last_vaccine", t)} />
        </div>
        <Input
          type="date"
          value={data.last_vaccine_date || ""}
          onChange={e => onChange("last_vaccine_date", e.target.value)}
          className="h-11 rounded-2xl border-border bg-white shadow-sm"
        />
      </div>

      {/* Health issues */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Problèmes de santé connus
        </Label>
        <div className="flex gap-2 items-start">
          <Textarea
            placeholder="Ex: dysplasie de la hanche, épilepsie, problèmes cardiaques..."
            value={data.health_issues || ""}
            onChange={e => onChange("health_issues", e.target.value)}
            className="rounded-2xl border-border bg-white shadow-sm resize-none min-h-[90px]"
          />
          <VoiceInput onTranscript={t => onChange("health_issues", (data.health_issues ? data.health_issues + " " : "") + t)} />
        </div>
      </div>

      {/* Vet */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Vétérinaire habituel <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nom du vétérinaire"
              value={data.vet_name || ""}
              onChange={e => onChange("vet_name", e.target.value)}
              className="h-11 rounded-2xl border-border bg-white shadow-sm"
            />
            <VoiceInput onTranscript={t => onChange("vet_name", t)} />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ville"
              value={data.vet_city || ""}
              onChange={e => onChange("vet_city", e.target.value)}
              className="h-11 rounded-2xl border-border bg-white shadow-sm"
            />
            <VoiceInput onTranscript={t => onChange("vet_city", t)} />
          </div>
        </div>
      </div>
    </div>
  );
}