---
phase: 10-performance-cleanup
plan: "02"
subsystem: frontend-architecture
tags: [context, hooks, refactor, dog, home]
dependency_graph:
  requires: []
  provides: [DogContext-shared-dog-state, useHomeData-hook]
  affects: [src/App.jsx, src/pages/Home.jsx, any-page-that-calls-Dog.filter]
tech_stack:
  added: [src/lib/DogContext.jsx]
  patterns: [React Context, custom hooks, useCallback, separation of concerns]
key_files:
  created: [src/lib/DogContext.jsx]
  modified: [src/App.jsx, src/pages/Home.jsx]
decisions:
  - DogProvider wraps HomeCacheProvider in App.jsx (AuthProvider > DogProvider > HomeCacheProvider)
  - useHomeData is a file-local hook in Home.jsx (no separate file needed at this iteration)
  - refreshHome(u, d) takes user and dog as explicit params to avoid stale closure issues
  - setDogData and setInsights exposed from hook to support optimistic updates in handleCheckin
metrics:
  duration: "311s (~5min)"
  completed_date: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 10 Plan 02: DogContext + useHomeData Extraction Summary

**One-liner:** Shared DogContext (DogProvider + useDog) created and mounted; Home.jsx god-component reduced by extracting useHomeData hook containing fetchDogData, applyDogData, loadInsights, and refreshHome.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Creer DogContext avec useDog hook | 87f503f | src/lib/DogContext.jsx (created), src/App.jsx |
| 2 | Extraire useHomeData hook de Home.jsx | 3a574ac | src/pages/Home.jsx |

## What Was Built

### Task 1 — DogContext

Created `src/lib/DogContext.jsx` with:
- `DogProvider`: fetches the user's dogs via `Dog.filter()` after auth resolves, exposes `dog` (active), `dogs` (list), `setDog`, `setDogs`, `loadingDog`, `refreshDogs`
- `useDog()`: throws `Error("useDog must be used inside DogProvider")` if called outside provider
- Uses `getActiveDog(list)` from `@/utils` to pick the active dog from localStorage

Mounted in `src/App.jsx` between `AuthProvider` and `HomeCacheProvider`:
```
AuthProvider > DogProvider > HomeCacheProvider > AuthenticatedApp
```

### Task 2 — useHomeData hook in Home.jsx

Extracted `function useHomeData()` (file-local hook, before the `Home` export):

**Moved into hook:**
- `fetchDogData(dogId)` — parallel Promise.all fetch of 11 entity types
- `applyDogData(raw)` — maps raw API data to normalized `dogData` state shape
- `applyInsights(insightsData)` — maps insights to state
- `loadInsights(u, dogId)` — premium-gated WeeklyInsight fetch
- States: `dogData`, `insights`, `isDataStale` (+ their setters)
- New: `refreshHome(u, d)` — orchestrates fetchDogData + applyDogData + loadInsights + setCachedHome

**Hook returns:**
```javascript
{ dogData, setDogData, insights, setInsights, isDataStale, setIsDataStale,
  refreshHome, applyDogData, applyInsights, getCachedHome }
```

**`Home` component reduced to:**
- User/dog resolution logic (base44.auth.me + Dog.filter + getActiveDog)
- Cache orchestration (getCachedHome check, fetchAndCache wrapper calling refreshHome)
- UI state (loading, submitting, milestone, premium sheets)
- Render + event handlers

## Verification Results

1. `ls lib/DogContext.jsx` — FOUND
2. `grep "DogProvider" App.jsx | wc -l` — 3 (import + open tag + close tag)
3. `grep "function useHomeData" pages/Home.jsx` — 1 line (line 50)
4. `grep "export.*DogProvider|export.*useDog" lib/DogContext.jsx` — 2 lines

## Deviations from Plan

### Auto-adjusted: getActiveDog call signature

**Found during:** Task 1
**Issue:** Plan's DogContext template called `getActiveDog()` with no args + manual `list.find()` logic. The actual `getActiveDog` in `src/utils/index.ts` takes `(dogs: any[])` as a required parameter and handles localStorage lookup + fallback internally.
**Fix:** Replaced the manual find logic with `getActiveDog(list || [])` — uses the existing utility correctly, less code, consistent behavior.
**Files modified:** src/lib/DogContext.jsx
**Commit:** 87f503f

### Auto-adjusted: Hook signature and setters exposure

**Found during:** Task 2
**Issue:** Plan shows `useHomeData(user, dog)` with params, but `handleCheckin` and `handleMarkInsightRead` in `Home` use `setDogData(prev => ...)` and `setInsights(prev => ...)` for optimistic updates — requiring access to the raw setters.
**Fix:** Changed hook signature to `useHomeData()` with no params (uses internal state + `useCallback`), exposed `setDogData` and `setInsights` in return. `refreshHome(u, d)` takes user+dog as explicit params to avoid stale closures.
**Files modified:** src/pages/Home.jsx
**Commit:** 3a574ac

## Known Stubs

None. All data flows are wired. `DogContext` fetches real data from `Dog.filter()`. `useHomeData.refreshHome` fetches real data from 11 entity types. No hardcoded or placeholder values introduced.

## Self-Check: PASSED

- src/lib/DogContext.jsx — FOUND (verified via `ls`)
- src/App.jsx — DogProvider present (3 occurrences verified)
- src/pages/Home.jsx — `function useHomeData` present at line 50 (verified)
- Commits 87f503f and 3a574ac exist in git log (verified)
