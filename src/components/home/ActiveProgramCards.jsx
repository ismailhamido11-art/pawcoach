import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Clock, Utensils, ChevronRight, ChevronDown, ChevronUp, Target } from "lucide-react";

const SESSION_ICONS = {
  balade: "\uD83D\uDC3E", jeu: "\uD83C\uDFBE", "exercice mental": "\uD83E\uDDE0", repos: "\uD83D\uDCA4", "entra\u00EEnement": "\uD83C\uDFAF",
};

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function getElapsedDays(startDate) {
  const start = new Date(startDate + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function TrainingCard({ program }) {
  const elapsed = getElapsedDays(program.start_date);
  const totalDays = (program.duration_weeks || 4) * 7;

  if (elapsed < 0 || elapsed >= totalDays) return null;

  const currentWeekIndex = Math.floor(elapsed / 7);
  const currentDayIndex = elapsed % 7;
  const currentDay = currentWeekIndex + 1;
  const week = program.weeks?.[currentWeekIndex];
  if (!week) return null;

  const todayName = DAY_NAMES[new Date().getDay()];
  const session = week.daily_sessions?.find(s =>
    s.day?.toLowerCase() === todayName.toLowerCase()
  ) || week.daily_sessions?.[currentDayIndex] || week.daily_sessions?.[0];

  if (!session) return null;

  const progress = Math.round(((elapsed + 1) / totalDays) * 100);
  const icon = SESSION_ICONS[session.type] || "\uD83D\uDC36";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Link to={createPageUrl("Activite") + "?tab=dressage"}>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-400 opacity-[0.06]" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <Dumbbell className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Programme actif</p>
                <p className="text-[10px] text-muted-foreground">
                  Semaine {currentDay} / {program.duration_weeks || 4} — Jour {elapsed + 1}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-violet-400 transition-colors" />
          </div>

          <div className="flex items-start gap-3 bg-white/80 rounded-xl p-3 border border-violet-100/60">
            <span className="text-2xl leading-none mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-foreground">{session.day || todayName}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{session.type}</span>
                <span className="ml-auto text-[10px] font-bold text-violet-600 flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />{session.duration_min} min
                </span>
              </div>
              <p className="text-[12px] text-foreground/80 leading-relaxed">{session.activity}</p>
              {session.tips && (
                <p className="text-[10px] text-amber-600 mt-1 italic">{session.tips}</p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-bold text-violet-600">{progress}%</span>
          </div>

          {week.theme && (
            <div className="mt-2 flex items-center gap-1.5">
              <Target className="w-3 h-3 text-violet-400" />
              <p className="text-[10px] text-muted-foreground truncate">{week.theme}</p>
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
                <span className="text-[10px] text-muted-foreground ml-1.5 truncate">{summary.slice(0, 50)}{summary.length > 50 ? "..." : ""}</span>
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

export default function ActiveProgramCards({ trainingBookmarks = [], nutritionPlans = [] }) {
  const activeTraining = useMemo(() => {
    for (const bk of trainingBookmarks) {
      try {
        const data = JSON.parse(bk.content);
        if (data.start_date && data.weeks) {
          const elapsed = getElapsedDays(data.start_date);
          const totalDays = (data.duration_weeks || 4) * 7;
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

  if (!activeTraining && !activePlan) return null;

  return (
    <div className="mx-4 space-y-3">
      {activeTraining && <TrainingCard program={activeTraining} />}
      {activePlan && <NutritionPlanCard plan={activePlan} />}
    </div>
  );
}
