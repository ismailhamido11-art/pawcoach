---
phase: 04-independent-fixes
plan: 01
subsystem: ui
tags: [react, smartalerts, walkmode, streak, appetite, lucide-react]

# Dependency graph
requires:
  - phase: 01-data-coherence
    provides: DailyLog fields (walk_minutes, appetite), Streak entity
  - phase: 03-notifications
    provides: streakHelper.updateStreakSilently (already used in check-ins)
provides:
  - SmartAlerts appetite trend detection (warning + critical + ok alerts)
  - WalkMode streak update after walk save
affects: [dashboard, home-tracker, streakHelper consumers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Appetite string → numeric score mapping: none:0, decreased:1, normal:2, increased:3"
    - "Dedup guard pattern: updateStreakSilently has last_activity_date guard — safe to call from multiple entry points"

key-files:
  created: []
  modified:
    - src/components/dashboard/SmartAlerts.jsx
    - src/components/tracker/WalkMode.jsx

key-decisions:
  - "Appetite scoring: none=0, decreased=1, normal=2, increased=3 (symmetric around normal=2)"
  - "ok appetite alert suppressed if critical vitality alert already present (avoid alert spam)"
  - "updateStreakSilently called with .catch(()=>{}) — walk save must not fail if streak update fails"

patterns-established:
  - "Pattern: Multiple activity types (check-in, walk, training) all call updateStreakSilently — dedup guard ensures correctness"

requirements-completed: [DASH-01, ACT-01]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 04 Plan 01: Independent Fixes Summary

**Appetite trend detection in SmartAlerts (critical/warning/ok) + WalkMode now updates the daily streak after a walk save**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-11T06:23:31Z
- **Completed:** 2026-03-11T06:28:31Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- SmartAlerts now detects appetite decline across 7-day windows: critical alert (drop >= 1.0 pts), warning alert (drop >= 0.5 pts), ok alert (avg >= 2.5 and no critical vitality)
- WalkMode handleStop now calls `updateStreakSilently` after `checkWalkBadges` — walks count as daily activity for streak
- No regression on existing vitality/vaccine/weight/streak/inactivity alert blocks

## Task Commits

Each task was committed atomically:

1. **Task 1: Ajouter la detection de tendance appetit dans SmartAlerts** - `bb5b33b` (feat)
2. **Task 2: Appeler updateStreakSilently apres save d'une balade dans WalkMode** - `16575fd` (feat)

## Files Created/Modified
- `src/components/dashboard/SmartAlerts.jsx` - Added UtensilsCrossed import, bloc 1b TENDANCE APPETIT with appetite_drop_critical, appetite_drop_warning, appetite_good alerts
- `src/components/tracker/WalkMode.jsx` - Added updateStreakSilently import + call in handleStop after checkWalkBadges

## Decisions Made
- Appetite mapped to integers (none=0, decreased=1, normal=2, increased=3) — same numeric range as mood/energy, enables same drop-threshold logic
- "Bon appétit" ok alert is suppressed when a critical vitality alert is already shown — avoids contradictory signals on the same screen
- `updateStreakSilently` called fire-and-forget (`.catch(()=>{})`) — same pattern as Training.jsx, walk persistence must not fail due to streak error

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Appetite alert data flow ready: DailyCheckin.appetite field → SmartAlerts → user sees trend
- Streak coverage is now complete: check-in + walk + training all update streak
- Plans 04-02, 04-03, 04-04 can proceed independently (no dependencies on this plan)

---
*Phase: 04-independent-fixes*
*Completed: 2026-03-11*
