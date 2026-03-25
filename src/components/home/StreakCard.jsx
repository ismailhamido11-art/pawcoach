import { Flame } from "lucide-react";

export default function StreakCard({ streakDays, dog, dailyLogs = [] }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date();
  
  const last7DaysActive = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    const dateStr = d.toISOString().split("T")[0];
    return dailyLogs.some(log => log.date === dateStr);
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-2">
        <span className="text-secondary font-bold text-xs uppercase tracking-widest px-1">Aperçu quotidien</span>
        <h2 className="text-4xl font-extrabold text-forest-green tracking-tight leading-[1.1]">
          Tu fais du super travail avec {dog?.name || "ton chien"} aujourd'hui !
        </h2>
      </div>
      
      <div className="flex items-center gap-3 bg-white p-2 pr-6 rounded-full shadow-[0_15px_40px_-10px_rgba(26,77,62,0.1)] w-fit border border-emerald-50">
        <div className="w-12 h-12 rounded-full bg-forest-green flex items-center justify-center text-white shadow-lg">
          <Flame className="w-6 h-6" fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Série Wellness</span>
          <span className="text-lg font-extrabold text-forest-green">{streakDays} Jours consécutifs</span>
        </div>
        <div className="flex gap-1.5 ml-4">
          {days.slice(0, 5).map((_, i) => {
            const isActive = last7DaysActive[i];
            return (
              <div 
                key={i} 
                className={`w-1.5 h-6 rounded-full ${isActive ? "bg-secondary" : "bg-secondary/20"}`} 
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}