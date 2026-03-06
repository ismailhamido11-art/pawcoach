import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import WellnessBanner from "../components/WellnessBanner";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import DogRadarHero from "../components/home/DogRadarHero";
import TodayCard from "../components/home/TodayCard";
import BentoGrid from "../components/home/BentoGrid";
import StreakBar from "../components/home/StreakBar";
import DailyCoaching from "../components/home/DailyCoaching";
import QuickActions from "../components/home/QuickActions";
import BadgeTeaser from "../components/home/BadgeTeaser";
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import CombinedFAB from "../components/CombinedFAB";

import { Flame } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";

const MILESTONES = [
  { days: 3,   message: "3 jours de suite !",    sub: "Le debut d'une belle habitude" },
  { days: 7,   message: "1 semaine complete !",   sub: "Tu es sur la bonne voie" },
  { days: 14,  message: "2 semaines !",           sub: "La regularite paie" },
  { days: 30,  message: "1 mois de suivi !",      sub: "Champion du suivi" },
  { days: 60,  message: "2 mois !",               sub: "Engagement exceptionnel" },
  { days: 100, message: "100 jours !",             sub: "Legende absolue" },
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
  const [diagnosisReports, setDiagnosisReports] = useState([]);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [trainingBookmarks, setTrainingBookmarks] = useState([]);

  const [milestone, setMilestone] = useState(null);
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
          const [checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
            base44.entities.HealthRecord.filter({ dog_id: d.id }),
            base44.entities.UserProgress.filter({ dog_id: d.id }),
            base44.entities.FoodScan.filter({ dog_id: d.id }),
            base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
            base44.entities.DiagnosisReport.filter({ dog_id: d.id }, "-report_date", 5).catch(() => []),
            base44.entities.NutritionPlan.filter({ dog_id: d.id }, "-created_date", 3).catch(() => []),
            base44.entities.Bookmark.filter({ dog_id: d.id, source: "training" }, "-created_at", 3).catch(() => []),
          ]);
          setRecords(recs || []);
          setExercises(exs || []);
          setScans(scs || []);
          setDailyLogs(logs || []);
          setDiagnosisReports(diags || []);
          setNutritionPlans(plans || []);
          setTrainingBookmarks(tBks || []);
          if (checkins?.length > 0) setTodayCheckin(checkins[0]);
          if (streaks?.length > 0) setStreak(streaks[0]);
          const sorted = (recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
          setRecentCheckins(sorted);
          // Post-onboarding premium nudge
          if (!isUserPremium(u) && !u.premium_onboarding_nudge_shown) {
            setShowPremiumNudge(true);
            try { await base44.auth.updateMe({ premium_onboarding_nudge_shown: true }); } catch(e) { console.warn("Nudge flag update failed:", e); }
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

    // Optimistic update
    const optimisticCheckin = { mood, energy, appetite, notes, date: getTodayString(), ai_response: null, _syncing: true };
    setTodayCheckin(optimisticCheckin);
    setRecentCheckins(prev => [optimisticCheckin, ...prev].slice(0, 7));
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

    try {
      const response = await base44.functions.invoke("dailyCheckinProcess", { dogId: dog.id, mood, energy, appetite, notes });
      const result = response.data || {};
      const newCheckin = result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() };
      setTodayCheckin(newCheckin);
      setStreak(result.streak || streak);
      setRecentCheckins(prev => [newCheckin, ...prev.filter(c => !c._syncing)].slice(0, 7));
      const newStreak = result.streak?.current_streak;
      if (newStreak) {
        const ms = MILESTONES.filter(m => m.days <= newStreak).pop();
        if (ms) {
          setMilestone(ms);
          setTimeout(() => setMilestone(null), 5000);
        }
      }
      toast.success("Check-in enregistre !");
    } catch (err) {
      console.error("Check-in error:", err);
      setTodayCheckin(null);
      setRecentCheckins(prev => prev.filter(c => !c._syncing));
      toast.error("Erreur lors du check-in. Reessaie dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const u = await base44.auth.me();
      const dogs = await base44.entities.Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const d = getActiveDog(dogs);
        const today = getTodayString();
        const [checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks] = await Promise.all([
          base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
          base44.entities.Streak.filter({ dog_id: d.id }),
          base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
          base44.entities.HealthRecord.filter({ dog_id: d.id }),
          base44.entities.UserProgress.filter({ dog_id: d.id }),
          base44.entities.FoodScan.filter({ dog_id: d.id }),
          base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
          base44.entities.DiagnosisReport.filter({ dog_id: d.id }, "-report_date", 5).catch(() => []),
          base44.entities.NutritionPlan.filter({ dog_id: d.id }, "-created_date", 3).catch(() => []),
          base44.entities.Bookmark.filter({ dog_id: d.id, source: "training" }, "-created_at", 3).catch(() => []),
        ]);
        setRecords(recs || []);
        setExercises(exs || []);
        setScans(scs || []);
        setDailyLogs(logs || []);
        setDiagnosisReports(diags || []);
        setNutritionPlans(plans || []);
        setTrainingBookmarks(tBks || []);
        if (checkins?.length > 0) setTodayCheckin(checkins[0]);
        else setTodayCheckin(null);
        if (streaks?.length > 0) setStreak(streaks[0]);
        setRecentCheckins((recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7));
      }
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Hero skeleton */}
        <div className="h-56 bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] relative overflow-hidden">
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse" />
          </div>
        </div>
        {/* TodayCard skeleton */}
        <div className="px-4 mt-3">
          <div className="h-24 rounded-2xl bg-white/80 border border-border/20 animate-pulse" />
        </div>
        {/* Bento skeleton */}
        <div className="px-4 mt-3 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-[120px] rounded-2xl bg-white/80 border border-border/20 animate-pulse" />
          ))}
        </div>
        {/* Streak skeleton */}
        <div className="px-4 mt-3">
          <div className="h-14 rounded-2xl bg-white/80 border border-border/20 animate-pulse" />
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40 relative flex flex-col pt-20">
      <WellnessBanner />

      <PullToRefresh onRefresh={handleRefresh}>
        {/* Block 1: Compact Radar Hero */}
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

        {/* Block 2: Today Card (AI coaching + inline checkin) */}
        <div className="mt-3">
          <TodayCard
            dog={dog} user={user} todayCheckin={todayCheckin} streak={streak}
            records={records} exercises={exercises} scans={scans} dailyLogs={dailyLogs}
            onCheckin={handleCheckin} submitting={submitting}
            diagnosisReports={diagnosisReports} nutritionPlans={nutritionPlans}
          />
        </div>

        {/* Block 2b: Active Program Cards (training + nutrition) */}
        <div className="mt-3">
          <ActiveProgramCards trainingBookmarks={trainingBookmarks} nutritionPlans={nutritionPlans} />
        </div>

        {/* Block 3: Quick Actions */}
        <div className="mt-3">
          <QuickActions />
        </div>

        {/* Block 4: Daily Coaching (tip + recommendations) */}
        <div className="mt-3">
          <DailyCoaching
            dog={dog} records={records} exercises={exercises} scans={scans}
            dailyLogs={dailyLogs} todayCheckin={todayCheckin} streak={streak}
            diagnosisReports={diagnosisReports} nutritionPlans={nutritionPlans}
          />
        </div>

        {/* Block 5: Bento Feature Grid */}
        <div className="mt-3">
          <BentoGrid records={records} exercises={exercises} scans={scans} user={user} checkins={recentCheckins} dailyLogs={dailyLogs} />
        </div>

        {/* Block 6: Streak Bar */}
        <div className="mt-3">
          <StreakBar streak={streak} />
        </div>

        {/* Block 7: Badge Teaser */}
        <div className="mt-3">
          <BadgeTeaser streak={streak} exercises={exercises} dailyLogs={dailyLogs} />
        </div>

        {/* Milestone celebration */}
        <AnimatePresence>
          {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}
        </AnimatePresence>

        <CombinedFAB
          dog={dog}
          user={user}
          onLogSaved={async () => {
            if (!dog) return;
            const logs = await base44.entities.DailyLog.filter({ dog_id: dog.id }, "-date", 30);
            setDailyLogs(logs || []);
          }}
        />
      </PullToRefresh>
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
    confetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.55 }, colors: ["#2d9f82", "#10b981", "#6366f1", "#3b82f6"] });
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
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-[300px] mx-5"
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
