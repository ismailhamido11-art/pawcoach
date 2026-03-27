# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Feature-sliced SPA (Single Page Application) — PWA with mobile-first design

**Key Characteristics:**
- React SPA rendered inside Base44 platform; routing is client-side via react-router-dom
- Hard split between public routes (no auth) and authenticated routes (wrapped in AuthProvider)
- State is local-first: each page owns its own `useState` with no global store (Redux/Zustand absent)
- HomeCacheContext provides a single 2-minute in-memory cache to avoid redundant API calls on Home re-visits
- All backend logic runs as Deno functions on Base44 (`base44/functions/`); the frontend calls them via `base44.functions.invoke()`

## Layers

**Entry / Bootstrap:**
- Purpose: Mount React app, register PWA service worker
- Location: `src/main.jsx`
- Contains: ReactDOM.createRoot, SW registration
- Depends on: `src/App.jsx`, `src/index.css`

**Router / Auth Shell:**
- Purpose: Separate public routes from authenticated routes at the outermost level
- Location: `src/App.jsx`
- Contains: BrowserRouter, public route declarations (DogPublicProfile, VetDogView), AuthProvider + HomeCacheProvider wrapping all other routes
- Key decision: public pages are lazy-loaded OUTSIDE AuthProvider — no auth check can block them

**Auth Context:**
- Purpose: Holds auth state (user, isAuthenticated, errors), exposes `useAuth()`
- Location: `src/lib/AuthContext.jsx`
- Flow: checks app public settings → then `base44.auth.me()` → sets user or sets `authError`
- Error types handled: `auth_required` (redirect to login), `user_not_registered` (show error UI), `unknown` (generic)

**Home Cache Context:**
- Purpose: Ref-based 2-minute TTL cache for Home page data; invalidated on active dog change
- Location: `src/lib/HomeCacheContext.jsx`
- API: `getCachedHome()`, `setCachedHome(data)`, `invalidateHome()`
- Cache key includes `dogId` from `localStorage.activeDogId`

**Layout:**
- Purpose: Wraps all authenticated pages with AnimatePresence page transition and bottom-nav padding
- Location: `src/Layout.jsx`
- Key rule: pages MUST NOT add their own `pb-*` — Layout already sets `paddingBottom: calc(6rem + env(safe-area-inset-bottom, 0px))`
- Respects `prefers-reduced-motion` via Framer Motion `useReducedMotion()`

**Pages (Route-level components):**
- Purpose: Orchestrate data fetching, local state, and compose feature components
- Location: `src/pages/`
- Pattern: page fetches its own data on mount, passes props down to feature components
- No page imports another page directly

**Feature Components:**
- Purpose: Domain-specific UI, scoped to a feature area
- Location: `src/components/{feature}/` (e.g., `home/`, `tracker/`, `training/`, `sante/`, `nutrition/`)
- Pattern: receive data via props from their parent page, emit callbacks upward
- Do not fetch data directly (exception: some components fetch their own supplemental data)

**Shared UI Components:**
- Purpose: Design-system primitives (shadcn/ui) and PawCoach-specific reusable UI
- Location: `src/components/ui/` (shadcn — never modify) + root of `src/components/` (PawCoach shared)
- PawCoach shared: `BottomNav.jsx`, `PawLoader.jsx`, `PawMascot.jsx`, `ChatFAB.jsx`, `CombinedFAB.jsx`, `WellnessBanner.jsx`, `PullToRefresh.jsx`, `ErrorBoundary.jsx`

**API Layer:**
- Purpose: Typed entity access and Base44 client initialization
- Location: `src/api/base44Client.js` (client init), `src/api/entities.js` (entity wrappers)
- Pattern: `entities.js` wraps `base44.entities.*` with a `wrapEntity()` helper. All entity calls go through named exports (`Dog`, `HealthRecord`, etc.) not through `base44.entities` directly.

**Backend Functions (Deno):**
- Purpose: Server-side AI processing, Stripe, reminders, and data computation
- Location: `base44/functions/{functionName}/entry.ts`
- Called from frontend via `base44.functions.invoke("functionName", payload)`

**Utilities:**
- Purpose: Pure functions shared across pages and components
- Location: `src/utils/` and `src/lib/`
- Key modules: `dateHelpers.js`, `programHelpers.js`, `chartHelpers.jsx`, `premium.js`, `ai-credits.js`, `recommendations.js`, `utils/index.ts`

## Data Flow

**Standard Page Load:**

1. Page mounts → `useEffect` runs
2. Calls `base44.auth.me()` for current user (or reads from `useAuth()` context)
3. Calls `Dog.filter({ owner: user.email })` to get dogs
4. Calls `getActiveDog(dogs)` → reads `localStorage.activeDogId` → returns matching dog
5. Fetches domain entities for that dog (via `src/api/entities.js`)
6. Sets local `useState` with results → triggers re-render

**Home Page (optimistic / cached):**

1. `loadData()` checks `getCachedHome()` first
2. Cache hit: apply cached state immediately (skip loading screen), then `fetchAndCache(skipLoadingState=true)` in background
3. Cache miss: `fetchAndCache(false)` — show SkeletonPage, fetch all data, then call `setCachedHome()`
4. After Stripe redirect (`?premium=success`): poll `base44.auth.me()` every 2s up to 10s until `is_premium=true`

**Check-in Flow (optimistic update):**

