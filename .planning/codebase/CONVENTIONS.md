# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- Pages: PascalCase matching route name — `Home.jsx`, `Sante.jsx`, `Activite.jsx`, `VetDogView.jsx`
- Components: PascalCase by feature — `BentoGrid.jsx`, `TodayCard.jsx`, `WalkMode.jsx`
- Hooks (`src/hooks/`): camelCase prefixed with `use` — `useActionCredits.js`, `useBackClose.js`, `useReducedMotion.js`
- Hooks inside components: `src/components/hooks/useBackClose.jsx` (duplicates `src/hooks/` — prefer `src/hooks/`)
- Utils: camelCase noun — `dateHelpers.js`, `healthStatus.js`, `ai-credits.js` (kebab for multi-word)
- Lib: camelCase — `animations.js`, `query-client.js`, `app-params.js`
- Mixed extensions: `.jsx` for components, `.js` for pure logic, `.ts` only for `src/utils/index.ts`

**Functions:**
- camelCase — `computeHealthScore`, `getActiveDog`, `buildRecommendations`
- Private helpers (no export): underscore prefix `_formatTime` or plain camelCase
- Event handlers: `handle` prefix — `handleStart`, `handleGeolocate`, `handleRetry`, `handleUpgrade`
- Async data loaders: named `load` or `loadData` inside page components
- Utility builders: verb+noun — `buildRecommendations`, `computeVaccineMap`, `getScoreLevel`

**Variables:**
- camelCase throughout — `todayCheckin`, `activeTab`, `loadError`
- Boolean state: no required prefix, both forms used — `loading`, `saving`, `isPremium`, `isAssistantOpen`
- Refs: `Ref` suffix — `consumingRef`, `watchRef`, `stoppingRef`, `initRef`, `prevTabIdx`
- Module-level config constants: UPPER_SNAKE_CASE — `TABS`, `MILESTONES`, `WALK_TAGS`, `VACCINE_REFERENCE`, `MSG_DAILY_LIMIT`

**Types/Components:**
- React components: PascalCase named function — `export default function Home()`
- Context: `NounContext` + `NounProvider` + `useNoun` pattern — `AuthContext` / `AuthProvider` / `useAuth`, `HomeCacheContext` / `HomeCacheProvider` / `useHomeCache`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is manual/editor-driven
- 2-space indentation dominant (some 4-space inconsistency between files)
- Double quotes in JSX attributes, single quotes in JS strings (mixed, no enforced rule)
- Template literals for dynamic strings

**Linting:**
- ESLint 9 flat config at `eslint.config.js`
- Scope: `src/components/**`, `src/pages/**`, `src/Layout.jsx` only
- Ignored: `src/lib/**/*`, `src/components/ui/**/*` (shadcn)
- Key rules enforced:
  - `unused-imports/no-unused-imports: error` — zero dead imports
  - `unused-imports/no-unused-vars: warn` — prefix intentionally unused with `_`
  - `react/prop-types: off` — no PropTypes required
  - `react/react-in-jsx-scope: off` — no `import React` needed
  - `react-hooks/rules-of-hooks: error`
- Run: `npm run lint` / `npm run lint:fix`

## Import Organization

**Observed order:**
1. React core — `import { useState, useEffect, useRef } from "react"`
2. Router — `import { useNavigate, Link, useSearchParams } from "react-router-dom"`
3. Internal utils/lib — `import { createPageUrl, getActiveDog } from "@/utils"`
4. API layer — `import { base44 } from "@/api/base44Client"` then `import { Dog, DailyLog } from "@/api/entities"`
5. Context — `import { useAuth } from "@/lib/AuthContext"`
6. Shared components — `import BottomNav from "@/components/BottomNav"`
7. Feature components — `import WalkMode from "@/components/tracker/WalkMode"`
8. shadcn UI — `import { Button } from "@/components/ui/button"`
9. Icons — `import { Heart, Utensils } from "lucide-react"`
10. Animation — `import { motion, AnimatePresence, useReducedMotion } from "framer-motion"`
11. Toast — `import { toast } from "sonner"`

