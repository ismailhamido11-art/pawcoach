---
phase: 07-flow-fixes
plan: "04"
subsystem: frontend
tags: [resilience, error-handling, ux, mobile, stale-data]
dependency_graph:
  requires: []
  provides: [FIX-21, FIX-22, FIX-23, FIX-24, FIX-27]
  affects: [Dashboard.jsx, Home.jsx, Nutri.jsx, DogProfile.jsx]
tech_stack:
  added: []
  patterns:
    - "Promise.all with per-call .catch(() => []) for resilience"
    - "isDataStale state + amber badge for background refresh failures"
    - "Re-fetch fallback instead of id-less object construction"
    - "toast.error on 429 quota_exceeded"
    - "setTimeout 5s before revokeObjectURL for mobile download race"
key_files:
  modified:
    - src/pages/Dashboard.jsx
    - src/pages/Home.jsx
    - src/pages/DogProfile.jsx
  created: []
decisions:
  - "FIX-23: chose silent re-fetch over toast.warn for better UX — user doesn't see the check-in succeed then fail"
  - "FIX-22: amber badge (not toast) for stale data to avoid interrupting the user mid-session"
metrics:
  duration: ~15min
  completed_date: "2026-03-27"
  tasks_completed: 3
  files_modified: 3
---

# Phase 07 Plan 04: Critical Flow Fixes (Dashboard, Home, Nutri, DogProfile) Summary

**One-liner:** Per-call `.catch(() => [])` on all Dashboard Promise.all fetches, amber stale-data badge on Home background refresh failure, id-guard on checkin response, toast on NutriCoach quota, and 5s-deferred `revokeObjectURL` for mobile.

## Tasks Completed

| Task | Fix | Commit | Files |
|------|-----|--------|-------|
| 1 | FIX-21: Dashboard Promise.all — 5 calls get `.catch(() => [])` | `4dcaf38` | Dashboard.jsx |
| 2 | FIX-22/23/24: Home stale badge + checkin id guard, Nutri 429 toast | `fc1815c` | Home.jsx (Nutri.jsx via 07-03) |
| 3 | FIX-27: DogProfile revokeObjectURL deferred 5s | `3833e8a` | DogProfile.jsx |

## Changes by File

### Dashboard.jsx — FIX-21

Before (2 of 7 calls protected):
```javascript
HealthRecord.filter({ dog_id: d.id }, "-date", 100),       // unprotected
DailyCheckin.filter({ dog_id: d.id }, "-date", 90),        // unprotected
Streak.filter({ dog_id: d.id }),                           // unprotected
UserProgress.filter({ dog_id: d.id }),                     // unprotected
DailyLog.filter({ dog_id: d.id }, "-date", 90),            // unprotected
FoodScan.filter({ dog_id: d.id }, "-timestamp", 20).catch(() => []),
GrowthEntry.filter({ dog_id: d.id }, "-date", 50).catch(() => []),
```

After (all 7 protected):
```javascript
HealthRecord.filter({ dog_id: d.id }, "-date", 100).catch(() => []),
DailyCheckin.filter({ dog_id: d.id }, "-date", 90).catch(() => []),
Streak.filter({ dog_id: d.id }).catch(() => []),
UserProgress.filter({ dog_id: d.id }).catch(() => []),
DailyLog.filter({ dog_id: d.id }, "-date", 90).catch(() => []),
FoodScan.filter({ dog_id: d.id }, "-timestamp", 20).catch(() => []),
GrowthEntry.filter({ dog_id: d.id }, "-date", 50).catch(() => []),
```

### Home.jsx — FIX-22 + FIX-23

**FIX-22 (stale data indicator):**
- Line 110: `const [isDataStale, setIsDataStale] = useState(false);`
- Line 199: `setIsDataStale(false);` — reset on successful refresh
- Line 210: `setIsDataStale(true);` — set in catch when skipLoadingState=true
- Lines 482-487: amber badge JSX rendered when `isDataStale === true`

**FIX-23 (checkin id guard):**
- Line 292: `let newCheckin = result.checkin;` — no longer falls back to id-less object
- Lines 293-303: if `result.checkin` absent, silent re-fetch via `DailyCheckin.filter` to get DB object with id; if that fails too, `newCheckin = null`

### Nutri.jsx — FIX-24

Note: FIX-24 was applied by parallel executor 07-03 (commit `ac97c24`) before this plan's Task 2 ran. The changes are confirmed present:
- Line 345: `toast.error("Limite de messages atteinte pour aujourd'hui.")` on `quota_exceeded` in try block
- Line 356: same toast in catch block on `quota_exceeded` or `status === 429`

### DogProfile.jsx — FIX-27

Before (line 123):
```javascript
URL.revokeObjectURL(url);
```

After:
```javascript
setTimeout(() => URL.revokeObjectURL(url), 5000); // délai 5s pour mobile
```

## Verification Results

- FIX-21: `grep -c ".catch(() => [])" Dashboard.jsx` → **7** (was 2)
- FIX-22: `isDataStale` state with 4 references (declaration, reset, set, JSX)
- FIX-22: amber badge text "Données mises en cache" confirmed at line 484
- FIX-23: `result.checkin` fallback to id-less object eliminated; re-fetch or null
- FIX-24: "Limite de messages" at 2 lines in Nutri.jsx (both branches)
- FIX-27: `setTimeout.*revokeObjectURL` at line 123 of DogProfile.jsx; direct call gone

## Deviations from Plan

### FIX-24 already applied by parallel executor

**Found during:** Task 2 (Nutri.jsx staging)
**Issue:** Parallel executor 07-03 had already added the `toast.error("Limite de messages...")` calls to Nutri.jsx before this plan's git add ran.
**Impact:** My edits to Nutri.jsx were effectively no-ops (file already had correct content). FIX-24 is correctly implemented.
**Resolution:** Verified via grep that both branches contain the toast — no further action needed.

## Known Stubs

None — all fixes are concrete behavior changes with no placeholder data.

## Self-Check: PASSED

- Dashboard.jsx modified and committed at `4dcaf38` — verified
- Home.jsx modified and committed at `fc1815c` — verified
- DogProfile.jsx modified and committed at `3833e8a` — verified
- All 5 fixes confirmed via grep
