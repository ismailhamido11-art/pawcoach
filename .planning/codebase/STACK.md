# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- JavaScript (JSX) — frontend components, pages, utilities (`src/`)
- TypeScript — backend Deno functions (`base44/functions/*/entry.ts`)

**Secondary:**
- CSS (via Tailwind) — styling, design tokens in `src/index.css`

## Runtime

**Frontend:**
- Browser (PWA) — targets mobile-first, Chrome/Safari/Firefox
- Node.js (dev only) — Vite dev server and build toolchain

**Backend:**
- Deno — serverless edge functions, 22 functions in `base44/functions/`
- Managed by Base44 platform — no self-hosted infrastructure

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React `^18.2.0` — UI framework, functional components only
- React Router DOM `^6.26.0` — client-side routing (`src/App.jsx`)
- Vite `^6.1.0` — build tool and dev server (`vite.config.js`)

**UI Component System:**
- Radix UI (full suite, 20+ primitives) — headless component primitives
  - Accordion, AlertDialog, Avatar, Checkbox, Dialog, DropdownMenu, Popover, Progress, Select, Slider, Switch, Tabs, Toast, Tooltip, etc.
- shadcn/ui — opinionated wrappers over Radix, located in `src/components/ui/` (READ ONLY — never modify)

**Styling:**
- Tailwind CSS `^3.4.17` — utility-first CSS (`tailwind.config.js`)
- `tailwindcss-animate` — animation utilities
- `class-variance-authority ^0.7.1` — variant-based component styling
- `tailwind-merge ^3.0.2` — safe class merging
- `clsx ^2.1.1` — conditional class joining
- Inter font — primary typeface (defined in `tailwind.config.js`)

**Animation:**
- Framer Motion `^11.16.4` — spring animations, page transitions
  - Spring config: stiffness 300-400, damping 25-30 (enforced in `src/lib/animations.js`)
  - `prefers-reduced-motion` respected
- `canvas-confetti ^1.9.4` — celebration effects (achievements, training completion)
- `@lottiefiles/dotlottie-react ^0.18.7` — Lottie animations via `src/lib/lottieLibrary.js`

**Data & State:**
- `@tanstack/react-query` — server state management (configured in `src/lib/query-client.js`)
  - `refetchOnWindowFocus: false`, `retry: 1`
- React Context — auth state (`src/lib/AuthContext.jsx`), home cache (`src/lib/HomeCacheContext.jsx`)
- No Redux / Zustand / Jotai

**Forms:**
- `react-hook-form ^7.54.2` — form state
- `@hookform/resolvers ^4.1.2` — Zod integration
- `zod ^3.24.2` — schema validation

**PDF Generation:**
- `jspdf ^4.0.0` — PDF generation (lazy-loaded in `src/components/vet/DownloadHealthPDF.jsx`)
- jsPDF also used in backend `base44/functions/generateDiagnosisPDF/entry.ts` (`npm:jspdf@4.0.0`)

**Image Capture:**
- `html2canvas ^1.4.1` — screenshot to canvas for share cards (lazy-loaded in `src/components/scan/ShareCard.jsx`, `src/components/tracker/WalkShareCard.jsx`)

**Markdown:**
- `react-markdown ^9.0.1` — renders AI responses, configured in `src/lib/markdown.js`

**Charts:**
- `recharts ^2.15.4` — data visualization (weight trends, walk history, growth tracker)

**Maps:**
- `react-leaflet ^4.2.1` — interactive maps (walk map, nearby parks, find vet)
- `leaflet` — underlying map library, tiles from OpenStreetMap (`https://{s}.tile.openstreetmap.org`)

**Date Handling:**
- `date-fns ^3.6.0` — date formatting and calculation

**Notifications:**
- `sonner ^2.0.1` — toast notifications

**OTP / Calendar / Drawer:**
- `input-otp ^1.4.2` — OTP input (referral codes, invite codes)
- `react-day-picker ^8.10.1` — date picker calendar component
- `vaul ^1.1.2` — drawer/bottom sheet component
- `cmdk ^1.0.0` — command palette
- `next-themes ^0.4.4` — theme switching (dark mode via `darkMode: "media"` in Tailwind)

**Icons:**
- `lucide-react ^0.475.0` — icon library, used throughout all components

## Key Dependencies

**Critical:**
- `@base44/sdk ^0.8.23` — platform SDK, entity CRUD, auth, file upload, LLM invocation
- `@base44/vite-plugin ^1.0.6` — HMR notifier, analytics tracker, visual edit agent
- `npm:@base44/sdk@0.8.20` — pinned version in all Deno backend functions (different from frontend version)
- `npm:stripe@17.3.1` — Stripe billing SDK in Deno (stripeCheckout, stripePortal, stripeWebhook, deleteUser)
- `@stripe/stripe-js ^5.2.0` — Stripe frontend SDK (Premium page, subscription section)

## Configuration

**Environment:**
- Frontend env vars via Vite: `VITE_BASE44_APP_ID`, `VITE_BASE44_FUNCTIONS_VERSION`, `VITE_BASE44_APP_BASE_URL`
- Resolved at runtime in `src/lib/app-params.js` (URL params take priority over localStorage, then VITE env)
- Backend env vars injected by Base44 platform: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`, `BASE44_APP_ID`

**Build:**
- `vite.config.js` — Vite 6, `logLevel: 'error'`, Base44 plugin + React plugin
- `postcss.config.js` — PostCSS with Autoprefixer
- `jsconfig.json` — path alias `@/*` maps to `./src/*`, JSX mode `react-jsx`
- `eslint.config.js` — ESLint 9 flat config, covers `src/components/**` and `src/pages/**`

**PWA:**
- `public/manifest.json` — name "PawCoach", display "standalone", theme `#1A4D3E`, background `#F5F0E8`, lang "fr"
- `public/sw.js` — service worker, cache-first for static assets, network passthrough for API/functions
- Icons: SVG at 192x192 and 512x512 in `public/icons/`

## Platform Requirements

**Development:**
- Node.js (for npm + Vite dev server)
- GitHub account (`ismailhamido11-art`) for 2-way sync with Base44
- Git push to `main` branch triggers Base44 auto-sync (0 credits consumed)

**Production:**
- Hosted on Base44 platform (`https://paw-coach-care.base44.app`)
- Backend: Deno serverless managed by Base44 (no direct server access)
- App ID: `699f971349f7fa56a125f672`
- No Vercel, no AWS, no self-hosted server

---

*Stack analysis: 2026-03-27*
