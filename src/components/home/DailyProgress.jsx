import { Footprints, UtensilsCrossed, CircleCheck } from "lucide-react";
import { getTodayString } from "@/utils/recommendations";

export default function DailyProgress({ dailyLogs = [], todayCheckin, dog }) {
  const today = getTodayString();
  const todayLog = dailyLogs.find(l => l.date === today);
  const walkMinutes = todayLog?.walk_minutes || 0;
  const meals = todayLog?.water_bowls || 0; // using water_bowls as proxy; adapt as needed
  const hasCheckin = !!todayCheckin;

  const items = [
    {
      icon: Footprints,
      value: walkMinutes > 0 ? `${walkMinutes} min` : "0 min",
      label: "Balade",
      color: "#2D9F82",
      bg: "#E8F5F0",
    },
    {
      icon: UtensilsCrossed,
      value: meals > 0 ? `${meals}` : "—",
      label: "Repas",
      color: "#D97706",
      bg: "#FEF3C7",
    },
    {
      icon: CircleCheck,
      value: hasCheckin ? "Fait" : "A faire",
      label: "Check-in",
      color: hasCheckin ? "#7C3AED" : "#8A8A8A",
      bg: hasCheckin ? "#EDE9FE" : "#F5F5F5",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-[#E8E4DF] py-3.5 px-2"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: item.bg }}
          >
            <item.icon className="w-[18px] h-[18px]" style={{ color: item.color }} />
          </div>
          <span className="text-[14px] font-semibold text-[#2D2D2D]">{item.value}</span>
          <span className="text-[10px] text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
