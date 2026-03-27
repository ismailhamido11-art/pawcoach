---
phase: 03-cache-ux-securite
plan: 03
subsystem: ui
tags: [react, badges, walk, training, rollback, robustness]

# Dependency graph
requires:
  - phase: 03-cache-ux-securite
    provides: cache invalidation patterns already in place (HomeCacheContext)
provides:
  - UX-04: checkWalkBadges called exactly once per walk end (WalkMode/CombinedFAB only)
  - UX-05: UserProgress.delete rollback if updateMe fails in Training
affects:
  - badge integrity
  - training points consistency

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inner try/catch for rollback of already-created DB record before re-throwing"
    - "Badge check centralization: side-effect calls removed from refresh functions"

key-files:
  created: []
  modified:
    - src/pages/Activite.jsx
    - src/pages/Training.jsx

key-decisions:
  - "UX-04: refreshLogs must be a pure data-refresh function — side effects (badge checks) belong in the event trigger (WalkMode/CombinedFAB), not in the refresh callback"
  - "UX-05: rollback pattern — inner try/catch wraps the points update, deletes the UserProgress on failure, then re-throws so the outer catch handles the UI state rollback and toast"

patterns-established:
  - "Rollback pattern: create DB record → try risky follow-up → catch: delete record + throw"
  - "Refresh callbacks stay pure (data only), no side effects"

requirements-completed: [UX-04, UX-05]

# Metrics
duration: 8min
completed: 2026-03-27
---

# Phase 03 Plan 03: Robustesse badges et rollback Training Summary

**Removed duplicate checkWalkBadges call in refreshLogs (UX-04) and added UserProgress.delete rollback when updateMe fails in Training (UX-05)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-27T20:20:00Z
- **Completed:** 2026-03-27T20:28:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Eliminated double badge check: checkWalkBadges was called twice per walk end (once in WalkMode at line 317, then again in refreshLogs via onLogged callback). Now refreshLogs is a pure data-reload function.
- Added transactional rollback in Training: if UserProgress.create succeeds but updateMe fails, the created UserProgress record is deleted before re-throwing so the outer catch can roll back the UI state. Zero orphan records, zero phantom points.
- Import of checkWalkBadges removed from Activite.jsx entirely (no longer needed).

## Task Commits

Each task was committed atomically:

1. **Task 1: Activite.jsx - supprimer checkWalkBadges doublon dans refreshLogs** - `b096427` (fix)
2. **Task 2: Training.jsx - rollback UserProgress si updateMe echoue** - `b6cbeef` (fix)

## Files Created/Modified

- `src/pages/Activite.jsx` - Removed checkWalkBadges import and call from refreshLogs; added UX-04 comment
- `src/pages/Training.jsx` - Wrapped updateMe in inner try/catch with UserProgress.delete rollback; added UX-05 comment

## Decisions Made

- refreshLogs stays pure (data reload + cache invalidation only) — badge checks are side effects that belong at the event source (WalkMode/CombinedFAB), not in a generic refresh callback.
- Rollback pattern chosen: delete the newly created record, then re-throw. This lets the existing outer catch handle UI rollback (setProgresses(progresses)) and toast notification without duplication.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 03 plan 03 complete. Both UX-04 and UX-05 robustness fixes shipped.
- Ready for next plan in phase 03 (if any) or phase completion.

---
*Phase: 03-cache-ux-securite*
*Completed: 2026-03-27*
