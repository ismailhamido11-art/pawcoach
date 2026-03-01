import { ArrowLeft, CheckCircle, Lock, Timer, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import IconBadge from "@/components/ui/IconBadge";

const listContainer = { show: { transition: { staggerChildren: 0.06 } } };
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

const LEVEL_CONFIG = {
  debutant:      { label: "Débutant",      color: "text-safe bg-safe/10 border-safe/20" },
  intermediaire: { label: "Intermédiaire", color: "text-accent bg-accent/10 border-accent/20" },
};

export default function JourneyView({ journey, exercises, progresses, isPremium, dogName, onBack, onSelectExercise }) {
  const isCompleted = (order) => progresses.some(p => p.exercise_id === String(order) && p.completed);
  const completedCount = exercises.filter(e => isCompleted(e.order_number)).length;
  const total = exercises.length;
  const locked = journey.isPremium && !isPremium;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0f4c3a] via-[#1a6b52] to-[#2d9f82] pt-10 pb-6 px-5 relative overflow-hidden">
        <button
          onClick={onBack}
          className="absolute top-10 left-4 w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3">
            {journey.emoji}
          </div>
          <h1 className="text-white font-black text-xl">{journey.name}</h1>
          <p className="text-white/70 text-sm mt-1">{journey.description}</p>

          {locked ? (
            <div className="mt-3 bg-white/15 rounded-2xl px-4 py-2 inline-flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-300" />
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

      {/* Exercise list */}
      <motion.div className="px-4 pt-4 space-y-3" variants={listContainer} initial="hidden" animate="show">
        {exercises.map((exercise, idx) => {
          const done = isCompleted(exercise.order_number);
          const exerciseLocked = locked || (exercise.is_premium && !isPremium);
          const lvl = LEVEL_CONFIG[exercise.level];

          return (
            <motion.button
              key={exercise.order_number}
              variants={listItem}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectExercise(exercise.order_number)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-colors shadow-sm ${
                done ? "bg-safe/5 border-safe/20" : exerciseLocked ? "bg-muted/30 border-border opacity-60" : "bg-white border-border"
              }`}
            >
              <div className="relative">
                <IconBadge icon={exercise.icon} color={done ? "#10b981" : exerciseLocked ? "#9ca3af" : exercise.iconColor} size="md" />
                <div className="absolute -top-1 -left-1 w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-black text-muted-foreground">{idx + 1}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm leading-tight ${done ? "text-safe" : exerciseLocked ? "text-muted-foreground" : "text-foreground"}`}>
                  {exercise.name}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${lvl.color}`}>
                    {lvl.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Timer className="w-3 h-3" /> {exercise.duration}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {done ? (
                  <div className="w-7 h-7 rounded-full bg-safe flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                ) : exerciseLocked ? (
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-accent" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}