import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { CheckCircle, Share2 } from "lucide-react";

export default function MilestoneScreen({ dogName, completedExercises, onContinue }) {
  const fired = useRef(false);
  const count = completedExercises.length;

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ["#3db87a", "#f59e0b", "#fff", "#6366f1"] });
  }, []);

  const handleShare = async () => {
    const text = `🐾 ${dogName} a maîtrisé ${count} tours avec PawCoach !\n\n${completedExercises.map((e, i) => `✅ ${i + 1}. ${e.name}`).join("\n")}\n\nEntraîné par PawCoach 🏆`;
    if (navigator.share) {
      await navigator.share({ title: `${dogName} – PawCoach`, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Résumé copié dans le presse-papiers !");
    }
  };

  const milestoneEmoji = count >= 10 ? "🏆" : count >= 5 ? "🥇" : "🎖️";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 px-6 text-center animate-fade-in overflow-y-auto py-10">
      <div className="text-7xl mb-4">{milestoneEmoji}</div>
      <h1 className="text-2xl font-extrabold text-primary mb-1">{dogName} a maîtrisé</h1>
      <p className="text-4xl font-extrabold text-foreground mb-6">{count} tours !</p>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-lg p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Exercices maîtrisés</p>
        <div className="space-y-2">
          {completedExercises.map((e, i) => (
            <div key={e.order_number} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm font-medium text-foreground">{e.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t border-border">Entraîné par PawCoach 🐾</p>
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        <Button variant="outline" onClick={handleShare} className="flex-1 h-12 rounded-2xl gap-2 border-primary text-primary font-semibold">
          <Share2 className="w-4 h-4" /> Partager
        </Button>
        <Button onClick={onContinue} className="flex-1 h-12 rounded-2xl gradient-primary border-0 text-white font-bold gap-2">
          Continuer 🚀
        </Button>
      </div>
    </div>
  );
}