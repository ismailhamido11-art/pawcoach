# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Base44-hosted SPA — custom React frontend backed by the Base44 platform (managed auth, entities/ORM, Deno serverless functions, file storage).

**Key Characteristics:**
- React SPA with file-based routing via `src/pages.config.js` auto-registration
- No Redux or Zustand — state is per-page (local `useState`) + two React Contexts + `localStorage`
- All data access goes through the Base44 SDK (`@base44/sdk`), never raw HTTP
- Backend is 22 isolated Deno functions (one per business action), each a self-contained `Deno.serve()` handler
- Premium gating is enforced at both client-side (`isUserPremium()`) and server-side (every AI function re-checks)

## Layers

**Router / App Shell:**
- Purpose: Bootstrap auth, wrap routes, apply layout, catch errors
- Location: `src/App.jsx`
- Contains: `AuthProvider`, `HomeCacheProvider`, public routes, auth-gated routes, `ErrorBoundary`
- Depends on: `src/lib/AuthContext.jsx`, `src/lib/HomeCacheContext.jsx`, `src/pages.config.js`

**Layout:**
- Purpose: Page transition wrapper (Framer Motion `AnimatePresence`), bottom padding for BottomNav
- Location: `src/Layout.jsx`
- Contains: Shared `fadeIn` transition keyed by `currentPageName`; applies `paddingBottom: calc(6rem + env(safe-area-inset-bottom))` for PWA safe-area compliance
- Depends on: framer-motion
- Used by: `LayoutWrapper` in `src/App.jsx` — wraps every authenticated page

**Pages (16 total):**
- Purpose: Top-level route components; own local state, fetch their own data on mount
- Location: `src/pages/`
- Contains: Data fetching, rendering, orchestration of domain components
- Depends on: `src/api/entities.js`, `src/api/base44Client.js`, `src/lib/AuthContext.jsx`, domain components
- Bundle strategy: 5 primary pages (Activite, Home, Nutri, Profile, Sante) are imported eagerly (BottomNav tabs); 11 secondary pages use `React.lazy()` for demand loading

**Domain Components:**
- Purpose: UI logic grouped by feature domain
- Location: `src/components/{domain}/`
- Domains: `home/`, `sante/`, `tracker/`, `vet/`, `nutrition/`, `training/`, `scan/`, `activite/`, `dashboard/`, `dogprofile/`, `onboarding/`, `profile/`, `achievements/`, `premium/`, `notifications/`
- Depends on: `src/api/entities.js`, `src/utils/`, `src/lib/`, shadcn/ui
- Used by: Page components

**Shared Infrastructure Components:**
- Purpose: Cross-cutting UI primitives that are not shadcn/ui
- Location: `src/components/` root-level files
- Key files:
  - `src/components/BottomNav.jsx` — 5-tab fixed navigation; persists scroll and sub-tab state in `sessionStorage`
  - `src/components/ErrorBoundary.jsx` — React class component, per-page crash isolation, 2-retry logic
  - `src/components/PawLoader.jsx` — full-screen loading state shown during auth check
  - `src/components/WellnessBanner.jsx` — premium upsell banner shared across pages
  - `src/components/ChatFAB.jsx` — floating action button for Chat shortcut
  - `src/components/streakHelper.jsx` — streak update logic called from multiple pages
  - `src/components/notifications/NotificationCenter.jsx` — singleton shared state via module-level `_notifications` / `_listeners` pattern

**UI Primitives (shadcn/ui + custom):**
- Purpose: Design system primitives — NEVER MODIFY
- Location: `src/components/ui/`
- Contains: Full shadcn/ui library + 9 custom primitives: `AICreditsGate.jsx`, `EmptyState.jsx`, `IconBadge.jsx`, `LottieAnimation.jsx`, `MobileSelect.jsx`, `PawIllustrations.jsx`, `SkeletonPage.jsx`, `StorysetIllustration.jsx`, `VoiceInput.jsx`

**API Layer:**
- Purpose: Typed entity access wrappers and SDK client initialization
- Location: `src/api/`
- `src/api/base44Client.js` — creates the Base44 SDK client via `createClient` with appId/token from `app-params.js`
- `src/api/entities.js` — exports 19 wrapped entity objects using `wrapEntity()` helper providing `filter`, `create`, `update`, `delete`

