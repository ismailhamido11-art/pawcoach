import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

const BADGE_DESCRIPTIONS = {
  first_walk:         "Première sortie enregistrée — le voyage commence.",
  walk_30min:         "30 min de balade en une journée, c'est solide.",
  walk_7days:         "7 jours de suite à sortir — la régularité paie.",
  walk_marathon:      "1000 minutes de balade au compteur. Impressionnant.",
  first_program:      "Premier programme d'entraînement IA généré.",
  training_3programs: "3 programmes différents créés — un vrai coach.",
  streak_3:           "3 jours d'activité consécutifs — bonne dynamique.",
  streak_7:           "7 jours sans interruption. L'habitude est là.",
  streak_30:          "30 jours de suite. Un engagement hors-normes.",
  points_100:         "Cap des 100 points franchi.",
  points_500:         "500 points — niveau intermédiaire dépassé.",
  points_1000:        "1000 points. Maître PawCoach officiel.",
};

function timeAgo(isoDate) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 30) return `il y a ${Math.floor(days / 7)} sem.`;
  return `il y a ${Math.floor(days / 30)} mois`;
}

export default function AchievementFeed({ dog }) {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dog?.id) {
      setLoading(false);
      return;
    }
    base44.entities.DogAchievement
      .filter({ dog_id: dog.id }, "-unlocked_at", 5)
      .then((a) => setRecent(a || []))
      .catch(() => setRecent([]))
      .finally(() => setLoading(false));
  }, [dog?.id]);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">
          Dernières récompenses
        </p>
      </div>

      {recent.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-4 text-center"
        >
          <p className="text-sm font-semibold text-amber-700 mb-1">
            Tes premières récompenses arrivent bientôt !
          </p>
          <p className="text-xs text-muted-foreground">
            Enregistre une balade ou complète un exercice pour décrocher ton premier badge.
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {recent.map((a) => {
            const desc =
              BADGE_DESCRIPTIONS[a.badge_id] ||
              a.badge_name ||
              "Badge débloqué.";
            return (
              <motion.div
                key={a.id}
                variants={itemVariants}
                className="flex items-center gap-3 bg-white border border-amber-100 rounded-xl px-3.5 py-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl flex-shrink-0">
                  {a.badge_emoji || "🏅"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {a.badge_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-1">
                    {desc}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {a.unlocked_at ? timeAgo(a.unlocked_at) : ""}
                  </p>
                  {a.points_awarded > 0 && (
                    <p className="text-[10px] font-bold text-amber-600 mt-0.5">
                      +{a.points_awarded} pts
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