**Path aliases:**
- `@/` → `src/` (configured in `jsconfig.json` + Vite)
- Use `@/components/...`, `@/utils/...`, `@/lib/...`, `@/api/...`
- Some relative imports still appear for same-directory siblings: `import BottomNav from "../components/BottomNav"` — prefer `@/` alias

## State Management

**Local State + loadData Pattern (universal across all pages):**
```jsx
const [dog, setDog] = useState(null);
const [loading, setLoading] = useState(true);
const [loadError, setLoadError] = useState(false);

const load = async (providedUser) => {
  setLoading(true);
  try {
    const u = providedUser || await base44.auth.me();
    // fetch data...
  } catch (e) {
    console.error(e);
    setLoadError(true);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!isLoadingAuth) load(authUser || undefined);
}, [isLoadingAuth, authUser]);
```

**Auth Context (`src/lib/AuthContext.jsx`):**
- `useAuth()` provides: `user`, `isAuthenticated`, `isLoadingAuth`, `authError`, `logout`, `navigateToLogin`
- Always gate data fetching on `!isLoadingAuth`
- Pass `authUser` from context to `load()` to skip redundant `base44.auth.me()` call

**Home Cache (`src/lib/HomeCacheContext.jsx`):**
- `useRef`-based in-memory cache, 2-minute TTL
- Auto-invalidates when `activeDogId` changes in localStorage
- API: `getCachedHome()` / `setCachedHome(data)` / `invalidateHome()`

**Active Dog:**
- Persisted in `localStorage("activeDogId")`
- Always resolve via `getActiveDog(dogs)` from `src/utils/index.ts` — never read localStorage directly
- `getActiveDog` falls back to `dogs[0]` and syncs localStorage when stored ID is stale

**Tab State Persistence (pages with sub-tabs):**
```jsx
// Priority: URL param > sessionStorage > default
const activeTab = (urlTab && TABS.some(t => t.id === urlTab)) ? urlTab
  : (() => { const s = sessionStorage.getItem("tab_PageName"); return (s && TABS.some(t => t.id === s)) ? s : "default"; })();

// On mount: sync URL if needed (replace=true, no history entry)
const initRef = useRef(false);
useEffect(() => {
  if (!initRef.current) {
    initRef.current = true;
    if (!urlTab && activeTab !== "default") setSearchParams({ tab: activeTab }, { replace: true });
  }
}, []);

// Persist on change
useEffect(() => { sessionStorage.setItem("tab_PageName", activeTab); }, [activeTab]);
const changeTab = (tabId) => { sessionStorage.setItem("tab_PageName", tabId); setSearchParams({ tab: tabId }); };
```
Pattern used in: `Sante.jsx`, `Activite.jsx`, `Nutri.jsx`

**Scroll Persistence:**
- `BottomNav` saves/restores `sessionStorage("scroll_PageName")` on navigation
- Restore uses `requestAnimationFrame(() => window.scrollTo(...))` to avoid layout conflicts

## Component Patterns

**Page Component Structure:**
```jsx
export default function PageName() {
  // 1. Context hooks
  const { user: authUser, isLoadingAuth } = useAuth();
  // 2. Local state (user, dog, data, loading)
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  // 3. Refs
  const initRef = useRef(false);
  // 4. Tab / URL state
  const [searchParams, setSearchParams] = useSearchParams();
  // 5. Async data load
  const load = async (...) => { ... };
  useEffect(() => { if (!isLoadingAuth) load(authUser); }, [isLoadingAuth]);
  // 6. Early returns (loading / error / no dog)
  if (loading) return <SkeletonPage variant="stats" currentPage="PageName" />;
  // 7. JSX
  return (
    <div className="pb-24 min-h-screen bg-background">
      <WellnessBanner ... />
      {/* content */}
      <BottomNav currentPage="PageName" />
    </div>
  );
}
```

