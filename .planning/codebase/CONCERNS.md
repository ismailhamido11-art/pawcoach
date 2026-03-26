# PawCoach — Codebase Health: Concerns and Tech Debt

> Generated: 2026-03-26 | Scope: `pawcoach/src/` (frontend) — 16 pages, ~102 components, 22 backend functions

---

## Summary

| Category | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|
| Security | 0 | 1 | 2 | 1 |
| Performance | 0 | 3 | 4 | 2 |
| Maintainability | 0 | 4 | 6 | 3 |
| Architecture | 0 | 2 | 3 | 1 |
| Accessibility | 0 | 1 | 3 | 2 |
| Known Issues | 0 | 1 | 5 | many |

No CRITICAL issues found. The codebase is generally sound but carries real technical debt in maintainability and a handful of HIGH concerns worth addressing before scaling.

---

## 1. Security

### HIGH — Public profile exposes all health records without authorization check
**File:** `src/pages/DogPublicProfile.jsx` lines 83–88

The page comment says "no login required". Any person with a `dogId` (visible in the QR code URL) can read the full medical history of any dog, including vaccines, vet visits, medications, and weight records. There is no opt-in/opt-out control, no field-level filtering, and no rate limiting at the frontend query level.

**Risk:** Medical data exposure. A user's dog profile can be read by anyone with the URL — intended for QR code sharing, but the user has zero control over what is shared.

**Fix:** Add a `is_public` flag on HealthRecord or use a `share_token` with expiry. At minimum, filter by record types the owner chooses to share.

---

### MEDIUM — Credit enforcement is client-side only
**Files:** `src/utils/ai-credits.js`, `src/hooks/useActionCredits.js`

Daily credit limits (10 messages, 3 actions for free users) are checked and decremented entirely in the frontend via `base44.auth.updateMe()`. Any user with DevTools can bypass this by resetting their own `messages_remaining` field. Backend functions do not enforce the limit independently.

**Risk:** AI cost overrun if a user manually resets their credit counter. Low probability (requires technical knowledge).

**Note in code:** `ai-credits.js:47` contains a `console.warn` saying "actions_remaining field may need schema update" — this has been a known fragile point.

---

### MEDIUM — Inner HTML injection pattern in chart component
**File:** `src/components/ui/chart.jsx:61`

Used in shadcn's chart component for CSS injection of chart colors. The input comes from component props (not user data), so practical risk is low, but it is a pattern worth tracking.

---

### LOW — No Content Security Policy visible in frontend code
No CSP headers are configured at the frontend level. This is a Base44 platform concern, not directly fixable in the repo, but worth logging.

---

## 2. Performance

### HIGH — Leaflet is not lazy-loaded and enters the initial bundle
**Files:**
- `src/components/tracker/NearbyParks.jsx` — imports Leaflet at module level
- `src/components/sante/FindVetContent.jsx` — same
- `src/components/tracker/WalkMap.jsx` — same

Leaflet is a heavy library (~150KB gzip). It is imported eagerly inside components that are rendered on tab switch. Since `Activite` and `Sante` are **not lazy-loaded** in `pages.config.js` (they are in the initial bundle), Leaflet enters the initial bundle unconditionally.

**Fix:** Lazy-load `NearbyParks`, `WalkMap`, and `FindVetContent` using `React.lazy()` inside their parent pages.

---

### HIGH — Home.jsx fires 11 parallel entity queries on every mount with no cache
**File:** `src/pages/Home.jsx:44–58`

`fetchDogData()` runs `Promise.all()` with 11 simultaneous API calls on every Home mount. This happens on every app open and every back navigation. There is no local cache or SWR-style revalidation — every return to Home is a full cold fetch of all data.

**Fix:** A simple module-level cache with a 30-second TTL, or use `sessionStorage` to persist the last known state between navigations.

---

### HIGH — `DownloadHealthPDF.jsx` at 743 lines — entire jsPDF layout engine in one component
**File:** `src/components/vet/DownloadHealthPDF.jsx` (743 lines)

Contains a full PDF layout engine (table drawing, page layout, multi-section rendering) inline in a React component. The `sanitize()` helper strips accents via 30+ manual string replacements — a legitimate PDF encoding need, but inline in the component and undocumented.

---

### MEDIUM — `key={index}` used in 35 files (84 total occurrences)

Using array index as React key causes unnecessary re-renders and broken animations when list order changes. This is a widespread pattern.

**Most impactful cases:** Chat messages list, nutrition meal plan items, training exercise lists — all dynamic lists that can change order or be updated.

---

