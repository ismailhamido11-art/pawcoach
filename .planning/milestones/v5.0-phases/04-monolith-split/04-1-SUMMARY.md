---
phase: 4
plan: 1
subsystem: frontend-components
tags: [refactor, split, components, monolith]
requires: []
provides: [LabelScanMode, CompletionCard, WalkSummary, MealPlanGenerator]
affects: [Scan.jsx, AITrainingProgram.jsx, WalkMode.jsx, NutritionMealPlan.jsx]
tech-stack:
  added: []
  patterns: [component-extraction, prop-drilling]
key-files:
  created:
    - src/pages/LabelScanMode.jsx
    - src/components/activite/CompletionCard.jsx
    - src/components/tracker/WalkSummary.jsx
    - src/components/nutrition/MealPlanGenerator.jsx
  modified:
    - src/pages/Scan.jsx
    - src/components/activite/AITrainingProgram.jsx
    - src/components/tracker/WalkMode.jsx
    - src/components/nutrition/NutritionMealPlan.jsx
decisions:
  - GOAL_SUGGESTIONS exported from CompletionCard so AITrainingProgram can import it (used in generate screen goal chips)
  - MOOD_KEY kept in WalkMode since saveMoodData function stays there (accesses localStorage)
  - getWalkInsight duplicated in WalkSummary (not exported from WalkMode) since it belongs to the summary view
  - MealPlanGenerator receives onGenerate/onSavePlan/onSetPlan callbacks instead of direct function refs
metrics:
  duration: ~90min
  completed: 2026-03-27
  tasks: 4
  files: 8
---

# Phase 4 Plan 1: Monolith Split Summary

**One-liner:** Split 4 monolith files (918-1024 lines each) into focused components via clean prop-drilling extraction.

## Tasks Completed

| Task | Description | Commit | Files Changed |
|------|-------------|--------|---------------|
| 1 | SPLIT-01: LabelScanMode from Scan.jsx | 33e2161 | Scan.jsx (modified), LabelScanMode.jsx (created) |
| 2 | SPLIT-02: CompletionCard from AITrainingProgram.jsx | 64c331a | AITrainingProgram.jsx (modified), CompletionCard.jsx (created) |
| 3 | SPLIT-03: WalkSummary from WalkMode.jsx | 294b7cd | WalkMode.jsx (modified), WalkSummary.jsx (created) |
| 4 | SPLIT-04: MealPlanGenerator from NutritionMealPlan.jsx | 3557553 | NutritionMealPlan.jsx (modified), MealPlanGenerator.jsx (created) |

## Size Reduction

| File | Before | After | Lines Removed |
|------|--------|-------|---------------|
| Scan.jsx | ~918 lines | ~640 lines | ~278 |
| AITrainingProgram.jsx | 984 lines | 740 lines | 244 |
| WalkMode.jsx | 725 lines | 566 lines | 159 |
| NutritionMealPlan.jsx | 892 lines | 727 lines | 165 |

## Extracted Components

### LabelScanMode (src/pages/LabelScanMode.jsx)
- Contains: LABEL_VERDICT_CONFIG, ScoreBar, all label scan state and logic
- Props: `{ dog, user, dietPreferences, checkScanLimit, incrementScanCount, setScanLimitReached, onLabelSaved }`

### CompletionCard (src/components/activite/CompletionCard.jsx)
- Contains: GOAL_SUGGESTIONS (exported), FEELING_OPTIONS, getCoachInsight, CompletionCard component
- Props: `{ program, dog, totalMinutes, bilanState, onSaveBilan, onNewProgram, bilanJustSaved }`
- GOAL_SUGGESTIONS exported because AITrainingProgram also uses it in the generate screen

### WalkSummary (src/components/tracker/WalkSummary.jsx)
- Contains: WALK_MOODS, WALK_TAGS, getWalkInsight, full post-walk done screen
- Props: 14 data props + 5 callback props (onSaveMood, onReset, onSetShowShare, onSetWalkMood, onSetSelectedMoodTags)

### MealPlanGenerator (src/components/nutrition/MealPlanGenerator.jsx)
- Contains: renderGenerator() converted to a React component with MONTHLY_FREE_LIMIT constant
- Props: 14 data props + 4 callback props (onGenerate, onSavePlan, onSetPlan, onSetGenerationNotes)

## Decisions Made

1. **GOAL_SUGGESTIONS exported from CompletionCard**: The constant is used both in CompletionCard (bilan section) and in AITrainingProgram's generate screen (goal chip selector). Rather than duplicating it, exported it as a named export and imported it in AITrainingProgram.

2. **MOOD_KEY kept in WalkMode**: The `saveMoodData` function reads/writes to localStorage using MOOD_KEY and stays in WalkMode (passed as `onSaveMood` prop to WalkSummary). Moving it would require additional prop forwarding with no benefit.

3. **getWalkInsight in WalkSummary**: The function is only used to compute the insight displayed in the done screen. Duplicating it in WalkSummary keeps WalkSummary self-contained without needing an extra import or export.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] GOAL_SUGGESTIONS was not exported from CompletionCard**
- **Found during:** Task 2 verification
- **Issue:** AITrainingProgram.jsx uses GOAL_SUGGESTIONS in the generate screen (goal chip selector at line 536), but the constant was moved to CompletionCard.jsx without being exported
- **Fix:** Added `export` keyword to GOAL_SUGGESTIONS in CompletionCard.jsx, imported as named export in AITrainingProgram.jsx
- **Files modified:** CompletionCard.jsx, AITrainingProgram.jsx
- **Commit:** 64c331a

**2. [Rule 1 - Bug] Python cleanup was needed for large block deletion**
- **Found during:** Task 2
- **Issue:** The inline CompletionCard definition (~265 lines) could not be reliably removed via Edit tool due to linter interference (CRLF conversions invalidating reads) and non-unique string patterns
- **Fix:** Used Python subprocess with START/END marker approach to atomically remove the dead code block
- **Files modified:** AITrainingProgram.jsx
- **Commit:** 64c331a

## Known Stubs

None — all 4 extracted components are fully wired with real data from their parent components.

## Self-Check: PASSED
