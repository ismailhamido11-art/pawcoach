import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Utensils, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_OPTIONS = [
  { value: 1, label: "😢", text: "Morose" },
  { value: 2, label: "😐", text: "Bof" },
  { value: 3, label: "😊", text: "Bien" },
  { value: 4, label: "🎉", text: "Super" },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "💤", text: "Faible" },
  { value: 2, label: "⚡", text: "Moyen" },
  { value: 3, label: "🔥", text: "Élevé" },
];

const APPETITE_OPTIONS = [
  { value: 1, label: "🚫", text: "Rien" },
  { value: 2, label: "😋", text: "Normal" },
  { value: 3, label: "🤤", text: "Gros mangeur" },
];

export default function DailyCheckinHub({ dog, todayCheckin, onSubmit, submitting, streak }) {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [appetite, setAppetite] = useState(null);
  const [notes, setNotes] = useState("");

  const isComplete = mood && energy && appetite;

  const handleSubmit = async () => {
    if (!isComplete || submitting) return;
    await onSubmit({ mood, energy, appetite, notes });
    setMood(null);
    setEnergy(null);
    setAppetite(null);
    setNotes("");
  };

  if (todayCheckin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-bold text-green-700">Check-in du jour</p>
            </div>
            <p className="text-xs text-green-600 mb-3">
              Humeur {todayCheckin.mood}/4 • Énergie {todayCheckin.energy}/3 • Appétit {todayCheckin.appetite}/3
            </p>
            {todayCheckin.ai_response && (
              <p className="text-sm text-foreground italic leading-relaxed">
                "{todayCheckin.ai_response}"
              </p>
            )}
          </div>
          {streak && (
            <div className="text-right">
              <p className="text-3xl font-black text-accent">🔥</p>
              <p className="text-xs font-bold text-accent">{streak.current_streak} jours</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20 p-6 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-1">Check-in quotidien de {dog?.name}</h2>
        <p className="text-xs text-muted-foreground">Comment va {dog?.name} aujourd'hui ?</p>
      </div>

      {/* Mood */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-destructive" />
          <label className="text-sm font-semibold text-foreground">Humeur</label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {MOOD_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMood(opt.value)}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all duration-200",
                mood === opt.value
                  ? "border-destructive bg-destructive/10 shadow-md"
                  : "border-border/50 bg-white/50 hover:border-border"
              )}
            >
              <p className="text-2xl">{opt.label}</p>
              <p className="text-[10px] font-semibold mt-1 text-foreground">{opt.text}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Energy */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-accent" />
          <label className="text-sm font-semibold text-foreground">Énergie</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEnergy(opt.value)}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all duration-200",
                energy === opt.value
                  ? "border-accent bg-accent/10 shadow-md"
                  : "border-border/50 bg-white/50 hover:border-border"
              )}
            >
              <p className="text-2xl">{opt.label}</p>
              <p className="text-[10px] font-semibold mt-1 text-foreground">{opt.text}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Appetite */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-4 h-4 text-primary" />
          <label className="text-sm font-semibold text-foreground">Appétit</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {APPETITE_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAppetite(opt.value)}
              className={cn(
                "p-3 rounded-2xl border-2 transition-all duration-200",
                appetite === opt.value
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border/50 bg-white/50 hover:border-border"
              )}
            >
              <p className="text-2xl">{opt.label}</p>
              <p className="text-[10px] font-semibold mt-1 text-foreground">{opt.text}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Notes optionnelles */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-muted-foreground mb-2 block">
          Notes optionnelles (comportement, événements...)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Ex: grattage excessif, boiterie, comportement étrange..."
          className="w-full p-3 rounded-2xl border border-border/50 bg-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          rows={2}
        />
      </div>

      {/* Submit button */}
      <motion.button
        whileHover={{ scale: isComplete ? 1.02 : 1 }}
        whileTap={{ scale: isComplete ? 0.98 : 1 }}
        onClick={handleSubmit}
        disabled={!isComplete || submitting}
        className={cn(
          "w-full py-3 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2",
          isComplete
            ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl cursor-pointer"
            : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
        )}
      >
        <Send className="w-4 h-4" />
        {submitting
          ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Envoi...</>
          : "Valider le check-in"
        }
      </motion.button>

      {/* Progress indicator */}
      {!isComplete && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          {[mood, energy, appetite].filter(Boolean).length}/3 critères sélectionnés
        </p>
      )}
    </motion.div>
  );
}