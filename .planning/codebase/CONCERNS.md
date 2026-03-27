# Codebase Concerns — Post v4.0

**Analysis Date:** 2026-03-27
**Context:** v4.0 shipped with 35 fixes. This audit covers what REMAINS and NEW issues found.

---

## CRITICAL

### C1 — `generateTrainingProgram` and `analyzeGrowthPhoto` missing dog ownership check

- **Issue:** Both backend functions authenticate the user (401 gate) but never verify that the `dogId` in the request belongs to that user. A user can pass any other user's `dogId` and the function proceeds.
- **Files:** `base44/functions/generateTrainingProgram/entry.ts:39-41`, `base44/functions/analyzeGrowthPhoto/entry.ts:9-34`
- **Impact:** User A can generate a training program or analyze growth photos using User B's dog profile data (breed, health history, weight). Credits are consumed from the caller, but data leakage occurs.
- **Contrast:** `pawcoachChat/entry.ts:65` and `dailyCheckinProcess/entry.ts:23` both do `if (dog.owner !== user.email)` correctly.
- **Fix:** After `const dog = dogs?.[0]`, add: `if (!dog || dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 });`

### C2 — `DogPublicProfile` exposes ALL health records without consent gate

- **Issue:** `DogPublicProfile.jsx` is a public unauthenticated page that loads ALL `HealthRecord` entries for any dog by ID. No privacy toggle exists on the Dog entity to opt out of public exposure.
- **Files:** `src/pages/DogPublicProfile.jsx:84-89`
- **Impact:** Anyone who obtains a `dogId` (shared via QR code) can view the full medical history (vaccines, medications, vet visits, weights, notes) of any dog without the owner's explicit per-share consent.
- **Fix approach:** Add an `is_public_profile` boolean to the Dog entity (default false). Gate `DogPublicProfile` on this field. `QRCodeCard` should reflect the opted-in state.

### C3 — `pawcoachChat` backend loads unbounded entity history per user

- **Issue:** The "Dog Brain" context fetch in `pawcoachChat/entry.ts:84-96` calls `.filter()` without any limit or date range on `DailyCheckin`, `HealthRecord`, `FoodScan`, `DailyLog`, `WeeklyInsight`, `NutritionPlan`, `DiagnosisReport`, `GrowthEntry`, and `Bookmark`. For active users with months of history, this fetches thousands of rows on every single chat message.
- **Files:** `base44/functions/pawcoachChat/entry.ts:84-96`
- **Impact:** Increasing latency and memory pressure per request as user data grows. Will become a bottleneck once users accumulate 6+ months of daily check-ins.
- **Fix approach:** Add recency limits: `DailyCheckin` last 90 days, `DailyLog` last 60 days, `FoodScan` last 30, others last 20 records. The function already filters for recency in-memory at lines 119-122 — push that filter to the query.

---

## HIGH

### H1 — Six cron functions load entire Dog and User tables with no limit

- **Issue:** `weeklyInsightGenerate/entry.ts:20-33` calls `Dog.list()` and `User.list()` (no filters, no limits). Same pattern in `vaccineReminders`, `medicationReminders`, `vetVisitReminders`, `monthlySummary`, and `streakReminder` — 6 cron functions total iterate the full user/dog table.
- **Files:** `base44/functions/weeklyInsightGenerate/entry.ts:20,33`, `base44/functions/vaccineReminders/entry.ts:40-41`, `base44/functions/medicationReminders/entry.ts:13-14`, `base44/functions/monthlySummary/entry.ts:14-15`, `base44/functions/streakReminder/entry.ts:10-12`, `base44/functions/vetVisitReminders/entry.ts:13-14`
- **Impact:** Cron jobs load the entire user base in memory. At scale (1000+ users) these will time out or OOM. `weeklyInsightGenerate` then fetches full per-dog history inside the loop.
- **Fix approach:** Filter by relevant criteria before the loop: `User.filter({ is_premium: true })` for insight generation, add date-range filters for reminder functions.

### H2 — `Home.jsx` loads 11 entity queries in parallel on every mount, one unbounded

- **Issue:** `fetchDogData` in `src/pages/Home.jsx:47-61` fires 11 parallel entity queries each time Home mounts. `FoodScan.filter({ dog_id: dogId })` has no limit — could return hundreds of scans for power users.
- **Files:** `src/pages/Home.jsx:47-61`
- **Impact:** Slow initial load for active users.
- **Fix:** Add `FoodScan.filter({ dog_id: dogId }, "-timestamp", 20)` limit. Consider whether the 2 `Bookmark.filter` calls are needed on Home or could be lazy-loaded.

