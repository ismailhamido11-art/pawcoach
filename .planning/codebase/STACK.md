# PawCoach — Tech Stack Reference

> Generated: 2026-03-26
> Source of truth: `package.json`, config files, installed node_modules

---

## Language & Module System

| Item | Value |
|------|-------|
| Language | JavaScript (JSX) — no TypeScript in frontend |
| Type checking | `jsconfig.json` + `tsc` (check only, no emit) with `checkJs: true` |
| Module system | ESM (`"type": "module"` in package.json) |
| Target | `esnext` |
| Path alias | `@/*` → `./src/*` |

**TypeScript note**: Backend functions in `base44/functions/` are written in TypeScript (Deno runtime). Frontend is plain JS + JSX.

---

## Runtime Environments

### Frontend
- **Browser** (PWA — mobile-first, iOS Safari primary target)
- **Service Worker** registered in `src/main.jsx` at `/sw.js`
- **Platform**: Base44 (managed hosting, serves the built Vite output)

### Backend
- **Deno** runtime (managed by Base44)
- **SDK version in functions**: `npm:@base44/sdk@0.8.20` (pinned)
- Each function lives in `base44/functions/<name>/entry.ts`

---

## Core Framework

| Package | Version (installed) | Role |
|---------|-------------------|------|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | DOM rendering |
| `react-router-dom` | 6.30.3 | Client-side routing |

**Entry point**: `src/main.jsx` → `src/App.jsx` → `src/pages.config.js`

**Routing strategy**: `BrowserRouter` with flat routes. Main page: `Home`. 5 primary pages loaded eagerly (bottom nav); 11 secondary pages lazy-loaded (`React.lazy`).

---

## Build & Dev Tools

| Tool | Version | Config file |
|------|---------|-------------|
| Vite | 6.4.1 | `vite.config.js` |
| `@vitejs/plugin-react` | 4.3.4 | inline in vite.config |
| `@base44/vite-plugin` | 1.0.0 | inline in vite.config |
| TypeScript (for type-check only) | 5.8.2 | `jsconfig.json` |

**Vite plugin options** (Base44 plugin):
- `legacySDKImports`: off (uses new SDK imports)
- `hmrNotifier`: on
- `navigationNotifier`: on
- `analyticsTracker`: on
- `visualEditAgent`: on

**Build command**: `npm run build` → `vite build`
**Dev command**: `npm run dev` → `vite`

---

## CSS & Styling

### Tailwind CSS
- Version: 3.4.19
- Config: `tailwind.config.js`
- PostCSS: `postcss.config.js` with autoprefixer 10.4.20
- `tailwindcss-animate`: 1.0.7 (keyframe utilities)
- Dark mode: `class` strategy (`.dark` class on `<html>`)
- Content scan: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`

### Design Tokens (CSS variables in `src/index.css`)
All colors defined as HSL CSS variables:

| Token | Light mode | Dark mode |
|-------|-----------|-----------|
| `--background` | HSL 37 33% 95% (cream) | HSL 160 20% 6% |
| `--primary` | HSL 160 50% 22% (forest green `#1A4D3E`) | HSL 162 45% 50% |
| `--accent` | HSL 162 55% 42% (emerald `#2D9F82`) | HSL 162 50% 50% |
| `--safe` | HSL 145 60% 42% | — |
| `--caution` | HSL 38 92% 55% | — |
| `--toxic` | HSL 0 72% 51% | — |
| `--radius` | 0.875rem | — |

### shadcn/ui
- Style: `new-york`
- Config: `components.json` (cssVariables: true, iconLibrary: lucide)
- Location: `src/components/ui/` — **never modify this directory**
- Base color: neutral

### Custom CSS utilities in `src/index.css`
- `.safe-pt-{8,10,12,14,16,24}` — iOS safe area padding helpers
- `.gradient-primary`, `.gradient-warm`, `.gradient-card`
- `.card-hover`, `.chat-bubble-user`, `.chat-bubble-assistant`
- `.bottom-nav` — glassmorphism nav bar
- Dark mode overrides for Tailwind color utilities (`bg-white`, `from-emerald-50`, etc.)
- `prefers-reduced-motion` reset

### Typography
- Font: **Inter** (system stack fallback: `-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`)
- Inter is loaded via the Base44 platform (not via Google Fonts CDN — no `<link rel="preconnect">` in `index.html`)
- Letter spacing: `-0.011em` body, `-0.025em` headings

---

## Animation

| Library | Version | Usage |
|---------|---------|-------|
| `framer-motion` | 11.18.2 | Page transitions, spring animations, micro-interactions |
| `tailwindcss-animate` | 1.0.7 | CSS keyframe utilities (fade-in, slide-up, bounce-soft, pulse-soft) |
| `@lottiefiles/dotlottie-react` | 0.18.7 | Lottie animations (CDN .lottie files) |
| `@formkit/auto-animate` | 0.9.0 | Automatic list/DOM transition animations |

**Animation system** (`src/lib/animations.js`):
- `spring` — stiffness 360, damping 28 (default)
- `springGentle` — stiffness 120, damping 20
- `springSnappy` — stiffness 300, damping 25
- `fadeIn`, `fadeInUp`, `staggerContainer`, `staggerItem`, `tapScale`, `pressIn`, `hoverGlow`

**Rules**: max 0.4s for any animation; always respect `prefers-reduced-motion`.

---

