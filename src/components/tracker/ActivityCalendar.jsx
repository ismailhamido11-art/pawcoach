import { useMemo } from "react";
import { format, startOfWeek, addDays, subDays } from "date-fns";

const WEEKS = 5;

function getColor(min) {
  if (!min) return "bg-secondary/30";
  if (min < 20) return "bg-emerald-200";
  if (min < 30) return "bg-emerald-400";
  return "bg-emerald-600";
}

export default function ActivityCalendar({ logs }) {
  const logMap = useMemo(() => {
    const m = {};
    (logs || []).forEach(l => { if (l.date) m[l.date] = l.walk_minutes || 0; });
    return m;
  }, [logs]);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const mondayThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const gridStart = subDays(mondayThisWeek, (WEEKS - 1) * 7);

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const dateStr = format(date, "yyyy-MM-dd");
      week.push({
        key: dateStr,
        day: date.getDate(),
        min: logMap[dateStr] || 0,
        isToday: dateStr === todayStr,
        isFuture: date > today,
      });
    }
    weeks.push(week);
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4">
      <p className="text-xs font-bold text-muted-foreground mb-3">5 dernieres semaines</p>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map(c => (
              <div
                key={c.key}
                className={`aspect-square rounded-lg flex items-center justify-center ${
                  c.isFuture ? "bg-secondary/10" : getColor(c.min)
                } ${c.isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
              >
                <span className={`text-[9px] font-bold ${
                  c.isFuture ? "text-muted-foreground/30" : c.min >= 20 ? "text-white" : "text-muted-foreground"
                }`}>
                  {c.day}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-3 justify-center items-center">
        <span className="text-[8px] text-muted-foreground">Moins</span>
        <div className="w-3 h-3 rounded-sm bg-secondary/30" />
        <div className="w-3 h-3 rounded-sm bg-emerald-200" />
        <div className="w-3 h-3 rounded-sm bg-emerald-400" />
        <div className="w-3 h-3 rounded-sm bg-emerald-600" />
        <span className="text-[8px] text-muted-foreground">Plus</span>
      </div>
    </div>
  );
}
