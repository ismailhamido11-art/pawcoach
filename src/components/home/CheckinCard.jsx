import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader2, ChevronLeft, Sparkles } from "lucide-react";
import {
  DogSad, DogMeh, DogHappy, DogLove,
  DogSleep, DogTrot, DogRun,
  BowlEmpty, BowlHalf, BowlFull,
} from "./DogIllustrations";

// ─── Data ─────────────────────────────────────────────────────────────────────
export const MOOD_OPTIONS = [
  { value: 1, label: "Triste",  color: "#f43f5e" },
  { value: 2, label: "Bof",     color: "#f59e0b" },
  { value: 3, label: "Bien",    color: "#10b981" },
  { value: 4, label: "Super !", color: "#8b5cf6" },
];
export const ENERGY_OPTIONS = [
  { value: 1, label: "Épuisé", color: "#f43f5e" },
  { value: 2, label: "Moyen",  color: "#f59e0b" },
  { value: 3, label: "À fond", color: "#10b981" },
];
export const APPETITE_OPTIONS = [
  { value: 1, label: "Rien",    color: "#f43f5e" },
  { value: 2, label: "Normal",  color: "#f59e0b" },
  { value: 3, label: "Glouton", color: "#10b981" },
];

// ─── Step config ───────────────────────────────────────────────────────────────
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      {/* body */}
      <ellipse cx="60" cy="90" rx="30" ry="18" fill={color} opacity="0.15" />
      <ellipse cx="60" cy="88" rx="28" ry="16" fill={color} opacity="0.25" />
      {/* head */}
      <circle cx="60" cy="55" r="30" fill={color} opacity="0.2" />
      <circle cx="60" cy="55" r="26" fill={color} opacity="0.15" />
      {/* droopy ears */}
      <path d="M30 42 Q16 35 20 58 Q26 50 32 54Z" fill={color} opacity="0.5" />
      <path d="M90 42 Q104 35 100 58 Q94 50 88 54Z" fill={color} opacity="0.5" />
      {/* sad eyes with eyebrows */}
      <line x1="43" y1="44" x2="52" y2="47" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="68" y1="47" x2="77" y2="44" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <ellipse cx="48" cy="53" rx="5" ry="5" fill={color} opacity="0.7" />
      <ellipse cx="72" cy="53" rx="5" ry="5" fill={color} opacity="0.7" />
      <circle cx="46" cy="51" r="1.5" fill="white" opacity="0.5" />
      <circle cx="70" cy="51" r="1.5" fill="white" opacity="0.5" />
      {/* tear */}
      <ellipse cx="48" cy="62" rx="2" ry="3" fill={color} opacity="0.5" />
      {/* sad mouth */}
      <path d="M46 70 Q60 62 74 70" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* tail down */}
      <path d="M88 94 Q100 104 96 114" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
      {/* legs */}
      <rect x="38" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="52" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="66" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="80" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
    </svg>
  );
}

function DogMeh({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="90" rx="30" ry="18" fill={color} opacity="0.15" />
      <ellipse cx="60" cy="88" rx="28" ry="16" fill={color} opacity="0.25" />
      <circle cx="60" cy="55" r="30" fill={color} opacity="0.2" />
      <circle cx="60" cy="55" r="26" fill={color} opacity="0.15" />
      {/* medium ears */}
      <path d="M30 38 Q18 28 24 48 Q28 42 34 46Z" fill={color} opacity="0.5" />
      <path d="M90 38 Q102 28 96 48 Q92 42 86 46Z" fill={color} opacity="0.5" />
      {/* flat brow + eyes */}
      <line x1="43" y1="46" x2="53" y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="67" y1="46" x2="77" y2="46" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="48" cy="54" rx="5" ry="5" fill={color} opacity="0.7" />
      <ellipse cx="72" cy="54" rx="5" ry="5" fill={color} opacity="0.7" />
      <circle cx="46" cy="52" r="1.5" fill="white" opacity="0.5" />
      <circle cx="70" cy="52" r="1.5" fill="white" opacity="0.5" />
      {/* flat mouth */}
      <line x1="48" y1="68" x2="72" y2="68" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      {/* tail neutral */}
      <path d="M88 92 Q102 90 102 80" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
      <rect x="38" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="52" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="66" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
      <rect x="80" y="100" width="8" height="16" rx="4" fill={color} opacity="0.3" />
    </svg>
  );
}

