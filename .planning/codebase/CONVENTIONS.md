# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` — `ErrorBoundary.jsx`, `WeeklyInsightCard.jsx`
- Pages: PascalCase `.jsx` — `Home.jsx`, `Chat.jsx`, `Training.jsx`
- Utilities: camelCase `.js` — `dateHelpers.js`, `healthStatus.js`, `pdfHelpers.js`
- Hooks: camelCase `.js` starting with `use` — `useActionCredits.js`, `useBackClose.js`, `useCountUp.js`
- Backend functions: camelCase directory + `entry.ts` — `pawcoachChat/entry.ts`
- TypeScript utils: `.ts` extension — `src/utils/index.ts`
- Context providers: PascalCase + `Context` suffix — `HomeCacheContext.jsx`, `AuthContext.jsx`

**Functions:**
- React components: PascalCase — `export default function WeeklyInsightCard`
- Hooks: camelCase `use` prefix — `useActionCredits`, `useBackClose`, `useCountUp`
- Utility functions: camelCase — `getActiveDog`, `formatDateFr`, `computeHealthScore`
- Event handlers: `handle` prefix — `handleRetry`, `handleTabClick`, `handleSave`
- Async fetch helpers: descriptive camelCase — `fetchDogData`, `checkAppState`, `checkUserAuth`
- Backend Deno handlers: anonymous `Deno.serve(async (req) => {...})`

**Variables:**
- camelCase throughout — `dogId`, `isPremium`, `messagesRemaining`
- Boolean flags: `is` or `has` prefix — `isPremium`, `hasCredits`, `isStreaming`
- Constants: SCREAMING_SNAKE_CASE — `MSG_DAILY_LIMIT`, `ACTION_DAILY_LIMIT`, `CACHE_TTL`, `MILESTONES`
- Ref variables: `Ref` suffix — `bottomRef`, `streamingRef`, `prevTabIdx`
- Intentionally unused vars: underscore prefix `_` — `const [_user, setUser]`, `_scoreColor`, `_isPremiumProp`

**Types / Interfaces:**
- No explicit TypeScript types in `.jsx` files (JS project with checkJs)
- Backend `.ts` files use inline `any` typing — `const sanitize = (s: any, max = 500) => ...`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is manual/editor-driven
- 2-space indentation throughout
- Arrow functions for callbacks, regular `function` declarations for named exports and hooks

**Linting (`eslint.config.js`):**
- ESLint v9 flat config
- Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-unused-imports`
- `react/prop-types`: off (no prop-types enforcement)
- `react/react-in-jsx-scope`: off (React 18 automatic JSX transform)
- `react-hooks/rules-of-hooks`: error (hooks rules strictly enforced)
- `unused-imports/no-unused-imports`: error (zero dead imports tolerated)
- `unused-imports/no-unused-vars`: warn (underscore prefix `_` exempts intentionally unused vars)
- Scope: only `src/components/`, `src/pages/`, `src/Layout.jsx`
- Excluded: `src/lib/`, `src/components/ui/`

**Scripts:**
```bash
npm run lint          # ESLint --quiet (errors only)
npm run lint:fix      # ESLint --fix (auto-fix)
npm run typecheck     # tsc -p ./jsconfig.json (type check JS files)
```

## Import Organization

**Order (observed pattern):**
1. React/external libraries — `import { useState, useEffect, useMemo } from "react"`
2. Third-party packages — `import { motion } from "framer-motion"`, `import { toast } from "sonner"`
3. Internal `@/` aliases — `import { base44 } from "@/api/base44Client"`, `import { isUserPremium } from "@/utils/premium"`
4. Relative component imports — `import BottomNav from "../components/BottomNav"`
5. Lucide icons grouped with their context — `import { Flame, ScanLine } from "lucide-react"`

**Path Aliases:**
- `@/` resolves to `./src/` (configured in `jsconfig.json` and Vite)
- Always use `@/` for cross-directory imports; relative paths only for same-directory siblings
- Mixed style is acceptable: `../components/BottomNav` and `@/components/ui/SkeletonPage` may coexist in the same file

**Lazy imports (code splitting):**
```javascript
const FindVetContent = lazy(() => import("@/components/sante/FindVetContent"));
const AITrainingProgram = lazy(() => import("@/components/activite/AITrainingProgram"));
```
Use for heavy sub-tabs (Leaflet maps, complex AI panels). Wrap in `<Suspense fallback={<SkeletonPage variant="list" />}>`.

**Backend (Deno):**
- Single npm import: `import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20'`
- No other imports — all logic is self-contained in each `entry.ts`

