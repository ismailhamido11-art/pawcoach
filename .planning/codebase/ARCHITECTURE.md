# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Single-Page Application (SPA) — client-rendered React PWA hosted on Base44. No SSR.

**Key Characteristics:**
- Page-per-feature architecture: 16 top-level pages each own their data fetching, state, and child components
- Flat context layer: only 2 React contexts (auth + home cache) — no Redux, no Zustand
- Direct API coupling: pages call `@/api/entities` directly (no service layer, no caching library beyond HomeCacheContext)
- Backend is pure serverless (22 Deno functions on Base44) — no shared server state

## Layers

**Entry / Bootstrap:**
- Purpose: Initialize routing, auth guard, context providers
- Location: `src/main.jsx` → `src/App.jsx`
- Contains: Router setup, public vs authenticated route split, provider tree
- Depends on: `AuthProvider`, `HomeCacheProvider`, `pagesConfig`
- Used by: Nothing (root)

**Routing (Base44 convention):**
- Purpose: Declare all pages and the main entry page
- Location: `src/pages.config.js`
- Contains: Eager imports (5 BottomNav tabs), lazy imports (11 secondary pages), `Layout` reference
- Depends on: All page components
- Used by: `App.jsx`

**Layout Wrapper:**
- Purpose: Animate page transitions, apply bottom-nav padding globally
- Location: `src/Layout.jsx`
- Contains: `AnimatePresence` + `motion.div` per page, `prefers-reduced-motion` support
- Note: Pages must NOT add `pb-*` on their root wrapper — Layout handles it via `paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))"`
- Depends on: Framer Motion
- Used by: `App.jsx` via `LayoutWrapper`

**Pages (16 total):**
- Purpose: Own data fetching lifecycle, local state, and compose feature components
- Location: `src/pages/`
- Contains: `useEffect` data loaders, local `useState` groups, tab routing via `useSearchParams`, render tree of domain components
- Depends on: `@/api/entities`, `@/api/base44Client`, `@/lib/AuthContext`, `@/lib/HomeCacheContext`, `@/utils/*`
- Key pattern: Each page fetches its own data on mount; no shared server cache between pages

**API Access Layer:**
- Purpose: Typed wrappers around the Base44 SDK entity methods
- Location: `src/api/entities.js`, `src/api/base44Client.js`
- Contains: `wrapEntity()` factory producing `{ filter, create, update, delete }` for each of 19 entities
- Depends on: `@base44/sdk`
- Used by: Every page and many feature components

**Context Layer:**
- Purpose: Cross-page global state — auth session and home page cache
- Location: `src/lib/AuthContext.jsx`, `src/lib/HomeCacheContext.jsx`
- Contains:
  - `AuthContext`: `user`, `isAuthenticated`, `isLoadingAuth`, `appPublicSettings`, `logout`, `navigateToLogin`
  - `HomeCacheContext`: ref-based in-memory cache for Home page data (2-minute TTL, dog-scoped)
- Depends on: `@/api/base44Client`
- Used by: All authenticated pages

**Feature Components:**
- Purpose: Isolated UI + logic for a specific domain feature
- Location: `src/components/{domain}/` (home, sante, nutrition, tracker, activite, dashboard, dogprofile, profile, achievements, vet, premium, onboarding, scan, training, reminders, notifications)
- Contains: UI components that receive props from their parent page; some make direct API calls for mutations
- Depends on: `@/api/entities`, `@/utils/*`, `@/lib/animations`, shadcn/ui primitives

**Shared UI Primitives:**
- Purpose: Design system components — DO NOT MODIFY
- Location: `src/components/ui/` (shadcn/ui + custom wrappers: `SkeletonPage`, `EmptyState`, `IconBadge`, `StorysetIllustration`, `LottieAnimation`, `PawIllustrations`)
- Depends on: Radix UI, Tailwind CSS

**Utilities:**
- Purpose: Pure functions for business logic, formatting, and calculations
- Location: `src/utils/` and `src/lib/`
  - `src/utils/index.ts` — `createPageUrl()`, `getActiveDog()` (reads `localStorage.activeDogId`)
  - `src/utils/premium.js` — `isUserPremium()`, `isUserOnTrial()`, `getTrialDaysLeft()`
  - `src/utils/ai-credits.js` — credit initialization and consumption (MSG_DAILY_LIMIT=10, ACTION_DAILY_LIMIT=3)
  - `src/utils/recommendations.js` — `buildRecommendations()`, `getTodayString()`
  - `src/utils/healthStatus.js` — WSAVA vaccine logic, `computeHealthScore()`, `computeVaccineMap()`
  - `src/utils/dateHelpers.js` — date formatting helpers
  - `src/utils/analytics.js` — `trackEvent()`
  - `src/lib/animations.js` — Framer Motion spring presets (`spring`, `springGentle`, `springSnappy`, `fadeInUp`, `staggerContainer`, `staggerItem`, `tapScale`, `pressIn`, `hoverGlow`)