function DogHappy({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="90" rx="30" ry="18" fill={color} opacity="0.15" />
      <ellipse cx="60" cy="88" rx="28" ry="16" fill={color} opacity="0.25" />
      <circle cx="60" cy="55" r="30" fill={color} opacity="0.2" />
      <circle cx="60" cy="55" r="26" fill={color} opacity="0.15" />
      {/* perky ears */}
      <path d="M30 34 Q18 20 26 40 Q30 36 34 40Z" fill={color} opacity="0.6" />
      <path d="M90 34 Q102 20 94 40 Q90 36 86 40Z" fill={color} opacity="0.6" />
      {/* happy arc eyes */}
      <path d="M43 52 Q48 47 53 52" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M67 52 Q72 47 77 52" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      {/* big smile + tongue */}
      <path d="M44 66 Q60 80 76 66" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="60" cy="74" rx="8" ry="6" fill={color} opacity="0.25" />
      <ellipse cx="60" cy="74" rx="6" ry="4" fill="#fca5a5" opacity="0.7" />
      {/* tail up */}
      <path d="M88 90 Q106 78 102 64" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
      <rect x="36" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" transform="rotate(5 36 100)" />
      <rect x="52" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" />
      <rect x="66" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" />
      <rect x="82" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" transform="rotate(-5 82 100)" />
    </svg>
  );
}

function DogLove({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="90" rx="30" ry="18" fill={color} opacity="0.15" />
      <ellipse cx="60" cy="88" rx="28" ry="16" fill={color} opacity="0.25" />
      <circle cx="60" cy="55" r="30" fill={color} opacity="0.2" />
      <circle cx="60" cy="55" r="26" fill={color} opacity="0.15" />
      {/* very perky ears */}
      <path d="M28 30 Q16 14 26 36 Q30 32 34 36Z" fill={color} opacity="0.7" />
      <path d="M92 30 Q104 14 94 36 Q90 32 86 36Z" fill={color} opacity="0.7" />
      {/* heart eyes */}
      <path d="M40 48 C40 44 44 43 46 46 C48 43 52 44 52 48 C52 52 46 57 46 57 C46 57 40 52 40 48Z" fill={color} opacity="0.85" />
      <path d="M68 48 C68 44 72 43 74 46 C76 43 80 44 80 48 C80 52 74 57 74 57 C74 57 68 52 68 48Z" fill={color} opacity="0.85" />
      {/* huge grin + big tongue */}
      <path d="M42 66 Q60 82 78 66" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <ellipse cx="60" cy="76" rx="10" ry="7" fill={color} opacity="0.2" />
      <ellipse cx="60" cy="76" rx="8" ry="5" fill="#fca5a5" opacity="0.8" />
      {/* curly tail */}
      <path d="M88 88 Q108 76 106 60 Q104 48 94 52" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* sparkles */}
      <circle cx="18" cy="24" r="3" fill={color} opacity="0.4" />
      <circle cx="102" cy="20" r="2.5" fill={color} opacity="0.35" />
      <circle cx="106" cy="96" r="2" fill={color} opacity="0.3" />
      <rect x="36" y="98" width="8" height="20" rx="4" fill={color} opacity="0.3" transform="rotate(10 36 98)" />
      <rect x="52" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" transform="rotate(3 52 100)" />
      <rect x="68" y="100" width="8" height="18" rx="4" fill={color} opacity="0.3" transform="rotate(-3 68 100)" />
      <rect x="82" y="98" width="8" height="20" rx="4" fill={color} opacity="0.3" transform="rotate(-10 82 98)" />
    </svg>
  );
}

function DogSleep({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      {/* curled body */}
      <ellipse cx="65" cy="88" rx="38" ry="20" fill={color} opacity="0.15" />
      {/* head lower-left */}
      <circle cx="32" cy="72" r="24" fill={color} opacity="0.2" />
      {/* floppy ear */}
      <path d="M14 62 Q4 52 10 76 Q16 68 20 72Z" fill={color} opacity="0.5" />
      {/* closed eyes (arcs) */}
      <path d="M20 70 Q24 66 28 70" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
      <path d="M34 70 Q38 66 42 70" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
      {/* small mouth */}
      <path d="M26 79 Q32 83 38 79" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* zzz */}
      <text x="54" y="60" fontSize="16" fill={color} fontWeight="900" opacity="0.6">z</text>
      <text x="66" y="46" fontSize="12" fill={color} fontWeight="900" opacity="0.4">z</text>
      <text x="75" y="34" fontSize="9" fill={color} fontWeight="900" opacity="0.3">z</text>
      {/* tail curled */}
      <path d="M96 88 Q110 82 108 68 Q106 56 96 62" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  );
}

