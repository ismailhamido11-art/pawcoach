import { Footprints, Droplets, CircleCheck } from "lucide-react";
import { getTodayString } from "@/utils/recommendations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DailyProgress({ dailyLogs = [], todayCheckin, dog }) {
  const navigate = useNavigate();
  const today = getTodayString();
  const todayLog = dailyLogs.find(l => l.date === today);
  const walkMinutes = todayLog?.walk_minutes || 0;
  const waterBowls = todayLog?.water_bowls || 0;
  const hasCheckin = !!todayCheckin;

  const items = [
    {
      icon: Footprints,
      value: walkMinutes > 0 ? `${walkMinutes} min` : "0 min",
      label: "Balade",
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      cardBg: "bg-emerald-50/60",
      borderColor: "border-emerald-200/50",
      done: walkMinutes > 0,
      onClick: () => navigate(createPageUrl("Activite")),
    },
    {
      icon: Droplets,
      value: waterBowls > 0 ? `${waterBowls} bol` : "\u2014",
      label: "Eau",
      iconColor: "text-white",
      iconBg: "bg-gradient-to-br from-cyan-400 to-cyan-600",
      cardBg: "bg-cyan-50/60",
      borderColor: "border-cyan-200/50",
      done: waterBowls > 0,
      onClick: null,
    },
    {
      icon: CircleCheck,
      value: hasCheckin ? "Fait" : "A faire",
      label: "Check-in",
      iconColor: "text-white",
      iconBg: hasCheckin ? "bg-gradient-to-br from-violet-400 to-violet-600" : "bg-gradient-to-br from-gray-300 to-gray-400",
      cardBg: hasCheckin ? "bg-violet-50/60" : "bg-muted/30",
      borderColor: hasCheckin ? "border-violet-200/50" : "border-border",
      done: hasCheckin,
      onClick: null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item, i) => (
        <div
          key={i}
          onClick={item.onClick || undefined}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3.5 px-2 shadow-sm transition-all ${item.cardBg} ${item.borderColor}${item.onClick ? " cursor-pointer active:scale-[0.97]" : ""}`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${item.iconBg}`}
          >
            <item.icon className={`w-[18px] h-[18px] ${item.iconColor}`} />
          </div>
          <span className="text-[14px] font-bold text-foreground">{item.value}</span>
          <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
