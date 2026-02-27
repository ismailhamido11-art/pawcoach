
import { ArrowLeft, Timer, CheckCircle, HelpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const LEVEL_CONFIG = {
  debutant: { label: "Débutant", color: "text-safe bg-safe/10 border-safe/20" },
  intermediaire: { label: "Intermédiaire", color: "text-accent bg-accent/10 border-accent/20" },
};

import VideoCoaching from "./VideoCoaching";

export default function ExerciseDetail({ exercise, isCompleted, isPremiumLocked, dogName, onBack, onComplete, onHelp }) {
  const levelCfg = LEVEL_CONFIG[exercise.level];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero image */}
      <div className="relative bg-gradient-to-br from-primary/80 to-primary h-52 flex items-center justify-center flex-shrink-0">
        <motion.button
          onClick={onBack}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/20 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <span className="text-7xl select-none">{exercise.emoji}</span>
        {isCompleted && (
          <div className="absolute top-4 right-4 bg-safe rounded-full p-1.5">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
              <Lock className="w-7 h-7 text-amber-500" />
            </div>
            <p className="font-semibold text-amber-700">Exercice Premium</p>
            <p className="text-amber-600 text-sm">Passe à Premium pour débloquer toutes les fiches d'entraînement détaillées.</p>
            <Button onClick={() => window.location.href = '/Premium?from=training'} className="rounded-xl gradient-warm border-0 text-white font-semibold mt-1">
              Passer Premium 🌟
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Étapes :</p>
            {exercise.steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start bg-white rounded-2xl p-4 border border-border shadow-sm">
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow shadow-primary/30">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        )}

        {!isPremiumLocked && (
          <div className="bg-white rounded-2xl border border-border p-4 flex items-center justify-between mt-6 shadow-sm">
            <div>
              <p className="text-xs font-bold text-foreground">Accessoire recommandé</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Lien partenaire</p>
            </div>
            <Button onClick={() => window.open("https://amazon.fr", "_blank")} size="sm" variant="outline" className="rounded-xl h-8 text-xs font-semibold">
              Voir l'offre
            </Button>
          </div>
        )}

        {!isPremiumLocked && <VideoCoaching exerciseName={exercise.name} dogName={dogName} />}
      </div>

      {/* Bottom actions */}
      {!isPremiumLocked && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-4 space-y-2">
          <Button
            onClick={onComplete}
            className="w-full h-12 rounded-2xl bg-safe hover:bg-safe/90 text-white font-bold text-base gap-2 shadow-lg shadow-safe/30"
          >
            <CheckCircle className="w-5 h-5" />
            {isCompleted ? "Marquer comme non fait" : "J'ai réussi ! 🎉"}
          </Button>
          <Button
            onClick={onHelp}
            variant="outline"
            className="w-full h-12 rounded-2xl border-primary text-primary font-semibold text-base gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            J'ai besoin d'aide
          </Button>
        </div>
      )}
    </div>
  );
}
