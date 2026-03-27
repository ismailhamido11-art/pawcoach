---
phase: 02-donnees-fausses
plan: 02
subsystem: sante, home
tags: [data-integrity, dog-sync, checkin, fabricated-data]
dependency_graph:
  requires: []
  provides: [Dog.weight sync after GrowthEntry, honest quick check-in payload]
  affects: [CoachHomeHeader weight badge, AI nutrition calculations, wellness score, recommendations]
tech_stack:
  added: []
  patterns: [entity sync after create, minimal payload pattern]
key_files:
  created: []
  modified:
    - src/components/sante/GrowthTrackerContent.jsx
    - src/components/home/DailyBriefing.jsx
decisions:
  - Dog.update wrapped in try/catch so GrowthEntry.create flow never breaks if sync fails
  - handleMoodTap sends only { mood } — energy/appetite remain null until user explicitly inputs them
metrics:
  duration: ~6min
  completed: 2026-03-27T16:51:43Z
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 02 Plan 02: Donnees Fabricuees — GrowthTracker + Quick Check-in Summary

## One-liner

Dog.weight synced after each GrowthEntry save (photo IA + manual) via try/catch Dog.update; handleMoodTap quick check-in no longer forges energy/appetite values.

## What Was Done

### Task 1: Synchroniser Dog.weight apres GrowthEntry.create (DATA-03)

- Added `Dog` to imports alongside `GrowthEntry` in `GrowthTrackerContent.jsx`
- In `saveAnalysis()`: after `GrowthEntry.create`, added `Dog.update(dog.id, { weight: entry.weight_kg })` guarded by `if (entry.weight_kg)` and wrapped in try/catch
- In `saveManual()`: after `GrowthEntry.create`, added `Dog.update(dog.id, { weight: parsedWeight })` wrapped in try/catch
- Pattern-proactif: `GrowthEntry.create` searched across all of `src/` — only 2 instances, both in `GrowthTrackerContent.jsx`, both now synced

**Result:** After saving a growth measure (photo IA or manual), `Dog.weight` is updated in DB. CoachHomeHeader weight badge will reflect the new value on next render. AI nutrition calculations will use the real current weight.

### Task 2: Supprimer la fabrication energy/appetite dans handleMoodTap (DATA-04)

- In `DailyBriefing.jsx`, changed `handleMoodTap` from:
  ```js
  onQuickCheckin({ mood, energy: mood >= 4 ? 4 : 3, appetite: mood >= 4 ? 4 : 3 });
  ```
  to:
  ```js
  onQuickCheckin({ mood });
  ```
- `energy` and `appetite` are no longer fabricated from mood — they remain `null` in DB when user does not input them

**Result:** Quick check-in payload is honest. Wellness score and recommendations use only data the user actually provided.

## Verification Results

| Check | Result |
|-------|--------|
| `grep "Dog.update" GrowthTrackerContent.jsx` | 2 lines (saveAnalysis + saveManual) |
| `grep "energy:" DailyBriefing.jsx` | 0 matches |
| `grep "appetite:" DailyBriefing.jsx` | 0 matches |
| `grep -rn "GrowthEntry.create" src/` | 2 instances, both in GrowthTrackerContent.jsx, both now synced |

## Commits

| Hash | Task | Description |
|------|------|-------------|
| 456001d | Task 1 | fix(02-02): sync Dog.weight after GrowthEntry.create in saveAnalysis and saveManual |
| 6752e3c | Task 2 | fix(02-02): remove fabricated energy/appetite from handleMoodTap quick check-in |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `src/components/sante/GrowthTrackerContent.jsx` — modified, Dog.update present at lines 125 and 167
- `src/components/home/DailyBriefing.jsx` — modified, handleMoodTap sends { mood } only
- Commits 456001d and 6752e3c exist in git log
