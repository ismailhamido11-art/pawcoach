import { motion } from "framer-motion";
import StorysetIllustration from "@/components/ui/StorysetIllustration";
import { Heart, Footprints, Utensils, Star } from "lucide-react";

export default function HomeWellnessHero({ dog, todayCheckin, streak, dailyLogs = [] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayLog = dailyLogs.find(l => l.date === today);
  const walkMin = todayLog?.walk_minutes || 0;
  const streakDays = streak?.current_streak || 0;
  const mood = todayCheckin?.mood;
  const moodLabel = mood === 4 ? "Super" : mood === 3 ? "Bien" : mood === 2 ? "Bof" : mood === 1 ? "Pas top" : null;

  return (
    <div className="space-y-4">
      {/* Big illustrated wellness card — Gentler Streak style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100 via-emerald-50 to-amber-50 border border-emerald-200/40 shadow-sm">
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-amber-200/20 rounded-full blur-xl" />

        <div className="relative p-5 flex items-center gap-3">
          <StorysetIllustration name="welcome" className="w-36 h-36 flex-shrink-0 -ml-2 -my-2" />
          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-black text-primary leading-tight">
              {todayCheckin ? `${dog?.name} va bien !` : `Comment va ${dog?.name} ?`}
            </p>
            <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">
              {todayCheckin
                ? "Check-in fait. Chaque jour de suivi renforce le lien avec ton compagnon."
                : "Fais le check-in quotidien pour suivre son humeur et son energie."
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mini metric cards — 2x2 grid, Foodvisor style */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Heart}
          iconBg="bg-gradient-to-br from-rose-400 to-rose-500"
          label="Humeur"
          value={moodLabel || "---"}
          sub={todayCheckin ? "Aujourd'hui" : "Pas encore"}
        />
        <MetricCard
          icon={Footprints}
          iconBg="bg-gradient-to-br from-emerald-400 to-emerald-500"
          label="Balade"
          value={walkMin > 0 ? `${walkMin} min` : "0 min"}
          sub="Aujourd'hui"
        />
        <MetricCard
          icon={Star}
          iconBg="bg-gradient-to-br from-amber-400 to-amber-500"
          label="Streak"
          value={streakDays > 0 ? `${streakDays}j` : "---"}
          sub={streakDays > 0 ? "De suite" : "A lancer"}
        />
        <MetricCard
          icon={Utensils}
          iconBg="bg-gradient-to-br from-violet-400 to-violet-500"
          label="Repas"
          value={todayLog?.water_bowls > 0 ? `${todayLog.water_bowls}` : "---"}
          sub="Aujourd'hui"
        />
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-border/60 p-3.5 shadow-sm flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${iconBg}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-foreground leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label} · {sub}</p>
      </div>
    </motion.div>
  );
}
