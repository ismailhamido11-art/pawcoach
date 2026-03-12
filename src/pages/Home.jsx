import { useEffect, useState, useMemo } from "react";
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
// BadgeTeaser merged into StreakBar (DASH-10)
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import SmartAlerts from "../components/dashboard/SmartAlerts";
import CombinedFAB from "../components/CombinedFAB";
import { checkStreakBadges } from "@/components/achievements/badgeUtils";
import { buildRecommendations, getTodayString } from "@/utils/recommendations";

import { Flame } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { toast } from "sonner";
import { PawMascotInline } from "../components/PawMascot";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";
import PostTrialSheet from "../components/premium/PostTrialSheet";
import TrialExpiryBanner from "../components/home/TrialExpiryBanner";

// Emotional moment messages — contextual, warm, make the user smile
function getEmotionalMoment(dog, streak, todayCheckin) {
  const hour = new Date().getHours();
  const name = dog?.name || "ton compagnon";
  const streakDays = streak?.current_streak || 0;

  // Already checked in — warm reinforcement
  if (todayCheckin) {
    if (todayCheckin.mood >= 3) return { text: `${name} rayonne aujourd'hui. Tu fais du bon travail.`, emoji: "✨" };
    if (todayCheckin.mood <= 1) return { text: `Garde un oeil sur ${name}. Tu es son meilleur allié.`, emoji: "💛" };
    return { text: `Chaque jour avec ${name} compte. Merci de prendre soin de lui.`, emoji: "🐾" };
  }

  // Streak-based motivation
  if (streakDays >= 7) return { text: `${streakDays} jours de suite ! ${name} a de la chance de t'avoir.`, emoji: "🔥" };
  if (streakDays >= 3) return { text: `Belle régularité ! ${name} sent la différence.`, emoji: "⚡" };

  // Time-of-day greetings
  if (hour < 9) return { text: `Un petit check-in matinal pour bien commencer la journée de ${name} ?`, emoji: "🌅" };
  if (hour < 14) return { text: `Comment se passe la journée de ${name} ?`, emoji: "☀️" };
  if (hour < 19) return { text: `C'est l'heure idéale pour un point sur ${name}.`, emoji: "🌤️" };
  return { text: `Une dernière pensée pour ${name} avant la fin de journée ?`, emoji: "🌙" };
}

