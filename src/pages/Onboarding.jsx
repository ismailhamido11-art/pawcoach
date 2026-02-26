import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, ChevronLeft } from "lucide-react";
import StepDogInfo from "../components/onboarding/StepDogInfo";
import StepProfile from "../components/onboarding/StepProfile";
import StepHealth from "../components/onboarding/StepHealth";
import WelcomeScreen from "../components/onboarding/WelcomeScreen";

const STEPS = [
  { title: "Ton chien", subtitle: "Présente-nous ton compagnon 🐶" },
  { title: "Son profil", subtitle: "Activité & environnement 🌿" },
  { title: "Sa santé", subtitle: "Santé & vétérinaire 💊" },
];

function approxAgeToBirthDate(years, months) {
  const now = new Date();
  now.setFullYear(now.getFullYear() - (years || 0));
  now.setMonth(now.getMonth() - (months || 0));
  return now.toISOString().split("T")[0];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [vetExtracted, setVetExtracted] = useState(null);

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
      return;
    }

    setSaving(true);
    const user = await base44.auth.me();

    let birth_date = data.birth_date;
    if (!birth_date && (data.age_years || data.age_months)) {
      birth_date = approxAgeToBirthDate(data.age_years, data.age_months);
    }

    const dog = await base44.entities.Dog.create({
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

    // Save vet booklet extracted data as HealthRecords
    if (vetExtracted && dog?.id) {
      const records = [];
      (vetExtracted.vaccines || []).forEach(v => {
        if (v.name && v.name !== "illisible") {
          records.push({ dog_id: dog.id, type: "vaccine", title: v.name, date: v.date || new Date().toISOString().split("T")[0] });
        }
      });
      (vetExtracted.treatments || []).forEach(t => {
        if (t.name && t.name !== "illisible") {
          records.push({ dog_id: dog.id, type: "medication", title: t.name, date: t.date || new Date().toISOString().split("T")[0] });
        }
      });
      (vetExtracted.weight_records || []).forEach(w => {
        if (w.weight_kg) {
          records.push({ dog_id: dog.id, type: "weight", title: `Poids: ${w.weight_kg} kg`, date: w.date || new Date().toISOString().split("T")[0], value: w.weight_kg });
        }
      });
      if (records.length > 0) {
        await base44.entities.HealthRecord.bulkCreate(records);
      }
    }

    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `Bienvenue sur PawCoach, ${user.full_name || "l'ami"} !`,
        body: `${data.name} est maintenant inscrit ! Voici 3 choses à essayer :\n1) Scanne les croquettes de ${data.name}\n2) Demande un conseil à l'assistant IA\n3) Commence le premier exercice de dressage.`,
      });
    } catch (e) {
      console.error("Failed to send welcome email", e);
    }

    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <WelcomeScreen
        dogName={data.name}
        dogPhoto={data.photo}
        onDiscover={() => navigate(createPageUrl("Home"))}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
        <div className="flex items-center gap-2 mb-6">
          {step > 0 && (
            <button
              onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0 }); }}
              className="mr-1 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center tap-scale"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <span className="text-2xl">🐾</span>
          <span className="text-white font-bold text-lg tracking-tight">PawCoach</span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/25">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div>
          <p className="text-white/60 text-xs font-medium mb-1">Étape {step + 1} sur {STEPS.length}</p>
          <h1 className="text-white text-2xl font-bold">{STEPS[step].title}</h1>
          <p className="text-white/75 text-sm mt-0.5">{STEPS[step].subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-6">
          {step === 0 && <StepDogInfo data={data} onChange={handleChange} />}
          {step === 1 && <StepProfile data={data} onChange={handleChange} />}
          {step === 2 && <StepHealth data={data} onChange={handleChange} dogName={data.name} onVetDataExtracted={setVetExtracted} />}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-border px-5 py-4">
        <Button
          onClick={handleNext}
          disabled={!canNext() || saving}
          className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold text-base shadow-lg shadow-primary/30 gap-2 disabled:opacity-50"
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