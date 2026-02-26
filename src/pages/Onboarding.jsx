import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import StepDogInfo from "../components/onboarding/StepDogInfo";
import StepProfile from "../components/onboarding/StepProfile";
import StepHealth from "../components/onboarding/StepHealth";

const STEPS = [
  { title: "Votre chien", subtitle: "Les infos de base", icon: "🐶" },
  { title: "Son mode de vie", subtitle: "Activité & environnement", icon: "🌿" },
  { title: "Sa santé", subtitle: "Santé & vétérinaire", icon: "💊" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const canNext = () => {
    if (step === 0) return data.name && data.breed;
    return true;
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(s => s + 1);
    } else {
      setSaving(true);
      const user = await base44.auth.me();
      await base44.entities.Dog.create({
        ...data,
        owner: user.email,
        onboarding_completed: true,
      });
      navigate(createPageUrl("Home"));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary pt-12 pb-8 px-6 text-white">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-3xl">🐾</span>
          <span className="text-xl font-bold tracking-tight">PawCoach</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-5">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-3xl">{STEPS[step].icon}</span>
          <div>
            <p className="text-white/70 text-sm">{`Étape ${step + 1} sur 3`}</p>
            <h1 className="text-2xl font-bold">{STEPS[step].title}</h1>
            <p className="text-white/80 text-sm">{STEPS[step].subtitle}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {step === 0 && <StepDogInfo data={data} onChange={handleChange} />}
        {step === 1 && <StepProfile data={data} onChange={handleChange} />}
        {step === 2 && <StepHealth data={data} onChange={handleChange} />}
      </div>

      {/* Footer */}
      <div className="px-5 pb-8 pt-4 bg-white border-t border-border">
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="flex-none h-13 px-5 rounded-xl border-border"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canNext() || saving}
            className="flex-1 h-13 rounded-xl gradient-primary border-0 text-white font-semibold text-base shadow-lg shadow-primary/30 gap-2"
          >
            {saving ? (
              <span className="animate-pulse">Création du profil...</span>
            ) : step === 2 ? (
              <>
                <Sparkles className="w-5 h-5" />
                Créer le profil de {data.name || "mon chien"}
              </>
            ) : (
              <>
                Continuer
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Vous pourrez modifier ces informations à tout moment
        </p>
      </div>
    </div>
  );
}