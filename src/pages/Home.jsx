import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { DailyCheckin, Streak, HealthRecord, UserProgress, FoodScan, DailyLog, DiagnosisReport, NutritionPlan, Bookmark, WeeklyInsight } from "@/api/entities";
import { isUserPremium } from "@/utils/premium";
import { useHomeCache } from "@/lib/HomeCacheContext";
import { useAuth } from "@/lib/AuthContext";
import { useDog } from "@/lib/DogContext";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import ChatFAB from "../components/ChatFAB";
import CombinedFAB from "../components/CombinedFAB";
import { checkStreakBadges } from "@/components/achievements/badgeUtils";
import { buildRecommendations, getTodayString } from "@/utils/recommendations";

import CoachHomeHeader from "../components/home/CoachHomeHeader";
import CalendarStrip from "../components/home/CalendarStrip";
import DailyBriefing from "../components/home/DailyBriefing";
import DailyProgress from "../components/home/DailyProgress";
import EmotionalTip from "../components/home/EmotionalTip";
// ContentArticles removed — hardcoded placeholder content, will be replaced with real content later

import { Flame, ScanLine, Footprints, Stethoscope, BookOpen, Lock, Sparkles, ChevronRight, BarChart3, UtensilsCrossed, Heart } from "lucide-react";
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

// ---------------------------------------------------------------------------
// useHomeData — extracts dog-data fetching logic out of Home component
// ---------------------------------------------------------------------------
function useHomeData() {
  const { getCachedHome, setCachedHome } = useHomeCache();

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

  const [insights, setInsights] = useState({
    weeklyInsight: null,
    previousInsight: null,
    pastInsights: [],
  });

  const [isDataStale, setIsDataStale] = useState(false);

  // Wave 1: above-fold data (checkin, streak, recent checkins, health records)
  const fetchAboveFold = useCallback(async (dogId) => {
    const today = getTodayString();
    const [checkins, streaks, recent, recs] = await Promise.all([
      DailyCheckin.filter({ dog_id: dogId, date: today }).catch(() => []),
      Streak.filter({ dog_id: dogId }).catch(() => []),
      DailyCheckin.filter({ dog_id: dogId }, "-date", 30).catch(() => []),
      HealthRecord.filter({ dog_id: dogId }, "-date", 100).catch(() => []),
    ]);
    return { checkins, streaks, recent, recs };
  }, []);

  // Wave 2: below-fold data (exercises, scans, logs, diagnostics, plans, bookmarks)
  const fetchBelowFold = useCallback(async (dogId) => {
    const [exs, scs, logs, diags, plans, tBks, bBks] = await Promise.all([
      UserProgress.filter({ dog_id: dogId }).catch(() => []),
      FoodScan.filter({ dog_id: dogId }, "-timestamp", 20).catch(() => []),
      DailyLog.filter({ dog_id: dogId }, "-date", 30).catch(() => []),
      DiagnosisReport.filter({ dog_id: dogId }, "-report_date", 5).catch(() => []),
      NutritionPlan.filter({ dog_id: dogId }, "-generated_at", 3).catch(() => []),
      Bookmark.filter({ dog_id: dogId, source: "training" }, "-created_at", 10).catch(() => []),
      Bookmark.filter({ dog_id: dogId, source: "behavior_program" }, "-created_at", 10).catch(() => []),
    ]);
    return { exs, scs, logs, diags, plans, tBks, bBks };
  }, []);

  // Combined fetch — used for cache population and background refresh
  const fetchDogData = useCallback(async (dogId) => {
    const [above, below] = await Promise.all([
      fetchAboveFold(dogId),
      fetchBelowFold(dogId),
    ]);
    return { ...above, ...below };
  }, [fetchAboveFold, fetchBelowFold]);

  const applyDogData = useCallback(({ checkins, streaks, recent, recs, exs, scs, logs, diags, plans, tBks, bBks }) => {
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
  }, []);

  const applyInsights = useCallback((insightsData) => {
    if (!insightsData) return;
    setInsights({
      weeklyInsight: insightsData.weeklyInsight ?? null,
      previousInsight: insightsData.previousInsight ?? null,
      pastInsights: insightsData.pastInsights ?? [],
    });
  }, []);

  const loadInsights = useCallback(async (u, dogId) => {
    if (!isUserPremium(u)) return null;
    try {
      const allInsights = await WeeklyInsight.filter({ dog_id: dogId }, "-week_start", 10);
      if (allInsights?.length > 0) {
        const unread = allInsights.find(i => !i.is_read);
        const read = allInsights.filter(i => i.is_read);
        const result = {
          weeklyInsight: unread || null,
          previousInsight: allInsights[1] || null,
          pastInsights: read.slice(0, 5),
        };
        applyInsights(result);
        return result;
      }
      return null;
    } catch (e) { console.warn("Weekly insights load failed:", e); return null; }
  }, [applyInsights]);

  const [loadingSecondary, setLoadingSecondary] = useState(false);

  // refreshHome: fetch all dog data for given user+dog, apply to state, update cache
  const refreshHome = useCallback(async (u, d) => {
    if (!u || !d) return null;
    const fetchedDogData = await fetchDogData(d.id);
    applyDogData(fetchedDogData);
    const fetchedInsights = await loadInsights(u, d.id);
    setCachedHome({ user: u, dog: d, dogData: fetchedDogData, insights: fetchedInsights });
    setIsDataStale(false);
    return { dogData: fetchedDogData, insights: fetchedInsights };
  }, [fetchDogData, applyDogData, loadInsights, setCachedHome]);

  // Mounted guard — prevents wave-2 background writes after unmount
  const mountedRef = useRef(true);

  // refreshHomeWaves: two-wave fetch — returns after wave 1 (above-fold), wave 2 continues in background
  const refreshHomeWaves = useCallback(async (u, d) => {
    if (!u || !d) return null;

    // Wave 1: above-fold — fast path
    const aboveData = await fetchAboveFold(d.id);
    if (!mountedRef.current) return null;
    applyDogData({
      ...aboveData,
      // Provide empty defaults for below-fold fields so applyDogData doesn't break
      exs: [], scs: [], logs: [], diags: [], plans: [], tBks: [], bBks: [],
    });

    // Wave 2: below-fold — runs in background, does NOT block loading
    setLoadingSecondary(true);
    const finishWave2 = async () => {
      try {
        const belowData = await fetchBelowFold(d.id);
        if (!mountedRef.current) return;
        // Merge wave 2 into existing state
        applyDogData({ ...aboveData, ...belowData });
        const fetchedInsights = await loadInsights(u, d.id);
        if (!mountedRef.current) return;
        setCachedHome({ user: u, dog: d, dogData: { ...aboveData, ...belowData }, insights: fetchedInsights });
      } catch (e) {
        console.warn("Home wave 2 fetch error:", e);
        if (mountedRef.current) setIsDataStale(true);
      } finally {
        if (mountedRef.current) setLoadingSecondary(false);
      }
    };
    // Fire wave 2 without awaiting — it runs in background
    finishWave2();

    setIsDataStale(false);
    return { aboveData };
  }, [fetchAboveFold, fetchBelowFold, applyDogData, loadInsights, setCachedHome]);

  // Cleanup: prevent wave-2 writes after hook unmount
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  return { dogData, setDogData, insights, setInsights, isDataStale, setIsDataStale, loadingSecondary, refreshHome, refreshHomeWaves, applyDogData, applyInsights, getCachedHome };
}

