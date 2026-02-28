import { motion } from "framer-motion";
import { MOOD_OPTIONS, ENERGY_OPTIONS, APPETITE_OPTIONS } from "./CheckinCard";

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const today = getTodayString();
  if (dateStr === today) return "Aujourd'hui";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.getFullYear() + "-" + String(yesterday.getMonth() + 1).padStart(2, "0") + "-" + String(yesterday.getDate()).padStart(2, "0");
  if (dateStr === yStr) return "Hier";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

const MOOD_EMOJI = { 1: "😔", 2: "😐", 3: "😊", 4: "🤩" };
const ENERGY_EMOJI = { 1: "😴", 2: "🚶", 3: "🏃" };
const APPETITE_EMOJI = { 1: "🙁", 2: "😌", 3: "😋" };

const stagger = { show: { transition: { staggerChildren: 0.06 } } };
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
};

export default function JournalLog({ checkins, todayCheckin }) {
  const items = checkins.slice(todayCheckin ? 1 : 0, 6);
  if (items.length === 0) return null;

  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Journal des 7 derniers jours
      </p>
      <motion.div className="space-y-2" variants={stagger} initial="hidden" animate="show">
        {items.map((c, i) => {
          const moodOpt = MOOD_OPTIONS.find(m => m.value === c.mood);
          const energyOpt = ENERGY_OPTIONS.find(e => e.value === c.energy);
          const appetiteOpt = APPETITE_OPTIONS.find(a => a.value === c.appetite);
          const color = moodOpt?.color || "#94a3b8";

          return (
            <motion.div
              key={i}
              variants={itemVariant}
              className="bg-white rounded-2xl overflow-hidden border border-border/30 shadow-sm"
            >
              {/* Color accent top */}
              <div className="h-0.5" style={{ background: color }} />

              <div className="flex items-center gap-3 px-4 py-3">
                {/* Mood emoji big */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ background: `${color}15` }}>
                  {MOOD_EMOJI[c.mood]}
                </div>

                {/* Center: labels */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold" style={{ color }}>{moodOpt?.label || "—"}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{ENERGY_EMOJI[c.energy]} {energyOpt?.label}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{APPETITE_EMOJI[c.appetite]} {appetiteOpt?.label}</span>
                  </div>
                  {/* Mini bar */}
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-1 flex-1 rounded-full"
                        style={{ background: j < c.mood ? color : "#e2e8f0" }} />
                    ))}
                  </div>
                </div>

                {/* Date */}
                <span className="text-xs text-muted-foreground font-medium flex-shrink-0">
                  {formatDateLabel(c.date)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}