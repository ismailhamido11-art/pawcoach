import { useMemo } from "react";

export default function WellnessScore({ recentCheckins = [], streak, dailyLogs = [], dog }) {
  const { score, label, sublabel, color } = useMemo(() => {
    if (!recentCheckins || recentCheckins.length === 0) {
      return { score: null, label: "Fais un check-in", sublabel: `Dis-nous comment va ${dog?.name || "ton chien"}`, color: "#8A8A8A" };
    }

    const last = recentCheckins[0];
    const mood = last.mood || 3;
    const energy = last.energy || 3;
    const appetite = last.appetite || 3;
    const streakDays = streak?.current_streak || 0;

    // Score 0-100 based on mood/energy/appetite (each 1-5) + streak bonus
    let s = Math.round(((mood + energy + appetite) / 15) * 80);
    s += Math.min(streakDays * 2, 20); // streak bonus max 20
    s = Math.min(s, 100);

    // Walk bonus
    const todayLog = dailyLogs.find(l => {
      const today = new Date();
      const ds = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
      return l.date === ds;
    });
    if (todayLog?.walk_minutes > 0) s = Math.min(s + 5, 100);

    let lbl, sub, clr;
    if (s >= 80) { lbl = "En pleine forme"; sub = "Appetit, humeur et activite au top"; clr = "#2D9F82"; }
    else if (s >= 60) { lbl = "Bonne journee"; sub = "Continue comme ca"; clr = "#2D9F82"; }
    else if (s >= 40) { lbl = "Peut mieux faire"; sub = "Une balade ferait du bien"; clr = "#D97706"; }
    else { lbl = "Attention"; sub = "Prends soin de lui aujourd'hui"; clr = "#DC2626"; }

    return { score: s, label: lbl, sublabel: sub, color: clr };
  }, [recentCheckins, streak, dailyLogs, dog]);

  const circumference = 2 * Math.PI * 28;
  const progress = score != null ? (score / 100) * circumference : 0;

  return (
    <div className="flex items-center gap-4 bg-white rounded-[20px] border border-[#E8E4DF] p-5">
      {/* Ring */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#F0EDE8" strokeWidth="5" />
          {score != null && (
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000 ease-out"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[22px] font-bold text-[#1A4D3E]">
            {score != null ? score : "—"}
          </span>
          {score != null && <span className="text-[10px] text-gray-400">%</span>}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#2D2D2D]">
          Bien-etre de {dog?.name || "Rex"}
        </p>
        <p className="text-[13px] mt-0.5" style={{ color }}>
          {label}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
