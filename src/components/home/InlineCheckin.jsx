import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS = [
  { value: 1, emoji: "\u{1F622}", label: "Triste" },
  { value: 2, emoji: "\u{1F610}", label: "Bof" },
  { value: 3, emoji: "\u{1F60A}", label: "Bien" },
  { value: 4, emoji: "\u{1F929}", label: "Super" },
];
const ENERGIES = [
  { value: 1, emoji: "\u{1F4A4}", label: "Faible" },
  { value: 2, emoji: "\u26A1", label: "Moyen" },
  { value: 3, emoji: "\u{1F525}", label: "Eleve" },
];
const APPETITES = [
  { value: 1, emoji: "\u{1F6AB}", label: "Rien" },
  { value: 2, emoji: "\u{1F60B}", label: "Normal" },
  { value: 3, emoji: "\u{1F924}", label: "Glouton" },
];

const SYMPTOMS = [
  { id: "vomiting", label: "Vomissements" },
  { id: "diarrhea", label: "Diarrhee" },
  { id: "scratching", label: "Grattage" },
  { id: "limping", label: "Boiterie" },
  { id: "coughing", label: "Toux" },
  { id: "lethargy", label: "Apathie" },
  { id: "unusual", label: "Comportement inhabituel" },
];

export default function InlineCheckin({ dogName, onSubmit, submitting }) {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [appetite, setAppetite] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [behaviorNotes, setBehaviorNotes] = useState("");

  const handleMoodTap = (val) => {
    setMood(val);
    setExpanded(true);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const toggleSymptom = (id) => {
    setSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const canSubmit = mood && energy && appetite;
  const hasConcern = mood <= 2 || energy === 1 || appetite === 1;

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit({ mood, energy, appetite, notes: "", symptoms, behaviorNotes });
  };

  return (
    <div className="space-y-3">
      {/* Mood row */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Comment va {dogName} ?</p>
        <div className="flex gap-2">
          {MOODS.map(m => (
            <button
              key={m.value}
              onClick={() => handleMoodTap(m.value)}
              className={cn(
                "flex-1 py-2.5 rounded-xl border-2 transition-all text-center",
                mood === m.value
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/40 bg-white/60"
              )}
            >
              <span className="text-lg">{m.emoji}</span>
              <p className="text-[11px] font-semibold text-foreground mt-0.5">{m.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded: energy + appetite + submit */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-3"
          >
            {/* Energy */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Energie</p>
              <div className="flex gap-2">
                {ENERGIES.map(e => (
                  <button
                    key={e.value}
                    onClick={() => { setEnergy(e.value); if (navigator.vibrate) navigator.vibrate(10); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl border-2 transition-all text-center",
                      energy === e.value
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-border/40 bg-white/60"
                    )}
                  >
                    <span className="text-base">{e.emoji}</span>
                    <p className="text-[11px] font-semibold mt-0.5">{e.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Appetite */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Appetit</p>
              <div className="flex gap-2">
                {APPETITES.map(a => (
                  <button
                    key={a.value}
                    onClick={() => { setAppetite(a.value); if (navigator.vibrate) navigator.vibrate(10); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl border-2 transition-all text-center",
                      appetite === a.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/40 bg-white/60"
                    )}
                  >
                    <span className="text-base">{a.emoji}</span>
                    <p className="text-[11px] font-semibold mt-0.5">{a.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms — conditional, only when concern detected */}
            <AnimatePresence>
              {canSubmit && hasConcern && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Symptomes observes ? <span className="font-normal text-[10px]">(optionnel)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SYMPTOMS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSymptom(s.id)}
                        className={cn(
                          "px-2.5 py-2.5 rounded-lg border text-[10px] font-medium transition-all",
                          symptoms.includes(s.id)
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-border/40 bg-white/60 text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {symptoms.length > 0 && (
                    <input
                      value={behaviorNotes}
                      onChange={e => setBehaviorNotes(e.target.value)}
                      placeholder="Details optionnels..."
                      className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-border/40 bg-white/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                "w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                canSubmit
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-md"
                  : "bg-muted text-muted-foreground opacity-50"
              )}
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <><Send className="w-3.5 h-3.5" /> Valider</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