1. User submits → set optimistic `{ _syncing: true }` checkin immediately in state
2. Invoke `base44.functions.invoke("dailyCheckinProcess", ...)`
3. On success: replace `_syncing` entry with real checkin from response
4. On error: remove `_syncing` entry, restore `todayCheckin: null`, show toast

**State Management:**
- No global state library. Each page manages its own `useState`.
- `AuthContext` (via `useAuth()`) is the only globally shared reactive state.
- `HomeCacheContext` is ref-based (not reactive — does not trigger re-renders).
- Active dog selection persists via `localStorage.activeDogId`; session tab/scroll state via `sessionStorage`.

## Key Abstractions

**Entity Wrappers (`src/api/entities.js`):**
- Purpose: Centralized, named access to all 19 Base44 entities
- Pattern: `export const Dog = wrapEntity(base44.entities.Dog, "Dog")`
- Usage: always import named entity (e.g., `import { Dog } from "@/api/entities"`)
- Never call `base44.entities.*` directly in page/component code

**`isUserPremium(user)` (`src/utils/premium.js`):**
- Purpose: Single source of truth for premium gating
- Returns `true` if `user.is_premium === true` OR if `user.trial_expires_at` is in the future
- Import from `@/utils/premium` — never inline this logic

**AI Credits System (`src/utils/ai-credits.js` + `src/hooks/useActionCredits.js`):**
- Free users: 3 AI actions/day (`ACTION_DAILY_LIMIT = 3`), 10 chat messages/day (`MSG_DAILY_LIMIT = 10`)
- Resets daily (compared against `getTodayString()`)
- Premium users: skip credit check entirely (`setCredits(Infinity)`)
- Gate UI: `src/components/ui/AICreditsGate.jsx` exports `<CreditBadge>` and `<UpgradePrompt>`

**`createPageUrl(pageName)` (`src/utils/index.ts`):**
- Converts page name to route: `createPageUrl("Home")` → `"/Home"`
- Use everywhere — never hardcode route strings

**`getActiveDog(dogs)` (`src/utils/index.ts`):**
- Reads `localStorage.activeDogId`, returns matching dog or falls back to `dogs[0]`
- Always use this to resolve the active dog — never read `localStorage.activeDogId` directly in components

**Tab Navigation with sessionStorage:**
- Pages with sub-tabs (Sante, Activite, Nutri) persist active tab as `sessionStorage.tab_{Page}`
- BottomNav saves scroll as `sessionStorage.scroll_{Page}` before navigating away
- Double-tap on active BottomNav tab clears sessionStorage keys and resets to default

## Entry Points

**App Root:**
- Location: `src/main.jsx`
- Triggers: browser load
- Responsibilities: mount React, register PWA SW

**Authenticated App:**
- Location: `src/App.jsx` → `<AuthenticatedApp>`
- Triggers: any route not matching `/DogPublicProfile` or `/VetDogView`
- Responsibilities: read `pagesConfig.Pages` → render `<Route>` for each page wrapped in `<LayoutWrapper>` + `<ErrorBoundary>`

**Public Routes (no auth):**
- `/DogPublicProfile` → `src/pages/DogPublicProfile.jsx`
- `/VetDogView` → `src/pages/VetDogView.jsx`

**Main Page (landing):**
- Configured by `mainPage: "Home"` in `src/pages.config.js`
- Route `/` maps to `src/pages/Home.jsx`

## Lazy Loading Strategy

**Always eager (in initial bundle — the 5 BottomNav tabs):**
- `src/pages/Activite.jsx`, `src/pages/Home.jsx`, `src/pages/Nutri.jsx`, `src/pages/Profile.jsx`, `src/pages/Sante.jsx`

**Always lazy (loaded on demand):**
- `Chat`, `Dashboard`, `DogProfile`, `DogPublicProfile`, `Library`, `Onboarding`, `Premium`, `Scan`, `Training`, `VetDogView`, `VetPortal`
- `AITrainingProgram` — large component, lazy-loaded with `lazy()` inside `Activite.jsx`
- `FindVetContent` — contains Leaflet (~150KB gzipped), lazy inside `Sante.jsx`

**Fallback during lazy load:**
- `<SkeletonPage variant="list|stats|detail" currentPage={name} />` from `src/components/ui/SkeletonPage.jsx`

## Error Handling

**Strategy:** Isolated per-page via ErrorBoundary; sonner toasts for async errors

**Patterns:**
- Every page route wrapped in `<ErrorBoundary>` in `App.jsx` — crash in one page does not affect others
- Up to 2 soft retries (re-render) before showing hard reload / go-home buttons (`src/components/ErrorBoundary.jsx`)
- Async errors (entity fetches, function invocations): caught in try/catch → `toast.error(...)` from sonner
- Parallel fetches use `.catch(() => [])` pattern to degrade gracefully when one entity fails

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` only — no external error tracking service

**Premium Gating:** Always via `isUserPremium(user)` from `@/utils/premium`. Components use `<AICreditsGate>` or `useActionCredits()` hook.

**Authentication:** `base44.auth` SDK handles token storage, login redirect, and logout. `AuthContext` exposes the result.

**Animations:** All motion via Framer Motion. Spring presets in `src/lib/animations.js` (`spring`, `springGentle`, `springSnappy`, `tapScale`, `pressIn`, `hoverGlow`, `fadeInUp`, `staggerContainer`, `staggerItem`). All animated components check `useReducedMotion()`.

**Active Dog:** Always resolved via `getActiveDog(dogs)` from `@/utils/index.ts`.

---

*Architecture analysis: 2026-03-27*
