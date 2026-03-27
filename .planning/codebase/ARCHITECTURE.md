# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Feature-based SPA with page-level data ownership and server-backed business logic

**Key Characteristics:**
- Each page owns its own data fetching — no global store, no React Query used in practice (QueryClient instantiated but unused in pages)
- State is local to the page component; shared state flows via Context (auth, home cache) or sessionStorage (tab persistence, scroll position)
- Business logic lives in Deno backend functions invoked via `base44.functions.invoke()` — never inline in frontend
- Premium/free gating is enforced both client-side (UX gates) and server-side (quota check in each function)

## Layers

**Router (App.jsx):**
- Purpose: Split public vs. authenticated routes before any rendering
- Location: `src/App.jsx`
- Contains: Two-tier routing — public routes rendered directly, all others wrapped in `AuthProvider` + `HomeCacheProvider`
- Public routes: `/DogPublicProfile`, `/VetDogView` — lazy-loaded, no auth check
- Auth routes: everything else, guarded by `AuthenticatedApp` component
- Depends on: `pagesConfig`, `AuthContext`, `HomeCacheContext`

**Layout (Layout.jsx):**
- Purpose: Page transition wrapper — applies Framer Motion fade between pages
- Location: `src/Layout.jsx`
- Contains: `AnimatePresence` with `fadeIn` variant, bottom-nav padding via inline style
- Key rule: Layout adds `paddingBottom: calc(6rem + env(safe-area-inset-bottom, 0px))` — pages must NOT add their own `pb-*` on the main wrapper
- Respects `prefers-reduced-motion` (disables animation when requested)

**Pages:**
- Purpose: Orchestrate data fetching, manage local state, compose components
- Location: `src/pages/`
- 5 core tabs (eagerly loaded in `pages.config.js`): `Home`, `Sante`, `Activite`, `Nutri`, `Profile`
- 11 secondary pages (lazy): `Chat`, `Dashboard`, `DogProfile`, `DogPublicProfile`, `Library`, `Onboarding`, `Premium`, `Scan`, `Training`, `VetDogView`, `VetPortal`
- Most pages call `base44.auth.me()` directly; Sante/Activite/Nutri read `authUser` from `useAuth()` context to avoid a second auth call

**API Layer:**
- Purpose: Centralized entity access with consistent error wrapper
- Location: `src/api/entities.js`, `src/api/base44Client.js`
- Pattern: `wrapEntity()` wraps each entity exposing `filter`, `create`, `update`, `delete`
- Backend functions invoked via: `base44.functions.invoke("functionName", payload)`
- Client config: `src/lib/app-params.js` reads `appId`, `token`, `functionsVersion` from URL params then localStorage fallback

**Backend Functions (Deno):**
- Purpose: AI calls, Stripe operations, scheduled reminders, server-side quota enforcement
- Location: `base44/functions/{functionName}/entry.ts`
- Pattern: `Deno.serve(async (req) => {...})` with `createClientFromRequest(req)` for auth context
- Service role operations: `base44.asServiceRole.entities.X.update()` — used for cross-user writes (webhook handler, reminder functions)

**Context Layer:**
- `AuthContext` (`src/lib/AuthContext.jsx`): user object, `isAuthenticated`, `logout()`, `navigateToLogin()`, `checkAppState()`
- `HomeCacheContext` (`src/lib/HomeCacheContext.jsx`): in-memory ref cache for Home page data, 2-minute TTL, invalidated on active dog change

## Data Flow

**Authenticated Page Load:**
1. `AuthProvider.checkAppState()` fetches app public settings via `/api/apps/public`
2. If token present, calls `base44.auth.me()` to load user
3. `AuthenticatedApp` renders routes — error states handled (`auth_required` → redirect, `user_not_registered` → error screen)
4. Page component mounts, calls `base44.auth.me()` + entity filters in parallel via `Promise.all()`
5. Data stored in local `useState` hooks within the page

**Home Page Cache Strategy (stale-while-revalidate):**
1. On mount, check `getCachedHome()` (in-memory ref, 2-minute TTL, dog-ID validated)
2. If cache hit: apply immediately (instant render, no loading state), then trigger silent background refresh
3. If cache miss: show `SkeletonPage`, fetch everything, cache result
4. Manual pull-to-refresh: `invalidateHome()` then full refetch and re-cache

