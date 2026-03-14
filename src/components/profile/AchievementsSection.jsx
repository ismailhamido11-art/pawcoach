import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Lock, ChevronRight, Zap } from "lucide-react";

// All possible badges — source of truth for display
const ALL_BADGES = [
  // Walk
  { id: "first_walk",       name: "Première balade",    emoji: "🐾", points: 10,  category: "walk",      hint: "Enregistre ta 1re balade avec {name}" },
  { id: "walk_30min",       name: "Marcheur",            emoji: "👟", points: 20,  category: "walk",      hint: "30 min de balade en une journée" },
  { id: "walk_7days",       name: "Régulier",            emoji: "📅", points: 50,  category: "walk",      hint: "Balade 7 jours de suite avec {name}" },
  { id: "walk_marathon",    name: "Ultra Marcheur",      emoji: "🏅", points: 200, category: "walk",      hint: "1 000 min de balade cumulées" },
  // Training
  { id: "first_program",    name: "Coach débutant",      emoji: "✨", points: 15,  category: "training",  hint: "Lance ton 1er programme IA" },
  { id: "training_3programs",name: "Coach expert",       emoji: "🎓", points: 300, category: "training",  hint: "Génère 3 programmes différents" },
  // Streak
  { id: "streak_3",         name: "En forme",            emoji: "🔥", points: 30,  category: "streak",    hint: "3 jours d'activité consécutifs" },
  { id: "streak_7",         name: "Habitude",            emoji: "⚡", points: 75,  category: "streak",    hint: "7 jours consécutifs avec {name}" },
  { id: "streak_30",        name: "Légende",             emoji: "👑", points: 250, category: "streak",    hint: "30 jours consécutifs — du sérieux !" },
  // Milestones
  { id: "points_100",       name: "100 points",          emoji: "⭐", points: 0,   category: "milestone", hint: "Cumule 100 points d'activité" },
  { id: "points_500",       name: "500 points",          emoji: "🌟", points: 0,   category: "milestone", hint: "Cumule 500 points — top 10% des owners" },
  { id: "points_1000",      name: "Maître PawCoach",     emoji: "💎", points: 0,   category: "milestone", hint: "1 000 points — le summum absolu" },
];

const TOTAL_BADGES = ALL_BADGES.length;

const CATEGORY_LABELS = {
  walk:      "Balades",
  training:  "Entraînement",
  streak:    "Régularité",
  milestone: "Jalons",
};

const CATEGORY_COLORS = {
  walk:      { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-400" },
  training:  { bg: "bg-blue-50",     border: "border-blue-200",    text: "text-blue-700",    dot: "bg-blue-400" },
  streak:    { bg: "bg-orange-50",   border: "border-orange-200",  text: "text-orange-700",  dot: "bg-orange-400" },
  milestone: { bg: "bg-purple-50",   border: "border-purple-200",  text: "text-purple-700",  dot: "bg-purple-400" },
};

const LEVEL_THRESHOLDS = [
  { min: 0,    label: "Chiot",     emoji: "🐶", nextLabel: "Compagnon" },
  { min: 100,  label: "Compagnon", emoji: "🐕", nextLabel: "Sportif" },
  { min: 300,  label: "Sportif",   emoji: "🦮", nextLabel: "Champion" },
  { min: 700,  label: "Champion",  emoji: "🏅", nextLabel: "Légende" },
  { min: 1200, label: "Légende",   emoji: "👑", nextLabel: null },
];

function getLevel(pts) {
  let lvl = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) { if (pts >= t.min) lvl = t; }
  return lvl;
}
function getNextLevel(pts) {
  return LEVEL_THRESHOLDS.find(t => pts < t.min) || null;
}

// Animated counter hook
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      setValue(Math.round(from + eased * (target - from)));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}