### H3 — `HealthRecord.filter` without limits in 5 frontend locations

- **Issue:** Five components call `HealthRecord.filter({ dog_id })` without a result limit. For a user with years of records this returns unbounded data to the client.
- **Files:**
  - `src/components/notebook/SmartHealthAssistant.jsx:338` — dedup check on save
  - `src/components/notifications/NotificationCenter.jsx:78` — reminder generation
  - `src/pages/Dashboard.jsx:85` — statistics computation
  - `src/pages/Home.jsx:51` — health status chip
  - `src/pages/Sante.jsx:99` — full notebook display
- **Impact:** Increasing payload and client-side computation as health records accumulate.
- **Fix:** Add limits appropriate to each use case: Dashboard and Home last 50, SmartHealthAssistant dedup filter by type before loading, Sante 200-record cap.

### H4 — Duplicate utility functions across training components

- **Issue:** `addDaysToDate`, `formatDateFr`, `getElapsedDays`, `JOURS_COURTS`, `MOIS_FR`, and `ACTIVITY_ICONS` are copy-pasted identically across `src/components/activite/AITrainingProgram.jsx` and `src/components/home/ActiveProgramCards.jsx`. `getAge` is duplicated across `src/components/nutrition/NutritionMealPlan.jsx:16` and `src/pages/DogPublicProfile.jsx:13`. `fmtDate` exists in both `src/components/notebook/SectionVaccins.jsx:228` and `src/components/vet/DownloadHealthPDF.jsx:19`. `CustomTooltip` duplicated in `src/components/sante/GrowthTrackerContent.jsx:46` and `src/pages/Dashboard.jsx:45`.
- **Impact:** A bug fix or format change requires updating N files. Already diverged: `ACTIVITY_ICONS` in `ActiveProgramCards.jsx:40` has a `"repos actif"` entry that is missing from `AITrainingProgram.jsx:17`.
- **Fix:** Extract into `src/utils/dateHelpers.js` (partially exists — add `addDaysToDate`, `formatDateFr`), `src/utils/chartHelpers.jsx` (CustomTooltip), `src/utils/programHelpers.js` (training-specific functions).

### H5 — Large monolithic files without component extraction

- **Issue:** Several files exceed 700 lines with mixed concerns:
  - `src/pages/Scan.jsx` — 918 lines: two full scan modes (food + label), history, share flow, all in one file
  - `src/components/activite/AITrainingProgram.jsx` — 1024 lines: program generation, day tracking, bilan modal, past programs, all inlined
  - `src/components/nutrition/NutritionMealPlan.jsx` — 891 lines: generation, week view, history, note editing, inline
  - `src/components/vet/DownloadHealthPDF.jsx` — 743 lines: entire PDF generation logic inline with ~50-char French sanitization table
  - `src/components/tracker/WalkMode.jsx` — 760 lines: timer, GPS, map, parks, share, mood — 7 distinct features
- **Impact:** Files this large are slow to navigate, hard to review, and increase merge conflict risk. Adding any feature to `Scan.jsx` risks breaking the other mode.
- **Fix approach (incremental):** Extract `LabelScanMode` from `Scan.jsx` as a separate component, extract `ProgramBilanModal` from `AITrainingProgram.jsx`, extract `WalkTimer` and `WalkSummary` from `WalkMode.jsx`.

### H6 — `window.confirm()` used for destructive actions (breaks PWA UX)

- **Issue:** Native `window.confirm()` dialogs are used for 6 destructive confirmations across the app.
- **Files:**
  - `src/components/activite/AITrainingProgram.jsx:643` — abandon program
  - `src/components/nutrition/NutritionMealPlan.jsx:96` — delete plan
  - `src/components/nutrition/NutritionMealPlan.jsx:108` — replace active plan
  - `src/pages/Library.jsx:79` — delete bookmark
  - `src/pages/Library.jsx:103` — delete nutrition plan
  - `src/pages/Library.jsx:115` — delete food scan
- **Impact:** On iOS PWA in standalone mode `window.confirm` shows the base44.app URL as the dialog title, which looks unprofessional. Cannot be tested in automated UI tests.
- **Fix:** Replace with Radix `AlertDialog` already available at `src/components/ui/alert-dialog.jsx`.

---

## MEDIUM

