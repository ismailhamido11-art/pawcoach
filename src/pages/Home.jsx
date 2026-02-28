import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import HeroHeader from "../components/home/HeroHeader";
import CheckinCard from "../components/home/CheckinCard";
import CheckinResult from "../components/home/CheckinResult";
import StreakCard from "../components/home/StreakCard";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import JournalLog from "../components/home/JournalLog";
import QuickActions from "../components/home/QuickActions";
import IconBadge from "@/components/ui/IconBadge";
import { Heart, PartyPopper, Flame } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

const MILESTONES = [
  { days: 3,   message: "3 jours de suite !",    sub: "Le début d'une belle habitude 🌱" },
  { days: 7,   message: "1 semaine complète !",   sub: "Tu es sur la bonne voie ⚡" },
  { days: 14,  message: "2 semaines !",           sub: "La régularité paie 🏆" },
  { days: 30,  message: "1 mois de suivi !",      sub: "Champion du suivi 🎉" },
  { days: 60,  message: "2 mois !",               sub: "Engagement exceptionnel 🔥" },
  { days: 100, message: "100 jours !",             sub: "Légende absolue 🚀" },
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

  const [todayCheckin, setTodayCheckin] = useState(null);
  const [streak, setStreak] = useState(null);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [appetite, setAppetite] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [scans, setScans] = useState([]);

  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

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
          const [checkins, streaks, recent, insights] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }),
            base44.entities.WeeklyInsight.filter({ dog_id: d.id, is_read: false }),
          ]);
          if (checkins?.length > 0) setTodayCheckin(checkins[0]);
          if (streaks?.length > 0) setStreak(streaks[0]);
          const sorted = (recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
          setRecentCheckins(sorted);
          if (insights?.length > 0) {
            setWeeklyInsight(insights.sort((a, b) => (b.week_start || "").localeCompare(a.week_start || ""))[0]);
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
      const response = await base44.functions.invoke("dailyCheckinProcess", { dogId: dog.id, mood, energy, appetite });
      const result = response.data || {};
      const newCheckin = result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() };
      setTodayCheckin(newCheckin);
      setStreak(result.streak || streak);
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      setRecentCheckins(prev => [newCheckin, ...prev].slice(0, 7));
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
      console.error(err);
    } finally {
      setMarkingRead(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="h-64 bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] animate-pulse" />
        <div className="px-5 space-y-4 -mt-6">
          <div className="h-48 bg-white rounded-3xl animate-pulse shadow-xl" />
          <div className="h-24 bg-white rounded-3xl animate-pulse" />
          <div className="h-32 bg-white rounded-3xl animate-pulse" />
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <WellnessBanner />

      {/* HERO */}
      <div className="pt-6">
        <HeroHeader user={user} dog={dog} streak={streak} />
      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-4 mt-0">
        {/* Check-in ou résultat */}
        {!todayCheckin ? (
          <CheckinCard
            dog={dog}
            mood={mood} setMood={setMood}
            energy={energy} setEnergy={setEnergy}
            appetite={appetite} setAppetite={setAppetite}
            onSubmit={handleCheckin}
            submitting={submitting}
          />
        ) : (
          <CheckinResult checkin={todayCheckin} dog={dog} />
        )}

        {/* Streak */}
        <StreakCard streak={streak} />

        {/* Bilan hebdo */}
        <WeeklyInsightCard
          insight={weeklyInsight}
          dog={dog}
          expanded={insightExpanded}
          onToggle={() => setInsightExpanded(!insightExpanded)}
          onMarkRead={handleMarkInsightRead}
          markingRead={markingRead}
        />

        {/* Journal */}
        <JournalLog checkins={recentCheckins} todayCheckin={todayCheckin} />

        {/* Accès rapide */}
        <QuickActions />
      </div>

      {/* MILESTONE */}
      <AnimatePresence>
        {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}
      </AnimatePresence>

      <BottomNav currentPage="Home" />
    </div>
  );
}

function MilestoneCelebration({ milestone, onClose }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    confetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.55 }, colors: ["#2d9f82", "#f59e0b", "#ec4899", "#3b82f6"] });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, y: -40, rotate: -10 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 12 }}
        className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-[300px] mx-5"
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-4"
        >
          <IconBadge icon={PartyPopper} color="#ec4899" size="xl" className="mx-auto" />
        </motion.div>
        <p className="text-2xl font-black text-foreground">{milestone.message}</p>
        <p className="text-sm text-muted-foreground mt-1.5">{milestone.sub}</p>
        <div className="mt-4 flex items-center justify-center gap-2 bg-accent/10 rounded-2xl py-2.5">
          <Flame className="w-5 h-5 text-accent" />
          <span className="font-bold text-accent">{milestone.days} jours</span>
        </div>
        <button onClick={onClose} className="mt-4 text-xs text-muted-foreground">Touche pour fermer</button>
      </motion.div>
    </motion.div>
  );
}