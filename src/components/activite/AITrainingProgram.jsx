import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark } from "@/api/entities";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Target, Clock, RotateCcw, CheckCircle2, BookmarkCheck, Home, Check, CalendarDays, Lightbulb, Eye, Star, PawPrint, BookOpen } from "lucide-react";
import { addDaysToDate, formatDateFr } from "@/utils/dateHelpers";
import { ACTIVITY_ICONS } from "@/utils/programHelpers";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInMonths } from "date-fns";
import { toast } from "sonner";
import { checkTrainingBadges } from "@/components/achievements/badgeUtils";
import { useActionCredits } from "@/hooks/useActionCredits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";
import CompletionCard, { GOAL_SUGGESTIONS } from "./CompletionCard";
import DayCard from "./DayCard";

const ACTIVITY_LABELS = {
  faible: "Faible", modere: "Modéré", eleve: "Élevé", tres_eleve: "Très élevé"
};

// ACTIVITY_ICONS, JOURS_COURTS, MOIS_FR imported from shared utils above

// addDaysToDate, formatDateFr imported from @/utils/dateHelpers
// GOAL_SUGGESTIONS, FEELING_OPTIONS, getCoachInsight, CompletionCard moved to ./CompletionCard.jsx
// DayCard moved to ./DayCard.jsx

