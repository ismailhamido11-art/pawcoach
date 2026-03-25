import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import ChatFAB from "../components/ChatFAB";
import { checkStreakBadges } from "@/components/achievements/badgeUtils";
import { buildRecommendations, getTodayString } from "@/utils/recommendations";

import CoachHomeHeader from "../components/home/CoachHomeHeader";
import HomeStatusCard from "../components/home/HomeStatusCard";
import BriefingCard from "../components/home/BriefingCard";
import StreakCard from "../components/home/StreakCard";
import QuickActions from "../components/home/QuickActions";
import RecentActivity from "../components/home/RecentActivity";

import { Flame } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";
import PostTrialSheet from "../components/premium/PostTrialSheet";
import SkeletonPage from "@/components/ui/SkeletonPage";


const MILESTONES = [
  { days: 3,   message: "3 jours de suite !",    sub: "Le début d'une belle habitude" },
  { days: 7,   message: "1 semaine complète !",   sub: "Tu es sur la bonne voie" },
  { days: 14,  message: "2 semaines !",           sub: "La régularité paie" },
  { days: 30,  message: "1 mois de suivi !",      sub: "Champion du suivi" },
  { days: 60,  message: "2 mois !",               sub: "Engagement exceptionnel" },
  { days: 100, message: "100 jours !",             sub: "Légende absolue" },
];

async function fetchDogData(dogId) {
  const today = getTodayString();
  const [checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks] = await Promise.all([
    base44.entities.DailyCheckin.filter({ dog_id: dogId, date: today }),
    base44.entities.Streak.filter({ dog_id: dogId }),
    base44.entities.DailyCheckin.filter({ dog_id: dogId }, "-date", 30),
    base44.entities.HealthRecord.filter({ dog_id: dogId }),
    base44.entities.UserProgress.filter({ dog_id: dogId }),
    base44.entities.FoodScan.filter({ dog_id: dogId }),
    base44.entities.DailyLog.filter({ dog_id: dogId }, "-date", 30),
    base44.entities.DiagnosisReport.filter({ dog_id: dogId }, "-report_date", 5).catch(() => []),
    base44.entities.NutritionPlan.filter({ dog_id: dogId }, "-generated_at", 3).catch(() => []),
    base44.entities.Bookmark.filter({ dog_id: dogId, source: "training" }, "-created_at", 10).catch(() => []),
    base44.entities.Bookmark.filter({ dog_id: dogId, source: "behavior_program" }, "-created_at", 10).catch(() => []),
  ]);
  return { checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks };
}

