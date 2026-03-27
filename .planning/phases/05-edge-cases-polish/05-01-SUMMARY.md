---
phase: 05-edge-cases-polish
plan: "01"
subsystem: health-score, notebook, ai-credits
tags: [bug-fix, health-score, BCS, QR-code, credits, edge-cases]
dependency_graph:
  requires: []
  provides: [EDGE-01, EDGE-02, EDGE-03]
  affects: [src/utils/healthStatus.js, src/components/sante/NotebookContent.jsx, src/components/notebook/QRCodeCard.jsx, src/components/notebook/SmartHealthAssistant.jsx]
tech_stack:
  added: []
  patterns: [server-authoritative-credits, safe-error-fallback, data-uri-svg]
key_files:
  modified:
    - src/utils/healthStatus.js
    - src/components/sante/NotebookContent.jsx
    - src/components/notebook/QRCodeCard.jsx
    - src/components/notebook/SmartHealthAssistant.jsx
decisions:
  - "Backend is sole authority for credit decrement; frontend re-fetches balance via initCredits() after AI call"
  - "BCS data from GrowthEntry now flows through computeNotebookSummary into computeHealthScore via growthEntries param"
  - "SVG fallback uses percent-encoded data URI (no raw angle brackets) with onerror=null guard against infinite loops"
metrics:
  duration: "~8 minutes"
  completed: "2026-03-27T03:11:44Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 4
---

# Phase 05 Plan 01: Edge Cases — BCS Score, QR Fallback, Credit Double-Decrement Summary

**One-liner:** Three silent bugs fixed — BCS now influences health score, QR code shows valid SVG on load failure, and SmartHealthAssistant no longer double-charges AI credits.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | EDGE-01: Pass growthEntries to computeNotebookSummary | 10bc689 | healthStatus.js, NotebookContent.jsx |
| 2 | EDGE-02: Valid SVG fallback in QRCodeCard onError | 89aa083 | QRCodeCard.jsx |
| 3 | EDGE-03: Remove frontend credit double-decrement | 3b0a025 | SmartHealthAssistant.jsx |

## What Was Done

### Task 1 — EDGE-01: BCS data included in health score

`computeNotebookSummary` in `src/utils/healthStatus.js` previously had signature `(records, dog)`. It called `computeHealthScore(recs, dog)` without passing growth data. `computeHealthScore` already had full BCS logic (lines 329-342) using an optional `extraWeightSources` third argument — but it was never receiving that data from the summary entry point.

Fix: added `growthEntries = []` as third parameter to `computeNotebookSummary`, forwarded it to `computeHealthScore`. Updated `NotebookContent.jsx` to pass `growthEntries` in the `useMemo` call and dependency array (`growthEntries` was already a prop on the component, line 62 — nothing else needed).

### Task 2 — EDGE-02: Valid SVG fallback for QR code image

The `onError` handler on the QR code `<img>` in `QRCodeCard.jsx` was setting `e.target.src` to the literal string `"data:image/svg+xml,..."` — a placeholder that produces a broken image, not an actual SVG. Replaced with a properly percent-encoded 192x192 SVG data URI matching the component's `w-48 h-48` CSS class. Added `e.target.onerror = null` to prevent an infinite error loop if the fallback itself fails.

### Task 3 — EDGE-03: Remove frontend credit double-decrement

`SmartHealthAssistant.jsx` called `consumeMessageCredit()` after every AI response, decrementing `actions_remaining` client-side. The backend function `processHealthInput/entry.ts` already decrements the same field server-side (lines 31-34) before returning the AI response. This caused 2 credits consumed per message.

Fix: removed the `consumeMessageCredit` call and its import. Replaced with `initCredits()` re-fetch after the AI response, which reads the authoritative server balance and updates the UI without modifying the database.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all changes wire real data paths with no placeholders.

## Self-Check

Verified file state post-commit:
- `computeNotebookSummary(records, dog, growthEntries = [])` present at line 642 of healthStatus.js
- `computeHealthScore(recs, dog, growthEntries)` at line 644 of healthStatus.js
- `computeNotebookSummary(allRecords, dog, growthEntries)` at line 188 of NotebookContent.jsx with matching deps array
- `e.target.onerror = null` at line 157 of QRCodeCard.jsx
- `consumeMessageCredit` absent from SmartHealthAssistant.jsx (0 matches)
- `initCredits` present 3 times in SmartHealthAssistant.jsx (import + existing call + new refresh)
- All 3 commits exist in git log: 10bc689, 89aa083, 3b0a025

## Self-Check: PASSED