**Check-in Flow (optimistic update):**
1. User submits check-in form
2. Optimistic state applied immediately (`_syncing: true` flag on the new record)
3. `base44.functions.invoke("dailyCheckinProcess", ...)` called
4. On success: replace optimistic record with server response
5. On error: roll back optimistic state, show `toast.error()`

**Premium Conversion Flow:**
1. User taps upgrade → `base44.functions.invoke("stripeCheckout", ...)` creates Stripe Checkout session
2. Redirect to Stripe-hosted checkout
3. Stripe redirects back to `/?premium=success`
4. Home page polls `base44.auth.me()` every 2s for up to 10s until `is_premium=true`
5. `stripeWebhook` function handles `checkout.session.completed` → sets `is_premium: true` on user via service role

**AI Quota System:**
- Free users: 10 messages/day (`messages_remaining`), 3 AI actions/day (`actions_remaining`)
- Client side: `src/utils/ai-credits.js` — `initCredits()` initializes/daily-resets via `base44.auth.updateMe()`
- Server side: `pawcoachChat` function re-checks quota and decrements atomically — prevents multi-tab bypass
- Premium check: `isUserPremium(user)` in `src/utils/premium.js` — returns `true` if `user.is_premium` OR `trial_expires_at > now`

**State Management:**
- No global state library (no Redux, no Zustand)
- `AuthContext`: auth user object available app-wide via `useAuth()`
- `HomeCacheContext`: Home page data cache (in-memory ref, does not trigger re-renders)
- Local `useState` per page for all page-specific data
- `sessionStorage`: tab state (`tab_Sante`, `tab_Activite`, `tab_Nutri`), scroll position (`scroll_{Page}`)
- `localStorage`: active dog ID (`activeDogId`), notification read state (`pawcoach_read_notifs`), analytics events (`pawcoach_analytics_events`), post-trial dismissed flag (`pawcoach_post_trial_dismissed`), auth token (`base44_access_token` — managed by SDK)

## Key Abstractions

**Tab Navigation Pattern (Sante, Activite, Nutri):**
- Purpose: URL-driven tab state with sessionStorage fallback and native-like horizontal slide
- Files: `src/pages/Sante.jsx`, `src/pages/Activite.jsx`, `src/pages/Nutri.jsx`
- Pattern: `useSearchParams()` for URL sync, `sessionStorage.setItem("tab_X", id)` for persistence, direction ref for slide animation direction
- Priority chain: deep link URL param > URL param > sessionStorage > default tab
- Double-tap on active BottomNav tab: clears sessionStorage tab state, navigates to clean URL

**Premium Gate:**
- Purpose: Unified premium/trial check in one function
- File: `src/utils/premium.js`
- Functions: `isUserPremium(user)`, `isUserOnTrial(user)`, `getTrialDaysLeft(user)`
- UI components: `src/components/ui/AICreditsGate.jsx` (`CreditBadge`, `UpgradePrompt`), `src/components/premium/PremiumNudgeSheet.jsx`, `src/components/premium/PostTrialSheet.jsx`, `src/components/home/TrialExpiryBanner.jsx`
- Nudge logic in Home page: shown after day 2 if free, `premium_onboarding_nudge_shown` flag prevents repeat

**Entity Access:**
- Purpose: Uniform CRUD wrapper over Base44 entities
- File: `src/api/entities.js`
- 19 entities exported: `Dog`, `HealthRecord`, `DailyCheckin`, `DailyLog`, `Streak`, `FoodScan`, `UserProgress`, `DiagnosisReport`, `NutritionPlan`, `Bookmark`, `WeeklyInsight`, `SharedVetAccess`, `DogAchievement`, `DietPreferences`, `GrowthEntry`, `ParkReview`, `PlaceFavorite`, `ChatMessage`, `VetNote`

**Streak Helper:**
- Purpose: Shared streak increment logic with 1-day grace period — called fire-and-forget
- File: `src/components/streakHelper.jsx`
- Used by: `Sante`, `Activite`, `Chat`, `Scan` pages after any user activity
- Dedup guard: skips update if `last_activity_date === today`

