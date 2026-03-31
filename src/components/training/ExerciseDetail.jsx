
import { ArrowLeft, Timer, CheckCircle, HelpCircle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import Illustration from "../illustrations/Illustration";

const LEVEL_CONFIG = {
  debutant: { label: "Débutant", color: "text-safe bg-safe/10 border-safe/20" },
  intermediaire: { label: "Intermédiaire", color: "text-accent bg-accent/10 border-accent/20" },
};

import VideoCoaching from "./VideoCoaching";

export default function ExerciseDetail({ exercise, isCompleted, isPremiumLocked, isPremium, dogName, dogId, onBack, onComplete, onHelp }) {
  const navigate = useNavigate();
  const levelCfg = LEVEL_CONFIG[exercise.level];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero image */}
      <div className="relative bg-gradient-to-br from-primary/80 to-primary h-52 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <motion.button
          aria-label="Retour"
          onClick={onBack}
          whileTap={{ scale: 0.96 }}
          transition={springUI}
          className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center z-20"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center opacity-15"
        >
          <Illustration name="dogWalking" alt="" className="w-64 h-64" />
        </motion.div>
        {exercise.icon ? <exercise.icon className="relative z-10 w-16 h-16 text-white drop-shadow-lg" /> : <CheckCircle className="relative z-10 w-16 h-16 text-white drop-shadow-lg" />}
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-safe rounded-full p-1.5 z-20">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto pb-32">
        {/* Title block */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${levelCfg.color}`}>
              {levelCfg.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" /> {exercise.duration}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{exercise.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">{exercise.description}</p>
        </div>

        {/* Steps */}
        {isPremiumLocked ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
            <motion.div
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-24 h-24"
            >
              <Illustration name="goodDoggy" alt="Premium" className="w-full h-full drop-shadow-md" />
            </motion.div>
            <p className="font-semibold text-emerald-700">Exercice Premium</p>
            <p className="text-emerald-600 text-sm">Passe à Premium pour débloquer toutes les fiches d'entraînement détaillées.</p>
            <Button onClick={() => navigate(createPageUrl("Premium") + "?from=training")} className="rounded-xl gradient-warm border-0 text-white font-semibold mt-1">
              Passer Premium · à partir de 7,99 €/mois
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Étapes :</p>
            {exercise.steps.map((step, i) => (
              <div key={`step-${i}`} className="flex gap-3 items-start bg-white rounded-2xl p-4 border border-border shadow-sm">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow shadow-primary/30">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        )}

        {!isPremiumLocked && <VideoCoaching exerciseName={exercise.name} dogName={dogName} dogId={dogId} />}
      </div>

      {/* Bottom actions */}
      {!isPremiumLocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 space-y-2" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
          <Button
            onClick={onComplete}
            className="w-full h-14 rounded-2xl bg-safe hover:bg-safe/90 text-white font-bold text-base gap-2 shadow-lg shadow-safe/30"
          >
            <CheckCircle className="w-5 h-5" />
            {isCompleted ? "Marquer comme non fait" : <><PartyPopper className="w-4 h-4 inline" /> J'ai réussi !</>}
          </Button>
          <Button
            onClick={onHelp}
            variant="outline"
            className="w-full h-14 rounded-2xl border-primary text-primary font-semibold text-base gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            J'ai besoin d'aide
          </Button>
          {!isPremium && <p className="text-[11px] text-muted-foreground text-center">Utilise 1 crédit IA (partagé avec Chat + Nutri)</p>}
        </div>
      )}
    </div>
  );
}
