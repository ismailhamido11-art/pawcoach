# PawCoach — Code Conventions
> Patterns observed in actual code (not guidelines). Last updated: 2026-03-26.

---

## 1. Code Style

### Formatting
- **No Prettier config** — formatting is not enforced by a formatter. ESLint handles quality rules only.
- **Indentation**: 2 spaces (JSX and JS).
- **Quotes**: double quotes in JSX attributes (`className="..."`), single quotes are rare. String literals in JS use both, no consistent rule.
- **Semicolons**: present in all files observed.
- **Trailing commas**: present in object/array literals.
- **Line length**: no enforced limit. Long lines are common in page files (inline logic, one-liners with `&&`).

### Language
- **JavaScript (JSX)** for all frontend components and pages — no `.tsx` files.
- **TypeScript** for backend Deno functions (`entry.ts`) and for `src/utils/index.ts`.
- `jsconfig.json` is used for path aliases and light type checking (`checkJs: true`), but TypeScript is not enforced on `.jsx` files.

---

## 2. Naming Conventions

### Files
- **Pages**: `PascalCase.jsx` — `Home.jsx`, `Sante.jsx`, `DogProfile.jsx`
- **Components**: `PascalCase.jsx` — `DailyBriefing.jsx`, `SkeletonPage.jsx`
- **Hooks**: `camelCase.js/.jsx` — `useBackClose.jsx`, `useCountUp.js`, `useReducedMotion.js`
- **Utils**: `camelCase.js/.ts` — `premium.js`, `healthStatus.js`, `dateHelpers.js`
- **Backend functions**: directory named in `camelCase`, file always `entry.ts` — `pawcoachChat/entry.ts`, `stripeWebhook/entry.ts`
- **Lib files**: `camelCase.js` — `animations.js`, `lottieLibrary.js`

### Components & Variables
- **React components**: `PascalCase` function names, `default export`
- **Local constants**: `SCREAMING_SNAKE_CASE` for config arrays and lookup objects at module level — `TABS`, `MILESTONES`, `MISSION_CONFIG`, `PREMIUM_CONFIGS`, `ACTIONS`
- **State variables**: `camelCase` — `todayCheckin`, `showPremiumNudge`, `isAssistantOpen`
- **Event handlers**: `handle` prefix — `handleSave`, `handleMoodTap`, `handleMissionTap`, `handleTabClick`
- **Load functions**: typically named `load` (inline async in `useEffect`) or `fetchDogData` for module-level extractors
- **Boolean state**: `is`/`show`/`has` prefixes — `isPremium`, `showShareModal`, `hasWalk`
- **Unused params**: prefixed with `_` to suppress ESLint warnings — `_context`, `_user`, `_e`

### CSS Classes
- Pure Tailwind utility classes — no CSS Modules, no styled-components.
- Hardcoded color values still appear in older components (`bg-[#1A4D3E]`, `text-[#2D9F82]`) alongside design token classes (`text-primary`, `bg-accent`).
- Class string construction with template literals for conditional logic: `` `text-${active ? "primary" : "muted-foreground"}` ``
- `cn()` utility from `@/lib/utils` used when combining conditional classes (shadcn pattern).

---

## 3. Import Patterns

### Order (observed pattern, not enforced)
1. React hooks and built-ins
2. React Router
3. App utilities (`@/utils`, `@/api/base44Client`, `@/utils/premium`)
4. Components (own-domain first, then cross-domain)
5. Lucide icons
6. Framer Motion
7. Toaster (`sonner`)
8. shadcn/ui components (rare in pages — mostly inside sub-components)

### Aliases
- `@/` maps to `./src/` (defined in `jsconfig.json` and Vite config via `@base44/vite-plugin`).
- Both `@/` imports and relative imports (`../components/BottomNav`) are used — **no consistent standard**. Relative imports are more common in older/page-level code; `@/` is preferred in newer components.

---

## 4. Component Patterns

### Structure
All components are **functional components** with `default export`. No class components except `ErrorBoundary.jsx` (required by React API for `componentDidCatch`).

```jsx
export default function ComponentName({ prop1, prop2, optionalProp = defaultValue }) {
  // hooks
  // derived state / memos
  // handlers
  // return JSX
}
```

### Props
- Props are **not typed** (PropTypes disabled via ESLint rule `"react/prop-types": "off"`).
- Default values set directly in destructuring: `{ dog, user: _user, records = [], isPremium, loading }`.
- No prop spreading (`{...props}`) pattern observed.

