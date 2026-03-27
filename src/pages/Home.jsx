import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Dog, DailyCheckin, Streak, HealthRecord, UserProgress, FoodScan, DailyLog, DiagnosisReport, NutritionPlan, Bookmark, WeeklyInsight } from "@/api/entities";
import { isUserPremium } from "@/utils/premium";
import { useHomeCache } from "@/lib/HomeCacheContext";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import ChatFAB from "../components/ChatFAB";
import { checkStreakBadges } from "@/components/achievements/badgeUtils";
import { buildRecommendations, getTodayString } from "@/utils/recommendations";

import CoachHomeHeader from "../components/home/CoachHomeHeader";
import CalendarStrip from "../components/home/CalendarStrip";
import DailyBriefing from "../components/home/DailyBriefing";
import DailyProgress from "../components/home/DailyProgress";
import EmotionalTip from "../components/home/EmotionalTip";
// ContentArticles removed — hardcoded placeholder content, will be replaced with real content later

import { Flame, ScanLine, Footprints, Stethoscope, BookOpen, Lock } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";
import PostTrialSheet from "../components/premium/PostTrialSheet";
import TrialExpiryBanner from "../components/home/TrialExpiryBanner";
import FirstDayGuide from "../components/home/FirstDayGuide";
import SkeletonPage from "@/components/ui/SkeletonPage";
import StorysetIllustration from "@/components/ui/StorysetIllustration";


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
    DailyCheckin.filter({ dog_id: dogId, date: today }).catch(() => []),
    Streak.filter({ dog_id: dogId }).catch(() => []),
    DailyCheckin.filter({ dog_id: dogId }, "-date", 30).catch(() => []),
    HealthRecord.filter({ dog_id: dogId }, "-date", 100).catch(() => []),
    UserProgress.filter({ dog_id: dogId }).catch(() => []),
    FoodScan.filter({ dog_id: dogId }, "-timestamp", 20).catch(() => []),
    DailyLog.filter({ dog_id: dogId }, "-date", 30).catch(() => []),
    DiagnosisReport.filter({ dog_id: dogId }, "-report_date", 5).catch(() => []),
    NutritionPlan.filter({ dog_id: dogId }, "-generated_at", 3).catch(() => []),
    Bookmark.filter({ dog_id: dogId, source: "training" }, "-created_at", 10).catch(() => []),
    Bookmark.filter({ dog_id: dogId, source: "behavior_program" }, "-created_at", 10).catch(() => []),
  ]);
  return { checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks };
}

