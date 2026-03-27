---
phase: "05-edge-cases-polish"
plan: "02"
subsystem: "vet, tracker, premium, home"
tags: [bugfix, data-integrity, dead-code, edge-cases]
dependency_graph:
  requires: []
  provides: [EDGE-04, EDGE-05, EDGE-06, EDGE-07]
  affects: [VetDogView, WalkMode, AIDiagnosisModal, Home, PremiumNudgeSheet]
tech_stack:
  added: []
  patterns: [defensive-guard, json-error-detection, filter-before-sort]
key_files:
  modified:
    - src/pages/VetDogView.jsx
    - src/components/tracker/WalkMode.jsx
    - src/components/vet/AIDiagnosisModal.jsx
    - src/pages/Home.jsx
    - src/components/premium/PremiumNudgeSheet.jsx
decisions:
  - "Filter weight records before .sort() in chrono list (not after) to avoid incorrect index usage"
  - "Add user?.email to useEffect dep array so recovery re-runs when user loads async"
  - "Two-pass JSON error detection: object check first, then string startsWith check"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-27T03:13:00Z"
  tasks_completed: 4
  files_modified: 5
---

# Phase 05 Plan 02: Edge Cases Polish — Bug Fixes Summary

Four surgical bug fixes: weight dedup in VetDogView, orphan DailyLog guard in WalkMode, JSON error detection before PDF blob creation in AIDiagnosisModal, and dead code removal in Home/PremiumNudgeSheet.

## Completed Tasks

| Task | Requirement | File | Commit |
|------|-------------|------|--------|
| 1 | EDGE-04 | src/pages/VetDogView.jsx | 46e1c5e |
| 2 | EDGE-05 | src/components/tracker/WalkMode.jsx | b91fc13 |
| 3 | EDGE-06 | src/components/vet/AIDiagnosisModal.jsx | 691560a |
| 4 | EDGE-07 | src/pages/Home.jsx + PremiumNudgeSheet.jsx | 151452e |

## What Was Done

### Task 1 — EDGE-04: VetDogView weight dedup (46e1c5e)
Added `.filter(r => !(sharedSections.includes("weight") && r.type === "weight"))` before `.sort()` in the chronological records list. When `SectionPoids` is already rendered (which displays weight records in its own dedicated section), weight-type records are now excluded from the generic chrono list below it. Zero duplication.

### Task 2 — EDGE-05: WalkMode orphan DailyLog guard (b91fc13)
Added `if (!user?.email) return;` at the start of the recovery IIFE, and added `user?.email` to the useEffect dependency array. This prevents the recovery useEffect from creating a `DailyLog` without an owner when the user object hasn't loaded yet (e.g., on cold start). If the email arrives later (async auth), the effect re-runs correctly.

### Task 3 — EDGE-06: AIDiagnosisModal JSON error detection (691560a)
Inserted two guards before `new Blob([res.data], { type: "application/pdf" })`:
1. Object check: `if (res.data && typeof res.data === "object" && res.data.error)` — catches structured error objects
2. String check: `if (typeof res.data === "string" && res.data.startsWith("{"))` — catches JSON stringified errors

Both guards show a `toast.error()` with the backend message and return early. The `new Blob` line is preserved for valid responses.

### Task 4 — EDGE-07: Dead code removal (151452e)
- Deleted the 22-line `walkStreak` useMemo block from `Home.jsx` — it computed a walk streak that was never rendered or passed to any child component.
- Removed `context: _context = "default"` from `PremiumNudgeSheet` signature — the param was never read in the component body, and no call site passes it.

## Deviations from Plan

None — plan executed exactly as written. All 5 acceptance criteria verified via grep before each commit.

## Known Stubs

None.

## Self-Check

Verifications run after all tasks:
1. `grep "filter(r => !(sharedSections" src/pages/VetDogView.jsx` — 1 result at line 136
2. `grep "if (!user?.email) return" src/components/tracker/WalkMode.jsx` — 1 result at line 107
3. `grep "res.data.error" src/components/vet/AIDiagnosisModal.jsx` — 1 result at line 201
4. `grep "walkStreak" src/pages/Home.jsx` — 0 results
5. `grep "_context" src/components/premium/PremiumNudgeSheet.jsx` — 0 results

## Self-Check: PASSED
