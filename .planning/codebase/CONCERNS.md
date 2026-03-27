# Codebase Concerns

**Analysis Date:** 2026-03-27
**Scope:** Full audit post v8.0 ("SFA Fixes"). All items verified against current code. No manufactured issues.
**CGC Version:** Dead-code and pattern analysis via CodeGraphContext + manual grep verification.

---

## CRITICAL

### Backend: `streakReminder` loads entire Streak table without filter

- Files: `base44/functions/streakReminder/entry.ts:10`
- Problem: `Streak.list()` fetches every streak row across all users. A hard cap at 2000 rows is in place (line 11-14), and a `console.warn` fires if exceeded. However the cap only prevents a timeout — it doesn't reduce the data fetched. Base44 SDK filter operators for numeric comparison are undocumented, blocking a proper filtered query.
- Impact: Linear growth with user count. Daily CRON. At ~2000 users it will slow measurably. At ~10000 it will timeout without the cap.
- Fix approach: Monitor whether Base44 SDK adds `current_streak__gte` filter support. If it does, replace `Streak.list()` with `Streak.filter({ current_streak__gte: 3 })`. Until then, the 2000 cap is the active mitigation.

---

## HIGH

### Dead code: 6 components exported but never imported

Confirmed via exhaustive grep — zero `import` statements for any of these components anywhere in `src/`.

| Component | File | Lines | Last known purpose |
|-----------|------|-------|--------------------|
| `DogRadarHero` | `src/components/home/DogRadarHero.jsx` | 65 | Premium mobile header (replaced by `CoachHomeHeader`) |
| `StreakBar` | `src/components/home/StreakBar.jsx` | 34 | Streak display (replaced, never reconnected) |
| `TodayCard` | `src/components/home/TodayCard.jsx` | ~60 | Daily coaching card (replaced by `DailyBriefing`/`DailyProgress`) |
| `WellnessScore` | `src/components/home/WellnessScore.jsx` | ~50 | Score widget (replaced by unified score in header) |
| `DailyCoaching` | `src/components/home/DailyCoaching.jsx` | 46 | Recommendations display (replaced) |
| `BentoGrid` | `src/components/home/BentoGrid.jsx` | ~30 | Navigation grid (never connected after design iteration) |
| `QuickActions` | `src/components/home/QuickActions.jsx` | 15 | Quick action buttons (exported but never imported by any page) |

- Impact: ~290 lines of unreachable code. Each file is a maintenance surface — future developers may try to use or modify them. DogRadarHero imports `WalkMode`, `NearbyParks`, and other modules, which may inflate bundle analysis tools.
- Fix approach: Delete all 7 files. Verify no indirect references via `cgc analyze deps` on each before deletion. Note: `QuickActions` — the variable name `showQuickActions` in `Nutri.jsx:387` is unrelated (local boolean, not the component).

---

### Large component files — 6 files above 620 lines

These files mix multiple independent concerns. Any modification risks regressions in unrelated sections.

| File | Lines | Primary concern |
|------|-------|----------------|
| `src/pages/Training.jsx` | 824 | Hardcoded `EXERCISES` array (25 items) + `BEHAVIOR_GUIDES` array (6 items) at top of page file — content mixed with logic |
| `src/components/nutrition/NutritionMealPlan.jsx` | 735 | Data fetch + AI call + plan display + saved plan list all in one component |
| `src/pages/Nutri.jsx` | 764 | 5-tab page, each tab independently complex; state is grouped but file length remains high |
| `src/pages/Home.jsx` | 742 | Full app entry point; 35 imports, 55 useEffect/useState, multiple render branches |
| `src/components/notebook/SmartHealthAssistant.jsx` | 658 | Chat + voice + credits + record creation review panel in one file |
| `src/components/activite/AITrainingProgram.jsx` | 620 | Save/load, program generation, session tracking, and bookmarking in one component |

- Fix approach: For `Training.jsx`, extract `EXERCISES` and `BEHAVIOR_GUIDES` to `src/data/trainingContent.js`. For `Nutri.jsx`, each tab content can become its own component (pattern already used for Sante tabs). For `NutritionMealPlan.jsx`, the saved-plan list is independently extractable.

---

