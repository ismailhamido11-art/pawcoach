import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Clock, Utensils, ChevronRight, ChevronDown, ChevronUp, Target, Brain, CheckCircle2 } from "lucide-react";

const SESSION_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠", repos: "💤", "entraînement": "🎯",
};

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
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

const ACTIVITY_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠",
  "repos actif": "💆", repos: "💤", "entraînement": "🎯",
};

function TrainingCard({ program }) {
  const elapsed = getElapsedDays(program.start_date);
  const totalDays = program.duration_days || 7;

  if (elapsed < 0 || elapsed >= totalDays) return null;

  const days = program.days || [];
  const today = days[Math.min(elapsed, days.length - 1)];
  if (!today) return null;

  const realDate = addDaysToDate(program.start_date, elapsed);
  const actType = today.activity?.type || "balade";
  const icon = ACTIVITY_ICONS[actType] || SESSION_ICONS[actType] || "🐶";

  // Completion tracking
  const completedDays = program.completed_days || [];
  const completedCount = completedDays.length;
  const progress = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
  const todayDone = completedDays.includes(`d${elapsed}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Link to={createPageUrl("Activite") + "?tab=programme"}>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-400 opacity-[0.06]" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Programme 7 jours</p>
                <p className="text-[10px] text-muted-foreground">
                  Jour {elapsed + 1}/{totalDays} — {formatDateFr(realDate)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-violet-400 transition-colors" />
          </div>

          {/* Today's activity */}
          <div className={`rounded-xl p-3 border ${
            todayDone ? "bg-emerald-50/80 border-emerald-100/60" : "bg-white/80 border-violet-100/60"
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold ${todayDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {today.activity?.name || today.title}
                  </span>
                  <span className="ml-auto text-[10px] font-bold text-violet-600 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />{today.activity?.duration_min || 20} min
                  </span>
                </div>
                {today.activity?.description && (
                  <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-2">{today.activity.description}</p>
                )}
                {todayDone && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Fait !
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Fun fact hook */}
          {today.fun_fact && !todayDone && (
            <div className="mt-2 bg-amber-50/60 rounded-lg px-3 py-2 border border-amber-100/50">
              <p className="text-[10px] text-amber-800/80 line-clamp-2 italic">
                📖 {today.fun_fact}
              </p>
            </div>
          )}

          {/* Coach tip when done */}
          {today.coach_tip && todayDone && (
            <div className="mt-2 bg-emerald-50/60 rounded-lg px-3 py-2 border border-emerald-100/50">
              <p className="text-[10px] text-emerald-800/80 line-clamp-2 italic">
                💡 {today.coach_tip}
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-bold text-violet-600">
              {completedCount}/{totalDays}
            </span>
          </div>

          {/* Today's theme */}
          {today.theme && (
            <div className="mt-2 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-violet-400" />
              <p className="text-[10px] text-muted-foreground truncate">{today.theme}</p>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// Try to parse plan_text as JSON (new structured format)
function parsePlanData(plan) {
  const text = plan.plan_text || "";
  try {
    const data = JSON.parse(text);
    if (data.days && Array.isArray(data.days)) {
      return data;
    }
  } catch {
    // Not JSON — old markdown plan
  }
  return null;
}

function NutritionPlanCard({ plan }) {
  const [open, setOpen] = useState(false);
  const todayName = DAY_NAMES[new Date().getDay()];

  const planData = useMemo(() => parsePlanData(plan), [plan.plan_text]);

  // For structured plans: calculate elapsed days and find today's meals
  const startDate = planData?.start_date;
  const elapsed = startDate ? getElapsedDays(startDate) : null;
  const isExpired = elapsed !== null && elapsed >= 7;
  const dayNumber = elapsed !== null ? Math.min(elapsed + 1, 7) : null;
  const progress = dayNumber ? Math.round((dayNumber / 7) * 100) : null;

  // Find today's day data from the structured plan
  const todayData = useMemo(() => {
    if (!planData?.days) return null;
    // Try matching by day name
    const match = planData.days.find(d => d.day?.toLowerCase() === todayName.toLowerCase());
    if (match) return match;
    // Fallback: use elapsed day index
    if (elapsed !== null && elapsed >= 0 && elapsed < 7) {
      return planData.days[elapsed] || null;
    }
    return planData.days[0] || null;
  }, [planData, todayName, elapsed]);

  // Compact summary for closed state
  const summary = todayData?.morning?.food
    ? `${todayData.morning.food} (${todayData.morning.quantity})`
    : planData?.quantity_summary || "Consulte ton plan du jour";

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.05 }}
      >
        <Link to={createPageUrl("Nutri") + "?tab=plan"}>
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Plan terminé</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5">Génère un nouveau plan repas</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.05 }}
    >
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-emerald-400 opacity-[0.06]" />

        {/* Clickable header */}
        <button className="w-full text-left p-4" onClick={() => setOpen(v => !v)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Plan repas actif</p>
                <p className="text-[10px] text-muted-foreground">
                  {dayNumber ? `Jour ${dayNumber} / 7` : "Plan en cours"}
                  {plan.dog_weight_at_generation ? ` — ${plan.dog_weight_at_generation} kg` : ""}
                </p>
              </div>
            </div>
            {open
              ? <ChevronUp className="w-4 h-4 text-emerald-400" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            }
          </div>

          {/* Compact preview when closed */}
          {!open && (
            <div className="flex items-center gap-2.5 bg-white/80 rounded-xl px-3 py-2.5 border border-emerald-100/60">
              <span className="text-lg leading-none">🍽️</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-foreground">{todayName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{" · "}{summary.slice(0, 45)}{summary.length > 45 ? "..." : ""}</span>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {progress !== null && !open && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-bold text-emerald-600">{progress}%</span>
            </div>
          )}
        </button>

        {/* Expanded: today's meals */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {todayData ? (
                  <div className="bg-white/80 rounded-xl p-3 border border-emerald-100/60 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg leading-none">🍽️</span>
                      <span className="text-xs font-bold text-foreground">{todayData.day || todayName}</span>
                      <span className="text-[10px] text-muted-foreground">Repas du jour</span>
                    </div>
                    {todayData.morning && (
                      <div className="flex items-start gap-2 ml-7">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Matin</span>
                        <div>
                          <p className="text-[12px] text-foreground/80">{todayData.morning.food}</p>
                          <p className="text-[10px] text-muted-foreground">{todayData.morning.quantity}</p>
                        </div>
                      </div>
                    )}
                    {todayData.evening && (
                      <div className="flex items-start gap-2 ml-7">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0">Soir</span>
                        <div>
                          <p className="text-[12px] text-foreground/80">{todayData.evening.food}</p>
                          <p className="text-[10px] text-muted-foreground">{todayData.evening.quantity}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/80 rounded-xl p-3 border border-emerald-100/60">
                    <p className="text-[12px] text-muted-foreground italic">
                      Pas de détail pour {todayName}. Consulte le plan complet.
                    </p>
                  </div>
                )}

                {/* Progress bar in expanded view */}
                {progress !== null && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">J{dayNumber}/7</span>
                  </div>
                )}

                <Link
                  to={createPageUrl("Nutri") + "?tab=mealplan"}
                  className="block text-center text-[11px] font-semibold text-emerald-600 py-1"
                >
                  Voir le plan complet
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function BehaviorProgramCard({ program }) {
  const [open, setOpen] = useState(false);
  const elapsed = getElapsedDays(program.start_date);

  if (elapsed < 0 || elapsed >= 7) return null;

  const dayIndex = Math.min(elapsed, 6);
  const day = program.days?.[dayIndex];
  if (!day) return null;

  const progress = Math.round(((elapsed + 1) / 7) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
    >
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-blue-400 opacity-[0.06]" />

        <button className="w-full text-left p-4" onClick={() => setOpen(v => !v)}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Programme comportement</p>
                <p className="text-[10px] text-muted-foreground">
                  Jour {elapsed + 1} / 7 — {program.problem_label}
                </p>
              </div>
            </div>
            {open
              ? <ChevronUp className="w-4 h-4 text-blue-400" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
            }
          </div>

          {!open && (
            <div className="bg-white/80 rounded-xl px-3 py-2.5 border border-blue-100/60 space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-foreground">{day.day_name || `Jour ${elapsed + 1}`}</span>
                <span className="text-[10px] text-muted-foreground truncate"> — {day.theme}</span>
              </div>
              {day.exercises?.[0] && (
                <p className="text-[10px] text-foreground/60 ml-6 truncate">
                  Aujourd'hui : {day.exercises[0].name} ({day.exercises[0].duration_min} min)
                  {day.exercises.length > 1 ? ` + ${day.exercises.length - 1} autre${day.exercises.length > 2 ? "s" : ""}` : ""}
                </p>
              )}
            </div>
          )}

          {!open && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] font-bold text-blue-600">{progress}%</span>
            </div>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {program.summary && (
                  <p className="text-[10px] text-foreground/60 italic px-1">{program.summary}</p>
                )}
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/60">
                  <p className="text-xs font-bold text-foreground mb-2">{day.day_name} — {day.theme}</p>
                  {day.exercises?.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 mt-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-foreground">
                          {ex.name} <span className="text-[10px] text-muted-foreground font-normal">({ex.duration_min} min)</span>
                        </p>
                        <p className="text-[10px] text-foreground/70 leading-relaxed">{ex.description}</p>
                        {ex.tips && <p className="text-[10px] text-blue-600 italic mt-0.5">{ex.tips}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {day.environment_tips && (
                  <div className="bg-blue-50/50 rounded-xl px-3 py-2 border border-blue-100/40">
                    <p className="text-[10px] text-blue-700">{day.environment_tips}</p>
                  </div>
                )}

                {(day.do?.length > 0 || day.dont?.length > 0) && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {day.do?.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg px-2.5 py-2 border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-700 uppercase mb-0.5">À faire</p>
                        {day.do.slice(0, 2).map((d, i) => <p key={i} className="text-[10px] text-emerald-800 truncate">✓ {d}</p>)}
                      </div>
                    )}
                    {day.dont?.length > 0 && (
                      <div className="bg-red-50 rounded-lg px-2.5 py-2 border border-red-100">
                        <p className="text-[9px] font-bold text-red-700 uppercase mb-0.5">À éviter</p>
                        {day.dont.slice(0, 2).map((d, i) => <p key={i} className="text-[10px] text-red-800 truncate">✕ {d}</p>)}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 px-1">
                  <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">J{elapsed + 1}/7</span>
                </div>

                {program.problem_id && (
                  <Link
                    to={createPageUrl("Training") + `?behavior=${program.problem_id}`}
                    className="block text-center text-[11px] font-semibold text-blue-600 py-1"
                  >
                    Voir le programme détaillé
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ActiveProgramCards({ trainingBookmarks = [], nutritionPlans = [], behaviorBookmarks = [] }) {
  const activeTraining = useMemo(() => {
    for (const bk of trainingBookmarks) {
      try {
        const data = JSON.parse(bk.content);
        if (data.start_date && data.days && Array.isArray(data.days)) {
          // New 7-day format
          const elapsed = getElapsedDays(data.start_date);
          const totalDays = data.duration_days || 7;
          if (elapsed >= 0 && elapsed < totalDays) return data;
        }
      } catch {
        // Not JSON or invalid
      }
    }
    return null;
  }, [trainingBookmarks]);

  const activePlan = useMemo(() => {
    if (!nutritionPlans.length) return null;
    const actives = nutritionPlans.filter(p => p.is_active === true);
    if (actives.length === 0) return null;
    if (actives.length === 1) return actives[0];
    return actives.sort((a, b) => (b.generated_at || "").localeCompare(a.generated_at || ""))[0];
  }, [nutritionPlans]);

  const activeBehavior = useMemo(() => {
    for (const bk of behaviorBookmarks) {
      try {
        const data = JSON.parse(bk.content);
        if (data.start_date && data.days) {
          const elapsed = getElapsedDays(data.start_date);
          if (elapsed >= 0 && elapsed < 7) return data;
        }
      } catch {}
    }
    return null;
  }, [behaviorBookmarks]);

  if (!activeTraining && !activePlan && !activeBehavior) return null;

  return (
    <div className="mx-4 space-y-3">
      {activeTraining && <TrainingCard program={activeTraining} />}
      {activeBehavior && <BehaviorProgramCard program={activeBehavior} />}
      {activePlan && <NutritionPlanCard plan={activePlan} />}
    </div>
  );
}
