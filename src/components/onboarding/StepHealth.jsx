import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function StepHealth({ data, onChange }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Allergies connues
        </Label>
        <Input
          placeholder="Ex: poulet, gluten... ou aucune"
          value={data.allergies || ""}
          onChange={e => onChange("allergies", e.target.value)}
          className="h-12 rounded-xl border-border bg-white"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Problèmes de santé
        </Label>
        <Textarea
          placeholder="Ex: arthrite, problèmes digestifs... ou aucun"
          value={data.health_issues || ""}
          onChange={e => onChange("health_issues", e.target.value)}
          className="rounded-xl border-border bg-white resize-none"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Dernier vaccin
          </Label>
          <Input
            placeholder="Ex: Rage, DHPPi..."
            value={data.last_vaccine || ""}
            onChange={e => onChange("last_vaccine", e.target.value)}
            className="h-12 rounded-xl border-border bg-white"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Date du vaccin
          </Label>
          <Input
            type="date"
            value={data.last_vaccine_date || ""}
            onChange={e => onChange("last_vaccine_date", e.target.value)}
            className="h-12 rounded-xl border-border bg-white"
          />
        </div>
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 border border-border">
        <p className="text-xs font-semibold text-primary mb-1">🏥 Vétérinaire (optionnel)</p>
        <div className="space-y-3">
          <Input
            placeholder="Nom du vétérinaire"
            value={data.vet_name || ""}
            onChange={e => onChange("vet_name", e.target.value)}
            className="h-10 rounded-lg border-border bg-white text-sm"
          />
          <Input
            placeholder="Ville"
            value={data.vet_city || ""}
            onChange={e => onChange("vet_city", e.target.value)}
            className="h-10 rounded-lg border-border bg-white text-sm"
          />
        </div>
      </div>
    </div>
  );
}