**Bottom Sheet / Modal Pattern:**
```jsx
// Backdrop
<motion.div
  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
  onClick={onClose}
/>
// Sheet
<motion.div
  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
  className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl"
  style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
>
  <div className="flex justify-center pt-3 pb-1">
    <div className="w-10 h-1 rounded-full bg-muted" /> {/* handle bar */}
  </div>
  <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 ..."> {/* close btn */}
```
- Always use `useBackClose(visible, onClose)` from `src/hooks/useBackClose.js` for Android back button

**Lazy Loading:**
- Use `lazy(() => import(...))` + `<Suspense fallback={<Skeleton />}>` for heavy sub-components
- Lazy-loaded: `FindVetContent` (Leaflet), `WalkMap`, `NearbyParks`
- Pattern declared at module level, not inside component

**Empty States:**
- Use `<EmptyState>` from `src/components/ui/EmptyState.jsx`
- Props: `mascot` (string key from MASCOTS map), `illustration` (Storyset name), `lottieSrc`, `title`, `description`, `actionLabel`, `onAction`

**Loading States:**
- Full page: `<SkeletonPage variant="stats|list|detail" currentPage="PageName" />`
- App init: `<PawLoader text="..." />` from `src/components/PawLoader.jsx`

**Inline Animations for list items:** define `stagger` and `item` variants at module top-level (outside component) for performance.

## Animation Conventions

**Always import from `src/lib/animations.js`** — do not define one-off spring configs inline when a preset fits:
```jsx
import { spring, tapScale, hoverGlow, fadeInUp, springSnappy, staggerContainer, staggerItem } from "@/lib/animations";
```

**Spring presets:**
| Name | stiffness | damping | Use case |
|------|-----------|---------|----------|
| `spring` | 360 | 28 | Default UI (buttons, cards, tabs) |
| `springGentle` | 120 | 20 | Message/slide-in animations |
| `springSnappy` | 300 | 25 | Expand/collapse, form reveals |
| `tapScale` | 400 | 30 | `whileTap: { scale: 0.97 }` cards |
| `pressIn` | 400 | 30 | `whileTap: { scale: 0.95 }` CTA buttons |

**Tab slide transitions:**
```jsx
const tabVariants = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};
// Used with: custom={tabDir} on AnimatePresence, track tabDir with prevTabIdx ref
```

**Reduced motion:**
```jsx
const prefersReducedMotion = useReducedMotion(); // from framer-motion
// OR inline for non-framer components:
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Apply: initial={reduceMotion ? false : { opacity: 0, y: 20 }}
```

**Stagger pattern:**
```jsx
<motion.div variants={staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>...</motion.div>
  ))}
</motion.div>
```

## Error Handling

**Data Loading:**
- Wrap in `try/catch/finally` — `finally` always sets `setLoading(false)`
- `console.error(e)` for unexpected errors (full error object)
- `toast.error("French user message")` via sonner for user-visible errors
- `setLoadError(true)` for non-recoverable failures; render error UI in JSX

**Silent / Background Operations:**
- Streak updates, badge checks, analytics: `.catch(() => {})` or bare `try {} catch {}`
- Pattern: `checkWalkBadges(dog.id, user.email, logs).catch(() => {})`
- Never let background tasks surface errors to the user

**localStorage / sessionStorage:**
- Always wrap in `try {} catch {}` — private browsing throws `SecurityError`
```jsx
try {
  sessionStorage.setItem(`tab_${page}`, tabId);
} catch { /* navigation privee — ignorer */ }
```

**GPS Error Codes (`src/components/tracker/WalkMode.jsx` line 202):**
```js
(err) => {
  if (err.code === 1) toast.info("GPS désactivé — ...", { id: "gps-warn" });      // PERMISSION_DENIED
  else if (err.code === 2) toast.error("Signal GPS indisponible — ...", { id: "gps-warn" }); // POSITION_UNAVAILABLE
  else if (err.code === 3) toast.error("GPS trop lent — ...", { id: "gps-warn" }); // TIMEOUT
}
```
Use `{ id: "gps-warn" }` to deduplicate repeated toasts.

