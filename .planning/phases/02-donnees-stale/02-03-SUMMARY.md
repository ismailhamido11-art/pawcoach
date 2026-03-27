---
phase: 02-donnees-stale
plan: "03"
subsystem: scan
tags: [bug-fix, data-loss, food-scan, stale-data]
dependency_graph:
  requires: []
  provides: [STALE-06]
  affects: [FoodScan entity, Library page]
tech_stack:
  added: []
  patterns: [FoodScan.create payload completion]
key_files:
  created: []
  modified:
    - src/pages/Scan.jsx
    - src/components/scan/LabelScanMode.jsx
decisions:
  - "Label mode fallback summary uses product name + compatibility_verdict since label AI schema has no summary field"
  - "allergen_alerts defaults to [] (not null) to avoid DB type mismatch on empty scans"
metrics:
  duration: "5min"
  completed_date: "2026-03-27"
---

# Phase 02 Plan 03: FoodScan Data Loss Fix Summary

**One-liner:** Fixed STALE-06 — both scan modes now persist summary and allergen_alerts to FoodScan DB entity, eliminating data loss between scan result UI and saved library.

## What Was Done

Both `FoodScan.create` calls were missing AI-generated fields that were displayed in the result UI but never written to the database.

### Task 1 — Scan.jsx (food photo mode)

Added two missing fields to `saveResult()`:

```javascript
summary: result.summary,
allergen_alerts: result.allergen_alerts,
```

These fields already existed in the AI response schema and were available on the `result` object — they were simply omitted from the `FoodScan.create` payload.

**Commit:** `f80d9e6`

### Task 2 — LabelScanMode.jsx (label scan mode)

Added two missing fields to `saveLabelResult()`:

```javascript
summary: labelResult.summary || `Analyse etiquette : ${labelResult.product_name || "produit"} — compatibilite ${labelResult.compatibility_verdict || "inconnue"}`,
allergen_alerts: labelResult.allergen_alerts || [],
```

The label mode AI schema does not include a `summary` field, so the fallback string always executes — this is intentional and generates a readable summary from the label data.

**Commit:** `06661d7`

## Verification

- `FoodScan.create` in `Scan.jsx` includes `summary: result.summary` and `allergen_alerts: result.allergen_alerts` — confirmed at lines 255, 258
- `FoodScan.create` in `LabelScanMode.jsx` includes `allergen_alerts: labelResult.allergen_alerts || []` and `summary: labelResult.summary || ...` — confirmed at lines 136, 139
- Only 2 `FoodScan.create` calls exist in the codebase — both covered by this plan

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both fields are wired to real AI response data with appropriate fallbacks.

## Self-Check: PASSED

- `src/pages/Scan.jsx` modified — confirmed via grep (lines 255, 258)
- `src/components/scan/LabelScanMode.jsx` modified — confirmed via grep (lines 136, 139)
- Commit `f80d9e6` exists — Task 1
- Commit `06661d7` exists — Task 2
