---
phase: 02-donnees-stale
plan: 01
subsystem: health-data
tags: [stale-data, weight, smart-alerts, health-status]
dependency_graph:
  requires: []
  provides: [STALE-01, STALE-03]
  affects:
    - src/components/dashboard/SmartAlerts.jsx
    - src/utils/healthStatus.js
    - src/components/sante/NotebookContent.jsx (via computeNotebookSummary)
    - src/components/vet/DownloadHealthPDF.jsx (caller unaffected, default param)
tech_stack:
  added: []
  patterns:
    - Dedup by date using Set (HealthRecord wins over GrowthEntry)
    - Default param guard (extraWeightSources = []) for backward compat
key_files:
  created: []
  modified:
    - src/components/dashboard/SmartAlerts.jsx
    - src/utils/healthStatus.js
decisions:
  - Compare 2 real measured weights in SmartAlerts instead of latest vs stale dog.weight profile field
  - Add extraWeightSources param with default=[] to computeStatusPills to keep DownloadHealthPDF.jsx unaffected
metrics:
  duration: "~10 min"
  completed: "2026-03-27"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 01: Weight Data Truth Fixes Summary

**One-liner:** Fixed weight drift alert (SmartAlerts) and weight status pill (computeStatusPills) to use real measured weights from GrowthEntries/DailyLogs instead of stale dog.weight profile field.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix SmartAlerts weight comparison — 2 real weights (STALE-01) | 5bfaa54 | src/components/dashboard/SmartAlerts.jsx |
| 2 | Fix computeStatusPills to include GrowthEntries (STALE-03) | 5e4cc1d | src/utils/healthStatus.js |

## What Was Built

### Task 1 — SmartAlerts weight drift (STALE-01)

The weight alert section (section 3 of `computeAlerts`) was comparing the latest measured weight against `dog.weight` (a stale profile field that may not match real measurements). The fix:

- Condition changed from `allWeights.length >= 2 && dog?.weight` to `allWeights.length >= 2`
- `previous` is now `allWeights[allWeights.length - 2].v` (real measurement) instead of `dog.weight`
- Percentage uses `previous` as denominator with zero-division guard
- Description now reads "entre les 2 dernières pesées (X kg → Y kg)" — shows both real values

### Task 2 — computeStatusPills weight pill (STALE-03)

The weight pill in `computeStatusPills` only looked at `HealthRecord` entries with `type="weight"`. Dogs that were weighed via `GrowthEntry` (growth tracking) or `DailyLog` had no HealthRecord weights, so the pill showed "Non suivi" even when weight data existed. The fix:

- Added `extraWeightSources = []` third param to `computeStatusPills`
- Merges GrowthEntry/DailyLog weights as pseudo-records before calling `computeWeightTrend`
- Deduplicates by date (HealthRecord wins when same date exists in both)
- `computeNotebookSummary` already received `growthEntries` as third param — now passes them through to `computeStatusPills`
- `DownloadHealthPDF.jsx` caller is unaffected (calls with 2 params, default `[]` applies)

## Verification

1. `grep "dog\.weight" SmartAlerts.jsx` — returns 0 matches in weight section
2. `allWeights[allWeights.length - 2]` present at line 203
3. "2 dernières pesées" present at line 213
4. `computeStatusPills(records, dog, extraWeightSources = [])` — 3 params, line 399
5. `computeStatusPills(recs, dog, growthEntries)` in computeNotebookSummary — line 655
6. `hrDates` Set dedup present at lines 426-427
7. `DownloadHealthPDF.jsx` still calls with 2 params — backward compat confirmed

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files confirmed modified:
- `src/components/dashboard/SmartAlerts.jsx` — FOUND
- `src/utils/healthStatus.js` — FOUND

Commits confirmed:
- `5bfaa54` — FOUND (fix(02-01): SmartAlerts weight alert)
- `5e4cc1d` — FOUND (fix(02-01): computeStatusPills includes GrowthEntry weights)