### `SmartAlerts` does not receive `growthEntries` — GrowthTracker weights invisible to drift alerts

- Files: `src/pages/Dashboard.jsx:404-411`, `src/components/dashboard/SmartAlerts.jsx:287`
- Problem: Dashboard fetches `GrowthEntry` data (`line 82`) and stores it in `growthEntries` state, but the `<SmartAlerts>` component receives only `dog`, `checkins`, `records`, `streak`, `dailyLogs`, `scans`. The `growthEntries` prop is not passed. `SmartAlerts` signature does not accept it.
- Impact: Weight entries logged exclusively via GrowthTracker (with height/BCS/photo) are invisible to weight drift alerts. The alert fires only when HealthRecord or DailyLog weights are present. Low impact today because `CombinedFAB` writes to both `HealthRecord` and `DailyLog`, but GrowthTracker-exclusive weights (heavier entries) remain blind spots.
- Fix approach: Add `growthEntries` prop to `SmartAlerts` signature. Merge with the `allWeights` array computed inside (lines ~20-40 of `SmartAlerts.jsx`), using the same priority rule as `GrowthTrackerContent.jsx` (GrowthEntry > HealthRecord > DailyLog by date).

---

### `sanitize()` function copied across 10 backend functions — no shared utility

- Files:
  - `base44/functions/analyzeGrowthPhoto/entry.ts:42`
  - `base44/functions/dailyCheckinProcess/entry.ts:9`
  - `base44/functions/finalDiagnosis/entry.ts:42`
  - `base44/functions/generateDiagnosisPDF/entry.ts:5` (different semantics: ASCII normalization, not injection guard)
  - `base44/functions/generateTrainingProgram/entry.ts:52`
  - `base44/functions/parseHealthFile/entry.ts:13`
  - `base44/functions/pawcoachChat/entry.ts:14`
  - `base44/functions/preDiagnosis/entry.ts:38`
  - `base44/functions/processHealthInput/entry.ts:38`
  - `base44/functions/weeklyInsightGenerate/entry.ts:165`
  - Frontend duplicate: `src/utils/pdfHelpers.js:26`
- Problem: Each function defines its own inline version. Two distinct behaviors coexist: (a) injection guard (`substring + replace /[<>]/g`) and (b) ASCII normalization for jsPDF (French accent → ASCII). A bug fix to one version must be applied manually to all others.
- Impact: If the injection guard logic needs tightening (e.g., extend blocked chars), all 9 backend copies must be updated. Risk of drift.
- Fix approach: Base44 Deno functions cannot share a common module across function boundaries. Mitigation: add a versioned comment block at the top of each copy (e.g., `// sanitize v1 — injection guard — keep in sync`). Long-term: if Base44 adds shared function support, centralize immediately.

---

### `validateImageUrl()` copied across 4 backend functions

- Files:
  - `base44/functions/analyzeGrowthPhoto/entry.ts:45`
  - `base44/functions/finalDiagnosis/entry.ts:45`
  - `base44/functions/preDiagnosis/entry.ts:41`
  - `base44/functions/processHealthInput/entry.ts:41`
- Problem: Same allowlist `['base44.app', 'amazonaws.com', 's3.amazonaws.com']` duplicated in 4 places. Adding a new allowed CDN requires 4 edits.
- Impact: Allowlist drift if one copy is updated and others are not.
- Fix approach: Add a versioned comment header (e.g., `// SSRF guard v1 — keep in sync with: finalDiagnosis, preDiagnosis, processHealthInput`) to each copy. Any update to the allowlist must grep-find all copies.

---

### `getAge()` duplicated in 2 backend functions and 1 frontend util

- Files:
  - `base44/functions/pawcoachChat/entry.ts:438` — returns French string with months/years
  - `base44/functions/weeklyInsightGenerate/entry.ts:205` — same implementation
  - `src/utils/dateHelpers.js:85` — authoritative frontend version, imported by `NutritionMealPlan.jsx`
- Problem: Three independent date-age calculation functions. Backend versions are not imported from `dateHelpers.js` (different runtime). Minor drift risk.
- Fix approach: Comment-based sync. The frontend version at `src/utils/dateHelpers.js:85` is authoritative — backend copies should match its logic.

