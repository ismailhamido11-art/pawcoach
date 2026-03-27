# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- JavaScript (JSX) - All frontend pages and components in `src/`
- TypeScript - All backend Deno functions in `base44/functions/*/entry.ts`

**Secondary:**
- CSS (custom properties via Tailwind) - `src/index.css`, `tailwind.config.js`

## Runtime

**Environment:**
- Browser (Vite SPA, hosted on Base44 platform)
- Deno (backend functions, serverless, hosted by Base44)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - UI framework (`src/`)
- React Router DOM 6.26.0 - Client-side routing (`src/App.jsx` / `src/pages.config.js`)

**Animation:**
- Framer Motion 11.16.4 - Page transitions and component animations throughout `src/`
  - Spring: stiffness 300-400, damping 25-30 (from design system)
  - Respects `prefers-reduced-motion`
- `canvas-confetti` 1.9.4 - Gamification celebrations (`src/components/training/`, `src/components/home/`)
- `@lottiefiles/dotlottie-react` 0.18.7 - Lottie animations in empty states (`src/components/ui/LottieAnimation.jsx`, `src/lib/lottieLibrary.js`)

**Forms:**
- react-hook-form 7.54.2 + @hookform/resolvers 4.1.2 + zod 3.24.2 - Form handling and validation

**Build/Dev:**
- Vite 6.1.0 - Bundler and dev server (`vite.config.js`)
- `@base44/vite-plugin` 1.0.6 - HMR notifier, navigation notifier, analytics tracker, visual edit agent
- `@vitejs/plugin-react` 4.3.4 - React fast refresh
- ESLint 9.19.0 - Linting (`eslint.config.js`)
- TypeScript 5.8.2 - Type checking (jsconfig.json, not full TS compilation)
- PostCSS + autoprefixer - CSS processing (`postcss.config.js`)

## UI Library

**Component System:**
- shadcn/ui (Radix UI primitives + Tailwind) - `src/components/ui/` — **NEVER modify this directory**
- Radix UI - Full suite: accordion, alert-dialog, avatar, checkbox, collapsible, dialog, dropdown-menu, label, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, tooltip, toggle, toggle-group, context-menu, hover-card, menubar, aspect-ratio
- `class-variance-authority` 0.7.1 + `clsx` 2.1.1 + `tailwind-merge` 3.0.2 - Component variant logic
- `lucide-react` 0.475.0 - Icon library
- `next-themes` 0.4.4 - Dark mode (configured as `darkMode: "media"` in Tailwind)
- `sonner` 2.0.1 - Toast notifications
- `vaul` 1.1.2 - Drawer component
- `cmdk` 1.0.0 - Command palette

## CSS / Styling

**Approach:** Tailwind CSS 3.4.17 utility-first with CSS custom properties for theming

**Configuration:** `tailwind.config.js`
- Colors defined as CSS variables: `hsl(var(--background))` etc.
- Custom semantic colors: `safe`, `caution`, `toxic` (food safety indicators)
- Font: Inter (system stack fallback)
- Custom animations: `fade-in`, `slide-up`, `bounce-soft`, `pulse-soft`
- Plugin: `tailwindcss-animate` 1.0.7

**Design Tokens:**
- Background: cream HSL(37,33%,95%), theme color `#F5F0E8`
- Primary (forest): `#1A4D3E`
- Accent (emerald): `#2D9F82`
- No orange, no teal, no yellow. Amber for warnings only.

**Path Alias:** `@/` maps to `src/` (jsconfig.json, used throughout all imports)

## State Management

**Authentication:**
- `src/lib/AuthContext.jsx` - React Context providing `user`, `isAuthenticated`, `isLoadingAuth`, `logout`, `navigateToLogin`
- Backed by `base44.auth.me()` and `base44.auth.logout()` from Base44 SDK

**Home Cache:**
- `src/lib/HomeCacheContext.jsx` - In-memory ref cache (2 min TTL) for Home page data (user, dog, insights). Invalidates on active dog change.

**Local State:**
- useState / useReducer per component — no Redux or Zustand

**Custom Hooks (in `src/lib/`, aliased as `@/hooks/` and `@/lib/`):**
- `src/lib/useActionCredits.js` - Daily action credit tracking for free-tier quota
- `src/lib/useBackClose.js` - Android back-button closes modal
- `src/lib/useCountUp.js` - Animated number counter
- `src/lib/use-mobile.jsx` - Responsive breakpoint detection

## Data Fetching

**Client:** `@base44/sdk` 0.8.23 — initialized in `src/api/base44Client.js`

**Entity Layer:** `src/api/entities.js` — wraps `base44.entities.*` with a thin `wrapEntity()` proxy providing `.filter()`, `.create()`, `.update()`, `.delete()`

**Entities (19 total):**
`Dog`, `HealthRecord`, `DailyCheckin`, `DailyLog`, `Streak`, `FoodScan`, `UserProgress`,
`DiagnosisReport`, `NutritionPlan`, `Bookmark`, `WeeklyInsight`, `SharedVetAccess`,
`DogAchievement`, `DietPreferences`, `GrowthEntry`, `ParkReview`, `PlaceFavorite`,
`ChatMessage`, `VetNote`

**Query Client:** `src/lib/query-client.js`

## Backend (Deno Functions)

Runtime: Deno (serverless), deployed on Base44 infrastructure.
SDK: `npm:@base44/sdk@0.8.20` via `createClientFromRequest` in every function entry point.
Location: `base44/functions/*/entry.ts`

