import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function FeatureTile({ icon: Icon, iconColor, label, dataPoint, subtitle, page, tab, badge, weekBars }) {
  return (
    <motion.div variants={item} whileTap={{ scale: 0.96 }}>
      <Link to={createPageUrl(page) + (tab ? `?tab=${tab}` : "")}>
        <div
          className="relative overflow-hidden rounded-2xl p-3.5 h-full min-h-[144px] flex flex-col shadow-sm border transition-transform"
          style={{
            background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${iconColor}08 100%)`,
            borderColor: `${iconColor}20`,
          }}
        >
          {/* Subtle glow */}
          <div
            className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.07]"
            style={{ background: iconColor }}
          />

          {/* Header: icon + label */}
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${iconColor}20, ${iconColor}10)`,
                  border: `1px solid ${iconColor}25`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>
              <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">{label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
          </div>

          {/* Data section */}
          <div className="relative mt-auto pt-2 space-y-1.5">
            {/* Big number + badge */}
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-black leading-none" style={{ color: iconColor }}>
                {dataPoint}
              </p>
              {badge && (
                <span
                  className="text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none"
                  style={{
                    background: `${badge.color}15`,
                    color: badge.color,
                  }}
                >
                  {badge.text}
                </span>
              )}
            </div>

            {/* 7-day mini bars */}
            {weekBars && (
              <div className="flex items-end gap-[3px] h-[18px]">
                {weekBars.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: v > 0 ? `${Math.max(20, v * 100)}%` : "12%",
                      background: iconColor,
                      opacity: v > 0 ? 0.3 + v * 0.6 : 0.08,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Subtitle */}
            <p className="text-[10px] text-muted-foreground font-medium leading-tight">{subtitle}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
