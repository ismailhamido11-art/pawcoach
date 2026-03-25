import { Flame } from "lucide-react";

export default function StreakCard({ streakDays, dailyLogs = [] }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date();
  
  // Calculate the last 7 days of activity based on daily logs
  const last7DaysActive = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    // Start from Monday (1) to Sunday (0 -> 7) to align with days array
    // Wait, simpler: just get the last 7 days leading up to today
    d.setDate(today.getDate() - 6 + i);
    const dateStr = d.toISOString().split("T")[0];
    return dailyLogs.some(log => log.date === dateStr);
  });

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-orange-100 text-orange-600 p-2 rounded-full shrink-0">
          <Flame className="w-5 h-5" fill="currentColor" />
        </div>
        <div>
          <p className="text-xs text-outline font-medium">Série en cours</p>
          <p className="font-bold text-lg leading-none">{streakDays} jours</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {days.map((d, i) => {
          const isActive = last7DaysActive[i];
          return (
            <div
              key={i}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isActive ? "bg-[#00382b] text-white" : "bg-surface-container-low text-outline"
              }`}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}