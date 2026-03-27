# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- JavaScript (JSX) — all frontend pages (`src/pages/`) and components (`src/components/`)
- TypeScript — all 22 Deno backend functions in `base44/functions/*/entry.ts`

**Secondary:**
- CSS (custom properties + Tailwind utilities) — design tokens defined in `src/index.css`

**Module System:** ESM (`"type": "module"` in `package.json`). Path alias `@/*` → `./src/*` via `jsconfig.json`.

## Runtime

**Environment:**
- Browser — React SPA PWA, iOS Safari primary target, service worker registered in `src/main.jsx`
- Deno — backend functions hosted by Base44 platform; each is a standalone `Deno.serve()` in `base44/functions/*/entry.ts`

**Node.js (dev only):**
- v24.13.0 (tested environment; no `.nvmrc` present)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 — UI rendering, root at `src/App.jsx`
- React Router DOM 6.26.0 — client-side routing, `BrowserRouter`, config in `src/pages.config.js`
- Framer Motion 11.16.4 — animations throughout; spring presets in `src/lib/animations.js` (stiffness 300-400, damping 25-30)

**Styling:**
- Tailwind CSS 3.4.17 — utility-first, config in `tailwind.config.js`
  - Dark mode: `media` strategy (responds to `prefers-color-scheme`)
  - Custom tokens: `safe`, `caution`, `toxic` colors; `fade-in`, `slide-up`, `bounce-soft`, `pulse-soft` keyframes
- tailwindcss-animate 1.0.7 — Tailwind animation utilities
- PostCSS 8.5.3 + autoprefixer 10.4.20 — CSS processing, config in `postcss.config.js`
- class-variance-authority 0.7.1 — variant-based component styling (shadcn pattern)
- clsx 2.1.1 + tailwind-merge 3.0.2 — conditional class merging (`cn()` utility)

**UI Components:**
- Radix UI (22 primitives, all versions ^1.x-2.x) — headless accessible components
  - Wrapped by shadcn/ui in `src/components/ui/` — **never modify this directory**
  - shadcn config: `components.json` (style: new-york, cssVariables: true, iconLibrary: lucide)
- lucide-react 0.475.0 — icon library
- next-themes 0.4.4 — dark mode theme provider

**Forms:**
- react-hook-form 7.54.2 — form state management
- @hookform/resolvers 4.1.2 — schema resolver bridge
- zod 3.24.2 — schema validation

**Data Visualization:**
- recharts 2.15.4 — charts on Dashboard and Activite pages
- react-day-picker 8.10.1 — calendar date picker

**Testing:**
- None — no test runner configured, no test files present

**Build/Dev:**
- Vite 6.1.0 — bundler and dev server, config in `vite.config.js`
- @vitejs/plugin-react 4.3.4 — React HMR and JSX transform
- @base44/vite-plugin 1.0.6 — Base44 platform integration (HMR notifier, analytics tracker, visual edit agent, navigation notifier)
- TypeScript 5.8.2 — type checking only (no emit), via `jsconfig.json` with `checkJs: true`
  - Scope: `src/components/**/*.js` and `src/pages/**/*.jsx` only (excludes `src/lib/`, `src/components/ui/`)

## Key Dependencies

**Critical:**
- @base44/sdk 0.8.23 (package.json) / 0.8.20 pinned in backend — platform SDK for auth, entity CRUD, function invocation, LLM proxy, file upload
  - Frontend client: `src/api/base44Client.js`
  - Backend: `npm:@base44/sdk@0.8.20` in every `entry.ts`
- stripe 17.3.1 (Deno) — Stripe server SDK in `base44/functions/stripeCheckout/entry.ts`, `stripeWebhook/entry.ts`, `stripePortal/entry.ts`
- @stripe/react-stripe-js 3.0.0 + @stripe/stripe-js 5.2.0 — frontend Stripe SDK (imported in package; checkout is redirect-based via backend, no embedded Elements rendered)

**Animation/Media:**
- @lottiefiles/dotlottie-react 0.18.7 — Lottie animations loaded from LottieFiles CDN; URL registry in `src/lib/lottieLibrary.js` (~70 `.lottie` URLs)
- canvas-confetti 1.9.4 — confetti on premium activation in `src/pages/Premium.jsx`
- three 0.171.0 — Three.js present in package.json; no active import found in `src/` (likely legacy/unused)

**Maps:**
- react-leaflet 4.2.1 — interactive maps in `src/components/tracker/WalkMap.jsx` and `src/components/tracker/NearbyParks.jsx`

**Document Generation:**
- html2canvas 1.4.1 — screenshot-to-image for share cards (`src/components/scan/ShareCard.jsx`, `src/components/tracker/WalkShareCard.jsx`)
- jspdf 4.0.0 — PDF export frontend (`src/components/vet/DownloadHealthPDF.jsx`) and backend (`base44/functions/generateDiagnosisPDF/entry.ts` via `npm:jspdf@4.0.0`)

**Rich Content:**
- react-markdown 9.0.1 — render AI chat responses as Markdown
- react-quill 2.0.0 — rich text editor (vet notes)
- date-fns 3.6.0 — date formatting and arithmetic throughout
- @hello-pangea/dnd 17.0.0 — drag-and-drop (training exercise reordering)
- embla-carousel-react 8.5.2 — horizontal carousels
- sonner 2.0.1 — toast notifications
- vaul 1.1.2 — bottom sheet / drawer
- input-otp 1.4.2 — OTP input component
- cmdk 1.0.0 — command palette component

**Dead Code:**
- `src/lib/query-client.js` imports `@tanstack/react-query` but the package is not in `package.json` and is absent from `node_modules` — file is dead code, do not rely on it

## Configuration

**Environment (frontend):**
- App ID: `VITE_BASE44_APP_ID` env var → resolved via `src/lib/app-params.js`
- Auth token: passed via `?access_token=` URL param or stored in `localStorage` as `base44_access_token`
- `VITE_BASE44_FUNCTIONS_VERSION` — function version routing
- `VITE_BASE44_APP_BASE_URL` — base URL override

**Environment (backend — set in Base44 platform dashboard, never in repo):**
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `OPENROUTER_API_KEY` — OpenRouter for chat, checkin, and weekly insight AI
- `BASE44_APP_ID` — injected by Base44 runtime for service role operations

**Build config files:**
- `vite.config.js` — Vite with Base44 plugin
- `tailwind.config.js` — Tailwind design system tokens
- `postcss.config.js` — tailwindcss + autoprefixer
- `jsconfig.json` — path alias + TypeScript check config
- `eslint.config.js` — ESLint flat config
- `components.json` — shadcn/ui component config

## Platform Requirements

**Development:**
- Node.js 20+ (tested on 24.13.0)
- `npm install` from `pawcoach/` directory
- Base44 platform account with Mode Developer active
- GitHub 2-way sync connected on account `ismailhamido11-art`, branch `main`

**Production:**
- Platform: Base44 managed hosting → `https://paw-coach-care.base44.app`
- Backend runtime: Deno, managed by Base44 (no separate deployment needed)
- Deploy flow: `git push origin main` → Base44 syncs automatically → Ismail clicks "Publish" in Base44 dashboard
- PWA: service worker at `/sw.js`, manifest at `/manifest.json`, theme color `#1A4D3E`
- iOS PWA: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `viewport-fit=cover`

---

*Stack analysis: 2026-03-27*
