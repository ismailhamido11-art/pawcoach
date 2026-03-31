import { ArrowLeft, CheckCircle, Lock, Timer, PawPrint, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const listContainer = { show: { transition: { staggerChildren: 0.07 } } };
const listItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: springGentle },
};

const LEVEL_CONFIG = {
  debutant:      { label: "Débutant",      color: "text-safe bg-safe/10 border-safe/20" },
  intermediaire: { label: "Intermédiaire", color: "text-accent bg-accent/10 border-accent/20" },
};

export default function JourneyView({ journey, exercises, progresses, isPremium, onBack, onSelectExercise }) {
  const navigate = useNavigate();
  const isCompleted = (order) => progresses.some(p => p.exercise_id === String(order) && p.completed);
  const completedCount = exercises.filter(e => isCompleted(e.order_number)).length;
  const total = exercises.length;
  const locked = journey.isPremium && !isPremium;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary safe-pt-14 pb-4 px-5 relative overflow-hidden">
        <button
          aria-label="Retour"
          onClick={onBack}
          className="absolute top-14 left-4 w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-3">
            {journey.icon ? <journey.icon className="w-8 h-8 text-white" /> : <PawPrint className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-white font-bold text-xl">{journey.name}</h1>
          <p className="text-white/80 text-sm mt-1">{journey.description}</p>

          {locked ? (
            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-2 inline-flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-300" />
              <span className="text-white/90 text-sm font-semibold">Parcours Premium</span>
            </div>
          ) : (
            <div className="mt-4 bg-white/15 rounded-2xl p-3 mx-4">
              <div className="flex justify-between text-white/80 text-xs mb-2">
                <span>{completedCount} / {total} exercices</span>
                <span>{Math.round((completedCount / total) * 100)}%</span>
              </div>
              <div className="bg-white/25 rounded-full h-2">
                <motion.div
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / total) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklist */}
      <motion.div className="px-4 pt-5 space-y-2.5" variants={listContainer} initial="hidden" animate="show">
        {exercises.map((exercise, idx) => {
          const done = isCompleted(exercise.order_number);
          const exerciseLocked = locked || (exercise.is_premium && !isPremium);
          // When the whole journey is locked, only show first 2 exercises clearly
          const hiddenByJourneyLock = locked && idx >= 2;
          const _lvl = LEVEL_CONFIG[exercise.level];

          return (
            <motion.button
              key={exercise.order_number}
              variants={listItem}
              whileTap={exerciseLocked ? {} : { scale: 0.97 }}
              onClick={() => exerciseLocked ? null : onSelectExercise(exercise.order_number)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                done
                  ? "bg-white border-safe/30 shadow-sm"
                  : exerciseLocked
                  ? "bg-muted/30 border-border opacity-50"
                  : "bg-white border-border shadow-sm"
              } ${hiddenByJourneyLock ? "blur-sm pointer-events-none select-none" : ""}`}
            >
              {/* Number/emoji badge */}
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-safe/10" : exerciseLocked ? "bg-muted" : "bg-secondary"
                }`}
              >
                {exercise.icon ? <exercise.icon className="w-5 h-5" style={{ color: exercise.iconColor || "#1A4D3E" }} /> : <PawPrint className="w-5 h-5 text-emerald-600" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${done ? "text-safe line-through decoration-safe/50" : exerciseLocked ? "text-muted-foreground" : "text-foreground"}`}>
                  {exercise.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" /> {exercise.duration}
                  </span>
                </div>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {done ? (
                  <div className="w-8 h-8 rounded-xl bg-safe flex items-center justify-center">
                    <CheckCircle className="w-4.5 h-4.5 text-white" />
                  </div>
                ) : exerciseLocked ? (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl border-2 border-border flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}

        {/* CTA to unlock when journey is locked */}
        {locked && (
          <motion.div
            variants={listItem}
            className="mt-2 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 text-center space-y-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Débloquer ce parcours</p>
              <p className="text-xs text-muted-foreground mt-1">Accède à tous les exercices avec Premium</p>
            </div>
            <button
              onClick={() => navigate(createPageUrl("Premium") + "?from=training")}
              className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm"
            >
              Passer Premium
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}