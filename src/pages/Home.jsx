import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import {
  BookHeart, ChevronRight, UserCircle,
  Heart, Flame, Loader2,
  ChevronDown, ChevronUp, Sparkles, Check, Salad, MapPin,
  Frown, Meh, Smile, Laugh,
  BatteryLow, BatteryMedium, BatteryFull,
  Ban, Utensils, UtensilsCrossed,
  PartyPopper, ClipboardList
} from "lucide-react";
import IconBadge from "@/components/ui/IconBadge";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

const spring = { type: "spring", stiffness: 400, damping: 30 };
const listContainer = { show: { transition: { staggerChildren: 0.06 } } };
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
};

const MOOD_OPTIONS = [
  { value: 1, icon: Frown, color: "#ef4444", label: "Triste" },
  { value: 2, icon: Meh, color: "#f59e0b", label: "Bof" },
  { value: 3, icon: Smile, color: "#10b981", label: "Bien" },
  { value: 4, icon: Laugh, color: "#ec4899", label: "Super" },
];

const ENERGY_OPTIONS = [
  { value: 1, icon: BatteryLow, color: "#ef4444", label: "Faible" },
  { value: 2, icon: BatteryMedium, color: "#f59e0b", label: "Moyen" },
  { value: 3, icon: BatteryFull, color: "#10b981", label: "A fond" },
];

const APPETITE_OPTIONS = [
  { value: 1, icon: Ban, color: "#ef4444", label: "Rien" },
  { value: 2, icon: Utensils, color: "#10b981", label: "Normal" },
  { value: 3, icon: UtensilsCrossed, color: "#f59e0b", label: "Glouton" },
];

