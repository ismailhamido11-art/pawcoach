import { Footprints, Droplet, PawPrint } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTodayString } from "@/utils/recommendations";

export default function RecentActivity({ dailyLogs = [], recentCheckins = [], records = [] }) {
  const navigate = useNavigate();
  const todayStr = getTodayString();

  const latestLog = dailyLogs.length > 0 ? dailyLogs[0] : null;
  const walkMinutes = latestLog?.walk_minutes || 0;
  const waterBowls = latestLog?.water_bowls || 0;
  const isTodayLog = latestLog?.date === todayStr;

  const upcomingRecords = records
    .filter(r => r.next_date && r.next_date >= todayStr)
    .sort((a, b) => a.next_date.localeCompare(b.next_date));
  const nextReminder = upcomingRecords.length > 0 ? upcomingRecords[0] : null;

  return (
    <div className="mt-8">
      <div className="flex items-end justify-between mb-6">
        <h3 className="text-xl font-bold text-[#1c1c16]">Activités récentes</h3>
        <button onClick={() => navigate(createPageUrl("Activite"))} className="text-[#00382b] text-sm font-bold">Tout voir</button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Walk Card */}
        <div 
          onClick={() => navigate(createPageUrl("Activite"))}
          className="col-span-2 bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Footprints className="w-6 h-6" fill="currentColor" />
            </div>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest mt-1">
              {isTodayLog ? "AUJOURD'HUI" : "RÉCENT"}
            </span>
          </div>
          <h4 className="font-bold text-lg text-[#1c1c16]">{walkMinutes > 0 ? "Dernière balade" : "Pas de balade signalée"}</h4>
          <p className="text-sm text-on-surface-variant mb-4">{walkMinutes > 0 ? `${walkMinutes} min` : "Enregistre une balade"}</p>
          <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
            <div className="h-full bg-[#00382b] rounded-full" style={{ width: walkMinutes > 0 ? `${Math.min((walkMinutes / 60) * 100, 100)}%` : "0%" }} />
          </div>
        </div>

        {/* Hydration Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
              <Droplet className="w-6 h-6" fill="currentColor" />
            </div>
          </div>
          <h4 className="font-bold text-lg text-[#1c1c16] leading-tight">Hydratation</h4>
          <p className="text-sm text-on-surface-variant mt-1">{waterBowls} / 3 bols</p>
          <div className="mt-4 flex gap-1.5">
            {[1, 2, 3].map(bowl => (
              <div key={bowl} className={`h-1.5 flex-1 rounded-full ${bowl <= waterBowls ? "bg-[#00382b]" : "bg-surface-container-low"}`} />
            ))}
          </div>
        </div>

        {/* Reminder Card */}
        <div 
          onClick={() => navigate(createPageUrl("Sante"))}
          className="bg-[#00382b] text-white rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
        >
          <div className="absolute -right-6 -bottom-6 opacity-10">
            <PawPrint className="w-32 h-32" fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h4 className="font-bold text-lg mb-1 leading-tight">Rappel Santé</h4>
            <p className="text-xs text-white/70 mb-4">
              {nextReminder ? new Date(nextReminder.next_date).toLocaleDateString('fr-FR') : "Aucun rappel"}
            </p>
            <p className="text-sm font-medium leading-snug">
              {nextReminder ? nextReminder.title : "Tout est à jour !"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}