**Utility Layer:**
- Purpose: Pure helper functions, no UI
- Location: `src/utils/`
- `src/utils/index.ts` — `createPageUrl(name)` and `getActiveDog(dogs)` (reads `localStorage.activeDogId`)
- `src/utils/premium.js` — `isUserPremium()`, `isUserOnTrial()`, `getTrialDaysLeft()`
- `src/utils/ai-credits.js` — free-tier credit management: `initCredits()`, `consumeMessageCredit()`, `consumeActionCredit()`; limits are 10 messages/day and 3 AI actions/day
- `src/utils/analytics.js` — `localStorage`-based event tracker (no external service), stores last 100 events for 30 days
- `src/utils/recommendations.js` — `buildRecommendations()` generates prioritized action list from dog health data; `getTodayString()`
- `src/utils/healthStatus.js` — dog health score, vaccine map, age calculations
- `src/utils/dateHelpers.js` — date labels, week start, age, time strings
- `src/utils/chartHelpers.jsx` — Recharts custom tooltip component
- `src/utils/programHelpers.js` — AI training program helpers
- `src/utils/pdfHelpers.js` — PDF generation helpers

**Lib (Shared Context & Config):**
- Location: `src/lib/`
- `src/lib/AuthContext.jsx` — provides `user`, `isAuthenticated`, `logout`, `navigateToLogin`; calls `base44.auth.me()` on mount
- `src/lib/HomeCacheContext.jsx` — in-memory 2-minute TTL cache for Home page data, keyed by `activeDogId`
- `src/lib/animations.js` — Framer Motion spring/transition presets (`spring`, `springGentle`, `springSnappy`, `fadeInUp`, `staggerContainer`, etc.)
- `src/lib/app-params.js` — reads `appId`, `token`, `functionsVersion`, `appBaseUrl` from URL params then `localStorage`
- `src/lib/query-client.js` — TanStack Query `QueryClient` instance (configured but usage is limited)
- `src/lib/lottieLibrary.js` — Lottie animation registry
- `src/lib/markdown.js` — Markdown component config for chat message rendering

**Custom Hooks:**
- Location: `src/hooks/` and `src/components/hooks/`
- `src/hooks/useActionCredits.js` — fetches credit state, exposes `consume()` guard
- `src/hooks/useBackClose.js` — mobile back-button close handler
- `src/hooks/useCountUp.js` — animated number counter
- `src/hooks/use-mobile.jsx` — media query hook for responsive breakpoints
- `src/components/hooks/useBackClose.jsx` — (duplicate location, same function)

**Backend Functions (Deno):**
- Purpose: Server-side AI operations, payment processing, scheduled reminders
- Location: `base44/functions/{functionName}/entry.ts`
- Pattern: Each is a standalone `Deno.serve(async (req) => {...})` handler
- Auth: Every function calls `createClientFromRequest(req)` then `base44.auth.me()`, returns 401 if missing
- Privileged writes: `base44.asServiceRole.entities.X` for updating `is_premium`, quota decrement, etc.

## Data Flow

**Standard Page Load:**

1. User navigates to `/{PageName}`
2. `App.jsx` renders `AuthProvider` which calls `checkAppState()` → validates public settings → calls `base44.auth.me()`
3. If authenticated, `AuthenticatedApp` renders the page inside `LayoutWrapper`
4. Page `useEffect` calls entity methods: `Dog.filter({ owner: user.email })`, then parallel entity fetches with `Promise.all()`
5. `getActiveDog(dogs)` reads `localStorage.activeDogId` to select current dog
6. Components receive data as props and render

**AI Feature Flow (Chat, Nutrition AI, Training Programs):**

1. User triggers action (send message, generate plan, analyze photo)
2. Page checks `isUserPremium(user)` client-side for UI gating
3. Credits checked via `useActionCredits` or `initCredits()`
4. Calls `base44.functions.{functionName}({ dogId, ...payload })`
5. Deno function re-validates premium status and quota server-side (atomic decrement)
6. Function calls OpenAI, returns structured JSON response
7. Page updates local state; client-side `consumeMessageCredit()` or `consumeActionCredit()` syncs remaining count

**Active Dog Selection:**

1. `localStorage.activeDogId` stores selected dog ID
2. Every page calls `getActiveDog(dogs)` from `src/utils/index.ts`
3. Falls back to `dogs[0]` if stored ID not found, updates localStorage
4. Dog switch in Profile page sets `localStorage.activeDogId`; navigates to reload current page

**Payment / Subscription Flow:**

1. User clicks upgrade on `src/pages/Premium.jsx`
2. Frontend calls `base44.functions.stripeCheckout({ priceId, dogId })`
3. `base44/functions/stripeCheckout/entry.ts` creates a Stripe Checkout session, returns URL
4. User redirected to Stripe, completes payment
5. Stripe sends webhook to `base44/functions/stripeWebhook/entry.ts`
6. Webhook verifies signature, updates `user.is_premium = true` via `base44.asServiceRole.entities.User.update()`

