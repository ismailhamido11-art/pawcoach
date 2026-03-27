---
phase: 01-backend-critique
plan: 03
subsystem: backend-functions, dog-management
tags: [bug-fix, tech-debt, orphaned-data, trial-users, cascade-delete]
dependency_graph:
  requires: []
  provides: [TECH-04, TECH-05]
  affects:
    - base44/functions/monthlySummary/entry.ts
    - src/pages/DogProfile.jsx
tech_stack:
  added: []
  patterns:
    - in-memory filter on trial_expires_at instead of non-existent is_trial SDK field
    - extend entityNames array for cascade delete coverage
key_files:
  created: []
  modified:
    - base44/functions/monthlySummary/entry.ts
    - src/pages/DogProfile.jsx
decisions:
  - "Use is_premium: false filter + in-memory trial_expires_at check instead of User.list() global to stay scalable"
  - "No import of ParkReview/PlaceFavorite needed in DogProfile — existing base44.entities[name].deleteMany pattern covers it"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-27T16:33:52Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 01 Plan 03: Backend Critique — is_trial + Cascade Delete Summary

**One-liner:** Fix silent is_trial SDK failure causing trial users to miss monthly emails, and add ParkReview/PlaceFavorite to cascade delete to eliminate orphaned DB records.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix is_trial in monthlySummary (TECH-04) | `25eda54` | base44/functions/monthlySummary/entry.ts |
| 2 | Add ParkReview/PlaceFavorite to cascade delete (TECH-05) | `8317d63` | src/pages/DogProfile.jsx |

## What Was Done

### Task 1 — TECH-04: is_trial inexistant dans monthlySummary

**Problem:** `User.filter({ is_trial: true })` silently returned `[]` because the field `is_trial` does not exist in the Base44 schema. The real field is `trial_expires_at`. As a result, active trial users were excluded from the `allEligibleUsers` merge and never received their monthly summary email.

**Fix:** Replaced the broken SDK filter with:
1. `User.filter({ is_premium: false })` to fetch non-premium users (scoped, not global)
2. In-memory filter: `u.trial_expires_at && new Date(u.trial_expires_at) > now` to identify active trial users
3. Merge with premium users + dedup by email

**Why `is_premium: false` not `User.list()`:** Stays scalable — avoids loading the entire user table. Only loads users without premium flag, which at scale is a bounded set.

### Task 2 — TECH-05: ParkReview et PlaceFavorite absents du cascade delete

**Problem:** `handleDeleteDog` in DogProfile.jsx had 16 entities in `entityNames` but was missing `ParkReview` and `PlaceFavorite`. Both entities store `dog_id` as a foreign key. Deleting a dog left these records as orphans in the DB.

**Fix:** Added `"ParkReview"` and `"PlaceFavorite"` to the `entityNames` array. The existing `base44.entities[name].deleteMany({ dog_id: dog.id }).catch(() => {})` pattern handles them without any additional import or logic change.

## Verification Results

```
TECH-04: is_trial SDK call check — PASS: no is_trial SDK call
TECH-04: trial_expires_at occurrences — 4 (comment + filter + logic)
TECH-04: is_premium: false filter — present
TECH-04: activeTrialUsers variable — defined and used

TECH-05: ParkReview in DogProfile.jsx — line 134 (entityNames)
TECH-05: PlaceFavorite in DogProfile.jsx — line 134 (entityNames)
TECH-05: handleDeleteDog rest unchanged — Dog.delete, localStorage, navigate intact
```

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `today` variable usage but `now` was already defined in scope (line 7). Used `now` directly as instructed in the plan notes ("now est deja defini en ligne 7").

## Known Stubs

None.

## Self-Check: PASSED

Files exist and contain expected patterns:
- `base44/functions/monthlySummary/entry.ts` — no `is_trial` SDK call, `trial_expires_at` present in 4 lines
- `src/pages/DogProfile.jsx` — `ParkReview` and `PlaceFavorite` on line 134
- Commits `25eda54` and `8317d63` verified in git log
