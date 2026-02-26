import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const BREEDS = [
  "Labrador Retriever", "Berger Allemand", "Golden Retriever", "Bouledogue Français",
  "Beagle", "Caniche", "Chihuahua", "Yorkshire Terrier", "Husky Sibérien",
  "Border Collie", "Shih Tzu", "Cavalier King Charles", "Maltais", "Bichon Frisé",
  "Teckel", "Berger Australien", "Spitz Nain", "Dalmatien", "Autre"
];

export default function StepDogInfo({ data, onChange }) {
  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Prénom de votre chien *
        </Label>
        <Input
          placeholder="Ex: Lulu, Max, Bella..."
          value={data.name || ""}
          onChange={e => onChange("name", e.target.value)}
          className="h-12 rounded-xl border-border bg-white text-base"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Race *</Label>
        <select
          value={data.breed || ""}
          onChange={e => onChange("breed", e.target.value)}
          className="w-full h-12 rounded-xl border border-border bg-white px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choisir une race...</option>
          {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Date de naissance
          </Label>
          <Input
            type="date"
            value={data.birth_date || ""}
            onChange={e => onChange("birth_date", e.target.value)}
            className="h-12 rounded-xl border-border bg-white"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-foreground mb-2 block">
            Poids (kg)
          </Label>
          <Input
            type="number"
            placeholder="Ex: 8.5"
            value={data.weight || ""}
            onChange={e => onChange("weight", parseFloat(e.target.value))}
            className="h-12 rounded-xl border-border bg-white"
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Sexe</Label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: "male", label: "♂ Mâle" }, { value: "female", label: "♀ Femelle" }].map(s => (
            <button
              key={s.value}
              onClick={() => onChange("sex", s.value)}
              className={`h-12 rounded-xl border-2 font-medium text-sm transition-all tap-scale ${
                data.sex === s.value
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Stérilisé(e) ?</Label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: true, label: "✓ Oui" }, { value: false, label: "✗ Non" }].map(s => (
            <button
              key={String(s.value)}
              onClick={() => onChange("neutered", s.value)}
              className={`h-12 rounded-xl border-2 font-medium text-sm transition-all tap-scale ${
                data.neutered === s.value
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