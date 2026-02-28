import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  {
    value: 1,
    label: "Triste",
    bg: "from-slate-100 to-slate-200",
    selectedBg: "from-rose-400 to-rose-500",
    face: MoodSad,
  },
  {
    value: 2,
    label: "Bof",
    bg: "from-slate-100 to-slate-200",
    selectedBg: "from-amber-300 to-amber-400",
    face: MoodMeh,
  },
  {
    value: 3,
    label: "Bien",
    bg: "from-slate-100 to-slate-200",
    selectedBg: "from-emerald-400 to-emerald-500",
    face: MoodHappy,
  },
  {
    value: 4,
    label: "Super !",
    bg: "from-slate-100 to-slate-200",
    selectedBg: "from-violet-400 to-pink-400",
    face: MoodLove,
  },
];

const ENERGY_OPTIONS = [
  {
    value: 1,
    label: "Épuisé",
    icon: "🔋",
    selectedBg: "from-rose-400 to-rose-500",
    fill: 25,
  },
  {
    value: 2,
    label: "Moyen",
    icon: "⚡",
    selectedBg: "from-amber-300 to-amber-400",
    fill: 60,
  },
  {
    value: 3,
    label: "À fond",
    icon: "🚀",
    selectedBg: "from-emerald-400 to-teal-500",
    fill: 100,
  },
];

const APPETITE_OPTIONS = [
  {
    value: 1,
    label: "Rien",
    selectedBg: "from-rose-400 to-rose-500",
    bowl: 0,
  },
  {
    value: 2,
    label: "Normal",
    selectedBg: "from-amber-300 to-amber-400",
    bowl: 50,
  },
  {
    value: 3,
    label: "Glouton",
    selectedBg: "from-emerald-400 to-emerald-500",
    bowl: 100,
  },
];

export { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS };

// ─── Custom SVG faces ─────────────────────────────────────────────────────────
function MoodSad({ selected }) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none">
      <circle cx="32" cy="32" r="28" fill={selected ? "rgba(255,255,255,0.25)" : "#e2e8f0"} />
      <circle cx="22" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <circle cx="42" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <path d="M20 44 Q32 36 44 44" stroke={selected ? "white" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {selected && (
        <>
          <circle cx="20" cy="31" r="2" fill="rgba(255,255,255,0.5)" />
          <circle cx="44" cy="31" r="2" fill="rgba(255,255,255,0.5)" />
        </>
      )}
    </svg>
  );
}

