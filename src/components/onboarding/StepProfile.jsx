import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const ACTIVITY_LEVELS = [
  { value: "faible", emoji: "🛋️", label: "Calme", desc: "Peu de sorties" },
  { value: "modere", emoji: "🚶", label: "Modéré", desc: "1-2h/jour" },
  { value: "eleve", emoji: "🏃", label: "Actif", desc: "2-4h/jour" },
  { value: "tres_eleve", emoji: "⚡", label: "Très actif", desc: "+4h/jour" },
];

const ENVIRONMENTS = [
  { value: "appartement", emoji: "🏢", label: "Appartement" },
  { value: "maison_sans_jardin", emoji: "🏠", label: "Maison avec jardin" },
  { value: "ferme", emoji: "🌾", label: "Ferme / Campagne" },
];

export default function StepProfile({ data, onChange }) {
  const weight = data.weight || 10;

  return (
    <div className="space-y-7">
      {/* Weight */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-1 block">
          Poids actuel
        </Label>
        <div className="flex items-center justify-between mb-3">
          <span className="text-3xl font-bold text-primary">{weight}</span>
          <span className="text-muted-foreground text-sm font-medium">kg</span>
        </div>
        <Slider
          min={1}
          max={80}
          step={0.5}
          value={[weight]}
          onValueChange={([v]) => onChange("weight", v)}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 kg</span>
          <span>80 kg</span>
        </div>
        <Input
          type="number"
          min={1}
          max={80}
          step={0.1}
          value={weight}
          onChange={e => onChange("weight", parseFloat(e.target.value) || 1)}
          className="mt-3 h-12 rounded-2xl border-border bg-white shadow-sm text-center font-semibold"
          placeholder="Poids en kg"
        />
      </div>

      {/* Activity level */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Niveau d'activité
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_LEVELS.map(a => (
            <button
              key={a.value}
              type="button"
              onClick={() => onChange("activity_level", a.value)}
              className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-1.5 transition-all tap-scale ${
                data.activity_level === a.value
                  ? "border-primary bg-secondary shadow-sm"
                  : "border-border bg-white"
              }`}
            >
              <span className="text-3xl">{a.emoji}</span>
              <span className={`font-semibold text-sm ${data.activity_level === a.value ? "text-primary" : "text-foreground"}`}>
                {a.label}
              </span>
              <span className="text-xs text-muted-foreground">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Environnement de vie
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {ENVIRONMENTS.map(e => (
            <button
              key={e.value}
              type="button"
              onClick={() => onChange("environment", e.value)}
              className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all tap-scale ${
                data.environment === e.value
                  ? "border-primary bg-secondary shadow-sm"
                  : "border-border bg-white"
              }`}
            >
              <span className="text-3xl">{e.emoji}</span>
              <span className={`font-medium text-xs text-center leading-tight ${data.environment === e.value ? "text-primary" : "text-foreground"}`}>
                {e.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Other animals */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Vit avec d'autres animaux ?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, emoji: "🐱", label: "Oui" },
            { value: false, emoji: "🐾", label: "Non, seul" },
          ].map(s => (
            <button
              key={String(s.value)}
              type="button"
              onClick={() => onChange("other_animals", s.value)}
              className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all tap-scale ${
                data.other_animals === s.value
                  ? "border-primary bg-secondary text-primary shadow-sm"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              <span className="text-xl">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}