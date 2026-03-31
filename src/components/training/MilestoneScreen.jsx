import { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CONFETTI_COLORS } from "@/lib/colorPalette";
import { Button } from "@/components/ui/button";
import { CheckCircle, Share2, PawPrint, ArrowRight, Trophy, Medal, Award } from "lucide-react";
import { motion } from "framer-motion";
import Illustration from "../illustrations/Illustration";

import { staggerContainer as listContainer, springGentle, springUI, springSoft } from "@/lib/animations";
const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: springGentle },
};

export default function MilestoneScreen({ dogName, completedExercises, onContinue }) {
  const fired = useRef(false);
  const count = completedExercises.length;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: CONFETTI_COLORS });
  }, []);

  const handleShare = async () => {
    const text = `[paw] ${dogName} a maîtrisé ${count} tours avec PawCoach !\n\n${completedExercises.map((e, i) => `[v] ${i + 1}. ${e.name}`).join("\n")}\n\nEntraîné par PawCoach [trophy]`;
    if (navigator.share) {
      await navigator.share({ title: `${dogName} – PawCoach`, text });
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Résumé copié dans le presse-papiers !");
    }
  };

  const _MilestoneIcon = count >= 10 ? Trophy : count >= 5 ? Medal : Award;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-6 text-center overflow-y-auto py-10"
    >
      <motion.div
        initial={{ scale: 0, y: -60, rotate: -30 }}
        animate={{ scale: 1, y: 0, rotate: 0 }}
        transition={springSoft}
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 mb-4"
        >
          <Illustration name="goodDoggy" alt="Milestone !" className="w-full h-full drop-shadow-lg" />
        </motion.div>
      </motion.div>
      <h1 className="text-2xl font-extrabold text-primary mb-1">{dogName} a maîtrisé</h1>
      <p className="text-4xl font-extrabold text-foreground mb-6">{count} tours !</p>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-lg p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Exercices maîtrisés</p>
        <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
          {completedExercises.map((e, _i) => (
            <motion.div key={e.order_number} variants={listItem} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-foreground">{e.name}</span>
            </motion.div>
          ))}
        </motion.div>
        <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t border-border flex items-center justify-center gap-1">Entraîné par PawCoach <PawPrint className="w-3 h-3 text-emerald-600 inline" /></p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <motion.div whileTap={{ scale: 0.96 }} transition={springUI} className="flex-1">
          <Button variant="outline" onClick={handleShare} className="w-full h-14 rounded-2xl gap-2 border-primary text-primary font-semibold">
            <Share2 className="w-4 h-4" /> Partager
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.96 }} transition={springUI} className="flex-1">
          <Button onClick={onContinue} className="w-full h-14 rounded-2xl gradient-primary border-0 text-white font-bold gap-2">
            Continuer <ArrowRight className="w-4 h-4 inline" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}