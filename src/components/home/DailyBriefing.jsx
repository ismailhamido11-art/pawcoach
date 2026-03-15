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
  checkin: { icon: PawPrint, color: "#2D9F82", bg: "#E8F5F0", page: null },
  walk: { icon: Footprints, color: "#2D9F82", bg: "#E8F5F0", page: "WalkMode" },
  chat: { icon: MessageCircle, color: "#1A4D3E", bg: "#E8F5F0", page: "Chat" },
  health: { icon: PawPrint, color: "#7C3AED", bg: "#EDE9FE", page: "Health" },
  scan: { icon: ScanLine, color: "#D97706", bg: "#FEF0E8", page: "Scan" },
  train: { icon: Dumbbell, color: "#2D9F82", bg: "#E8F5F0", page: "Training" },
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

  return (
    <div className="px-5 pt-2 pb-6">
      {/* Coach message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-[16px] text-[#2D2D2D] leading-[1.6] font-medium"
      >
        {message}
      </motion.p>

      {/* Quick check-in (if not done) */}
      {mission?.type === "checkin" && !todayCheckin && !moodPicked && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-5"
        >
          <p className="text-[13px] text-gray-400 mb-3">Comment va {dog?.name} ?</p>
          <div className="flex gap-3">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleMoodTap(opt.value)}
                disabled={submitting}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-[#E8E4DF] active:scale-95 active:bg-[#E8F5F0] transition-all disabled:opacity-50"
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-[11px] text-gray-500 font-medium">{opt.label}</span>
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
            className="mt-5 flex items-center gap-3 bg-[#E8F5F0] rounded-2xl p-4"
          >
            <div className="w-8 h-8 rounded-full bg-[#2D9F82] flex items-center justify-center animate-pulse">
              <PawPrint className="w-4 h-4 text-white" />
            </div>
            <p className="text-[14px] text-[#1A4D3E] font-medium">Le coach analyse...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI response after check-in */}
      {todayCheckin?.ai_response && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 bg-white rounded-2xl border border-[#E8E4DF] p-4"
        >
          <p className="text-[13px] text-gray-600 leading-[1.6] italic">
            {todayCheckin.ai_response}
          </p>
        </motion.div>
      )}

      {/* Mission card */}
      {mission && mission.type !== "checkin" && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={handleMissionTap}
          className="mt-5 w-full flex items-center gap-4 bg-white rounded-2xl border border-[#E8E4DF] p-4 text-left active:scale-[0.98] transition-transform"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: missionConfig?.bg }}
          >
            <MissionIcon className="w-6 h-6" style={{ color: missionConfig?.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-[#1A4D3E]">{mission.label}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{mission.sub}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
        </motion.button>
      )}

      {/* Mission card for check-in done state */}
      {mission && mission.type !== "checkin" && todayCheckin && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          onClick={handleMissionTap}
          className="mt-3 w-full flex items-center gap-4 rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          style={{ backgroundColor: missionConfig?.bg }}
        >
          <MissionIcon className="w-5 h-5" style={{ color: missionConfig?.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: missionConfig?.color }}>{mission.label}</p>
          </div>
          <ArrowRight className="w-4 h-4" style={{ color: missionConfig?.color }} />
        </motion.button>
      )}
    </div>
  );
}