function getElapsedDays(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

// ─── Main component ────────────────────────────────────────
export default function AITrainingProgram({ dog, logs = [] }) {
  const { credits, hasCredits, isPremium, consume, loading } = useActionCredits();
  const [program, setProgram] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [openDay, setOpenDay] = useState(-1);
  const [goals, setGoals] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [completedDays, setCompletedDays] = useState([]);
  const [pastPrograms, setPastPrograms] = useState([]);
  // Bilan states
  const [bilanObserved, setBilanObserved] = useState([]);
  const [bilanFeeling, setBilanFeeling] = useState(0);
  const [bilanFeedback, setBilanFeedback] = useState("");
  const [bilanNextFocus, setBilanNextFocus] = useState([]);
  const [bilanSaved, setBilanSaved] = useState(false);
  const [bilanJustSaved, setBilanJustSaved] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Load saved program + past programs from Bookmarks
  useEffect(() => {
    if (!dog?.id) { setLoadingBookmarks(false); return; }
    let cancelled = false;
    async function loadSaved() {
      try {
        const bookmarks = await Bookmark.filter(
          { dog_id: dog.id, source: "training" }, "-created_at", 10
        );
        if (cancelled) return;
        let foundActive = false;
        const past = [];
        for (const bk of (bookmarks || [])) {
          try {
            const data = typeof bk.content === "string" ? JSON.parse(bk.content) : bk.content;
            if (!data?.start_date || !data?.days || !Array.isArray(data.days)) continue;
            if (data.archived) continue;
            const elapsed = getElapsedDays(data.start_date);
            const totalDays = data.duration_days || 7;
            const allDone = (data.completed_days || []).length >= totalDays;

            if (!foundActive && elapsed >= 0 && elapsed < totalDays && !allDone) {
              // Active program
              setProgram(data);
              setSaved(true);
              setBookmarkId(bk.id);
              setCompletedDays(data.completed_days || []);
              setOpenDay(Math.min(elapsed, totalDays - 1));
              foundActive = true;
            } else if (!foundActive && allDone && elapsed >= 0 && elapsed < totalDays) {
              // All days done but still within date range — show completion
              setProgram(data);
              setSaved(true);
              setBookmarkId(bk.id);
              setCompletedDays(data.completed_days || []);
              // Restore bilan if exists
              if (data.bilan) {
                setBilanObserved(data.bilan.observed_indicators || []);
                setBilanFeeling(data.bilan.feeling || 0);
                setBilanFeedback(data.bilan.feedback || "");
                setBilanNextFocus(data.bilan.next_focus || []);
                setBilanSaved(true);
              }
              foundActive = true;
            } else if (elapsed >= totalDays || allDone) {
              // Past completed program
              past.push({
                title: data.program_title,
                date: data.start_date,
                themes: data.days?.map(d => d.theme).filter(Boolean) || [],
                bilan: data.bilan || null,
              });
            }
          } catch (e) { console.warn("AITrainingProgram: bookmark parse failed", e?.message); }
        }
        setPastPrograms(past);
      } catch (e) {
        console.error("Error loading training bookmarks:", e);
      } finally {
        if (!cancelled) setLoadingBookmarks(false);
      }
    }
    loadSaved();
    return () => { cancelled = true; };
  }, [dog?.id]);

  // Richer walk data for the backend — filter by calendar days, not array index
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const last7DayLogs = logs.filter(l => l.date >= sevenDaysAgoStr);
  const weeklyWalkMinutes = last7DayLogs.reduce((acc, l) => acc + (l.walk_minutes || 0), 0);
  const walkDaysLast7 = last7DayLogs.filter(l => l.walk_minutes > 0).length;
  const recentWalkLogs = logs.filter(l => l.walk_minutes > 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const avgWalkMinutes = recentWalkLogs.length > 0 ? Math.round(recentWalkLogs.reduce((s, l) => s + l.walk_minutes, 0) / recentWalkLogs.length) : 0;
  const weeklyWalkDistanceKm = Math.round(last7DayLogs.reduce((acc, l) => acc + (l.walk_distance_km || 0), 0) * 10) / 10;
  // Mood summary for backend
  const moodCounts = {};
  last7DayLogs.forEach(l => { if (l.walk_mood) moodCounts[l.walk_mood] = (moodCounts[l.walk_mood] || 0) + 1; });
  const walkMoodSummary = Object.keys(moodCounts).length > 0
    ? Object.entries(moodCounts).map(([m, n]) => `${m} (${n}x)`).join(", ")
    : null;

  const saveProgram = async () => {
    if (!program || !dog || saved) return;
    try {
      const user = await base44.auth.me();
      const startDate = new Date().toISOString().split("T")[0];
      const payload = { ...program, start_date: startDate, dog_name: dog.name, completed_days: [] };
      const created = await Bookmark.create({
        dog_id: dog.id, owner: user.email,
        content: JSON.stringify(payload), source: "training",
        title: program.program_title?.slice(0, 60) || "Programme activité",
        created_at: new Date().toISOString(),
      });
      setProgram(payload);
      setBookmarkId(created.id);
      setCompletedDays([]);
      setSaved(true);
      setOpenDay(0);
      toast.success("Programme activé !");
    } catch (e) {
      console.error(e);
      toast.error("Impossible de sauvegarder le programme. Réessaie.");
    }
  };

  const toggleDay = async (dayIdx) => {
    if (!bookmarkId) return;
    const key = `d${dayIdx}`;
    const prev = completedDays;
    const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    setCompletedDays(next);
    const totalDays = (program.days || []).length || 7;
    const allDone = next.length >= totalDays;
    const updatedProgram = {
      ...program,
      completed_days: next,
      ...(allDone && !program.completed_at ? { completed_at: new Date().toISOString() } : {}),
      ...(!allDone ? { completed_at: undefined } : {}),
    };
    setProgram(updatedProgram);
    try {
      await Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) });
    } catch (e) {
      console.error(e);
      setCompletedDays(prev);
      setProgram({ ...program, completed_days: prev });
      toast.error("Erreur lors de la sauvegarde. Réessaie.");
    }
  };

  const saveBilan = async () => {
    if (!bookmarkId || bilanSaved) return;
    const bilan = {
      observed_indicators: bilanObserved,
      feeling: bilanFeeling,
      feedback: bilanFeedback,
      next_focus: bilanNextFocus,
    };
    const updatedProgram = { ...program, bilan };
    setProgram(updatedProgram);
    setBilanSaved(true);
    setBilanJustSaved(true);
    try {
      await Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) });
      toast.success("Bilan enregistré !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde du bilan. Réessaie.");
    }
  };

  const startNewProgram = async () => {
    if (program) {
      const totalDays = program.duration_days || 7;
      const completedCount = completedDays.length;
      if (completedCount < totalDays) {
        setConfirmDialog({
          title: "Abandonner le programme ?",
          description: `Tu es au jour ${completedCount}/${totalDays}. Le programme en cours sera archivé et tu pourras en démarrer un nouveau.`,
          action: async () => {
            await _doStartNewProgram();
          },
        });
        return;
      }
    }
    await _doStartNewProgram();
  };

  const _doStartNewProgram = async () => {
    // Archive old bookmark so it won't reload as active
    if (bookmarkId && program) {
      try {
        const archived = { ...program, archived: true };
        await Bookmark.update(bookmarkId, { content: JSON.stringify(archived) });
      } catch (e) { console.warn("AITrainingProgram: archive bookmark failed", e?.message); }
    }
    // Add to pastPrograms for anti-redundancy
    if (program?.program_title) {
      setPastPrograms(prev => [{
        title: program.program_title, date: program.start_date,
        themes: program.days?.map(d => d.theme).filter(Boolean) || [],
        bilan: program.bilan || null,
      }, ...prev]);
    }
    // Pre-fill goals from bilan next_focus
    if (bilanNextFocus.length > 0) {
      setSelectedGoals(bilanNextFocus);
    }
    setProgram(null);
    setSaved(false);
    setBookmarkId(null);
    setCompletedDays([]);
    setBilanObserved([]);
    setBilanFeeling(0);
    setBilanFeedback("");
    setBilanNextFocus([]);
    setBilanSaved(false);
    setBilanJustSaved(false);
  };

  async function generate() {
    if (generating) return; // guard double-clic
    if (!isPremium && !hasCredits) return;
    setGenerating(true);
    setProgram(null);
    setSaved(false);
    setBookmarkId(null);
    setCompletedDays([]);
    const allGoals = [...selectedGoals, goals.trim()].filter(Boolean).join(", ") || null;
    try {
      // Extract last bilan for continuity
      const lastBilan = pastPrograms.find(p => p.bilan)?.bilan || null;

      const resp = await base44.functions.invoke("generateTrainingProgram", {
        dogId: dog.id,
        dogName: dog.name,
        dogBreed: dog.breed,
        dogBirthDate: dog.birth_date,
        activityLevel: dog.activity_level,
        healthIssues: dog.health_issues,
        goals: allGoals,
        weeklyWalkMinutes,
        walkDaysLast7,
        avgWalkMinutes,
        weeklyWalkDistanceKm: weeklyWalkDistanceKm || undefined,
        walkMoodSummary: walkMoodSummary || undefined,
        previousPrograms: pastPrograms.map(p => p.title).filter(Boolean),
        previousBilan: lastBilan ? {
          feeling: lastBilan.feeling,
          observed: lastBilan.observed_indicators?.length || 0,
          feedback: lastBilan.feedback || "",
          nextFocus: lastBilan.next_focus || [],
        } : null,
      });
      // Robust response parsing (handles both resp.data.program and resp.program)
      let respData = resp?.data || resp;
      if (typeof respData === "string") { try { respData = JSON.parse(respData); } catch (e) { console.warn("AITrainingProgram: respData JSON parse failed", e?.message); } }
      let prog = respData?.program;
      if (typeof prog === "string") { try { prog = JSON.parse(prog); } catch (e) { console.warn("AITrainingProgram: prog JSON parse failed", e?.message); } }

      // Validate program structure
      if (!prog || !Array.isArray(prog.days) || prog.days.length === 0) {
        console.error("Invalid program response:", resp);
        toast.error("Le programme reçu est incomplet. Réessaie — ça marche en général au 2e essai.");
        return;
      }

      // Auto-save: create bookmark immediately so checkboxes work from the start
      const startDate = new Date().toISOString().split("T")[0];
      const payload = { ...prog, start_date: startDate, dog_name: dog.name, completed_days: [] };
      setProgram(payload);
      setCompletedDays([]);
      setShowGoalInput(false);
      setOpenDay(0);

      try {
        const user = await base44.auth.me();
        const created = await Bookmark.create({
          dog_id: dog.id, owner: user.email,
          content: JSON.stringify(payload), source: "training",
          title: prog.program_title?.slice(0, 60) || "Programme activité",
          created_at: new Date().toISOString(),
        });
        setBookmarkId(created.id);
        setSaved(true);
      } catch (saveErr) {
        console.error("Auto-save failed:", saveErr);
        // User can still click "Activer" manually
      }

      toast.success("Programme généré !");
      if (!isPremium) await consume();
      if (dog?.id && dog?.owner) {
        checkTrainingBadges(dog.id, dog.owner).catch(() => {});
      }
    } catch (err) {
      console.error("Generate error:", err);
      toast.error("Impossible de générer le programme. Vérifie ta connexion et réessaie.");
    } finally {
      setGenerating(false);
    }
  }

  // ─── RENDER ──────────────────────────────────────────────

  if (loadingBookmarks) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
        </div>
        <p className="font-bold text-sm text-center">Création du programme en cours…</p>
        <p className="text-xs text-muted-foreground text-center max-w-52">L'IA conçoit 7 jours de coaching personnalisé pour {dog?.name}</p>
      </div>
    );
  }

  // ─── GENERATE SCREEN ─────────────────────────────────────
  if (!program) {
    return (
      <div className="space-y-4 pb-8">
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Programme 7 jours sur mesure</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                7 jours de coaching personnalisé pour {dog?.name} — activité guidée, fait surprenant, conseil de pro.
              </p>
            </div>
          </div>

          {/* Dog chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {dog?.breed && <span className="text-[11px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{dog.breed}</span>}
            {dog?.activity_level && <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activité {ACTIVITY_LABELS[dog.activity_level]}</span>}
            {dog?.birth_date && (() => {
              const m = differenceInMonths(new Date(), new Date(dog.birth_date));
              return <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{m < 12 ? `${m} mois` : `${Math.floor(m/12)} ans`}</span>;
            })()}
          </div>

          {/* What you'll get preview */}
          <div className="bg-white/80 rounded-xl p-3 border border-purple-100/50 mb-4">
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2">Chaque jour tu recevras</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { Icon: CalendarDays, color: "text-violet-600", text: "Activité guidée pas à pas" },
                { Icon: BookOpen, color: "text-amber-600", text: "Fait surprenant du jour" },
                { Icon: Lightbulb, color: "text-amber-500", text: "Conseil de pro non-évident" },
                { Icon: Eye, color: "text-blue-500", text: "Observation comportementale" },
                { Icon: Star, color: "text-amber-500", text: "Défi bonus amusant" },
                { Icon: PawPrint, color: "text-emerald-600", text: "Adapté à la race" },
              ].map(({ Icon: FeatIcon, color, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <FeatIcon className={`w-4 h-4 ${color} flex-shrink-0`} />
                  <span className="text-[11px] text-foreground/70">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal suggestions — quick pick chips */}
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2">Tes objectifs</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GOAL_SUGGESTIONS.map(({ label, Icon: GI3, color }) => {
              const selected = selectedGoals.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => setSelectedGoals(prev => selected ? prev.filter(g => g !== label) : [...prev, label])}
                  className={`text-[11px] font-bold px-2.5 py-2.5 rounded-full transition-all flex items-center gap-1 ${
                    selected ? "bg-purple-600 text-white" : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  <GI3 className={`w-3 h-3 ${selected ? "text-white" : color}`} /> {label}
                </button>
              );
            })}
          </div>

          {/* Custom goals textarea */}
          <button
            onClick={() => setShowGoalInput(p => !p)}
            className="text-xs text-purple-600 font-bold flex items-center gap-1 mb-2"
          >
            <Target className="w-3.5 h-3.5" />
            {showGoalInput ? "Masquer" : "Objectif personnalisé (optionnel)"}
          </button>
          {showGoalInput && (
            <textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="Ex: préparer un trail, socialiser avec d'autres chiens…"
              className="w-full text-xs border border-purple-200 rounded-xl px-3 py-2 bg-white mb-3 resize-none h-14 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          )}

          {/* Past programs */}
          {pastPrograms.length > 0 && (
            <div className="mb-4 pt-3 border-t border-purple-100">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Programmes terminés</p>
              <div className="space-y-1.5">
                {pastPrograms.slice(0, 3).map((p, i) => (
                  <div key={p.title ? `${p.title}-${i}` : i} className="flex items-center gap-2 bg-emerald-50/50 rounded-lg px-2.5 py-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] text-foreground/70 truncate flex-1">{p.title}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{p.date}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground italic mt-1.5">Le prochain programme sera différent de ceux-ci</p>
            </div>
          )}

          {!isPremium && !loading && !hasCredits ? (
            <UpgradePrompt type="action" from="training" />
          ) : (
            <>
              {!isPremium && credits != null && <CreditBadge remaining={credits} className="mb-2" />}
              <Button onClick={generate} disabled={generating} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Générer mon programme 7 jours
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── PROGRAM DISPLAY ─────────────────────────────────────
  const days = program.days || [];
  const totalDays = days.length || 7;
  const completedCount = completedDays.length;
  const overallProgress = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const totalMinutes = days.reduce((acc, d) => acc + (d.activity?.duration_min || 0), 0);
  const isAllDone = completedCount >= totalDays && saved;

  // ─── COMPLETION VIEW ─────────────────────────────────────
  if (isAllDone) {
    return (
      <CompletionCard
        program={program}
        dog={dog}
        totalMinutes={totalMinutes}
        bilanState={{
          observed: bilanObserved, setObserved: setBilanObserved,
          feeling: bilanFeeling, setFeeling: setBilanFeeling,
          feedback: bilanFeedback, setFeedback: setBilanFeedback,
          nextFocus: bilanNextFocus, setNextFocus: setBilanNextFocus,
          bilanSaved,
        }}
        onSaveBilan={saveBilan}
        onNewProgram={startNewProgram}
        bilanJustSaved={bilanJustSaved}
      />
    );
  }

  // ─── ACTIVE PROGRAM VIEW ─────────────────────────────────
  return (
    <div className="space-y-4 pb-8">
      {/* Program header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <p className="text-white/70 text-[11px] font-bold uppercase tracking-wider mb-1">Programme 7 jours</p>
        <h3 className="font-black text-lg leading-tight">{program.program_title}</h3>
        <p className="text-white/80 text-xs mt-1.5 leading-relaxed">{program.summary}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {program.difficulty && <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full capitalize">{program.difficulty}</span>}
          <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">7 jours</span>
          {totalMinutes > 0 && <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">~{totalMinutes} min total</span>}
        </div>
        {saved && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/70 text-[11px] font-bold">Progression</span>
              <span className="text-white text-[11px] font-bold">{completedCount}/{totalDays} jours</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
        )}
        {program.start_date && (
          <div className="mt-2 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-white/50" />
            <span className="text-white/60 text-[11px]">
              {formatDateFr(new Date(program.start_date + "T00:00:00"))} → {formatDateFr(addDaysToDate(program.start_date, totalDays - 1))}
            </span>
          </div>
        )}
      </div>

      {program.program_goal && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Objectif</p>
          <p className="text-xs text-foreground/80">{program.program_goal}</p>
        </div>
      )}

      {/* Days */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tes 7 jours</p>
        {days.map((day, i) => (
          <DayCard key={day.theme || day.title || i} day={day} dayIdx={i} isOpen={openDay === i} onToggle={() => setOpenDay(openDay === i ? -1 : i)} startDate={program.start_date} isDone={completedDays.includes(`d${i}`)} onToggleComplete={saved ? () => toggleDay(i) : undefined} />
        ))}
      </div>

      {program.breed_specific_tips?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-2"><PawPrint className="w-4 h-4 text-emerald-600" /> Conseils pour la race</p>
          <div className="space-y-2">
            {program.breed_specific_tips.map((tip, i) => (
              <div key={`tip-${i}`} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {program.warning_signs?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Signes à surveiller</p>
          <div className="space-y-1">{program.warning_signs.map((sign, i) => <p key={`warn-${i}`} className="text-xs text-amber-700">• {sign}</p>)}</div>
        </div>
      )}

      {program.progression_indicators?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Indicateurs de progression</p>
          <div className="space-y-1">{program.progression_indicators.map((ind, i) => <p key={`ind-${i}`} className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500 flex-shrink-0" /> {ind}</p>)}</div>
        </div>
      )}

      {/* Save + Regenerate */}
      <div className="flex gap-2">
        {!saved ? (
          <Button className="flex-1 gradient-primary border-0 text-white" onClick={saveProgram}>
            <Home className="w-4 h-4 mr-2" /> Activer ce programme
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 text-emerald-700 text-sm font-bold">
            <BookmarkCheck className="w-4 h-4" /> Programme actif
          </div>
        )}
        <Button variant="outline" size="sm" onClick={startNewProgram}>
          <RotateCcw className="w-4 h-4 mr-2" /> Nouveau
        </Button>
      </div>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { confirmDialog?.action(); setConfirmDialog(null); }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}