export default function Home() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { invalidateHome } = useHomeCache();
  const { user: authUser, isLoadingAuth, checkAppState } = useAuth();
  const { dog: contextDog, loadingDog, refreshDogs } = useDog();
  const dailyBriefingRef = useRef(null);
  const premiumSuccessHandledRef = useRef(false);
  // Local state — initialized from context, updated by Stripe polling / cache
  const [user, setUser] = useState(null);
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  const { dogData, setDogData, insights, setInsights, isDataStale, setIsDataStale, loadingSecondary, refreshHome, refreshHomeWaves, applyDogData, applyInsights, getCachedHome } = useHomeData();

  // Checkin UI state
  const [submitting, setSubmitting] = useState(false);

  const [insightExpanded, setInsightExpanded] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Destructure for easy consumption in render
  const { todayCheckin, streak, recentCheckins, records, exercises, scans, dailyLogs, diagnosisReports, nutritionPlans, trainingBookmarks, behaviorBookmarks } = dogData;
  const { weeklyInsight, previousInsight, pastInsights } = insights;

  const [milestone, setMilestone] = useState(null);
  const [showPremiumNudge, setShowPremiumNudge] = useState(false);
  const [showPostTrial, setShowPostTrial] = useState(false);

  // Sync local state from context
  useEffect(() => {
    if (authUser) setUser(authUser);
  }, [authUser]);
  useEffect(() => {
    if (contextDog) setDog(contextDog);
  }, [contextDog]);

  useEffect(() => {
    if (isLoadingAuth || loadingDog) return;
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

    // Background full refresh — used when cache is available or for background updates
    const backgroundRefresh = async (u, d) => {
      try {
        await refreshHome(u, d);
        if (!mounted) return;
        applyPremiumLogic(u);
      } catch (err) {
        console.error(err);
        setIsDataStale(true);
      }
    };

    // Cold load with wave-based fetching — above-fold first, below-fold in background
    const coldLoadWaves = async (u, d) => {
      try {
        await refreshHomeWaves(u, d);
        if (!mounted) return;
        applyPremiumLogic(u);
      } catch (err) {
        console.error(err);
        toast.error("Impossible de charger les données. Vérifie ta connexion.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    async function loadData() {
      if (!authUser) { setLoading(false); return; }
      if (!contextDog) {
        navigate(createPageUrl("Onboarding"));
        return;
      }

      const cached = getCachedHome();

      if (cached) {
        // Cache hit: show immediately, full refresh in background
        setUser(cached.user);
        setDog(cached.dog);
        applyDogData(cached.dogData);
        applyInsights(cached.insights);
        setLoading(false);

        // Always refresh in background
        backgroundRefresh(authUser, contextDog);
      } else {
        // Cold start: wave-based — above-fold first, loading=false after wave 1
        await coldLoadWaves(authUser, contextDog);
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
          toast.success("Paiement reçu ! Active Premium visible dans quelques secondes.");
        }
      }, 2000);
    };

    loadData().then(handlePremiumSuccess);
    return () => { mounted = false; };
  }, [isLoadingAuth, loadingDog, authUser, contextDog, navigate]);

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
      let newCheckin = result.checkin;
      if (!newCheckin) {
        // API did not return the checkin object — avoid storing an id-less object
        // Attempt silent re-fetch from DB to get a valid object with id
        try {
          const todayStr = getTodayString();
          const [freshCheckin] = await DailyCheckin.filter({ dog_id: dog.id, date: todayStr }, "-date", 1).catch(() => []);
          newCheckin = freshCheckin || null;
        } catch {
          newCheckin = null; // leave todayCheckin as null rather than store without id
        }
      }
      setDogData(prev => ({
        ...prev,
        todayCheckin: newCheckin,
        streak: result.streak || prev.streak,
        recentCheckins: newCheckin
          ? [newCheckin, ...prev.recentCheckins.filter(c => !c._syncing)].slice(0, 7)
          : prev.recentCheckins.filter(c => !c._syncing),
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
      checkStreakBadges(dog.id, user.email).catch(e => console.warn("Home: streak badge check failed", e));
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
      // Refresh dogs from context (re-fetches Dog.filter from API)
      await refreshDogs();
      // Use current context values (updated by refreshDogs)
      if (user && dog) {
        await refreshHome(user, dog);
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
    {
      label: "Véto",
      bgClass: "bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-200/50",
      page: null,
      onClick: () => navigate(createPageUrl("Sante") + "?tab=findvet"),
      svg: (
        <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
          <path d="M16 8a6 6 0 016 6c0 4-3 7-6 10-3-3-6-6-6-10a6 6 0 016-6z" fill="white" fillOpacity="0.9"/>
          <path d="M13 14h6M16 11v6" stroke="#9f1239" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const streakDays = streak?.current_streak || 0;
  const streakLabel = streakDays >= 30 ? "Champion" : streakDays >= 14 ? "Assidu" : streakDays >= 7 ? "Régulier" : streakDays >= 3 ? "Débutant" : "";

  const handleQuickCheckin = async ({ mood, energy, appetite }) => {
    if (submitting) return;
    // CRASH-01: DailyBriefing ne passe que mood — on applique des valeurs neutres par defaut
    handleCheckin({ mood, energy: energy ?? 2, appetite: appetite ?? 2, notes: "", symptoms: [], behaviorNotes: "" });
  };

  if (loading) {
    return <SkeletonPage variant="stats" currentPage="Home" />;
  }

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <h1 className="sr-only">Accueil PawCoach</h1>
      <PullToRefresh onRefresh={handleRefresh}>

        {/* 1. Warm Header — greeting + photo */}
        <CoachHomeHeader user={user} dog={dog} />

        {/* Stale data indicator — shown when background refresh fails */}
        {isDataStale && (
          <div className="mx-5 mb-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium">Données mises en cache — actualise pour rafraîchir</span>
          </div>
        )}

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

        {/* AI Coach Card — compact, differentiator visible at first visit */}
        <div className="px-5 pt-3">
          <motion.button
            onClick={() => navigate(createPageUrl("Chat"))}
            whileTap={{ scale: 0.98 }}
            className="w-full gradient-primary rounded-2xl p-3 flex items-center gap-3 shadow-md text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[13px]">Parle au coach IA</p>
              <p className="text-white/80 text-[11px] mt-0.5">Pose une question sur {dog?.name || "ton chien"}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/80 flex-shrink-0" />
          </motion.button>
        </div>

        {/* === Transition fold — Quick Actions 2x2 grid === */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.slice(0, 4).map((qa, i) => (
              <motion.button
                key={qa.page || qa.label || i}
                onClick={() => qa.onClick ? qa.onClick() : navigate(createPageUrl(qa.page))}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-border shadow-sm text-left active:scale-[0.98] transition-transform"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${qa.bgClass}`}>
                  {qa.svg}
                </div>
                <span className="text-[13px] font-bold text-foreground">{qa.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* === Below the fold — scroll to discover === */}
        <motion.div
          className="px-5 space-y-4 pt-4"
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

          {/* Daily Progress — 3 mini cards */}
          <DailyProgress
            dailyLogs={dailyLogs}
            todayCheckin={todayCheckin}
            dog={dog}
          />

          {/* Calendar Strip */}
          <CalendarStrip dailyLogs={dailyLogs} />

          {/* REMOVED: Hero illustration — decoratif, remplace par hierarchie. Le DailyBriefing couvre deja le statut du chien. */}
          {/*
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
          */}

          {/* Section "Pour toi" — Dashboard + Nutrition en grille 2 cols, Sante full width */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pour toi</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Dashboard compact */}
              <button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                className="bg-white rounded-2xl p-3 border border-border shadow-sm text-left active:scale-[0.98] transition-transform"
                aria-label="Voir le tableau de bord et les alertes sante"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[13px] font-bold text-foreground">Tableau de bord</p>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded-full mt-1.5 inline-block">Alertes</span>
              </button>
              {/* Nutrition compact */}
              <button
                onClick={() => navigate(createPageUrl("Scan"))}
                className="bg-white rounded-2xl p-3 border border-border shadow-sm text-left active:scale-[0.98] transition-transform"
                aria-label="Scanner un aliment pour votre chien"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[13px] font-bold text-foreground">Nutrition</p>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full mt-1.5 inline-block">Scanner</span>
              </button>
            </div>
            {/* Sante full width */}
            <button
              onClick={() => navigate(createPageUrl("Sante"))}
              className="w-full bg-white rounded-2xl p-3 border border-border shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
              aria-label="Voir le carnet de sante"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-foreground">Carnet de sante</p>
              </div>
              <span className="text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-1 rounded-full">Voir</span>
            </button>
          </div>

          {/* Active Programs */}
          <ActiveProgramCards trainingBookmarks={trainingBookmarks} nutritionPlans={nutritionPlans} behaviorBookmarks={behaviorBookmarks} />

          {/* Streak Card */}
          {streakDays > 0 && (
            <div className="flex items-center gap-4 bg-gradient-to-r from-amber-50 via-amber-100 to-amber-50 rounded-2xl border border-amber-200/60 p-4 card-hover shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200/50">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground">{streakDays} jours de suite</p>
                <p className="text-xs text-muted-foreground mt-0.5">La regularite paie — continue comme ca !</p>
              </div>
              {streakLabel && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full flex-shrink-0">
                  {streakLabel}
                </span>
              )}
            </div>
          )}

          {/* REMOVED: EmotionalTip — "Le savais-tu ?" est du contenu filler sans valeur directe, prend de la place sans action */}
          {/* <EmotionalTip dog={dog} /> */}

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
            PawCoach est un outil de suivi. Consultez votre veterinaire.
          </p>
        </motion.div>

        {/* Milestone celebration */}
        <AnimatePresence>
          {milestone && <MilestoneCelebration milestone={milestone} onClose={() => setMilestone(null)} />}
        </AnimatePresence>

        <ChatFAB offsetBottom={4.5} />
      </PullToRefresh>
      <BottomNav currentPage="Home" />

      {/* CRASH-04: Log rapide FAB — poids, eau, balade */}
      <CombinedFAB
        dog={dog}
        user={user}
        onLogSaved={() => {
          invalidateHome();
          refreshHome(user, dog);
        }}
      />

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
        <p className="text-2xl font-bold text-foreground">{milestone.message}</p>
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