function MoodMeh({ selected }) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none">
      <circle cx="32" cy="32" r="28" fill={selected ? "rgba(255,255,255,0.25)" : "#e2e8f0"} />
      <circle cx="22" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <circle cx="42" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <line x1="20" y1="42" x2="44" y2="42" stroke={selected ? "white" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function MoodHappy({ selected }) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none">
      <circle cx="32" cy="32" r="28" fill={selected ? "rgba(255,255,255,0.25)" : "#e2e8f0"} />
      <circle cx="22" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <circle cx="42" cy="27" r="3" fill={selected ? "white" : "#64748b"} />
      <path d="M20 38 Q32 50 44 38" stroke={selected ? "white" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function MoodLove({ selected }) {
  return (
    <svg viewBox="0 0 64 64" width="40" height="40" fill="none">
      <circle cx="32" cy="32" r="28" fill={selected ? "rgba(255,255,255,0.25)" : "#e2e8f0"} />
      {/* heart eyes */}
      <path d="M18 24 C18 21 21 20 22 22 C23 20 26 21 26 24 C26 27 22 30 22 30 C22 30 18 27 18 24Z" fill={selected ? "white" : "#64748b"} />
      <path d="M38 24 C38 21 41 20 42 22 C43 20 46 21 46 24 C46 27 42 30 42 30 C42 30 38 27 38 24Z" fill={selected ? "white" : "#64748b"} />
      <path d="M20 40 Q32 52 44 40" stroke={selected ? "white" : "#64748b"} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {selected && (
        <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}>
          <circle cx="52" cy="14" r="3" fill="rgba(255,255,255,0.6)" />
          <circle cx="12" cy="14" r="2" fill="rgba(255,255,255,0.4)" />
        </motion.g>
      )}
    </svg>
  );
}

// ─── Energy visual ────────────────────────────────────────────────────────────
function EnergyBar({ fill, selected }) {
  return (
    <div className="flex gap-0.5 items-end h-6">
      {[33, 66, 100].map((threshold, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: fill >= threshold ? 1 : 0.3, opacity: fill >= threshold ? 1 : 0.3 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
          className="w-2 rounded-full origin-bottom"
          style={{
            height: 8 + i * 6,
            background: selected ? "rgba(255,255,255,0.9)" : "#cbd5e1",
          }}
        />
      ))}
    </div>
  );
}

// ─── Bowl visual ──────────────────────────────────────────────────────────────
function BowlFill({ fill, selected }) {
  const color = selected ? "rgba(255,255,255,0.85)" : "#94a3b8";
  return (
    <svg viewBox="0 0 44 32" width="40" height="28" fill="none">
      {/* bowl outline */}
      <path d="M4 10 Q22 28 40 10" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="2" y1="10" x2="42" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {fill > 0 && (
        <motion.path
          d={`M4 10 Q22 ${10 + (fill / 100) * 16} 40 10`}
          fill={selected ? "rgba(255,255,255,0.3)" : "#e2e8f0"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />
      )}
      {fill === 100 && (
        <>
          <circle cx="22" cy="6" r="2" fill={color} />
          <circle cx="16" cy="4" r="1.5" fill={color} opacity="0.7" />
          <circle cx="28" cy="4" r="1.5" fill={color} opacity="0.7" />
        </>
      )}
    </svg>
  );
}

// ─── Option button ────────────────────────────────────────────────────────────
function OptionButton({ opt, selected, onSelect, type }) {
  const isSelected = selected === opt.value;

  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={() => onSelect(opt.value)}
      className="flex-1 relative overflow-hidden rounded-2xl transition-all"
      style={{ minHeight: 84 }}
    >
      {/* bg */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          opacity: isSelected ? 1 : 0,
          scale: isSelected ? 1 : 0.85,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, var(--from, #34d399), var(--to, #10b981))`
            : undefined,
        }}
      >
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${opt.selectedBg}`}
        />
      </motion.div>

      {/* base bg when not selected */}
      <div
        className={`absolute inset-0 rounded-2xl transition-colors duration-200 ${
          isSelected ? "opacity-0" : "opacity-100"
        } bg-slate-100`}
      />

      {/* glow ring */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: "0 0 0 2px rgba(255,255,255,0.5) inset" }}
          />
        )}
      </AnimatePresence>

      {/* content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 py-4 px-2">
        {type === "mood" && (
          <motion.div
            animate={isSelected ? { scale: [1, 1.2, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <opt.face selected={isSelected} />
          </motion.div>
        )}

        {type === "energy" && (
          <motion.div
            className="flex flex-col items-center gap-1"
            animate={isSelected ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <EnergyBar fill={opt.fill} selected={isSelected} />
          </motion.div>
        )}

        {type === "appetite" && (
          <motion.div
            animate={isSelected && opt.bowl === 100 ? { rotate: [0, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <BowlFill fill={opt.bowl} selected={isSelected} />
          </motion.div>
        )}

        <motion.span
          animate={{ color: isSelected ? "white" : "#64748b" }}
          className="text-[11px] font-black tracking-wide"
        >
          {opt.label}
        </motion.span>
      </div>

      {/* selection particle burst */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{}}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 rounded-full bg-white pointer-events-none"
            style={{ transformOrigin: "center" }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-2.5 px-0.5">
        {label}
      </p>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CheckinCard({ dog, mood, setMood, energy, setEnergy, appetite, setAppetite, onSubmit, submitting }) {
  const canSubmit = mood && energy && appetite && !submitting;
  const progress = [mood, energy, appetite].filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 70, damping: 15 }}
      className="mx-4 -mt-6 relative z-10 bg-white rounded-3xl shadow-2xl shadow-slate-200/80 border border-white/60 overflow-hidden"
    >
      {/* Progress strip */}
      <div className="h-1 bg-slate-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          animate={{ width: `${(progress / 3) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-black text-slate-900 leading-tight">
              Comment va {dog?.name} ?
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Check-in du jour</p>
          </div>
          <motion.div
            animate={{
              background: progress === 3
                ? ["hsl(168,55%,38%)", "hsl(168,55%,38%)"]
                : "transparent",
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-100"
          >
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{
                  scale: progress >= i ? 1 : 0.6,
                  background: progress >= i ? "hsl(var(--primary))" : "#e2e8f0",
                }}
                className="w-2 h-2 rounded-full"
                transition={{ type: "spring", stiffness: 300 }}
              />
            ))}
          </motion.div>
        </div>

        {/* Mood */}
        <Section label="Humeur">
          {MOOD_OPTIONS.map(opt => (
            <OptionButton key={opt.value} opt={opt} selected={mood} onSelect={setMood} type="mood" />
          ))}
        </Section>

        {/* Energy */}
        <Section label="Énergie">
          {ENERGY_OPTIONS.map(opt => (
            <OptionButton key={opt.value} opt={opt} selected={energy} onSelect={setEnergy} type="energy" />
          ))}
        </Section>

        {/* Appetite */}
        <Section label="Appétit">
          {APPETITE_OPTIONS.map(opt => (
            <OptionButton key={opt.value} opt={opt} selected={appetite} onSelect={setAppetite} type="appetite" />
          ))}
        </Section>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSubmit}
          disabled={!canSubmit}
          animate={{
            opacity: canSubmit ? 1 : 0.45,
            y: canSubmit ? 0 : 4,
          }}
          transition={{ duration: 0.25 }}
          className={`w-full py-4 rounded-2xl font-black text-sm transition-colors duration-300 flex items-center justify-center gap-2 ${
            canSubmit
              ? "text-white shadow-lg shadow-primary/25"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          style={canSubmit ? {
            background: "linear-gradient(135deg, hsl(168,55%,38%), hsl(155,50%,55%))",
          } : {}}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse PawCoach...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Valider le check-in
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}