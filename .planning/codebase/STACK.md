# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- JavaScript (JSX) - All frontend pages and components: `src/pages/`, `src/components/`
- TypeScript - Backend Deno functions `base44/functions/*/entry.ts`, utils barrel `src/utils/index.ts`

**Secondary:**
- CSS (custom properties + Tailwind) - `src/index.css` (design tokens), `tailwind.config.js`

## Runtime

**Environment:**
- Browser (PWA with service worker) — registered in `src/main.jsx` via `/sw.js`
- Deno (backend functions) — all `base44/functions/*/entry.ts` run on Base44-managed Deno runtime

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 — UI framework; entry point `src/main.jsx`, root component `src/App.jsx`
- React Router DOM 6.26.0 — client-side routing; route config in `src/pages.config.js`
- Tailwind CSS 3.4.17 — utility-first styling; design tokens in `tailwind.config.js`

**UI Component Library:**
- shadcn/ui (Radix UI primitives) — `src/components/ui/` — DO NOT MODIFY this directory
  - Full Radix suite: accordion, alert-dialog, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip

**Animation:**
- Framer Motion 11.16.4 — motion primitives used throughout UI
  - Presets centralized in `src/lib/animations.js`: `spring` (stiffness 360, damping 28), `springGentle` (120/20), `springSnappy` (300/25), `fadeIn`, `fadeInUp`
  - Respects `prefers-reduced-motion`

**Charts:**
- Recharts 2.15.4 — all data visualization
  - Custom tooltip shared component: `src/utils/chartHelpers.jsx`
  - Used in: `src/pages/Dashboard.jsx`, `src/pages/Profile.jsx`, `src/components/sante/GrowthTrackerContent.jsx`, `src/components/tracker/TrackerHistory.jsx`, `src/components/nutrition/FoodComparator.jsx`, `src/components/notebook/SectionPoids.jsx`

**Maps:**
- React Leaflet 4.2.1 — interactive walk map and vet finder
  - Used in: `src/components/tracker/WalkMap.jsx`, `src/components/tracker/NearbyParks.jsx`, `src/components/sante/FindVetContent.jsx`, `src/pages/Sante.jsx`
- Browser Geolocation API (native) — walk tracking and park search
  - Used in: `src/components/tracker/WalkMode.jsx`, `src/components/tracker/NearbyParks.jsx`, `src/components/sante/FindVetContent.jsx`

**Forms:**
- React Hook Form 7.54.2 + Zod 3.24.2 + @hookform/resolvers 4.1.2
  - Form UI wrapper at `src/components/ui/form.jsx`
  - Primarily used internally by shadcn components; direct use in pages is rare

**Payments:**
- @stripe/react-stripe-js 3.0.0 + @stripe/stripe-js 5.2.0
  - Frontend usage: `src/pages/Premium.jsx`, `src/pages/Home.jsx`, `src/components/profile/SubscriptionSection.jsx`
  - Backend: `base44/functions/stripeCheckout/entry.ts`, `base44/functions/stripePortal/entry.ts`, `base44/functions/stripeWebhook/entry.ts`

**Markdown Rendering:**
- react-markdown 9.0.1 — renders AI chat responses
  - Shared component config: `src/lib/markdown.js` (exports `mdComponents`)

**PDF Generation:**
- jspdf 4.0.0 — client-side PDF export; used in `src/components/vet/DownloadHealthPDF.jsx`
  - Also used server-side in `base44/functions/generateDiagnosisPDF/entry.ts` via `npm:jspdf@4.0.0`
- html2canvas 1.4.1 — screenshot-to-canvas for share cards
  - Used in: `src/components/scan/ShareCard.jsx`, `src/components/tracker/WalkShareCard.jsx`

**Lottie Animations:**
- @lottiefiles/dotlottie-react 0.18.7 — Lottie player
  - Wrapper component: `src/components/ui/LottieAnimation.jsx`
  - Animation URL catalog (CDN): `src/lib/lottieLibrary.js` (~70 animations)

**Drag and Drop:**
- @hello-pangea/dnd 17.0.0 — installed in `package.json`; no active usage found in source scan (may be unused post-v5 cleanup)

**Toast / Notifications:**
- sonner 2.0.1 — toast notifications; dark mode integration in `src/components/ui/sonner.jsx`
- vaul 1.1.2 — drawer/sheet component (mobile-first bottom sheets)

**Date Utilities:**
- date-fns 3.6.0 — date operations; custom helpers in `src/utils/dateHelpers.js`
- react-day-picker 8.10.1 — calendar date picker (shadcn calendar component)

**Other Input Components:**
- input-otp 1.4.2 — OTP input field (shadcn)
- cmdk 1.0.0 — command palette (shadcn)

