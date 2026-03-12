---
phase: 1-refonte-esthetique-visible-page-accueil
plan: 1
subsystem: home-ui
tags: [visual, home, hero, bento, quick-actions, mascot]
dependency_graph:
  requires: []
  provides: [visible-homepage-impact]
  affects: [DogRadarHero, BentoGrid, QuickActions]
tech_stack:
  added: []
  patterns: [framer-motion-companion, dark-gradient-tiles, solid-colored-actions]
key_files:
  created: []
  modified:
    - src/components/home/DogRadarHero.jsx
    - src/components/home/BentoGrid.jsx
    - src/components/home/QuickActions.jsx
decisions:
  - mascot-position: moved companion from right (phantom 12%) to bottom-left (visible 85%) — decisive visibility gain
  - tile-gradients: per-tile dark color themes (forest/emerald/indigo/violet) over quasi-transparent card bg
  - solid-actions: gradient fill cc/99 on QuickAction containers instead of color}18/08 ghost look
metrics:
  duration: ~15 min
  completed: 2026-03-12
---

# Phase 1 Plan 1: Refonte Esthetique Visible Page Accueil Summary

**One-liner:** Dramatic home screen visual overhaul — deep forest hero, colored tile gradients, solid action buttons, mascot companion at 85% opacity.

## What Changed (Before → After)

### DogRadarHero.jsx

| Element | Before | After |
|---|---|---|
| Background gradient | `from-[#0f4c3a] via-[#1a6b52]` (flat) | `from-[#0d3d2e] via-[#1a5c47] to-[#0f4c3a]` + radial texture layer + 2 blur decoratives |
| Radar SIZE | 160 | 200 |
| Arc ringWidth | 5 | 8 |
| Arc gap | 7 | 10 |
| Arc drop-shadow | `6px ${color}aa / 12px ${color}44` | `10px ${color}cc / 20px ${color}66` (stronger glow) |
| Arc track opacity | 0.12 | 0.20 |
| Dog photo | `w-20 h-20`, `border-white/40`, shadow 30px/0.25 | `w-28 h-28`, `border-white/60`, shadow 50px/0.5 + 100px/0.2 |
| Warm glow ring inset | `-10px` | `-18px` |
| Mascot companion | bottom-right, `w-20 h-20 opacity-[0.12]` (phantom) | bottom-left, `w-20 h-20 opacity: 0.85` with emerald halo blur |
| Mascot mood-aware | No | Yes — maps excited/tired/default |
| Greeting font size | `text-lg` | `text-xl` |
| Context line opacity | `text-white/50 text-[11px]` | `text-white/70 text-[12px]` |
| "PawCoach" label | `text-white/40` | `text-emerald-300/70` |

### BentoGrid.jsx

| Element | Before | After |
|---|---|---|
| Tile min-height | `min-h-[100px]` | `min-h-[150px]` |
| Tile background | `linear-gradient(hsl(var(--card)), ${color}08)` (near-invisible) | Per-tile dark gradient (forest / emerald / indigo / violet) |
| Tile border color | `${color}20` | `${color}40` |
| Mascot size | `w-14 h-14` | `w-20 h-20` |
| Mascot opacity | `opacity-[0.15]` | `opacity-[0.55]` |
| Icon container | `w-8 h-8 rounded-xl` | `w-10 h-10 rounded-2xl` |
| Icon size | `w-4 h-4` | `w-5 h-5` |
| Icon bg | `${color}25` | `${color}35` |
| Icon border | `1px solid ${color}30` | `1.5px solid ${color}60` |
| Tile label | `text-xs text-foreground` | `text-sm font-bold text-white` |
| Sub-label | `text-[10px] text-muted-foreground` | `text-[11px] text-white/60 font-medium` |
| ChevronRight | `text-muted-foreground/30` | `text-white/30` |
| Hover effect | none | `whileHover={{ scale: 1.03 }}` |
| Decorative circle -top -right | `opacity-[0.05]` (removed) | removed |

### QuickActions.jsx

| Element | Before | After |
|---|---|---|
| Item width | `w-[56px]` | `w-[60px]` |
| Container size | `w-11 h-11` | `w-14 h-14` |
| Container background | `${color}18 / ${color}08` (ghost) | `${color}cc / ${color}99` (solid gradient) |
| Container border | `${color}25` | `1.5px solid ${color}` |
| Icon size | `w-5 h-5 color-colored` | `w-6 h-6 text-white` |
| Label | `text-[10px] font-semibold text-muted-foreground` | `text-[11px] font-bold text-foreground` |
| Pulse ring opacity peak | 0.3 | 0.5 |
| Pulse ring scale | 1.1 | 1.15 |
| Pulse ring inset | `-3px` | `-4px` |
| Pulse ring bg | `radial-gradient(...)` | flat `${color}30` |

## Functionality Intact

Mental verification:

- **DogRadarHero:** computeArcs preserved, Arc SVG animation preserved, mood badge preserved, navigation onClick to DogProfile preserved, legend buttons navigate to correct pages with correct tabs, greeting + dog name/breed display preserved, useDogAvatarState hook still called, all props accepted (user, dog, streak, checkins, records, exercises, scans, dailyLogs).
- **BentoGrid:** 4 tiles, Link + createPageUrl structure preserved, stagger animation (variants stagger/item) preserved, all page/tab routes intact.
- **QuickActions:** 5 actions, all routes preserved, framer-motion entrance animations (initial/animate/transition per item) preserved, whileTap preserved.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `src/components/home/DogRadarHero.jsx` — w-28, SIZE=200, opacity:0.85, bottom-4 left-4, ringWidth=8, gap=10 confirmed via grep
- [x] `src/components/home/BentoGrid.jsx` — min-h-[150px], opacity-[0.55], #0f3d2e gradient, text-white confirmed via grep
- [x] `src/components/home/QuickActions.jsx` — w-14 h-14, text-white, w-6 h-6, linear-gradient color}cc confirmed via grep
- [x] Brace balance: 210/210 OK, 42/42 OK, 43/43 OK
- [x] 3 commits created: c0f100a, abddb45, 1ddd302

## Self-Check: PASSED

## Next Step

Ask Ismail to reload the app and check the home screen. The mascot is now bottom-left at 85% opacity, photo is 40% bigger, tiles have deep colored backgrounds, and action buttons have solid fills.
