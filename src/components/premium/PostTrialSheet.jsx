import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useBackClose from "@/hooks/useBackClose";
import { createPageUrl } from "@/utils";
import { X, ChevronRight, MessageCircle, ScanLine, Dumbbell, Bell, Lock } from "lucide-react";
import Illustration from "../illustrations/Illustration";

const LOST_FEATURES = [
  { icon: MessageCircle, label: "Chat IA illimite (retour a 10/jour)", color: "#3b82f6" },
  { icon: ScanLine, label: "Scans illimites (retour a 3/semaine)", color: "#2d9f82" },
  { icon: Dumbbell, label: "Exercices avances de dressage", color: "#6366f1" },
  { icon: Bell, label: "Rappels sante automatiques", color: "#ef4444" },
];

export default function PostTrialSheet({ visible, onClose, dogName }) {
  const navigate = useNavigate();
  useBackClose(visible, onClose);

  const name = dogName || "ton chien";

  const handleUpgrade = () => {
    onClose();
    navigate(createPageUrl("Premium"));
  };

  const handleContinueFree = () => {
    onClose();
    try { localStorage.setItem("pawcoach_post_trial_dismissed", "1"); } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleContinueFree}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-10"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            <button onClick={handleContinueFree} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-6 pt-4">
              <div className="w-20 h-20 mx-auto mb-3">
                <Illustration name="qualityTime" alt="Essai termine" className="w-full h-full drop-shadow-lg" />
              </div>

              <h2 className="text-xl font-black text-center text-foreground mb-1">
                L'essai de {name} est termine
              </h2>
              <p className="text-sm text-center text-muted-foreground mb-5">
                Tu peux continuer gratuitement, mais voici ce que tu perds :
              </p>

              <div className="space-y-2.5 mb-6">
                {LOST_FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-muted/50">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{f.label}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpgrade}
                className="w-full h-14 rounded-2xl gradient-warm text-white font-black text-base flex items-center justify-center gap-2 shadow-lg border-0"
              >
                S'abonner — a partir de 5 EUR/mois
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              <button onClick={handleContinueFree} className="w-full text-center text-sm text-muted-foreground mt-3 py-2 font-medium">
                Continuer gratuitement
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
