# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- Pages: PascalCase, single word or compound (`Home.jsx`, `DogProfile.jsx`, `LabelScanMode.jsx`)
- Components: PascalCase, grouped by feature subdirectory (`home/DailyBriefing.jsx`, `notebook/SectionVaccins.jsx`)
- Hooks: camelCase with `use` prefix (`useActionCredits.js`, `useBackClose.js`, `useReducedMotion.js`)
- Utils: camelCase (`dateHelpers.js`, `programHelpers.js`, `chartHelpers.jsx`)
- Lib files: camelCase (`animations.js`, `utils.js`, `markdown.js`)
- Extension rule: `.jsx` for files with JSX, `.js` for pure logic, `.ts` for typed utilities

**Functions/Exports:**
- Component functions: PascalCase, default export (`export default function Home()`)
- Helper functions: camelCase, named exports (`export function fmtDate()`, `export function getAge()`)
- Constants: UPPER_SNAKE_CASE (`MILESTONES`, `EXERCISES`, `JOURS_COURTS`, `MOIS_FR`)
- Config objects: UPPER_SNAKE_CASE (`TABS`, `SOURCE_LABELS`, `VERDICT_CONFIG`, `ACTIVITY_ICONS`)

**Variables:**
- State variables: camelCase noun/noun-phrase (`loading`, `submitting`, `showPremiumNudge`)
- Boolean state: prefixed with `show`, `is`, `has` (`showAddForm`, `saving`, `hasCredits`)
- Refs: suffixed with `Ref` (`consumingRef`, `pushed`, `dailyBriefingRef`, `scrollTimeoutRef`)
- Event handlers: prefixed with `handle` (`handleSave`, `handleDelete`, `handleCheckin`)

## Code Style

**Formatting:**
- No Prettier config present — formatting not enforced tooling-side
- 2-space indentation (consistent throughout codebase)
- Trailing commas in objects and arrays
- Single quotes for strings

