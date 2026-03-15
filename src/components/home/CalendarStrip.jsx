import { useMemo } from "react";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

export default function CalendarStrip({ dailyLogs = [] }) {
  const week = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    const logDates = new Set(dailyLogs.map(l => l.date));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const isToday = d.toDateString() === today.toDateString();
      const hasActivity = logDates.has(dateStr) || (dailyLogs || []).some(l => l.date === dateStr && (l.walk_minutes > 0 || l.water_bowls > 0));

      return {
        label: DAY_LABELS[d.getDay()],
        date: d.getDate(),
        isToday,
        hasActivity,
      };
    });
  }, [dailyLogs]);

  return (
    <div className="flex justify-between items-center px-1 mt-4">
      {week.map((day, i) => (
        <div
          key={i}
          className={`flex flex-col items-center gap-1 w-10 py-2 rounded-xl transition-colors ${
            day.isToday
              ? "bg-[#1A4D3E]"
              : ""
          }`}
        >
          <span
            className={`text-[11px] font-medium ${
              day.isToday ? "text-white" : "text-gray-400"
            }`}
          >
            {day.label}
          </span>
          <span
            className={`text-[14px] font-semibold ${
              day.isToday ? "text-white" : "text-gray-500"
            }`}
          >
            {day.date}
          </span>
          {day.hasActivity && (
            <div
              className={`w-[5px] h-[5px] rounded-full ${
                day.isToday ? "bg-white" : "bg-[#2D9F82]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
