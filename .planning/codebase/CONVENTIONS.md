# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` — `ErrorBoundary.jsx`, `WeeklyInsightCard.jsx`
- Pages: PascalCase `.jsx` — `Home.jsx`, `Chat.jsx`, `Training.jsx`
- Utilities: camelCase `.js` — `dateHelpers.js`, `healthStatus.js`, `pdfHelpers.js`
- Hooks: camelCase `.js` starting with `use` — `useActionCredits.js`, `useBackClose.js`
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
- Ref variables: `Ref` suffix — `bottomRef`, `consumingRef`, `pushed`

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
1. React/external libraries — `import { useState, useEffect } from "react"`
2. Third-party packages — `import { motion } from "framer-motion"`, `import { toast } from "sonner"`
3. Internal `@/` aliases — `import { base44 } from "@/api/base44Client"`, `import { isUserPremium } from "@/utils/premium"`
4. Relative component imports — `import BottomNav from "../components/BottomNav"`
5. Lucide icons at end of group — `import { Flame, ScanLine } from "lucide-react"`

**Path Aliases:**
- `@/` resolves to `./src/` (configured in `jsconfig.json` and Vite)
- Always use `@/` for cross-directory imports; relative paths only for same-directory siblings

**Backend (Deno):**
- Single npm import: `import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20'`
- No other imports — all logic is self-contained in each `entry.ts`

## Error Handling

**Frontend patterns:**
- `try/catch` in async `useEffect` — most common pattern across all pages
- `.catch(() => [])` for non-critical parallel queries in `Promise.all` — used in `src/pages/Home.jsx` `fetchDogData`
- `.catch(() => {})` for fire-and-forget side effects (badge checks, streak updates)
- `toast.error("Message en français.")` for user-facing errors via `sonner`
- `console.error` for unexpected errors, `console.warn` for recoverable/expected failures
- `ErrorBoundary` class component wraps every page route in `src/App.jsx`

**Error Boundary (`src/components/ErrorBoundary.jsx`):**
- Class component with retry (max 2 attempts) + reload + home fallback
- Logs to `console.error('[PawCoach] Erreur capturée par ErrorBoundary :', error)`
- Custom `fallback` prop accepted for page-specific error UI
- Every route in `src/App.jsx` is wrapped: `<ErrorBoundary><Page /></ErrorBoundary>`

**Backend (Deno) patterns:**
- Top-level `try/catch` wrapping all handler logic
- Early returns with `Response.json({ error: '...' }, { status: NNN })` for validation failures
- Auth check always first: `if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })`
- Ownership check after entity fetch: `if (dog.owner !== user.email) return ... { status: 403 }`

## Sanitization Patterns

**Backend `sanitize` helper (defined inline in 10 backend files):**
```typescript
const sanitize = (s: any, max = 500) => String(s || '').substring(0, max).replace(/[<>]/g, '');
```
Present in: `base44/functions/pawcoachChat/entry.ts`, `base44/functions/dailyCheckinProcess/entry.ts`, `base44/functions/finalDiagnosis/entry.ts`, `base44/functions/generateDiagnosisPDF/entry.ts`, `base44/functions/generateTrainingProgram/entry.ts`, `base44/functions/parseHealthFile/entry.ts`, `base44/functions/preDiagnosis/entry.ts`, `base44/functions/processHealthInput/entry.ts`, `base44/functions/weeklyInsightGenerate/entry.ts`, `base44/functions/analyzeGrowthPhoto/entry.ts`.

Note: CGC dead-code analysis flags these as "potentially unused" — they ARE used within the same function body. CGC cannot resolve internal call sites of inline-defined functions.

**Frontend `sanitize` (PDF-specific, `src/utils/pdfHelpers.js:26`):**
- Converts accented French characters to ASCII for jsPDF helvetica font compatibility

**Frontend `sanitizeName` (`src/components/dogprofile/DogEditModal.jsx:18`):**
- Strips special chars from dog names before save

**`validateImageUrl` (duplicated in 4 backend files):**
- Present in: `analyzeGrowthPhoto`, `finalDiagnosis`, `preDiagnosis`, `processHealthInput`
- Validates URL hostname against allowlist `['base44.app', 'amazonaws.com', 's3.amazonaws.com']`
- Prevents SSRF on AI image analysis endpoints

## Data Fetching Patterns

**Entity access (frontend):**
- Always via `src/api/entities.js` wrappers, never `base44.entities.*` directly
- Pattern: `Entity.filter({ field: value }, "-sort_field", limit).catch(() => [])`
- Filtered queries only — never `.list()` global fetch
- Parallel fetches with `Promise.all` in page-level async helper functions

