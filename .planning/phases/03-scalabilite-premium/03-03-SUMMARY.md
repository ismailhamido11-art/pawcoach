---
phase: 03-scalabilite-premium
plan: "03"
subsystem: credits-ui
tags: [bugfix, credits, double-click, ux, referral]
dependency_graph:
  requires: []
  provides: [PREM-02, PREM-03, PREM-04]
  affects: [src/hooks/useActionCredits.js, src/components/activite/AITrainingProgram.jsx, src/components/profile/ReferralSection.jsx]
tech_stack:
  added: []
  patterns: [useRef guard, React disabled prop, null component pattern]
key_files:
  modified:
    - src/hooks/useActionCredits.js
    - src/components/activite/AITrainingProgram.jsx
    - src/components/profile/ReferralSection.jsx
decisions:
  - "useRef chosen over useState for consuming flag — avoids re-render, works atomically in closure"
  - "ReferralSection returns null (file kept) to avoid breaking imports in Profile.jsx"
  - "!loading added to UpgradePrompt condition to suppress flash during credits initialization"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-27T02:44:47Z"
  tasks_completed: 3
  files_modified: 3
---

# Phase 03 Plan 03: Credits Guard + UI Fixes Summary

**One-liner:** Anti-double-click guard on consume() via useRef, disabled button during generation, UpgradePrompt loading suppression, and referral section removed (no backend).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | useActionCredits — guard anti-double-appel | 60511a3 | src/hooks/useActionCredits.js |
| 2 | AITrainingProgram — disabled + loading guard | d59a96c | src/components/activite/AITrainingProgram.jsx |
| 3 | ReferralSection — retirer le composant | 4960c1b | src/components/profile/ReferralSection.jsx |

## What Was Built

### Task 1 — consume() guard (useActionCredits.js)
Added `consumingRef = useRef(false)` inside `useActionCredits`. The `consume()` function now checks `consumingRef.current` before proceeding — returns `false` immediately if a call is already in progress. The flag is set to `true` before the async call and reset to `false` in `finally`, guaranteeing reset even on error. A double-click now consumes exactly 0 or 1 credit, never 2.

### Task 2 — AITrainingProgram button guard (AITrainingProgram.jsx)
Three changes in one file:
1. `if (generating) return;` added at the top of `generate()` — second call exits immediately before any state mutation.
2. `disabled={generating}` added to the Generer button — React disables it during the async operation.
3. `loading` added to `useActionCredits()` destructuring, and `!loading` added to the `UpgradePrompt` condition — prevents the upgrade prompt from flashing briefly while credits load on first render.

### Task 3 — ReferralSection removed (ReferralSection.jsx)
The full referral UI (code generation, copy, share) was replaced with a single `return null`. File kept on disk to avoid breaking the import in Profile.jsx. Comment references PREM-04 for traceability.

## Success Criteria Verification

```
PREM-02 guard consume : 4 occurrences of consumingRef/consuming.current [PASS]
PREM-02 guard generate : if (generating) return present [PASS]
PREM-03 loading guard  : !loading && !hasCredits in UpgradePrompt condition [PASS]
PREM-04 section retired: return null in ReferralSection [PASS]
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes are behavioral fixes, no placeholder data introduced.

## Self-Check: PASSED

- src/hooks/useActionCredits.js — exists, contains consumingRef [verified]
- src/components/activite/AITrainingProgram.jsx — exists, contains all guards [verified]
- src/components/profile/ReferralSection.jsx — exists, returns null [verified]
- Commits 60511a3, d59a96c, 4960c1b — present in git log [verified]
