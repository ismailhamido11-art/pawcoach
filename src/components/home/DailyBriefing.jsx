import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTodayString } from "@/utils/recommendations";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Footprints, PawPrint, ScanLine, Dumbbell, MessageCircle } from "lucide-react";

const MOOD_OPTIONS = [
  { value: 5, emoji: "😄", label: "Super" },
  { value: 4, emoji: "🙂", label: "Bien" },
  { value: 3, emoji: "😐", label: "Bof" },
  { value: 2, emoji: "😟", label: "Pas top" },
];

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "matin";
  if (h < 18) return "apres-midi";
  return "soir";
}

function generateBriefing({ dog, recentCheckins, dailyLogs, streak, todayCheckin, recommendations }) {
  const name = dog?.name || "ton chien";
  const breed = dog?.breed || "";
  const time = getTimeGreeting();
  const today = getTodayString();
  const todayLog = dailyLogs.find(l => l.date === today);
  const walkDone = (todayLog?.walk_minutes || 0) > 0;
  const streakDays = streak?.current_streak || 0;
  const lastCheckin = recentCheckins[0];

  let message = "";
  let mission = null;

  // Generate contextual message based on real data
  if (!todayCheckin && !lastCheckin) {
    // New user, no data yet
    message = `Bienvenue ! C'est le debut de l'aventure avec ${name}. Commence par me dire comment il va.`;
    mission = { type: "checkin", label: "Premier check-in", sub: `Comment va ${name} ?` };
  } else if (!todayCheckin && lastCheckin) {
    // Returning user, no check-in today
    const lastMood = lastCheckin.mood || 3;
    if (lastMood >= 4) {
      message = `${name} etait en forme hier. Voyons comment se passe ce ${time}.`;
    } else if (lastMood <= 2) {
      message = `${name} n'etait pas au top hier. J'espere que ca va mieux aujourd'hui.`;
    } else {
      message = `Bon ${time} ! Comment va ${name} aujourd'hui ?`;
    }
    mission = { type: "checkin", label: "Check-in du jour", sub: `Dis-moi comment va ${name}` };
  } else if (todayCheckin) {
    // Check-in already done
    const mood = todayCheckin.mood || 3;
    if (mood >= 4 && !walkDone) {
      message = `${name} est en forme ! Parfait pour une balade.`;
      mission = { type: "walk", label: "Lancer une balade", sub: `${name} a de l'energie a revendre` };
    } else if (mood >= 4 && walkDone) {
      message = `Belle journee pour ${name} — check-in fait, balade faite. Continue comme ca !`;
      mission = { type: "chat", label: "Parler au coach", sub: "Pose-moi une question sur " + name };
    } else if (mood <= 2) {
      message = `${name} n'est pas au top aujourd'hui. Garde un oeil sur lui et note tout changement.`;
      mission = { type: "health", label: "Verifier sa sante", sub: "Diagnostic rapide" };
    } else {
      if (!walkDone) {
        message = `Check-in fait ! Une petite balade ferait du bien a ${name}.`;
        mission = { type: "walk", label: "Lancer une balade", sub: "20 min recommandees" };
      } else {
        message = `Tout roule pour ${name} aujourd'hui.`;
        mission = { type: "scan", label: "Scanner un aliment", sub: `Verifie ce que ${name} peut manger` };
      }
    }
  }

  // Streak context
  if (streakDays >= 3 && streakDays <= 7) {
    message += ` ${streakDays} jours de suite — le debut d'une habitude.`;
  } else if (streakDays > 7) {
    message += ` ${streakDays} jours de suite — impressionnant.`;
  }

  return { message, mission };
}