const MILESTONES = [
  { days: 3, message: "3 jours de suite !", sub: "Le debut d'une belle habitude" },
  { days: 7, message: "1 semaine complete !", sub: "Tu es sur la bonne voie" },
  { days: 14, message: "2 semaines !", sub: "La regularite paie" },
  { days: 30, message: "1 mois de suivi !", sub: "Champion du suivi" },
  { days: 60, message: "2 mois !", sub: "Engagement exceptionnel" },
  { days: 100, message: "100 jours !", sub: "Legende absolue" },
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

  // Weekly insight state
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Milestone celebration state
  const [milestone, setMilestone] = useState(null);

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

          // Load today's check-in, streak, recent check-ins, and weekly insight in parallel
          const [checkins, streaks, recent, insights] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }),
            base44.entities.WeeklyInsight.filter({ dog_id: d.id, is_read: false }),
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

          // Show latest unread weekly insight
          if (insights && insights.length > 0) {
            const latestInsight = insights.sort((a, b) => (b.week_start || "").localeCompare(a.week_start || ""))[0];
            setWeeklyInsight(latestInsight);
          }
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
      const response = await base44.functions.invoke("dailyCheckinProcess", {
        dogId: dog.id,
        mood,
        energy,
        appetite,
      });
      const result = response.data || {};
      setTodayCheckin(result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() });
      setStreak(result.streak || streak);
      if (navigator.vibrate) navigator.vibrate(50);
      // Add to recent check-ins
      setRecentCheckins(prev => [
        { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() },
        ...prev,
      ].slice(0, 7));

      // Check for milestone celebration
      const newStreak = result.streak?.current_streak;
      if (newStreak) {
        const ms = MILESTONES.find(m => m.days === newStreak);
        if (ms) {
          setMilestone(ms);
          setTimeout(() => setMilestone(null), 5000);
        }
      }
    } catch (err) {
      console.error("Check-in error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkInsightRead = async () => {
    if (!weeklyInsight || markingRead) return;
    setMarkingRead(true);
    try {
      await base44.entities.WeeklyInsight.update(weeklyInsight.id, { is_read: true });
      setWeeklyInsight(null);
      setInsightExpanded(false);
    } catch (err) {
      console.error("Mark read error:", err);
    } finally {
      setMarkingRead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/[0.02] pb-24">
        <div className="h-8 bg-accent/10" />
        <div className="pt-16 px-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-muted animate-pulse rounded-lg" />
              <div className="h-3 w-28 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="h-48 bg-muted animate-pulse rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-16 bg-muted animate-pulse rounded-2xl" />
            <div className="h-16 bg-muted animate-pulse rounded-2xl" />
            <div className="h-16 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 20 }}
      className="min-h-screen bg-gradient-to-b from-background to-primary/[0.02] pb-24 relative"
    >
      <WellnessBanner />



      {/* Bouton Profil */}
      <motion.div whileTap={{ scale: 0.96 }} transition={spring} className="absolute top-16 right-6 z-10">
      <Link
        to={createPageUrl("Profile")}
        className="p-2 rounded-full bg-white shadow-sm border border-border text-muted-foreground hover:text-primary transition-colors block"
      >
        <UserCircle className="w-6 h-6" />
      </Link>
      </motion.div>

      <div className="pt-24 px-5">
        {/* Header avec streak */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {dog?.photo && (
                <img src={dog.photo} alt={dog.name} className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover flex-shrink-0" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Bonjour, {user?.full_name?.split(" ")[0] || "l'ami"}
                </h1>
                <p className="text-muted-foreground mt-0.5">
                  Comment va {dog?.name || "ton chien"} ?
                </p>
              </div>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
                <Flame className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-accent">{currentStreak}j</span>
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
              <motion.div className="flex gap-2" variants={listContainer} initial="hidden" animate="show">
                {MOOD_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    variants={listItem}
                    whileTap={{ scale: 0.96 }}
                    transition={spring}
                    onClick={() => setMood(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors ${mood === opt.value
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border/50 bg-white hover:border-border"
                      }`}
                  >
                    <IconBadge icon={opt.icon} color={opt.color} size="md" />
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Energie */}
            <div className="mb-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Energie</p>
              <motion.div className="flex gap-2" variants={listContainer} initial="hidden" animate="show">
                {ENERGY_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    variants={listItem}
                    whileTap={{ scale: 0.96 }}
                    transition={spring}
                    onClick={() => setEnergy(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors ${energy === opt.value
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border/50 bg-white hover:border-border"
                      }`}
                  >
                    <IconBadge icon={opt.icon} color={opt.color} size="sm" />
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Appetit */}
            <div className="mb-5">
              <p className="text-sm font-medium text-muted-foreground mb-2">Appetit</p>
              <motion.div className="flex gap-2" variants={listContainer} initial="hidden" animate="show">
                {APPETITE_OPTIONS.map(opt => (
                  <motion.button
                    key={opt.value}
                    variants={listItem}
                    whileTap={{ scale: 0.96 }}
                    transition={spring}
                    onClick={() => setAppetite(opt.value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-colors ${appetite === opt.value
                      ? "border-primary bg-primary/5 scale-105"
                      : "border-border/50 bg-white hover:border-border"
                      }`}
                  >
                    <IconBadge icon={opt.icon} color={opt.color} size="md" />
                    <span className="text-xs text-muted-foreground">{opt.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Bouton Envoyer */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={spring}
              onClick={handleCheckin}
              disabled={!mood || !energy || !appetite || submitting}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${mood && energy && appetite && !submitting
                ? "bg-primary hover:bg-primary/90"
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
            </motion.button>
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
            <div className="flex gap-2 flex-wrap">
              {(() => { const m = MOOD_OPTIONS.find(x => x.value === todayCheckin.mood); return m ? (
                <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <m.icon style={{ color: m.color, width: 14, height: 14 }} /> {m.label}
                </span>
              ) : null; })()}
              {(() => { const e = ENERGY_OPTIONS.find(x => x.value === todayCheckin.energy); return e ? (
                <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <e.icon style={{ color: e.color, width: 14, height: 14 }} /> {e.label}
                </span>
              ) : null; })()}
              {(() => { const a = APPETITE_OPTIONS.find(x => x.value === todayCheckin.appetite); return a ? (
                <span className="px-3 py-1.5 bg-white border border-border/50 rounded-full text-xs font-medium flex items-center gap-1.5">
                  <a.icon style={{ color: a.color, width: 14, height: 14 }} /> {a.label}
                </span>
              ) : null; })()}
            </div>
          </div>
        )}

        {/* STREAK */}
        {currentStreak > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-7 h-7 text-accent fill-accent" />
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

        {/* BILAN HEBDO */}
        {weeklyInsight && (
          <div className="bg-white rounded-2xl shadow-sm border border-primary/20 mb-6 overflow-hidden">
            {/* Header cliquable */}
            <button
              onClick={() => setInsightExpanded(!insightExpanded)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm">
                  La semaine de {dog?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Bilan IA — {weeklyInsight.week_start ? new Date(weeklyInsight.week_start + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "cette semaine"}
                </p>
              </div>
              {insightExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {/* Contenu depliable */}
            {insightExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Resume */}
                {weeklyInsight.summary && (
                  <p className="text-sm text-foreground leading-relaxed">
                    {weeklyInsight.summary}
                  </p>
                )}

                {/* Points cles */}
                {(() => {
                  const hl = typeof weeklyInsight.highlights === "string" ? (() => { try { return JSON.parse(weeklyInsight.highlights); } catch { return []; } })() : weeklyInsight.highlights;
                  return Array.isArray(hl) && hl.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Points cles</p>
                      <ul className="space-y-1">
                        {hl.map((h, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-primary/60 mt-0.5 flex-shrink-0">•</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}

                {/* Recommandations */}
                {(() => {
                  const recs = typeof weeklyInsight.recommendations === "string" ? (() => { try { return JSON.parse(weeklyInsight.recommendations); } catch { return []; } })() : weeklyInsight.recommendations;
                  return Array.isArray(recs) && recs.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Recommandations</p>
                      <ul className="space-y-1">
                        {recs.map((r, i) => (
                          <li key={i} className="text-sm text-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}

                {/* Stats rapides */}
                {(weeklyInsight.checkin_count > 0 || weeklyInsight.avg_mood) && (
                  <div className="flex gap-3 pt-1">
                    {weeklyInsight.checkin_count > 0 && (
                      <div className="bg-primary/5 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-lg font-bold text-primary">{weeklyInsight.checkin_count}</p>
                        <p className="text-[10px] text-muted-foreground">check-ins</p>
                      </div>
                    )}
                    {weeklyInsight.avg_mood && (
                      <div className="bg-primary/5 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-lg font-bold text-primary">
                          {weeklyInsight.avg_mood.toFixed(1)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">humeur moy.</p>
                      </div>
                    )}
                    {weeklyInsight.avg_energy && (
                      <div className="bg-primary/5 rounded-xl px-3 py-2 flex-1 text-center">
                        <p className="text-lg font-bold text-primary">{weeklyInsight.avg_energy.toFixed(1)}</p>
                        <p className="text-[10px] text-muted-foreground">energie moy.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton J'ai lu */}
                <button
                  onClick={handleMarkInsightRead}
                  disabled={markingRead}
                  className="w-full mt-2 py-2.5 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                >
                  {markingRead ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  J'ai lu
                </button>
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
            <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
              {recentCheckins.slice(todayCheckin ? 1 : 0, 5).map((c, i) => {
                const moodOpt = MOOD_OPTIONS.find(m => m.value === c.mood);
                const energyOpt = ENERGY_OPTIONS.find(e => e.value === c.energy);
                const dateLabel = formatDateLabel(c.date);
                return (
                  <motion.div key={i} variants={listItem} className="bg-white rounded-xl px-4 py-3 border border-border/30 flex items-center gap-3">
                    {moodOpt ? <IconBadge icon={moodOpt.icon} color={moodOpt.color} size="sm" /> : <div className="w-10 h-10" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {moodOpt?.label} - {energyOpt?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{dateLabel}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* EMPTY STATE - no check-in history */}
        {recentCheckins.length <= 1 && !todayCheckin && (
          <div className="text-center py-8 mb-4">
            <IconBadge icon={Heart} color="#ec4899" size="lg" className="mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">Comment va {dog?.name} aujourd'hui ?</p>
            <p className="text-xs text-muted-foreground mt-1">Fais ton premier check-in ci-dessus</p>
          </div>
        )}

        {/* ACCES RAPIDE */}
        <motion.div className="space-y-3" variants={listContainer} initial="hidden" animate="show">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide px-1">
            Acces rapide
          </h3>

          <motion.div variants={listItem} whileTap={{ scale: 0.96 }} transition={spring}>
            <Link
              to={createPageUrl("Notebook")}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 group hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                <BookHeart className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">Carnet de santé</p>
                <p className="text-xs text-muted-foreground">Vaccins, poids, suivi</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>

          <motion.div variants={listItem} whileTap={{ scale: 0.96 }} transition={spring}>
            <Link
              to={createPageUrl("Nutrition")}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 group hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-safe/10 flex items-center justify-center text-safe group-hover:scale-110 transition-transform">
                <Salad className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">NutriCoach</p>
                <p className="text-xs text-muted-foreground">Conseils nutrition, plan repas IA</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>

          <motion.div variants={listItem} whileTap={{ scale: 0.96 }} transition={spring}>
            <Link
              to={createPageUrl("FindVet")}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border/50 flex items-center gap-4 group hover:border-primary/30 transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">Trouver un véto</p>
                <p className="text-xs text-muted-foreground">Cliniques vétérinaires proches</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* MILESTONE CELEBRATION OVERLAY */}
      <AnimatePresence>
        {milestone && (
          <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />
        )}
      </AnimatePresence>

      <BottomNav currentPage="Home" />
    </motion.div>
  );
}

function MilestoneCelebration({ milestone, onClose }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFEAA7", "#DDA0DD"],
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, y: -60, rotate: -15 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-[280px] mx-5"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-3"
        >
          <IconBadge icon={PartyPopper} color="#ec4899" size="xl" />
        </motion.div>
        <p className="text-xl font-bold text-foreground">{milestone.message}</p>
        <p className="text-sm text-muted-foreground mt-1">{milestone.sub}</p>
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <Flame className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-accent">{milestone.days} jours</span>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Touche pour fermer</p>
      </motion.div>
    </motion.div>
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