### M1 — Unused heavy dependencies in the bundle

- **Issue:** Three packages are installed but have zero imports in `src/`:
  - `three` (^0.171.0) — WebGL 3D library (~600KB minified). No imports found anywhere in `src/`.
  - `react-quill` (^2.0.0) — Rich text editor (~300KB). No imports found anywhere in `src/`.
  - `react-resizable-panels` — Only in `src/components/ui/resizable.jsx` (shadcn scaffold), never imported by app code.
  - `embla-carousel-react` — Only in `src/components/ui/carousel.jsx`, never imported by app code.
- **Files:** `package.json:74,67,68,57`
- **Impact:** `three` and `react-quill` inflate `npm install` time and dependency audit surface.
- **Fix:** Remove `three` and `react-quill` from `package.json`. If `carousel` and `resizable` shadcn components are truly unused, delete their files from `src/components/ui/`.

### M2 — No lazy loading for heavy components inside primary BottomNav pages

- **Issue:** `src/pages.config.js:53-57` imports the 5 primary BottomNav pages statically (correct). However `Activite.jsx` imports `AITrainingProgram.jsx` (1024 lines) and `WalkMode.jsx` (760 lines) eagerly — they load even when the user only visits the walk history tab.
- **Files:** `src/pages.config.js:53-57`, `src/pages/Activite.jsx`
- **Impact:** The initial JS bundle includes AITrainingProgram, WalkMode, and NearbyParks even for a user who only uses Home and Chat. Leaflet and WalkMap are already lazy-loaded — the pattern exists.
- **Fix:** Lazy-load `AITrainingProgram` within `Activite.jsx` using `const AITrainingProgram = lazy(() => import(...))`. Keep `WalkMode` eager since it is the default Activite view.

### M3 — ParkReview comments stored and displayed without length enforcement

- **Issue:** `ParkReviews.jsx:104-115` creates `ParkReview` records with a raw `comment` string. No `maxLength` is enforced on the textarea.
- **Files:** `src/components/tracker/ParkReviews.jsx:100-116`, `src/components/tracker/ParkReviews.jsx:38-60`
- **Impact:** No input length limit means arbitrarily long comments can be stored. React's default escaping prevents injection in the current plain-text render, but the comment field has no validation.
- **Fix:** Add `maxLength={300}` to the comment textarea. Add a trim-and-reject-empty check in `handleSubmit`.

### M4 — `setTimeout` in `NotebookContent.jsx` without cleanup on unmount

- **Issue:** `NotebookContent.jsx` uses 5 `setTimeout` calls for scroll-into-view operations at lines 80, 94, 201, 209, and 219. None have corresponding `clearTimeout` in a cleanup function.
- **Files:** `src/components/sante/NotebookContent.jsx:80,94,201,209,219`
- **Impact:** If the component unmounts before the timeout fires, `setState` is called on an unmounted component. React will log warnings in development.
- **Fix:** Wrap each scroll timeout in a `useEffect` with a cleanup: `return () => clearTimeout(t)`.

### M5 — `Home.jsx` has 24 `useState` declarations — state coordination risk

- **Issue:** `Home.jsx:69-95` manages 24 independent state variables. Related states can drift: `weeklyInsight`, `previousInsight`, `pastInsights` should be one object; `trainingBookmarks` and `behaviorBookmarks` are always loaded together.
- **Files:** `src/pages/Home.jsx:69-95`
- **Impact:** Adding a new data source requires touching `fetchDogData`, `applyDogData`, AND the render — three places. Risk of partial update if any setter is forgotten.
- **Fix (when touching Home for other reasons):** Consolidate dog data into a single `dogData` state object. Consolidate insight states into a single `insights` state object.

### M6 — Lottie animations load from external CDN without error fallback

- **Issue:** `src/lib/lottieLibrary.js` references ~70 Lottie URLs on `assets-v2.lottiefiles.com`. If the CDN is slow or unreachable, animations fail silently leaving empty containers.
- **Files:** `src/lib/lottieLibrary.js`, `src/components/ui/LottieAnimation.jsx`
- **Impact:** Degraded experience on slow connections or during a CDN outage.
- **Fix:** Add an `onError` handler to `LottieAnimation` that renders a fallback illustration or simple icon. `@lottiefiles/dotlottie-react` supports an `onError` callback.

### M7 — `DogAchievement.filter` without limit called on every badge event