function DogTrot({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="62" cy="78" rx="32" ry="15" fill={color} opacity="0.15" transform="rotate(-5 62 78)" />
      <circle cx="36" cy="58" r="24" fill={color} opacity="0.2" />
      <path d="M16 46 Q6 36 14 58 Q18 52 22 56Z" fill={color} opacity="0.55" />
      <ellipse cx="30" cy="56" rx="5" ry="5" fill={color} opacity="0.75" />
      <ellipse cx="44" cy="56" rx="5" ry="5" fill={color} opacity="0.75" />
      <circle cx="28" cy="54" r="1.5" fill="white" opacity="0.5" />
      <circle cx="42" cy="54" r="1.5" fill="white" opacity="0.5" />
      <path d="M28 67 Q36 74 44 67" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
      <ellipse cx="36" cy="72" rx="5" ry="3.5" fill="#fca5a5" opacity="0.5" />
      {/* legs alternating */}
      <rect x="44" y="88" width="7" height="20" rx="3.5" fill={color} opacity="0.3" transform="rotate(-10 44 88)" />
      <rect x="56" y="88" width="7" height="22" rx="3.5" fill={color} opacity="0.3" transform="rotate(6 56 88)" />
      <rect x="70" y="86" width="7" height="22" rx="3.5" fill={color} opacity="0.3" transform="rotate(-8 70 86)" />
      <rect x="82" y="84" width="7" height="20" rx="3.5" fill={color} opacity="0.3" transform="rotate(10 82 84)" />
      {/* tail mid */}
      <path d="M90 76 Q106 68 104 56" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.45" />
    </svg>
  );
}

function DogRun({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      {/* body stretched / leaning forward */}
      <ellipse cx="66" cy="72" rx="36" ry="14" fill={color} opacity="0.15" transform="rotate(-15 66 72)" />
      {/* head */}
      <circle cx="28" cy="52" r="24" fill={color} opacity="0.2" />
      <path d="M10 38 Q2 26 12 48 Q16 42 20 46Z" fill={color} opacity="0.6" />
      {/* excited arc eyes */}
      <path d="M18 49 Q23 44 28 49" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M30 49 Q35 44 40 49" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* open mouth */}
      <path d="M16 60 Q28 72 40 60" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
      <ellipse cx="28" cy="66" rx="8" ry="5" fill="#fca5a5" opacity="0.7" />
      {/* sprint legs extended */}
      <rect x="48" y="82" width="7" height="26" rx="3.5" fill={color} opacity="0.3" transform="rotate(-25 48 82)" />
      <rect x="60" y="84" width="7" height="24" rx="3.5" fill={color} opacity="0.3" transform="rotate(15 60 84)" />
      <rect x="76" y="78" width="7" height="28" rx="3.5" fill={color} opacity="0.3" transform="rotate(-20 76 78)" />
      <rect x="90" y="76" width="7" height="26" rx="3.5" fill={color} opacity="0.3" transform="rotate(25 90 76)" />
      {/* tail high wagging */}
      <path d="M96 64 Q114 44 108 28" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
      {/* speed lines */}
      <line x1="2" y1="54" x2="12" y2="54" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <line x1="4" y1="62" x2="10" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      <line x1="2" y1="46" x2="8" y2="46" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
    </svg>
  );
}

// Bowl SVGs for appetite
function BowlEmpty({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="84" rx="40" ry="10" fill={color} opacity="0.12" />
      <path d="M20 56 Q60 92 100 56" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.4" />
      <line x1="16" y1="56" x2="104" y2="56" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      {/* sad dog peeking */}
      <circle cx="60" cy="36" r="16" fill={color} opacity="0.15" />
      <path d="M48 32 Q40 26 43 40 Q46 36 48 38Z" fill={color} opacity="0.4" />
      <path d="M72 32 Q80 26 77 40 Q74 36 72 38Z" fill={color} opacity="0.4" />
      <path d="M50 35 Q55 31 60 35" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M60 35 Q65 31 70 35" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M52 42 Q60 47 68 42" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <text x="50" y="110" fontSize="11" fill={color} opacity="0.4" fontWeight="600">rien...</text>
    </svg>
  );
}