---

### `SmartHealthAssistant` uses client-side credit decrement that can silently fail

- Files: `src/components/notebook/SmartHealthAssistant.jsx:129`, `:236`, `:286`
- Problem: `initCredits()` is called at mount, but the `catch` block at line 129 swallows all errors silently (`console.warn` only). If `updateMe` fails (network error, rate limit), the UI shows a stale credit count.
- Impact: User sees wrong remaining credits (higher than actual). Not a security issue (server enforces independently) but can display "credits available" when server disagrees.
- Fix approach: On `initCredits` failure, display `?` credits and show a subtle sync indicator. Or remove client-side credit tracking and read credits from the server response on each AI call.

---

## MEDIUM

### `index-as-key` anti-pattern in 36 locations across list renders

- Files: Widespread. Confirmed instances in `src/components/activite/AITrainingProgram.jsx`, `src/components/activite/CompletionCard.jsx`, `src/components/home/ActiveProgramCards.jsx`, `src/components/home/CalendarStrip.jsx`, `src/components/nutrition/NutritionMealPlan.jsx`, `src/components/nutrition/FoodComparator.jsx`, and ~10 more (grep count: 36 matching `key={i}`, `key={idx}`, `key={index}`)
- Problem: React reconciliation uses `key` to match DOM nodes. Index-as-key causes wrong animation targets and stale input values when lists reorder or partially update.
- Impact: Visual glitches on re-renders, potential stale state in program day cards and food comparison results.
- Fix approach: Use stable IDs where available (`key={day.id}`, `key={item.osm_id}`, `key={record.id}`). Reserve `key={i}` only for static, never-reordered lists (skeleton loaders, config arrays).

---

### Empty `catch {}` blocks swallowing silent failures on data mutations — 20+ locations

- Files: High-risk instances:
  - `src/components/notebook/SectionPoids.jsx:32` — dog weight update silently fails
  - `src/components/notebook/WeightCard.jsx:34` — dog weight update silently fails
  - `src/components/home/ActiveProgramCards.jsx:378` — badge check silently fails
  - `src/components/tracker/WalkMode.jsx` — multiple catch blocks swallowing walk state errors
  - `src/components/notebook/SmartHealthAssistant.jsx` — multiple empty catches
- Problem: User performs an action (save weight, complete walk), gets no feedback that it failed, thinks data was saved.
- Fix approach: Add `console.warn` in critical data-mutation catches. Reserve empty `catch {}` for non-essential cleanup only (`localStorage.removeItem`, `recognition.abort()`, `wakeLock.release()`).

---

### Accessibility: low aria-label coverage on interactive controls

- Files: All major pages and components
- Problem: BottomNav tabs have no `aria-label` per tab item (only the `<nav>` has one). Most icon-only buttons in checkin moods/energy options, walk start/pause/stop controls, program day toggles, and DayCard expand buttons have no `aria-label`.
- Impact: Screen readers on iOS VoiceOver and Android TalkBack read only "button" with no context.
- Fix approach: Priority: individual tab items in `src/components/BottomNav.jsx`, checkin energy/mood buttons in `src/components/home/InlineCheckin.jsx`, walk controls in `src/components/tracker/WalkMode.jsx` (partially done at line 516).

---

### `eslint-disable` suppressions for `react-hooks/exhaustive-deps` in 4 locations

- Files:
  - `src/components/notebook/SmartHealthAssistant.jsx:91`
  - `src/components/sante/FindVetContent.jsx:87`
  - `src/components/sante/FindVetContent.jsx:108`
  - `src/components/sante/NotebookContent.jsx:111` (inline suppression)
- Problem: Suppressed rather than fixed. Future changes to deps of these effects will introduce stale-closure bugs without any ESLint warning.
- Fix approach: Replace with `useRef`-guarded mount effects (pattern already in use in `FindVetContent.jsx:82-88`). In `SmartHealthAssistant.jsx`, the suppressed effect can likely be unwrapped with a stable `useCallback`.

---

### `WalkMode` imported eagerly in `Activite.jsx` — carries `NearbyParks` weight on first load

