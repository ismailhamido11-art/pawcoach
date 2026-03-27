---
phase: 06-perf
verified: 2026-03-27T00:00:00Z
status: gaps_found
score: 2/3 must-haves verified
gaps:
  - truth: "No more key={index} on dynamic lists — count should be zero or very low (static lists OK)"
    status: partial
    reason: "Several dynamic data lists still use key={i} or key={idx} after the fix. These are not skeletons or static constants — they render API-derived or AI-generated data whose order can change."
    artifacts:
      - path: "src/pages/Nutri.jsx"
        issue: "messages.map((msg, i) => <div key={i}> at line 538 — dynamic AI chat messages, no stable ID, order can shift on replay/reload"
      - path: "src/pages/Scan.jsx"
        issue: "result.allergen_alerts.map((alert, i) => ... key={i} at line 499 — API-parsed string array, no stable ID"
      - path: "src/components/notebook/SmartHealthAssistant.jsx"
        issue: "suggestedActions.map((action, idx) => ... key={idx} at line 520 — AI-generated action strings, dynamic per message"
      - path: "src/components/sante/HealthImportContent.jsx"
        issue: "records.map at line 284 uses key={idx} (position) — records parsed from uploaded health file, order may vary"
    missing:
      - "Nutri.jsx messages: use key={msg.id || msg.timestamp || `msg-${i}`} (timestamp already available per SmartHealthAssistant pattern)"
      - "Scan.jsx allergen_alerts: use key={`alert-${alert}`} since alert is a string label (unique within a scan result)"
      - "SmartHealthAssistant suggestedActions: use key={`action-${action}`} since action is a string"
      - "HealthImportContent records: use key={`rec-${record.type}-${record.date}-${i}`} since no stable ID exists on parsed records"
human_verification:
  - test: "Verify no visual regression on dynamic lists after key stabilization"
    expected: "Chat messages, scan results, and health import records render identically; no flicker or duplicate rendering visible"
    why_human: "React key correctness affects reconciliation behavior — visual impact requires browser testing"
---

# Phase 6: PERF — Bundle & Error Visibility — Verification Report

**Phase Goal:** Le bundle initial est allege et les erreurs silencieuses sur mutations de donnees sont visibles
**Verified:** 2026-03-27
**Status:** gaps_found — 1 partial gap (PERF-02 incomplete)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PERF-01: react-leaflet is lazy-loaded in FindVetContent, NearbyParks, WalkMap | VERIFIED | `Sante.jsx:23` lazy import + Suspense at line 280; `WalkMode.jsx:9-10` both WalkMap and NearbyParks lazy + Suspense at lines 449/489 |
| 2 | PERF-02: No key={index} on dynamic lists (static lists OK) | PARTIAL | 4 dynamic lists still use positional keys: Nutri.jsx messages, Scan.jsx allergen_alerts, SmartHealthAssistant suggestedActions, HealthImportContent records |
| 3 | PERF-03: Empty catch blocks on data mutations replaced with console.warn | VERIFIED | SectionPoids, WeightCard, SmartHealthAssistant, HealthImportContent (Dog.weight sync), WalkMode (offline sync + mood save) all have `console.warn` with contextual message; remaining `catch {}` blocks are all non-critical (localStorage, wakeLock, SpeechRecognition.abort, JSON.parse defensive, audio) |

