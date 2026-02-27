import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import {
  BookHeart, ChevronRight, Activity, Stethoscope, UserCircle,
  Heart, Flame, Dumbbell, ScanLine, MessageCircle, Loader2
} from "lucide-react";

const MOOD_OPTIONS = [
  { value: 1, emoji: "\ud83d\ude22", label: "Triste" },
  { value: 2, emoji: "\ud83d\ude10", label: "Bof" },
  { value: 3, emoji: "\ud83d\ude0a", label: "Bien" },
  { value: 4, emoji: "\ud83e\udd29", label: "Super" },
];

const ENERGY_OPTIONS = [
  { value: 1, emoji: "\ud83d\udd0b", label: "Faible" },
  { value: 2, emoji: "\ud83d\udd0b\ud83d\udd0b", label: "Moyen" },
  { value: 3, emoji: "\ud83d\udd0b\ud83d\udd0b\ud83d\udd0b", label: "A fond" },
];

const APPETITE_OPTIONS = [
  { value: 1, emoji: "\ud83d\ude45", label: "Rien" },
  { value: 2, emoji: "\ud83d\ude0b", label: "Normal" },
  { value: 3, emoji: "\ud83e\udd24", label: "Glouton" },
];

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check-in state
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [streak, setStreak] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [appetite, setAppetite] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs && dogs.length > 0) {
          const d = dogs[0];
          setDog(d);

          const today = getTodayString();

          // Load today's check-in, streak, and recent check-ins in parallel
          const [checkins, streaks, recent] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }),
          ]);

          if (checkins && checkins.length > 0) {
            setTodayCheckin(checkins[0]);
          }
          if (streaks && streaks.length > 0) {
            setStreak(streaks[0]);
          }
          // Sort recent check-ins by date descending, take last 7
          const sorted = (recent || [])
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7);
          setRecentCheckins(sorted);
        } else {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleCheckin = async () => {
    if (!mood || !energy || !appetite || submitting) return;
    setSubmitting(true);
    try {
      const result = await base44.backendFunctions.dailyCheckinProcess({
        dogId: dog.id,
        mood,
        energy,
        appetite,
      });
      setTodayCheckin(result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() });
      setStreak(result.streak || streak);
      // Add to recent check-ins
      setRecentCheckins(prev => [
        { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() },
        ...prev,
      ].slice(0, 7));
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/40 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <WellnessBanner />

      {/* Bouton Profil */}
      <Link
        to={createPageUrl("Profile")}
        className="absolute top-16 right-6 p-2 rounded-full bg-white shadow-sm border border-border text-muted-foreground hover:text-primary transition-colors z-10"
      >
        <UserCircle className="w-6 h-6" />
      </Link>

      <div className="pt-24 px-6">
        {/* Header avec streak */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bonjour, {user?.full_name?.split(" ")[0] || "l'ami"}
              </h1>
              <p className="text-muted-foreground mt-0.5">
                Comment va {dog?.name || "ton chien"} ?
              </p>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-bold text-orange-600">{currentStreak}j</span>
              </div>
            )}
          </div>
        </header>

        {/* CHECK-IN ou RESULTAT */}
        {!todayCheckin ? (
          /* ---------- FORMULAIRE CHECK-IN ---------- */
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/50 mb-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Comment va {dog?.name} aujourd'hui ?
            </h2>

            {/* Humeur */}
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Humeur</p>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMood(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                      mood === opt.value
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-border/50 bg-white hover:border-border"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energie */}
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Energie</p>
              <div className="flex gap-2">
                {ENERGY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEnergy(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                      energy === opt.value
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-border/50 bg-white hover:border-border"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Appetit */}
            <div className="mb-5">
              <p className="text-sm font-medium text-muted-foreground mb-2">Appetit</p>
              <div className="flex gap-2">
                {APPETITE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAppetite(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                      appetite === opt.value
                        ? "border-primary bg-primary/5 scale-105"
                        : "border-border/50 bg-white hover:border-border"
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton Envoyer */}
            <button
              onClick={handleCheckin}
              disabled={!mood || !energy || !appetite || submitting}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                mood && energy && appetite && !submitting
                  ? "bg-primary hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </span>
              ) : (
                "Envoyer"
              )}
            </button>
          </div>
        ) : (
          /* ---------- RESULTAT CHECK-IN ---------- */
          <div className="space-y-4 mb-6">
            {/* Reponse IA */}
            {todayCheckin.ai_response && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {todayCheckin.ai_response}
                </p>
              </div>
            )}

            {/* Badges du jour */}
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium">
                {MOOD_OPTIONS.find(m => m.value === todayCheckin.mood)?.emoji}{" "}
                {MOOD_OPTIONS.find(m => m.value === todayCheckin.mood)?.label}
              </span>
              <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium">
                {ENERGY_OPTIONS.find(e => e.value === todayCheckin.energy)?.emoji}
              </span>
              <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium">
                {APPETITE_OPTIONS.find(a => a.value === todayCheckin.appetite)?.emoji}{" "}
                {APPETITE_OPTIONS.find(a => a.value === todayCheckin.appetite)?.label}
              </span>
            </div>
          </div>
        )}

        {/* STREAK */}
        {currentStreak > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Heart className="w-7 h-7 text-orange-500 fill-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground">
                {currentStreak} jour{currentStreak > 1 ? "s" : ""} de suite
              </p>
              <p className="text-xs text-muted-foreground">
                {currentStreak >= 7
                  ? "Incroyable ! Tu fais partie des meilleurs."
                  : `Record : ${longestStreak} jour${longestStreak > 1 ? "s" : ""}`}
              </p>
            </div>
            {streak?.grace_days_remaining > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {streak.grace_days_remaining} jour{streak.grace_days_remaining > 1 ? "s" : ""} de grace
                </p>
              </div>
            )}
          </div>
        )}

        {/* JOURNAL DE BORD */}
        {recentCheckins.length > 1 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-3 px-1">
              Journal de bord
            </h3>
            <div className="space-y-2">
              {recentCheckins.slice(todayCheckin ? 1 : 0, 5).map((c, i) => {
                const moodOpt = MOOD_OPTIONS.find(m => m.value === c.mood);
                const energyOpt = ENERGY_OPTIONS.find(e => e.value === c.energy);
                const dateLabel = formatDateLabel(c.date);
                return (
                  <div key={i} className="bg-white rounded-xl px-4 py-3 border border-border/30 flex items-center gap-3">
                    <span className="text-xl">{moodOpt?.emoji || ""}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {moodOpt?.label} - {energyOpt?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{dateLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ACCES RAPIDE */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide px-1">
            Acces rapide
          </h3>

          <Link
            to={createPageUrl("Notebook")}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 group hover:border-primary/30 transition-all"
          >
            <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
              <BookHeart className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-foreground text-sm">Carnet de sante</p>
              <p className="text-xs text-muted-foreground">Vaccins, poids, suivi</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>

          <div className="grid grid-cols-3 gap-3">
            <Link
              to={createPageUrl("Scan")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-border/50 flex flex-col items-center gap-2 group hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                <ScanLine className="w-5 h-5" />
              </div>
              <p className="font-medium text-foreground text-xs text-center">Scanner</p>
            </Link>

            <Link
              to={createPageUrl("Chat")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-border/50 flex flex-col items-center gap-2 group hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-5 h-5" />
              </div>
              <p className="font-medium text-foreground text-xs text-center">Chat IA</p>
            </Link>

            <Link
              to={createPageUrl("Training")}
              className="bg-white rounded-2xl p-3 shadow-sm border border-border/50 flex flex-col items-center gap-2 group hover:border-primary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <Dumbbell className="w-5 h-5" />
              </div>
              <p className="font-medium text-foreground text-xs text-center">Dressage</p>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav currentPage="Home" />
    </div>
  );
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const today = getTodayString();
  if (dateStr === today) return "Aujourd'hui";

  const d = new Date(dateStr + "T12:00:00");
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.getFullYear() + "-" + String(yesterday.getMonth() + 1).padStart(2, "0") + "-" + String(yesterday.getDate()).padStart(2, "0");
  if (dateStr === yStr) return "Hier";

  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
