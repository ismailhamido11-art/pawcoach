---
phase: 02-donnees-stale
plan: 02
subsystem: frontend
tags: [stale-state, dog-weight, react-hooks, nutrition, growth-tracker]
dependency_graph:
  requires: []
  provides: [STALE-02, STALE-04]
  affects: [src/pages/Sante.jsx, src/components/nutrition/NutritionMealPlan.jsx]
tech_stack:
  added: [useMemo]
  patterns: [optimistic-state-update, computed-from-real-data]
key_files:
  created: []
  modified:
    - src/pages/Sante.jsx
    - src/components/nutrition/NutritionMealPlan.jsx
decisions:
  - "STALE-05 confirmed as dead code (DogRadarHero never rendered). Dashboard and NotebookContent already use correct formula — no fix needed."
  - "useMemo placed before if(!dog) early return to comply with React hooks rules"
  - "latestRealWeight falls back to dog?.weight when no measured data exists — preserves current behavior"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-27"
  tasks: 2
  files: 2
---

# Phase 02 Plan 02: Stale Dog Weight Fixes (STALE-02, STALE-04, STALE-05) Summary

**One-liner:** Dog state refreshed optimistically after GrowthTracker weight entry; NutritionMealPlan now derives weight from real measured records (healthRecords + dailyLogs) instead of potentially stale dog.weight profile field.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refresh dog state after weight update in Sante.jsx (STALE-02) | 13de856 | src/pages/Sante.jsx |
| 2 | NutritionMealPlan uses latest real weight (STALE-04) | e021b8a | src/components/nutrition/NutritionMealPlan.jsx |

## What Was Done

### Task 1 — STALE-02: Sante.jsx dog state refresh

The `onGrowthAdded` callback in `Sante.jsx` only called `setGrowthEntries`. After `GrowthTrackerContent` calls `Dog.update(dog.id, { weight: entry.weight_kg })` in the DB and then fires `onGrowthAdded(entry)`, the local `dog` React state was not updated. The weight shown on the Sante page (in the hero and any dog-dependent displays) would remain stale until a full page reload.

Fix: The callback now also calls `setDog(prev => prev ? { ...prev, weight: entry.weight_kg } : prev)` when `entry.weight_kg` is present. Both `setGrowthEntries` and `setDog` are in the same callback block.

### Task 2 — STALE-04: NutritionMealPlan real weight

`NutritionMealPlan.jsx` used `dog.weight` in three places: the `dog_weight_at_generation` field when saving a plan (line 153), the AI prompt string PROFIL section (line 274), and the display badge in the dog profile card (line 675). Since `dog.weight` is the profile field (potentially updated only when the user explicitly edits the profile), it could lag behind actual measured weights.

Fix: Added `latestRealWeight` computed via `useMemo` from `healthRecords` (type=weight) and `dailyLogs` (weight_kg), sorted chronologically, taking the last value. Falls back to `dog?.weight` if no measured data exists. All three `dog.weight` instances replaced.

### STALE-05 — Confirmed No Fix Needed

`DogRadarHero.jsx` is exported but never imported/rendered anywhere in the app. It is dead code. Dashboard.jsx and NotebookContent already use `computeHealthScore(records, dog, [...growthEntries, ...dailyLogs])` — the correct formula. No user impact.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data sources are wired to real API data.

## Out-of-Scope Discoveries

Other `dog.weight` references found in the codebase during CGC proactive sweep (CLAUDE.md rule), not covered by this plan:

- `src/components/dogprofile/DogIdentityCards.jsx` — already uses `latestLogWeight || dog.weight` (correct)
- `src/components/dogprofile/DogProfileHero.jsx` — already uses `latestLog?.weight_kg || dog.weight` (correct)
- `src/components/home/CoachHomeHeader.jsx` — display only, no calculation
- `src/components/home/DogRadarHero.jsx` — dead code (STALE-05)
- `src/components/scan/LabelScanMode.jsx`, `src/components/nutrition/FoodComparator.jsx`, etc. — AI prompts using profile weight (read-only, no mutation)

These are logged here for awareness but are outside this plan's scope. DogIdentityCards and DogProfileHero already have the right pattern. The others (AI prompts) use `dog.weight` for context only and are lower priority.

## Verification Results

- `grep "setDog" src/pages/Sante.jsx` → 3 matches (useState, loadData, onGrowthAdded callback) [verified]
- `grep "dog\.weight" src/components/nutrition/NutritionMealPlan.jsx` → 0 matches [verified]
- `grep "latestRealWeight" src/components/nutrition/NutritionMealPlan.jsx` → 4 matches (declaration, line 162, line 283, line 684) [verified]
- `grep "useMemo" src/components/nutrition/NutritionMealPlan.jsx` → in import at line 1 [verified]

## Self-Check: PASSED