**State Management:**
- Global: `AuthContext` (user, auth state) + `HomeCacheContext` (2-min TTL cache for Home)
- Local: Each page manages its own state with `useState` — no shared store between pages
- Persistent: `localStorage` for `activeDogId`, analytics events, notification read state; `sessionStorage` for BottomNav scroll and tab positions
- No client-side cache invalidation beyond `HomeCacheContext.invalidateHome()`

## Key Abstractions

**Entity Wrapper (`wrapEntity`):**
- Purpose: Thin proxy over `base44.entities.X` with consistent interface
- Location: `src/api/entities.js`
- Pattern: All pages import named exports — `import { Dog, HealthRecord } from "@/api/entities"` — and call `.filter(query)`, `.create(data)`, `.update(id, data)`, `.delete(id)`
- All queries use field-filtered `.filter()` — never `.list()` which would fetch all records globally

**Premium Gate (dual enforcement):**
- Server-side: Every AI Deno function checks `user.is_premium || (trial_expires_at > now)`, returns 429 if quota exceeded
- Client-side utility: `isUserPremium(user)` from `src/utils/premium.js`
- UI component: `src/components/ui/AICreditsGate.jsx` wraps premium-only UI sections
- Credit system: 10 messages/day + 3 AI actions/day for free tier (fields: `messages_remaining`, `actions_remaining`, `messages_daily_reset`, `actions_daily_reset` on User entity)

**Streak System:**
- Purpose: Gamification — tracks consecutive daily engagement per dog
- Implementation: `src/components/streakHelper.jsx` exports `updateStreakSilently(dogId, ownerEmail)`
- Called from: Home, Sante, Activite, Chat, Training, Scan after user completes an action
- Logic: consecutive day = +1; missed 1 day with `grace_days_remaining > 0` = +1, grace consumed; else reset to 1

**Tab Navigation Pattern (used in Sante, Activite, Nutri):**
- URL query param `?tab=xxx` drives active sub-tab
- `sessionStorage.setItem("tab_{Page}", tabId)` preserves tab across BottomNav navigation
- `useSearchParams()` reads current tab; `setSearchParams({ tab })` updates URL without full reload
- BottomNav `getNavUrl()` restores saved tab when re-entering a stack page

## Entry Points

**Application Entry:**
- Location: `src/App.jsx`
- Triggers: Vite build entry via `index.html`
- Responsibilities: Router setup, public/authenticated split, Provider tree, global error boundary

**Public Routes (no auth required):**
- `/DogPublicProfile` → `src/pages/DogPublicProfile.jsx` — shareable dog health summary, reads `?dogId=` query param
- `/VetDogView` → `src/pages/VetDogView.jsx` — veterinarian read-only access via shared access link

**Main App Entry (authenticated):**
- `/` → `src/pages/Home.jsx` (defined by `mainPage: "Home"` in `src/pages.config.js`)
- All other routes: `/{PageName}` where PageName matches a key in the `PAGES` object

**Backend Entry Points:**
- `base44/functions/{name}/entry.ts` — each is an independent HTTP endpoint
- Called from frontend as `base44.functions.{name}(payload)` via the Base44 SDK

## Page Catalog

| Page | Route | Bundle | Primary Components | Purpose |
|------|-------|--------|-------------------|---------|
| `Home` | `/Home` (and `/`) | Eager | `CoachHomeHeader`, `CalendarStrip`, `DailyBriefing`, `DailyProgress`, `StreakBar`, `QuickActions`, `WeeklyInsightCard` | Daily dashboard |
| `Sante` | `/Sante` | Eager | `NotebookContent`, `DiagnosisContent`, `GrowthTrackerContent`, `FindVetContent`, `HealthImportContent` | Health notebook, vet finder, diagnosis |
| `Activite` | `/Activite` | Eager | `WalkMode`, `TrackerHistory`, `AITrainingProgram` (lazy), training exercises | Walk tracking + AI training |
| `Nutri` | `/Nutri` | Eager | `NutritionMealPlan`, `FoodComparator`, `DietPreferencesPanel` | AI nutrition coach |
| `Profile` | `/Profile` | Eager | `ProfileHeader`, `DogSwitcher`, `SubscriptionSection`, `AchievementsSection` | User/dog settings, subscription |
| `Chat` | `/Chat` | Lazy | Chat UI, message rendering, `VoiceInput` | AI dog coach chat |
| `Dashboard` | `/Dashboard` | Lazy | `SmartAlerts`, Recharts `BarChart`/`AreaChart` | Analytics overview |
| `DogProfile` | `/DogProfile` | Lazy | `DogProfileHero`, `DogIdentityCards`, `DogHealthSection`, `DogTrophiesRow` | Dog detail/edit |
| `DogPublicProfile` | `/DogPublicProfile` | Lazy (public) | Health records list | Shareable dog card |
| `Library` | `/Library` | Lazy | Bookmark list, filter tabs | Saved AI responses |
| `Onboarding` | `/Onboarding` | Lazy | Multi-step form with voice/photo/text inputs | First-time setup |
| `Premium` | `/Premium` | Lazy | Feature comparison, Stripe checkout trigger | Paywall page |
| `Scan` | `/Scan` | Lazy | `LabelScanMode`, camera interface, analysis result | Food ingredient scanner |
| `Training` | `/Training` | Lazy | `JourneyView`, `ExerciseDetail`, `CelebrationScreen` | Dog training program |
| `VetDogView` | `/VetDogView` | Lazy (public) | Read-only dog health summary for vets | Vet access portal |
| `VetPortal` | `/VetPortal` | Lazy | `VetDogCard`, `VetNoteForm`, `VetNotesList` | Veterinarian management |