**Score:** 2/3 truths verified (PERF-01 and PERF-03 fully achieved, PERF-02 partial)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/pages/Sante.jsx` | lazy() import of FindVetContent | VERIFIED | Line 23: `const FindVetContent = lazy(() => import("@/components/sante/FindVetContent"))` + Suspense at line 280 |
| `src/components/tracker/WalkMode.jsx` | lazy() imports of WalkMap and NearbyParks | VERIFIED | Lines 9-10: both components lazy-loaded with Suspense wrappers at lines 449 and 489 |
| `src/components/sante/FindVetContent.jsx` | Leaflet used inside (chunk, not top-level import) | VERIFIED | File imports react-leaflet directly — correct, it IS the lazy chunk |
| `src/components/tracker/WalkMap.jsx` | Leaflet used inside (chunk) | VERIFIED | Imports react-leaflet directly — correct |
| `src/components/tracker/NearbyParks.jsx` | Leaflet used inside (chunk) | VERIFIED | Imports react-leaflet directly — correct |
| `src/components/notebook/SectionPoids.jsx` | console.warn on Dog.update failure | VERIFIED | Line 32: `catch (e) { console.warn("SectionPoids: Dog.weight sync failed", e?.message); }` |
| `src/components/notebook/WeightCard.jsx` | console.warn on Dog.update failure | VERIFIED | Line 34: `catch (e) { console.warn("WeightCard: Dog.weight sync failed", e?.message); }` |
| `src/components/notebook/SmartHealthAssistant.jsx` | console.warn on Dog.update failure | VERIFIED | Line 365: `catch (e) { console.warn("SmartHealthAssistant: Dog.weight sync failed", e?.message); }` |
| `src/components/sante/HealthImportContent.jsx` | console.warn on Dog.weight sync failure | VERIFIED | Line 150: `catch (e) { console.warn("HealthImportContent: Dog.weight sync failed", e?.message); }` |
| `src/components/tracker/WalkMode.jsx` | console.warn on offline sync + mood save failure | VERIFIED | Line 138: offline walks sync warn; Line 362: mood save warn |
| Multiple dynamic list components | Stable keys on API data lists | PARTIAL | See gap detail — 4 remaining instances in Nutri.jsx, Scan.jsx, SmartHealthAssistant, HealthImportContent |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Sante.jsx | FindVetContent | React.lazy + Suspense | WIRED | Line 23 lazy import, line 289 usage inside Suspense |
| WalkMode.jsx | WalkMap | React.lazy + Suspense | WIRED | Line 9 lazy import, line 489 usage |
| WalkMode.jsx | NearbyParks | React.lazy + Suspense | WIRED | Line 10 lazy import, line 449 usage |
| SectionPoids mutation | Error visibility | catch + console.warn | WIRED | Dog.update failure logged |
| WeightCard mutation | Error visibility | catch + console.warn | WIRED | Dog.update failure logged |
| SmartHealthAssistant mutation | Error visibility | catch + console.warn | WIRED | Dog.update + credits init failure logged |
| WalkMode offline sync | Error visibility | catch + console.warn | WIRED | Lines 138 and 362 |
| HealthImportContent bulk import | Error visibility | catch + failedCount + toast | WIRED | HealthRecord.create failures surfaced via toast.warning (not console.warn, but user-visible — acceptable) |

---

## Data-Flow Trace (Level 4)

Not applicable — this phase makes no changes to data sources. All changes are syntactic (React key attributes) or additive (console.warn in catch blocks). No new components, APIs, or data pipelines introduced.

---

## Behavioral Spot-Checks

| Behavior | Evidence | Status |
|----------|----------|--------|
| PERF-01: Leaflet not in initial bundle | FindVetContent/WalkMap/NearbyParks only reachable through lazy() calls | PASS (static analysis) |
| PERF-03: Mutation failures produce console.warn | 5 targeted mutations confirmed with console.warn | PASS (code verified) |
| PERF-02: Dynamic lists use stable keys | 4 dynamic lists still use positional index | PARTIAL |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| PERF-01 | react-leaflet lazy-loaded in FindVetContent, NearbyParks, WalkMap | SATISFIED | Pre-existing in Sante.jsx and WalkMode.jsx — confirmed in code |
| PERF-02 | No key={index} on dynamic lists | PARTIALLY SATISFIED | 4 dynamic-data lists remain with positional keys (Nutri messages, Scan alerts, SmartHealthAssistant actions, HealthImportContent records) |
| PERF-03 | Empty catch blocks on data mutations replaced with console.warn | SATISFIED | All 5 targeted mutations verified; remaining catch{} blocks are legitimately non-critical |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/Nutri.jsx` | 538 | `messages.map((msg, i) => ... key={i})` — dynamic AI chat messages | Warning | React may misidentify elements during re-renders; no user-visible bug today but degrades correctness guarantee |
| `src/pages/Scan.jsx` | 499 | `allergen_alerts.map((alert, i) => ... key={i})` — API-parsed strings | Warning | Order of allergen alerts could differ between renders; key collision risk on duplicate alerts |
| `src/components/notebook/SmartHealthAssistant.jsx` | 520 | `suggestedActions.map((action, idx) => ... key={idx})` — AI strings | Warning | Identical to messages issue; actions are per-message and dynamic |
| `src/components/sante/HealthImportContent.jsx` | 284 | `records.map(... key={idx})` on parsed upload results | Warning | Records have no IDs; idx acceptable only if order is stable (it is during this UI flow, but semantically incorrect) |

