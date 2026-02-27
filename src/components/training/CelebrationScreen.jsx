import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CelebrationScreen({ dogName, exerciseName, onContinue }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#3db87a", "#f59e0b", "#fff"] });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#3db87a", "#f59e0b", "#fff"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0, y: -60, rotate: -30 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="text-8xl mb-6"
      >
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="block"
        >🏆</motion.span>
      </motion.div>
      <h1 className="text-3xl font-extrabold text-green-700 mb-2">Champion !</h1>
      <p className="text-xl font-bold text-foreground mb-1">{dogName} a maîtrisé</p>
      <p className="text-2xl font-extrabold text-primary mb-8">« {exerciseName} »</p>
      <div className="flex gap-2 text-3xl mb-10">{"⭐".repeat(3)}</div>
      <motion.div whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
        <Button
          onClick={onContinue}
          className="h-14 px-8 rounded-2xl gradient-primary border-0 text-white font-bold text-base gap-2 shadow-lg shadow-primary/30"
        >
          Continuer <ChevronRight className="w-5 h-5" />
        </Button>
      </motion.div>
    </motion.div>
  );
}