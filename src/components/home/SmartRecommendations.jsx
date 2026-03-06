import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";
import { buildRecommendations } from "@/utils/recommendations";

const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
};

export default function SmartRecommendations({ records, exercises, scans, checkins, dailyLogs, todayCheckin, streak, onOpenFAB, diagnosisReports, nutritionPlans }) {
  const recs = buildRecommendations({ records, exercises, scans, checkins, dailyLogs, todayCheckin, streak, diagnosisReports, nutritionPlans });

  if (recs.length === 0) return null;

  return (
    <div className="mx-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        Actions recommandées
      </p>
      <motion.div className="flex flex-col gap-2.5" variants={stagger} initial="hidden" animate="show">
        {recs.map((rec) => {
          const Icon = rec.icon;
          const inner = (
            <motion.div
              key={rec.id}
              variants={item}
              whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-border/30 border-l-4 ${rec.accent} cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-xl ${rec.iconBg} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" style={{ color: rec.iconColor }} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground text-sm leading-tight truncate">{rec.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{rec.sub}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-primary hidden sm:block">{rec.cta}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          );

          if (rec.fab && onOpenFAB) {
            return (
              <div key={rec.id} onClick={onOpenFAB}>
                {inner}
              </div>
            );
          }

          // Don't wrap "Home" recs in a Link — we're already on Home
          if (rec.page === "Home") {
            return <div key={rec.id}>{inner}</div>;
          }

          return (
            <Link key={rec.id} to={createPageUrl(rec.page) + (rec.tab ? `?tab=${rec.tab}` : "")}>
              {inner}
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}