/**
 * animations.js — Shared framer-motion spring presets.
 *
 * Usage:
 *   import { spring, tapScale, hoverGlow, fadeInUp } from "@/lib/animations";
 *   <motion.div {...tapScale} transition={spring} />
 *   <motion.div {...fadeInUp} />
 */

// ─── Transition primitives ────────────────────────────────────────────────────

/** Default spring — used for most UI transitions (buttons, cards, tabs) */
export const spring = { type: "spring", stiffness: 400, damping: 30 };

/** Gentle spring — used for message animations, slide-ins */
export const springGentle = { type: "spring", stiffness: 120, damping: 20 };

/** Snappy spring — used for expand/collapse, form reveals */
export const springSnappy = { type: "spring", stiffness: 300, damping: 25 };

// ─── Interaction presets (spread directly onto motion.div) ───────────────────

/**
 * tapScale — subtle press feedback for cards and list items.
 * Usage: <motion.div {...tapScale}>
 */
export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 30 },
};

/**
 * pressIn — stronger press feedback for CTA buttons.
 * Usage: <motion.button {...pressIn}>
 */
export const pressIn = {
  whileTap: { scale: 0.95, opacity: 0.82 },
  transition: { type: "spring", stiffness: 400, damping: 30 },
};

/**
 * hoverGlow — subtle lift + shadow on hover (desktop / large screens).
 * Uses forest-green shadow to stay on-brand.
 * Usage: <motion.div {...hoverGlow}>
 */
export const hoverGlow = {
  whileHover: {
    y: -2,
    boxShadow: "0 4px 12px rgba(26,77,62,0.15)",
  },
  transition: { type: "spring", stiffness: 400, damping: 30 },
};

// ─── Entrance presets ─────────────────────────────────────────────────────────

/**
 * fadeInUp — single element fade-in with upward drift.
 * Usage: <motion.div {...fadeInUp} transition={{ duration: 0.22, ease: "easeOut" }}>
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * staggerContainer — parent wrapper that staggers children by 80 ms.
 * Usage: <motion.div {...staggerContainer} initial="hidden" animate="show">
 *   (children must use staggerItem variants)
 */
export const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

/**
 * staggerItem — child variant used inside staggerContainer.
 * Usage: <motion.div variants={staggerItem}>
 */
export const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};