- Files: `src/pages/Activite.jsx:11`, `src/components/tracker/WalkMode.jsx:10`
- Problem: `WalkMode` is a static import in `Activite.jsx`. The walk feature is not the default tab on Activite.
- Impact: Moderate. `WalkMode` adds ~50KB to the Activite initial bundle for users who never open the walk tab.
- Fix approach: Wrap `WalkMode` itself in `lazy(() => import("..."))` with a Suspense fallback, shown only when the user selects the walk tab.

---

### Overpass API called without key — shared IP rate limiting risk

- Files: `src/utils/overpass.js:1`, `src/components/tracker/NearbyParks.jsx`
- Problem: `overpass-api.de` has a ~1 req/2s rate limit per IP. Multiple simultaneous users from Base44's shared hosting may share an IP, triggering 429 errors for park searches.
- Impact: `NearbyParks` searches fail silently during peak times. The 4-hour `localStorage` cache provides mitigation for repeat requests but not for concurrent new users.
- Fix approach: Proxy Overpass requests through a backend function to control the source IP. Or implement a geohash-keyed shared cache in a DB entity (one cached result per geohash+date, shared across all users in that area).

---

### `Nutri.jsx` shorthand setter pattern adds boilerplate

- Files: `src/pages/Nutri.jsx:56-120`
- Problem: State was correctly grouped into `dogDataState` and `coachState` objects, but ~18 individual shorthand setter functions were added to maintain backward compatibility with existing code. This adds ~50 lines of boilerplate and makes the component harder to read.
- Impact: Maintenance overhead. Adding a new field to either state group requires adding a new setter function.
- Fix approach: Replace shorthand setters with direct `setDogDataState(p => ({ ...p, fieldName: value }))` calls at each callsite, or use `useReducer` with typed actions for the coach conversation state.

---

### `Training.jsx` and `Nutri.jsx` contain hardcoded content that should be data

- Files:
  - `src/pages/Training.jsx:25-172` — `EXERCISES` array (25 items with steps, icons, premium flags) and `BEHAVIOR_GUIDES` array (6 items with multi-paragraph text)
- Problem: Training content is not editable without a code change and git push. No admin panel, no CMS.
- Impact: Non-blocking today. Becomes friction when adding new exercises or behavior guides.
- Fix approach: Move `EXERCISES` and `BEHAVIOR_GUIDES` to `src/data/trainingContent.js` as a first step (separates data from UI). Long-term: a `TrainingContent` entity in Base44 schema would allow content updates without deploys.

---

### 55 `useEffect` calls across 16 page files — only 6 cleanup functions

- Files: All `src/pages/*.jsx`
- Problem: There are 55 `useEffect` calls across page files. Only 6 return cleanup functions. Effects that set state on async operations (data fetches, timers) are not guarded against component unmount, which can cause "Can't perform a React state update on an unmounted component" warnings in development.
- Impact: In current code this is a console warning, not a crash. Can cause stale state updates after fast navigation.
- Fix approach: Add `let cancelled = false` + `if (!cancelled) setState(...)` pattern in data-fetching effects, or use `AbortController` for fetch calls. Prioritize `src/pages/Chat.jsx` (heaviest hook count) and `src/pages/Scan.jsx`.

---

## LOW

### Unused npm packages: `cmdk`, `input-otp`, `vaul`

- Files: `package.json`
- Problem: All three are in `dependencies` but only used by `src/components/ui/` shadcn wrapper files (`command.jsx`, `input-otp.jsx`, `drawer.jsx`). None of those wrappers are imported by any app component.
- Impact: ~40-60KB unused bundle weight depending on tree-shaking.
- Fix approach: Remove from `package.json` and delete the unused shadcn wrappers. Run build to confirm no regressions.

---

### `@stripe/stripe-js` unused on frontend

- Files: `package.json`
- Problem: `@stripe/stripe-js` is in `dependencies` but not imported anywhere in `src/`. Stripe is handled server-side via backend functions that return redirect URLs.
- Impact: ~40KB unused bundle weight.
- Fix approach: Remove from `package.json`. Confirmed: zero `from.*stripe` imports in `src/`.

---

### `next-themes` used only in shadcn `sonner.jsx` wrapper — `ThemeProvider` never mounted