**Backend function calls (frontend):**
```javascript
const resp = await base44.functions.invoke("functionName", { payload });
```
Used for AI operations: `pawcoachChat`, `generateTrainingProgram`, `processHealthInput`, `preDiagnosis`, `finalDiagnosis`, `analyzeGrowthPhoto`, `parseHealthFile`, `vetAccess`, `stripePortal`, `deleteUser`.

**Auth:**
```javascript
const user = await base44.auth.me();
await base44.auth.updateMe({ field: value });
```

**Home cache (2-minute TTL, `src/lib/HomeCacheContext.jsx`):**
- In-memory `useRef` cache, invalidated on active dog change
- Used only on `src/pages/Home.jsx` to avoid redundant full-page refetches

## Logging

**Framework:** `console.debug` for analytics, `console.error` for errors, `console.warn` for recoverable failures

**Analytics (`src/utils/analytics.js`):**
- `trackEvent(eventName, properties)` — stores last 100 events in `localStorage` with 30-day TTL
- Also calls `console.debug("[Analytics]", ...)` for dev inspection
- No third-party service — explicitly marked as temporary implementation in the file header

**When to use which:**
- `console.error` — unexpected exceptions, unrecoverable states
- `console.warn` — expected failures that are handled (e.g. schema field missing, badge check fails)
- `trackEvent` — business events: `"onboarding_complete"`, `"daily_limit_reached"`

## Component Design

**Structure pattern (functional components):**
```jsx
// 1. Imports
// 2. Constants/config outside component
// 3. export default function ComponentName({ prop1, prop2 = defaultValue }) {
// 4.   State declarations
// 5.   Refs
// 6.   useEffect hooks
// 7.   Handler functions
// 8.   return JSX
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
- `src/utils/pdfHelpers.js` — PDF layout helpers
- All exported functions have `/** JSDoc */` doc comments

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

**Accessibility (always implement):**
- Use `useReducedMotion()` from Framer Motion in pages that animate on mount
- Or `window.matchMedia('(prefers-reduced-motion: reduce)').matches` check in non-React utils
- `useCountUp` (in `src/hooks/useCountUp.js`) snaps to final value immediately when motion is reduced

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

**Hard-coded brand colors (acceptable in ErrorBoundary and inline styles only):**
- `#1A4D3E` — forest green (primary)
- `#2D9F82` — emerald (CTA, success)
- `hsl(37, 33%, 95%)` — cream background

**Tailwind custom tokens (`tailwind.config.js`):**
- `safe`, `caution`, `toxic` color tokens
- `radius` variable-based: `lg`, `md`, `sm`, `xl`, `2xl`
- Font: Inter → system font fallback stack

**Color rules (never break these):**
- No orange, no teal, no yellow
- Amber (`text-amber-600`, `bg-amber-50`) is reserved for warnings only
- Do not modify `src/index.css` color variables

## Module Design

**Exports:**
- `export default function` for React components (one component per file)
- Named exports for utilities — `export function getAge()`, `export const VACCINE_REFERENCE`
- Context files export both: Provider component + hook — `AuthProvider` + `useAuth`

**Barrel files:** Not used — always import from specific file path

## CGC Complexity Hotspots

Functions exceeding complexity threshold 10 (CGC `analyze complexity`):

| Function | Complexity | File |
|----------|-----------|------|
| `buildHealthSummaryHTML` | 28 | `base44/functions/vetAccess/entry.ts:13` |
| `getAge` | 17 | `base44/functions/pawcoachChat/entry.ts:438` |
| `getAge` | 17 | `base44/functions/weeklyInsightGenerate/entry.ts:205` |
| `formatDateFr` | 11 | `base44/functions/pawcoachChat/entry.ts:129` |

Frontend large files (potential complexity hotspots by line count):
- `src/pages/Training.jsx` — 817 lines
- `src/pages/Nutri.jsx` — 743 lines
- `src/components/nutrition/NutritionMealPlan.jsx` — 726 lines
- `src/pages/Home.jsx` — 694 lines
- `src/components/notebook/SmartHealthAssistant.jsx` — 670 lines
- `src/utils/healthStatus.js` — 655 lines (acceptable — pure logic module)

## Known Duplication (CGC dead-code + grep findings)

**`getWeekStart` defined twice:**
- Canonical: `src/utils/dateHelpers.js:29` (Monday-based, correct)
- Duplicate: `src/utils/recommendations.js:12` (should import from `dateHelpers`)

**`sanitize` inline in 10 backend files** — isolation constraint (Deno functions have no shared imports).

**`validateImageUrl` in 4 backend files** — same isolation constraint.

**`getAge` duplicated in 2 backend files** — `pawcoachChat/entry.ts:438` and `weeklyInsightGenerate/entry.ts:205`.

---

*Convention analysis: 2026-03-27*