function BadgeCard({ badge, unlocked, achv, dogName, index }) {
  const hint = badge.hint.replace("{name}", dogName || "ton chien");
  const cat = CATEGORY_COLORS[badge.category] || CATEGORY_COLORS.milestone;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.045 }}
      className={`relative rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center border transition-all overflow-hidden ${
        unlocked
          ? `bg-white border-2 shadow-sm ${cat.border}`
          : "bg-muted/30 border-border/60"
      }`}
    >
      {/* Glow for unlocked */}
      {unlocked && (
        <div className={`absolute inset-0 ${cat.bg} opacity-30 pointer-events-none`} />
      )}

      {/* Emoji */}
      <span
        className={`relative z-10 text-3xl leading-none transition-all ${
          !unlocked ? "grayscale opacity-30" : "drop-shadow-sm"
        }`}
        style={unlocked ? { filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" } : {}}
      >
        {badge.emoji}
      </span>

      {/* Name */}
      <p className={`relative z-10 text-[10px] font-bold leading-tight ${
        unlocked ? "text-foreground" : "text-muted-foreground/60"
      }`}>
        {badge.name}
      </p>

      {/* Points or unlock hint */}
      {unlocked ? (
        <>
          {badge.points > 0 && (
            <span className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              +{badge.points} pts
            </span>
          )}
          {achv?.unlocked_at && (
            <p className="relative z-10 text-[9px] text-muted-foreground">
              {new Date(achv.unlocked_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </p>
          )}
        </>
      ) : (
        <p className="relative z-10 text-[9px] text-muted-foreground/70 leading-tight px-0.5">
          {hint}
        </p>
      )}

      {/* Lock icon overlay for locked */}
      {!unlocked && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <Lock className="w-3 h-3 text-muted-foreground/30" />
        </div>
      )}
    </motion.div>
  );
}

export default function AchievementsSection({ dog }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!dog?.id) return;
    setLoading(true);
    base44.entities.DogAchievement
      .filter({ dog_id: dog.id }, "-unlocked_at", 100)
      .then(a => setAchievements(a || []))
      .finally(() => setLoading(false));
  }, [dog?.id]);

  const unlockedIds = new Set(achievements.map(a => a.badge_id));
  const totalPoints = achievements.reduce((s, a) => s + (a.points_awarded || 0), 0);
  const unlockedCount = unlockedIds.size;
  const level = getLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const progressPct = nextLevel
    ? Math.round(((totalPoints - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const animatedPoints = useCountUp(loading ? 0 : totalPoints, 900);
  const animatedUnlocked = useCountUp(loading ? 0 : unlockedCount, 700);

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];
  const filteredBadges = ALL_BADGES.filter(b =>
    selectedCategory === "all" || b.category === selectedCategory
  );

  // Sort: unlocked first, then locked
  const sortedBadges = [
    ...filteredBadges.filter(b => unlockedIds.has(b.id)),
    ...filteredBadges.filter(b => !unlockedIds.has(b.id)),
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-28 bg-muted animate-pulse rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Hero card ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-30%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[-5%] w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          {/* Top row: level + badge count */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{level.emoji}</span>
              <div>
                <p className="text-white font-black text-sm leading-none">{dog?.name}</p>
                <p className="text-white/70 text-xs mt-0.5">Niveau {level.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-black text-xl leading-none">{animatedUnlocked} <span className="text-white/50 font-semibold text-sm">/ {TOTAL_BADGES}</span></p>
              <p className="text-white/60 text-[10px]">badges débloqués</p>
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span className="text-white font-black text-sm">{animatedPoints}</span>
              <span className="text-white/60 text-xs">points</span>
            </div>
            {nextLevel && (
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1.5">
                <Zap className="w-3 h-3 text-white/60" />
                <span className="text-white/70 text-[10px]">{nextLevel.min - totalPoints} pts → {nextLevel.label}</span>
              </div>
            )}
            {!nextLevel && (
              <div className="flex items-center gap-1 bg-amber-400/20 rounded-full px-2.5 py-1.5">
                <span className="text-amber-300 text-[10px] font-bold">Niveau max atteint !</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {nextLevel && (
            <div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #34d399, #a7f3d0)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-white/40 mt-1">
                <span>{level.label} ({level.min} pts)</span>
                <span>{nextLevel.label} ({nextLevel.min} pts)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Category filter ────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => {
          const active = selectedCategory === cat;
          const col = cat !== "all" ? CATEGORY_COLORS[cat] : null;
          return (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.93 }}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                active
                  ? col
                    ? `${col.bg} ${col.border} ${col.text}`
                    : "bg-[#1A4D3E] border-[#1A4D3E] text-white"
                  : "bg-white border-border text-muted-foreground"
              }`}
            >
              {cat === "all" ? "Tous" : CATEGORY_LABELS[cat]}
            </motion.button>
          );
        })}
      </div>

      {/* ── Badges grid ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {sortedBadges.map((badge, i) => {
          const unlocked = unlockedIds.has(badge.id);
          const achv = achievements.find(a => a.badge_id === badge.id);
          return (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={unlocked}
              achv={achv}
              dogName={dog?.name}
              index={i}
            />
          );
        })}
      </div>

      {/* ── Motivational footer ───────────────────────────── */}
      {unlockedCount < TOTAL_BADGES && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl"
        >
          <span className="text-base">{sortedBadges.find(b => !unlockedIds.has(b.id))?.emoji || "🎯"}</span>
          <p className="text-xs text-emerald-700 font-medium flex-1">
            Prochain badge : <span className="font-bold">{sortedBadges.find(b => !unlockedIds.has(b.id))?.name}</span>
            {" — "}{sortedBadges.find(b => !unlockedIds.has(b.id))?.hint.replace("{name}", dog?.name || "ton chien")}
          </p>
          <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        </motion.div>
      )}
    </div>
  );
}
