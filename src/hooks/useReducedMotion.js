// Simple reduced-motion check — no React hooks to avoid dual-instance crashes
// Uses Framer Motion's useReducedMotion internally when available in components
// that import from framer-motion. This file is a fallback for UI components.

// Simple reduced-motion check — no React hooks to avoid dual-instance crashes
// Uses Framer Motion's useReducedMotion internally when available in components
// that import from framer-motion. This file is a fallback for UI components.

export default function useReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}