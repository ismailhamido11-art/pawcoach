---
phase: 10-performance-cleanup
plan: "04"
subsystem: backend-performance, dead-code, analytics
tags: [batch-query, dead-code, annotations, analytics-removal, RGPD]
dependency_graph:
  requires: []
  provides: [vetAccess-listMyPatients, analytics-removal]
  affects: [VetPortal.jsx, ai-credits.js, Premium.jsx, Scan.jsx, Onboarding.jsx, pawcoachChat/entry.ts, preDiagnosis/entry.ts, processHealthInput/entry.ts]
tech_stack:
  added: []
  patterns: [parallel-fetch, comment-annotation]
key_files:
  created: []
  modified:
    - base44/functions/vetAccess/entry.ts
    - src/pages/VetPortal.jsx
    - base44/functions/pawcoachChat/entry.ts
    - base44/functions/preDiagnosis/entry.ts
    - base44/functions/processHealthInput/entry.ts
    - src/utils/ai-credits.js
    - src/pages/Premium.jsx
    - src/pages/Scan.jsx
    - src/pages/Onboarding.jsx
  deleted:
    - src/utils/analytics.js
decisions:
  - "listMyPatients uses Promise.all for parallel dog fetch — faster than sequential, no N+1"
  - "listMyAccess preserved (backward compat) — listMyPatients is additive"
  - "verdictFr annotated as CGC false positive — used locally in nutritionMemory scope"
  - "sanitize/validateImageUrl annotated as intentional local copies — Deno no cross-function imports"
  - "analytics.js deleted entirely — localStorage placeholder provides no real insights"
  - "RGPD consent checkbox preserved in Onboarding.jsx — only setAnalyticsConsent call removed"
metrics:
  duration: "~15 min"
  completed: "2026-03-27T23:53:22Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 9
  files_deleted: 1
---

# Phase 10 Plan 04: Performance Cleanup — Batch VetPortal + Analytics Removal Summary

Batch query VetPortal patients (1 roundtrip instead of N), annotate CGC false positives, and delete the unused analytics localStorage system across 5 files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Batch VetPortal patients (listMyPatients) | 6e8de4e | vetAccess/entry.ts, VetPortal.jsx |
| 2 | Annotate verdictFr + sanitize/validateImageUrl | 38e1942 | pawcoachChat/entry.ts, preDiagnosis/entry.ts, processHealthInput/entry.ts |
| 3 | Delete analytics.js + remove all references | 0003bea | analytics.js (deleted), ai-credits.js, Premium.jsx, Scan.jsx, Onboarding.jsx |

## What Changed

### FIX-65: VetPortal batch fetch

Before: `loadAccesses` called `listMyAccess` then N sequential `getDogData` calls (N+1 pattern).

After: Single `listMyPatients` call returns `{ accesses, dogs }` in one roundtrip. Dogs are fetched in parallel (`Promise.all`) inside the backend.

The old `listMyAccess` action is preserved for backward compatibility.

### FIX-66: verdictFr annotation

`verdictFr` in `pawcoachChat/entry.ts` is an inline arrow function used locally in `nutritionMemory` string construction. CGC marks it as dead code because it has no external callers. Added comment: `// verdictFr: utilisee localement dans nutritionMemory — CGC false positive (scope local)`.

### FIX-67: sanitize/validateImageUrl annotation

3 backends (pawcoachChat, preDiagnosis, processHealthInput) each define their own `sanitize()` and/or `validateImageUrl()`. These are intentionally duplicated — Deno functions cannot import from each other. Added standard comments on all copies:
- `sanitize v1 — injection guard — copie locale intentionnelle (Deno: pas d'import cross-function)`
- `validateImageUrl v1 — SSRF guard — copie locale intentionnelle (Deno: pas d'import cross-function)`

### FIX-68: analytics.js removal

`src/utils/analytics.js` was a localStorage-based event tracker (no third-party service, no real insights). Deleted the file and removed all references:
- `ai-credits.js`: removed import + 2 `trackEvent` calls
- `Premium.jsx`: removed import + 2 `trackEvent` calls
- `Scan.jsx`: removed import + 1 `trackEvent` call
- `Onboarding.jsx`: removed import + 1 `trackEvent` call + 2 `setAnalyticsConsent(true)` calls

**RGPD consent checkbox preserved** — the `gdprConsent` checkbox in Onboarding.jsx (added in Phase 6 FIX-04) is intact. Only the `setAnalyticsConsent` call that wrote to localStorage was removed.

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. `listMyPatients` is additive — `listMyAccess` kept for backward compat (other callers possible)
2. `verdictFr` annotated, not deleted — it IS used locally, CGC is a false positive
3. analytics.js deleted entirely (not stubbed) — no future plan to wire it to a real service
4. RGPD consent checkbox preserved per explicit instruction — only the analytics side effect removed

## Known Stubs

None.

## Self-Check: PASSED

- `listMyPatients` in vetAccess/entry.ts: found (line 226)
- `listMyPatients` in VetPortal.jsx: found (line 44)
- `trackEvent` in src/: 0 results
- `analytics.js`: deleted
- `CGC false positive` in pawcoachChat/entry.ts: found (line 223)
- `copie locale intentionnelle` in preDiagnosis/entry.ts: found
- `copie locale intentionnelle` in processHealthInput/entry.ts: found
- RGPD checkbox in Onboarding.jsx: found (ligne 434 "politique de confidentialite")
- Commits: 6e8de4e, 38e1942, 0003bea — all verified in git log