### MEDIUM — `PawIllustrations.jsx` at 1,055 lines — monolithic SVG file always in bundle
**File:** `src/components/ui/PawIllustrations.jsx` (1,055 lines)

Contains all 10+ SVG dog illustrations as inline JSX in a single file. Every page importing even one illustration loads the entire file. No tree-shaking applies since all exports are components.

**Fix:** Split into individual files or accept the cost (~30KB unminified).

---

### MEDIUM — `AITrainingProgram.jsx` at 1,000 lines — monolithic component with no sub-components
**File:** `src/components/activite/AITrainingProgram.jsx` (1,000 lines)

Handles generation, display, day-by-day tracking, bookmarks, feedback, and coach insights all in one component. 6 of the `key={index}` instances live here, compounding render issues.

---

### LOW — Typewriter streaming effect implemented twice
**Files:** `src/pages/Chat.jsx` (lines 58–90), `src/components/notebook/SmartHealthAssistant.jsx` (lines 56–60)

Both implement a custom word-by-word typewriter effect using the same pattern (`words.split(/(\s+)/)`, `setInterval`, `useRef` timer). No shared hook exists.

**Fix:** Extract to `src/hooks/useTypewriter.js`.

---

### LOW — Analytics stored in localStorage but never sent anywhere
**File:** `src/utils/analytics.js`

`trackEvent()` stores events in `localStorage` (last 100) and calls `console.debug`. No remote reporting. Events accumulate silently. Either wire to a real analytics backend or remove the storage overhead.

---

## 3. Maintainability

### HIGH — Date and locale utilities duplicated across 3+ files

**Evidence:**
- `JOURS_COURTS` array defined in: `ActiveProgramCards.jsx`, `AITrainingProgram.jsx`
- `MOIS_FR` array defined in: `ActiveProgramCards.jsx`, `AITrainingProgram.jsx`
- `addDaysToDate()` function defined in: `ActiveProgramCards.jsx:17`, `AITrainingProgram.jsx:55`
- `getTimeStr()` defined locally in `SmartHealthAssistant.jsx:35` — but already exists in `src/utils/dateHelpers.js`

`src/utils/dateHelpers.js` exists but is only imported by 3 files. The others re-implement the same logic independently.

**Fix:** Move `JOURS_COURTS`, `MOIS_FR`, `addDaysToDate`, `formatDateFr` into `dateHelpers.js` and import from there.

---

### HIGH — Dead constant: `_WEEK_DAYS` defined but never used
**File:** `src/components/home/ActiveProgramCards.jsx:13`

```
const _WEEK_DAYS = ["Lundi", ...]; // never referenced anywhere in the file
```

Dead code. The underscore prefix suggests someone flagged it but never removed it.

---

### HIGH — `SESSION_ICONS` and `ACTIVITY_ICONS` are two near-identical maps in the same file
**File:** `src/components/home/ActiveProgramCards.jsx:8–11, 34–37`

Both map activity type strings to emoji. `SESSION_ICONS` has 5 entries, `ACTIVITY_ICONS` has 6. They overlap and should be merged into one constant.

---

### HIGH — Silent `catch {}` blocks throughout (30+ instances) mask real errors
**Evidence:** 30 instances of empty `catch {}` found. Many cover critical flows:

- `WalkMode.jsx` — 9 instances including GPS position updates and walk save recovery
- `AITrainingProgram.jsx` — 5 instances including JSON parse and bookmark saving
- `SmartHealthAssistant.jsx:317` — silently swallows a failed `Dog.update(weight)`
- `HealthImportContent.jsx:146` — same: silent weight update failure
- `Training.jsx:587` — corrupted AI response parsed silently

Empty catches are acceptable for known-safe operations (localStorage access, sound effects). They are not acceptable for core data persistence paths.

**Fix:** Replace empty catches in data-critical paths with `console.warn` at minimum.

---

### MEDIUM — Local utility functions in `DownloadHealthPDF.jsx` duplicate existing utils
**File:** `src/components/vet/DownloadHealthPDF.jsx` lines 19–72

`fmtDate()`, `fmtShortDate()`, `computeAge()` defined locally and overlap with utilities in `dateHelpers.js` and `healthStatus.js`. Only `sanitize()` (accent-stripping for PDF encoding) is legitimately specific to this file.

---

### MEDIUM — `getTimeStr()` defined locally despite existing in dateHelpers.js
**File:** `src/components/notebook/SmartHealthAssistant.jsx:35`

Same function signature and behavior as `getTimeStr` in `src/utils/dateHelpers.js`. Should import from there.