**Notification Center:**
- Purpose: Module-level singleton for health/vaccine/medication reminders (not React state)
- File: `src/components/notifications/NotificationCenter.jsx`
- Pattern: Module-level `_notifications`, `_loadedAt`, `_listeners` — subscribe from any component, `clearNotifications()` called on logout to prevent cross-session leaks

**Animation System:**
- File: `src/lib/animations.js`
- Exports: `spring` (stiffness 360, damping 28), `springGentle`, `springSnappy`, `tapScale`, `pressIn`, `hoverGlow`, `fadeInUp`, `staggerContainer`, `staggerItem`
- All pages use `useReducedMotion()` and conditionally skip animations

## Entry Points

**App Root:**
- Location: `src/App.jsx`
- Triggers: Vite dev server / production build entry via `src/main.jsx`
- Responsibilities: Router setup, split public/authenticated routes, lazy-load public pages

**Auth Gate:**
- Location: `src/App.jsx` → `AuthenticatedApp` component
- Triggers: All routes under `/*`
- Responsibilities: Check Base44 app public settings + user auth, redirect to login if needed, show typed error screens

**Home Page (mainPage):**
- Location: `src/pages/Home.jsx`
- Triggers: Route `/` (mainPage) and `/Home`
- Responsibilities: Primary dashboard, daily check-in, streak display, premium nudges, Stripe success polling

**Onboarding:**
- Location: `src/pages/Onboarding.jsx`
- Triggers: Home page navigates here when `Dog.filter({ owner: email })` returns empty array
- Uses sessionStorage to persist multi-step form state across interruptions

## Error Handling

**Strategy:** Layered — `ErrorBoundary` per page catches React crashes; try/catch with toast for async operations; auth errors handled at app root

**Patterns:**
- `ErrorBoundary` class component (`src/components/ErrorBoundary.jsx`) wraps every page via `App.jsx` — shows retry/reload/home buttons with max 2 soft retries before forcing reload
- Async fetch: `try/catch` with `toast.error()` — never silently swallows errors in user-visible flows
- Background operations (streak updates, badge checks, nudge flag writes): `console.warn()` only, never blocking the user flow
- Optimistic updates: explicit rollback on catch (restore previous state, show toast)
- Backend functions: return `Response.json({ error: "..." }, { status: 4xx })` for client errors; `429` for quota exceeded with `{ error: "quota_exceeded", messages_remaining: 0 }`
- Auth errors in `AuthContext`: typed `authError.type` field (`auth_required`, `user_not_registered`, `unknown`)

## Cross-Cutting Concerns

**Logging:** `console.debug("[Analytics]", ...)` for events; `console.error()` for caught errors in pages; `console.warn()` for non-blocking failures (streak, badge, credit writes)

**Analytics:** `src/utils/analytics.js` — localStorage-based event store (last 100 events, `pawcoach_analytics_events`); `trackEvent(name, props)` called for business events (onboarding complete, premium conversion, daily limit reached). No external service yet — inspect via `getEvents()` in browser console.

**Validation:** Client-side form guards (inline conditions). Server-side in functions: input sanitization via `sanitize(s, max)` helper (truncates + strips `<>`), SSRF protection on image URLs (allowlist: `base44.app`, `amazonaws.com`), server-side quota checks for AI endpoints.

**Authentication:** Base44 SDK handles tokens. `AuthContext` orchestrates boot sequence (public settings → user auth). Token stored as `base44_access_token` in localStorage via SDK. Logout calls `base44.auth.logout()` which cleans token, then `clearNotifications()` to prevent cross-session data leaks.

**Accessibility:** `prefers-reduced-motion` respected in `Layout.jsx`, all pages with animations; WCAG minimum 44px tap targets in `ErrorBoundary` buttons; `aria-label` on bottom nav; `pointer-events: none` + `-webkit-user-drag: none` on decorative images.

**PWA / Mobile:** `env(safe-area-inset-bottom)` in bottom nav padding; haptic feedback via `navigator.vibrate()` on check-in and streak actions; pull-to-refresh via `src/components/PullToRefresh.jsx`.

---

*Architecture analysis: 2026-03-27*