**Backend Functions (Deno on Base44):**
- Purpose: AI processing, Stripe payments, scheduled reminders
- Location: `base44/functions/`
- 22 functions: `pawcoachChat`, `preDiagnosis`, `finalDiagnosis`, `generateTrainingProgram`, `weeklyInsightGenerate`, `monthlySummary`, `stripeCheckout`, `stripePortal`, `stripeWebhook`, `parseHealthFile`, `analyzeGrowthPhoto`, `dailyCheckinProcess`, `deleteUser`, `generateDiagnosisPDF`, `medicationReminders`, `streakReminder`, `trialExpiryReminder`, `vaccineReminders`, `vetAccess`, `vetVisitReminders`, `walkReminder`
- Called by: Frontend via `base44.functions.invoke()` or triggered by Base44 scheduler

## Data Flow

**Primary Page Load Flow:**

1. User navigates to a route → `App.jsx` checks `AuthProvider` state
2. If `isLoadingPublicSettings || isLoadingAuth` → `PawLoader` shown
3. If auth error → `UserNotRegisteredError` or redirect to login
4. Page mounts → `useEffect` fires data fetch: `base44.auth.me()` + `Dog.filter({ owner: u.email })`
5. `getActiveDog(dogs)` reads `localStorage.activeDogId` to select the current dog
6. Page calls entity methods in parallel via `Promise.all()` for all dog-specific data
7. State updates → components re-render with data

**Home Page Cache Flow (HomeCacheContext):**

1. Home mounts → calls `getCachedHome()` (validates dogId match + 2-min TTL)
2. If cache hit + fresh: renders immediately from cache, triggers background refresh
3. If cache miss or stale: shows `SkeletonPage`, fetches fresh via `fetchAndCache()`
4. After walk save or dog switch: callers invoke `invalidateHome()` to clear the ref cache
5. Cache stored in `useRef` — survives re-renders, cleared on page reload

**Tab Navigation (Sante, Activite, Nutri):**

1. Pages use `useSearchParams` for URL-based tab state (`?tab=carnet`)
2. On tab change: `sessionStorage.setItem("tab_${Page}", tabId)` + URL update
3. BottomNav double-tap: clears sessionStorage + navigates to clean URL (resets to default tab)
4. BottomNav `getNavUrl()`: re-injects saved sessionStorage tab into nav URL for stack pages

**Mutation Flow:**

1. User action in component → component calls entity method directly (e.g., `DailyLog.create(payload)`)
2. On success: local state updated, optional `toast.success()`
3. If action affects Home data (e.g., walk saved via CombinedFAB): `onLogSaved?.()` prop triggers `invalidateHome()`
4. Badge checks triggered via `checkWalkBadges()` or `checkStreakBadges()` after writes

**State Management:**

- No global state manager (no Redux/Zustand)
- Page-level state: `useState` groups (dog, user, loading, entity arrays)
- `Nutri` page uses compound state object (`dogDataState`) with shorthand setters for backward compatibility
- Cross-page cache: `HomeCacheContext` (ref-based, dog-scoped, 2-min TTL)
- Auth state: `AuthContext` (user object; premium checked via `isUserPremium(user)`)
- Active dog: `localStorage.activeDogId` (string ID, read by `getActiveDog()`)
- Scroll positions: `sessionStorage.scroll_{PageName}` (saved on nav away, restored on mount)
- Tab state: `sessionStorage.tab_{PageName}` + URL `?tab=` param

## Key Abstractions

**Entity Wrapper (`wrapEntity`):**
- Purpose: Uniform CRUD interface over the Base44 SDK for all 19 domain entities
- Examples: `src/api/entities.js`
- Pattern: `Entity.filter(conditions, sort?, limit?)` / `Entity.create(data)` / `Entity.update(id, data)` / `Entity.delete(id)`

**CombinedFAB:**
- Purpose: Global quick-log sheet (weight, walk, water, note) accessible from Home
- Location: `src/components/CombinedFAB.jsx`
- Writes to both `DailyLog` (daily entry) and `HealthRecord` (weight sync so Sante/Growth can read it)
- Pattern: FAB opens bottom sheet; on save calls `onLogSaved()` prop which triggers `invalidateHome()` in Home

