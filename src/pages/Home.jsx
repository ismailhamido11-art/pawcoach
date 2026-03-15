import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getActiveDog } from "@/utils";
import { base44 } from "@/api/base44Client";
import { isUserPremium } from "@/utils/premium";
import BottomNav from "../components/BottomNav";
import PullToRefresh from "../components/PullToRefresh";
import TodayCard from "../components/home/TodayCard";
import ActiveProgramCards from "../components/home/ActiveProgramCards";
import WeeklyInsightCard from "../components/home/WeeklyInsightCard";
import ChatFAB from "../components/ChatFAB";
import { checkStreakBadges } from "@/components/achievements/badgeUtils";
import { buildRecommendations, getTodayString } from "@/utils/recommendations";

import CoachHomeHeader from "../components/home/CoachHomeHeader";
import CalendarStrip from "../components/home/CalendarStrip";
import WellnessScore from "../components/home/WellnessScore";
import DailyProgress from "../components/home/DailyProgress";
import EmotionalTip from "../components/home/EmotionalTip";
import ContentArticles from "../components/home/ContentArticles";

import { Flame, Sparkles, ChevronRight, ScanLine, Footprints, Stethoscope, BookOpen, PawPrint } from "lucide-react";
import Illustration from "../components/illustrations/Illustration";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PremiumNudgeSheet from "../components/premium/PremiumNudgeSheet";
import PostTrialSheet from "../components/premium/PostTrialSheet";
import TrialExpiryBanner from "../components/home/TrialExpiryBanner";
import FirstDayGuide from "../components/home/FirstDayGuide";


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

  const todayCardRef = useRef(null);

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
    { icon: ScanLine, label: "Scanner", color: "#D97706", bg: "#FEF0E8", page: "Scan" },
    { icon: Footprints, label: "Balade", color: "#2D9F82", bg: "#E8F5F0", page: "WalkMode" },
    { icon: Stethoscope, label: "Sante", color: "#7C3AED", bg: "#EDE9FE", page: "Health" },
    { icon: BookOpen, label: "Guides", color: "#D97706", bg: "#FEF3C7", page: "Training" },
  ];

  const streakDays = streak?.current_streak || 0;
  const streakLabel = streakDays >= 30 ? "Champion" : streakDays >= 14 ? "Assidu" : streakDays >= 7 ? "Regulier" : streakDays >= 3 ? "Debutant" : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F1] pb-32">
        <div className="bg-gradient-to-b from-[#FEF0E8] to-[#FAF6F1] px-5 pt-3 pb-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-[#E8E4DF] rounded-lg animate-pulse" />
              <div className="h-6 w-36 bg-[#E8E4DF] rounded-lg animate-pulse" />
            </div>
            <div className="w-[52px] h-[52px] rounded-full bg-[#E8E4DF] animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[0,1,2,3,4,5,6].map(i => (
              <div key={i} className="w-10 h-14 bg-[#E8E4DF] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        <div className="px-4 mt-4 space-y-4">
          {[90, 70, 140, 80].map((h, i) => (
            <div key={i} className="rounded-[20px] bg-white border border-[#E8E4DF] animate-pulse" style={{ height: h }} />
          ))}
        </div>
        <BottomNav currentPage="Home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F1] pb-32 relative flex flex-col">
      <PullToRefresh onRefresh={handleRefresh}>

        {/* 1. Warm Header */}
        <CoachHomeHeader user={user} dog={dog} />

        {/* 2. Calendar Strip */}
        <div className="bg-gradient-to-b from-[#FEF0E8] to-[#FAF6F1] px-4 pb-4">
          <CalendarStrip dailyLogs={dailyLogs} />
        </div>

        {/* 3. Content */}
        <div className="px-4 space-y-6 mt-2">

          {/* Section title */}
          <h2 className="text-[18px] font-bold text-[#2D2D2D]">
            Aujourd'hui pour {dog?.name || "ton chien"}
          </h2>

          {/* Wellness Score Ring */}
          <WellnessScore
            recentCheckins={recentCheckins}
            streak={streak}
            dailyLogs={dailyLogs}
            dog={dog}
          />

          {/* Daily Progress — 3 mini cards */}
          <DailyProgress
            dailyLogs={dailyLogs}
            todayCheckin={todayCheckin}
            dog={dog}
          />

          {/* Check-in Card — TodayCard directly here, no scroll */}
          <TodayCard
            dog={dog} user={user} todayCheckin={todayCheckin} streak={streak}
            recommendations={recommendations}
            onCheckin={handleCheckin} submitting={submitting}
          />

          {/* Insight Cards — Coach tip + Chat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-between bg-gradient-to-b from-[#1A4D3E] to-[#2D9F82] rounded-2xl p-4 h-[140px]">
              <Sparkles className="w-5 h-5 text-white/50" />
              <div>
                <p className="text-[14px] font-semibold text-white">Conseil du jour</p>
                <p className="text-[12px] text-white/75 mt-0.5 leading-[1.4]">
                  {recommendations[0]?.text || "Les balades du soir renforcent le lien"}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(createPageUrl("Chat"))}
              className="flex flex-col justify-between bg-white rounded-2xl p-4 h-[140px] border border-[#E8E4DF] text-left active:scale-[0.97] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-[#2D9F82]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A4D3E]">Ton coach</p>
                <p className="text-[12px] text-gray-500 mt-0.5">Parler a PawCoach</p>
              </div>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between px-2">
            {quickActions.map((qa, i) => (
              <button
                key={i}
                onClick={() => navigate(createPageUrl(qa.page))}
                className="flex flex-col items-center gap-2 w-[72px] active:scale-95 transition-transform"
              >
                <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center" style={{ backgroundColor: qa.bg }}>
                  <qa.icon className="w-[22px] h-[22px]" style={{ color: qa.color }} />
                </div>
                <span className="text-[11px] font-medium text-gray-500">{qa.label}</span>
              </button>
            ))}
          </div>

          {/* Active Programs */}
          <ActiveProgramCards trainingBookmarks={trainingBookmarks} nutritionPlans={nutritionPlans} behaviorBookmarks={behaviorBookmarks} />

          {/* Streak Card */}
          {streakDays > 0 && (
            <div className="flex items-center gap-4 bg-white rounded-[20px] border border-[#E8E4DF] p-[18px]">
              <div className="w-11 h-11 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <Flame className="w-[22px] h-[22px] text-[#F59E0B]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#2D2D2D]">{streakDays} jours de suite</p>
                <p className="text-[12px] text-gray-400 mt-0.5">La regularite paie — continue comme ca !</p>
              </div>
              {streakLabel && (
                <span className="text-[11px] font-semibold text-[#2D9F82] bg-[#E8F5F0] px-3 py-1.5 rounded-full flex-shrink-0">
                  {streakLabel}
                </span>
              )}
            </div>
          )}

          {/* Emotional Tip — "Le savais-tu ?" */}
          <EmotionalTip dog={dog} />

          {/* Content Articles — "Pour Rex" */}
          <ContentArticles dog={dog} />

          {/* Trial expiry */}
          <TrialExpiryBanner user={user} dog={dog} />

          {/* Weekly Insight */}
          {(weeklyInsight || pastInsights.length > 0) && (
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
          )}

          {/* Guide J0 */}
          <FirstDayGuide
            dog={dog}
            todayCheckin={todayCheckin}
            scans={scans}
            dailyLogs={dailyLogs}
          />

          {/* Disclaimer */}
          <p className="text-center text-[10px] text-gray-400 px-6 pb-2">
            PawCoach est un outil de suivi. Consultez votre veterinaire.
          </p>
        </div>

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