## UI Component Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/*` (27 primitives) | various 1.x–2.x | Headless UI base for shadcn components |
| `lucide-react` | 0.475.0 | Icon set (shadcn default) |
| `class-variance-authority` | 0.7.1 | Variant API for shadcn |
| `clsx` + `tailwind-merge` | 2.1.1 + 3.0.2 | Class name utilities |
| `cmdk` | 1.0.0 | Command palette |
| `vaul` | 1.1.2 | Drawer/bottom sheet |
| `sonner` | 2.0.1 | Toast notifications |
| `next-themes` | 0.4.4 | Dark mode theme provider |
| `embla-carousel-react` | 8.5.2 | Horizontal carousels |
| `react-resizable-panels` | 2.1.7 | Resizable panel layouts |
| `input-otp` | 1.4.2 | OTP input field |

---

## Forms & Validation

| Library | Version | Usage |
|---------|---------|-------|
| `react-hook-form` | 7.54.2 | Form state management |
| `@hookform/resolvers` | 4.1.2 | Schema resolver bridge |
| `zod` | 3.24.2 | Schema validation |

---

## Data & State

| Library | Version | Notes |
|---------|---------|-------|
| `@tanstack/react-query` | (not in package.json) | `src/lib/query-client.js` imports it but `@tanstack` is NOT in `package.json` and the node_modules directory is empty — this file is dead code |
| Base44 SDK entities | via `@base44/sdk` | Primary data access layer — see INTEGRATIONS.md |

No Redux, Zustand, Jotai, or other global state manager. State is React local state + Base44 entity calls.

---

## Charts & Data Visualization

| Library | Version | Usage |
|---------|---------|-------|
| `recharts` | 2.15.4 | Growth curves, activity graphs |
| `react-day-picker` | 8.10.1 | Calendar date picker |

---

## Maps & Geolocation

| Library | Version | Usage |
|---------|---------|-------|
| `react-leaflet` | 4.2.1 | Interactive maps (park finder, walk tracker) |
| Browser `navigator.geolocation` | native | GPS position for walk tracking |

Map tiles: OpenStreetMap (standard) + CartoDB Voyager
Leaflet marker icons: loaded from `unpkg.com/leaflet@1.9.4/dist/images/`

---

## Drag & Drop

| Library | Version | Usage |
|---------|---------|-------|
| `@hello-pangea/dnd` | 17.0.0 | Drag-and-drop lists |

---

## Rich Content

| Library | Version | Usage |
|---------|---------|-------|
| `react-markdown` | 9.0.1 | Render AI chat responses |
| `react-quill` | 2.0.0 | Rich text editor (vet notes) |
| `date-fns` | 3.6.0 | Date formatting/calculation throughout |

---

## Export / Generation

| Library | Version | Usage |
|---------|---------|-------|
| `jspdf` | 4.0.0 | Generate diagnosis PDF reports (frontend + backend Deno) |
| `html2canvas` | 1.4.1 | Screenshot cards for sharing (Walk share card, etc.) |
| `canvas-confetti` | 1.9.4 | Confetti celebration on achievements/streaks |

---

## 3D (Declared but Unused in Frontend)

| Library | Version | Notes |
|---------|---------|-------|
| `three` | 0.171.0 | In `package.json` but no `import * from 'three'` found in `src/` — likely legacy/unused |

---

## Linting

| Tool | Version | Config |
|------|---------|--------|
| ESLint | 9.19.0 | `eslint.config.js` (flat config) |
| `eslint-plugin-react` | 7.37.4 | React rules |
| `eslint-plugin-react-hooks` | 5.0.0 | Hooks rules |
| `eslint-plugin-react-refresh` | 0.4.18 | HMR safety |
| `eslint-plugin-unused-imports` | 4.3.0 | Remove dead imports |

**Lint scope**: `src/components/**`, `src/pages/**`, `src/Layout.jsx`
**Excluded from lint**: `src/lib/**`, `src/components/ui/**`

---

## PWA Configuration

- Manifest: `/manifest.json` (referenced in `index.html`)
- Service worker: `/sw.js` (registered in `src/main.jsx`)
- Theme color: `#1A4D3E`
- iOS meta tags: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- Viewport: `viewport-fit=cover` (supports iOS notch/safe areas)

---

## Project Structure Summary

```
pawcoach/
├── src/
│   ├── main.jsx              # Entry point, SW registration
│   ├── App.jsx               # Router + AuthProvider wrapper
│   ├── pages.config.js       # Route/page registry
│   ├── index.css             # Tailwind base + design tokens + utilities
│   ├── pages/                # 16 page components
│   ├── components/           # ~102 custom components (20+ subdirs)
│   │   └── ui/               # shadcn/ui — DO NOT MODIFY
│   ├── api/
│   │   └── base44Client.js   # Base44 SDK client singleton
│   ├── lib/
│   │   ├── AuthContext.jsx   # Auth state provider
│   │   ├── animations.js     # Framer Motion presets
│   │   ├── lottieLibrary.js  # ~70 Lottie CDN URLs
│   │   ├── app-params.js     # Runtime params from URL/localStorage
│   │   └── query-client.js   # Dead code — @tanstack not installed
│   ├── hooks/                # 5 custom hooks
│   ├── utils/                # Business utilities (analytics, premium, health, AI credits)
│   └── assets/
│       ├── illustrations/    # 9 SVGs + storyset/ (23 Storyset SVGs)
│       └── images/           # 4 JPGs (hero images)
├── base44/
│   └── functions/            # 22 Deno backend functions
├── vite.config.js
├── tailwind.config.js
├── jsconfig.json
├── eslint.config.js
├── components.json           # shadcn/ui config
└── package.json
```