function BowlHalf({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="84" rx="40" ry="10" fill={color} opacity="0.12" />
      {/* bowl */}
      <path d="M20 56 Q60 92 100 56" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
      <line x1="16" y1="56" x2="104" y2="56" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      {/* half fill */}
      <path d="M20 56 Q60 74 100 56 L100 56 Q60 60 20 56Z" fill={color} opacity="0.2" />
      {/* kibbles */}
      <circle cx="48" cy="62" r="5" fill={color} opacity="0.35" />
      <circle cx="60" cy="65" r="5" fill={color} opacity="0.35" />
      <circle cx="72" cy="62" r="5" fill={color} opacity="0.35" />
      {/* content dog */}
      <circle cx="60" cy="30" r="16" fill={color} opacity="0.15" />
      <path d="M48 26 Q40 20 43 34 Q46 30 48 32Z" fill={color} opacity="0.4" />
      <path d="M72 26 Q80 20 77 34 Q74 30 72 32Z" fill={color} opacity="0.4" />
      <path d="M52 29 Q57 25 62 29" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M62 29 Q67 25 72 29" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.75" />
      <path d="M50 37 Q60 44 70 37" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  );
}

function BowlFull({ color = "#64748b" }) {
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" fill="none">
      <ellipse cx="60" cy="84" rx="40" ry="10" fill={color} opacity="0.12" />
      <path d="M20 56 Q60 92 100 56" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
      <line x1="16" y1="56" x2="104" y2="56" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      {/* full fill */}
      <path d="M20 56 Q60 88 100 56 L100 56 Q60 56 20 56Z" fill={color} opacity="0.25" />
      {/* overflowing kibbles */}
      <circle cx="42" cy="54" r="6" fill={color} opacity="0.4" />
      <circle cx="55" cy="50" r="6" fill={color} opacity="0.4" />
      <circle cx="68" cy="50" r="6" fill={color} opacity="0.4" />
      <circle cx="80" cy="54" r="6" fill={color} opacity="0.4" />
      <circle cx="60" cy="46" r="5" fill={color} opacity="0.35" />
      {/* ecstatic dog */}
      <circle cx="60" cy="26" r="16" fill={color} opacity="0.15" />
      <path d="M46 20 Q36 12 40 30 Q44 24 48 28Z" fill={color} opacity="0.5" />
      <path d="M74 20 Q84 12 80 30 Q76 24 72 28Z" fill={color} opacity="0.5" />
      {/* heart eyes */}
      <path d="M48 22 C48 20 51 19 52 21 C53 19 56 20 56 22 C56 25 52 28 52 28C52 28 48 25 48 22Z" fill={color} opacity="0.85" />
      <path d="M64 22 C64 20 67 19 68 21 C69 19 72 20 72 22 C72 25 68 28 68 28C68 28 64 25 64 22Z" fill={color} opacity="0.85" />
      <path d="M48 33 Q60 42 72 33" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
      <ellipse cx="60" cy="38" rx="7" ry="5" fill="#fca5a5" opacity="0.7" />
    </svg>
  );
}

// ─── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    key: "mood",
    question: (name) => `Comment est l'humeur de ${name} ?`,
    options: MOOD_OPTIONS,
    illustrations: [DogSad, DogMeh, DogHappy, DogLove],
  },
  {
    key: "energy",
    question: (name) => `Quel était son niveau d'énergie ?`,
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

// ─── Choice pill ──────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
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
      setTimeout(() => setStep(s => s + 1), 340);
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
      {/* top progress dots */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="mr-1 text-white/40 hover:text-white/70 transition-colors"
          >
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
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="px-5 pt-2 pb-1"
        >
          <p className="text-white font-black text-[17px] leading-snug">
            {currentStep.question(dog?.name || "votre chien")}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Illustration zone */}
      <div className="relative flex items-center justify-center" style={{ height: 150 }}>
        <AnimatePresence mode="wait">
          {IllustrationComponent ? (
            <motion.div
              key={`${step}-${currentValue}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="w-36 h-36"
            >
              <IllustrationComponent color={selectedOpt?.color || "#10b981"} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-36 h-36 flex items-center justify-center"
            >
              {/* Animated placeholder paw print */}
              <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
                <motion.circle cx="40" cy="40" r="12" fill="rgba(255,255,255,0.08)"
                  animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} />
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <motion.circle
                    key={i}
                    cx={40 + 20 * Math.cos((deg * Math.PI) / 180)}
                    cy={40 + 20 * Math.sin((deg * Math.PI) / 180)}
                    r={i === 0 ? 10 : 5}
                    fill="rgba(255,255,255,0.07)"
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.15 }}
                  />
                ))}
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex gap-2 px-5 pb-5"
        >
          {currentStep.options.map((opt) => (
            <ChoicePill key={opt.value} opt={opt} selected={currentValue} onSelect={handleSelect} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* CTA — appears when all 3 are filled */}
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
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyse PawCoach...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Valider le check-in</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}