import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Dumbbell, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Target, Clock, RotateCcw, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInMonths } from "date-fns";
import { toast } from "sonner";
import { checkTrainingBadges } from "@/components/achievements/badgeUtils";
import { useActionCredits } from "@/utils/ai-credits";
import { CreditBadge, UpgradePrompt } from "@/components/ui/AICreditsGate";

const ACTIVITY_LABELS = {
  faible: "Faible", modere: "Modéré", eleve: "Élevé", tres_eleve: "Très élevé"
};

const DIFFICULTY_COLORS = {
  débutant: "bg-emerald-100 text-emerald-700",
  intermédiaire: "bg-amber-100 text-amber-700",
  avancé: "bg-red-100 text-red-700",
};

const SESSION_ICONS = {
  balade: "🐾", jeu: "🎾", "exercice mental": "🧠", repos: "💤", entraînement: "🎯"
};

function WeekCard({ week, isOpen, onToggle }) {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-primary">S{week.week}</span>
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{week.theme}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{week.focus}</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {week.daily_sessions?.map((session, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="text-xl leading-none mt-0.5">{SESSION_ICONS[session.type] || "🐶"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{session.day}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{session.type}</span>
                      <span className="ml-auto text-[10px] font-bold text-primary flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{session.duration_min} min
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{session.activity}</p>
                    {session.tips && (
                      <p className="text-[10px] text-amber-600 mt-0.5 italic">💡 {session.tips}</p>
                    )}
                  </div>
                </div>
              ))}
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
  const [openWeek, setOpenWeek] = useState(0);
  const [goals, setGoals] = useState("");
  const [showGoalInput, setShowGoalInput] = useState(false);

  const weeklyWalkMinutes = logs.slice(0, 7).reduce((acc, l) => acc + (l.walk_minutes || 0), 0);

  async function generate() {
    if (!isPremium && !hasCredits) return;
    setGenerating(true);
    setProgram(null);
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
      toast.success("Programme généré !");
      if (!isPremium) await consume();
      // Award training badge
      if (dog?.id && dog?.owner) {
        checkTrainingBadges(dog.id, dog.owner).catch(() => {});
      }
    } catch (err) {
      toast.error("Erreur lors de la génération.");
    } finally {
      setGenerating(false);
    }
  }

  if (!program && !generating) {
    return (
      <div className="space-y-4 pb-8">
        {/* Intro card */}
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Programme sur mesure IA</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Génère un programme d'entraînement 4 semaines adapté à {dog?.name}, sa race ({dog?.breed || "…"}) et son niveau d'activité actuel.
              </p>
            </div>
          </div>

          {/* Dog summary chips */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {dog?.breed && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{dog.breed}</span>}
            {dog?.activity_level && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Activité {ACTIVITY_LABELS[dog.activity_level]}</span>}
            {dog?.birth_date && (() => {
              const m = differenceInMonths(new Date(), new Date(dog.birth_date));
              return <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{m < 12 ? `${m} mois` : `${Math.floor(m/12)} ans`}</span>;
            })()}
            {weeklyWalkMinutes > 0 && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{weeklyWalkMinutes} min/semaine</span>}
          </div>

          {/* Optional goals */}
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

  return (
    <div className="space-y-4 pb-8">
      {/* Program header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider mb-1">Programme IA</p>
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
      </div>

      {/* Weekly plan */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan hebdomadaire</p>
        {program.weeks?.map((week, i) => (
          <WeekCard
            key={i}
            week={week}
            isOpen={openWeek === i}
            onToggle={() => setOpenWeek(openWeek === i ? -1 : i)}
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

      {/* Regenerate */}
      <Button variant="outline" size="sm" className="w-full" onClick={() => setProgram(null)}>
        <RotateCcw className="w-4 h-4 mr-2" /> Générer un nouveau programme
      </Button>
    </div>
  );
}