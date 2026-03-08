import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Target, Clock, RotateCcw, CheckCircle2, BookmarkCheck, Home, Check, CalendarDays, Lightbulb, Eye, Star, MessageSquare, ArrowRight } from "lucide-react";
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

const GOAL_SUGGESTIONS = [
  { label: "Renforcer le lien", emoji: "❤️" },
  { label: "Dépenser son énergie", emoji: "⚡" },
  { label: "Calme et relaxation", emoji: "🧘" },
  { label: "Perdre du poids", emoji: "🏋️" },
  { label: "Stimulation mentale", emoji: "🧠" },
  { label: "Obéissance de base", emoji: "🎯" },
];

const FEELING_OPTIONS = [
  { emoji: "😕", label: "Pas convaincu" },
  { emoji: "🙂", label: "Correct" },
  { emoji: "😊", label: "Bien" },
  { emoji: "😄", label: "Super" },
  { emoji: "🤩", label: "Incroyable" },
];

function getCoachInsight(feeling, observedCount, totalIndicators, dogName) {
  const name = dogName || "ton chien";
  if (feeling >= 4 && observedCount >= 2) {
    return { emoji: "🌟", title: "Progression remarquable", message: `${observedCount}/${totalIndicators} signes de progression observés — ${name} et toi formez une super équipe. Le prochain programme va consolider ces acquis.` };
  }
  if (feeling >= 3 || observedCount >= 1) {
    return { emoji: "💪", title: "Beau parcours", message: `Les résultats commencent à se voir ! Continue sur cette lancée avec ${name} — la régularité est la clé.` };
  }
  if (feeling >= 1) {
    return { emoji: "🌱", title: "Les bases sont posées", message: `Chaque programme renforce ta relation avec ${name}. Les vrais résultats arrivent souvent au 2e ou 3e programme — persévère.` };
  }
  return { emoji: "🐾", title: "Premier pas franchi", message: `Tu as pris le temps de t'investir pour ${name} — c'est déjà énorme. Le prochain programme s'adaptera à tes observations.` };
}

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