**Linting:**
- ESLint with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-unused-imports`
- Config: `eslint.config.js`
- Scope: `src/components/**`, `src/pages/**`, `src/Layout.jsx`
- Excluded: `src/lib/**`, `src/components/ui/**` (shadcn)
- Key rules: `unused-imports/no-unused-imports: error`, `react-hooks/rules-of-hooks: error`
- PropTypes: disabled (`react/prop-types: off`)
- Unused vars prefixed with `_` are allowed

## Import Organization

**Order (observed pattern):**
1. React core (`import { useState, useEffect, useRef } from "react"`)
2. Router (`import { useNavigate } from "react-router-dom"`)
3. Internal utils/lib (`import { createPageUrl, getActiveDog } from "@/utils"`)
4. API/entities (`import { Dog, HealthRecord } from "@/api/entities"`)
5. Shared hooks (`import { useActionCredits } from "@/hooks/useActionCredits"`)
6. Shared utils (`import { fmtDate } from "@/utils/dateHelpers"`)
7. Layout/navigation components (`import BottomNav from "../components/BottomNav"`)
8. Feature components (grouped by section)
9. UI primitives (`import { Button } from "@/components/ui/button"`)
10. Icons (`import { Flame, Lock } from "lucide-react"`)
11. Animation (`import { motion, AnimatePresence } from "framer-motion"`)
12. Third-party misc (`import { toast } from "sonner"`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `jsconfig.json`)
- Use `@/` for cross-directory imports, relative `../` only within same feature cluster

## State Management

**Consolidated state objects (v5.0 pattern):**
Group related state into a single `useState` object rather than individual booleans. Example from `Home.jsx`:
```jsx
// GOOD — consolidated group
const [dogData, setDogData] = useState({
  todayCheckin: null,
  streak: null,
  recentCheckins: [],
  records: [],
  exercises: [],
});

// Then destructure for consumption in render:
const { todayCheckin, streak, recentCheckins } = dogData;
```

**Form state:**
Always use a single `form` state object:
```jsx
const [form, setForm] = useState({
  name: dog.name || "",
  breed: dog.breed || "",
  birth_date: dog.birth_date || "",
});
// Update one field:
setForm(f => ({ ...f, [field]: e.target.value }));
```

**Async operation state:**
Use `saving`/`submitting`/`loading` boolean, always reset in `finally`:
```jsx
const [saving, setSaving] = useState(false);
const handleSave = async () => {
  setSaving(true);
  try { ... }
  catch (e) { toast.error("..."); }
  finally { setSaving(false); }
};
```

**Optimistic updates:**
Apply state immediately before async call, roll back on error:
```jsx
// Apply optimistically
setDogData(prev => ({ ...prev, todayCheckin: optimisticCheckin }));
try {
  const result = await api.call();
  setDogData(prev => ({ ...prev, todayCheckin: result.checkin }));
} catch {
  setDogData(prev => ({ ...prev, todayCheckin: null })); // rollback
}
```

## Error Handling

**Strategy:**
- `try/catch/finally` for all async operations
- Show `toast.error("Message in French. Réessaie.")` — always include a retry hint
- Catch errors silently with `.catch(() => [])` when default fallback is safe (entity filters in parallel loads)
- Class component `ErrorBoundary` wraps every page route in `App.jsx`
- `mounted` flag pattern to prevent state updates after unmount:
```jsx
useEffect(() => {
  let mounted = true;
  async function load() {
    const data = await fetch();
    if (!mounted) return;
    setState(data);
  }
  load();
  return () => { mounted = false; };
}, []);
```

**User feedback:**
- Success: `toast.success("Message court en français !")`
- Error: `toast.error("Impossible de [action]. Réessaie.")` — always includes "Réessaie" or similar
- No `window.alert()` / `window.confirm()` — replaced by `AlertDialog` (v5.0)

## AlertDialog Pattern (v5.0 — replaces window.confirm)

Used for all destructive confirmations. Pattern from `Library.jsx` and `AITrainingProgram.jsx`:
```jsx
const [confirmDialog, setConfirmDialog] = useState(null);

// Trigger:
const handleDelete = (id) => {
  setConfirmDialog({
    title: "Supprimer ce conseil ?",
    description: "Ce conseil sera retiré de ta bibliothèque définitivement.",
    action: async () => {
      await Entity.delete(id);
      setState(prev => prev.filter(item => item.id !== id));
      toast.success("Supprimé");
    },
  });
};

// Render:
{confirmDialog && (
  <AlertDialog open onOpenChange={() => setConfirmDialog(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
        <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={confirmDialog.action}>Supprimer</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```
Files using this pattern: `src/pages/Library.jsx`, `src/components/activite/AITrainingProgram.jsx`, `src/components/nutrition/NutritionMealPlan.jsx`

## Double-click / Double-call Guard (consumingRef pattern)

Prevents duplicate API calls from rapid taps. Implemented in `src/hooks/useActionCredits.js`:
```js
const consumingRef = useRef(false);

const consume = async () => {
  if (consumingRef.current) return false; // guard
  consumingRef.current = true;
  try {
    const newRemaining = await consumeActionCredit(credits);
    setCredits(newRemaining);
    return true;
  } finally {
    consumingRef.current = false;
  }
};
```
Use this pattern whenever an action must fire exactly once per user intent, especially for AI credit operations.

## clearTimeout Cleanup Pattern

All `setTimeout` calls inside `useEffect` must return a cleanup:
```jsx
useEffect(() => {
  const timer = setTimeout(() => setDismissed(true), 2800);
  return () => clearTimeout(timer);
}, [someCondition]);
```
Files demonstrating this: `src/components/home/FirstDayGuide.jsx`, `src/components/sante/NotebookContent.jsx`.
Note: bare `setTimeout(() => setState(x), N)` without cleanup is tolerated only when the component is long-lived (e.g., one-shot milestone animations in `Home.jsx`).

## Lazy Loading Pattern

Heavy components loaded with `React.lazy` + `Suspense` with `SkeletonPage` fallback:
```jsx
const AITrainingProgram = lazy(() => import("@/components/activite/AITrainingProgram"));

// In render:
<Suspense fallback={<SkeletonPage variant="list" />}>
  <AITrainingProgram ... />
</Suspense>
```
Candidates: heavy map components (`WalkMap`, `NearbyParks`), AI-heavy tabs (`FindVetContent`), all pages in `pages.config.js`.
Files: `src/pages.config.js` (all page-level lazy imports), `src/pages/Activite.jsx`, `src/pages/Sante.jsx`, `src/components/tracker/WalkMode.jsx`.

## Animation Conventions

**Source of truth:** `src/lib/animations.js`

Use exported presets; do not define inline spring configs:
```jsx
import { spring, tapScale, fadeInUp, springSnappy, staggerContainer, staggerItem } from "@/lib/animations";

// Tap feedback on cards:
<motion.div {...tapScale}>

// Spring for bottom sheets:
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Always respect prefers-reduced-motion:
const prefersReducedMotion = useReducedMotion(); // from framer-motion
initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
```

Spring presets:
- `spring` — stiffness 360, damping 28 — default for most UI transitions
- `springGentle` — stiffness 120, damping 20 — message animations, slide-ins
- `springSnappy` — stiffness 300, damping 25 — expand/collapse, form reveals
- Bottom sheets: stiffness 300, damping 30 (inline)

**Stagger pattern:**
```jsx
<motion.div {...staggerContainer} initial="hidden" animate="show">
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>...</motion.div>
  ))}
</motion.div>
```

## Component Design Patterns

**Bottom sheet modals:**
- Fixed inset-0, items-end, bg-black/50 backdrop-blur-sm overlay
- Inner panel: `rounded-t-3xl`, spring transition `y: "100%" → 0`
- Drag handle: `w-10 h-1 bg-muted rounded-full` centered at top
- Max height: `max-h-[85vh] overflow-y-auto`
- Click-outside to close: outer `onClick={onClose}`, inner `onClick={e => e.stopPropagation()}`

**Loading spinners (inline):**
```jsx
<div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
```

**Empty states:**
Use `<EmptyState>` from `src/components/ui/EmptyState.jsx` — never inline empty state markup:
```jsx
<EmptyState
  mascot="curious"         // one of 20 PawMascot variants
  title="Titre court"
  description="Description explicative."
  actionLabel="CTA label"
  onAction={() => setShowAddForm(true)}
/>
```

**Skeleton loading:**
Use `<SkeletonPage>` from `src/components/ui/SkeletonPage.jsx`:
```jsx
if (loading) return <SkeletonPage variant="stats" currentPage="Home" />;
```
Variants: `"stats"`, `"list"`, `"detail"`, `"chat"`.

**Inline expand/collapse forms:**
Pattern used in `SectionVaccins.jsx` and `SectionPoids.jsx`:
```jsx
<AnimatePresence>
  {showAddForm && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      {/* form content */}
    </motion.div>
  )}
</AnimatePresence>
```

## Logging

- `console.error(e)` for caught errors in handlers
- `console.warn("message:", e)` for non-critical failures (e.g., background refreshes)
- No custom logger — raw console only
- Production errors visible in browser console only

## Comments

**When to add:**
- File-level JSDoc comment with purpose (`/** dateHelpers.js — Shared date... */`)
- JSDoc for exported utility functions (parameter types, return value, usage example)
- Inline comments on non-obvious logic (e.g., DST handling, cache strategy)
- Section separators with `// ─── Section Name ─────` style dashes for long files

**Do not comment:**
- Obvious logic
- Disabled code — delete it, do not comment it out

## Module Design

**Exports:**
- One default export per component file (the component)
- Named exports for utilities, constants, and sub-components when reused elsewhere (`export function RecordRow`, `export const ACTIVITY_ICONS`)

**Barrel files:**
- `src/utils/index.ts` — only `createPageUrl` and `getActiveDog`
- No barrel for components — import directly from file path
- No barrel for pages — `pages.config.js` handles the page registry

---

*Convention analysis: 2026-03-27*