## Backend Function Catalog

| Function | Category | Purpose |
|----------|----------|---------|
| `pawcoachChat` | AI | Main AI chat with dog context, image support, quota enforcement |
| `dailyCheckinProcess` | AI | Process daily mood/energy/appetite check-in, generate AI tip |
| `generateTrainingProgram` | AI | Generate personalized AI training plan |
| `weeklyInsightGenerate` | AI | Generate weekly wellness insight summary |
| `monthlySummary` | AI | Generate monthly wellness report (premium only) |
| `preDiagnosis` | AI | AI pre-diagnosis from symptoms description |
| `finalDiagnosis` | AI | Detailed AI diagnosis from step-2 questions |
| `processHealthInput` | AI | Process health document upload (OCR + parse) |
| `parseHealthFile` | AI | Parse health file contents |
| `analyzeGrowthPhoto` | AI | Analyze dog photo for growth/body condition |
| `generateDiagnosisPDF` | Data | Generate downloadable PDF health report |
| `stripeCheckout` | Payment | Create Stripe Checkout session |
| `stripePortal` | Payment | Create Stripe Customer Portal session |
| `stripeWebhook` | Payment | Handle Stripe events (checkout.completed, subscription.deleted) |
| `vetAccess` | Access | Generate/validate vet sharing tokens |
| `deleteUser` | GDPR | Full account deletion (user + all dog data) |
| `streakReminder` | Cron | Daily email reminder for inactive users |
| `walkReminder` | Cron | Walk reminder notifications |
| `vaccineReminders` | Cron | Vaccine due date email reminders |
| `medicationReminders` | Cron | Medication schedule email reminders |
| `vetVisitReminders` | Cron | Vet visit reminder notifications |
| `trialExpiryReminder` | Cron | Trial expiry warning emails |

## Error Handling

**Strategy:** Per-page isolation via `ErrorBoundary`; silent degradation for non-critical operations; toast notifications for user-facing errors.

**Patterns:**
- Every page wrapped in `<ErrorBoundary>` at route level in `src/App.jsx`
- `ErrorBoundary`: class component with 2 retry attempts, then page reload, then home redirect
- Parallel entity fetches use `.catch(() => [])` pattern — one failed entity does not crash the page
- Streak and badge updates: `try/catch` with `console.warn` — user action never blocked
- Analytics `trackEvent()` silently swallows all errors
- Backend returns structured `{ error: 'code' }` JSON: 401 (unauth), 403 (forbidden/not-registered), 400 (bad input), 429 (quota exceeded)

## Cross-Cutting Concerns

**Logging:** No external service. `console.error` for real errors, `console.warn` for degraded-mode, `console.debug` for analytics.

**Validation:** Backend: ownership checks (`dog.owner !== user.email`), input type/range validation, SSRF prevention on image URLs. Frontend: relies on backend for correctness.

**Authentication:** Token in `localStorage` via Base44 SDK. `app-params.js` reads from `?access_token=` URL param (removes from URL) then falls back to localStorage. `AuthContext` on mount — 403 → redirect to Base44 login.

**Ownership:** All backend functions validate `dog.owner === user.email`. Frontend always filters with `{ owner: user.email }` — never fetches globally.

**Multi-dog:** Free tier = 1 dog, Premium = up to 3. Active dog stored in `localStorage.activeDogId`.

**Path Alias:** `@/` maps to `src/` (configured in `jsconfig.json` and Vite). Use `@/components/...`, `@/utils/...`, `@/api/...`, `@/lib/...` throughout.

---

*Architecture analysis: 2026-03-27*