// ─── DayCard ───────────────────────────────────────────────
function DayCard({ day, dayIdx, isOpen, onToggle, startDate, isDone, onToggleComplete }) {
  const realDate = startDate ? addDaysToDate(startDate, dayIdx) : null;
  const today = realDate ? isSameDay(realDate) : false;
  const actType = day.activity?.type || "balade";
  const icon = ACTIVITY_ICONS[actType] || "🐶";

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
      isDone ? "border-emerald-200" : today ? "border-violet-300 shadow-violet-100" : "border-border"
    }`}>
      <div className="flex items-start gap-3 p-4">
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
          {!isOpen && day.fun_fact && (
            <p className="text-[10px] text-amber-700/70 mt-1.5 line-clamp-1 italic ml-7">📖 {day.fun_fact}</p>
          )}
        </button>

        <button onClick={onToggle} className="flex-shrink-0 mt-1">
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {day.theme && <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">{day.theme}</p>}

              <div className="bg-violet-50/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{icon}</span>
                  <p className="text-xs font-bold text-foreground">{day.activity?.name}</p>
                  <span className="text-[10px] text-muted-foreground capitalize ml-auto">{actType}</span>
                </div>
                {day.activity?.description && <p className="text-xs text-foreground/80 leading-relaxed">{day.activity.description}</p>}
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

              {day.fun_fact && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 mb-1">📖 Le savais-tu ?</p>
                  <p className="text-xs text-amber-900/80 leading-relaxed">{day.fun_fact}</p>
                </div>
              )}
              {day.coach_tip && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1.5"><Lightbulb className="w-3 h-3" /> Conseil du coach</p>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">{day.coach_tip}</p>
                </div>
              )}
              {day.observe && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-700 mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Observe</p>
                  <p className="text-xs text-blue-900/80 leading-relaxed">{day.observe}</p>
                </div>
              )}
              {day.bonus_challenge && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-[10px] font-bold text-purple-700 mb-1 flex items-center gap-1.5"><Star className="w-3 h-3" /> Défi bonus</p>
                  <p className="text-xs text-purple-900/80 leading-relaxed">{day.bonus_challenge}</p>
                </div>
              )}
              {day.motivation && <p className="text-xs text-violet-600 italic text-center pt-1">{day.motivation}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CompletionCard ────────────────────────────────────────
function CompletionCard({ program, dog, totalMinutes, bilanState, onSaveBilan, onNewProgram, bilanJustSaved }) {
  const { observed, setObserved, feeling, setFeeling, feedback, setFeedback, nextFocus, setNextFocus, bilanSaved } = bilanState;
  const confetti = Array.from({ length: 10 }, (_, i) => ({
    x: 10 + Math.random() * 80,
    delay: Math.random() * 0.6,
    emoji: ["🎉", "⭐", "🐾", "💪", "🏆"][i % 5],
  }));

  const totalIndicators = program.progression_indicators?.length || 0;
  const insight = bilanSaved ? getCoachInsight(feeling, observed.length, totalIndicators, dog?.name) : null;

  return (
    <div className="space-y-4 pb-8">
      {/* Celebration header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white text-center relative overflow-hidden"
      >
        {confetti.map((c, i) => (
          <motion.span
            key={i}
            className="absolute text-lg pointer-events-none"
            style={{ left: `${c.x}%`, top: -10 }}
            initial={{ y: -10, opacity: 1, rotate: 0 }}
            animate={{ y: 180, opacity: 0, rotate: 360 }}
            transition={{ duration: 2.5 + Math.random(), delay: c.delay, ease: "easeOut" }}
          >
            {c.emoji}
          </motion.span>
        ))}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-5xl mb-3"
        >🎉</motion.div>
        <h3 className="font-black text-xl relative">Programme terminé !</h3>
        <p className="text-white/80 text-sm mt-2 relative">
          Bravo ! Tu as complété les 7 jours avec {dog?.name || "ton chien"}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="font-black text-lg text-emerald-700">7/7</p>
          <p className="text-[10px] text-emerald-600 font-bold">Jours</p>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
          <p className="font-black text-lg text-violet-700">{totalMinutes}</p>
          <p className="text-[10px] text-violet-600 font-bold">Minutes</p>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <p className="font-black text-lg text-amber-700">{program.days?.length || 7}</p>
          <p className="text-[10px] text-amber-600 font-bold">Activités</p>
        </motion.div>
      </div>

      {/* What was worked on */}
      <div className="bg-white border border-border rounded-2xl p-4">
        <p className="font-bold text-sm mb-2">Ce que tu as travaillé</p>
        <div className="space-y-1.5">
          {program.days?.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-foreground/80">{d.theme || d.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bilan ─── */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <p className="font-bold text-sm text-foreground">Ton bilan</p>
        </div>

        {/* Progression indicators check */}
        {program.progression_indicators?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
              As-tu observé ces signes chez {dog?.name} ?
            </p>
            <div className="space-y-1.5">
              {program.progression_indicators.map((ind, i) => {
                const checked = observed.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => !bilanSaved && setObserved(prev => checked ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl border transition-colors ${
                      checked ? "bg-blue-100 border-blue-300" : "bg-white border-border hover:border-blue-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      checked ? "bg-blue-600 border-blue-600" : "border-border/60"
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-foreground/80">{ind}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feeling scale */}
        <div>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Comment te sens-tu par rapport à ta relation avec {dog?.name} ?
          </p>
          <div className="flex justify-between gap-1">
            {FEELING_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => !bilanSaved && setFeeling(i + 1)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition-all ${
                  feeling === i + 1 ? "bg-blue-100 border-blue-300 scale-105" : "bg-white border-border hover:border-blue-200"
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[8px] text-muted-foreground leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Open feedback */}
        <div>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Un mot sur ton expérience ? (optionnel)
          </p>
          <textarea
            value={feedback}
            onChange={e => !bilanSaved && setFeedback(e.target.value)}
            readOnly={bilanSaved}
            placeholder={`Ex: ${dog?.name || "Mon chien"} est beaucoup plus calme en balade, le jeu des gobelets est devenu son préféré…`}
            className="w-full text-xs border border-blue-200 rounded-xl px-3 py-2 bg-white resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Next focus goals */}
        <div>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Sur quoi te concentrer ensuite ?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_SUGGESTIONS.map(({ label, emoji }) => {
              const selected = nextFocus.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => !bilanSaved && setNextFocus(prev => selected ? prev.filter(g => g !== label) : [...prev, label])}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
                    selected ? "bg-blue-600 text-white" : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  {emoji} {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save bilan */}
        {!bilanSaved ? (
          <Button onClick={onSaveBilan} className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="sm">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Enregistrer mon bilan
          </Button>
        ) : (
          <motion.div
            initial={bilanJustSaved ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center justify-center gap-2 py-2.5 text-blue-700 text-sm font-bold"
          >
            <motion.div animate={bilanJustSaved ? { scale: [0, 1.3, 1] } : {}} transition={{ duration: 0.4 }}>
              <CheckCircle2 className="w-5 h-5" />
            </motion.div>
            Bilan enregistré !
          </motion.div>
        )}
      </div>

      {/* ─── Post-Bilan: Coach Insight ─── */}
      {bilanSaved && insight && (
        <motion.div
          initial={bilanJustSaved ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: bilanJustSaved ? 0.3 : 0, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <motion.span
              className="text-2xl flex-shrink-0"
              animate={bilanJustSaved ? { scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.6, delay: bilanJustSaved ? 0.5 : 0 }}
            >
              {insight.emoji}
            </motion.span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-emerald-800">{insight.title}</p>
              <p className="text-xs text-emerald-700/80 leading-relaxed mt-1">{insight.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Post-Bilan: Next Chapter CTA ─── */}
      {bilanSaved ? (
        <motion.div
          initial={bilanJustSaved ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: bilanJustSaved ? 0.7 : 0, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-200" />
            <p className="font-black text-base">Ton prochain chapitre</p>
          </div>
          {nextFocus.length > 0 ? (
            <>
              <p className="text-white/80 text-xs leading-relaxed">
                Prochain focus : <strong>{nextFocus.join(", ")}</strong>. Le programme sera taillé sur mesure.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nextFocus.map(f => (
                  <span key={f} className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full">
                    {GOAL_SUGGESTIONS.find(g => g.label === f)?.emoji} {f}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-white/80 text-xs leading-relaxed">
              Laisse le coach te surprendre avec un programme adapté aux progrès de {dog?.name || "ton chien"}.
            </p>
          )}
          <Button onClick={onNewProgram} className="w-full bg-white text-violet-700 hover:bg-violet-50 font-bold" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Lancer mon prochain programme
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <Button
          onClick={onNewProgram}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Nouveau programme 7 jours
        </Button>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────
export default function AITrainingProgram({ dog, logs = [] }) {
  const { credits, hasCredits, isPremium, consume } = useActionCredits();
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

  // Load saved program + past programs from Bookmarks
  useEffect(() => {
    if (!dog?.id) { setLoadingBookmarks(false); return; }
    let cancelled = false;
    async function loadSaved() {
      try {
        const bookmarks = await base44.entities.Bookmark.filter(
          { dog_id: dog.id, source: "training" }, "-created_at", 10
        );
        if (cancelled) return;
        let foundActive = false;
        const past = [];
        for (const bk of (bookmarks || [])) {
          try {
            const data = typeof bk.content === "string" ? JSON.parse(bk.content) : bk.content;
            if (!data?.start_date || !data?.days || !Array.isArray(data.days)) continue;
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
          } catch {}
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

  const weeklyWalkMinutes = logs.slice(0, 7).reduce((acc, l) => acc + (l.walk_minutes || 0), 0);

  const saveProgram = async () => {
    if (!program || !dog || saved) return;
    try {
      const user = await base44.auth.me();
      const startDate = new Date().toISOString().split("T")[0];
      const payload = { ...program, start_date: startDate, dog_name: dog.name, completed_days: [] };
      const created = await base44.entities.Bookmark.create({
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
      toast.error("Erreur lors de la sauvegarde");
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
      await base44.entities.Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) });
    } catch (e) {
      console.error(e);
      setCompletedDays(prev);
      setProgram({ ...program, completed_days: prev });
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
      await base44.entities.Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) });
      toast.success("Bilan enregistré !");
    } catch (e) {
      console.error(e);
    }
  };

  const startNewProgram = () => {
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
    if (!isPremium && !hasCredits) return;
    setGenerating(true);
    setProgram(null);
    setSaved(false);
    setBookmarkId(null);
    setCompletedDays([]);
    const allGoals = [...selectedGoals, goals.trim()].filter(Boolean).join(", ") || null;
    try {
      const resp = await base44.functions.invoke("generateTrainingProgram", {
        dogId: dog.id,
        dogName: dog.name,
        dogBreed: dog.breed,
        dogBirthDate: dog.birth_date,
        activityLevel: dog.activity_level,
        healthIssues: dog.health_issues,
        goals: allGoals,
        weeklyWalkMinutes,
        previousPrograms: pastPrograms.map(p => p.title).filter(Boolean),
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
            {dog?.breed && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{dog.breed}</span>}
            {dog?.activity_level && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activité {ACTIVITY_LABELS[dog.activity_level]}</span>}
            {dog?.birth_date && (() => {
              const m = differenceInMonths(new Date(), new Date(dog.birth_date));
              return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{m < 12 ? `${m} mois` : `${Math.floor(m/12)} ans`}</span>;
            })()}
          </div>

          {/* What you'll get preview */}
          <div className="bg-white/80 rounded-xl p-3 border border-purple-100/50 mb-4">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Chaque jour tu recevras</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { emoji: "📋", text: "Activité guidée pas à pas" },
                { emoji: "📖", text: "Fait surprenant du jour" },
                { emoji: "💡", text: "Conseil de pro non-évident" },
                { emoji: "👀", text: "Observation comportementale" },
                { emoji: "⭐", text: "Défi bonus amusant" },
                { emoji: "🐕", text: "Adapté à la race" },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-[10px] text-foreground/70">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goal suggestions — quick pick chips */}
          <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">Tes objectifs</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {GOAL_SUGGESTIONS.map(({ label, emoji }) => {
              const selected = selectedGoals.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => setSelectedGoals(prev => selected ? prev.filter(g => g !== label) : [...prev, label])}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all ${
                    selected ? "bg-purple-600 text-white" : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                  }`}
                >
                  {emoji} {label}
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Programmes terminés</p>
              <div className="space-y-1.5">
                {pastPrograms.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-emerald-50/50 rounded-lg px-2.5 py-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-[10px] text-foreground/70 truncate flex-1">{p.title}</span>
                    <span className="text-[9px] text-muted-foreground flex-shrink-0">{p.date}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground italic mt-1.5">Le prochain programme sera différent de ceux-ci</p>
            </div>
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
        <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Programme 7 jours</p>
        <h3 className="font-black text-lg leading-tight">{program.program_title}</h3>
        <p className="text-white/80 text-xs mt-1.5 leading-relaxed">{program.summary}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {program.difficulty && <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">{program.difficulty}</span>}
          <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">7 jours</span>
          {totalMinutes > 0 && <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">~{totalMinutes} min total</span>}
        </div>
        {saved && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/70 text-[10px] font-bold">Progression</span>
              <span className="text-white text-[10px] font-bold">{completedCount}/{totalDays} jours</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full" initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>
        )}
        {program.start_date && (
          <div className="mt-2 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-white/50" />
            <span className="text-white/60 text-[10px]">
              {formatDateFr(new Date(program.start_date + "T00:00:00"))} → {formatDateFr(addDaysToDate(program.start_date, totalDays - 1))}
            </span>
          </div>
        )}
      </div>

      {program.program_goal && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Objectif</p>
          <p className="text-xs text-foreground/80">{program.program_goal}</p>
        </div>
      )}

      {/* Days */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tes 7 jours</p>
        {days.map((day, i) => (
          <DayCard key={i} day={day} dayIdx={i} isOpen={openDay === i} onToggle={() => setOpenDay(openDay === i ? -1 : i)} startDate={program.start_date} isDone={completedDays.includes(`d${i}`)} onToggleComplete={saved ? () => toggleDay(i) : undefined} />
        ))}
      </div>

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

      {program.warning_signs?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Signes à surveiller</p>
          <div className="space-y-1">{program.warning_signs.map((sign, i) => <p key={i} className="text-xs text-amber-700">• {sign}</p>)}</div>
        </div>
      )}

      {program.progression_indicators?.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" /> Indicateurs de progression</p>
          <div className="space-y-1">{program.progression_indicators.map((ind, i) => <p key={i} className="text-xs text-muted-foreground">✓ {ind}</p>)}</div>
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
    </div>
  );
}
