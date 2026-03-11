/**
 * animations.js — Shared framer-motion spring presets.
 *
 * Usage:
 *   import { spring, springGentle, springSnappy } from "@/lib/animations";
 *   <motion.div transition={spring} />
 */

/** Default spring — used for most UI transitions (buttons, cards, tabs) */
export const spring = { type: "spring", stiffness: 400, damping: 30 };

/** Gentle spring — used for message animations, slide-ins */
export const springGentle = { type: "spring", stiffness: 120, damping: 20 };

/** Snappy spring — used for expand/collapse, form reveals */
export const springSnappy = { type: "spring", stiffness: 300, damping: 25 };
