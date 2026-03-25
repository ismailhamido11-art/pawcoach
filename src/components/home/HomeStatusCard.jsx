import { Zap } from "lucide-react";
import { getTodayString } from "@/utils/recommendations";

export default function HomeStatusCard({ dog, todayCheckin, dailyLogs = [] }) {
  // Compute basic health score based on checkin and recent logs
  const score = todayCheckin ? 95 : 75;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const todayStr = getTodayString();
  const latestLog = dailyLogs.find(l => l.date === todayStr) || dailyLogs[0];
  const waterBowls = latestLog?.water_bowls || 0;
  
  return (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-fixed/20 rounded-full blur-3xl -mr-10 -mt-10" />
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="45" stroke="#f1eee5" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              fill="none"
              r="45"
              stroke="url(#gradient-health)"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="8"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient-health" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#1A4D3E" />
                <stop offset="100%" stopColor="#006b55" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-[#00382b]">{score}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-widest mt-1">
              Score Santé
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-4 w-full">
          <div className="inline-flex items-center gap-1.5 bg-secondary-fixed px-3 py-1 rounded-full text-on-secondary-fixed text-xs font-bold w-max">
            <Zap className="w-3.5 h-3.5" fill="currentColor" />
            EXCELLENTE FORME
          </div>
          <h2 className="text-2xl font-bold leading-tight">
            {dog?.name || "Ton chien"} est prêt pour sa journée !
          </h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            {todayCheckin 
              ? "Les signes vitaux d'aujourd'hui sont parfaits." 
              : "Fais son check-in pour mettre à jour son statut de forme."}
          </p>
          <div className="flex gap-4 pt-2">
            <div className="flex-1 bg-surface-container-low rounded-2xl p-3 text-center">
              <span className="block text-xs text-outline mb-1">Poids</span>
              <span className="font-bold text-[#1c1c16]">{dog?.weight ? `${dog.weight} kg` : "--"}</span>
            </div>
            <div className="flex-1 bg-surface-container-low rounded-2xl p-3 text-center">
              <span className="block text-xs text-outline mb-1">Hydraté</span>
              <span className="font-bold text-[#1c1c16]">{waterBowls} bol{waterBowls > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}