export default function Home() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { getCachedHome, setCachedHome, invalidateHome } = useHomeCache();
  const { checkAppState } = useAuth();
  const dailyBriefingRef = useRef(null);
  const premiumSuccessHandledRef = useRef(false);
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dog data group — all fetched entity data for the active dog
  const [dogData, setDogData] = useState({
    todayCheckin: null,
    streak: null,
    recentCheckins: [],
    records: [],
    exercises: [],
    scans: [],
    dailyLogs: [],
    diagnosisReports: [],
    nutritionPlans: [],
    trainingBookmarks: [],
    behaviorBookmarks: [],
  });

  // Checkin UI state
  const [submitting, setSubmitting] = useState(false);

  // Insights group — weekly AI insights data
  const [insights, setInsights] = useState({
    weeklyInsight: null,
    previousInsight: null,
    pastInsights: [],
  });
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Destructure for easy consumption in render
  const { todayCheckin, streak, recentCheckins, records, exercises, scans, dailyLogs, diagnosisReports, nutritionPlans, trainingBookmarks, behaviorBookmarks } = dogData;
  const { weeklyInsight, previousInsight, pastInsights } = insights;

  const [milestone, setMilestone] = useState(null);
  const [showPremiumNudge, setShowPremiumNudge] = useState(false);
  const [showPostTrial, setShowPostTrial] = useState(false);

  const applyDogData = ({ checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks }) => {
    setDogData({
      todayCheckin: checkins?.length > 0 ? checkins[0] : null,
      streak: streaks?.length > 0 ? streaks[0] : null,
      recentCheckins: (recent || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7),
      records: recs || [],
      exercises: exs || [],
      scans: scs || [],
      dailyLogs: logs || [],
      diagnosisReports: diags || [],
      nutritionPlans: plans || [],
      trainingBookmarks: tBks || [],
      behaviorBookmarks: bBks || [],
    });
  };

  const applyInsights = (insightsData) => {
    if (!insightsData) return;
    setInsights({
      weeklyInsight: insightsData.weeklyInsight ?? null,
      previousInsight: insightsData.previousInsight ?? null,
      pastInsights: insightsData.pastInsights ?? [],
    });
  };

  const loadInsights = async (u, dogId) => {
    if (!isUserPremium(u)) return null;
    try {
      const allInsights = await WeeklyInsight.filter({ dog_id: dogId }, "-week_start", 10);
      if (allInsights?.length > 0) {
        const unread = allInsights.find(i => !i.is_read);
        const read = allInsights.filter(i => i.is_read);
        const insights = {
          weeklyInsight: unread || null,
          previousInsight: allInsights[1] || null,
          pastInsights: read.slice(0, 5),
        };
        applyInsights(insights);
        return insights;
      }
      return null;
    } catch (e) { console.warn("Weekly insights load failed:", e); return null; }
  };

  useEffect(() => {
    let mounted = true;

    // Apply premium nudge/post-trial logic (shared between first load and bg refresh)
    const applyPremiumLogic = (u) => {
      const signupDaysAgo = u.signup_date
        ? Math.floor((Date.now() - new Date(u.signup_date)) / (1000 * 60 * 60 * 24))
        : 0;
      if (!isUserPremium(u) && !u.premium_onboarding_nudge_shown && signupDaysAgo >= 2) {
        setShowPremiumNudge(true);
        base44.auth.updateMe({ premium_onboarding_nudge_shown: true }).catch(e => console.warn("Nudge flag update failed:", e));
      }
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
    };

    // Full fetch: fetch everything, update state, update cache
    const fetchAndCache = async (skipLoadingState = false) => {
      try {
        const u = await base44.auth.me();
        if (!mounted) return;
        setUser(u);
        const dogs = await Dog.filter({ owner: u.email });
        if (!mounted) return;
        if (dogs && dogs.length > 0) {
          const d = getActiveDog(dogs);
          setDog(d);
          const fetchedDogData = await fetchDogData(d.id);
          if (!mounted) return;
          applyDogData(fetchedDogData);
          const fetchedInsights = await loadInsights(u, d.id);
          if (!mounted) return;
          // Update cache with fresh data
          setCachedHome({ user: u, dog: d, dogData: fetchedDogData, insights: fetchedInsights });
          applyPremiumLogic(u);
        } else {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (err) {
        console.error(err);
        // Only show error toast on first load (not background refresh)
        if (!skipLoadingState) {
          toast.error("Impossible de charger les données. Vérifie ta connexion.");
        }
      } finally {
        // Only update loading state on first load (background refresh doesn't touch it)
        if (mounted && !skipLoadingState) setLoading(false);
      }
    };

    async function loadData() {
      const cached = getCachedHome();

      if (cached) {
        // Cache exists (fresh or stale): apply immediately, skip loading screen
        setUser(cached.user);
        setDog(cached.dog);
        applyDogData(cached.dogData);
        applyInsights(cached.insights);
        setLoading(false);

        // Always refresh in background (fresh cache = silent update, stale = revalidate)
        fetchAndCache(true);
      } else {
        // No cache: first visit — show loading, fetch, cache result
        await fetchAndCache(false);
      }
    }

    // Handle ?premium=success redirect from Stripe — poll base44.auth.me() until is_premium=true (max 10s)
    const handlePremiumSuccess = () => {
      if (premiumSuccessHandledRef.current) return;
      const param = new URLSearchParams(window.location.search).get("premium");
      if (param !== "success") return;

      premiumSuccessHandledRef.current = true;
      window.history.replaceState({}, "", "/");
      confetti({ particleCount: 120, spread: 90, origin: { x: 0.5, y: 0.5 }, colors: ["#1A4D3E", "#2D9F82", "#10b981", "#34d399", "#f59e0b"] });

      // Poll base44.auth.me() every 2s for up to 10s — webhook may not have fired yet
      let attempts = 0;
      const maxAttempts = 5; // 5 x 2s = 10s
      const interval = setInterval(async () => {
        attempts++;
        try {
          const freshUser = await base44.auth.me();
          if (freshUser?.is_premium) {
            clearInterval(interval);
            setUser(freshUser);
            checkAppState(); // Propage le nouveau statut premium a toutes les pages via AuthContext
            toast.success("Bienvenue en Premium ! Profite de toutes les fonctionnalités.");
            return;
          }
        } catch {
          // ignore — retry next tick
        }
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          // Webhook may be slow — show success anyway and let user refresh if needed
          toast.success("Paiement reçu ! Active Premium visible dans quelques secondes.");
        }
      }, 2000);
    };

    loadData().then(handlePremiumSuccess);
    return () => { mounted = false; };
  }, [navigate]);

  const handleCheckin = async ({ mood, energy, appetite, notes, symptoms, behaviorNotes }) => {
    if (!mood || !energy || !appetite || submitting) return;
    setSubmitting(true);

    // Optimistic update
    const optimisticCheckin = { mood, energy, appetite, notes, symptoms, date: getTodayString(), ai_response: null, _syncing: true };
    setDogData(prev => ({
      ...prev,
      todayCheckin: optimisticCheckin,
      recentCheckins: [optimisticCheckin, ...prev.recentCheckins].slice(0, 7),
    }));
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

    try {
      const response = await base44.functions.invoke("dailyCheckinProcess", { dogId: dog.id, mood, energy, appetite, notes, symptoms: symptoms || [], behavior_notes: behaviorNotes || "" });
      const result = response.data || {};
      const newCheckin = result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() };
      setDogData(prev => ({
        ...prev,
        todayCheckin: newCheckin,
        streak: result.streak || prev.streak,
        recentCheckins: [newCheckin, ...prev.recentCheckins.filter(c => !c._syncing)].slice(0, 7),
      }));
      const newStreak = result.streak?.current_streak;
      if (newStreak) {
        const ms = MILESTONES.filter(m => m.days <= newStreak).pop();
        if (ms) {
          setMilestone(ms);
          setTimeout(() => setMilestone(null), 5000);
        }
      }
      toast.success("Check-in enregistré !");
      // UX-01: Réagir si symptomes détectés
      if (symptoms && symptoms.length > 0) {
        setTimeout(() => {
          toast("Des symptomes signalés — consulte l'onglet Santé.", {
            duration: 6000,
            action: {
              label: "Voir Santé",
              onClick: () => navigate(createPageUrl("Sante")),
            },
          });
        }, 800);
      }
      checkStreakBadges(dog.id, user.email).catch(() => {});
    } catch (err) {
      console.error("Check-in error:", err);
      setDogData(prev => ({
        ...prev,
        todayCheckin: null,
        recentCheckins: prev.recentCheckins.filter(c => !c._syncing),
      }));
      toast.error("Erreur lors du check-in. Réessaie dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    // Invalidate cache so next visit fetches fresh data
    invalidateHome();
    try {
      const u = await base44.auth.me();
      const dogs = await Dog.filter({ owner: u.email });
      if (dogs?.length > 0) {
        const d = getActiveDog(dogs);
        setUser(u);
        setDog(d);
        const fetchedDogData = await fetchDogData(d.id);
        applyDogData(fetchedDogData);
        const fetchedInsights = await loadInsights(u, d.id);
        // Re-cache fresh data after manual refresh
        setCachedHome({ user: u, dog: d, dogData: fetchedDogData, insights: fetchedInsights });
      }
    } catch (e) { console.error(e); toast.error("Impossible de rafraîchir les données. Vérifie ta connexion."); }
  };

  const handleMarkInsightRead = async () => {
    if (!weeklyInsight || markingRead) return;
    setMarkingRead(true);
    try {
      await WeeklyInsight.update(weeklyInsight.id, { is_read: true });
      setInsights(prev => ({
        ...prev,
        weeklyInsight: null,
        pastInsights: [weeklyInsight, ...prev.pastInsights].slice(0, 5),
      }));
      setInsightExpanded(false);
    } catch (e) { console.error("Mark read error:", e); toast.error("Impossible de marquer le bilan comme lu. Réessaie."); }
    finally { setMarkingRead(false); }
  };

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
  }, [dog, dogData]);

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
    <div className="min-h-screen bg-background relative flex flex-col">
      <PullToRefresh onRefresh={handleRefresh}>

        {/* 1. Warm Header — greeting + photo */}
        <CoachHomeHeader user={user} dog={dog} />

        {/* 2. THE BRIEFING — coach speaks first */}
        <div ref={dailyBriefingRef}>
        <DailyBriefing
          dog={dog}
          user={user}
          recentCheckins={recentCheckins}
          dailyLogs={dailyLogs}
          streak={streak}
          todayCheckin={todayCheckin}
          onQuickCheckin={handleQuickCheckin}
          submitting={submitting}
          recommendations={recommendations}
        />
        </div>

        {/* === Below the fold — scroll to discover === */}
        <motion.div
          className="px-5 space-y-6"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >

          {/* Trial expiry — visible immediately */}
          <TrialExpiryBanner user={user} dog={dog} />

          {/* Guide J0 — early for new users */}
          <FirstDayGuide
            dog={dog}
            todayCheckin={todayCheckin}
            scans={scans}
            dailyLogs={dailyLogs}
            onScrollToCheckin={() => dailyBriefingRef.current?.scrollIntoView({ behavior: "smooth" })}
          />

          {/* Hero Illustration — always visible, premium feel */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-gradient-to-br from-emerald-50 via-white to-amber-50/80 rounded-3xl p-5 border border-emerald-100/50 shadow-sm overflow-hidden relative"
          >
            <div className="flex items-center gap-4">
              <StorysetIllustration name="walking" className="w-32 h-32 flex-shrink-0 -ml-2" />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-foreground leading-snug">
                  {todayCheckin
                    ? (todayCheckin.mood >= 4
                        ? `${dog?.name || "Ton chien"} est en forme !`
                        : todayCheckin.mood <= 2
                          ? `${dog?.name || "Ton chien"} n'est pas au top...`
                          : `${dog?.name || "Ton chien"} a une journee tranquille`)
                    : `${dog?.name || "Ton chien"} attend son check-in`
                  }
                </p>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
                  {todayCheckin
                    ? (todayCheckin.mood >= 4
                        ? "Continue comme ca, chaque jour compte pour sa sante."
                        : todayCheckin.mood <= 2
                          ? "Garde un oeil sur lui et note tout changement."
                          : "Une petite balade lui ferait du bien.")
                    : "20 min de marche par jour renforcent son coeur et son moral."
                  }
                </p>
              </div>
            </div>
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-amber-200/15 rounded-full blur-xl" />
          </motion.div>

          {/* Calendar Strip */}
          <CalendarStrip dailyLogs={dailyLogs} />

          {/* Daily Progress — 3 mini cards */}
          <DailyProgress
            dailyLogs={dailyLogs}
            todayCheckin={todayCheckin}
            dog={dog}
          />

          {/* Dashboard access — SmartAlerts */}
          <button
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-3xl p-4 border border-blue-100/50 shadow-sm flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            aria-label="Voir le tableau de bord et les alertes santé"
          >
            <StorysetIllustration name="vet-checkup" className="w-20 h-20 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Tableau de bord</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Vaccins, alertes poids, tendances humeur — tout en un coup d'oeil.</p>
              <span className="inline-block mt-2 text-[12px] font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full">
                Voir les alertes
              </span>
            </div>
          </button>

          {/* Quick Actions */}
          <div className="flex justify-between px-2">
            {quickActions.map((qa, i) => (
              <motion.button
                key={qa.page || i}
                onClick={() => navigate(createPageUrl(qa.page))}
                className="flex flex-col items-center gap-2 w-[72px] active:scale-95 transition-transform"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <div className={`w-[56px] h-[56px] rounded-2xl flex items-center justify-center ${qa.bgClass}`}>
                  {qa.svg}
                </div>
                <span className="text-[11px] font-bold text-foreground">{qa.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Nutrition tip card with illustration */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-3xl p-4 border border-amber-100/50 shadow-sm flex items-center gap-4">
            <StorysetIllustration name="feeding" className="w-24 h-24 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Nutrition de {dog?.name || "ton chien"}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Scanne un aliment pour savoir s'il est adapte.</p>
              <button
                onClick={() => navigate(createPageUrl("Scan"))}
                className="mt-2 text-[12px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                Scanner un aliment
              </button>
            </div>
          </div>

          {/* Active Programs */}
          <ActiveProgramCards trainingBookmarks={trainingBookmarks} nutritionPlans={nutritionPlans} behaviorBookmarks={behaviorBookmarks} />

          {/* Streak Card */}
          {streakDays > 0 && (
            <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl border border-amber-200/60 p-[18px] card-hover shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200/50">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground">{streakDays} jours de suite</p>
                <p className="text-xs text-muted-foreground mt-0.5">La régularité paie — continue comme ça !</p>
              </div>
              {streakLabel && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full flex-shrink-0">
                  {streakLabel}
                </span>
              )}
            </div>
          )}

          {/* Health card with illustration */}
          <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50/50 rounded-3xl p-4 border border-violet-100/50 shadow-sm flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-foreground">Carnet de sante</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Vaccins, visites, poids — tout est suivi automatiquement.</p>
              <button
                onClick={() => navigate(createPageUrl("Sante"))}
                className="mt-2 text-[12px] font-bold text-violet-700 bg-violet-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                Voir le carnet
              </button>
            </div>
            <StorysetIllustration name="vet-checkup" className="w-24 h-24 flex-shrink-0" />
          </div>

          {/* Emotional Tip — "Le savais-tu ?" */}
          <EmotionalTip dog={dog} />

          {/* Content Articles removed — was hardcoded placeholder content */}

          {/* Weekly Insight */}
          {(weeklyInsight || pastInsights.length > 0) ? (
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
          ) : !isUserPremium(user) && (
            <button
              onClick={() => navigate(createPageUrl("Premium"))}
              className="w-full flex items-center gap-3 bg-white rounded-2xl border border-border p-4 shadow-sm text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Bilan hebdomadaire</p>
                <p className="text-xs text-muted-foreground mt-0.5">Disponible en Premium</p>
              </div>
              <div className="flex-shrink-0">
                <Lock className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          )}

          {/* Disclaimer */}
          <p className="text-center text-[11px] text-muted-foreground px-6 pb-2">
            PawCoach est un outil de suivi. Consultez votre vétérinaire.
          </p>
        </motion.div>

        {/* Milestone celebration */}
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