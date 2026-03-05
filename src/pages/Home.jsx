import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import DogRadarHero from "../components/home/DogRadarHero";
import DailyCheckinHub from "../components/home/DailyCheckinHub";
import StreakCard from "../components/home/StreakCard";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import JournalLog from "../components/home/JournalLog";
import SmartRecommendations from "../components/home/SmartRecommendations";
import PremiumValueBanner from "../components/home/PremiumValueBanner";
import HealthScore from "../components/home/HealthScore";
import QuickLogFAB from "../components/home/QuickLogFAB";
import ChatFAB from "../components/ChatFAB";

import { Heart, PartyPopper, Flame } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";

const MILESTONES = [
  { days: 3,   message: "3 jours de suite !",    sub: "Le début d'une belle habitude" },
  { days: 7,   message: "1 semaine complète !",   sub: "Tu es sur la bonne voie" },
  { days: 14,  message: "2 semaines !",           sub: "La régularité paie" },
  { days: 30,  message: "1 mois de suivi !",      sub: "Champion du suivi" },
  { days: 60,  message: "2 mois !",               sub: "Engagement exceptionnel" },
  { days: 100, message: "100 jours !",             sub: "Légende absolue" },
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
  const [submitting, setSubmitting] = useState(false);

  const [records, setRecords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [scans, setScans] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);

  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const [milestone, setMilestone] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [showPremiumNudge, setShowPremiumNudge] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const u = await base44.auth.me();
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (dogs && dogs.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const today = getTodayString();
          const [checkins, streaks, recent, insights, recs, exs, scs, logs] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
            base44.entities.WeeklyInsight.filter({ dog_id: d.id, is_read: false }),
            base44.entities.HealthRecord.filter({ dog_id: d.id }),
            base44.entities.UserProgress.filter({ dog_id: d.id }),
            base44.entities.FoodScan.filter({ dog_id: d.id }),
            base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
          ]);
          setRecords(recs || []);
          setExercises(exs || []);
          setScans(scs || []);
          setDailyLogs(logs || []);
          if (checkins?.length > 0) setTodayCheckin(checkins[0]);
          if (streaks?.length > 0) setStreak(streaks[0]);
          const sorted = (recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
          setRecentCheckins(sorted);
          if (insights?.length > 0) {
            setWeeklyInsight(insights.sort((a, b) => (b.week_start || "").localeCompare(a.week_start || ""))[0]);
          }
          // Post-onboarding premium nudge (first visit, non-premium)
          if (!isUserPremium(u) && !u.premium_onboarding_nudge_shown) {
            setShowPremiumNudge(true);
            try { await base44.auth.updateMe({ premium_onboarding_nudge_shown: true }); } catch(e) {}
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

  const handleCheckin = async ({ mood, energy, appetite, notes }) => {
    if (!mood || !energy || !appetite || submitting) return;
    setSubmitting(true);
    try {
      const response = await base44.functions.invoke("dailyCheckinProcess", { dogId: dog.id, mood, energy, appetite, notes });
      const result = response.data || {};
      const newCheckin = result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() };
      setTodayCheckin(newCheckin);
      setStreak(result.streak || streak);
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      setRecentCheckins(prev => [newCheckin, ...prev].slice(0, 7));
      const newStreak = result.streak?.current_streak;
      if (newStreak) {
        const ms = MILESTONES.filter(m => m.days <= newStreak).pop();
        if (ms) {
          setMilestone(ms);
          setTimeout(() => setMilestone(null), 5000);
        }
      }
      toast.success("Check-in enregistré ! 🎉");
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("Erreur lors du check-in. Réessaie dans quelques instants.");
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
        {/* Hero skeleton */}
        <div className="h-64 bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] relative overflow-hidden">
          <div className="absolute bottom-6 left-5 space-y-2">
            <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
            <div className="h-7 w-48 bg-white/20 rounded animate-pulse" />
            <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        {/* Checkin card skeleton */}
        <div className="px-4 -mt-8 relative z-10">
          <div className="h-[340px] rounded-3xl bg-gradient-to-br from-[#0f2027] to-[#1a3a4a] animate-pulse shadow-2xl" />
        </div>
        {/* Snapshot skeleton */}
        <div className="px-5 mt-5 space-y-3">
          <div className="h-3 w-28 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-border/30 h-24 animate-pulse" />
            ))}
          </div>
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  const handleRefresh = async () => {
    try {
      const u = await base44.auth.me();
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const d = getActiveDog(dogs);
        const today = getTodayString();
        const [checkins, streaks, recent, insights, recs, exs, scs, logs] = await Promise.all([
          base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
          base44.entities.Streak.filter({ dog_id: d.id }),
          base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
          base44.entities.WeeklyInsight.filter({ dog_id: d.id, is_read: false }),
          base44.entities.HealthRecord.filter({ dog_id: d.id }),
          base44.entities.UserProgress.filter({ dog_id: d.id }),
          base44.entities.FoodScan.filter({ dog_id: d.id }),
          base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
        ]);
        setRecords(recs || []);
        setExercises(exs || []);
        setScans(scs || []);
        setDailyLogs(logs || []);
        if (checkins?.length > 0) setTodayCheckin(checkins[0]);
        else setTodayCheckin(null);
        if (streaks?.length > 0) setStreak(streaks[0]);
        setRecentCheckins((recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7));
        if (insights?.length > 0) setWeeklyInsight(insights.sort((a, b) => (b.week_start || "").localeCompare(a.week_start || ""))[0]);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-background pb-40 relative flex flex-col">
      <WellnessBanner />

      <PullToRefresh onRefresh={handleRefresh}>
      {/* HERO — Carte d'identité vivante */}
      <DogRadarHero
        user={user}
        dog={dog}
        streak={streak}
        checkins={recentCheckins}
        records={records}
        exercises={exercises}
        scans={scans}
        dailyLogs={dailyLogs}
      />

      {/* MAIN CONTENT */}
      <div className="space-y-4 mt-4">
        {/* Daily Checkin Hub */}
        <DailyCheckinHub
          dog={dog}
          todayCheckin={todayCheckin}
          onSubmit={handleCheckin}
          submitting={submitting}
          streak={streak}
        />

        {/* Health Score */}
        <HealthScore
          dog={dog}
          user={user}
          todayCheckin={todayCheckin}
          records={records}
          scans={scans}
          dailyLogs={dailyLogs}
        />

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

        {/* Premium value banner (free users with activity) */}
        {user && !isUserPremium(user) && (
          <PremiumValueBanner streak={streak} checkins={recentCheckins} />
        )}

        {/* Actions recommandées */}
        <SmartRecommendations
          records={records}
          exercises={exercises}
          scans={scans}
          checkins={recentCheckins}
          dailyLogs={dailyLogs}
          todayCheckin={todayCheckin}
          streak={streak}
          onOpenFAB={() => setFabOpen(true)}
        />
      </div>

      {/* MILESTONE */}
      <AnimatePresence>
        {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}
      </AnimatePresence>

      <QuickLogFAB
        dog={dog}
        user={user}
        open={fabOpen}
        onOpenChange={setFabOpen}
        onLogSaved={async () => {
          if (!dog) return;
          const logs = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 30);
          setDailyLogs(logs || []);
        }}
      />
      </PullToRefresh>
      <ChatFAB />
      <BottomNav currentPage="Home" />

      {/* Post-onboarding premium nudge */}
      <PremiumNudgeSheet
        visible={showPremiumNudge}
        onClose={() => setShowPremiumNudge(false)}
        dogName={dog?.name}
      />
    </div>
  );
}

function MilestoneCelebration({ milestone, onClose }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    confetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.55 }, colors: ["#2d9f82", "#10b981", "#ec4899", "#3b82f6"] });
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
          className="w-24 h-24 mx-auto mb-2"
        >
          <Illustration name="dogHighFive" alt="Bravo !" className="w-full h-full drop-shadow-lg" />
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