---

### MEDIUM — 10 exercises hardcoded in Training.jsx with inline premium flags
**File:** `src/pages/Training.jsx:24–35`

The `EXERCISES` and `JOURNEYS` arrays are defined inline in the page component with exercise steps, emoji, levels, durations, and `is_premium` flags all in one place. Any copy or gating change requires a code push.

---

### MEDIUM — `DogPublicProfile.jsx` uses `window.location.search` instead of `useSearchParams`
**File:** `src/pages/DogPublicProfile.jsx:71`

All other pages use React Router's `useSearchParams`. This is inconsistent and breaks the React Router contract.

---

### MEDIUM — Inconsistent premium check: `isUserPremium()` vs direct `user.is_premium`
**Evidence:** `isUserPremium(user)` is used in 22 files, but several hooks and utility calls check `user.is_premium` directly. The `isUserPremium()` function also validates trial status — files bypassing it may silently deny access to trial users.

**Fix:** Audit all direct `user.is_premium` references and replace with `isUserPremium(user)`.

---

### LOW — `canvas-confetti` imported eagerly in Home.jsx
**File:** `src/pages/Home.jsx:23`

Loaded in the initial bundle for a feature that fires at most once per streak milestone. Could be dynamically imported when the confetti is triggered.

---

## 4. Architecture

### HIGH — `activeDogId` stored only in localStorage — no reactive shared state
**Evidence:** `activeDogId` is read/set in `Profile.jsx`, `Onboarding.jsx`, `DogProfile.jsx`, and `src/utils/index.ts`. Each page reads from `localStorage` on mount independently.

**Risk:** If a user deletes a dog, `DogProfile.jsx` cleans up `localStorage`, but other pages that are already mounted won't re-render. The active dog concept is not managed as shared React state (no Context), meaning stale UI is possible after dog deletion.

**Fix:** Lift `activeDogId` into `AuthContext` or a dedicated `DogContext` so it is reactive across all pages.

---

### HIGH — 202 raw `base44.entities.*` calls across 49 files with no data layer
**Evidence:** 202 direct SDK calls across 49 files with no repository abstraction layer.

Every component runs its own queries with its own error handling (or lack of it). There is no global loading state, no query deduplication, and no consistent retry logic. Two components on screen that both need `Dog` entities will both fire independent queries.

**Note:** This is a deliberate Base44 pattern and partially acceptable for a solo project. The concern is the lack of consistency in error handling around these calls.

---

### MEDIUM — Leaflet icon fix duplicated verbatim in 2 files
**Files:** `NearbyParks.jsx:11–17`, `FindVetContent.jsx:20–26`

Same 6-line `delete L.Icon.Default.prototype._getIconUrl` workaround copied into two files. Extract to `src/utils/leafletDefaults.js`.

---

### MEDIUM — AudioContext singleton in module scope
**File:** `src/components/notebook/SmartHealthAssistant.jsx:16`

```
let _audioCtx = null; // module-level mutable state
```

Module-level mutable state. If the component unmounts and remounts, the context persists but may be in a browser-suspended state. Harmless in practice (wrapped in `try/catch {}`), but an anti-pattern.

---

### LOW — `base44.auth.me()` called individually in 12+ page useEffect hooks
**Evidence:** Direct `base44.auth.me()` calls in Home, Chat, Nutri, Training, Scan, Sante, Activite, Dashboard, DogProfile, Profile, Onboarding, Premium.

`AuthContext` exists and provides `user`, but pages bypass it to get fresh `messages_remaining` / `actions_remaining` values. This causes redundant auth checks and potentially inconsistent user data across pages at the same time.

---

## 5. Accessibility

### HIGH — Interactive Framer Motion divs without keyboard support
Framer Motion `motion.div` elements with `onClick` handlers are present throughout the codebase. These receive click events but are not keyboard-focusable by default. Only 24 occurrences of `tabIndex` or `role="button"` found across 12 files for a codebase with hundreds of interactive elements.

**Fix:** Add `tabIndex={0}` + `onKeyDown` (Enter/Space handling) to all `motion.div` elements that act as interactive buttons.

---

### MEDIUM — Empty `alt=""` on informational images (10 instances)
Several images with `alt=""` carry visual meaning and should have descriptive text:

- `FoodComparator.jsx:77` — food product preview image
- `GrowthTrackerContent.jsx:486` — growth entry photo
- `Dashboard.jsx:320,362` — illustrations for "growth" and "walking" sections

Truly decorative images with `alt=""` are correct. These specific cases are informational.

---