**Cleared as non-issues (correctly left as-is):**
- `WalkMode.jsx:413` — `[1,2,3].map(i => ...)` pulsing rings (static decorative)
- `TrackerHistory.jsx:228` — inline stats array (constructed in-place, stable order)
- `Dashboard.jsx:452` — inline dog stats array (stable order, computed)
- `Premium.jsx:234,441` — `PREMIUM_FEATURES` static constant
- `Training.jsx:445,466,511,540,546,565` — `BEHAVIOR_GUIDES` static constant + its `guide.steps/errors/todayDay` sub-arrays (static data from constant)
- `Chat.jsx:554` — `suggestions` array computed from `dog` object (stable)
- `CompletionCard.jsx:77` — `confetti` array (animation, ephemeral)
- `CompletionCard.jsx:174` — `FEELING_OPTIONS` static constant
- `NearbyParks.jsx:281`, `ParkReviews.jsx:48,160` — `Array.from({length: paws})` paw icons (decorative repetition)
- All skeleton arrays (`[...Array(6)]`, `[1,2,3]`, etc.)
- `Sante.jsx:283`, `DietPreferencesPanel.jsx:145` — skeleton loaders

---

## Human Verification Required

### 1. No visual regression on dynamic lists

**Test:** Open Nutri chat, send a message, verify messages display correctly. Open Scan, scan a product with allergens, verify alerts show. Open SmartHealthAssistant, trigger an AI response with suggested actions.
**Expected:** All content renders correctly, no duplicated or missing items
**Why human:** React key issues can cause subtle reconciliation bugs that only appear with interaction; static analysis cannot catch runtime behavior

---

## Gaps Summary

PERF-01 and PERF-03 are fully achieved. The bundle is lighter because all three Leaflet components are behind `React.lazy()` at their parent. Data mutation failures are now visible via `console.warn` in all 5 targeted locations.

PERF-02 is partially achieved. The phase fixed 22 files and eliminated the vast majority of index-as-key issues. However, 4 dynamic data lists were not fixed:

1. **Nutri.jsx messages** — AI chat messages have no stable ID. The fix is to use `msg.timestamp` (already present, used for date separators in the same file) as a key prefix.
2. **Scan.jsx allergen_alerts** — API-returned string array. Fix: use the string itself as the key (`key={alert}` or `key={`alert-${alert}`}`) since alert labels are unique within one scan result.
3. **SmartHealthAssistant suggestedActions** — AI-generated strings. Fix: `key={`action-${action}`}`.
4. **HealthImportContent records** — parsed upload records with no DB IDs. Fix: composite key `key={`${record.type}-${record.date}-${i}`}`.

These are all simple one-line fixes. None cause visible bugs today, but they contradict the goal of "no key={index} on dynamic lists."

---

## Commits Verified

| Hash | Message | Status |
|------|---------|--------|
| 987488b | fix(06-01): replace index-as-key with stable keys on dynamic lists | FOUND in git log |
| e2b9f1f | fix(06-01): add console.warn to empty catch blocks on data mutations | FOUND in git log |

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
