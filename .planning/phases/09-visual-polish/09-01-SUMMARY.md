---
phase: 09-visual-polish
plan: 01
subsystem: design-system
tags: [color-palette, tailwind, charte-couleur, amber, orange, yellow, teal]
dependency_graph:
  requires: []
  provides: [FIX-44, FIX-45, FIX-46]
  affects: [badgeUtils, DogTrophiesRow, EmotionalTip, InlineCheckin, StreakBar, AchievementsSection, CoachSettings, DiagnosisContent, TrackerHistory, AITrainingProgram, NearbyParks, Home, Sante, Profile]
tech_stack:
  added: []
  patterns: [tailwind-color-replacement, design-system-enforcement]
key_files:
  created: []
  modified:
    - src/components/achievements/badgeUtils.jsx
    - src/components/dogprofile/DogTrophiesRow.jsx
    - src/components/home/EmotionalTip.jsx
    - src/components/home/InlineCheckin.jsx
    - src/components/home/StreakBar.jsx
    - src/components/profile/AchievementsSection.jsx
    - src/components/profile/CoachSettings.jsx
    - src/components/sante/DiagnosisContent.jsx
    - src/components/tracker/TrackerHistory.jsx
    - src/components/activite/AITrainingProgram.jsx
    - src/components/tracker/NearbyParks.jsx
    - src/pages/Home.jsx
    - src/pages/Sante.jsx
decisions:
  - Replaced orange-500/600 uniformly with amber-500/600 across all icon colors and urgency states
  - Replaced yellow-500/600 with amber-500/600 for consistency
  - Replaced teal-50 gradient with emerald-50/80 (emerald is the approved positive color)
  - Replaced orange gradient stops with amber equivalents (to-orange -> to-amber, via-orange -> via-amber)
  - Profile.jsx yellow fix was already applied in prior execution (09-04 commit 1d9a41e) — no-op confirmed
metrics:
  duration: 305 seconds
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_modified: 13
---

# Phase 09 Plan 01: Color Charter Cleanup (FIX-44, FIX-45, FIX-46) Summary

**One-liner:** Eliminated all orange/yellow/teal Tailwind violations from 13 components — replaced with amber (warnings) and emerald (positive states) per "Nature Premium" charter.

## What Was Built

Systematic color charter enforcement across the codebase. The PawCoach "Nature Premium" design system mandates ZERO orange, ZERO yellow, ZERO teal. This plan removed all violations found during the visual audit.

## Tasks Completed

### Task 1 — Orange cleanup in 9 components (FIX-44)
**Commit:** `d927483`

| File | Change |
|------|--------|
| badgeUtils.jsx | streak_3 color: text-orange-500 -> text-amber-500 |
| DogTrophiesRow.jsx | 1er streak iconColor: text-orange-500 -> text-amber-500 |
| EmotionalTip.jsx | nutrition icon: text-orange-500 -> text-amber-500 |
| InlineCheckin.jsx | Energie Eleve: text-orange-500 -> text-amber-500 |
| StreakBar.jsx | getNextBadge iconColor: text-orange-500 -> text-amber-500 |
| AchievementsSection.jsx | streak_3 badge: text-orange-500 -> text-amber-500 |
| CoachSettings.jsx | nutrition topic: text-orange-500 -> text-amber-500 |
| DiagnosisContent.jsx | high urgency: text-orange-600/bg-orange-50/border-orange-200 -> amber equivalents |
| TrackerHistory.jsx | streak >=7 flame: text-orange-500 -> text-amber-500 |

### Task 2 — Yellow/teal/gradient cleanup (FIX-45, FIX-46)
**Commit:** `0ab4717`

| File | Change |
|------|--------|
| AITrainingProgram.jsx | Lightbulb: text-yellow-500 -> text-amber-500 |
| NearbyParks.jsx | Eclaire badge: text-yellow-600 -> text-amber-600 |
| Home.jsx | nutrition card: to-orange-50/50 -> to-amber-50/50 |
| Home.jsx | streak card: via-orange-50 -> via-amber-100 |
| Home.jsx | flame circle: to-orange-500 -> to-amber-500 |
| Sante.jsx | health card: to-teal-50/50 -> to-emerald-50/80 (FIX-46) |
| Sante.jsx | diagnosis card: to-orange-50/50 -> to-amber-50/50 (FIX-46) |
| Profile.jsx | premium card: to-yellow-50/50 -> to-amber-50/50 (already fixed in 1d9a41e) |

## Verification Results

All 4 charter checks pass:
- `grep "text-orange|bg-orange|border-orange" src/ | grep -v components/ui` → **0 results**
- `grep "text-yellow|bg-yellow" src/ | grep -v components/ui` → **0 results**
- `grep "teal" src/ | grep -v components/ui` → **0 results**
- `grep "to-orange|via-orange|from-orange" src/ | grep -v components/ui` → **0 results**

## Deviations from Plan

### Note: Profile.jsx yellow pre-fixed

**Found during:** Task 2
**Issue:** Profile.jsx `to-yellow-50/50` was listed as a pending fix, but had already been corrected in commit `1d9a41e` (09-04 execution, prior plan). The Edit was applied but resulted in a no-op as the content was already correct.
**Impact:** None — file is correct, fix is in place.

## Known Stubs

None. All color replacements are live in the code.

## Self-Check: PASSED

Files modified exist and contain the correct replacements:
- badgeUtils.jsx: streak_3 = "text-amber-500" [verified]
- DiagnosisContent.jsx: high urgency = amber classes [verified]
- Sante.jsx: no teal, no orange gradient [verified]
- Home.jsx: no orange gradient stops [verified]
- Global grep: 0 orange, 0 yellow, 0 teal violations [verified]

Commits exist:
- d927483 (Task 1) [verified]
- 0ab4717 (Task 2) [verified]