### Constants above component
Config arrays and lookup objects are defined at module level above the component:
```jsx
const TABS = [...];
const MISSION_CONFIG = {...};

export default function MyComponent(...) { ... }
```

### Named exports alongside default
Some utility components export both:
```jsx
export default function MainComponent() { ... }
export { ILLUSTRATIONS }; // named export for constants
export { Bone, SkeletonCard }; // named exports for sub-components
```

---

## 5. Hook Patterns

### Custom hooks
- Naming: `use` prefix + `PascalCase` noun — `useBackClose`, `useCountUp`, `useReducedMotion`, `useActionCredits`
- Location: `src/hooks/` for app-wide hooks; `src/components/hooks/` for component-local hooks (only `useBackClose.jsx` there)
- Pattern: thin wrappers around browser APIs or state logic, return a single value or void

### `useReducedMotion`
The custom hook at `src/hooks/useReducedMotion.js` **always returns `false`** (stub). The Framer Motion `useReducedMotion()` import from `framer-motion` is used in more critical components (SkeletonPage, EmptyState, PawLoader, pages). Both coexist.

### Data fetching
Not a custom hook — data loading is done inside `useEffect` directly in page components:
```jsx
useEffect(() => {
  const load = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      // ...
    } catch (err) {
      toast.error("...");
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

Parallel fetches use `Promise.all` via a top-level async function (`fetchDogData`) called inside `useEffect`.

---

## 6. CSS / Styling Patterns

### Stack
- **Tailwind CSS v3** — utility classes only.
- **CSS variables** in `src/index.css` for the design system (`--primary`, `--accent`, `--background`, `--card`, etc.).
- **No CSS Modules**, no inline `<style>` tags.
- **Tailwind config** extends colors with HSL variables, border radius with `var(--radius)`, and font with Inter.

### Design tokens (preferred)
```jsx
className="bg-primary text-primary-foreground"
className="bg-card border-border text-muted-foreground"
className="bg-accent/10 text-accent"
```

### Hardcoded values (legacy, avoid)
Some components use hardcoded hex values directly:
```jsx
style={{ background: "linear-gradient(135deg, #1A4D3E 0%, #2D9F82 100%)" }}
className="bg-[#1A4D3E] text-[#2D9F82]"
```

### Safe area / mobile
```jsx
style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}
className="safe-pt-14"  // custom utility defined in index.css
```

### Common class combos
- Cards: `rounded-3xl border border-border/50 bg-card p-4 shadow-sm`
- Buttons (primary): `bg-accent text-white rounded-xl px-5 py-2.5 font-semibold`
- Bottom sheets: `fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl`
- Gradients (header): `bg-gradient-to-br from-primary via-primary/95 to-emerald-700`

---

## 7. Error Handling Patterns

### Frontend
- `try/catch` inside async `load` functions within `useEffect`.
- Errors are surfaced via `toast.error("...")` from `sonner` (user-visible).
- `console.error(...)` for internal logging.
- Graceful `.catch(() => [])` on non-critical parallel fetches:
  ```jsx
  base44.entities.DiagnosisReport.filter(...).catch(() => []),
  ```
- `ErrorBoundary` component wraps pages in `Layout.jsx` to catch React render errors. Uses a PawCoach-styled fallback UI with "Réessayer" / "Retour à l'accueil" buttons.

### Backend (Deno functions)
- Outer `try/catch` wrapping the entire handler body.
- Early return with `Response.json({ error: '...' }, { status: 4xx })` for validation failures.
- `console.error(...)` for logging (visible in Base44 function logs).
- Final catch returns `Response.json({ error: error?.message || String(error) }, { status: 500 })`.
- Non-critical operations use `.catch(() => [])`.

---

## 8. Animation Patterns

### Library
**Framer Motion v11** is the sole animation library. CSS `transition-*` classes are used only for simple color/opacity state changes (hover, active).

### Central presets — `src/lib/animations.js`
```js
spring          // stiffness: 360, damping: 28 — default for most transitions
springGentle    // stiffness: 120, damping: 20 — messages, slide-ins
springSnappy    // stiffness: 300, damping: 25 — expand/collapse
tapScale        // whileTap: scale 0.97 — cards and list items
pressIn         // whileTap: scale 0.95, opacity 0.82 — CTA buttons
hoverGlow       // whileHover: y -2, forest-green shadow — desktop hover
fadeInUp        // opacity 0→1, y 20→0
fadeIn          // opacity 0→1, duration 0.24
staggerContainer + staggerItem  // stagger children by 0.08s
```

### `useReducedMotion` usage
Both `useReducedMotion()` from Framer Motion (reliable) and the stub from `src/hooks/useReducedMotion.js` are used. Critical components use the Framer Motion import directly.

### Timing guidelines (from CLAUDE.md)
- Micro-interactions: 0.1–0.15s
- Content entrances (fadeIn): 0.2–0.35s ease-out
- Springs: stiffness 300–400, damping 25–30
- Stagger between items: 0.04–0.08s
- **Max 0.4s** for any animation (except looping Lottie)

### Common patterns in JSX
```jsx
// Page entrance
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}>

