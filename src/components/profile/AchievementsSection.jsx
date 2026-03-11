import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Lock } from "lucide-react";

// All possible badges definition
const ALL_BADGES = [
  // Walk badges
  { id: "first_walk", name: "Première balade", emoji: "🐾", points: 10, category: "walk", desc: "Enregistre ta première balade" },
  { id: "walk_30min", name: "Marcheur", emoji: "👟", points: 20, category: "walk", desc: "30 min de balade en une journée" },
  { id: "walk_7days", name: "Régulier", emoji: "📅", points: 50, category: "walk", desc: "Balades 7 jours consécutifs" },
  { id: "walk_100km", name: "Explorateur", emoji: "🗺️", points: 100, category: "walk", desc: "100 km de balades cumulées" },
  { id: "walk_marathon", name: "Ultra Marcheur", emoji: "🏅", points: 200, category: "walk", desc: "1000 min de balade au total" },
  // Training badges
  { id: "first_program", name: "Coach débutant", emoji: "✨", points: 15, category: "training", desc: "Génère ton premier programme IA" },
  { id: "training_week1", name: "Semaine 1 ✅", emoji: "💪", points: 40, category: "training", desc: "Complète la semaine 1 du programme" },
  { id: "training_complete", name: "Programme complet", emoji: "🏆", points: 150, category: "training", desc: "Finalise un programme 4 semaines" },
  { id: "training_3programs", name: "Coach expert", emoji: "🎓", points: 300, category: "training", desc: "Génère 3 programmes différents" },
  // Streak badges
  { id: "streak_3", name: "En forme", emoji: "🔥", points: 30, category: "streak", desc: "3 jours d'activité consécutifs" },
  { id: "streak_7", name: "Habitude", emoji: "⚡", points: 75, category: "streak", desc: "7 jours d'activité consécutifs" },
  { id: "streak_30", name: "Légende", emoji: "👑", points: 250, category: "streak", desc: "30 jours d'activité consécutifs" },
  // Milestone badges
  { id: "points_100", name: "100 points", emoji: "⭐", points: 0, category: "milestone", desc: "Atteindre 100 points" },
  { id: "points_500", name: "500 points", emoji: "🌟", points: 0, category: "milestone", desc: "Atteindre 500 points" },
  { id: "points_1000", name: "Maître PawCoach", emoji: "💎", points: 0, category: "milestone", desc: "Atteindre 1000 points" },
];

const CATEGORY_LABELS = {
  walk: "🐾 Balades",
  training: "💪 Entraînement",
  streak: "🔥 Régularité",
  milestone: "⭐ Jalons",
};

const LEVEL_THRESHOLDS = [
  { min: 0,    label: "Chiot",     color: "text-gray-500",    emoji: "🐶" },
  { min: 100,  label: "Compagnon", color: "text-green-600",   emoji: "🐕" },
  { min: 300,  label: "Sportif",   color: "text-blue-600",    emoji: "🦮" },
  { min: 700,  label: "Champion",  color: "text-purple-600",  emoji: "🏅" },
  { min: 1200, label: "Légende",   color: "text-amber-500",   emoji: "👑" },
];

function getLevel(points) {
  let lvl = LEVEL_THRESHOLDS[0];
  for (const t of LEVEL_THRESHOLDS) {
    if (points >= t.min) lvl = t;
  }
  return lvl;
}

function getNextLevel(points) {
  for (const t of LEVEL_THRESHOLDS) {
    if (points < t.min) return t;
  }
  return null;
}

export default function AchievementsSection({ dog }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!dog?.id) return;
    base44.entities.DogAchievement
      .filter({ dog_id: dog.id }, "-unlocked_at", 100)
      .then(a => setAchievements(a || []))
      .finally(() => setLoading(false));
  }, [dog?.id]);

  if (loading) return <div className="h-32 bg-muted animate-pulse rounded-2xl" />;

  const unlockedIds = new Set(achievements.map(a => a.badge_id));
  const totalPoints = achievements.reduce((s, a) => s + (a.points_awarded || 0), 0);
  const level = getLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const progress = nextLevel
    ? Math.round(((totalPoints - level.min) / (nextLevel.min - level.min)) * 100)
    : 100;

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];
  const filteredBadges = ALL_BADGES.filter(b => selectedCategory === "all" || b.category === selectedCategory);

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-2xl">
            {level.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-sm text-foreground">{dog?.name}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 ${level.color}`}>{level.label}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-black text-amber-700 text-sm">{totalPoints} pts</span>
              {nextLevel && <span className="text-[10px] text-muted-foreground">→ {nextLevel.min} pour {nextLevel.label}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-lg text-amber-600">{unlockedIds.size}</p>
            <p className="text-[10px] text-muted-foreground">badges</p>
          </div>
        </div>

        {/* Progress bar */}
        {nextLevel && (
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>{level.label}</span>
              <span>{totalPoints} / {nextLevel.min} pts</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        {!nextLevel && (
          <div className="flex items-center gap-2 text-xs text-amber-700 font-bold">
            <Trophy className="w-4 h-4" /> Niveau maximum atteint ! 👑
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-white border border-border text-muted-foreground"
            }`}
          >
            {cat === "all" ? "🏅 Tous" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-3 gap-2">
        {filteredBadges.map(badge => {
          const unlocked = unlockedIds.has(badge.id);
          const achv = achievements.find(a => a.badge_id === badge.id);
          return (
            <motion.div
              key={badge.id}
              whileTap={{ scale: 0.95 }}
              className={`relative rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center border transition-all ${
                unlocked
                  ? "bg-white border-amber-200 shadow-sm"
                  : "bg-muted/50 border-border"
              }`}
            >
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70 backdrop-blur-[2px] z-10">
                  <Lock className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
              <span className={`text-2xl leading-none ${!unlocked ? "grayscale opacity-40" : ""}`}>
                {badge.emoji}
              </span>
              <p className={`text-[10px] font-bold leading-tight ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {badge.name}
              </p>
              {badge.points > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  unlocked ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                }`}>
                  +{badge.points} pts
                </span>
              )}
              {unlocked && achv?.unlocked_at && (
                <p className="text-[10px] text-muted-foreground">
                  {new Date(achv.unlocked_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
              )}
              {!unlocked && (
                <p className={`text-[10px] text-muted-foreground leading-tight relative z-0`}>
                  {badge.desc}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}