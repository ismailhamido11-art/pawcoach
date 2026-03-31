/**
 * colorPalette.js — Design token reference for JS contexts
 * Use for SVG strokes, chart colors, confetti arrays, canvas drawing.
 * For JSX/Tailwind, use CSS variables (bg-primary, text-accent, etc.) instead.
 */

export const PALETTE = {
  // Core design system
  primary:        "#1A4D3E",  // Forest green — headers, CTA (--primary)
  accent:         "#2D9F82",  // Emerald vif  — indicators (--accent)
  safe:           "#2BAB6C",  // Aliment safe  (--safe)
  caution:        "#EFA11B",  // Warning amber (--caution)
  cautionAmber:   "#D97706",  // Amber-600 — secondary caution tone
  destructive:    "#DE2B2B",  // Error/delete  (--destructive)
  blue:           "#3B82F6",  // Info / dashboard (blue-500)
  violet:         "#7C3AED",  // Sante / premium (violet-600)
  indigo:         "#6366F1",  // Training / dressage (indigo-500)
  muted:          "#EEEFED",  // Fonds désactivés (--muted)
  border:         "#E5E5E5",  // Bordures (--border)
  warmBorder:     "#F0EDE8",  // Warm cream ring bg (SVG only)
  foreground:     "#121F1B",  // Texte principal (--foreground)
  background:     "#F5F1EB",  // Fond global cream (--background)

  // Extended states
  neutral:        "#8A8A8A",  // Inactive / placeholder text
  accentBright:   "#6FFBBE",  // Bright status pulse indicator

  // Feature highlights
  pink:           "#EC4899",  // Feature highlight (pink-500)
  pink300:        "#F9A8D4",  // Pink-300 — confetti
  cautionLight:   "#FBBF24",  // Amber-300 — caution light
  destructiveLight: "#F87171", // Red-400 — destructive light
  destructiveDark:  "#B91C1C", // Red-700 — destructive dark shade

  // Nature / emerald scale
  emeraldDark:    "#059669",  // Emerald-600 — scanner action
  emerald:        "#10B981",  // Emerald-500 — gamification / confetti
  emeraldLight:   "#34D399",  // Emerald-400 — confetti / progress
  emeraldPale:    "#A7F3D0",  // Emerald-200 — subtle glow

  // Deep scan status shades (dark gradient bases)
  safeDeep:       "#065F46",  // Green-900 — scan safe gradient base
  cautionDeep:    "#78350F",  // Amber-900 — scan caution gradient base
  destructiveDeep: "#7F1D1D", // Red-900 — scan toxic gradient base
  greenMid:       "#22C55E",  // Green-500 — scan safe ring

  // Gamification tiers (StreakBar)
  tierSlate:      "#94A3B8",  // Slate-400 — Débutant

  // UI utility (charts, grids, maps — not design tokens)
  red500:         "#EF4444",  // Red-500 — data list destructive items
  amber400:       "#F59E0B",  // Amber-400 — chart caution / streak icon
  green400:       "#4ADE80",  // Green-400 — mood bar (lighter than emerald)
  gray200:        "#E5E7EB",  // Gray-200 — chart grid lines, subtle SVG rings
  gray400:        "#9CA3AF",  // Gray-400 — axis ticks, inactive text
  gray500:        "#6B7280",  // Gray-500 — secondary text / notes
  mapBg:          "#F0F0F0",  // Map tile placeholder background
};

export const CONFETTI_COLORS = [
  PALETTE.primary,
  PALETTE.accent,
  PALETTE.emerald,
  PALETTE.emeraldLight,
  PALETTE.caution,
  PALETTE.pink300,
];

export const GRADIENT_PRIMARY = `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.accent} 100%)`;

export const GRADIENT_SCAN_SAFE    = `linear-gradient(135deg, ${PALETTE.safeDeep}, ${PALETTE.emerald})`;
export const GRADIENT_SCAN_CAUTION = `linear-gradient(135deg, ${PALETTE.cautionDeep}, ${PALETTE.cautionAmber})`;
export const GRADIENT_SCAN_TOXIC   = `linear-gradient(135deg, ${PALETTE.destructiveDeep}, ${PALETTE.destructive})`;
