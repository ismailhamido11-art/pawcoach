import { Check, ChevronDown, ChevronUp, Clock, BookOpen, Lightbulb, Eye, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDaysToDate, formatDateFr } from "@/utils/dateHelpers";
import { ACTIVITY_ICONS } from "@/utils/programHelpers";

function isSameDay(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === now.getTime();
}

export default function DayCard({ day, dayIdx, isOpen, onToggle, startDate, isDone, onToggleComplete }) {
  const realDate = startDate ? addDaysToDate(startDate, dayIdx) : null;
  const today = realDate ? isSameDay(realDate) : false;
  const actType = day.activity?.type || "balade";
  const actIcon = ACTIVITY_ICONS[actType] || ACTIVITY_ICONS["balade"];
  const ActIcon = actIcon.Icon;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
      isDone ? "border-emerald-200" : today ? "border-violet-300 shadow-violet-100" : "border-border"
    }`}>
      <div className="flex items-start gap-3 p-4">
        {startDate && onToggleComplete && (
          <button
            aria-label={isDone ? "Marquer comme non fait" : "Marquer comme fait"}
            onClick={(e) => { e.stopPropagation(); onToggleComplete(); }}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              isDone ? "bg-emerald-500 border-emerald-500" : "border-border/60 hover:border-violet-400"
            }`}
          >
            {isDone && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
        )}

        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {realDate ? formatDateFr(realDate) : `Jour ${dayIdx + 1}`}
            </span>
            {today && <span className="text-[11px] font-bold bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full leading-none">Aujourd'hui</span>}
            {isDone && <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full leading-none">Fait</span>}
          </div>
          <div className="flex items-center gap-2">
            <ActIcon className={`w-5 h-5 ${actIcon.color} flex-shrink-0`} />
            <p className={`text-sm font-bold flex-1 ${isDone ? "text-muted-foreground" : "text-foreground"}`}>
              {day.title || day.activity?.name || `Jour ${dayIdx + 1}`}
            </p>
            <span className="text-[11px] font-bold text-primary flex items-center gap-0.5 flex-shrink-0">
              <Clock className="w-3 h-3" />{day.activity?.duration_min || 20} min
            </span>
          </div>
          {!isOpen && day.fun_fact && (
            <p className="text-[11px] text-amber-700/70 mt-1.5 line-clamp-1 italic ml-7 flex items-center gap-1"><BookOpen className="w-3 h-3 inline flex-shrink-0" /> {day.fun_fact}</p>
          )}
        </button>

        <button aria-label={isOpen ? "Réduire" : "Développer"} onClick={onToggle} className="flex-shrink-0 mt-1">
          {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {day.theme && <p className="text-[11px] font-bold text-violet-600 uppercase tracking-wider">{day.theme}</p>}

              <div className="bg-violet-50/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <ActIcon className={`w-5 h-5 ${actIcon.color} flex-shrink-0`} />
                  <p className="text-xs font-bold text-foreground">{day.activity?.name}</p>
                  <span className="text-[11px] text-muted-foreground capitalize ml-auto">{actType}</span>
                </div>
                {day.activity?.description && <p className="text-xs text-foreground/80 leading-relaxed">{day.activity.description}</p>}
                {day.activity?.steps?.length > 0 && (
                  <div className="space-y-1.5 mt-1">
                    {day.activity.steps.map((step, i) => (
                      <div key={`step-${i}`} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[11px] font-black text-violet-700">{i + 1}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {day.fun_fact && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Le savais-tu ?</p>
                  <p className="text-xs text-amber-900/80 leading-relaxed">{day.fun_fact}</p>
                </div>
              )}
              {day.coach_tip && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1.5"><Lightbulb className="w-3 h-3" /> Conseil du coach</p>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">{day.coach_tip}</p>
                </div>
              )}
              {day.observe && (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-[11px] font-bold text-blue-700 mb-1 flex items-center gap-1.5"><Eye className="w-3 h-3" /> Observe</p>
                  <p className="text-xs text-blue-900/80 leading-relaxed">{day.observe}</p>
                </div>
              )}
              {day.bonus_challenge && (
                <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                  <p className="text-[11px] font-bold text-purple-700 mb-1 flex items-center gap-1.5"><Star className="w-3 h-3" /> Défi bonus</p>
                  <p className="text-xs text-purple-900/80 leading-relaxed">{day.bonus_challenge}</p>
                </div>
              )}
              {day.motivation && <p className="text-xs text-violet-600 italic text-center pt-1">{day.motivation}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
