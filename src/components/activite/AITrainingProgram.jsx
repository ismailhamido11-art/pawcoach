import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Target, Clock, RotateCcw, CheckCircle2, BookmarkCheck, Home, Check, CalendarDays, Lightbulb, Eye, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInMonths } from "date-fns";
import { toast } from "sonner";
import { checkTrainingBadges } from "@/components/achievements/badgeUtils";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

const ACTIVITY_LABELS = {
  faible: "Faible", modere: "Modéré", eleve: "Élevé", tres_eleve: "Très élevé"
};

const ACTIVITY_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠",
  "repos actif": "💆", repos: "💤", entraînement: "🎯",
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

function DayCard({ day, dayIdx, isOpen, onToggle, startDate, isDone, onToggleComplete }) {
  const realDate = startDate ? addDaysToDate(startDate, dayIdx) : null;
  const today = realDate ? isSameDay(realDate) : false;
  const actType = day.activity?.type || "balade";
  const icon = ACTIVITY_ICONS[actType] || "🐶";

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
      isDone ? "border-emerald-200" : today ? "border-violet-300 shadow-violet-100" : "border-border"
    }`}>
      {/* Header — always visible */}
      <div className="flex items-start gap-3 p-4">
        {/* Completion toggle */}
        {startDate && onToggleComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              isDone ? "bg-emerald-500 border-emerald-500" : "border-border/60 hover:border-violet-400"
            }`}
          >
            {isDone && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        )}

        {/* Main content */}
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {realDate ? formatDateFr(realDate) : `Jour ${dayIdx + 1}`}
            </span>
            {today && <span className="text-[9px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full leading-none">Aujourd'hui</span>}
            {isDone && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">Fait</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{icon}</span>
            <p className={`text-sm font-bold flex-1 ${isDone ? "text-muted-foreground" : "text-foreground"}`}>
              {day.title || day.activity?.name || `Jour ${dayIdx + 1}`}
            </p>
            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5 flex-shrink-0">
              <Clock className="w-3 h-3" />{day.activity?.duration_min || 20} min
            </span>
          </div>

          {/* Fun fact teaser when collapsed */}
          {!isOpen && day.fun_fact && (
            <p className="text-[10px] text-amber-700/70 mt-1.5 line-clamp-1 italic ml-7">
              📖 {day.fun_fact}
            </p>
          )}
        </button>

        <button onClick={onToggle} className="flex-shrink-0 mt-1">
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* Theme */}
              {day.theme && (
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{day.theme}</p>
              )}

              {/* Activity with steps */}
              <div className="bg-violet-50/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{icon}</span>
                  <p className="text-xs font-bold text-foreground">{day.activity?.name}</p>
                  <span className="text-[10px] text-muted-foreground capitalize ml-auto">{actType}</span>
                </div>
                {day.activity?.description && (
                  <p className="text-xs text-foreground/80 leading-relaxed">{day.activity.description}</p>
                )}
                {day.activity?.steps?.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {day.activity.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-black text-violet-700">{i + 1}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fun fact */}
              {day.fun_fact && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 mb-1 flex items-center gap-1.5">
                    📖 Le savais-tu ?
                  </p>
                  <p className="text-xs text-amber-900/80 leading-relaxed">{day.fun_fact}</p>
                </div>
              )}

              {/* Coach tip */}
              {day.coach_tip && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" /> Conseil du coach
                  </p>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">{day.coach_tip}</p>
                </div>
              )}

              {/* Observe */}
              {day.observe && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" /> Observe
                  </p>
                  <p className="text-xs text-blue-900/80 leading-relaxed">{day.observe}</p>
                </div>
              )}

              {/* Bonus challenge */}
              {day.bonus_challenge && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-700 mb-1 flex items-center gap-1.5">
                    <Star className="w-3 h-3" /> Défi bonus
                  </p>
                  <p className="text-xs text-purple-900/80 leading-relaxed">{day.bonus_challenge}</p>
                </div>
              )}

              {/* Motivation */}
              {day.motivation && (
                <p className="text-xs text-violet-600 italic text-center pt-1">{day.motivation}</p>
              )}
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
  const [openDay, setOpenDay] = useState(-1);
  const [goals, setGoals] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);
  const [completedDays, setCompletedDays] = useState([]);

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
            if (data?.start_date && data?.days && Array.isArray(data.days)) {
              const elapsed = getElapsedDays(data.start_date);
              const totalDays = data.duration_days || 7;
              if (elapsed >= 0 && elapsed < totalDays) {
                setProgram(data);
                setSaved(true);
                setBookmarkId(bk.id);
                setCompletedDays(data.completed_days || []);
                // Auto-open today's day
                setOpenDay(Math.min(elapsed, totalDays - 1));
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
        completed_days: [],
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
      setCompletedDays([]);
      setSaved(true);
      setOpenDay(0);
      toast.success("Programme activé ! Retrouve-le sur ton accueil.");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const toggleDay = async (dayIdx) => {
    if (!bookmarkId) return;
    const key = `d${dayIdx}`;
    const prev = completedDays;
    const next = prev.includes(key)
      ? prev.filter(k => k !== key)
      : [...prev, key];
    setCompletedDays(next);
    const updatedProgram = { ...program, completed_days: next };
    setProgram(updatedProgram);
    try {
      await base44.entities.Bookmark.update(bookmarkId, {
        content: JSON.stringify(updatedProgram),
      });
    } catch (e) {
      console.error(e);
      setCompletedDays(prev);
      setProgram({ ...program, completed_days: prev });
    }
  };

  async function generate() {
    if (!isPremium && !hasCredits) return;
    setGenerating(true);
    setProgram(null);
    setSaved(false);
    setBookmarkId(null);
    setCompletedDays([]);
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
      let prog = resp.data?.program;
      if (typeof prog === "string") { try { prog = JSON.parse(prog); } catch {} }
      setProgram(prog);
      setShowGoalInput(false);
      setOpenDay(0);
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
        <p className="text-xs text-muted-foreground">Chargement…</p>
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
              <p className="font-bold text-sm text-foreground">Programme 7 jours sur mesure</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                7 jours de coaching personnalisé pour {dog?.name} — chaque jour : activité guidée pas à pas, fait surprenant, conseil de pro.
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
                Générer mon programme 7 jours
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
        <p className="text-xs text-muted-foreground text-center max-w-52">L'IA conçoit 7 jours de coaching personnalisé pour {dog?.name}</p>
      </div>
    );
  }

  // Program display
  const days = program.days || [];
  const totalDays = days.length || 7;
  const completedCount = completedDays.length;
  const overallProgress = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const totalMinutes = days.reduce((acc, d) => acc + (d.activity?.duration_min || 0), 0);

  return (
    <div className="space-y-4 pb-8">
      {/* Program header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Programme 7 jours</p>
        <h3 className="font-black text-lg leading-tight">{program.program_title}</h3>
        <p className="text-white/80 text-xs mt-1.5 leading-relaxed">{program.summary}</p>

        <div className="flex gap-2 mt-3 flex-wrap">
          {program.difficulty && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">
              {program.difficulty}
            </span>
          )}
          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            7 jours
          </span>
          {totalMinutes > 0 && (
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              ~{totalMinutes} min total
            </span>
          )}
        </div>

        {/* Progress bar for saved programs */}
        {saved && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/70 text-[10px] font-bold">Progression</span>
              <span className="text-white text-[10px] font-bold">{completedCount}/{totalDays} jours</span>
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
              {formatDateFr(new Date(program.start_date + "T00:00:00"))} → {formatDateFr(addDaysToDate(program.start_date, totalDays - 1))}
            </span>
          </div>
        )}
      </div>

      {/* Program goal */}
      {program.program_goal && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Objectif du programme</p>
          <p className="text-xs text-foreground/80">{program.program_goal}</p>
        </div>
      )}

      {/* Days */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tes 7 jours</p>
        {days.map((day, i) => (
          <DayCard
            key={i}
            day={day}
            dayIdx={i}
            isOpen={openDay === i}
            onToggle={() => setOpenDay(openDay === i ? -1 : i)}
            startDate={program.start_date}
            isDone={completedDays.includes(`d${i}`)}
            onToggleComplete={saved ? () => toggleDay(i) : undefined}
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
            <AlertTriangle className="w-4 h-4" /> Signes à surveiller
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
        <Button variant="outline" size="sm" onClick={() => { setProgram(null); setSaved(false); setBookmarkId(null); setCompletedDays([]); }}>
          <RotateCcw className="w-4 h-4 mr-2" /> Nouveau
        </Button>
      </div>
    </div>
  );
}
