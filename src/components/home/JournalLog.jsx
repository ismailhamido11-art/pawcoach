import { motion } from "framer-motion";
import { MOOD_OPTIONS, ENERGY_OPTIONS } from "./CheckinCard";

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

const MOOD_BARS = {
  1: { w: "25%", color: "#ef4444" },
  2: { w: "50%", color: "#f59e0b" },
  3: { w: "75%", color: "#10b981" },
  4: { w: "100%", color: "#ec4899" },
};

const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const itemVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120 } },
};

export default function JournalLog({ checkins, todayCheckin }) {
  const items = checkins.slice(todayCheckin ? 1 : 0, 6);
  if (items.length === 0) return null;

  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Journal de bord
      </p>
      <motion.div className="space-y-2" variants={stagger} initial="hidden" animate="show">
        {items.map((c, i) => {
          const moodOpt = MOOD_OPTIONS.find(m => m.value === c.mood);
          const energyOpt = ENERGY_OPTIONS.find(e => e.value === c.energy);
          const moodBar = MOOD_BARS[c.mood];
          return (
            <motion.div
              key={i}
              variants={itemVariant}
              className="bg-white rounded-2xl px-4 py-3 border border-border/30 shadow-sm overflow-hidden relative"
            >
              {/* Barre colorée latérale */}
              {moodBar && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ background: moodBar.color }}
                />
              )}
              <div className="flex items-center gap-3 pl-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {moodOpt && (
                      <span className="text-xs font-semibold" style={{ color: moodOpt.color }}>
                        {moodOpt.label}
                      </span>
                    )}
                    {energyOpt && (
                      <span className="text-xs text-muted-foreground">· {energyOpt.label}</span>
                    )}
                  </div>
                  {/* Mini bar d'humeur */}
                  {moodBar && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden w-20">
                      <div className="h-full rounded-full" style={{ width: moodBar.w, background: moodBar.color }} />
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 font-medium">
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