**22 functions:**

| Function | Category | External deps |
|---|---|---|
| `pawcoachChat` | AI chat (coaching + nutrition + vision) | OpenRouter API |
| `dailyCheckinProcess` | Daily check-in + AI insight | OpenRouter API |
| `weeklyInsightGenerate` | Weekly summary generation | OpenRouter API |
| `preDiagnosis` | AI pre-diagnosis (symptom intake) | Base44 InvokeLLM |
| `finalDiagnosis` | AI full diagnosis | Base44 InvokeLLM |
| `parseHealthFile` | Health file OCR/parse | Base44 InvokeLLM |
| `processHealthInput` | Health data processing | Base44 InvokeLLM |
| `generateTrainingProgram` | AI training program generation | Base44 InvokeLLM |
| `analyzeGrowthPhoto` | Dog growth photo analysis | Base44 InvokeLLM |
| `generateDiagnosisPDF` | PDF generation from diagnosis | `npm:jspdf@4.0.0` |
| `stripeCheckout` | Stripe subscription checkout | Stripe SDK |
| `stripePortal` | Stripe billing portal | Stripe SDK |
| `stripeWebhook` | Stripe webhook handler | Stripe SDK |
| `deleteUser` | Account deletion + Stripe cleanup | Stripe SDK |
| `vetAccess` | Vet sharing portal + email | Base44 SendEmail |
| `medicationReminders` | Scheduled med reminders | Base44 SendEmail |
| `vaccineReminders` | Scheduled vaccine reminders | Base44 SendEmail |
| `vetVisitReminders` | Scheduled vet visit reminders | Base44 SendEmail |
| `walkReminder` | Scheduled walk reminders | Base44 SendEmail |
| `streakReminder` | Scheduled streak reminders | Base44 SendEmail |
| `trialExpiryReminder` | Trial expiry emails | Base44 SendEmail |
| `monthlySummary` | Monthly summary emails | Base44 SendEmail |

## Key Dependencies

**Charts / Data Viz:**
- `recharts` 2.15.4 - Dashboard charts and progress graphs

**Maps:**
- `react-leaflet` 4.2.1 + Leaflet - Interactive maps for FindVet and NearbyParks (`src/components/sante/FindVetContent.jsx`, `src/components/tracker/NearbyParks.jsx`, `src/components/tracker/WalkMap.jsx`)
- Tile source: OpenStreetMap (via react-leaflet TileLayer)

**PDF / Image Export:**
- `jspdf` 4.0.0 - PDF generation (frontend lazy-loaded in `src/components/vet/DownloadHealthPDF.jsx`, backend in `generateDiagnosisPDF`)
- `html2canvas` 1.4.1 - Screenshot-to-image for share cards (`src/components/scan/ShareCard.jsx`, `src/components/tracker/WalkShareCard.jsx`)

**Date / Calendar:**
- `date-fns` 3.6.0 - Date formatting and arithmetic
- `react-day-picker` 8.10.1 - Calendar component

**Markdown:**
- `react-markdown` 9.0.1 - Chat message rendering (`src/lib/markdown.js`)

**Payments (frontend):**
- `@stripe/stripe-js` 5.2.0 - Stripe.js loader for checkout redirects

**OTP / PIN:**
- `input-otp` 1.4.2 - OTP input component

## Configuration

**Environment (frontend, via Vite):**
- `VITE_BASE44_APP_ID` - Base44 app ID (injected by Base44 platform)
- `VITE_BASE44_FUNCTIONS_VERSION` - Functions version (injected by Base44 platform)
- `VITE_BASE44_APP_BASE_URL` - App base URL (injected by Base44 platform)
- Read via `src/lib/app-params.js`, which also reads from URL params and localStorage

**Environment (backend, Deno secrets via Base44 dashboard):**
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `OPENROUTER_API_KEY` - OpenRouter LLM API key
- `BASE44_APP_ID` - Base44 app identifier

**Build:**
- `vite.config.js` - Vite config with base44 and react plugins
- `tailwind.config.js` - Tailwind theme
- `postcss.config.js` - PostCSS
- `eslint.config.js` - ESLint rules
- `jsconfig.json` - TypeScript loose check, `@/` alias, excludes `src/components/ui/`

## PWA Setup

- `public/manifest.json` - PWA manifest (standalone, portrait, FR, theme `#1A4D3E`, bg `#F5F0E8`)
- `public/sw.js` - Service worker: cache-first for static assets, network-first for navigation, network passthrough for `/api/` and `/functions/`
- Registered in `index.html` via `<link rel="manifest">`
- iOS support: `apple-mobile-web-app-capable`, `apple-touch-icon`, status bar `black-translucent`
- Icons: SVG at 192x192 and 512x512 in `public/icons/`

## Platform Requirements

**Development:**
- Node.js (npm) for frontend dependencies
- Vite dev server: `npm run dev`
- Git + GitHub (`ismailhamido11-art/pawcoach`) for 2-way sync with Base44

**Production:**
- Hosted on Base44 platform at `https://paw-coach-care.base44.app`
- Build: `npm run build` → `dist/`
- Backend: Deno functions managed by Base44 (no separate deployment step)
- Deploy: `git push` to `main` branch → Base44 auto-syncs → "Publish" in Base44 dashboard

---

*Stack analysis: 2026-03-27*
