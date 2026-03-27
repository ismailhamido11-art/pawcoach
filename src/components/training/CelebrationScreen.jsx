import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Zap, Repeat2 } from "lucide-react";
import Illustration from "../illustrations/Illustration";

const PRAISE_MESSAGES = [
  (dog) => `${dog} a tout compris. Continue comme ça !`,
  (dog) => `Beau travail — ${dog} progresse vraiment.`,
  (dog) => `${dog} a bien mérité sa récompense.`,
  (dog) => `Régularité + patience = succès. ${dog} le prouve.`,
  (dog) => `Un exercice de plus dans la boîte pour ${dog}.`,
];

function pickMessage(dogName, exerciseName) {
  // Use a stable hash from the exercise name so the message doesn't flicker on re-render
  const idx = exerciseName
    ? exerciseName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % PRAISE_MESSAGES.length
    : 0;
  return PRAISE_MESSAGES[idx](dogName || "ton chien");
}

export default function CelebrationScreen({ dogName, exerciseName, exerciseNumber, totalExercises, onContinue }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ["#1A4D3E", "#2D9F82", "#10b981", "#34d399"],
    });
  }, []);

  const praise = pickMessage(dogName, exerciseName);
  const showProgress = exerciseNumber != null && totalExercises != null && totalExercises > 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onContinue}
      tabIndex={0}
      role="button"
      aria-label="Continuer"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onContinue(); } }}
    >
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-t-3xl px-6 pt-6 text-center shadow-2xl"
        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Close pill */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />

        {/* Progress indicator */}
        {showProgress && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalExercises }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < exerciseNumber
                    ? "bg-emerald-400 w-5"
                    : i === exerciseNumber - 1
                    ? "bg-emerald-500 w-7"
                    : "bg-muted w-3"
                }`}
              />
            ))}
          </div>
        )}

        <h2 className="text-2xl font-black text-foreground mb-1">Exercice réussi !</h2>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-semibold text-foreground">{dogName}</span> a maîtrisé{" "}
          <span className="font-semibold text-primary">« {exerciseName} »</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6 italic">{praise}</p>

        {/* Celebration illustration */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-28 h-28 my-4 mx-auto"
        >
          <Illustration name="dogHighFive" alt="Exercice réussi !" className="w-full h-full drop-shadow-lg" />
        </motion.div>

        {/* Points badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-sm rounded-full px-4 py-2 mb-6">
          <Zap className="w-4 h-4" />
          +50 points gagnés !
        </div>

        {showProgress && exerciseNumber < totalExercises && (
          <p className="text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1">
            <Repeat2 className="w-3.5 h-3.5" />
            {totalExercises - exerciseNumber} exercice{totalExercises - exerciseNumber > 1 ? "s" : ""} restant{totalExercises - exerciseNumber > 1 ? "s" : ""}
          </p>
        )}

        <button
          onClick={onContinue}
          className="w-full h-14 py-3.5 rounded-2xl bg-muted text-muted-foreground font-semibold text-base"
        >
          Continuer
        </button>
      </motion.div>
    </motion.div>
  );
}
