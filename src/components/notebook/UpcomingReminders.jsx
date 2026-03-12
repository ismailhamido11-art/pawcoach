import { useMemo } from "react";
import { Bell, Lock, ChevronRight } from "lucide-react";
import { getVaccineDisplayName } from "@/utils/healthStatus";

export default function UpcomingReminders({ records = [], isPremium, onNavigate }) {
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return records
      .filter(r => {
        if (!r.next_date || r.next_date === "") return false;
        const d = new Date(r.next_date);
        return !isNaN(d.getTime());
      })
      .map(r => {
        const due = new Date(r.next_date);
        due.setHours(0, 0, 0, 0);
        const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
        return { ...r, daysLeft: diff };
      })
      .filter(r => r.daysLeft >= 0 && r.daysLeft <= 60)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [records]);

  if (upcoming.length === 0) return null;

  return (
    <div>
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-emerald-50">
          <Bell className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">Rappels à venir</span>
          {!isPremium && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-100 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" /> Emails Premium
            </span>
          )}
        </div>
        <div className="divide-y divide-border">
          {upcoming.map(r => {
            const tabId = r.type === "vaccine" ? "vaccine" : r.type === "medication" ? "medication" : r.type;
            return (
              <button
                key={r.id}
                onClick={() => onNavigate?.(tabId)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.type === "vaccine" ? getVaccineDisplayName(r.title) : r.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(r.next_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    r.daysLeft <= 7
                      ? "bg-red-100 text-red-600"
                      : r.daysLeft <= 14
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {r.daysLeft === 0 ? "Aujourd'hui !" : `dans ${r.daysLeft}j`}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}