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
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      icon: UtensilsCrossed,
      value: meals > 0 ? `${meals}` : "—",
      label: "Repas",
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
    },
    {
      icon: CircleCheck,
      value: hasCheckin ? "Fait" : "A faire",
      label: "Check-in",
      colorClass: hasCheckin ? "text-purple-600" : "text-muted-foreground",
      bgClass: hasCheckin ? "bg-muted" : "bg-muted/50",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5 bg-card rounded-2xl border border-border py-3.5 px-2 shadow-sm"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bgClass}`}
          >
            <item.icon className={`w-[18px] h-[18px] ${item.colorClass}`} />
          </div>
          <span className="text-[14px] font-bold text-foreground">{item.value}</span>
          <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}