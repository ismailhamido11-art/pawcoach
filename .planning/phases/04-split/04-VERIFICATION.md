---
phase: 04-split
verified: 2026-03-27T15:30:00Z
status: gaps_found
score: 1/4 must-haves verified
gaps:
  - truth: "src/components/activite/DayCard.jsx exists as a separate file AND is imported by AITrainingProgram.jsx"
    status: failed
    reason: "DayCard.jsx does not exist on disk. Commit fb1ba1f created the file but was never merged into main — it exists only in git stash/detached refs. AITrainingProgram.jsx still contains DayCard as an inline function at line 42 and isSameDay at line 33."
    artifacts:
      - path: "src/components/activite/DayCard.jsx"
        issue: "File missing from working tree — never landed in main branch"
      - path: "src/components/activite/AITrainingProgram.jsx"
        issue: "Still contains DayCard inline (line 42) and isSameDay (line 33) — not importing from separate file"
    missing:
      - "Cherry-pick or rebase commit fb1ba1f into main, OR re-extract DayCard inline code to dedicated file"

  - truth: "Nutri.jsx has consolidated useState (dogDataState and coachState grouped objects)"
    status: failed
    reason: "Nutri.jsx still has 20+ individual useState calls (lines 55-105). Commit beef55a consolidated them but was never merged into main. Lines 55-105 show: const [dog, setDog] = useState(null); const [user, setUser] = useState(null); etc. No dogDataState or coachState objects exist."
    artifacts:
      - path: "src/pages/Nutri.jsx"
        issue: "Lines 55-105 still contain individual useState declarations — grouped objects never applied"
    missing:
      - "Cherry-pick or rebase commit beef55a into main, OR re-apply the useState consolidation manually"

  - truth: "SmartHealthAssistant.jsx imports VoiceButton.jsx and RecordReviewPanel.jsx from separate files"
    status: failed
    reason: "VoiceButton.jsx and RecordReviewPanel.jsx do not exist on disk. Commit 7c7c25e created them and modified SmartHealthAssistant, but this commit was never merged into main (it is the WIP stash base). SmartHealthAssistant.jsx still contains inline isListening/SpeechRecognition/pendingRecords logic (lines 51-70, 291-342, 428-430, 659-689)."
    artifacts:
      - path: "src/components/notebook/VoiceButton.jsx"
        issue: "File missing from working tree — never landed in main branch"
      - path: "src/components/notebook/RecordReviewPanel.jsx"
        issue: "File missing from working tree — never landed in main branch"
      - path: "src/components/notebook/SmartHealthAssistant.jsx"
        issue: "Still contains inline voice/record logic — imports of VoiceButton/RecordReviewPanel never applied"
    missing:
      - "Cherry-pick or rebase commit 7c7c25e into main, OR re-extract voice and record logic to dedicated files"
---

# Phase 04: Split — Verification Report

**Phase Goal:** Les 4 fichiers monolithes restants sont decoupes en composants maintenables
**Verified:** 2026-03-27T15:30:00Z
**Status:** gaps_found — 3 of 4 splits never landed in main branch
**Re-verification:** No — initial verification

## Summary

The SUMMARY.md claims all 4 tasks are complete with commits fb1ba1f, beef55a, 7c7c25e, and 85337b6. The reality is different: only 1 of 4 commits (SPLIT-04, pdfHelpers) is in the main branch. The other 3 commits exist in git history as detached refs (stash and orphaned commits) but were never merged/rebased into main. The working tree therefore reflects none of SPLIT-01, SPLIT-02, or SPLIT-03.

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DayCard.jsx exists AND AITrainingProgram imports it | FAILED | File does not exist on disk. Commit fb1ba1f not in main. AITrainingProgram.jsx has DayCard inline at line 42. |
| 2 | Nutri.jsx uses dogDataState/coachState grouped objects | FAILED | Commit beef55a not in main. Nutri.jsx lines 55-105 still have 20+ individual useState. |
| 3 | SmartHealthAssistant imports VoiceButton and RecordReviewPanel | FAILED | Commit 7c7c25e not in main. Both files missing. SmartHealthAssistant still has inline logic. |
| 4 | pdfHelpers.js exists AND DownloadHealthPDF imports from it | VERIFIED | Commit 1c42d04 in main. pdfHelpers.js exists at src/utils/pdfHelpers.js (266 lines, 7 exports). DownloadHealthPDF.jsx line 15-23 imports all 7 helpers. |

