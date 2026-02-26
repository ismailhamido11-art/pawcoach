import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanLine, MessageCircle, Dumbbell, BookHeart, ChevronRight, Sparkles } from "lucide-react";

function getAge(birthDate) {
  if (!birthDate) return null;
  const now = new Date();
  const birth = new Date(birthDate);
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 12) return `${totalMonths} mois`;
  if (years === 1) return "1 an";
  return `${years} ans`;
}

const QUICK_ACTIONS = [
  { label: "Scanner un aliment", icon: ScanLine, page: "Scan", color: "bg-amber-50 text-amber-600", border: "border-amber-200" },
  { label: "Parler à PawCoach", icon: MessageCircle, page: "Chat", color: "bg-teal-50 text-primary", border: "border-teal-200" },
  { label: "Séance de dressage", icon: Dumbbell, page: "Training", color: "bg-purple-50 text-purple-600", border: "border-purple-200" },
  { label: "Carnet de santé", icon: BookHeart, page: "Notebook", color: "bg-rose-50 text-rose-600", border: "border-rose-200" },
];

const TIPS = [
  "💧 Un chien adulte a besoin de 50 ml d'eau par kg de poids corporel par jour.",
  "🦷 Brosser les dents de votre chien 2-3 fois par semaine prévient les maladies parodontales.",
  "🌞 Évitez les sorties entre 12h et 16h en été pour protéger les coussinets.",
  "🎾 10 minutes de jeu mental fatigue autant qu'une heure de marche.",
  "🥩 Les chiens ont besoin de protéines animales de qualité comme base de leur alimentation.",
  "😴 Un chien adulte dort 12 à 14h par jour, c'est tout à fait normal !",
];

export default function Home() {
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    loadDog();
  }, []);

  const loadDog = async () => {
    try {
      const user = await base44.auth.me();
      const dogs = await base44.entities.Dog.filter({ owner: user.email });
      if (dogs.length === 0) {
        navigate(createPageUrl("Onboarding"));
      } else {
        setDog(dogs[0]);
      }
    } catch {
      navigate(createPageUrl("Onboarding"));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce-soft">🐾</span>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <WellnessBanner />

      {/* Hero header */}
      <div className="gradient-primary pt-12 pb-10 px-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-white font-bold text-lg tracking-tight">PawCoach</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("Onboarding"))}
            className="text-white/70 text-xs hover:text-white hover:bg-white/10 rounded-xl"
          >
            Modifier
          </Button>
        </div>

        {dog && (
          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30">
              {dog.photo ? (
                <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🐕</span>
              )}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">{dog.name}</h1>
              <p className="text-white/80 text-sm font-medium">{dog.breed}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {getAge(dog.birth_date) && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">
                    {getAge(dog.birth_date)}
                  </span>
                )}
                {dog.weight && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full">
                    {dog.weight} kg
                  </span>
                )}
                {dog.activity_level && (
                  <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full capitalize">
                    {dog.activity_level.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Tip of the day */}
        <Card className="border-amber-200 bg-amber-50 shadow-none">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Conseil du jour</p>
                <p className="text-sm text-amber-800">{tip}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Accès rapide
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, icon: Icon, page, color, border }) => (
              <button
                key={page}
                onClick={() => navigate(createPageUrl(page))}
                className={`p-4 rounded-2xl border ${border} ${color} bg-opacity-60 flex flex-col items-start gap-3 tap-scale transition-all hover:shadow-md text-left`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-semibold leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dog health summary */}
        {dog && (
          <Card className="shadow-none border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Profil santé</h2>
                <button
                  onClick={() => navigate(createPageUrl("Notebook"))}
                  className="text-xs text-primary font-medium flex items-center gap-1"
                >
                  Voir tout <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Allergies", value: dog.allergies ? "⚠️" : "✅", sub: dog.allergies || "Aucune" },
                  { label: "Vaccins", value: dog.last_vaccine ? "💉" : "❓", sub: dog.last_vaccine || "Non renseigné" },
                  { label: "Santé", value: dog.health_issues ? "🔶" : "💚", sub: dog.health_issues ? "À suivre" : "Bonne" },
                ].map(item => (
                  <div key={item.label} className="bg-muted/50 rounded-xl p-3">
                    <p className="text-2xl mb-1">{item.value}</p>
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}