import { useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Dumbbell, Clock, Utensils, ChevronRight, Calendar, Target, Flame } from "lucide-react";

const SESSION_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠", repos: "💤", "entraînement": "🎯",
};

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

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

  // Match session by day name or by index
  const todayName = DAY_NAMES[new Date().getDay()];
  const session = week.daily_sessions?.find(s =>
    s.day?.toLowerCase() === todayName.toLowerCase()
  ) || week.daily_sessions?.[currentDayIndex] || week.daily_sessions?.[0];

  if (!session) return null;

  const progress = Math.round(((elapsed + 1) / totalDays) * 100);
  const icon = SESSION_ICONS[session.type] || "🐶";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <Link to={createPageUrl("Activite") + "?tab=dressage"}>
        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-4 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-violet-400 opacity-[0.06]" />

          {/* Header */}
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

          {/* Today's session */}
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
                <p className="text-[10px] text-amber-600 mt-1 italic">💡 {session.tips}</p>
              )}
            </div>
          </div>

          {/* Progress bar */}
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

          {/* Week theme */}
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

function NutritionPlanCard({ plan }) {
  const todayName = DAY_NAMES[new Date().getDay()];
  const dateField = plan.generated_at || plan.created_date;
  const daysSince = dateField
    ? Math.floor((Date.now() - new Date(dateField).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Try to extract today's meal from plan text
  const planText = plan.plan_text || "";
  const todayMeal = useMemo(() => {
    const lines = planText.split("\n");
    const dayLower = todayName.toLowerCase();
    const dayIndex = lines.findIndex(l => l.toLowerCase().includes(dayLower));
    if (dayIndex === -1) return null;

    const mealLines = [];
    for (let i = dayIndex; i < Math.min(dayIndex + 6, lines.length); i++) {
      const clean = lines[i].replace(/[*_`#-]/g, "").trim();
      if (!clean) continue;
      // Stop if we hit another day name (not today's)
      if (i > dayIndex && DAY_NAMES.some(d => d !== todayName && lines[i].toLowerCase().includes(d.toLowerCase()))) break;
      mealLines.push(clean);
    }
    return mealLines.length > 0 ? mealLines.slice(0, 4) : null;
  }, [planText, todayName]);

  // Fallback preview
  const fallbackLines = planText.split("\n").filter(l => l.trim() && !l.startsWith("#"));
  const preview = fallbackLines[0]?.replace(/[*_`#]/g, "").trim().slice(0, 100) || "Plan nutrition personnalise";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.05 }}
    >
      <Link to={createPageUrl("Nutri") + "?tab=saved"}>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-emerald-400 opacity-[0.06]" />

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Plan repas actif</p>
                <p className="text-[10px] text-muted-foreground">
                  {daysSince === 0 ? "Cree aujourd'hui" : `Jour ${daysSince + 1}`}
                  {plan.dog_weight_at_generation ? ` — ${plan.dog_weight_at_generation} kg` : ""}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-emerald-400 transition-colors" />
          </div>

          {/* Today's meal */}
          <div className="flex items-start gap-3 bg-white/80 rounded-xl p-3 border border-emerald-100/60">
            <span className="text-2xl leading-none mt-0.5">🍽️</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-foreground">{todayName}</span>
                <span className="text-[10px] text-muted-foreground">Repas du jour</span>
              </div>
              {todayMeal ? (
                todayMeal.map((line, i) => (
                  <p key={i} className="text-[12px] text-foreground/80 leading-relaxed truncate">{line}</p>
                ))
              ) : (
                <p className="text-[12px] text-foreground/80 leading-relaxed line-clamp-2">{preview}</p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function ActiveProgramCards({ trainingBookmarks = [], nutritionPlans = [] }) {
  // Parse the most recent active training program
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
        // Not JSON or invalid — skip
      }
    }
    return null;
  }, [trainingBookmarks]);

  // Find the single active nutrition plan (most recent if multiple marked active)
  const activePlan = useMemo(() => {
    if (!nutritionPlans.length) return null;
    const actives = nutritionPlans.filter(p => p.is_active === true);
    if (actives.length === 0) return null;
    if (actives.length === 1) return actives[0];
    // Multiple active — pick most recent
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