**Confetti:**
- canvas-confetti 1.9.4 — celebration effects
  - Used in: `src/components/activite/CompletionCard.jsx`, `src/components/training/CelebrationScreen.jsx`, `src/components/training/FreeExercisesGate.jsx`, `src/components/training/MilestoneScreen.jsx`, `src/pages/Home.jsx`, `src/pages/Premium.jsx`

**Theming:**
- next-themes 0.4.4 — used only in `src/components/ui/sonner.jsx` for toast dark mode; main dark mode via Tailwind `darkMode: "media"`

**Utility:**
- clsx 2.1.1 + tailwind-merge 3.0.2 — class merging (shadcn `cn()` pattern)
- class-variance-authority 0.7.1 — variant API for shadcn components
- lucide-react 0.475.0 — icon library used throughout

**State / Data Fetching:**
- Direct async calls to Base44 SDK — primary data access pattern
- @tanstack/react-query — QueryClient in `src/lib/query-client.js` but NOT wired with QueryClientProvider; effectively unused for data fetching
- Custom in-memory cache: `src/lib/HomeCacheContext.jsx` — 2-minute TTL, dog-ID-aware, used on Home page

## Build / Dev Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 6.1.0 | Dev server + production bundler |
| @vitejs/plugin-react | 4.3.4 | React fast refresh |
| @base44/vite-plugin | 1.0.6 | HMR notifier, analytics tracker, visual edit agent, legacy SDK import compat |
| TypeScript | 5.8.2 | Type checking via `jsconfig.json` for JS files |
| ESLint | 9.19.0 | Linting; config in `eslint.config.js` |
| eslint-plugin-react | 7.37.4 | React-specific rules |
| eslint-plugin-react-hooks | 5.0.0 | Hook rules |
| eslint-plugin-unused-imports | 4.3.0 | Detects unused imports |
| PostCSS + Autoprefixer | 8.5.3 / 10.4.20 | CSS processing |
| tailwindcss-animate | 1.0.7 | Tailwind animation utilities plugin |

**Run commands:**
```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run lint       # ESLint (quiet mode — errors only)
npm run lint:fix   # ESLint with auto-fix
npm run typecheck  # TypeScript check via jsconfig.json
npm run preview    # Preview production build
```

## Key Dependencies

**Critical (app breaks without):**
- `@base44/sdk` 0.8.23 — entity CRUD, auth, function invocation; client in `src/api/base44Client.js`
- `react-router-dom` 6.26.0 — all page navigation
- `framer-motion` 11.16.4 — animations throughout UI
- `recharts` 2.15.4 — all dashboard and progress charts

**Infrastructure:**
- `@lottiefiles/dotlottie-react` 0.18.7 — mascot and celebration animations
- `react-leaflet` 4.2.1 — walk tracking map and vet finder
- `@stripe/react-stripe-js` + `@stripe/stripe-js` — subscription payment flow

## Configuration

**Environment variables (VITE_ prefix for browser access):**
- `VITE_BASE44_APP_ID` — Base44 app identifier; read via `src/lib/app-params.js`
- `VITE_BASE44_FUNCTIONS_VERSION` — backend functions version
- `VITE_BASE44_APP_BASE_URL` — app base URL override

**Config files:**
- `vite.config.js` — build config with Base44 and React plugins
- `tailwind.config.js` — design tokens (colors, radius, fonts, animations) mapped to CSS custom properties
- `jsconfig.json` — path alias `@/*` → `./src/*`; covers `src/components/**/*.js`, `src/pages/**/*.jsx`, `src/Layout.jsx`
- `postcss.config.js` — PostCSS with autoprefixer
- `eslint.config.js` — ESLint flat config

**Path alias:**
- `@/` resolves to `src/` — use for all cross-directory imports

## Platform Requirements

**Development:**
- Node.js + npm
- Git + GitHub (`ismailhamido11-art/pawcoach`, branch `main`)
- Push to `main` → Base44 auto-syncs → click "Publish" in Base44 dashboard to deploy

**Production:**
- Hosted: Base44 platform at `https://paw-coach-care.base44.app`
- App ID: `699f971349f7fa56a125f672`
- PWA: `manifest.json` + `/sw.js` service worker; iOS PWA meta tags in `index.html`
- Backend: Deno runtime managed by Base44 (22 functions)
- Stripe webhook must be configured pointing to `stripeWebhook` function endpoint

---

*Stack analysis: 2026-03-27 — v5.0 state. Removed deps: three.js, react-quill, react-resizable-panels, embla-carousel-react. Added: React.lazy() for 11 secondary pages.*
