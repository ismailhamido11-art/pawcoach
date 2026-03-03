import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function CelebrationScreen({ dogName, exerciseName, onContinue }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ["#3db87a", "#10b981", "#6366f1", "#ec4899"],
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
      onClick={onContinue}
    >
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-t-3xl px-6 pt-6 pb-10 text-center shadow-2xl"
      >
        {/* Close pill */}
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />

        <h2 className="text-2xl font-black text-foreground mb-1">Bravo !</h2>
        <p className="text-muted-foreground text-sm mb-6">
          <span className="font-semibold text-foreground">{dogName}</span> a maîtrisé{" "}
          <span className="font-semibold text-primary">« {exerciseName} »</span>
        </p>

        {/* Mascot / celebration visual */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [-4, 4, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl my-4 select-none"
        >
          🐾
        </motion.div>

        {/* Points badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-sm rounded-full px-4 py-2 mb-6">
          <Zap className="w-4 h-4" />
          +50 points gagnés !
        </div>

        <button
          onClick={onContinue}
          className="w-full h-13 py-3.5 rounded-2xl bg-muted text-muted-foreground font-semibold text-base"
        >
          Continuer
        </button>
      </motion.div>
    </motion.div>
  );
}