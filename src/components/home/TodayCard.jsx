import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import InlineCheckin from "./InlineCheckin";

export default function TodayCard({ dog, user, todayCheckin, streak, recommendations = [], onCheckin, submitting }) {
  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? "Ce matin" : hour < 18 ? "Cet apres-midi" : "Ce soir";

  // Skip "Home" recs — we're already on Home, they go nowhere
  const topRec = recommendations.find(r => r.page !== "Home");
  const isAlert = topRec && topRec.priority === 1;

  // STATE 1: Critical alert (overdue vaccine)
  if (isAlert && !todayCheckin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="mx-4"
      >
        <Link to={createPageUrl(topRec.page) + (topRec.tab ? `?tab=${topRec.tab}` : "") + (topRec.vaccineKey ? `&vaccineKey=${topRec.vaccineKey}` : "")}>
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">{topRec.label}</p>
                <p className="text-xs text-red-600 mt-0.5">{topRec.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 mt-1" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // STATE 2: No check-in today
  if (!todayCheckin) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="mx-4 rounded-2xl border p-4 shadow-sm relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--card)) 0%, rgba(45, 159, 130, 0.03) 100%)",
          borderColor: "rgba(45, 159, 130, 0.15)",
        }}
      >
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-primary opacity-[0.05]" />
        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">{timeLabel} pour {dog?.name}</p>
        </div>
        <InlineCheckin dogName={dog?.name || "ton chien"} onSubmit={onCheckin} submitting={submitting} />
      </motion.div>
    );
  }

  // STATE 3: Check-in done
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="mx-4 rounded-2xl border p-4 shadow-sm relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary)) 40%, hsl(var(--card)) 100%)",
        borderColor: "rgba(16, 185, 129, 0.2)",
      }}
    >
      {/* Subtle glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-400 opacity-[0.06]" />

      <div className="relative flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-emerald-700">Check-in fait</p>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">{todayCheckin.mood}/4</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600">{todayCheckin.energy}/3</span>
        </div>
      </div>

      {todayCheckin.ai_response && (
        <div className="relative bg-white/70 backdrop-blur-sm rounded-xl px-3.5 py-3 mb-3 border border-emerald-100/50">
          <Sparkles className="w-3 h-3 text-emerald-500 absolute top-2.5 right-2.5 opacity-60" />
          <p className="text-[13px] text-foreground/80 leading-relaxed italic pr-5">
            "{todayCheckin.ai_response}"
          </p>
        </div>
      )}

      {todayCheckin.symptoms?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {todayCheckin.symptoms.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-medium text-red-700">{s}</span>
          ))}
        </div>
      )}

      {topRec && (
        <Link to={createPageUrl(topRec.page) + (topRec.tab ? `?tab=${topRec.tab}` : "") + (topRec.vaccineKey ? `&vaccineKey=${topRec.vaccineKey}` : "")}>
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-border/20 transition-colors hover:bg-white">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${topRec.iconColor}20, ${topRec.iconColor}10)`,
                border: `1px solid ${topRec.iconColor}25`,
              }}
            >
              <topRec.icon className="w-4 h-4" style={{ color: topRec.iconColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{topRec.label}</p>
              <p className="text-[10px] text-muted-foreground">{topRec.sub}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
        </Link>
      )}
    </motion.div>
  );
}
