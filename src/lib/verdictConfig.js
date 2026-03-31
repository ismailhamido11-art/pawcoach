import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { PALETTE } from "@/lib/colorPalette";

/**
 * VERDICT_CONFIG — unified food scan verdict styling (safe / caution / toxic).
 *
 * Used by: Scan.jsx, Library.jsx
 *
 * Keys per verdict:
 *   label     — French display label
 *   badgeBg   — Tailwind classes for badge background + text color
 *   cardBg    — Tailwind class for card background
 *   border    — Tailwind class for border color
 *   ring      — Hex color for SVG ring / progress indicator
 *   icon      — Lucide icon component
 *   iconColor — Tailwind class for icon color
 *   text      — Tailwind class for text color (used in Library compact view)
 */
export const VERDICT_CONFIG = {
  safe: {
    label: "Sans danger",
    badgeBg: "bg-emerald-100 text-emerald-700",
    cardBg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: PALETTE.emerald,
    icon: CheckCircle,
    iconColor: "text-emerald-500",
    text: "text-emerald-700",
  },
  caution: {
    label: "Avec précaution",
    badgeBg: "bg-amber-100 text-amber-700",
    cardBg: "bg-amber-50",
    border: "border-amber-200",
    ring: PALETTE.cautionAmber,
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    text: "text-amber-700",
  },
  toxic: {
    label: "TOXIQUE",
    badgeBg: "bg-red-100 text-red-700",
    cardBg: "bg-red-50",
    border: "border-red-200",
    ring: PALETTE.red500,
    icon: AlertCircle,
    iconColor: "text-red-500",
    text: "text-red-700",
  },
};
