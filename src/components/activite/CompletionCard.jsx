import { Button } from "@/components/ui/button";
import {
  Sparkles, Check, CheckCircle2, ArrowRight, PawPrint,
  Heart, Zap, Wind, Dumbbell, Brain, Target,
  PartyPopper, Star, Medal,
  Frown, Meh, Smile, ThumbsUp, Laugh,
  MessageSquare, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const GOAL_SUGGESTIONS = [
  { label: "Renforcer le lien", Icon: Heart, color: "text-rose-500" },
  { label: "Dépenser son énergie", Icon: Zap, color: "text-amber-500" },
  { label: "Calme et relaxation", Icon: Wind, color: "text-blue-500" },
  { label: "Perdre du poids", Icon: Dumbbell, color: "text-emerald-600" },
  { label: "Stimulation mentale", Icon: Brain, color: "text-violet-600" },
  { label: "Obéissance de base", Icon: Target, color: "text-emerald-700" },
];

const FEELING_OPTIONS = [
  { Icon: Frown, iconColor: "text-slate-400", label: "Pas convaincu" },
  { Icon: Meh, iconColor: "text-amber-400", label: "Correct" },
  { Icon: Smile, iconColor: "text-emerald-500", label: "Bien" },
  { Icon: ThumbsUp, iconColor: "text-emerald-600", label: "Super" },
  { Icon: Laugh, iconColor: "text-emerald-700", label: "Incroyable" },
];

function getCoachInsight(feeling, observedCount, totalIndicators, dogName) {
  const name = dogName || "ton chien";
  if (feeling >= 4 && observedCount >= 2) {
    return { Icon: Star, iconColor: "text-amber-500", title: "Progression remarquable", message: `${observedCount}/${totalIndicators} signes de progression observés — ${name} et toi formez une super équipe. Le prochain programme va consolider ces acquis.` };
  }
  if (feeling >= 3 || observedCount >= 1) {
    return { Icon: Zap, iconColor: "text-emerald-600", title: "Beau parcours", message: `Les résultats commencent à se voir ! Continue sur cette lancée avec ${name} — la régularité est la clé.` };
  }
  if (feeling >= 1) {
    return { Icon: Compass, iconColor: "text-emerald-500", title: "Les bases sont posées", message: `Chaque programme renforce ta relation avec ${name}. Les vrais résultats arrivent souvent au 2e ou 3e programme — persévère.` };
  }
  return { Icon: PawPrint, iconColor: "text-emerald-600", title: "Premier pas franchi", message: `Tu as pris le temps de t'investir pour ${name} — c'est déjà énorme. Le prochain programme s'adaptera à tes observations.` };
}

/**
 * CompletionCard — composant extrait de AITrainingProgram.jsx
 *
 * Props:
 * - program: objet programme actif
 * - dog: objet chien
 * - totalMinutes: nombre total de minutes du programme
 * - bilanState: { observed, setObserved, feeling, setFeeling, feedback, setFeedback, nextFocus, setNextFocus, bilanSaved }
 * - onSaveBilan: () => void
 * - onNewProgram: () => void
 * - bilanJustSaved: boolean
 */
export default function CompletionCard({ program, dog, totalMinutes, bilanState, onSaveBilan, onNewProgram, bilanJustSaved }) {
  const { observed, setObserved, feeling, setFeeling, feedback, setFeedback, nextFocus, setNextFocus, bilanSaved } = bilanState;
  const CONFETTI_ICONS = [PartyPopper, Star, PawPrint, Zap, Medal];
  const confetti = Array.from({ length: 10 }, (_, i) => ({
    x: 10 + Math.random() * 80,
    delay: Math.random() * 0.6,
    IconComp: CONFETTI_ICONS[i % 5],
  }));

  const totalIndicators = program.progression_indicators?.length || 0;
  const insight = bilanSaved ? getCoachInsight(feeling, observed.length, totalIndicators, dog?.name) : null;

  return (
    <div className="space-y-4 pb-8">
      {/* Celebration header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white text-center relative overflow-hidden"
      >
        {confetti.map((c, i) => (
          <motion.span
            key={i}
            className="absolute pointer-events-none"
            style={{ left: `${c.x}%`, top: -10 }}
            initial={{ y: -10, opacity: 1, rotate: 0 }}
            animate={{ y: 180, opacity: 0, rotate: 360 }}
            transition={{ duration: 2.5 + Math.random(), delay: c.delay, ease: "easeOut" }}
          >
            <c.IconComp className="w-5 h-5 text-white/80" />
          </motion.span>
        ))}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex justify-center mb-3"
        >
          <PartyPopper className="w-12 h-12 text-white" />
        </motion.div>
        <h3 className="font-bold text-xl relative">Programme terminé !</h3>
        <p className="text-white/80 text-sm mt-2 relative">
          Bravo ! Tu as complété les 7 jours avec {dog?.name || "ton chien"}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="font-bold text-lg text-emerald-700">7/7</p>
          <p className="text-[11px] text-emerald-600 font-bold">Jours</p>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-violet-50 rounded-xl p-3 text-center border border-violet-100">
          <p className="font-bold text-lg text-violet-700">{totalMinutes}</p>
          <p className="text-[11px] text-violet-600 font-bold">Minutes</p>
        </motion.div>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
          <p className="font-bold text-lg text-amber-700">{program.days?.length || 7}</p>
          <p className="text-[11px] text-amber-600 font-bold">Activités</p>
        </motion.div>
      </div>

      {/* What was worked on */}
      <div className="bg-white border border-border rounded-2xl p-4">
        <p className="font-bold text-sm mb-2">Ce que tu as travaillé</p>
        <div className="space-y-1.5">
          {program.days?.map((d, i) => (
            <div key={d.theme || d.title || i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <p className="text-xs text-foreground/80">{d.theme || d.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bilan ─── */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50 border border-blue-200 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <p className="font-bold text-sm text-foreground">Ton bilan</p>
        </div>

        {/* Progression indicators check */}
        {program.progression_indicators?.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">
              As-tu observé ces signes chez {dog?.name} ?
            </p>
            <div className="space-y-1.5">
              {program.progression_indicators.map((ind, i) => {
                const checked = observed.includes(i);
                return (
                  <button
                    key={`ind-${i}`}
                    onClick={() => !bilanSaved && setObserved(prev => checked ? prev.filter(x => x !== i) : [...prev, i])}
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-xl border transition-colors ${
                      checked ? "bg-blue-100 border-blue-300" : "bg-white border-border hover:border-blue-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      checked ? "bg-blue-600 border-blue-600" : "border-border/60"
                    }`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-xs text-foreground/80">{ind}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feeling scale */}
        <div>
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Comment te sens-tu par rapport à ta relation avec {dog?.name} ?
          </p>
          <div className="flex justify-between gap-1">
            {FEELING_OPTIONS.map((opt, i) => (
              <button
                key={i}
                onClick={() => !bilanSaved && setFeeling(i + 1)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${
                  feeling === i + 1 ? "bg-blue-100 border-blue-300 scale-105" : "bg-white border-border hover:border-blue-200"
                }`}
              >
                {(() => { const FI = opt.Icon; return <FI className={`w-5 h-5 ${opt.iconColor}`} />; })()}
                <span className="text-xs text-muted-foreground leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Open feedback */}
        <div>
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Un mot sur ton expérience ? (optionnel)
          </p>
          <textarea
            value={feedback}
            onChange={e => !bilanSaved && setFeedback(e.target.value)}
            readOnly={bilanSaved}
            placeholder={`Ex: ${dog?.name || "Mon chien"} est beaucoup plus calme en balade, le jeu des gobelets est devenu son préféré…`}
            className="w-full text-xs border border-blue-200 rounded-xl px-3 py-2 bg-white resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Next focus goals */}
        <div>
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-2">
            Sur quoi te concentrer ensuite ?
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_SUGGESTIONS.map(({ label, Icon: GI, color }) => {
              const selected = nextFocus.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => !bilanSaved && setNextFocus(prev => selected ? prev.filter(g => g !== label) : [...prev, label])}
                  className={`text-[11px] font-bold px-2.5 py-2.5 rounded-full transition-all flex items-center gap-1 ${
                    selected ? "bg-blue-600 text-white" : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                  }`}
                >
                  <GI className={`w-3 h-3 ${selected ? "text-white" : color}`} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save bilan */}
        {!bilanSaved ? (
          <Button onClick={onSaveBilan} className="w-full gradient-primary border-0 text-white" size="sm">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Enregistrer mon bilan
          </Button>
        ) : (
          <motion.div
            initial={bilanJustSaved ? { scale: 0.9, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex items-center justify-center gap-2 py-2.5 text-blue-700 text-sm font-bold"
          >
            <motion.div animate={bilanJustSaved ? { scale: [0, 1.3, 1] } : {}} transition={{ duration: 0.4 }}>
              <CheckCircle2 className="w-5 h-5" />
            </motion.div>
            Bilan enregistré !
          </motion.div>
        )}
      </div>

      {/* ─── Post-Bilan: Coach Insight ─── */}
      {bilanSaved && insight && (
        <motion.div
          initial={bilanJustSaved ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: bilanJustSaved ? 0.3 : 0, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <motion.div
              className="flex-shrink-0"
              animate={bilanJustSaved ? { scale: [0, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.6, delay: bilanJustSaved ? 0.5 : 0 }}
            >
              {(() => { const II = insight.Icon; return <II className={`w-6 h-6 ${insight.iconColor}`} />; })()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-emerald-800">{insight.title}</p>
              <p className="text-xs text-emerald-700/80 leading-relaxed mt-1">{insight.message}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Post-Bilan: Next Chapter CTA ─── */}
      {bilanSaved ? (
        <motion.div
          initial={bilanJustSaved ? { y: 24, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: bilanJustSaved ? 0.7 : 0, type: "spring", stiffness: 400, damping: 30 }}
          className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-200" />
            <p className="font-bold text-base">Ton prochain chapitre</p>
          </div>
          {nextFocus.length > 0 ? (
            <>
              <p className="text-white/80 text-xs leading-relaxed">
                Prochain focus : <strong>{nextFocus.join(", ")}</strong>. Le programme sera taillé sur mesure.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {nextFocus.map(f => {
                  const gs = GOAL_SUGGESTIONS.find(g => g.label === f);
                  return (
                    <span key={f} className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-2 rounded-full flex items-center gap-1">
                      {gs && (() => { const GI2 = gs.Icon; return <GI2 className="w-3 h-3 text-white" />; })()}
                      {f}
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-white/80 text-xs leading-relaxed">
              Laisse le coach te surprendre avec un programme adapté aux progrès de {dog?.name || "ton chien"}.
            </p>
          )}
          <Button onClick={onNewProgram} className="w-full bg-white text-violet-700 hover:bg-violet-50 font-bold" size="sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Lancer mon prochain programme
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      ) : (
        <Button
          onClick={onNewProgram}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Nouveau programme 7 jours
        </Button>
      )}
    </div>
  );
}
