---
phase: 08-ux-activation
plan: 01
subsystem: onboarding
tags: [ux, onboarding, conversion, quick-start, personalization]
dependency_graph:
  requires: []
  provides: [onboarding-5-steps, quick-start-flow, welcome-personalization]
  affects: [Onboarding.jsx, WelcomeScreen.jsx]
tech_stack:
  added: []
  patterns: [STEP_GROUPS-grouping, quick-start-ref, personalized-fallback]
key_files:
  created: []
  modified:
    - src/pages/Onboarding.jsx
    - src/components/onboarding/WelcomeScreen.jsx
decisions:
  - Preserve answers[0..9] array intact so handleFinish() LLM prompt needs zero changes
  - Use STEP_GROUPS abstraction over answers array rather than restructuring INTERVIEW_STEPS
  - Quick-start sets onboarding_completed=false as incomplete profile signal for future nudges
  - isQuickStartRef (not state) avoids race condition in handleFinish async path
metrics:
  duration: "~20min"
  completed: "2026-03-27"
  tasks: 2
  files: 2
---

# Phase 08 Plan 01: Onboarding Consolidation + Quick-Start Summary

**One-liner:** 10-step linear onboarding regrouped into 5 visible stages with STEP_GROUPS abstraction, plus "Remplir plus tard" quick-start that creates a minimal Dog profile and triggers GDPR consent in both paths.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Consolidate INTERVIEW_STEPS to 5 groups + quick-start | 8bb0631 | src/pages/Onboarding.jsx |
| 2 | Personalize WelcomeScreen with race/age | bbedc2a | src/components/onboarding/WelcomeScreen.jsx |

## What Was Built

### Task 1 — Onboarding consolidation (FIX-31, FIX-32)

Introduced `STEP_GROUPS` constant mapping 10 answer indices into 5 visible groups:
- Group 1/5: Goal selection (auto-advances on tap)
- Group 2/5: Photo + Prénom (photo picker + text input side by side)
- Group 3/5: Race (optional) + Âge
- Group 4/5: Sexe + Poids + Activité (3 inputs stacked)
- Group 5/5: Environnement + Santé (optional)

Progress bar now displays `1/5` to `5/5`. Back button jumps to first step of previous group. The `answers[0..9]` array and `handleFinish()` are fully preserved — no LLM prompt or Dog.create() changes needed.

"Remplir plus tard" button appears from group 2 onward. It sets `isQuickStartRef.current = true` and shows the GDPR consent screen. On confirm, `handleFinish()` detects quick-start mode and creates Dog with `{ name, photo, owner_goal, onboarding_completed: false }` — skipping the LLM extraction.

### Task 2 — WelcomeScreen personalization (FIX-37)

Added `dogBreed` and `dogAge` props to WelcomeScreen. The `getPersonalizedLines()` function generates 2-3 context-aware lines:
- Fallback (no data): `"Alimentation · Bien-être · Dressage"`
- With data: `"Pour un [breed] de [age], on va suivre :"` + `"Santé · Nutrition · Activité"` + optional breed-specific hint (Labrador, Berger, Bouledogue, young dog)

Onboarding passes `answers[3]` (breed) and `answers[4]` (age) to the component. Quick-start users get the generic fallback since those fields are skipped.

## Decisions Made

1. **STEP_GROUPS over INTERVIEW_STEPS restructure** — Keeping `answers[0..9]` intact was the safest path. STEP_GROUPS is a display-layer abstraction only; the data contract with `handleFinish()` and the LLM prompt stays unchanged.

2. **isQuickStartRef instead of state** — A ref avoids triggering re-renders and eliminates any potential race condition with the async `handleFinish()` path that checks the flag.

3. **onboarding_completed: false for quick-start** — Signals to the app that the profile is incomplete, enabling future nudges to complete the profile (future phase).

4. **GDPR always required** — Both paths (full + quick-start) must pass through the GDPR consent screen before Dog.create(). This was a Phase 6 invariant and is preserved.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] handlePhoto wrote to answers[step] instead of answers[1]**
- **Found during:** Task 1 — when reading the original code, `setCurrentAnswer()` writes to `answers[step]`. In the new grouped flow, `step` can be set to step 0 (goal) while the photo group is displayed if navigation restored from session. Photo should always write to `answers[1]`.
- **Fix:** Replaced `setCurrentAnswer(file_url)` with `setAnswerAtIndex(1, file_url)` in `handlePhoto()`.
- **Files modified:** src/pages/Onboarding.jsx
- **Commit:** 8bb0631

**2. [Rule 2 - Missing] handleGoalSelect used setCurrentAnswer (writes to answers[step])**
- **Found during:** Task 1 — with STEP_GROUPS, `step` is always set to the first step of the group (0 for goal group). `setCurrentAnswer` was fine for 10-step linear flow but the new `setAnswerAtIndex(0, label)` is explicit and not dependent on `step` being in sync.
- **Fix:** Changed `setCurrentAnswer(label)` to `setAnswerAtIndex(0, label)`.
- **Files modified:** src/pages/Onboarding.jsx
- **Commit:** 8bb0631

## Known Stubs

None — all data flows are wired. The personalized lines use real `answers[3]` and `answers[4]` from the onboarding form. Quick-start correctly falls back to `answers[2] || "Mon chien"` for the dog name.

## Self-Check: PASSED

Files exist:
- src/pages/Onboarding.jsx — FOUND
- src/components/onboarding/WelcomeScreen.jsx — FOUND
- .planning/phases/08-ux-activation/08-01-SUMMARY.md — FOUND (this file)

Commits exist:
- 8bb0631 — feat(08-01): consolidate onboarding to 5 groups + add quick-start
- bbedc2a — feat(08-01): personalize WelcomeScreen with breed/age data