- **Issue:** `src/components/achievements/badgeUtils.jsx:26` calls `DogAchievement.filter({ dog_id: dogId })` without a limit. The duplicate-check at line 37 re-fetches all badges to check for one specific badge.
- **Files:** `src/components/achievements/badgeUtils.jsx:26,37,85`
- **Impact:** O(N) on every badge award event. Low now (max 15 badge types per dog), no issue at current scale.
- **Fix:** For duplicate checks, use `DogAchievement.filter({ dog_id: dogId, badge_id: badgeId })` directly instead of fetching all and filtering in-memory.

---

## LOW

### L1 — Three silent `catch {}` blocks in `AITrainingProgram.jsx`

- **Issue:** Lines 540, 652, 714, and 716 use empty catch blocks that swallow errors silently.
- **Files:** `src/components/activite/AITrainingProgram.jsx:540,652,714,716`
- **Impact:** Bookmark failures are invisible. If the `past` array is corrupted, the anti-redundancy feature silently stops working.
- **Fix:** Replace silent catches with `console.warn` at minimum. Add inline comment on the JSON parse catches.

### L2 — One silent `catch {}` in `CombinedFAB.jsx` swallows streak failure

- **Issue:** `catch {}` at line 90 silently swallows a streak update failure after logging a walk via the FAB.
- **Files:** `src/components/CombinedFAB.jsx:90`
- **Fix:** `catch (e) { console.warn("FAB streak update failed:", e?.message); }`

### L3 — `Library.jsx` loads Bookmark and NutritionPlan without pagination

- **Issue:** `src/pages/Library.jsx:59-60` loads all bookmarks and all nutrition plans for a user with no limit.
- **Files:** `src/pages/Library.jsx:59-60`
- **Fix:** Add `, "-created_at", 100` limit to both queries.

### L4 — `analytics.js` localStorage events have no TTL

- **Issue:** `src/utils/analytics.js` stores the last 100 analytics events in localStorage with no time-based expiry. Events from months ago stay in storage.
- **Files:** `src/utils/analytics.js`
- **Fix:** Add a 30-day TTL check when reading events; prune old entries on write.

### L5 — `PawIllustrations.jsx` is 1055 lines of inline SVG

- **Issue:** `src/components/ui/PawIllustrations.jsx` contains all custom SVG illustrations as inline JSX in a single 1055-line file.
- **Files:** `src/components/ui/PawIllustrations.jsx`
- **Impact:** No functional issue. Tree-shaking works for named exports. Navigation is slow.
- **Fix (low priority):** Split into per-illustration files under a dedicated directory.

### L6 — `getWeekStart` date utility defined locally in 4+ places

- **Issue:** At least 4 independent `getWeekStart`-style functions exist locally across the codebase, one of which uses Sunday-start (`Dashboard.jsx:142`) while others use Monday-start.
- **Files:** `src/pages/Dashboard.jsx:142`, `src/pages/Scan.jsx:105`, `src/components/home/ActiveProgramCards.jsx:33`, `src/components/activite/AITrainingProgram.jsx`
- **Impact:** Risk of subtle "this week" calculation inconsistencies between Dashboard and other views.
- **Fix:** Create `getWeekStartMonday()` in `src/utils/dateHelpers.js` and replace all local implementations. Verify whether `Dashboard.jsx` Sunday-start is intentional.

### L7 — `preDiagnosis` and `finalDiagnosis` accept dog profile from request body without server validation

- **Issue:** Both functions accept all dog attributes (breed, weight, health issues) entirely from the client request body. No `dogId` is passed and no server-side validation against the actual Dog entity occurs.
- **Files:** `base44/functions/preDiagnosis/entry.ts:9`, `base44/functions/finalDiagnosis/entry.ts:9`
- **Impact:** A user can fabricate dog data to get arbitrary diagnoses. Quota enforcement is server-side (correct). This is the intended stateless design.
- **Note:** Low risk as the output is AI-generated advice, not data mutations. Document the assumption in both files.

---

## Resolved in v4.0 (confirmed, do not re-open)

- `deleteUser` RGPD: now deletes all 15+ entity types including `ParkReview`
- VetNote access: now filtered by `dog_id` (owner-scoped)
- Email exposure in error messages: sanitized
- `Dog.list()` on frontend: replaced with `Dog.filter({ owner: u.email })`
- Double credit decrement: fixed in `dailyCheckinProcess` and `processHealthInput`
- SmartHealthAssistant localStorage backup: implemented

---

*Concerns audit: 2026-03-27*
