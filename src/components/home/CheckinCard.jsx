import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const MOOD_OPTIONS = [
  { value: 1, label: "Triste",  selectedBg: "from-rose-400 to-rose-500",   face: MoodSad },
  { value: 2, label: "Bof",     selectedBg: "from-amber-300 to-amber-400",  face: MoodMeh },
  { value: 3, label: "Bien",    selectedBg: "from-emerald-400 to-emerald-500", face: MoodHappy },
  { value: 4, label: "Super !", selectedBg: "from-violet-400 to-pink-400",  face: MoodLove },
];

const ENERGY_OPTIONS = [
  { value: 1, label: "Épuisé", selectedBg: "from-rose-400 to-rose-500",      face: DogSleep },
  { value: 2, label: "Moyen",  selectedBg: "from-amber-300 to-amber-400",    face: DogTrot },
  { value: 3, label: "À fond", selectedBg: "from-emerald-400 to-teal-500",   face: DogRun },
];

const APPETITE_OPTIONS = [
  { value: 1, label: "Rien",    selectedBg: "from-rose-400 to-rose-500",     bowl: 0 },
  { value: 2, label: "Normal",  selectedBg: "from-amber-300 to-amber-400",   bowl: 50 },
  { value: 3, label: "Glouton", selectedBg: "from-emerald-400 to-emerald-500", bowl: 100 },
];

export { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS };

