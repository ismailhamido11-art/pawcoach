import { Label } from "@/components/ui/label";

const ACTIVITY_LEVELS = [
  { value: "faible", label: "🛋️ Faible", desc: "Peu de sorties, sédentaire" },
  { value: "modere", label: "🚶 Modéré", desc: "2-3 sorties/jour, ~1h" },
  { value: "eleve", label: "🏃 Élevé", desc: "Sportif, >2h d'activité" },
  { value: "tres_eleve", label: "⚡ Très élevé", desc: "Sport intensif, agility..." },
];

const ENVIRONMENTS = [
  { value: "appartement", label: "🏢 Appartement" },
  { value: "maison_sans_jardin", label: "🏠 Maison sans jardin" },
  { value: "maison_avec_jardin", label: "🌿 Maison avec jardin" },
];

export default function StepProfile({ data, onChange }) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Niveau d'activité
        </Label>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map(l => (
            <button
              key={l.value}
              onClick={() => onChange("activity_level", l.value)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all tap-scale ${
                data.activity_level === l.value
                  ? "border-primary bg-secondary"
                  : "border-border bg-white"
              }`}
            >
              <span className="text-xl">{l.label.split(" ")[0]}</span>
              <div>
                <p className={`text-sm font-semibold ${data.activity_level === l.value ? "text-primary" : "text-foreground"}`}>
                  {l.label.split(" ").slice(1).join(" ")}
                </p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Environnement de vie
        </Label>
        <div className="space-y-2">
          {ENVIRONMENTS.map(e => (
            <button
              key={e.value}
              onClick={() => onChange("environment", e.value)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all tap-scale ${
                data.environment === e.value
                  ? "border-primary bg-secondary"
                  : "border-border bg-white"
              }`}
            >
              <span className="text-xl">{e.label.split(" ")[0]}</span>
              <p className={`text-sm font-semibold ${data.environment === e.value ? "text-primary" : "text-foreground"}`}>
                {e.label.split(" ").slice(1).join(" ")}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 block">
          Vit avec d'autres animaux ?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: true, label: "🐾 Oui" }, { value: false, label: "🙅 Non" }].map(s => (
            <button
              key={String(s.value)}
              onClick={() => onChange("other_animals", s.value)}
              className={`h-12 rounded-xl border-2 font-medium text-sm transition-all tap-scale ${
                data.other_animals === s.value
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}