---
phase: 01-crashs-features-mortes
plan: 01
subsystem: home/check-in
tags: [crash-fix, quick-checkin, dailybriefing]
requires: []
provides: [CRASH-01-fixed]
affects: [DailyBriefing, handleCheckin, backend-dailyCheckinProcess]
tech-stack:
  added: []
  patterns: [nullish-coalescing-defaults]
key-files:
  modified:
    - src/pages/Home.jsx
decisions:
  - "energy ?? 2 et appetite ?? 2 comme valeurs neutres (milieu echelle 1-5) pour les quick check-ins"
metrics:
  duration: "< 5 min"
  completed: "2026-03-27"
  tasks: 1
  files: 1
---

# Phase 01 Plan 01: CRASH-01 handleQuickCheckin Fix Summary

**One-liner:** Fix du nullish coalescing sur energy et appetite dans handleQuickCheckin pour que les taps humeur DailyBriefing atteignent le backend.

## What Was Done

`handleQuickCheckin` dans `src/pages/Home.jsx` (ligne 446) recevait `{ mood }` de `DailyBriefing.jsx:107` — energy et appetite etaient `undefined`. Le guard `!energy || !appetite` dans `handleCheckin` bloquait silencieusement tout check-in initie depuis la Home.

Fix : `energy ?? 2` et `appetite ?? 2` — valeurs neutres (milieu de l'echelle 1-5), appliquees uniquement quand le caller ne les fournit pas.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Corriger handleQuickCheckin — defaults energy et appetite | 34d0678 | src/pages/Home.jsx |

## Verification Results

```
grep "energy ?? 2"              -> ligne 449 OK
grep "appetite ?? 2"            -> ligne 449 OK
grep "!mood || !energy || !appetite" -> ligne 272 intact (guard inchange)
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] src/pages/Home.jsx modifie (verifie via Read + grep)
- [x] Commit 34d0678 existe (verifie via git log)
- [x] Guard handleCheckin intact a la ligne 272
