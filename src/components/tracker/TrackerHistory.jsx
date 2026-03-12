import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO, isSameWeek, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Flame, Trophy, Zap, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import ActivityCalendar from "./ActivityCalendar";

const WEEKLY_GOAL = 5;
const MIN_WALK_MINUTES = 20;
const MOOD_KEY = "pawcoach_walk_moods";
const MOOD_EMOJIS = { super: "😊", good: "👍", calm: "😐", hard: "😤" };

function getMoods() {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY) || "{}"); } catch { return {}; }
}

function calculateStreaks(sortedLogs) {
  const withWalks = sortedLogs.filter(l => (l.walk_minutes || 0) > 0);
  if (withWalks.length === 0) return { current: 0, best: 0 };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yestStr = format(subDays(new Date(), 1), "yyyy-MM-dd");

  let bestStreak = 1, tempStreak = 1;
  for (let i = 0; i < withWalks.length - 1; i++) {
    const diff = Math.round((new Date(withWalks[i].date + "T12:00:00") - new Date(withWalks[i + 1].date + "T12:00:00")) / 86400000);
    if (diff === 1) { tempStreak++; bestStreak = Math.max(bestStreak, tempStreak); }
    else tempStreak = 1;
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  let current = 0;
  if (withWalks[0].date === todayStr || withWalks[0].date === yestStr) {
    current = 1;
    for (let i = 0; i < withWalks.length - 1; i++) {
      const diff = Math.round((new Date(withWalks[i].date + "T12:00:00") - new Date(withWalks[i + 1].date + "T12:00:00")) / 86400000);
      if (diff === 1) current++;
      else break;
    }
  }
  return { current, best: bestStreak };
}

function getDayAverages(sortedLogs) {
  const buckets = [[], [], [], [], [], [], []];
  sortedLogs.forEach(l => {
    if (!l.walk_minutes) return;
    const dow = new Date(l.date + "T12:00:00").getDay();
    buckets[dow === 0 ? 6 : dow - 1].push(l.walk_minutes);
  });
  return ["L", "M", "M", "J", "V", "S", "D"].map((label, i) => ({
    label,
    avg: buckets[i].length > 0 ? Math.round(buckets[i].reduce((a, b) => a + b, 0) / buckets[i].length) : 0,
  }));
}

export default function TrackerHistory({ logs, dog }) {
  const sorted = useMemo(() => [...(logs || [])].sort((a, b) => b.date.localeCompare(a.date)), [logs]);
  const moods = useMemo(() => {
    const local = getMoods();
    // Enrich with DailyLog walk_mood/walk_tags (survives device changes)
    (logs || []).forEach(l => {
      if (l.walk_mood && l.date && !local[l.date]) {
        let tags = [];
        try { tags = l.walk_tags ? JSON.parse(l.walk_tags) : []; } catch {}
        local[l.date] = { mood: l.walk_mood, tags };
      }
    });
    return local;
  }, [logs]);

  const chartData = useMemo(() =>
    sorted.slice(0, 14).reverse().map(l => ({
      day: format(parseISO(l.date), "dd/MM"),
      minutes: l.walk_minutes || 0,
    })),
  [sorted]);

  const { totalMinutes, walkDaysCount: _walkDaysCount2, avgMinutes, daysOver30, longestWalk, totalKm } = useMemo(() => {
    const _totalMinutes = sorted.reduce((acc, l) => acc + (l.walk_minutes || 0), 0);
    const _walkDaysCount = sorted.filter(l => (l.walk_minutes || 0) > 0).length;
    return {
      totalMinutes: _totalMinutes,
      walkDaysCount: _walkDaysCount,
      avgMinutes: _walkDaysCount > 0 ? Math.round(_totalMinutes / _walkDaysCount) : 0,
      daysOver30: sorted.filter(l => (l.walk_minutes || 0) >= 30).length,
      longestWalk: sorted.reduce((max, l) => Math.max(max, l.walk_minutes || 0), 0),
      totalKm: sorted.reduce((acc, l) => acc + (l.walk_distance_km || l.walk_minutes * 0.065 || 0), 0).toFixed(1),
    };
  }, [sorted]);

  const streaks = useMemo(() => calculateStreaks(sorted), [sorted]);
  const dayAvgs = useMemo(() => getDayAverages(sorted), [sorted]);
  const maxDayAvg = useMemo(() => Math.max(...dayAvgs.map(d => d.avg), 1), [dayAvgs]);

  const weeklyWalks = useMemo(() => {
    const now = new Date();
    return sorted.filter(l => {
      if (!l.walk_minutes || l.walk_minutes < MIN_WALK_MINUTES) return false;
      try { return isSameWeek(parseISO(l.date), now, { weekStartsOn: 1 }); } catch { return false; }
    }).length;
  }, [sorted]);
  const weeklyProgress = Math.min(weeklyWalks / WEEKLY_GOAL, 1);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayLog = sorted.find(l => l.date === todayStr);
  const todayMood = moods[todayStr];

  const DAY_NAMES = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const bestDayIdx = dayAvgs.reduce((best, d, i) => d.avg > dayAvgs[best].avg ? i : best, 0);
  const bestDayInsight = dayAvgs[bestDayIdx].avg > 0 ? `Ton jour le plus actif : le ${DAY_NAMES[bestDayIdx]}` : null;

  const recordDate = longestWalk > 0 ? sorted.find(l => l.walk_minutes === longestWalk)?.date : null;
  const activeDays = sorted.filter(l => (l.walk_minutes || 0) > 0).length;

  // Compile mood tags frequency
  const tagFreq = useMemo(() => {
    const freq = {};
    Object.values(moods).forEach(m => {
      (m.tags || []).forEach(t => { freq[t] = (freq[t] || 0) + 1; });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [moods]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <span className="text-5xl">🦮</span>
        <p className="font-bold text-foreground">Aucune balade enregistrée</p>
        <p className="text-xs text-muted-foreground">Lance une balade pour voir ton historique ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Today card */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-foreground capitalize">
              {format(new Date(), "EEEE d MMMM", { locale: fr })}
            </p>
            {todayLog?.walk_minutes ? (
              <p className="text-[10px] text-safe font-bold mt-0.5">
                {todayLog.walk_minutes} min de balade aujourd'hui
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">Pas encore de balade aujourd'hui</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {todayMood && <span className="text-xl">{MOOD_EMOJIS[todayMood.mood]}</span>}
            {todayLog?.walk_minutes ? (
              <div className="w-10 h-10 rounded-full bg-safe/15 flex items-center justify-center">
                <span className="text-base">✅</span>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Streak flame */}
      {streaks.current > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl py-3"
        >
          <Flame className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-black text-amber-700">{streaks.current} jour{streaks.current > 1 ? "s" : ""} de suite</span>
          {streaks.current >= 7 && <span className="text-xs">🔥</span>}
        </motion.div>
      )}

      {/* Weekly goal */}
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

      {/* Activity Calendar */}
      <ActivityCalendar logs={sorted} />

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: `${totalMinutes}`, unit: "min", color: "text-primary" },
          { label: "Moyenne", value: `${avgMinutes}`, unit: "min/j", color: "text-safe" },
          { label: "Record", value: `${longestWalk}`, unit: "min", color: "text-accent" },
          { label: "Distance", value: totalKm, unit: "km est.", color: "text-blue-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-2.5 text-center">
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.unit}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {activeDays} jour{activeDays > 1 ? "s" : ""} actif{activeDays > 1 ? "s" : ""} sur {sorted.length}
      </p>

      {/* Records */}
      {streaks.best > 1 && (
        <div className="flex gap-2">
          <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-700">Meilleur streak</p>
              <p className="text-xs font-black text-amber-800">{streaks.best} jours</p>
            </div>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-emerald-700">Jours 30+ min</p>
              <p className="text-xs font-black text-emerald-800">{daysOver30}</p>
            </div>
          </div>
        </div>
      )}

      {/* Behavioral signature from walk tags */}
      {tagFreq.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-2">Comportements en balade</p>
          <div className="flex flex-wrap gap-1.5">
            {tagFreq.map(([tag, count]) => (
              <span key={tag} className="text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-1">
                {tag} <span className="text-primary/50">{count}x</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Day-of-week pattern */}
      <div className="bg-white border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-muted-foreground mb-3">Moyenne par jour</p>
        <div className="grid grid-cols-7 gap-1.5">
          {dayAvgs.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-full h-14 flex items-end justify-center">
                <div
                  className={`w-full rounded-t-md ${d.avg > 0 ? "bg-primary/80" : "bg-secondary/30"}`}
                  style={{ height: `${Math.max(4, (d.avg / maxDayAvg) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-foreground">{d.avg > 0 ? d.avg : "—"}</span>
              <span className="text-[10px] font-bold text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        {bestDayInsight && (
          <p className="text-[10px] text-primary/70 font-semibold mt-2 text-center">{bestDayInsight}</p>
        )}
      </div>

      {/* Bar chart 14 days */}
      {chartData.length > 0 && (
        <div className="bg-white border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">14 derniers jours</p>
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
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /><span className="text-[10px] text-muted-foreground">≥ 30 min</span></div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-400" /><span className="text-[10px] text-muted-foreground">&lt; 30 min</span></div>
          </div>
        </div>
      )}

      {/* Log list with mood + month headers */}
      <div className="space-y-2">
        {sorted.slice(0, 15).flatMap((log, i, arr) => {
          const mood = moods[log.date];
          const logDate = parseISO(log.date);
          const prevDate = i > 0 ? parseISO(arr[i - 1].date) : null;
          const showMonthHeader = i === 0 || logDate.getMonth() !== prevDate?.getMonth();

          const elements = [];
          if (showMonthHeader) {
            elements.push(
              <p key={`month-${log.date}`} className="text-[10px] font-bold text-muted-foreground tracking-wide pt-1 capitalize">
                {format(logDate, "MMMM yyyy", { locale: fr })}
              </p>
            );
          }
          elements.push(
            <div key={log.date} className="bg-white border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {mood && <span className="text-base flex-shrink-0">{MOOD_EMOJIS[mood.mood] || ""}</span>}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground capitalize">
                    {format(logDate, "EEEE d MMM", { locale: fr })}
                  </p>
                  {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">{log.notes}</p>}
                  {mood?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mood.tags.map(t => (
                        <span key={t} className="text-[10px] bg-primary/10 text-primary font-semibold rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                {log.walk_minutes ? (
                  <>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`text-sm font-black ${log.walk_minutes >= 30 ? "text-safe" : "text-amber-500"}`}>
                        {log.walk_minutes} min
                      </span>
                      {log.date === recordDate && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-bold rounded px-1 py-0.5">Record</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{(log.walk_distance_km || log.walk_minutes * 0.065).toFixed(1)} km</p>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {log.weight_kg && <p className="text-[10px] text-muted-foreground">{log.weight_kg} kg</p>}
              </div>
            </div>
          );
          return elements;
        })}
      </div>
    </div>
  );
}