- Files: `package.json`, `src/components/ui/sonner.jsx:2`
- Problem: `next-themes` is imported in the `sonner.jsx` wrapper to call `useTheme()`. However, `ThemeProvider` from `next-themes` is never mounted in `App.jsx`. The `useTheme()` call returns `undefined` theme, meaning the Toaster uses default theme only.
- Impact: Minor. `next-themes` adds ~10KB. The sonner Toaster still works but ignores any future dark-mode theme variable.
- Fix approach: Either mount `ThemeProvider` in `App.jsx` (if dark mode is planned), or replace the `sonner.jsx` wrapper with a direct import that passes a hardcoded `theme="light"` to avoid the `next-themes` dependency.

---

### `stripeWebhook` has soft idempotency only — not stored in DB

- Files: `base44/functions/stripeWebhook/entry.ts:51,76`
- Problem: The handler logs "Idempotent skip" if user premium status already matches the event outcome (state-based check). This is not a true event-ID deduplication. If the same event fires twice in quick succession before the first write completes, both writes proceed.
- Impact: Currently benign (`is_premium: true` write is idempotent for that field). Becomes a real bug if credit grants, counters, or email sends are ever added to this handler.
- Fix approach: Store processed `event.id` values in a `StripeEvent` DB entity (id, processed_at). Check before processing. This is the standard approach for webhook idempotency.

---

## ITEMS CONFIRMED FIXED (do not re-report)

Verified absent in current codebase post v8.0:

- `window.confirm` / `window.alert` — zero instances in frontend
- `TODO` / `FIXME` / `HACK` comments — none in frontend or backend
- `console.log` in production code — zero instances in `src/` and `base44/functions/` (console.warn/error in catch blocks are intentional)
- PWA manifest.json and sw.js — both present in `public/` with real implementation
- `monthlySummary` using `is_trial` field — replaced with in-memory filter on `trial_expires_at > now` (line 15-19; `is_trial` reference is comment only)
- `monthlySummary` using `Dog.list()` / `User.list()` — replaced with filtered queries
- `walkReminder` sequential per-user DailyLog queries — replaced with `Promise.all`
- `finalDiagnosis` bypass quota — HMAC-signed `pre_diagnosis_token` implemented (lines 21-61); token is required and cryptographically verified
- `finalDiagnosis` missing ownership check — `dog_id` + `dog.owner !== user.email` check present
- `generateDiagnosisPDF` missing ownership check — present
- `ParkReview` RGPD gap in deleteUser — `ParkReview.deleteMany({ dog_id })` added
- `stripeWebhook` hard-crashes on retry — soft idempotency check added (state-based, see LOW concern above)
- `LabelScanMode.jsx` in wrong directory — moved to `src/components/scan/LabelScanMode.jsx`
- `useReducedMotion` custom hook duplication — removed; all imports use `framer-motion`
- `Nutri.jsx` 20 individual `useState` calls — refactored into grouped `dogDataState` and `coachState` objects
- `Home.jsx` useState explosion — resolved with `dogData` + `insights` group objects
- `AlertDialog` replacing `window.confirm` — zero window dialogs remain
- `Dog.list()` in most CRONs — replaced with filtered queries (exception: `streakReminder` still uses `Streak.list()`, reported in CRITICAL)
- Ownership checks on all user-facing AI functions — confirmed in `pawcoachChat`, `analyzeGrowthPhoto`, `generateTrainingProgram`, `dailyCheckinProcess`, `processHealthInput`, `vetAccess`, `finalDiagnosis`, `generateDiagnosisPDF`
- `react-leaflet` eagerly loaded in `FindVetContent` — now lazy-loaded
- `html2canvas` and `jspdf` eager imports — both use dynamic `import()` at call time
- Quick check-in defaults (CRASH-01) — energy/appetite now default correctly
- Scanner ReferenceError (CRASH-02) — resolved
- DogPublicProfile email exposure (UX-02) — email no longer rendered on public profile
- CombinedFAB visibility (CRASH-04) — visible on Home, wired with `invalidateHome`
- Training points rollback (UX-05) — `UserProgress.delete` in catch block if `updateMe` fails

---

*Concerns audit: 2026-03-27 — Full CGC + grep verification against v8.0 codebase*