## Error Handling

**Frontend patterns:**

Pattern 1 — Full page load (try/catch/finally with toast.error):
```javascript
useEffect(() => {
  (async () => {
    try {
      const u = await base44.auth.me();
      // ...
    } catch (err) {
      console.error("Dashboard load error:", err);
      toast.error("Impossible de charger le tableau de bord. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  })();
}, []);
```

Pattern 2 — Promise.all with per-query fallback (non-critical queries):
```javascript
const [recs, cks, stk, logs, foodScans] = await Promise.all([
  HealthRecord.filter({ dog_id: d.id }, "-date", 100),
  DailyCheckin.filter({ dog_id: d.id }, "-date", 90),
  Streak.filter({ dog_id: d.id }),
  DailyLog.filter({ dog_id: d.id }, "-date", 90),
  FoodScan.filter({ dog_id: d.id }, "-timestamp", 20).catch(() => []),  // non-critical
]);
```

Pattern 3 — Fire-and-forget side effects (silent failures acceptable):
```javascript
checkStreakBadges(dog.id, user.email).catch(() => {});
base44.auth.updateMe({ field: value }).catch(e => console.warn("...", e));
```

**Toast messages:** Always in French. Failures: `"Impossible de ... Vérifie ta connexion."` or `"Impossible de ... Réessaie."`. Successes: short and affirming — `"Sauvegardé !"`, `"Copié !"`.

**Error Boundary (`src/components/ErrorBoundary.jsx`):**
- Class component with retry (max 2 attempts) + reload + home fallback
- Logs to `console.error('[PawCoach] Erreur capturée par ErrorBoundary :', error)`
- Every route in `src/App.jsx` is wrapped: `<ErrorBoundary><Page /></ErrorBoundary>`

**Backend (Deno) patterns:**
- Top-level `try/catch` wrapping all handler logic
- Early returns: `if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
- Ownership check after fetch: `if (dog.owner !== user.email) return Response.json({ error: 'Forbidden' }, { status: 403 })`

## Data Fetching Patterns

**Entity access (frontend):**
- Always via `src/api/entities.js` wrappers — `import { Dog, HealthRecord } from "@/api/entities"`
- Never use `base44.entities.*` directly in pages or components
- Pattern: `Entity.filter({ field: value }, "-sort_field", limit).catch(() => [])`
- Filtered queries only — never `.list()` global fetch

**Parallel fetch helper (extracted outside component):**
```javascript
async function fetchDogData(dogId) {
  const today = getTodayString();
  const [checkins, streaks, recs, logs] = await Promise.all([
    DailyCheckin.filter({ dog_id: dogId, date: today }).catch(() => []),
    Streak.filter({ dog_id: dogId }).catch(() => []),
    HealthRecord.filter({ dog_id: dogId }, "-date", 100).catch(() => []),
    DailyLog.filter({ dog_id: dogId }, "-date", 30).catch(() => []),
  ]);
  return { checkins, streaks, recs, logs };
}
```

**Backend function calls:**
```javascript
const resp = await base44.functions.invoke("functionName", { payload });
```

**Auth:**
```javascript
const user = await base44.auth.me();
await base44.auth.updateMe({ field: value });
```

**Home cache (2-minute TTL, `src/lib/HomeCacheContext.jsx`):**
- In-memory `useRef` cache, invalidated on active dog change
- Used only in `src/pages/Home.jsx` to avoid redundant full-page refetches
- Pattern: serve from cache immediately, then always refresh in background (`fetchAndCache(true)`)

## Nullish Coalescing Defaults (v8.0 pattern)

Use `??` instead of `||` when the value can legitimately be `0` or `false`:

```javascript
// Correct — 0 credits is a valid state
if ((credits ?? 0) <= 0) return false;
const hasCredits = isPremium || (credits ?? 0) > 0;
const remaining = messagesRemaining ?? 0;

// Correct — null insight is not an error
weeklyInsight: insightsData.weeklyInsight ?? null,
pastInsights: insightsData.pastInsights ?? [],

