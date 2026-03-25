import { Flame } from "lucide-react";

export default function StreakCard({ streakDays }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  // Mock logic for filled circles, just showing all filled for now as per design
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
        {days.map((d, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full bg-[#00382b] flex items-center justify-center text-[10px] text-white font-bold"
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}