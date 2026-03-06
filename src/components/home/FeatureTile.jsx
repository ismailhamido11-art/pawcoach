import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function FeatureTile({ icon: Icon, iconColor, label, dataPoint, subtitle, page }) {
  return (
    <motion.div variants={item}>
      <Link to={createPageUrl(page)}>
        <div className="bg-white/80 backdrop-blur-sm border border-border/30 rounded-2xl p-4 h-full min-h-[120px] flex flex-col justify-between shadow-sm active:scale-[0.97] transition-transform">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}15` }}>
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">{label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
          <div className="mt-3">
            <p className="text-sm font-bold text-foreground leading-snug">{dataPoint}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