// Correct — 0 points is a valid score
const points = achievementPoints ?? user?.points ?? 0;
```

Props with array defaults use destructuring defaults: `{ dogs = [], onSubmit, loading = false }` — `??` is for runtime guard on state values, not prop defaults.

## Memoization Patterns

**Use `useMemo` for:**
1. Computed values from multiple data sources (weight merged from two entities)
2. Derived stats passed as display values (score, chart data, alerts)
3. Data-heavy child renders (SmartAlerts with 6 props)

**`latestRealWeight` pattern (canonical example from `src/components/nutrition/NutritionMealPlan.jsx`):**
```javascript
// Merge HealthRecord weights + DailyLog weights, pick latest
const latestRealWeight = useMemo(() => {
  const allWeights = [
    ...(healthRecords || []).filter(r => r.type === "weight" && r.value).map(r => ({ date: r.date, v: parseFloat(r.value) })),
    ...(dailyLogs || []).filter(l => l.weight_kg).map(l => ({ date: l.date, v: parseFloat(l.weight_kg) })),
  ].filter(w => !isNaN(w.v)).sort((a, b) => a.date > b.date ? 1 : -1);
  return allWeights.length > 0 ? allWeights[allWeights.length - 1].v : dog?.weight || null;
}, [healthRecords, dailyLogs, dog?.weight]);
```
Apply this same pattern anywhere you need "most recent value from two entity lists."

**Dashboard memoization (all computed data in one `useMemo`):**
```javascript
const { weightData, walkData, checkinChart, avgMood, alerts, score, scoreLabel } = useMemo(() => {
  // ... all chart/score/alert computation
  return { weightData, walkData, checkinChart, avgMood, alerts, score, scoreLabel };
}, [records, dailyLogs, checkins, dog, growthEntries]);
```

**`memo()` for expensive child renders:**
```javascript
const AlertRow = memo(function AlertRow({ alert, index }) { ... });
```
Used in `src/components/dashboard/SmartAlerts.jsx` for row-level memoization.

## Background Refresh / Dual-Listener Pattern

For pages that need to refresh data when the user returns from another app or tab:

```javascript
// CACHE-04: Refresh data when returning to this page
useEffect(() => {
  const refreshScans = () => {
    if (dog?.id) {
      FoodScan.filter({ dog_id: dog.id }, "-timestamp", 5)
        .then(scans => setRecentScans(scans || []))
        .catch(() => {});
    }
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") refreshScans();
  };
  window.addEventListener("focus", refreshScans);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("focus", refreshScans);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}, [dog?.id]);
```

Both `focus` (tab regained focus) and `visibilitychange` (tab became visible) are needed for cross-browser PWA compatibility. Always clean up both listeners in the effect return. Used in `src/pages/Nutri.jsx`. Apply the same pattern in any page that shows data that may change while the user is in another tab.

## Grouped State with Shorthand Setters (large pages)

For pages with many related state fields (Nutri.jsx has 13 fields), group into a single object state and expose individual setters:

```javascript
const [dogDataState, setDogDataState] = useState({
  dog: null, user: null, recentScans: [], dietPrefs: null, activePlan: null,
});
const { dog, user, recentScans } = dogDataState;
const setDog = (v) => setDogDataState(p => ({ ...p, dog: typeof v === "function" ? v(p.dog) : v }));
const setUser = (v) => setDogDataState(p => ({ ...p, user: typeof v === "function" ? v(p.user) : v }));
```

This avoids a large number of top-level `useState` calls while preserving backward-compatible setter signatures. Only use when a page has 8+ related fields. See `src/pages/Nutri.jsx` lines 57-80.

## Tab Navigation Pattern (URL-based)

All multi-tab pages use the same pattern for URL persistence + sessionStorage fallback:

```javascript
const TABS = [
  { id: "balade", label: "Balade", icon: Footprints, bg: "from-emerald-500 to-emerald-700" },
  { id: "historique", label: "Historique", icon: History, bg: "from-blue-500 to-indigo-600" },
];

const [searchParams, setSearchParams] = useSearchParams();
const urlTab = searchParams.get("tab");
// Priority: URL param > sessionStorage > default
const activeTab = (urlTab && TABS.some(t => t.id === urlTab)) ? urlTab
  : (() => { const s = sessionStorage.getItem("tab_PageName"); return (s && TABS.some(t => t.id === s)) ? s : "default-tab-id"; })();

