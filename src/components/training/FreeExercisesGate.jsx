import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import confetti from "canvas-confetti";

const NEXT_EXERCISES = [
  { emoji: "📣", name: "Viens ici (Rappel)" },
  { emoji: "🤝", name: "Donne la patte" },
  { emoji: "🎾", name: "Lâche" },
];

export default function FreeExercisesGate({ dogName, onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: ["#f59e0b", "#3db87a", "#8b5cf6", "#ffffff"],
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl mb-4">🏆</span>
      <h1 className="text-2xl font-bold text-foreground">
        Bravo ! Tu maîtrises les bases !
      </h1>
      <p className="text-muted-foreground mt-2">
        Toi et {dogName || "ton chien"} formez une super équipe
      </p>

      {/* Teaser list */}
      <div className="w-full max-w-sm mt-8 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Prochains exercices
        </p>
        {NEXT_EXERCISES.map((ex, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-white/60 opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
              {ex.emoji}
            </div>
            <span className="text-sm font-medium text-foreground flex-1 text-left">{ex.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full max-w-sm mt-8 space-y-3">
        <Button
          onClick={() => navigate(createPageUrl("Premium") + "?from=training")}
          className="w-full h-14 rounded-2xl gradient-warm border-0 text-white font-bold text-base shadow-lg"
        >
          👑 Débloquer 7 exercices avancés
        </Button>
        <Button
          onClick={onDismiss}
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold"
        >
          Réviser mes acquis
        </Button>
      </div>
    </div>
  );
}