export default function Home() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
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

  const applyDogData = ({ checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks }) => {
    setRecords(recs || []);
    setExercises(exs || []);
    setScans(scs || []);
    setDailyLogs(logs || []);
    setDiagnosisReports(diags || []);
    setNutritionPlans(plans || []);
    setTrainingBookmarks(tBks || []);
    setBehaviorBookmarks(bBks || []);
    setTodayCheckin(checkins?.length > 0 ? checkins[0] : null);
    if (streaks?.length > 0) setStreak(streaks[0]);
    setRecentCheckins((recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7));
  };

  const loadInsights = async (u, dogId) => {
    if (!isUserPremium(u)) return;
    try {
      const allInsights = await base44.entities.WeeklyInsight.filter({ dog_id: dogId }, "-week_start", 10);
      if (allInsights?.length > 0) {
        const unread = allInsights.find(i => !i.is_read);
        const read = allInsights.filter(i => i.is_read);
        setWeeklyInsight(unread || null);
        setPreviousInsight(allInsights[1] || null);
        setPastInsights(read.slice(0, 5));
      }
    } catch (e) { console.warn("Weekly insights load failed:", e); }
  };

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
          const data = await fetchDogData(d.id);
          if (!mounted) return;
          applyDogData(data);
          await loadInsights(u, d.id);
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
        const data = await fetchDogData(d.id);
        applyDogData(data);
        await loadInsights(u, d.id);
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

  const quickActions = [
    {
      label: "Scanner",
      bgClass: "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-200/50",
      page: "Scan",
      svg: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <ellipse cx="16" cy="12" rx="7" ry="6" fill="white" fillOpacity="0.9"/>
          <circle cx="13" cy="11" r="1.2" fill="#92400e"/>
          <circle cx="19" cy="11" r="1.2" fill="#92400e"/>
          <ellipse cx="16" cy="14" rx="2.5" ry="1.8" fill="#92400e" fillOpacity="0.7"/>
          <path d="M9 8Q7 3 5 6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
          <path d="M23 8Q25 3 27 6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
          <rect x="6" y="22" width="20" height="6" rx="3" fill="white" fillOpacity="0.3"/>
          <rect x="8" y="24" width="4" height="2" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="14" y="24" width="4" height="2" rx="1" fill="white" fillOpacity="0.6"/>
          <rect x="20" y="24" width="4" height="2" rx="1" fill="white" fillOpacity="0.6"/>
        </svg>
      ),
    },
    {
      label: "Balade",
      bgClass: "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200/50",
      page: "Activite",
      svg: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <circle cx="11" cy="9" r="3.5" fill="white" fillOpacity="0.85"/>
          <circle cx="21" cy="9" r="3.5" fill="white" fillOpacity="0.85"/>
          <circle cx="7" cy="18" r="3" fill="white" fillOpacity="0.85"/>
          <circle cx="25" cy="18" r="3" fill="white" fillOpacity="0.85"/>
          <ellipse cx="16" cy="24" rx="6" ry="4.5" fill="white" fillOpacity="0.9"/>
          <path d="M13 22Q16 18 19 22" stroke="#065f46" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Santé",
      bgClass: "bg-gradient-to-br from-violet-400 to-violet-600 shadow-lg shadow-violet-200/50",
      page: "Sante",
      svg: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <path d="M16 28C10 22 4 18 4 12a6 6 0 0112-1 6 6 0 0112 1c0 6-6 10-12 16z" fill="white" fillOpacity="0.85"/>
          <path d="M13 14h6M16 11v6" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Dressage",
      bgClass: "bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-200/50",
      page: "Training",
      svg: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <circle cx="16" cy="18" r="8" fill="white" fillOpacity="0.85"/>
          <ellipse cx="16" cy="20" rx="3" ry="2" fill="#1e40af" fillOpacity="0.5"/>
          <circle cx="13" cy="16" r="1.2" fill="#1e40af"/>
          <circle cx="19" cy="16" r="1.2" fill="#1e40af"/>
          <path d="M10 12L8 5h16l-2 7" fill="white" fillOpacity="0.7"/>
          <rect x="11" y="4" width="10" height="2" rx="1" fill="white" fillOpacity="0.5"/>
          <circle cx="16" cy="3.5" r="1.5" fill="white" fillOpacity="0.7"/>
        </svg>
      ),
    },
  ];

  const streakDays = streak?.current_streak || 0;
  const streakLabel = streakDays >= 30 ? "Champion" : streakDays >= 14 ? "Assidu" : streakDays >= 7 ? "Régulier" : streakDays >= 3 ? "Débutant" : "";

  const handleQuickCheckin = async ({ mood, energy, appetite }) => {
    if (submitting) return;
    handleCheckin({ mood, energy, appetite, notes: "", symptoms: [], behaviorNotes: "" });
  };

  if (loading) {
    return <SkeletonPage variant="stats" currentPage="Home" />;
  }

  return (
    <div className="min-h-screen bg-surface pb-32 relative flex flex-col">
      <PullToRefresh onRefresh={handleRefresh}>
        {/* Top Header */}
        <CoachHomeHeader user={user} dog={dog} />

        <main className="px-6 -mt-6 z-20 relative">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Status Hero Card */}
            <HomeStatusCard dog={dog} />

            {/* Daily Briefing & Streak */}
            <div className="space-y-4">
              <BriefingCard dog={dog} />
              <StreakCard streakDays={streakDays} />
            </div>

            {/* Quick Actions Grid */}
            <QuickActions />

            {/* Recent Activity Grid */}
            <RecentActivity />

            {/* Disclaimer */}
            <p className="text-center text-[11px] text-on-surface-variant px-6 pt-4 pb-2">
              PawCoach est un outil de suivi. Consultez votre vétérinaire.
            </p>
          </motion.div>
        </main>

        <AnimatePresence>
          {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}
        </AnimatePresence>

        <ChatFAB offsetBottom={4.5} />
      </PullToRefresh>
      <BottomNav currentPage="Home" />

      <PremiumNudgeSheet
        visible={showPremiumNudge}
        onClose={() => setShowPremiumNudge(false)}
        dogName={dog?.name}
        ownerGoal={dog?.owner_goal}
      />

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
    confetti({ particleCount: 100, spread: 80, origin: { x: 0.5, y: 0.55 }, colors: ["#1A4D3E", "#2D9F82", "#10b981", "#34d399"] });
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