**Error Translation Maps:**
```js
// src/pages/VetDogView.jsx
const ERROR_MESSAGES = {
  "Access denied": "Accès refusé. Tu n'es pas autorisé à consulter ce chien.",
  "No active access": "Aucun accès actif...",
  ...
};
const translateError = (msg) => ERROR_MESSAGES[msg] || msg;
```
Use this pattern when API returns English errors that need French UI display.

**Double-click Guard (consumingRef pattern) from `src/hooks/useActionCredits.js`:**
```jsx
const consumingRef = useRef(false);
const consume = async () => {
  if (consumingRef.current) return false; // guard anti-double-appel
  consumingRef.current = true;
  try {
    const result = await asyncOperation();
    return result;
  } finally {
    consumingRef.current = false;
  }
};
```
Use whenever an async action must not fire concurrently.

**ErrorBoundary (`src/components/ErrorBoundary.jsx`):**
- Class component wrapping every route in `src/App.jsx`
- Props: `fallback` (custom JSX), `onError(error, errorInfo)` callback
- Retry up to 2 times; after 2 fails, "Recharger la page" becomes primary CTA
- Default fallback uses inline styles (not Tailwind) — guarantees render even if CSS fails
- Colors hardcoded: cream `hsl(37, 33%, 95%)`, forest `#1A4D3E`, emerald `#2D9F82`

## Logging

**No third-party logger.** Use:
- `console.debug("[Analytics]", eventName, props)` — analytics events
- `console.error('[PawCoach] ...', error, info)` — caught errors in ErrorBoundary
- `console.error(e)` — data load failures in pages
- `console.warn("X failed:", e?.message)` — non-critical failures (streaks, credits)

**Analytics (`src/utils/analytics.js`):**
- `trackEvent(eventName, properties)` — stores last 100 events in localStorage
- Temporary implementation until real analytics service
- Silent fail on localStorage unavailability

## CSS / Tailwind Conventions

**Design tokens — use Tailwind tokens, NOT raw hex in className:**
- `text-primary` = forest green #1A4D3E
- `text-accent` = emerald #2D9F82
- `bg-secondary` = light sage
- `text-muted-foreground` = subdued text
- Raw hex only in `style={{}}` for icon colors, SVG fills, dynamic styles
- ZERO orange, ZERO teal, ZERO yellow — amber only for warnings

**Custom CSS utility classes (defined in `src/index.css`):**
- `.gradient-primary` — forest green gradient for primary CTA buttons
- `.gradient-warm` — lighter forest variant
- `.gradient-card` — white-to-sage card backgrounds
- `.card-hover` — `transition + hover:shadow-md + active:scale-[0.97]`
- `.safe-pt-8` through `.safe-pt-24` — safe area + fixed padding for page headers
- `.bottom-nav` — glass nav bar with `backdrop-filter: blur(16px)`

**Border radius:**
- Cards: `rounded-2xl` standard, `rounded-3xl` for bottom sheets
- Pill buttons: `rounded-full`
- Icon containers: `rounded-xl` (square), `rounded-full` (avatar)
- Input fields: `rounded-xl`

**Tap targets:**
- Minimum 44px height (`minHeight: "44px"` or `h-11` = `44px`)
- WCAG mobile accessibility requirement

**Safe area handling:**
- Bottom nav: `.bottom-nav` class (handles `env(safe-area-inset-bottom)`)
- Bottom sheets: inline `paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))"`
- Page top: use `.safe-pt-*` classes on header containers

**Dark mode:**
- `darkMode: "media"` in `tailwind.config.js` — automatic via OS preference
- CSS vars defined for both `:root` and `.dark` in `src/index.css`
- Test dark mode changes before committing

---

*Convention analysis: 2026-03-27*
