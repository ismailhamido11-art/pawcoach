---
phase: 04-independent-fixes
plan: 03
subsystem: ui
tags: [react, base44, bookmark, completed_days, optimistic-update]

# Dependency graph
requires:
  - phase: 04-independent-fixes
    provides: "04-02 added noon meal to NutritionPlanCard — file already modified"
provides:
  - "BehaviorProgramCard with per-day completion tracking via Bookmark.completed_days"
  - "Optimistic UI update (localCompleted useState) for instant visual feedback"
  - "Mark-done button and CheckCircle2 confirmation in expanded view"
affects: [home, behavior-programs, training]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Optimistic update with null sentinel: localCompleted=null reads server, localCompleted=[...] overrides instantly with rollback on error"
    - "_bookmarkId + _completedDays injected at useMemo level so component stays pure"

key-files:
  created: []
  modified:
    - src/components/home/ActiveProgramCards.jsx

key-decisions:
  - "BehaviorProgramCard completed_days uses Bookmark entity field (bk.completed_days), not content JSON — same convention as TrainingCard"
  - "localCompleted null sentinel: null=use server value, [...]=use local value — avoids stale state after rollback"
  - "Progress bar shows completedCount/7 (real days done), not time-elapsed percentage"

patterns-established:
  - "Optimistic update pattern: setLocalCompleted(newValue) before await, setLocalCompleted(null) on catch"

requirements-completed: [ACT-02]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 4 Plan 3: BehaviorProgramCard Completion Tracking Summary

**BehaviorProgramCard with per-day completion via Bookmark.completed_days, optimistic UI update (instant green on click), and rollback on error**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T07:05:00Z
- **Completed:** 2026-03-11T07:10:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `_bookmarkId` and `_completedDays` injection in `activeBehavior` useMemo — passed from Bookmark entity fields
- Added `localCompleted` useState with null sentinel for optimistic updates with automatic rollback on error
- Replaced time-based progress (`elapsed+1/7`) with real completion count (`completedCount/7`)
- Added "Marquer Jour X comme fait" button in expanded view; shows CheckCircle2 + "Jour X completé !" when already done
- Compact view now shows `completedCount/7` instead of percentage
- Imported `base44` from `@/api/base44Client` for `Bookmark.update` calls
- NutritionPlanCard noon meal (04-02 work) fully preserved

## Task Commits

Each task was committed atomically:

1. **Task 1: Ajouter le tracking completed_days a BehaviorProgramCard** - `1c3e536` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/home/ActiveProgramCards.jsx` - Added completed_days tracking, optimistic update, mark-done button to BehaviorProgramCard; import base44 client; _bookmarkId/_completedDays in activeBehavior useMemo

## Decisions Made
- completed_days read from `bk.completed_days` (Bookmark entity field), not from parsed content JSON — consistent with how the plan specifies it and how TrainingCard conceptually works
- null sentinel for localCompleted avoids needing a separate "hasLocalState" boolean
- Rollback on error restores null so next server refresh picks up actual state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 plans of phase 04-independent-fixes are complete (01: appetite scoring, 02: nutrition noon meal, 03: behavior completion tracking, 04: vet score + PDF)
- Ready for git push and Base44 Publish by Ismail

---
*Phase: 04-independent-fixes*
*Completed: 2026-03-11*
