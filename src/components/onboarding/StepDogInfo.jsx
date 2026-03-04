import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import VoiceInput from "@/components/ui/VoiceInput";

const BREEDS = [
  "Berger Allemand", "Berger Australien", "Berger Belge", "Beagle", "Bichon Frisé",
  "Border Collie", "Bouledogue Français", "Boxer", "Braque", "Caniche",
  "Cavalier King Charles", "Chihuahua", "Cocker", "Colley", "Corgi",
  "Dalmatien", "Doberman", "Dogue Allemand", "Épagneul Breton", "Golden Retriever",
  "Husky", "Jack Russell", "Labrador", "Lhassa Apso", "Malinois",
  "Pinscher", "Rottweiler", "Saint-Bernard", "Samoyède", "Setter",
  "Shiba Inu", "Shih Tzu", "Spitz", "Staff", "Teckel",
  "Terre-Neuve", "Westie", "Yorkshire", "Croisé", "Je ne sais pas"
];

export default function StepDogInfo({ data, onChange }) {
  const [ageMode, setAgeMode] = useState(data.birth_date ? "exact" : "approx");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handlePhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange("photo", file_url);
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Photo */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="relative w-28 h-28 rounded-3xl border-2 border-dashed border-primary/40 bg-secondary/40 flex items-center justify-center overflow-hidden tap-scale transition-all hover:border-primary hover:bg-secondary"
        >
          {data.photo ? (
            <img src={data.photo} alt="Chien" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-primary/60">
              {uploading ? (
                <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-4xl">🐕</span>
                  <span className="text-[10px] font-medium">Ajouter photo</span>
                </>
              )}
            </div>
          )}
          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="w-3 h-3 text-white" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => e.target.files[0] && handlePhoto(e.target.files[0])}
        />
        <p className="text-xs text-muted-foreground">Photo optionnelle</p>
      </div>

      {/* Name */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          Prenom de ton chien <span className="text-primary">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Ex : Lulu, Max, Bella..."
            value={data.name || ""}
            onChange={e => onChange("name", e.target.value)}
            className="h-11 rounded-2xl border-border bg-white text-base shadow-sm focus-visible:ring-primary"
          />
          <VoiceInput onTranscript={t => onChange("name", t)} />
        </div>
      </div>

      {/* Breed */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Race</Label>
        <select
          value={data.breed || ""}
          onChange={e => onChange("breed", e.target.value)}
          className="w-full h-13 rounded-2xl border border-border bg-white px-4 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center" }}
        >
          <option value="">Choisir une race...</option>
          {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Age / Birth date */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Âge / Date de naissance</Label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { key: "exact", label: "📅 Date exacte" },
            { key: "approx", label: "📆 Âge approximatif" },
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setAgeMode(opt.key)}
              className={`h-10 rounded-xl border-2 text-sm font-medium transition-all tap-scale ${
                ageMode === opt.key
                  ? "border-primary bg-secondary text-primary"
                  : "border-border bg-white text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {ageMode === "exact" ? (
          <Input
            type="date"
            value={data.birth_date || ""}
            onChange={e => onChange("birth_date", e.target.value)}
            className="h-13 rounded-2xl border-border bg-white shadow-sm"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Années</Label>
              <Input
                type="number"
                min="0"
                max="25"
                placeholder="0"
                value={data.age_years || ""}
                onChange={e => onChange("age_years", parseInt(e.target.value) || 0)}
                className="h-13 rounded-2xl border-border bg-white shadow-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mois</Label>
              <Input
                type="number"
                min="0"
                max="11"
                placeholder="0"
                value={data.age_months || ""}
                onChange={e => onChange("age_months", parseInt(e.target.value) || 0)}
                className="h-13 rounded-2xl border-border bg-white shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sex */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">Sexe</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "male", emoji: "♂️", label: "Mâle" },
            { value: "female", emoji: "♀️", label: "Femelle" },
          ].map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange("sex", s.value)}
              className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all tap-scale ${
                data.sex === s.value
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

      {/* Neutered */}
      <div>
        <Label className="text-sm font-semibold text-foreground mb-2 block">
          {data.sex === "female" ? "Stérilisée ?" : "Castré ?"}
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: true, emoji: "✅", label: "Oui" },
            { value: false, emoji: "❌", label: "Non" },
          ].map(s => (
            <button
              key={String(s.value)}
              type="button"
              onClick={() => onChange("neutered", s.value)}
              className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all tap-scale ${
                data.neutered === s.value
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