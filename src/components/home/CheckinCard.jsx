import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader2, ChevronLeft, Sparkles } from "lucide-react";
import {
  DogSad, DogMeh, DogHappy, DogLove,
  DogSleep, DogTrot, DogRun,
  BowlEmpty, BowlHalf, BowlFull,
} from "./DogIllustrations";

export const MOOD_OPTIONS = [
  { value: 1, label: "Triste",  color: "#f43f5e" },
  { value: 2, label: "Bof",     color: "#d97706" },
  { value: 3, label: "Bien",    color: "#10b981" },
  { value: 4, label: "Super !", color: "#8b5cf6" },
];
export const ENERGY_OPTIONS = [
  { value: 1, label: "Épuisé", color: "#f43f5e" },
  { value: 2, label: "Moyen",  color: "#d97706" },
  { value: 3, label: "À fond", color: "#10b981" },
];
export const APPETITE_OPTIONS = [
  { value: 1, label: "Rien",    color: "#f43f5e" },
  { value: 2, label: "Normal",  color: "#d97706" },
  { value: 3, label: "Glouton", color: "#10b981" },
];

const STEPS = [
  {
    key: "mood",
    question: (name) => `Comment est l'humeur de ${name} ?`,
    options: MOOD_OPTIONS,
    illustrations: [DogSad, DogMeh, DogHappy, DogLove],
  },
  {
    key: "energy",
    question: () => `Quel était son niveau d'énergie ?`,
    options: ENERGY_OPTIONS,
    illustrations: [DogSleep, DogTrot, DogRun],
  },
  {
    key: "appetite",
    question: () => `Et son appétit aujourd'hui ?`,
    options: APPETITE_OPTIONS,
    illustrations: [BowlEmpty, BowlHalf, BowlFull],
  },
];

function ChoicePill({ opt, selected, onSelect }) {
  const isSelected = selected === opt.value;
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={() => onSelect(opt.value)}
      className="flex-1 py-3.5 rounded-2xl font-black text-sm transition-all relative overflow-hidden"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${opt.color}, ${opt.color}cc)`
          : "rgba(255,255,255,0.08)",
        color: isSelected ? "white" : "rgba(255,255,255,0.5)",
        border: isSelected ? `1.5px solid ${opt.color}` : "1.5px solid rgba(255,255,255,0.08)",
        boxShadow: isSelected ? `0 8px 24px ${opt.color}50` : "none",
      }}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-white pointer-events-none"
            style={{ transformOrigin: "center" }}
          />
        )}
      </AnimatePresence>
      {opt.label}
    </motion.button>
  );
}

export default function CheckinCard({ dog, mood, setMood, energy, setEnergy, appetite, setAppetite, onSubmit, submitting }) {
  const [step, setStep] = useState(0);
  const values = [mood, energy, appetite];
  const setters = [setMood, setEnergy, setAppetite];

  const currentStep = STEPS[step];
  const currentValue = values[step];
  const selectedIndex = currentStep.options.findIndex(o => o.value === currentValue);
  const IllustrationComponent = selectedIndex >= 0 ? currentStep.illustrations[selectedIndex] : null;
  const selectedOpt = selectedIndex >= 0 ? currentStep.options[selectedIndex] : null;

  const handleSelect = (val) => {
    setters[step](val);
    if (step < STEPS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 350);
    }
  };

  const allDone = mood && energy && appetite;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 70, damping: 16 }}
      className="mx-4 -mt-8 relative z-10 rounded-3xl overflow-hidden shadow-2xl"
      style={{ background: "linear-gradient(160deg, #0f2027, #1a3a4a, #0d2f2a)" }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="mr-1 text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex gap-1.5 flex-1">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === step ? 24 : 8,
                background: i < step ? "#10b981" : i === step ? "white" : "rgba(255,255,255,0.2)",
              }}
              className="h-1.5 rounded-full"
              transition={{ type: "spring", stiffness: 200 }}
            />
          ))}
        </div>
        <span className="text-[10px] text-white/30 font-bold ml-1">{step + 1}/3</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
          className="px-5 pt-2 pb-1"
        >
          <p className="text-white font-black text-[17px] leading-snug">
            {currentStep.question(dog?.name || "votre chien")}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Illustration */}
      <div className="relative flex items-center justify-center" style={{ height: 160 }}>
        <AnimatePresence mode="wait">
          {IllustrationComponent ? (
            <motion.div
              key={`${step}-${currentValue}`}
              initial={{ scale: 0.5, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 6 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="w-40 h-40"
            >
              <IllustrationComponent color={selectedOpt?.color || "#10b981"} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center w-40 h-40"
            >
              <svg viewBox="0 0 80 80" width="72" height="72" fill="none">
                <motion.ellipse cx="40" cy="40" rx="14" ry="12" fill="rgba(255,255,255,0.07)"
                  animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <motion.ellipse
                    key={i}
                    cx={40 + 22 * Math.cos((deg * Math.PI) / 180)}
                    cy={40 + 20 * Math.sin((deg * Math.PI) / 180)}
                    rx={i === 0 ? 11 : 6} ry={i === 0 ? 10 : 5}
                    fill="rgba(255,255,255,0.06)"
                    animate={{ opacity: [0.3, 0.65, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.18 }}
                  />
                ))}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pills */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.2 }}
          className="flex gap-2 px-5 pb-5"
        >
          {currentStep.options.map((opt) => (
            <ChoicePill key={opt.value} opt={opt} selected={currentValue} onSelect={handleSelect} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Validate CTA */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 pb-5"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b981, #2dd4bf)" }}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse PawCoach...</>
                : <><Sparkles className="w-4 h-4" /> Valider le check-in</>
              }
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}