---
phase: 09-visual-polish
plan: "03"
subsystem: animations
tags: [framer-motion, accessibility, animations, reduced-motion, navigation]
dependency_graph:
  requires: []
  provides: [springTab export, staggerDelay export, useReducedMotion in 4 pages]
  affects: [BottomNav.jsx, Profile.jsx, Premium.jsx, DogProfile.jsx, Onboarding.jsx]
tech_stack:
  added: []
  patterns: [centralized animation presets, useReducedMotion OS hook]
key_files:
  created: []
  modified:
    - src/lib/animations.js
    - src/components/BottomNav.jsx
    - src/pages/Dashboard.jsx
    - src/pages/Profile.jsx
    - src/pages/Premium.jsx
    - src/pages/DogProfile.jsx
    - src/pages/Onboarding.jsx
decisions:
  - springTab (stiffness:500, damping:35) added to animations.js as named preset for nav tab indicator
  - staggerDelay (0.05) exported as reference constant; Dashboard unified to 0.06 only (Profile/Premium left as-is per plan)
  - useReducedMotion declaration added (2 lines per page) without conditioning individual motion.div — CSS global covers the general case
metrics:
  duration: "~10 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
---

# Phase 09 Plan 03: Animation Centralization + Reduced Motion Summary

**One-liner:** springTab/staggerDelay centralized in animations.js; useReducedMotion declared in 4 pages to honor OS accessibility preference.

## What Was Done

### Task 1 — springTab + staggerDelay in animations.js (FIX-50, FIX-51)

Added 2 named exports at the end of `src/lib/animations.js`:
- `springTab = { type: "spring", stiffness: 500, damping: 35 }` — fast spring for BottomNav tab indicator
- `staggerDelay = 0.05` — reference constant for cascade animation delays

`BottomNav.jsx` now imports `springTab` from `@/lib/animations` and uses `transition={springTab}` instead of the inline `{ type: "spring", stiffness: 500, damping: 35 }`.

`Dashboard.jsx` stagger at line 290 unified from `i * 0.07` to `i * 0.06` (line 423 was already 0.06 — no change needed).

**Commit:** 8e45fdc

### Task 2 — useReducedMotion in 4 pages (FIX-57)

Pattern applied to Profile.jsx, Premium.jsx, DogProfile.jsx, Onboarding.jsx:
1. `useReducedMotion` added to existing framer-motion import
2. `const prefersReducedMotion = useReducedMotion();` declared as first hook in the component

No individual `motion.div` conditionals added — the CSS global in `index.css` (lines 308-318, `prefers-reduced-motion: reduce`) already handles the rendering layer. This keeps the change minimal (2 lines per file) while establishing the hook that framer-motion reads internally.

**Commit:** 6b09ef1

## Verification Results

```
1. springTab + staggerDelay in animations.js: 2 exports confirmed
2. No inline stiffness:500 in BottomNav: CLEAN
3. springTab import + usage in BottomNav: confirmed (lines 5 and 104)
4. useReducedMotion in 4 pages: 2 occurrences per file (import + declaration)
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. No placeholder data introduced.

## Self-Check: PASSED

- src/lib/animations.js: springTab and staggerDelay exports present
- src/components/BottomNav.jsx: springTab imported and used, no inline spring
- src/pages/Dashboard.jsx: stagger unified to 0.06
- src/pages/Profile.jsx, Premium.jsx, DogProfile.jsx, Onboarding.jsx: useReducedMotion declared
- Commits 8e45fdc and 6b09ef1 exist in git log
