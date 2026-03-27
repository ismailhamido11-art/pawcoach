import { motion } from "framer-motion";
import { Bone, Check, Share2, TrendingUp, TrendingDown, Minus, Smile, ThumbsUp, Meh, Frown, PawPrint } from "lucide-react";
import WalkShareCard from "./WalkShareCard";
import { PostWalkReviewPrompt } from "./ParkReviews";

const WALK_MOODS = [
  { id: "super", Icon: Smile,    iconColor: "text-emerald-500", label: "Super" },
  { id: "good",  Icon: ThumbsUp, iconColor: "text-emerald-600", label: "Bien" },
  { id: "calm",  Icon: Meh,      iconColor: "text-slate-400",   label: "Calme" },
  { id: "hard",  Icon: Frown,    iconColor: "text-amber-500",   label: "Difficile" },
];
const WALK_TAGS = ["Tirait en laisse", "Bon rappel", "Sociable", "Distrait", "Très calme", "Énergique"];

function getWalkInsight(minutes, logs, dogName) {
  const name = dogName || "ton chien";
  const recentLogs = (logs || []).filter(l => l.walk_minutes > 0).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14);
  const avgMinutes = recentLogs.length > 0 ? Math.round(recentLogs.reduce((s, l) => s + l.walk_minutes, 0) / recentLogs.length) : 0;
  const walkDaysThisWeek = recentLogs.filter(l => {
    const d = new Date(l.date + "T00:00:00");
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff < 7;
  }).length;

  const diff = avgMinutes > 0 ? Math.round(((minutes - avgMinutes) / avgMinutes) * 100) : 0;
  let trend = null;
  if (avgMinutes > 0 && diff > 15) trend = { icon: TrendingUp, color: "text-emerald-600", text: `+${diff}% vs ta moyenne (${avgMinutes} min)` };
  else if (avgMinutes > 0 && diff < -15) trend = { icon: TrendingDown, color: "text-amber-600", text: `${diff}% vs ta moyenne (${avgMinutes} min)` };
  else if (avgMinutes > 0) trend = { icon: Minus, color: "text-blue-600", text: `Dans ta moyenne (${avgMinutes} min)` };

  let insight = "";
  if (minutes >= 45) insight = `Super sortie ! ${name} a eu sa dose d'activité pour la journée.`;
  else if (minutes >= 30) insight = `Objectif atteint ! 30 min de balade, c'est l'idéal pour la santé de ${name}.`;
  else if (minutes >= 15) insight = `Bonne balade ! Pour maximiser les bénéfices, vise 30 min la prochaine fois.`;
  else insight = `Petite sortie rapide — chaque minute compte pour ${name} !`;

  let streak = "";
  if (walkDaysThisWeek >= 5) streak = `${walkDaysThisWeek} balades cette semaine — régularité exemplaire !`;
  else if (walkDaysThisWeek >= 3) streak = `${walkDaysThisWeek} balades cette semaine — belle constance.`;

  return { trend, insight, streak };
}

/**
 * WalkSummary — post-walk "done" screen extracted from WalkMode.jsx
 *
 * Props:
 * - savedMinutes: number
 * - km: string | null
 * - dogCalories: number | null
 * - kibbleEquiv: number | null
 * - saving: boolean
 * - dog: object
 * - logs: array
 * - user: object
 * - nearPark: object | null
 * - walkMood: string | null
 * - selectedMoodTags: string[]
 * - moodSaved: boolean
 * - showShare: boolean
 * - onSaveMood: () => void
 * - onReset: () => void
 * - onSetShowShare: (v: boolean) => void
 * - onSetWalkMood: (id: string) => void
 * - onSetSelectedMoodTags: (updater: fn) => void
 * - onSetMoodSaved: (v: boolean) => void
 * - onViewHistory: (() => void) | undefined
 */
