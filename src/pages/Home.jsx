import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import BottomNav from "../components/BottomNav";
import { ScanLine, MessageCircle, Dumbbell, BookHeart } from "lucide-react";

function getAge(birthDate) {
  if (!birthDate) return null;
  const now = new Date();
  const birth = new Date(birthDate);
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) return "moins d'1 mois";
  if (totalMonths < 12) return `${totalMonths} mois`;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (months === 0) return years === 1 ? "1 an" : `${years} ans`;
  return `${years} ans et ${months} mois`;
}

const ACTION_CARDS = [
  {
    label: "Scan Bouffe",
    icon: ScanLine,
    subtitle: "Scanne un aliment",
    page: "Scan",
    bg: "bg-teal-500",
    lightBg: "bg-teal-50",
    textColor: "text-teal-700",
    iconBg: "bg-teal-400/30",
  },
  {
    label: "Coach Dressage",
    icon: Dumbbell,
    subtitle: null, // dynamic
    page: "Training",
    bg: "bg-amber-400",
    lightBg: "bg-amber-50",
    textColor: "text-amber-700",
    iconBg: "bg-amber-300/30",
  },
  {
    label: "Assistant IA",
    icon: MessageCircle,
    subtitle: "Pose une question",
    page: "Chat",
    bg: "bg-blue-500",
    lightBg: "bg-blue-50",
    textColor: "text-blue-700",
    iconBg: "bg-blue-400/30",
  },
  {
    label: "Carnet de suivi",
    icon: BookHeart,
    subtitle: null, // dynamic
    page: "Notebook",
    bg: "bg-emerald-500",
    lightBg: "bg-emerald-50",
    textColor: "text-emerald-700",
    iconBg: "bg-emerald-400/30",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [dog, setDog] = useState(null);
  const [trainingCount, setTrainingCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await base44.auth.me();
    const dogs = await base44.entities.Dog.filter({ owner: user.email });
    if (dogs.length === 0) {
      navigate(createPageUrl("Onboarding"));
      return;
    }
    const d = dogs[0];
    setDog(d);

    // Count completed training exercises
    const progress = await base44.entities.UserProgress.filter({ user_email: user.email, dog_id: d.id, completed: true });
    setTrainingCount(progress.length);

    // Count upcoming health reminders (records with next_date in future)
    const records = await base44.entities.HealthRecord.filter({ dog_id: d.id });
    const today = new Date().toISOString().split("T")[0];
    const upcoming = records.filter(r => r.next_date && r.next_date >= today);
    setReminderCount(upcoming.length);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">🐾</span>
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  const age = getAge(dog?.birth_date);

  const getSubtitle = (card) => {
    if (card.page === "Training") return `${trainingCount}/10 tours maîtrisés`;
    if (card.page === "Notebook") return `${reminderCount} rappel${reminderCount !== 1 ? "s" : ""} à venir`;
    return card.subtitle;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header card */}
      <div className="gradient-primary px-5 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

        {/* Logo row */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <span className="text-white font-bold text-base tracking-tight">PawCoach</span>
          </div>
          <button
            onClick={() => navigate(createPageUrl("Onboarding"))}
            className="text-white/70 text-xs hover:text-white bg-white/10 rounded-xl px-3 py-1.5 font-medium"
          >
            Modifier
          </button>
        </div>

        {/* Dog info */}
        {dog && (
          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center border-2 border-white/30 flex-shrink-0">
              {dog.photo ? (
                <img src={dog.photo} alt={dog.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🐕</span>
              )}
            </div>
            <div className="text-white">
              <p className="text-white/70 text-sm mb-0.5">Salut ! Comment va</p>
              <h1 className="text-3xl font-extrabold leading-tight">{dog.name} ?</h1>
              <p className="text-white/80 text-sm mt-1 font-medium">
                {[dog.breed, age].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wellness banner */}
      <div className="bg-gray-100 border-b border-gray-200 px-5 py-2 text-center">
        <p className="text-xs text-gray-500 font-medium">
          🐾 PawCoach est un coach bien-être, pas un vétérinaire.
        </p>
      </div>

      {/* 2x2 Action cards */}
      <div className="px-5 pt-6">
        <div className="grid grid-cols-2 gap-4">
          {ACTION_CARDS.map((card) => {
            const Icon = card.icon;
            const subtitle = getSubtitle(card);
            return (
              <button
                key={card.page}
                onClick={() => navigate(createPageUrl(card.page))}
                className={`${card.lightBg} rounded-3xl p-5 flex flex-col items-start gap-3 tap-scale transition-all hover:shadow-md text-left border border-transparent hover:border-gray-100`}
              >
                <div className={`${card.bg} w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className={`font-bold text-sm ${card.textColor}`}>{card.label}</p>
                  {subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav currentPage="Home" />
    </div>
  );
}