**Active Dog Pattern:**
- Purpose: Multi-dog support — one dog active at a time
- Implementation: `localStorage.activeDogId` set on login/dog switch; read by `getActiveDog()` in every page; `DogSwitcher` updates localStorage + calls `invalidateHome()`
- All entity queries filter by `dog_id` from the active dog

**Premium Gate:**
- Purpose: Free vs premium feature access
- Logic: `isUserPremium(user)` checks `user.is_premium || (trial_expires_at > now)`
- Enforced: In page render (conditional rendering), in `initCredits()` (skip credit deduction for premium), in backend Deno functions (HMAC-validated quota)
- Free limits: 10 AI messages/day, 3 AI actions/day (stored on user object, reset daily in `ai-credits.js`)

**Tab-within-Page Navigation:**
- Pattern used in: `Sante` (5 tabs), `Activite` (4 tabs), `Nutri` (5 tabs)
- Tab state: URL param (`?tab=X`) + sessionStorage backup
- Animation: Framer Motion `AnimatePresence` with directional slide (`tabDir` = +1 or -1 based on index delta between `prevTabIdx` and current)
- Lazy tabs: Heavy tabs (Leaflet map in Sante "Véto") use `lazy()` + `Suspense`

**Streak Engine:**
- Purpose: Track daily activity streaks with grace day logic
- Location: `src/components/streakHelper.jsx`
- Pattern: `updateStreakSilently(dogId, ownerEmail)` called after any health activity; dedup guard (`last_activity_date === today` → skip); 1 grace day if 2-day gap; cap at 2000 streaks

**Modal Back-Button Handling (`useBackClose`):**
- Purpose: Make browser back gesture close a modal instead of navigating away
- Location: `src/hooks/useBackClose.js`
- Pattern: Pushes history entry when modal opens; listens to `popstate` to close

**Backend Communication:**
- AI actions: `base44.functions.invoke("functionName", payload)` (streaming where applicable)
- Auth: `base44.auth.me()` / `base44.auth.updateMe(updates)` / `base44.auth.logout()`
- Stripe: dedicated backend functions (`stripeCheckout`, `stripePortal`, `stripeWebhook`)

## Entry Points

**Root:**
- Location: `src/main.jsx`
- Triggers: Browser load
- Responsibilities: Mount React app, wrap with `QueryClientProvider`, `Toaster` (sonner)

**App Router:**
- Location: `src/App.jsx`
- Triggers: All navigation events
- Responsibilities: Split public routes (`/DogPublicProfile`, `/VetDogView`) from authenticated routes; wrap auth routes in `AuthProvider` + `HomeCacheProvider`; render `LayoutWrapper` per page with `ErrorBoundary`

**PWA:**
- Location: `public/manifest.json`, `public/sw.js`
- Triggers: Browser PWA installation prompt
- Responsibilities: Offline shell, installability, icons

## Error Handling

**Strategy:** Defensive — each data fetch wrapped in try/catch; errors surfaced as toasts or fallback UI, never crash the page.

**Patterns:**
- Page-level: `setLoading(false)` in `finally` block; optional `setLoadError(true)` for empty state display
- Parallel entity calls: each call uses `.catch(() => [])` inside `Promise.all()` so one failure does not block all data
- Auth errors: Handled in `AuthContext` with typed `authError` objects (`auth_required`, `user_not_registered`, `unknown`)
- Mutation errors: `toast.error("message")` + `setSaving(false)` in `finally`
- Global: `ErrorBoundary` component wraps every page in `LayoutWrapper`
- AI streaming: graceful degradation (show partial text, enable retry)

## Cross-Cutting Concerns

**Logging:** No `console.log` in production code (enforced in v7.0). `console.warn` for non-critical failures (badge checks, credit updates). `console.error` for unexpected auth/save errors only.

**Validation:** Client-side only — field validation in components before API calls (e.g., `CombinedFAB` validates numeric min/max). No shared validation schema.

**Authentication:** Token stored in `localStorage` via Base44 SDK (`base44_access_token`). `app-params.js` reads token from URL on SSO redirect, stores in localStorage, strips from URL. Routes `/DogPublicProfile` and `/VetDogView` are the only public routes.

**Animations:** All transitions use presets from `src/lib/animations.js`. `useReducedMotion()` checked at page/layout level — when true, animations are instant (duration: 0) or disabled.

**Accessibility:** `aria-label` on FAB buttons and icon-only actions, `role="dialog"` on bottom sheets, `nav aria-label="Navigation principale"` on BottomNav.

---

*Architecture analysis: 2026-03-27*