export default function WalkSummary({
  savedMinutes,
  km,
  dogCalories,
  kibbleEquiv,
  saving,
  dog,
  logs,
  user,
  nearPark,
  walkMood,
  selectedMoodTags,
  moodSaved,
  showShare,
  onSaveMood,
  onReset,
  onSetShowShare,
  onSetWalkMood,
  onSetSelectedMoodTags,
  onViewHistory,
}) {
  const walkInfo = savedMinutes ? getWalkInsight(savedMinutes, logs, dog?.name) : null;

  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="flex flex-col items-center gap-5 w-full text-center"
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, -5, 0] }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center justify-center"
      >
        <PawPrint className="w-16 h-16 text-emerald-600" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-black text-foreground">Balade terminee !</h2>
        <p className="text-muted-foreground text-sm mt-1">Super balade avec {dog?.name}</p>
      </div>
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-5 w-full space-y-3">
        <div className="flex justify-around">
          <div>
            <div className="text-3xl font-black text-primary">{savedMinutes}</div>
            <div className="text-xs text-muted-foreground">minutes</div>
          </div>
          {km && (
            <div>
              <div className="text-3xl font-black text-accent">{km}</div>
              <div className="text-xs text-muted-foreground">km</div>
            </div>
          )}
          <div>
            <div className="text-3xl font-black text-caution">{Math.round((savedMinutes || 0) * 5)}</div>
            <div className="text-xs text-muted-foreground">cal. est.</div>
          </div>
        </div>
        {kibbleEquiv > 0 && (
          <div className="flex items-center justify-center gap-1.5 bg-white/60 rounded-xl py-1.5 px-3">
            <Bone className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-foreground">= {kibbleEquiv} croquettes brulees</span>
          </div>
        )}
        {saving ? (
          <div className="text-xs text-muted-foreground animate-pulse">Sauvegarde en cours...</div>
        ) : (
          <div className="text-xs text-accent font-semibold flex items-center gap-1"><Check className="w-3 h-3" /> Enregistre dans le journal</div>
        )}
      </div>

      {/* Walk Intelligence */}
      {walkInfo && (
        <>
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 30 }}
            className="bg-white border border-border rounded-2xl p-4 w-full space-y-2 text-left"
          >
            {walkInfo.trend && (
              <div className="flex items-center gap-2">
                <walkInfo.trend.icon className={`w-4 h-4 ${walkInfo.trend.color} flex-shrink-0`} />
                <p className={`text-xs font-bold ${walkInfo.trend.color}`}>{walkInfo.trend.text}</p>
              </div>
            )}
            <p className="text-xs text-foreground/80 leading-relaxed">{walkInfo.insight}</p>
            {walkInfo.streak && (
              <p className="text-[11px] font-bold text-primary">{walkInfo.streak}</p>
            )}
          </motion.div>

          {/* Post-walk park review prompt */}
          {nearPark && (
            <PostWalkReviewPrompt park={nearPark} dog={dog} user={user} />
          )}

          {/* Walk Mood Tracker */}
          {!moodSaved ? (
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white border border-border rounded-2xl p-4 w-full space-y-3"
            >
              <p className="text-xs font-bold text-foreground">Comment s'est passee la balade ?</p>
              <div className="flex justify-center gap-3">
                {WALK_MOODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => onSetWalkMood(m.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                      walkMood === m.id ? "bg-primary/10 ring-2 ring-primary scale-105" : "hover:bg-secondary/40"
                    }`}
                  >
                    {(() => { const MI = m.Icon; return <MI className={`w-6 h-6 ${m.iconColor}`} />; })()}
                    <span className="text-[11px] font-bold text-muted-foreground">{m.label}</span>
                  </button>
                ))}
              </div>
              {walkMood && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-2 overflow-hidden">
                  <p className="text-[11px] font-bold text-muted-foreground">Comportement (optionnel)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {WALK_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => onSetSelectedMoodTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        )}
                        className={`text-[11px] font-semibold px-2.5 py-2 rounded-full transition-all ${
                          selectedMoodTags.includes(tag)
                            ? "bg-primary text-white"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onSaveMood}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white gradient-primary"
                  >
                    Enregistrer
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl py-2.5 px-4 flex items-center justify-center gap-2"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Humeur enregistree</span>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3 w-full">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onSetShowShare(true)}
              className="py-3.5 rounded-2xl font-bold text-sm border-2 border-primary/30 bg-white text-primary flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </motion.button>
            <button
              onClick={onReset}
              className="py-3.5 rounded-2xl font-bold text-sm text-white gradient-primary"
            >
              Nouvelle balade
            </button>
          </div>

          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="text-xs text-muted-foreground underline underline-offset-2"
            >
              Voir l'historique des balades
            </button>
          )}

          {showShare && (
            <WalkShareCard
              minutes={savedMinutes}
              km={km}
              calories={dogCalories || Math.round((savedMinutes || 0) * 5)}
              dogName={dog?.name}
              streak={walkInfo.streak}
              kibbleEquiv={kibbleEquiv}
              onClose={() => onSetShowShare(false)}
            />
          )}
        </>
      )}
    </motion.div>
  );
}
