/**
 * DogTwinSection — Section bien-être du chien, intégrée dans l'accueil
 * Design sobre, dans le thème PawCoach (Nature Premium)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart, Zap, Utensils, Footprints } from "lucide-react";
import { useDogAvatarState } from "../dogtwin/useDogAvatarState";

const METRICS = [
  { id: "energy",   label: "Énergie",    icon: Zap,        color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200/60" },
  { id: "mood",     label: "Humeur",     icon: Heart,      color: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200/60" },
  { id: "appetite", label: "Appétit",    icon: Utensils,   color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-200/60" },
  { id: "activity", label: "Activité",   icon: Footprints, color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200/60" },
];

const moodLabel = {
  excited: { text: "Très heureux 🐾", color: "text-emerald-700", bg: "bg-emerald-50", bar: "bg-emerald-500" },
  happy:   { text: "En forme",        color: "text-emerald-600", bg: "bg-emerald-50", bar: "bg-emerald-400" },
  neutral: { text: "Calme",           color: "text-amber-700",   bg: "bg-amber-50",   bar: "bg-amber-400" },
  tired:   { text: "Fatigué",         color: "text-slate-500",   bg: "bg-slate-50",   bar: "bg-slate-300" },
};

// Calcule les scores individuels depuis les checkins
function getMetricScores(checkins) {
  if (!checkins?.length) return { energy: null, mood: null, appetite: null, activity: null };
  const recent = checkins.slice(0, 7);
  const avg = (key, max) => {
    const vals = recent.filter(c => c[key] != null).map(c => c[key]);
    if (!vals.length) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length / max) * 100);
  };
  return {
    mood:      avg("mood", 4),
    energy:    avg("energy", 3),
    appetite:  avg("appetite", 3),
    activity:  checkins.length >= 7 ? Math.round((recent.length / 7) * 100) : Math.round((recent.length / 7) * 100),
  };
}

export default function DogTwinSection({ dog, checkins = [], streak = null, records = [], scans = [] }) {
  const { healthScore, mood } = useDogAvatarState({ checkins, streak, records, scans });
  const [expanded, setExpanded] = useState(false);
  const scores = getMetricScores(checkins);
  const moodInfo = moodLabel[mood] || moodLabel.neutral;

  if (!dog) return null;

  return (
    <div className="px-4">
      <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">

        {/* Photo + identité + score global */}
        <div className="flex items-center gap-4 p-4">
          {/* Photo du chien */}
          <div className="relative flex-shrink-0">
            {dog.photo ? (
              <motion.img
                src={dog.photo}
                alt={dog.name}
                className="w-20 h-20 rounded-2xl object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center text-4xl">
                🐶
              </div>
            )}
            {/* Indicateur d'humeur */}
            <div className={`absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white shadow-sm ${moodInfo.bg} ${moodInfo.color}`}>
              {moodInfo.text}
            </div>
          </div>

          {/* Infos + score */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-foreground leading-tight truncate">{dog.name}</p>
            <p className="text-muted-foreground text-xs mt-0.5 truncate">
              {dog.breed}{dog.weight ? ` · ${dog.weight} kg` : ""}
            </p>

            {/* Barre de bien-être */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground font-medium">Bien-être global</span>
                <span className="text-xs font-bold text-primary">{healthScore}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton pour voir les métriques détaillées */}
        <button
          onClick={() => setExpanded(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
        >
          <span className="text-xs font-semibold text-foreground/70">Détails de la semaine</span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Métriques détaillées */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 p-4">
                {METRICS.map(m => {
                  const score = scores[m.id];
                  const Icon = m.icon;
                  return (
                    <div key={m.id} className={`rounded-2xl border p-3 ${m.bg} ${m.border}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                        <span className={`text-xs font-semibold ${m.color}`}>{m.label}</span>
                      </div>
                      {score != null ? (
                        <>
                          <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${score}%` }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              className={`h-full rounded-full ${moodInfo.bar}`}
                              style={{ background: undefined }}
                            />
                          </div>
                          <p className={`text-xs font-bold mt-1.5 ${m.color}`}>{score}%</p>
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-1">Pas encore de données</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}