import { MapPin, Utensils, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getTodayString } from "@/utils/recommendations";

export default function RecentActivity({ dailyLogs = [], recentCheckins = [], records = [] }) {
  const navigate = useNavigate();
  const todayStr = getTodayString();

  const latestLog = dailyLogs.length > 0 ? dailyLogs[0] : null;
  const walkMinutes = latestLog?.walk_minutes || 0;
  const walkDistance = latestLog?.walk_distance_km || (walkMinutes * 0.08).toFixed(1); // rough estimate if no gps
  
  const latestCheckin = recentCheckins.length > 0 ? recentCheckins[0] : null;

  return (
    <section className="space-y-6 pb-20 mt-8">
      <div className="flex justify-between items-end px-1">
        <h3 className="font-extrabold text-2xl text-forest-green">Chronologie Récente</h3>
        <button 
          onClick={() => navigate(createPageUrl("Profile"))}
          className="text-secondary font-black text-xs uppercase tracking-widest hover:underline"
        >
          Historique complet
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Walk Timeline Card */}
        <div 
          onClick={() => navigate(createPageUrl("Activite"))}
          className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-emerald-50 shadow-sm hover:shadow-md transition-shadow group cursor-pointer active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary relative shrink-0">
            <MapPin className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-forest-green text-lg truncate">Balade</p>
            <p className="text-sm font-medium text-on-surface-variant/60 tracking-tight truncate">
              {latestLog?.date === todayStr ? "Aujourd'hui" : "Récemment"} • {walkDistance} km • {walkMinutes} min
            </p>
          </div>
          {walkMinutes > 0 && (
            <div className="text-right shrink-0">
              <div className="bg-secondary/10 px-4 py-2 rounded-xl">
                <span className="text-sm font-black text-secondary tracking-tight">+{(walkMinutes * 2)} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Nutrition Timeline Card */}
        <div 
          onClick={() => navigate(createPageUrl("Nutri"))}
          className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-emerald-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/5 flex items-center justify-center text-orange-600 shrink-0">
            <Utensils className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-forest-green text-lg truncate">Repas</p>
            <p className="text-sm font-medium text-on-surface-variant/60 tracking-tight truncate">
              {latestCheckin?.date === todayStr ? "Aujourd'hui" : "Récemment"} • Enregistré
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-secondary shrink-0">
            <CheckCircle2 className="w-6 h-6" fill="currentColor" />
          </div>
        </div>
      </div>
    </section>
  );
}