// Bottom sheet (Vaul alternative using Framer directly)
<motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}>

// Staggered list items
<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.1 + i * 0.05 }}>

// Conditional rendering with AnimatePresence
<AnimatePresence>
  {visible && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
```

### Lottie
`@lottiefiles/dotlottie-react` — used via `LottieAnimation` wrapper in `src/components/ui/LottieAnimation.jsx`. URLs stored in `src/lib/lottieLibrary.js` (CDN). Respects `prefers-reduced-motion` (loop/autoplay disabled).

---

## 9. Common UI Patterns

### Loading state
1. `SkeletonPage` component with `variant` prop: `"list"`, `"stats"`, `"detail"`, `"chat"`.
2. `PawLoader` component for full-screen loading (initial app load).
3. Pattern: `if (loading) return <SkeletonPage variant="list" />;` at top of render.

### Empty state
`EmptyState` component from `@/components/ui/EmptyState`. Props:
```jsx
<EmptyState
  mascot="curious"          // SVG mascot from PawIllustrations
  illustration="walking"    // or Storyset SVG name
  lottieSrc={url}           // or Lottie URL
  title="Aucun résultat"
  description="..."
  actionLabel="Ajouter"
  onAction={handler}
/>
```
Hierarchy: Lottie > illustration (Storyset) > mascot (PawIllustrations) > Lucide icon.

### Modals / bottom sheets
Pattern: `visible` prop + `AnimatePresence` + Framer Motion slide from bottom.
```jsx
<AnimatePresence>
  {visible && (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl"
        style={{ paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
```
Back-button close via `useBackClose(visible, onClose)` hook (pushes history state on open, listens for popstate).

### Tabs with URL persistence
Standard pattern across Sante, Activite, Nutri:
1. Read `urlTab` from `useSearchParams()`
2. Priority: URL param > `sessionStorage` > default
3. `changeTab` = write to sessionStorage + `setSearchParams`
4. Track `prevTabIdx` ref for slide direction
5. `tabVariants` with `custom` direction for `AnimatePresence`

### Toast notifications
`sonner` library: `toast.error("...")`, `toast.success("...")`. Called directly in event handlers and `catch` blocks.

### Cards
```jsx
<div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm">
```
Elevation hierarchy: `shadow-sm` > `shadow-md` > `shadow-lg` > `shadow-2xl` (for modals).

---

## 10. Backend Function Patterns (Deno)

### Structure
Every function is a single file `entry.ts` in its own directory under `base44/functions/`.

```ts
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // 1. Auth check (user-facing functions)
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Input validation / early returns
    const { dogId } = await req.json();
    if (!dogId) return Response.json({ error: 'dogId required' }, { status: 400 });

    // 3. Business logic
    // ...

    // 4. Success response
    return Response.json({ ok: true, data: result });

  } catch (error) {
    console.error("Function error:", error);
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
```

### Auth patterns
- User-facing: `base44.auth.me()` — authenticated as the calling user.
- Service/admin operations: `base44.asServiceRole.entities.X` — bypasses row-level security.
- Scheduled/cron functions use `asServiceRole` throughout (no user context).

### External dependencies
Third-party packages imported with `npm:` specifier:
```ts
import Stripe from 'npm:stripe@17.3.1';
import { OpenAI } from 'npm:openai@4.x';
```

### Environment variables
```ts
const apiKey = Deno.env.get("OPENROUTER_API_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
```

### Security patterns
- Input sanitization via `sanitize(s, max)` helper for LLM prompts.
- URL validation against allowlist before external fetch (SSRF prevention).
- Message history sliced to last 20 messages, content truncated to 2000 chars.
- Server-side quota checks (not relying on frontend state).

### Response format
- Success: `Response.json({ ok: true, ...data })`
- Error: `Response.json({ error: 'message' }, { status: 4xx/5xx })`
- Webhook receipt: `Response.json({ received: true })`