// ─── Custom Dog SVGs ──────────────────────────────────────────────────────────
// Sad dog: ears drooping down, sad eyes, tail down
function MoodSad({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      {/* body */}
      <ellipse cx="32" cy="44" rx="14" ry="9" fill={fill} />
      {/* head */}
      <circle cx="32" cy="28" r="14" fill={fill} />
      {/* droopy ears */}
      <path d="M18 22 Q10 18 11 30 Q14 26 18 28Z" fill={c} opacity="0.7" />
      <path d="M46 22 Q54 18 53 30 Q50 26 46 28Z" fill={c} opacity="0.7" />
      {/* sad eyes */}
      <ellipse cx="26" cy="27" rx="2.5" ry="2.5" fill={c} />
      <ellipse cx="38" cy="27" rx="2.5" ry="2.5" fill={c} />
      {/* tear */}
      {selected && <ellipse cx="26" cy="32" rx="1" ry="1.5" fill="rgba(255,255,255,0.5)" />}
      {/* sad mouth */}
      <path d="M26 36 Q32 32 38 36" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* tail down */}
      <path d="M46 47 Q52 52 50 56" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Meh dog: neutral flat ears, straight mouth
function MoodMeh({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      <ellipse cx="32" cy="44" rx="14" ry="9" fill={fill} />
      <circle cx="32" cy="28" r="14" fill={fill} />
      {/* medium ears */}
      <path d="M18 20 Q11 16 13 26 Q16 22 19 24Z" fill={c} opacity="0.7" />
      <path d="M46 20 Q53 16 51 26 Q48 22 45 24Z" fill={c} opacity="0.7" />
      {/* eyes with a brow */}
      <ellipse cx="26" cy="27" rx="2.5" ry="2.5" fill={c} />
      <ellipse cx="38" cy="27" rx="2.5" ry="2.5" fill={c} />
      <line x1="23" y1="22" x2="29" y2="23" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="23" x2="41" y2="22" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      {/* flat mouth */}
      <line x1="26" y1="36" x2="38" y2="36" stroke={c} strokeWidth="2" strokeLinecap="round" />
      {/* tail neutral */}
      <path d="M46 47 Q54 46 54 42" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Happy dog: perky ears, big smile, wagging tail
function MoodHappy({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      <ellipse cx="32" cy="44" rx="14" ry="9" fill={fill} />
      <circle cx="32" cy="28" r="14" fill={fill} />
      {/* perky ears */}
      <path d="M18 16 Q10 8 16 20 Q18 18 20 20Z" fill={c} opacity="0.8" />
      <path d="M46 16 Q54 8 48 20 Q46 18 44 20Z" fill={c} opacity="0.8" />
      {/* happy eyes */}
      <path d="M23 26 Q26 23 29 26" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M35 26 Q38 23 41 26" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* big smile + tongue */}
      <path d="M24 35 Q32 44 40 35" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="40" rx="4" ry="3" fill={selected ? "rgba(255,150,150,0.6)" : "#fca5a5"} />
      {/* tail up-wagging */}
      <path d="M46 45 Q56 38 54 32" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Super dog: ears up, heart eyes, big grin, tail curled
function MoodLove({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  const heartFill = selected ? "white" : "#f87171";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      <ellipse cx="32" cy="44" rx="14" ry="9" fill={fill} />
      <circle cx="32" cy="28" r="14" fill={fill} />
      {/* ears up straight */}
      <path d="M18 14 Q12 4 19 16 Q19 14 21 16Z" fill={c} opacity="0.8" />
      <path d="M46 14 Q52 4 45 16 Q45 14 43 16Z" fill={c} opacity="0.8" />
      {/* heart eyes */}
      <path d="M22 24 C22 22 24 21 25 23 C26 21 28 22 28 24 C28 26 25 29 25 29 C25 29 22 26 22 24Z" fill={heartFill} />
      <path d="M36 24 C36 22 38 21 39 23 C40 21 42 22 42 24 C42 26 39 29 39 29 C39 29 36 26 36 24Z" fill={heartFill} />
      {/* big grin + tongue */}
      <path d="M22 35 Q32 46 42 35" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <ellipse cx="32" cy="41" rx="5" ry="3.5" fill={selected ? "rgba(255,150,150,0.6)" : "#fca5a5"} />
      {/* curly tail */}
      <path d="M46 44 Q58 38 56 28 Q54 22 48 26" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* sparkles */}
      {selected && (
        <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <circle cx="10" cy="12" r="2" fill="rgba(255,255,255,0.6)" />
          <circle cx="54" cy="10" r="1.5" fill="rgba(255,255,255,0.5)" />
          <circle cx="56" cy="50" r="1.5" fill="rgba(255,255,255,0.4)" />
        </motion.g>
      )}
    </svg>
  );
}

// Sleeping dog for low energy
function DogSleep({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      {/* body curled */}
      <ellipse cx="32" cy="46" rx="18" ry="8" fill={fill} />
      {/* head */}
      <circle cx="20" cy="36" r="12" fill={fill} />
      {/* floppy ear */}
      <path d="M12 30 Q6 24 10 38 Q14 34 16 36Z" fill={c} opacity="0.7" />
      {/* closed eyes (zzz) */}
      <line x1="14" y1="34" x2="19" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="34" x2="26" y2="34" stroke={c} strokeWidth="2" strokeLinecap="round" />
      {/* zzz */}
      <text x="32" y="28" fontSize="9" fill={c} fontWeight="900" opacity="0.7">z</text>
      <text x="38" y="20" fontSize="7" fill={c} fontWeight="900" opacity="0.5">z</text>
      {/* tail curled */}
      <path d="M48 46 Q56 44 54 38 Q52 34 46 38" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Medium energy dog: trotting
function DogTrot({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      <ellipse cx="34" cy="40" rx="16" ry="8" fill={fill} />
      <circle cx="22" cy="30" r="12" fill={fill} />
      {/* ear perky */}
      <path d="M14 22 Q9 14 16 24 Q16 22 18 24Z" fill={c} opacity="0.8" />
      {/* eyes */}
      <ellipse cx="18" cy="29" rx="2" ry="2" fill={c} />
      <ellipse cx="26" cy="29" rx="2" ry="2" fill={c} />
      {/* small smile */}
      <path d="M16 35 Q22 40 28 35" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* legs alternating */}
      <line x1="26" y1="46" x2="22" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="46" x2="36" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="46" x2="38" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="46" y1="44" x2="50" y2="54" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* tail up */}
      <path d="M50 38 Q58 32 56 26" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Full energy: dog running / jumping
function DogRun({ selected }) {
  const c = selected ? "rgba(255,255,255,0.9)" : "#64748b";
  const fill = selected ? "rgba(255,255,255,0.18)" : "#e2e8f0";
  return (
    <svg viewBox="0 0 64 64" width="44" height="44" fill="none">
      {/* body stretched */}
      <ellipse cx="34" cy="38" rx="18" ry="7" fill={fill} transform="rotate(-10 34 38)" />
      {/* head */}
      <circle cx="16" cy="26" r="11" fill={fill} />
      {/* ear up */}
      <path d="M9 18 Q5 9 13 20 Q12 18 15 20Z" fill={c} opacity="0.8" />
      {/* excited eyes */}
      <path d="M11 24 Q14 21 17 24" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M18 24 Q21 21 24 24" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* open mouth */}
      <path d="M10 31 Q16 38 22 31" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="16" cy="34" rx="4" ry="3" fill={selected ? "rgba(255,150,150,0.55)" : "#fca5a5"} />
      {/* legs extended sprint */}
      <line x1="24" y1="42" x2="16" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="44" x2="24" y2="58" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="40" y1="43" x2="48" y2="56" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="46" y1="40" x2="56" y2="50" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
      {/* tail wagging high */}
      <path d="M52 34 Q62 22 58 14" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* speed lines */}
      {selected && (
        <>
          <line x1="2" y1="28" x2="8" y2="28" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="2" y1="34" x2="6" y2="34" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
        </>
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