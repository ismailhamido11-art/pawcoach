import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Target, Clock, RotateCcw, CheckCircle2, BookmarkCheck, Home, Check, CalendarDays } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInMonths } from "date-fns";
import { toast } from "sonner";
import { checkTrainingBadges } from "@/components/achievements/badgeUtils";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

const ACTIVITY_LABELS = {
  faible: "Faible", modere: "Modéré", eleve: "Élevé", tres_eleve: "Très élevé"
};

const SESSION_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠", repos: "💤", entraînement: "🎯"
};

const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS_FR = ["jan.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

function addDaysToDate(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateFr(date) {
  return `${JOURS_COURTS[date.getDay()]} ${date.getDate()} ${MOIS_FR[date.getMonth()]}`;
}

function getElapsedDays(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function isSameDay(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === now.getTime();
}

function WeekCard({ week, weekIdx, isOpen, onToggle, startDate, completedSessions, onToggleSession }) {
  const weekSessions = week.daily_sessions || [];
  const doneCount = weekSessions.filter((_, i) => completedSessions?.includes(`w${weekIdx}-d${i}`)).length;
  const allDone = doneCount === weekSessions.length && weekSessions.length > 0;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${allDone ? "border-emerald-200" : "border-border"}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${allDone ? "bg-emerald-100" : "bg-primary/10"}`}>
            {allDone
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              : <span className="text-xs font-black text-primary">S{week.week}</span>
            }
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{week.theme}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{week.focus}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <span className={`text-[10px] font-bold ${allDone ? "text-emerald-600" : "text-violet-600"}`}>
              {doneCount}/{weekSessions.length}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1 border-t border-border pt-3">
              {weekSessions.map((session, i) => {
                const sessionKey = `w${weekIdx}-d${i}`;
                const isDone = completedSessions?.includes(sessionKey);
                const realDate = startDate ? addDaysToDate(startDate, weekIdx * 7 + i) : null;
                const today = realDate ? isSameDay(realDate) : false;

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 py-2.5 px-2 -mx-2 rounded-xl border transition-colors ${
                      today ? "bg-violet-50 border-violet-200" :
                      isDone ? "bg-muted/30 border-transparent" :
                      "border-transparent"
                    }`}
                  >
                    {startDate && onToggleSession && (
                      <button
                        onClick={() => onToggleSession(sessionKey)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${
                          isDone ? "bg-emerald-500 border-emerald-500" : "border-border/60 hover:border-violet-400"
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 text-white" />}
                      </button>
                    )}
                    <span className="text-lg leading-none mt-1">{SESSION_ICONS[session.type] || "🐶"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {realDate ? formatDateFr(realDate) : session.day}
                        </span>
                        {today && <span className="text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full leading-none">Aujourd'hui</span>}
                        <span className="text-[10px] text-muted-foreground capitalize">{session.type}</span>
                        <span className="ml-auto text-[10px] font-bold text-primary flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{session.duration_min} min
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDone ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
                        {session.activity}
                      </p>
                      {session.tips && !isDone && (
                        <p className="text-[10px] text-amber-600 mt-0.5 italic">💡 {session.tips}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AITrainingProgram({ dog, logs = [] }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
  const [program, setProgram] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [openWeek, setOpenWeek] = useState(0);
  const [goals, setGoals] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);

  // Load saved program from Bookmarks on mount
  useEffect(() => {
    if (!dog?.id) { setLoadingBookmarks(false); return; }
    let cancelled = false;
    async function loadSaved() {
      try {
        const bookmarks = await base44.entities.Bookmark.filter(
          { dog_id: dog.id, source: "training" }, "-created_at", 5
        );
        if (cancelled) return;
        for (const bk of (bookmarks || [])) {
          try {
            const data = typeof bk.content === "string" ? JSON.parse(bk.content) : bk.content;
            if (data?.start_date && data?.weeks) {
              const elapsed = getElapsedDays(data.start_date);
              const totalDays = (data.duration_weeks || 4) * 7;
              if (elapsed >= 0 && elapsed < totalDays) {
                setProgram(data);
                setSaved(true);
                setBookmarkId(bk.id);
                setCompletedSessions(data.completed_sessions || []);
                const currentWeekIdx = Math.min(Math.floor(elapsed / 7), (data.duration_weeks || 4) - 1);
                setOpenWeek(currentWeekIdx);
                break;
              }
            }
          } catch {}
        }
      } catch (e) {
        console.error("Error loading training bookmarks:", e);
      } finally {
        if (!cancelled) setLoadingBookmarks(false);
      }
    }
    loadSaved();
    return () => { cancelled = true; };
  }, [dog?.id]);

  const weeklyWalkMinutes = logs.slice(0, 7).reduce((acc, l) => acc + (l.walk_minutes || 0), 0);

  const saveProgram = async () => {
    if (!program || !dog || saved) return;
    try {
      const user = await base44.auth.me();
      const startDate = new Date().toISOString().split("T")[0];
      const payload = {
        ...program,
        start_date: startDate,
        dog_name: dog.name,
        completed_sessions: [],
      };
      const created = await base44.entities.Bookmark.create({
        dog_id: dog.id,
        owner: user.email,
        content: JSON.stringify(payload),
        source: "training",
        title: program.program_title?.slice(0, 60) || "Programme activité",
        created_at: new Date().toISOString(),
      });
      setProgram(payload);
      setBookmarkId(created.id);
      setCompletedSessions([]);
      setSaved(true);
      setOpenWeek(0);
      toast.success("Programme activé ! Retrouve-le sur ton accueil.");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const toggleSession = async (sessionKey) => {
    if (!bookmarkId) return;
    const prev = completedSessions;
    const next = prev.includes(sessionKey)
      ? prev.filter(k => k !== sessionKey)
      : [...prev, sessionKey];
    setCompletedSessions(next);
    const updatedProgram = { ...program, completed_sessions: next };
    setProgram(updatedProgram);
    try {
      await base44.entities.Bookmark.update(bookmarkId, {
        content: JSON.stringify(updatedProgram),
      });
    } catch (e) {
      console.error(e);
      setCompletedSessions(prev);
      setProgram({ ...program, completed_sessions: prev });
    }
  };

  async function generate() {
    if (!isPremium && !hasCredits) return;
    setGenerating(true);
    setProgram(null);
    setSaved(false);
    setBookmarkId(null);
    setCompletedSessions([]);
    try {
      const resp = await base44.functions.invoke("generateTrainingProgram", {
        dogId: dog.id,
        dogName: dog.name,
        dogBreed: dog.breed,
        dogBirthDate: dog.birth_date,
        activityLevel: dog.activity_level,
        healthIssues: dog.health_issues,
        goals: goals || null,
        weeklyWalkMinutes,
      });
      setProgram(resp.data?.program);
      setShowGoalInput(false);
      setOpenWeek(0);
      toast.success("Programme généré !");
      if (!isPremium) await consume();
      if (dog?.id && dog?.owner) {
        checkTrainingBadges(dog.id, dog.owner).catch(() => {});
      }
    } catch (err) {
      toast.error("Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  }

  // Loading bookmarks
  if (loadingBookmarks) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground">Chargement du programme…</p>
      </div>
    );
  }

  // No program — show generate screen
  if (!program && !generating) {
    return (
      <div className="space-y-4 pb-8">
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Programme d'activité sur mesure</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Génère un programme d'activité 4 semaines adapté à {dog?.name}, sa race ({dog?.breed || "…"}) et son niveau d'activité actuel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {dog?.breed && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{dog.breed}</span>}
            {dog?.activity_level && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activité {ACTIVITY_LABELS[dog.activity_level]}</span>}
            {dog?.birth_date && (() => {
              const m = differenceInMonths(new Date(), new Date(dog.birth_date));
              return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{m < 12 ? `${m} mois` : `${Math.floor(m/12)} ans`}</span>;
            })()}
            {weeklyWalkMinutes > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{weeklyWalkMinutes} min/semaine</span>}
          </div>

          <button
            onClick={() => setShowGoalInput(p => !p)}
            className="text-xs text-purple-600 font-bold flex items-center gap-1 mb-2"
          >
            <Target className="w-3.5 h-3.5" />
            {showGoalInput ? "Masquer les objectifs" : "Ajouter des objectifs spécifiques (optionnel)"}
          </button>
          {showGoalInput && (
            <textarea
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="Ex: perdre du poids, apprendre le rappel, préparer un trail…"
              className="w-full text-xs border border-purple-200 rounded-xl px-3 py-2 bg-white mb-3 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          )}

          {!isPremium && !hasCredits ? (
            <UpgradePrompt type="action" from="training" />
          ) : (
            <>
              {!isPremium && credits != null && <CreditBadge remaining={credits} className="mb-2" />}
              <Button onClick={generate} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Générer le programme
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
        </div>
        <p className="font-bold text-sm text-center">Création du programme en cours…</p>
        <p className="text-xs text-muted-foreground text-center max-w-52">L'IA analyse le profil de {dog?.name} et conçoit un plan adapté</p>
      </div>
    );
  }

  // Program display
  const totalSessions = program.weeks?.reduce((acc, w) => acc + (w.daily_sessions?.length || 0), 0) || 0;
  const completedCount = completedSessions.length;
  const overallProgress = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-4 pb-8">
      {/* Program header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Programme d'activité</p>
            <h3 className="font-black text-lg leading-tight">{program.program_title}</h3>
            <p className="text-white/80 text-xs mt-1.5 leading-relaxed">{program.summary}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {program.difficulty && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">
              {program.difficulty}
            </span>
          )}
          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {program.duration_weeks} semaines
          </span>
          {program.weekly_goal_minutes && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              ~{program.weekly_goal_minutes} min/sem
            </span>
          )}
        </div>

        {/* Progress bar for saved programs */}
        {saved && totalSessions > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/70 text-[10px] font-bold">Progression</span>
              <span className="text-white text-[10px] font-bold">{completedCount}/{totalSessions} séances</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Date range */}
        {program.start_date && (
          <div className="mt-2 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-white/50" />
            <span className="text-white/60 text-[10px]">
              {formatDateFr(new Date(program.start_date + "T00:00:00"))} → {formatDateFr(addDaysToDate(program.start_date, (program.duration_weeks || 4) * 7 - 1))}
            </span>
          </div>
        )}
      </div>

      {/* Weekly plan */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan hebdomadaire</p>
        {program.weeks?.map((week, i) => (
          <WeekCard
            key={i}
            week={week}
            weekIdx={i}
            isOpen={openWeek === i}
            onToggle={() => setOpenWeek(openWeek === i ? -1 : i)}
            startDate={program.start_date}
            completedSessions={completedSessions}
            onToggleSession={saved ? toggleSession : undefined}
          />
        ))}
      </div>

      {/* Breed tips */}
      {program.breed_specific_tips?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-2"><span>🐕</span> Conseils pour la race</p>
          <div className="space-y-2">
            {program.breed_specific_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning signs */}
      {program.warning_signs?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Signes d'épuisement à surveiller
          </p>
          <div className="space-y-1">
            {program.warning_signs.map((sign, i) => (
              <p key={i} className="text-xs text-amber-700">• {sign}</p>
            ))}
          </div>
        </div>
      )}

      {/* Progression indicators */}
      {program.progression_indicators?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Indicateurs de progression</p>
          <div className="space-y-1">
            {program.progression_indicators.map((ind, i) => (
              <p key={i} className="text-xs text-muted-foreground">✓ {ind}</p>
            ))}
          </div>
        </div>
      )}

      {/* Save + Regenerate */}
      <div className="flex gap-2">
        {!saved ? (
          <Button
            className="flex-1 gradient-primary border-0 text-white"
            onClick={saveProgram}
          >
            <Home className="w-4 h-4 mr-2" />
            Activer ce programme
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 text-emerald-700 text-sm font-bold">
            <BookmarkCheck className="w-4 h-4" /> Programme actif
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => { setProgram(null); setSaved(false); setBookmarkId(null); setCompletedSessions([]); }}>
          <RotateCcw className="w-4 h-4 mr-2" /> Nouveau
        </Button>
      </div>
    </div>
  );
}
