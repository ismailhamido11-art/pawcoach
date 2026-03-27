---
phase: 02-donnees-stale
verified: 2026-03-27T00:00:00Z
status: passed
score: 6/6 must-haves verified
gaps: []
---

# Phase 02: Donnees Stale — Verification Report

**Phase Goal:** Chaque donnee affichee reflète la realite — aucune valeur perimee ou perdue en base
**Verified:** 2026-03-27
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | L'alerte poids dans SmartAlerts compare les 2 dernieres pesees reelles entre elles, pas contre dog.weight | VERIFIED | Lines 201-217: `if (allWeights.length >= 2)` — `previous = allWeights[allWeights.length - 2].v`, no reference to `dog.weight` in weight section |
| 2 | La pill Poids ne dit plus "Non suivi" quand le chien a des GrowthEntries avec weight_kg | VERIFIED | healthStatus.js line 399: `computeStatusPills(records, dog, extraWeightSources = [])`, dedup via `hrDates` Set at lines 426-427, enriched records passed to `computeWeightTrend` |
| 3 | Apres mise a jour du poids dans Sante (GrowthTracker), le poids affiche dans Sante est immediatement correct | VERIFIED | Sante.jsx lines 276-281: `onGrowthAdded` callback calls both `setGrowthEntries` and `setDog(prev => prev ? { ...prev, weight: entry.weight_kg } : prev)` |
| 4 | NutritionMealPlan utilise le dernier poids reel (GrowthEntry ou DailyLog), pas dog.weight | VERIFIED | NutritionMealPlan.jsx: `latestRealWeight` via `useMemo` at line 63, used at lines 162, 283, 684 — zero `dog.weight` references remain |
| 5 | STALE-05: DogRadarHero est du dead code (zero callers) — Dashboard et NotebookContent utilisent deja la bonne formule | VERIFIED | `grep import.*DogRadarHero` returns zero results across entire `src/` tree. Only DogRadarHero.jsx itself references the component name. No fix needed. |
| 6 | Apres un scan alimentaire ou etiquette, summary et allergen_alerts sont sauvegardes dans FoodScan | VERIFIED | Scan.jsx: `summary: result.summary` (line 255) + `allergen_alerts: result.allergen_alerts` (line 258) in `FoodScan.create`. LabelScanMode.jsx: `summary: labelResult.summary || fallback` (line 136) + `allergen_alerts: labelResult.allergen_alerts || []` (line 139). |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/dashboard/SmartAlerts.jsx` | Weight alert comparing 2 most recent real weights | VERIFIED | Lines 201-218: condition `allWeights.length >= 2`, `previous = allWeights[allWeights.length - 2].v`, no `dog.weight` reference |
| `src/utils/healthStatus.js` | `computeStatusPills` with `extraWeightSources` param | VERIFIED | Line 399: 3-param signature, dedup logic at 423-428, `computeNotebookSummary` passes `growthEntries` at line 655 |
| `src/pages/Sante.jsx` | `onGrowthAdded` callback that also refreshes dog state | VERIFIED | Lines 276-281: both `setGrowthEntries` and `setDog` called in same callback |
| `src/components/nutrition/NutritionMealPlan.jsx` | Latest real weight for meal plan generation | VERIFIED | Line 63: `latestRealWeight` useMemo, 3 usage sites (generation, AI prompt, display), zero `dog.weight` refs |
| `src/pages/Scan.jsx` | `FoodScan.create` with summary + allergen_alerts | VERIFIED | Lines 255, 258: both fields present in create payload |
| `src/components/scan/LabelScanMode.jsx` | `FoodScan.create` with allergen_alerts + summary | VERIFIED | Lines 136, 139: both fields present, allergen_alerts with `|| []` guard, summary with fallback string |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/utils/healthStatus.js` | `src/components/sante/NotebookContent.jsx` | `computeNotebookSummary` calls `computeStatusPills(recs, dog, growthEntries)` | WIRED | Confirmed at line 655 — `growthEntries` forwarded |
| `src/components/dashboard/SmartAlerts.jsx` | `src/pages/Dashboard.jsx` | Dashboard renders SmartAlerts with records + dailyLogs | WIRED | SmartAlerts exported and used in Dashboard (pre-existing wiring, unchanged) |
| `src/pages/Sante.jsx` | `src/components/sante/GrowthTrackerContent.jsx` | `onGrowthAdded` callback prop | WIRED | Lines 276-281: prop passed, both state updates present |
| `src/pages/Scan.jsx` | FoodScan entity | `FoodScan.create` call in saveResult | WIRED | Lines 249-261: complete payload including `summary` and `allergen_alerts` |
| `src/components/scan/LabelScanMode.jsx` | FoodScan entity | `FoodScan.create` call in saveLabelResult | WIRED | Lines 131-141: complete payload including both fields |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `SmartAlerts.jsx` | `allWeights` | `records` (HealthRecord type=weight) + `dailyLogs` (weight_kg) | Yes — built from real props, sorted, compared | FLOWING |
| `healthStatus.js` — computeStatusPills | `enrichedForWeight` | `records` + `extraWeightSources` (GrowthEntry/DailyLog) | Yes — merges and deduplicates real weight data | FLOWING |
| `NutritionMealPlan.jsx` | `latestRealWeight` | `healthRecords` + `dailyLogs` props via useMemo | Yes — real prop data, fallback to `dog?.weight` only if no records | FLOWING |
| `Scan.jsx` — FoodScan.create | `result.summary`, `result.allergen_alerts` | AI response stored in `result` state via `setResult(finalResult)` | Yes — AI response fields passed directly | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — These are frontend React components with no runnable entry points. All logic is pure (no servers to start). Wiring confirmed via static analysis.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| STALE-01 | 02-01-PLAN.md | SmartAlerts compare les 2 dernieres pesees reelles | SATISFIED | SmartAlerts.jsx lines 201-217 — `previous = allWeights[allWeights.length - 2].v`, zero `dog.weight` refs |
| STALE-02 | 02-02-PLAN.md | Dog state rafraichi dans Sante.jsx apres weight update | SATISFIED | Sante.jsx lines 276-281 — `setDog` called in `onGrowthAdded` |
| STALE-03 | 02-01-PLAN.md | computeStatusPills inclut les GrowthEntries | SATISFIED | healthStatus.js lines 399, 423-428, 655 — extraWeightSources param + dedup + forwarding |
| STALE-04 | 02-02-PLAN.md | NutriCoach utilise le dernier poids reel | SATISFIED | NutritionMealPlan.jsx lines 63, 162, 283, 684 — `latestRealWeight` replaces all `dog.weight` refs |
| STALE-05 | 02-02-PLAN.md | Score wellness identique (DogRadarHero dead code) | SATISFIED | DogRadarHero has zero importers — never rendered. Dashboard + NotebookContent already use correct formula. |
| STALE-06 | 02-03-PLAN.md | FoodScan.create sauvegarde summary + allergen_alerts | SATISFIED | Scan.jsx lines 255+258, LabelScanMode.jsx lines 136+139 — both fields present in both create calls |

All 6 requirement IDs from REQUIREMENTS.md are covered. No orphaned requirements.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| — | — | — | None found |

No `dog.weight` remaining in NutritionMealPlan.jsx (confirmed zero matches).
No `console.log` in SmartAlerts.jsx.
No TODO/FIXME/PLACEHOLDER in Scan.jsx or LabelScanMode.jsx.

---

### Human Verification Required

None. All 6 requirements verified programmatically through static code analysis.

Optional smoke tests if desired:

1. **Weight pill "Non suivi" fix** — In app: add a GrowthEntry with weight_kg for a dog that has no HealthRecord type=weight. Navigate to Sante > Carnet. The "Poids" pill should show a weight value, not "Non suivi".

2. **Weight alert between 2 real measurements** — Add 2 GrowthEntry/HealthRecord weights differing by >10%. Dashboard SmartAlerts should show a weight drift warning quoting both measured values.

3. **FoodScan data retention** — Perform a food scan, save it, then open the library and re-open the scan. The summary text and allergen alerts should be present (not empty).

---

### Gaps Summary

No gaps. All 6 must-have truths are verified in the actual source code. Phase goal achieved.

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