### MEDIUM — Missing `aria-label` on icon-only buttons
88 total `aria-label` occurrences in 49 files, but the codebase has significantly more buttons. Icon-only buttons (Lucide icons: camera in Chat, bookmark toggle, close buttons in modals, FAB buttons) likely lack accessible names.

---

### LOW — Color-only status indicators in some contexts
The health status system uses color (red/amber/green) as the primary severity differentiator. `SmartAlerts.jsx` correctly includes a text label ("Urgent", "Attention", "Info") alongside color. Some inline badge components in other files may rely on color alone — not verified exhaustively.

---

### LOW — HTML `lang` attribute not verifiable from JS code
The Base44 PWA shell should set `<html lang="fr">`. Screen readers default to English pronunciation if absent. Cannot confirm from the JS source alone.

---

## 6. Known Issues

### No raw `console.log` found in production code
All logging uses `console.error`, `console.warn`, or `console.debug`. However, `analytics.js:26` fires `console.debug("[Analytics]", ...)` on every tracked event in production — noise in prod DevTools.

### Silent failures covering critical data paths

| Location | Code | Risk level |
|---|---|---|
| `ai-credits.js:47` | warn: "updateMe failed — actions_remaining field may need schema update" | MEDIUM — credit reset may silently fail |
| `WalkMode.jsx:133+` | Recovery save logs error, then later GPS updates are `catch {}` | MEDIUM — walk data loss possible |
| `SmartHealthAssistant.jsx:317` | `catch {}` on `Dog.update(weight)` | MEDIUM — weight update silently fails |
| `HealthImportContent.jsx:146` | `catch {}` on `Dog.update(weight)` | MEDIUM — same |
| `Training.jsx:587` | `try { JSON.parse } catch {}` | LOW — corrupted AI response silently ignored |
| `AITrainingProgram.jsx:720` | logs "Auto-save failed" then continues | MEDIUM — generated program may not persist |

### Dead code

| Location | Issue |
|---|---|
| `ActiveProgramCards.jsx:13` | `_WEEK_DAYS` array — defined, never used |
| `Nutri.jsx:13` | Comment stub `// SavedPlansPanel merged into NutritionMealPlan` |
| `ai-credits.js:47` | Warning suggests a schema migration was pending — may already be resolved |

---

## Appendix: File Size Reference

Files over 500 lines (split candidates):

| File | Lines | Note |
|---|---|---|
| `ui/PawIllustrations.jsx` | 1,055 | All SVGs in one file — always in bundle |
| `activite/AITrainingProgram.jsx` | 1,000 | God component — generation + display + tracking |
| `pages/Scan.jsx` | 917 | 5 distinct features in one page |
| `nutrition/NutritionMealPlan.jsx` | 914 | Monolithic plan/parse/render |
| `pages/Training.jsx` | 799 | Hardcoded data + UI + state |
| `tracker/WalkMode.jsx` | 749 | GPS tracking + UI + localStorage + reviews |
| `vet/DownloadHealthPDF.jsx` | 743 | Full PDF engine in a component |
| `pages/Nutri.jsx` | 683 | Tab container that duplicates chat logic from Chat.jsx |
| `notebook/SmartHealthAssistant.jsx` | 655 | Chat + voice + record detection + streaming |
| `pages/Chat.jsx` | 643 | Duplicates streaming/credits logic from Nutri |
| `home/ActiveProgramCards.jsx` | 596 | Multiple card types + duplicated date utils |
| `pages/Home.jsx` | 558 | 11-query fetch + UI logic + notifications |

---

## Priority Action List

1. **[HIGH - Security]** `DogPublicProfile` — add owner consent / field filtering for public health records
2. **[HIGH - Architecture]** Lift `activeDogId` into React Context (currently localStorage-only = stale risk after dog deletion)
3. **[HIGH - Maintainability]** Centralize date utils (`addDaysToDate`, `JOURS_COURTS`, `MOIS_FR`) into `dateHelpers.js`
4. **[HIGH - Maintainability]** Audit `user.is_premium` direct accesses — replace with `isUserPremium(user)` to not silently break trial users
5. **[HIGH - Performance]** Lazy-load Leaflet (NearbyParks, WalkMap, FindVetContent) — currently in the initial bundle
6. **[HIGH - Accessibility]** Audit `motion.div onClick` — add `tabIndex={0}` + keyboard handler pattern
7. **[MEDIUM - Maintainability]** Extract typewriter hook shared by Chat and SmartHealthAssistant
8. **[MEDIUM - Performance]** Cache Home data between navigations (11 queries on every mount)
