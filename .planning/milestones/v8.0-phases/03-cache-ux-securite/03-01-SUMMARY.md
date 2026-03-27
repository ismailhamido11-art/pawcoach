---
phase: 03-cache-ux-securite
plan: 01
subsystem: cache-propagation
tags: [cache, home, dogprofile, nutri, invalidation, foodscan]
dependency_graph:
  requires: [02-03-SUMMARY.md]
  provides: [CACHE-02, CACHE-03, CACHE-04]
  affects: [src/pages/DogProfile.jsx, src/pages/Nutri.jsx, src/lib/HomeCacheContext.jsx]
tech_stack:
  added: []
  patterns: [useHomeCache, visibilitychange, window.focus]
key_files:
  modified:
    - src/pages/DogProfile.jsx
    - src/pages/Nutri.jsx
decisions:
  - "invalidateHome placed after setDog in handleSaveDog to ensure local state and cache are consistent"
  - "invalidateHome placed before navigate in handleDeleteDog so Home fetches fresh data on return"
  - "visibilitychange + window focus dual-listener pattern for robust mobile SPA coverage"
  - "dog?.id as useEffect dependency prevents listener re-registration on unrelated state changes"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-27T20:20:09Z"
  tasks: 2
  files: 2
requirements: [CACHE-02, CACHE-03, CACHE-04]
---

# Phase 03 Plan 01: Cache Propagation — DogProfile + Nutri Summary

## One-Liner

Added `invalidateHome()` in DogProfile after dog update/delete, and a `visibilitychange`+`focus` refresh in Nutri for recentScans.

## What Was Built

### Task 1: DogProfile.jsx — invalidateHome after delete and update (CACHE-02 + CACHE-03)

- Imported `useHomeCache` from `@/lib/HomeCacheContext`
- Destructured `invalidateHome` in the `DogProfile` component
- Added `invalidateHome()` call in `handleSaveDog` after `setDog(prev => ...)` — covers CACHE-03 (rename/photo change)
- Added `invalidateHome()` call in `handleDeleteDog` after `localStorage.removeItem("activeDogId")` and before `navigate(...)` — covers CACHE-02 (dog deletion)

**Commit:** c2eaafd

### Task 2: Nutri.jsx — recentScans refresh on visibility/focus (CACHE-04)

- Added a `useEffect` with dependency `[dog?.id]` that registers two event listeners:
  - `window.focus` — triggers `refreshScans()` directly
  - `document.visibilitychange` — triggers `refreshScans()` when `visibilityState === "visible"`
- `refreshScans` calls `FoodScan.filter({ dog_id: dog.id }, "-timestamp", 5)` and updates `recentScans` state
- Proper cleanup (`removeEventListener`) on unmount

**Commit:** 2d581bf

## Verification Results

```
grep -n "useHomeCache" src/pages/DogProfile.jsx
8: import { useHomeCache } from "@/lib/HomeCacheContext";

grep -n "invalidateHome" src/pages/DogProfile.jsx
28: const { invalidateHome } = useHomeCache();
91: invalidateHome();
151: invalidateHome();

grep -n "visibilitychange" src/pages/Nutri.jsx
256: document.addEventListener("visibilitychange", onVisibility);
259: document.removeEventListener("visibilitychange", onVisibility);

grep -n "refreshScans" src/pages/Nutri.jsx
245: const refreshScans = () => {
253: if (document.visibilityState === "visible") refreshScans();
255: window.addEventListener("focus", refreshScans);
258: window.removeEventListener("focus", refreshScans);

grep -n "onLogSaved={invalidateHome}" src/pages/Home.jsx
685: onLogSaved={invalidateHome}   (CACHE-01 — already in place from Phase 01 Plan 04)
```

## CACHE-01 Status

CACHE-01 confirmed already implemented: `Home.jsx` line 685 passes `onLogSaved={invalidateHome}` to `CombinedFAB`. No action needed.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/pages/DogProfile.jsx
- FOUND: src/pages/Nutri.jsx
- FOUND: .planning/phases/03-cache-ux-securite/03-01-SUMMARY.md
- FOUND: commit c2eaafd (DogProfile cache invalidation)
- FOUND: commit 2d581bf (Nutri recentScans refresh)

## Decisions Made

1. `invalidateHome` placed after `setDog` in `handleSaveDog` — local state updates first, then cache clears. On return to Home, a full refetch brings fresh data.
2. `invalidateHome` before `navigate` in `handleDeleteDog` — cache is cleared before navigation so Home immediately loads without stale dog data.
3. Dual-listener pattern (`visibilitychange` + `window.focus`) — covers both mobile browser tab switching and desktop window focus restoration.
4. `dog?.id` as dependency — prevents the useEffect from re-running on every render; only re-registers listeners when the active dog changes.
