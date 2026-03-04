import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

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
                contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 11 }}
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