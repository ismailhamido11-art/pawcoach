import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useBackClose from "@/hooks/useBackClose";
import { createPageUrl } from "@/utils";
import { MessageCircle, ScanLine, Dumbbell, Bell, X, ChevronRight, Star } from "lucide-react";
import Illustration from "../illustrations/Illustration";

const FEATURES = [
  { icon: MessageCircle, label: "Chat IA illimité avec PawCoach", color: "#3b82f6" },
  { icon: ScanLine, label: "Scans alimentaires illimités", color: "#2d9f82" },
  { icon: Dumbbell, label: "Tous les exercices de dressage", color: "#6366f1" },
  { icon: Bell, label: "Rappels santé & résumés mensuels", color: "#ef4444" },
];

const GOAL_NUDGE = {
  "Qu'il soit en bonne santé": {
    title: (name) => `Le carnet santé complet de ${name} est ouvert`,
    sub: "Ajoute sa dernière visite véto pendant ton essai gratuit",
  },
  "Bien l'éduquer": {
    title: (name) => `${name} progresse vite`,
    sub: "Les 7 exercices avancés sont débloqués pendant ton essai",
  },
  "Qu'il mange bien": {
    title: (name) => `Le NutriCoach de ${name} est sans limite`,
    sub: "Génère son plan repas personnalisé cette semaine",
  },
  "Son bonheur au quotidien": {
    title: (name) => `${name} a déjà son suivi en place`,
    sub: "Continue le check-in quotidien pendant les 7 jours de l'essai",
  },
  "Mieux le comprendre": {
    title: (name) => `Le coach IA connaît ${name} par son nom`,
    sub: "Pose-lui n'importe quelle question sur sa race et ses habitudes",
  },
};

export default function PremiumNudgeSheet({ visible, onClose, dogName, ownerGoal, context: _context = "default" }) {
  const navigate = useNavigate();
  useBackClose(visible, onClose);

  const handleUpgrade = () => {
    onClose();
    navigate(createPageUrl("Premium"));
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl pb-10"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Close */}
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="px-6 pt-4">
              {/* Social proof */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
                <span className="text-xs text-muted-foreground ml-1.5 font-medium">Recommandé par les pros</span>
              </div>

              {/* Illustration */}
              <div className="w-24 h-24 mx-auto mb-4">
                <Illustration name="goodDoggy" alt="PawCoach Premium" className="w-full h-full drop-shadow-lg" />
              </div>

              {/* Title — personnalise par objectif */}
              <h2 className="text-xl font-black text-center text-foreground mb-1">
                {ownerGoal && GOAL_NUDGE[ownerGoal]
                  ? GOAL_NUDGE[ownerGoal].title(dogName || "ton chien")
                  : dogName
                    ? `Le profil de ${dogName} est prêt !`
                    : "Débloquez tout PawCoach"}
              </h2>
              <p className="text-sm text-center text-muted-foreground mb-5">
                {ownerGoal && GOAL_NUDGE[ownerGoal]
                  ? GOAL_NUDGE[ownerGoal].sub
                  : <><strong>7 jours gratuits</strong> · Sans carte bancaire · Résiliation à tout moment</>}
              </p>

              {/* Feature list */}
              <div className="space-y-2.5 mb-6">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color + "15" }}>
                      <f.icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleUpgrade}
                className="w-full h-14 rounded-2xl gradient-warm text-white font-black text-base flex items-center justify-center gap-2 shadow-lg border-0"
              >
                Commencer mon essai gratuit
                <ChevronRight className="w-5 h-5" />
              </motion.button>

              <button onClick={onClose} className="w-full text-center text-sm text-muted-foreground mt-3 py-2">
                Plus tard
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}