const MILESTONES = [
  { days: 3,   message: "3 jours de suite !",    sub: "Le début d'une belle habitude" },
  { days: 7,   message: "1 semaine complète !",   sub: "Tu es sur la bonne voie" },
  { days: 14,  message: "2 semaines !",           sub: "La régularité paie" },
  { days: 30,  message: "1 mois de suivi !",      sub: "Champion du suivi" },
  { days: 60,  message: "2 mois !",               sub: "Engagement exceptionnel" },
  { days: 100, message: "100 jours !",             sub: "Légende absolue" },
];

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
  const [behaviorBookmarks, setBehaviorBookmarks] = useState([]);

  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [previousInsight, setPreviousInsight] = useState(null);
  const [pastInsights, setPastInsights] = useState([]);
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  const [milestone, setMilestone] = useState(null);
  const [showPremiumNudge, setShowPremiumNudge] = useState(false);
  const [showPostTrial, setShowPostTrial] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u);
        const dogs = await base44.entities.Dog.filter({ owner: u.email });
        if (!mounted) return;
        if (dogs && dogs.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const today = getTodayString();
          const [checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks] = await Promise.all([
            base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
            base44.entities.Streak.filter({ dog_id: d.id }),
            base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
            base44.entities.HealthRecord.filter({ dog_id: d.id }),
            base44.entities.UserProgress.filter({ dog_id: d.id }),
            base44.entities.FoodScan.filter({ dog_id: d.id }),
            base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
            base44.entities.DiagnosisReport.filter({ dog_id: d.id }, "-report_date", 5).catch(() => []),
            base44.entities.NutritionPlan.filter({ dog_id: d.id }, "-generated_at", 3).catch(() => []),
            base44.entities.Bookmark.filter({ dog_id: d.id, source: "training" }, "-created_at", 10).catch(() => []),
            base44.entities.Bookmark.filter({ dog_id: d.id, source: "behavior_program" }, "-created_at", 10).catch(() => []),
          ]);
          if (!mounted) return;
          setRecords(recs || []);
          setExercises(exs || []);
          setScans(scs || []);
          setDailyLogs(logs || []);
          setDiagnosisReports(diags || []);
          setNutritionPlans(plans || []);
          setTrainingBookmarks(tBks || []);
          setBehaviorBookmarks(bBks || []);
          if (checkins?.length > 0) setTodayCheckin(checkins[0]);
          if (streaks?.length > 0) setStreak(streaks[0]);
          const sorted = (recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
          setRecentCheckins(sorted);
          // Weekly insights (premium only)
          if (isUserPremium(u)) {
            try {
              const allInsights = await base44.entities.WeeklyInsight.filter({ dog_id: d.id }, "-week_start", 10);
              if (!mounted) return;
              if (allInsights?.length > 0) {
                const unread = allInsights.find(i => !i.is_read);
                const read = allInsights.filter(i => i.is_read);
                setWeeklyInsight(unread || null);
                setPreviousInsight(allInsights[1] || null);
                setPastInsights(read.slice(0, 5));
              }
            } catch (e) { console.warn("Weekly insights load failed:", e); }
          }
          if (!mounted) return;
          // Premium nudge — declenche a J2+ (pas J0)
          const signupDaysAgo = u.signup_date
            ? Math.floor((Date.now() - new Date(u.signup_date)) / (1000 * 60 * 60 * 24))
            : 0;
          if (!isUserPremium(u) && !u.premium_onboarding_nudge_shown && signupDaysAgo >= 2) {
            setShowPremiumNudge(true);
            try { await base44.auth.updateMe({ premium_onboarding_nudge_shown: true }); } catch(e) { console.warn("Nudge flag update failed:", e); }
          }
          // Post-trial sheet — trial expire, pas premium, pas deja vu
          if (!isUserPremium(u) && u.trial_expires_at) {
            const trialEnd = new Date(u.trial_expires_at);
            const daysSinceExpiry = Math.floor((Date.now() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceExpiry >= 0 && daysSinceExpiry <= 3) {
              try {
                if (!localStorage.getItem("pawcoach_post_trial_dismissed")) {
                  setShowPostTrial(true);
                }
              } catch {}
            }
          }
        } else {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger les données. Vérifie ta connexion.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [navigate]);

  const handleCheckin = async ({ mood, energy, appetite, notes, symptoms, behaviorNotes }) => {
    if (!mood || !energy || !appetite || submitting) return;
    setSubmitting(true);

    // Optimistic update
    const optimisticCheckin = { mood, energy, appetite, notes, symptoms, date: getTodayString(), ai_response: null, _syncing: true };
    setTodayCheckin(optimisticCheckin);
    setRecentCheckins(prev => [optimisticCheckin, ...prev].slice(0, 7));
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

    try {
      const response = await base44.functions.invoke("dailyCheckinProcess", { dogId: dog.id, mood, energy, appetite, notes, symptoms: symptoms || [], behavior_notes: behaviorNotes || "" });
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
      toast.success("Check-in enregistré !");
      checkStreakBadges(dog.id, user.email).catch(() => {});
    } catch (err) {
      console.error("Check-in error:", err);
      setTodayCheckin(null);
      setRecentCheckins(prev => prev.filter(c => !c._syncing));
      toast.error("Erreur lors du check-in. Réessaie dans quelques instants.");
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
        const [checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks] = await Promise.all([
          base44.entities.DailyCheckin.filter({ dog_id: d.id, date: today }),
          base44.entities.Streak.filter({ dog_id: d.id }),
          base44.entities.DailyCheckin.filter({ dog_id: d.id }, "-date", 30),
          base44.entities.HealthRecord.filter({ dog_id: d.id }),
          base44.entities.UserProgress.filter({ dog_id: d.id }),
          base44.entities.FoodScan.filter({ dog_id: d.id }),
          base44.entities.DailyLog.filter({ dog_id: d.id }, "-date", 30),
          base44.entities.DiagnosisReport.filter({ dog_id: d.id }, "-report_date", 5).catch(() => []),
          base44.entities.NutritionPlan.filter({ dog_id: d.id }, "-generated_at", 3).catch(() => []),
          base44.entities.Bookmark.filter({ dog_id: d.id, source: "training" }, "-created_at", 10).catch(() => []),
          base44.entities.Bookmark.filter({ dog_id: d.id, source: "behavior_program" }, "-created_at", 10).catch(() => []),
        ]);
        setRecords(recs || []);
        setExercises(exs || []);
        setScans(scs || []);
        setDailyLogs(logs || []);
        setDiagnosisReports(diags || []);
        setNutritionPlans(plans || []);
        setTrainingBookmarks(tBks || []);
        setBehaviorBookmarks(bBks || []);
        if (checkins?.length > 0) setTodayCheckin(checkins[0]);
        else setTodayCheckin(null);
        if (streaks?.length > 0) setStreak(streaks[0]);
        setRecentCheckins((recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7));
        // Refresh weekly insights
        if (isUserPremium(u)) {
          try {
            const allInsights = await base44.entities.WeeklyInsight.filter({ dog_id: d.id }, "-week_start", 10);
            if (allInsights?.length > 0) {
              const unread = allInsights.find(i => !i.is_read);
              const read = allInsights.filter(i => i.is_read);
              setWeeklyInsight(unread || null);
              setPreviousInsight(allInsights[1] || null);
              setPastInsights(read.slice(0, 5));
            }
          } catch (e) { console.warn("Weekly insights refresh failed:", e); }
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleMarkInsightRead = async () => {
    if (!weeklyInsight || markingRead) return;
    setMarkingRead(true);
    try {
      await base44.entities.WeeklyInsight.update(weeklyInsight.id, { is_read: true });
      setPastInsights(prev => [weeklyInsight, ...prev].slice(0, 5));
      setWeeklyInsight(null);
      setInsightExpanded(false);
    } catch (e) { console.error("Mark read error:", e); }
    finally { setMarkingRead(false); }
  };

  // Walk streak — calculated from dailyLogs (same logic as TrackerHistory)
  const walkStreak = useMemo(() => {
    const withWalks = (dailyLogs || [])
      .filter(l => (l.walk_minutes || 0) > 0)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (withWalks.length === 0) return 0;
    const today = getTodayString();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    })();
    if (withWalks[0].date !== today && withWalks[0].date !== yesterday) return 0;
    let current = 1;
    for (let i = 0; i < withWalks.length - 1; i++) {
      const d1 = new Date(withWalks[i].date + "T12:00:00");
      const d2 = new Date(withWalks[i + 1].date + "T12:00:00");
      const diff = Math.round((d1 - d2) / 86400000);
      if (diff === 1) current++;
      else break;
    }
    return current;
  }, [dailyLogs]);

  // Centralized recommendations — computed once, shared by TodayCard + DailyCoaching (DASH-05)
  const recommendations = useMemo(() => {
    if (!dog) return [];
    return buildRecommendations({
      records: records || [],
      exercises: exercises || [],
      scans: scans || [],
      checkins: recentCheckins,
      dailyLogs: dailyLogs || [],
      todayCheckin,
      streak,
      diagnosisReports: diagnosisReports || [],
      nutritionPlans: nutritionPlans || [],
    });
  }, [dog, records, exercises, scans, recentCheckins, dailyLogs, todayCheckin, streak, diagnosisReports, nutritionPlans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        {/* Hero skeleton — avec shimmer */}
        <div className="h-56 bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <motion.div
              className="w-20 h-20 rounded-full bg-white/20"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
        {/* Card skeletons */}
        <div className="px-4 mt-3 space-y-3">
          {[80, 120, 120, 56].map((h, i) => (
            <motion.div
              key={i}
              className="rounded-2xl bg-white/80 border border-border/20"
              style={{ height: h }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: [0.4, 0.7, 0.4], y: 0 }}
              transition={{ opacity: { duration: 1.5, repeat: Infinity }, y: { delay: i * 0.08 } }}
            />
          ))}
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background pb-32 relative flex flex-col ${recentCheckins.length < 3 ? "pt-20" : ""}`}>
      {/* DASH-09: Hide WellnessBanner after 3+ check-ins */}
      {recentCheckins.length < 3 && <WellnessBanner />}

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

        {/* Emotional moment — contextual warm message */}
        {(() => {
          const moment = getEmotionalMoment(dog, streak, todayCheckin);
          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 30 }}
              className="mx-4 mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10"
            >
              <PawMascotInline
                mood={todayCheckin ? (todayCheckin.mood >= 3 ? "happy" : todayCheckin.mood <= 1 ? "sleepy" : "encouraging") : streak?.current_streak >= 3 ? "proud" : "curious"}
                size="md"
              />
              <p className="text-[12px] text-foreground/70 leading-relaxed font-medium">{moment.text}</p>
            </motion.div>
          );
        })()}

        {/* Block 2: Today Card (AI coaching + inline checkin) */}
        <div className="mt-3">
          <TodayCard
            dog={dog} user={user} todayCheckin={todayCheckin} streak={streak}
            recommendations={recommendations}
            onCheckin={handleCheckin} submitting={submitting}
          />
        </div>

        {/* Block 3: Active Program Cards — most actionable content (DASH-01: moved up) */}
        <div className="mt-3">
          <ActiveProgramCards trainingBookmarks={trainingBookmarks} nutritionPlans={nutritionPlans} behaviorBookmarks={behaviorBookmarks} />
        </div>

        {/* Block 4: Smart Alerts — trend-based alerts (DASH-02: activated on dashboard) */}
        <div className="mt-3 mx-4">
          <SmartAlerts
            dog={dog}
            checkins={recentCheckins}
            records={records}
            streak={streak}
            dailyLogs={dailyLogs}
            scans={scans}
          />
        </div>

        {/* Block 5: Quick Actions */}
        <div className="mt-3">
          <QuickActions />
        </div>

        {/* Block 6: Daily Coaching (tip + recommendations) */}
        <div className="mt-3">
          <DailyCoaching
            dog={dog}
            recommendations={recommendations}
          />
        </div>

        {/* Block 7: Bento Feature Grid */}
        <div className="mt-3">
          <BentoGrid />
        </div>

        {/* Block 8: Streak Bar */}
        <div className="mt-3">
          <StreakBar streak={streak} walkStreak={walkStreak} exercises={exercises} dailyLogs={dailyLogs} />
        </div>

        {/* Block 9: Trial expiry banner — moved below action cards (DASH-04) */}
        <div className="mt-3">
          <TrialExpiryBanner user={user} dog={dog} />
        </div>

        {/* Block 10: Weekly Insight — moved below action cards (DASH-03) */}
        {(weeklyInsight || pastInsights.length > 0) && (
          <div className="mt-3">
            <WeeklyInsightCard
              insight={weeklyInsight}
              previousInsight={previousInsight}
              pastInsights={pastInsights}
              dog={dog}
              expanded={insightExpanded}
              onToggle={() => setInsightExpanded(e => !e)}
              onMarkRead={handleMarkInsightRead}
              markingRead={markingRead}
            />
          </div>
        )}

        {/* BadgeTeaser merged into StreakBar as compact chip (DASH-10) */}

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
        ownerGoal={dog?.owner_goal}
      />

      {/* Post-trial sheet — J7, une seule fois */}
      <PostTrialSheet
        visible={showPostTrial}
        onClose={() => setShowPostTrial(false)}
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
