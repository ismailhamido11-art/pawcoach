import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Check, Loader2 } from "lucide-react";
import { DogCurious } from "../ui/PawIllustrations";

export default function WeeklyInsightCard({ insight, dog, expanded, onToggle, onMarkRead, markingRead }) {
  if (!insight) return null;

  const parseSafe = (val) => {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const highlights = parseSafe(insight.highlights);
  const recommendations = parseSafe(insight.recommendations);
  const dateLabel = insight.week_start
    ? new Date(insight.week_start + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : "cette semaine";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: "spring" }}
      className="mx-5 rounded-3xl overflow-hidden border border-primary/15 shadow-sm"
      style={{ background: "linear-gradient(135deg, #f0fdf9, #fefce8)" }}
    >
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0"
        >
          <Sparkles className="w-5 h-5 text-primary" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm">Bilan de la semaine ✨</p>
          <p className="text-xs text-muted-foreground">Semaine du {dateLabel} · {insight.checkin_count || 0} check-ins</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {/* Stats rapides toujours visibles */}
      <div className="flex gap-2 px-4 pb-3">
        {insight.avg_mood && (
          <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-black text-primary">{insight.avg_mood.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">humeur moy.</p>
          </div>
        )}
        {insight.avg_energy && (
          <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-black text-accent">{insight.avg_energy.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground font-medium">énergie moy.</p>
          </div>
        )}
        {insight.checkin_count > 0 && (
          <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-xl font-black text-emerald-600">{insight.checkin_count}</p>
            <p className="text-[10px] text-muted-foreground font-medium">check-ins</p>
          </div>
        )}
      </div>

      {/* Contenu dépliable */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-primary/10 pt-3">
              {insight.summary && (
                <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
              )}

              {highlights.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Points clés</p>
                  <div className="space-y-1.5">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-0.5 flex-shrink-0 text-xs">●</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recommandations</p>
                  <div className="space-y-1.5">
                    {recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0 text-xs">✓</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onMarkRead}
                disabled={markingRead}
                className="w-full py-3 rounded-2xl bg-white border border-primary/20 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
              >
                {markingRead ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Marquer comme lu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}