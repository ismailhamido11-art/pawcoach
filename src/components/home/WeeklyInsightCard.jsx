import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, Check, Loader2, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { DogCurious } from "../ui/PawIllustrations";

function TrendBadge({ current, previous, label }) {
  if (!previous || current == null || previous == null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.1) return <Minus className="w-3 h-3 text-muted-foreground" />;
  const isUp = diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${isUp ? "text-emerald-600" : "text-amber-600"}`}>
      {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isUp ? "+" : ""}{diff.toFixed(1)}
    </span>
  );
}

export default function WeeklyInsightCard({ insight, previousInsight, pastInsights = [], dog, expanded, onToggle, onMarkRead, markingRead }) {
  const [showHistory, setShowHistory] = useState(false);
  const [expandedInsights, setExpandedInsights] = useState({});

  const toggleInsightExpand = (id) => {
    setExpandedInsights(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const parseSafe = (val) => {
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const formatWeekDate = (weekStart) => {
    if (!weekStart) return "cette semaine";
    return new Date(weekStart + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  // Show past insights section even if no current unread insight
  const hasContent = insight || pastInsights.length > 0;
  if (!hasContent) return null;

  const highlights = insight ? parseSafe(insight.highlights) : [];
  const recommendations = insight ? parseSafe(insight.recommendations) : [];
  const dateLabel = insight ? formatWeekDate(insight.week_start) : "";

  return (
    <div className="mx-5 space-y-3">
      {/* Current unread insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="rounded-3xl overflow-hidden border border-primary/15 shadow-sm"
          style={{ background: "linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))" }}
        >
          {/* Header */}
          <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              className="w-12 h-12 flex-shrink-0"
            >
              <DogCurious color="#2d9f82" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">Bilan de la semaine</p>
              <p className="text-xs text-muted-foreground">Semaine du {dateLabel} · {insight.checkin_count || 0} check-in{(insight.checkin_count || 0) > 1 ? "s" : ""}</p>
            </div>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* Stats with trends */}
          <div className="flex gap-2 px-4 pb-3">
            {insight.avg_mood != null && (
              <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xl font-black text-primary">{insight.avg_mood.toFixed(1)}</p>
                  <TrendBadge current={insight.avg_mood} previous={previousInsight?.avg_mood} />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">humeur moy.</p>
              </div>
            )}
            {insight.avg_energy != null && (
              <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xl font-black text-accent">{insight.avg_energy.toFixed(1)}</p>
                  <TrendBadge current={insight.avg_energy} previous={previousInsight?.avg_energy} />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">energie moy.</p>
              </div>
            )}
            {insight.checkin_count > 0 && (
              <div className="flex-1 bg-white/70 rounded-2xl px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xl font-black text-emerald-600">{insight.checkin_count}</p>
                  <TrendBadge current={insight.checkin_count} previous={previousInsight?.checkin_count} />
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">check-in{insight.checkin_count > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

          {/* Expandable content */}
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
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Points cles</p>
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
                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>
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
      )}

      {/* Past insights history */}
      {pastInsights.length > 0 && (
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <button
            onClick={() => setShowHistory(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Bilans passes ({pastInsights.length})</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2 border-t border-border">
                  {pastInsights.map((pi, i) => {
                    const piHighlights = parseSafe(pi.highlights);
                    const itemKey = pi.id || i;
                    const isItemExpanded = expandedInsights[itemKey];
                    return (
                      <div key={itemKey} className="py-3 border-b border-border/50 last:border-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-semibold text-foreground">
                            Semaine du {formatWeekDate(pi.week_start)}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {pi.avg_mood != null && <span>Humeur {pi.avg_mood.toFixed(1)}</span>}
                            {pi.checkin_count > 0 && <span>{pi.checkin_count} check-in{pi.checkin_count > 1 ? "s" : ""}</span>}
                          </div>
                        </div>
                        {pi.summary && (
                          <div>
                            <p className={`text-xs text-muted-foreground leading-relaxed ${isItemExpanded ? "" : "line-clamp-2"}`}>{pi.summary}</p>
                            <button
                              onClick={() => toggleInsightExpand(itemKey)}
                              className="text-[10px] text-primary font-medium mt-0.5 hover:underline"
                            >
                              {isItemExpanded ? "Reduire" : "Lire la suite"}
                            </button>
                          </div>
                        )}
                        {piHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {piHighlights.slice(0, 2).map((h, j) => (
                              <span key={j} className="text-[10px] bg-primary/5 text-primary/80 px-2 py-0.5 rounded-full">{h.slice(0, 50)}{h.length > 50 ? "..." : ""}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