// Sync URL on first mount without pushing history
const initRef = useRef(false);
useEffect(() => {
  if (!initRef.current) { initRef.current = true; if (!urlTab && activeTab !== "default-tab-id") setSearchParams({ tab: activeTab }, { replace: true }); }
}, []);
useEffect(() => { sessionStorage.setItem("tab_PageName", activeTab); }, [activeTab]);
const changeTab = (tabId) => { sessionStorage.setItem("tab_PageName", tabId); setSearchParams({ tab: tabId }); };

// Direction tracking for native-like horizontal slide
const tabIndex = TABS.findIndex(t => t.id === activeTab);
const prevTabIdx = useRef(tabIndex);
const tabDir = tabIndex >= prevTabIdx.current ? 1 : -1;
useEffect(() => { prevTabIdx.current = tabIndex; }, [tabIndex]);
```

Present in: `Activite.jsx`, `Sante.jsx`, `Nutri.jsx`. Apply to every new multi-tab page.

## Loading / Skeleton Pattern

All pages guard the initial render:

```javascript
if (loading) {
  return <SkeletonPage variant="stats" currentPage="Dashboard" />;
}
```

Skeleton variants: `"stats"` (stat cards grid), `"list"` (item list), `"detail"` (form/profile), `"chat"` (chat thread). `currentPage` prop is optional (used by `BottomNav` inside the skeleton).

## Sanitization Patterns

**Backend `sanitize` helper (defined inline in 10 backend files):**
```typescript
const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');
```
Present in: `base44/functions/pawcoachChat/entry.ts`, `base44/functions/dailyCheckinProcess/entry.ts`, `base44/functions/finalDiagnosis/entry.ts`, `base44/functions/generateDiagnosisPDF/entry.ts`, `base44/functions/generateTrainingProgram/entry.ts`, `base44/functions/parseHealthFile/entry.ts`, `base44/functions/preDiagnosis/entry.ts`, `base44/functions/processHealthInput/entry.ts`, `base44/functions/weeklyInsightGenerate/entry.ts`, `base44/functions/analyzeGrowthPhoto/entry.ts`.

Note: CGC dead-code analysis flags these as "potentially unused" — they ARE used within the same function body.

**`validateImageUrl` in 4 backend files** (`analyzeGrowthPhoto`, `finalDiagnosis`, `preDiagnosis`, `processHealthInput`) — validates URL hostname against allowlist to prevent SSRF.

## Logging

**Framework:** `console.error` for errors, `console.warn` for recoverable failures, `console.debug` for analytics

**Analytics (`src/utils/analytics.js`):**
- `trackEvent(eventName, properties)` — stores last 100 events in `localStorage` with 30-day TTL
- No third-party service (marked as temporary in file header)

**When to use which:**
- `console.error` — unexpected exceptions, unrecoverable states
- `console.warn` — expected failures that are handled (badge check fails, schema field missing)
- `trackEvent` — business events: `"onboarding_complete"`, `"daily_limit_reached"`

## Animation Conventions

**Library:** Framer Motion v11 — `motion.div`, `motion.button`, `AnimatePresence`

**Shared presets in `src/lib/animations.js`:**
- `spring` — `{ type: "spring", stiffness: 360, damping: 28 }` — default for UI transitions
- `springGentle` — `{ stiffness: 120, damping: 20 }` — messages, slide-ins
- `springSnappy` — `{ stiffness: 300, damping: 25 }` — expand/collapse
- `tapScale` — `{ whileTap: { scale: 0.97 } }` — card press feedback
- `pressIn` — `{ whileTap: { scale: 0.95, opacity: 0.82 } }` — CTA buttons
- `fadeInUp` — `{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }` — entrances
- `staggerContainer` / `staggerItem` — 80ms stagger for lists

**Horizontal tab slide (used in Activite, Sante, Nutri):**
```javascript
const tabVariants = {
  enter: (d) => ({ opacity: 0, x: d * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d) => ({ opacity: 0, x: d * -60 }),
};
```

**Accessibility (always implement):**
- `const prefersReducedMotion = useReducedMotion();` in page components that animate on mount
- `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in non-React utils
- `useCountUp` (`src/hooks/useCountUp.js`) snaps to final value immediately when motion is reduced

## CSS / Styling Conventions

**Primary:** Tailwind CSS v3 utility classes with `cn()` helper from `src/lib/utils.js`

```javascript
import { cn } from "@/lib/utils";
className={cn("base-class", condition && "conditional-class")}
```

**CSS variables (via `src/index.css`):**
- `hsl(var(--background))` — cream `HSL(37,33%,95%)`
- `hsl(var(--primary))` — forest `#1A4D3E`
- `hsl(var(--ring))` — emerald `#2D9F82`
- Custom tokens: `--safe`, `--caution`, `--toxic` for food safety indicators

**Color rules (never break these):**
- No orange, no teal, no yellow
- Amber (`text-amber-600`, `bg-amber-50`) is reserved for warnings only
- Do not modify `src/index.css` color variables
- Hard-coded brand colors only in `ErrorBoundary.jsx` and inline styles: `#1A4D3E` (forest), `#2D9F82` (emerald)

**Never modify:** `src/components/ui/` — contains shadcn/ui components. Any visual change to them must be done via Tailwind variants or wrapper components.

## Component Design

**Structure pattern (functional components):**
```jsx
// 1. Imports (React, third-party, @/ aliases, relative, lucide)
// 2. Constants/config outside component (TABS, MILESTONES, etc.)
// 3. Helper functions outside component (pure, no hooks)
// 4. export default function ComponentName({ prop1, prop2 = defaultValue }) {
// 5.   Hooks from context (useAuth, useHomeCache)
// 6.   State declarations (useState)
// 7.   Refs (useRef)
// 8.   Memoized computed values (useMemo)
// 9.   useEffect hooks
// 10.  Handler functions (handle* prefix)
// 11.  Guard: if (loading) return <SkeletonPage />;
// 12.  return JSX
// }
```

**Props defaults:** Destructured with defaults — `{ dogs = [], onSubmit, loading = false }`

**Context pattern:**
```jsx
const MyContext = createContext(null);
export function MyProvider({ children }) { ... }
export function useMyHook() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error("useMyHook must be used within MyProvider");
  return ctx;
}
```

**Pure utility modules (no React, no side effects):**
- `src/utils/healthStatus.js` — health score calculations, WSAVA vaccine logic
- `src/utils/dateHelpers.js` — date formatting and arithmetic
- `src/utils/premium.js` — premium/trial status checks
- All exported functions have `/** JSDoc */` doc comments

## Module Design

**Exports:**
- `export default function` for React components (one component per file)
- Named exports for utilities — `export function getAge()`, `export const VACCINE_REFERENCE`
- Context files export both: Provider + hook — `AuthProvider` + `useAuth`

**Barrel files:** Not used — always import from specific file path.

## CGC Complexity Hotspots

Functions exceeding cyclomatic complexity threshold 10:

| Function | Complexity | File |
|----------|-----------|------|
| `buildHealthSummaryHTML` | 28 | `base44/functions/vetAccess/entry.ts:13` |
| `getAge` | 17 | `base44/functions/pawcoachChat/entry.ts:438` |
| `getAge` | 17 | `base44/functions/weeklyInsightGenerate/entry.ts:205` |
| `formatDateFr` | 11 | `base44/functions/pawcoachChat/entry.ts:129` |

Frontend large files (potential complexity hotspots by line count):
- `src/pages/Training.jsx` — 817 lines
- `src/pages/Nutri.jsx` — 743 lines (uses grouped state pattern to manage complexity)
- `src/components/nutrition/NutritionMealPlan.jsx` — 726 lines
- `src/pages/Home.jsx` — 694 lines
- `src/utils/healthStatus.js` — 655 lines (acceptable — pure logic module)

## Known Duplication (CGC findings)

**`getWeekStart` defined twice:**
- Canonical: `src/utils/dateHelpers.js:29` (Monday-based, correct)
- Duplicate: `src/utils/recommendations.js:12` (should import from `dateHelpers`)

**`sanitize` inline in 10 backend files** — isolation constraint (Deno functions have no shared imports).

**`validateImageUrl` in 4 backend files** — same isolation constraint.

**`getAge` duplicated in 2 backend files** — `pawcoachChat/entry.ts:438` and `weeklyInsightGenerate/entry.ts:205`.

---

*Convention analysis: 2026-03-27*
