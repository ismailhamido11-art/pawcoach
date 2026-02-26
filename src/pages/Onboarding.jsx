import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import StepDogInfo from "../components/onboarding/StepDogInfo";
import StepProfile from "../components/onboarding/StepProfile";
import StepHealth from "../components/onboarding/StepHealth";

const STEPS = [
  { title: "Ton chien", subtitle: "Présente-nous ton compagnon 🐶", icon: "🐾" },
  { title: "Son mode de vie", subtitle: "Activité & environnement 🌿", icon: "🌿" },
  { title: "Sa santé", subtitle: "Santé & vétérinaire 💊", icon: "💊" },
];

// Convert approximate age to a birth_date string
function approxAgeToBirthDate(years, months) {
  const now = new Date();
  now.setFullYear(now.getFullYear() - (years || 0));
  now.setMonth(now.getMonth() - (months || 0));
  return now.toISOString().split("T")[0];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    if (step === 0) return !!data.name;
    return true;
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setSaving(true);
      const user = await base44.auth.me();

      // Resolve birth_date
      let birth_date = data.birth_date;
      if (!birth_date && (data.age_years || data.age_months)) {
        birth_date = approxAgeToBirthDate(data.age_years, data.age_months);
      }

      await base44.entities.Dog.create({
        name: data.name,
        photo: data.photo || null,
        breed: data.breed || null,
        birth_date: birth_date || null,
        sex: data.sex || null,
        neutered: data.neutered ?? null,
        weight: data.weight || null,
        activity_level: data.activity_level || null,
        environment: data.environment || null,
        other_animals: data.other_animals ?? null,
        allergies: data.allergies || null,
        last_vaccine: data.last_vaccine || null,
        last_vaccine_date: data.last_vaccine_date || null,
        health_issues: data.health_issues || null,
        vet_name: data.vet_name || null,
        vet_city: data.vet_city || null,
        owner: user.email,
        onboarding_completed: true,
      });
      navigate(createPageUrl("Home"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top gradient header */}
      <div className="gradient-primary px-5 pt-safe-top pb-6">
        {/* Logo */}
        <div className="flex items-center gap-2 pt-4 mb-6">
          <span className="text-2xl">🐾</span>
          <span className="text-white font-bold text-lg tracking-tight">PawCoach</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 relative h-1.5 rounded-full overflow-hidden bg-white/25">
              <div
                className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-500"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Step title */}
        <div>
          <p className="text-white/60 text-xs font-medium mb-1">Étape {step + 1} sur 3</p>
          <h1 className="text-white text-2xl font-bold">{STEPS[step].title}</h1>
          <p className="text-white/75 text-sm mt-0.5">{STEPS[step].subtitle}</p>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-6">
          {step === 0 && <StepDogInfo data={data} onChange={handleChange} />}
          {step === 1 && <StepProfile data={data} onChange={handleChange} />}
          {step === 2 && <StepHealth data={data} onChange={handleChange} />}
        </div>
      </div>

      {/* Footer button */}
      <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4 pb-safe-bottom">
        <Button
          onClick={handleNext}
          disabled={!canNext() || saving}
          className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base shadow-lg shadow-primary/30 gap-2 disabled:opacity-50"
        >
          {saving ? (
            <span className="animate-pulse-soft">Création du profil...</span>
          ) : step === 2 ? (
            <>
              <Sparkles className="w-5 h-5" />
              Créer le profil de {data.name || "mon chien"}
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </Button>
        {!canNext() && step === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Le prénom de votre chien est requis pour continuer
          </p>
        )}
      </div>
    </div>
  );
}