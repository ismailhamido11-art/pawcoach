import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO, startOfWeek, isSameWeek } from "date-fns";
import { fr } from "date-fns/locale";

const WEEKLY_GOAL = 5; // 5 walks of 20+ min per week
const MIN_WALK_MINUTES = 20;

export default function TrackerHistory({ logs, dog }) {
  const sorted = useMemo(() => [...(logs || [])].sort((a, b) => b.date.localeCompare(a.date)), [logs]);

  const chartData = useMemo(() =>
    sorted.slice(0, 14).reverse().map(l => ({
      day: format(parseISO(l.date), "dd/MM"),
      minutes: l.walk_minutes || 0,
    })),
  [sorted]);

  const totalMinutes = sorted.reduce((acc, l) => acc + (l.walk_minutes || 0), 0);
  const avgMinutes = sorted.length > 0 ? Math.round(totalMinutes / sorted.length) : 0;
  const daysOver30 = sorted.filter(l => (l.walk_minutes || 0) >= 30).length;

  // Weekly goal: walks of 20+ min this week
  const weeklyWalks = useMemo(() => {
    const now = new Date();
    return sorted.filter(l => {
      if (!l.walk_minutes || l.walk_minutes < MIN_WALK_MINUTES) return false;
      try { return isSameWeek(parseISO(l.date), now, { weekStartsOn: 1 }); } catch { return false; }
    }).length;
  }, [sorted]);
  const weeklyProgress = Math.min(weeklyWalks / WEEKLY_GOAL, 1);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <span className="text-5xl">🦮</span>
        <p className="font-bold text-foreground">Aucune donnée encore</p>
        <p className="text-xs text-muted-foreground">Connecte un tracker ou importe un fichier CSV pour voir l'historique.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Weekly goal card */}
      <div className={`rounded-2xl p-4 border ${weeklyWalks >= WEEKLY_GOAL ? "bg-emerald-50 border-emerald-200" : "bg-white border-border"}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{weeklyWalks >= WEEKLY_GOAL ? "🏆" : "🎯"}</span>
            <p className="font-bold text-sm text-foreground">Objectif semaine</p>
          </div>
          <span className={`text-sm font-black ${weeklyWalks >= WEEKLY_GOAL ? "text-emerald-600" : "text-primary"}`}>
            {weeklyWalks}/{WEEKLY_GOAL}
          </span>
        </div>
        <div className="bg-border/30 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${weeklyWalks >= WEEKLY_GOAL ? "bg-emerald-500" : "bg-primary"}`}
            style={{ width: `${weeklyProgress * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {weeklyWalks >= WEEKLY_GOAL
            ? `Bravo ! Objectif atteint pour ${dog?.name || "ton chien"} cette semaine !`
            : `${WEEKLY_GOAL - weeklyWalks} balade${WEEKLY_GOAL - weeklyWalks > 1 ? "s" : ""} de ${MIN_WALK_MINUTES}+ min restante${WEEKLY_GOAL - weeklyWalks > 1 ? "s" : ""}`
          }
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total", value: `${totalMinutes} min`, sub: `${sorted.length} jours`, color: "text-primary" },
          { label: "Moyenne", value: `${avgMinutes} min`, sub: "par jour", color: "text-safe" },
          { label: "Jours ≥ 30 min", value: daysOver30, sub: "objectif atteint", color: "text-accent" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-3 text-center">
            <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{stat.label}</p>
            <p className="text-[9px] text-muted-foreground">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">📊 14 derniers jours (minutes)</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} barSize={14}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11, color: "hsl(var(--foreground))" }}
                formatter={(v) => [`${v} min`, "Activité"]}
              />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.minutes >= 30 ? "#10b981" : entry.minutes > 0 ? "#3b82f6" : "#e5e7eb"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-2 justify-center">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /><span className="text-[9px] text-muted-foreground">≥ 30 min</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-[9px] text-muted-foreground">&lt; 30 min</span></div>
          </div>
        </div>
      )}

      {/* Log list */}
      <div className="space-y-2">
        {sorted.slice(0, 20).map((log, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                {format(parseISO(log.date), "EEEE dd MMM", { locale: fr })}
              </p>
              {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{log.notes}</p>}
            </div>
            <div className="text-right">
              {log.walk_minutes ? (
                <span className={`text-sm font-black ${log.walk_minutes >= 30 ? "text-safe" : "text-amber-500"}`}>
                  {log.walk_minutes} min
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
              {log.weight_kg && <p className="text-[10px] text-muted-foreground">{log.weight_kg} kg</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}