**Score:** 1/4 truths verified

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/activite/DayCard.jsx` | DayCard component + isSameDay helper | MISSING | File not on disk. Commit fb1ba1f not in main branch. |
| `src/components/notebook/VoiceButton.jsx` | SpeechRecognition encapsulation | MISSING | File not on disk. Commit 7c7c25e not in main branch. |
| `src/components/notebook/RecordReviewPanel.jsx` | Save CTA for pending records | MISSING | File not on disk. Commit 7c7c25e not in main branch. |
| `src/utils/pdfHelpers.js` | 7 PDF layout helper exports | VERIFIED | 266 lines, all 7 exports present and substantive. |
| `src/components/activite/AITrainingProgram.jsx` | Imports DayCard from ./DayCard | FAILED | Still has DayCard inline. No import from ./DayCard. |
| `src/pages/Nutri.jsx` | dogDataState + coachState grouped useState | FAILED | Individual useState still present lines 55-105. |
| `src/components/notebook/SmartHealthAssistant.jsx` | Imports VoiceButton, RecordReviewPanel | FAILED | No such imports. Voice logic inline at lines 51-70, 291-342. |
| `src/components/vet/DownloadHealthPDF.jsx` | Imports from @/utils/pdfHelpers | VERIFIED | Lines 15-23 import all 7 helpers correctly. |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| AITrainingProgram.jsx | DayCard.jsx | import ./DayCard | NOT WIRED | DayCard.jsx missing; function still inline in AITrainingProgram |
| SmartHealthAssistant.jsx | VoiceButton.jsx | import ./VoiceButton | NOT WIRED | VoiceButton.jsx missing; SpeechRecognition inline |
| SmartHealthAssistant.jsx | RecordReviewPanel.jsx | import ./RecordReviewPanel | NOT WIRED | RecordReviewPanel.jsx missing; CTA inline |
| DownloadHealthPDF.jsx | pdfHelpers.js | import @/utils/pdfHelpers | WIRED | Lines 15-23: all 7 symbols imported and used |

## Root Cause Analysis

Three commits (fb1ba1f, beef55a, 7c7c25e) were created on a branch/state that was then superseded. The git stash shows `stash@{0}: WIP on main: 7c7c25e` — meaning the branch HEAD was at 7c7c25e when something was stashed, but subsequent work (phases 05, 06, 07 etc.) continued from a different base without incorporating these 3 commits. Commit 1c42d04 (SPLIT-04) was a separate, independently applied commit that did land in main.

The SUMMARY.md self-check was therefore based on a transient state that was later abandoned.

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|---------|
| SPLIT-01 | FAILED | DayCard.jsx missing from main working tree |
| SPLIT-02 | FAILED | Nutri.jsx useState not consolidated in main working tree |
| SPLIT-03 | FAILED | VoiceButton.jsx, RecordReviewPanel.jsx missing from main |
| SPLIT-04 | SATISFIED | pdfHelpers.js exists, DownloadHealthPDF imports verified |

## Anti-Patterns Found

None introduced. The files modified under phase 04 that did land (DownloadHealthPDF.jsx, pdfHelpers.js) have no placeholder patterns. The unmerged splits leave code in its prior monolithic state — no regressions, but no improvement either.

## Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points testable without a dev server.

## Human Verification Required

None — all failures are deterministic file-existence and import-wiring checks.

## Gaps Summary

3 of 4 splits were committed to commits that never made it into the main branch. The working codebase therefore still contains:

- DayCard inline in AITrainingProgram.jsx (lines 42-150)
- 20+ individual useState in Nutri.jsx (lines 55-105)
- SpeechRecognition logic inline in SmartHealthAssistant.jsx (lines 51-70, 291-342)
- RecordReviewPanel CTA inline in SmartHealthAssistant.jsx (lines 428-430, 659-689)

The commits exist in git refs (fb1ba1f, beef55a, 7c7c25e) and could be cherry-picked into main to restore the work, or the extractions could be re-applied manually. SPLIT-04 (pdfHelpers) is the only split that achieved its goal in the live codebase.

---

_Verified: 2026-03-27T15:30:00Z_
_Verifier: Claude (gsd-verifier)_
