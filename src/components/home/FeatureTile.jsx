import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function FeatureTile({ icon: Icon, iconColor, label, dataPoint, subtitle, page }) {
  return (
    <motion.div variants={item} whileTap={{ scale: 0.96 }}>
      <Link to={createPageUrl(page)}>
        <div
          className="relative overflow-hidden rounded-2xl p-4 h-full min-h-[130px] flex flex-col justify-between shadow-sm border transition-transform"
          style={{
            background: `linear-gradient(135deg, white 0%, ${iconColor}08 100%)`,
            borderColor: `${iconColor}20`,
          }}
        >
          {/* Subtle glow circle in top-right */}
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.07]"
            style={{ background: iconColor }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${iconColor}20, ${iconColor}10)`,
                  border: `1px solid ${iconColor}25`,
                }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
              </div>
              <span className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">{label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>

          <div className="relative mt-auto pt-3">
            <p className="text-[15px] font-extrabold leading-snug" style={{ color: iconColor }}>
              {dataPoint}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">{subtitle}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