const MISSION_CONFIG = {
  checkin: { icon: PawPrint, colorClass: "text-primary", bgClass: "bg-primary/10", page: null },
  walk: { icon: Footprints, colorClass: "text-primary", bgClass: "bg-primary/10", page: "Activite" },
  chat: { icon: MessageCircle, colorClass: "text-primary", bgClass: "bg-primary/10", page: "Chat" },
  health: { icon: PawPrint, colorClass: "text-purple-600", bgClass: "bg-purple-50", page: "Sante" },
  scan: { icon: ScanLine, colorClass: "text-amber-600", bgClass: "bg-amber-50", page: "Scan" },
  train: { icon: Dumbbell, colorClass: "text-blue-600", bgClass: "bg-blue-50", page: "Training" },
};

export default function DailyBriefing({ dog, user, recentCheckins, dailyLogs, streak, todayCheckin, onQuickCheckin, submitting, recommendations }) {
  const navigate = useNavigate();
  const [moodPicked, setMoodPicked] = useState(false);

  const { message, mission } = useMemo(() =>
    generateBriefing({ dog, recentCheckins, dailyLogs, streak, todayCheckin, recommendations }),
    [dog, recentCheckins, dailyLogs, streak, todayCheckin, recommendations]
  );

  const missionConfig = mission ? MISSION_CONFIG[mission.type] : null;
  const MissionIcon = missionConfig?.icon || PawPrint;

  const handleMoodTap = (mood) => {
    setMoodPicked(true);
    onQuickCheckin({ mood, energy: mood >= 4 ? 4 : 3, appetite: mood >= 4 ? 4 : 3 });
  };

  const handleMissionTap = () => {
    if (mission?.type === "checkin") return; // handled by mood buttons
    if (missionConfig?.page) {
      navigate(createPageUrl(missionConfig.page));
    }
  };

  const statusBadge = todayCheckin
    ? (todayCheckin.mood >= 4 ? { label: "En pleine forme", color: "#2D9F82" } :
       todayCheckin.mood <= 2 ? { label: "A surveiller", color: "#D97706" } :
       { label: "Journee tranquille", color: "#1A4D3E" })
    : { label: "En attente du check-in", color: "#8A8A8A" };

  return (
    <div className="px-5 pt-2 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="rounded-[1.5rem] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)" }}
      >
        <div className="p-6 relative">
          {/* Subtle decorative circle */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />

          {/* Status badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusBadge.color === "#8A8A8A" ? "#aaa" : "#6FFBBE" }} />
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/15">
              {statusBadge.label}
            </span>
          </div>

          {/* Briefing header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white font-bold text-lg tracking-tight">
              Briefing de {dog?.name || "ton chien"}
            </h2>
          </div>

          {/* Coach message */}
          <p className="text-white/90 text-[15px] font-medium leading-relaxed italic">
            "{message}"
          </p>

          {/* Quick check-in (if not done) */}
          {mission?.type === "checkin" && !todayCheckin && !moodPicked && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-5"
            >
              <p className="text-[12px] text-white/60 mb-3 font-medium">Comment va {dog?.name} ?</p>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleMoodTap(opt.value)}
                    disabled={submitting}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-white/15 border border-white/20 active:scale-95 active:bg-white/25 transition-all disabled:opacity-50 backdrop-blur-sm"
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-[10px] text-white/70 font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Checking in animation */}
          <AnimatePresence>
            {moodPicked && submitting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-5 flex items-center gap-3 bg-white/15 rounded-xl p-3 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center animate-pulse">
                  <PawPrint className="w-4 h-4 text-white" />
                </div>
                <p className="text-[14px] text-white font-medium">Le coach analyse...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI response after check-in */}
          {todayCheckin?.ai_response && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white/10 rounded-xl border border-white/15 p-4 backdrop-blur-sm"
            >
              <p className="text-[13px] text-white/85 leading-relaxed italic">
                {todayCheckin.ai_response}
              </p>
            </motion.div>
          )}

          {/* Mission button */}
          {mission && mission.type !== "checkin" && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={handleMissionTap}
              className="mt-5 w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 text-left active:scale-[0.97] transition-transform shadow-lg"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${missionConfig?.bgClass || "bg-primary/10"}`}>
                <MissionIcon className={`w-5 h-5 ${missionConfig?.colorClass || "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">{mission.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{mission.sub}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}