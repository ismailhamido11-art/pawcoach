# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
pawcoach/
├── src/                        # All frontend source code
│   ├── App.jsx                 # Root router — public vs. authenticated split
│   ├── Layout.jsx              # Page transition wrapper (Framer Motion fade)
│   ├── pages.config.js         # Page registry + mainPage config (auto-managed)
│   ├── index.css               # Design system tokens (CSS variables, DO NOT EDIT)
│   ├── pages/                  # 16 page components (route = /PageName)
│   ├── components/             # ~100 custom components + shadcn/ui
│   │   ├── ui/                 # shadcn/ui primitives + custom UI atoms (DO NOT EDIT shadcn files)
│   │   ├── home/               # Home page sub-components
│   │   ├── sante/              # Sante page sub-components (tabs content)
│   │   ├── activite/           # Activite page sub-components
│   │   ├── tracker/            # Walk tracker components (WalkMode, map, history)
│   │   ├── training/           # Training exercises + journey components
│   │   ├── nutrition/          # Nutrition sub-components
│   │   ├── notebook/           # Health notebook sub-components
│   │   ├── vet/                # Vet-related components (diagnosis, PDF, sharing)
│   │   ├── dogprofile/         # Dog profile edit/view components
│   │   ├── profile/            # User profile section components
│   │   ├── premium/            # Premium nudge sheets
│   │   ├── onboarding/         # Onboarding welcome screen
│   │   ├── achievements/       # Achievement feed + badge utils
│   │   ├── dashboard/          # Dashboard smart alerts
│   │   ├── scan/               # Food scan share card
│   │   ├── notifications/      # Notification center (singleton)
│   │   ├── illustrations/      # Illustration.jsx (8 SVG aliases)
│   │   ├── hooks/              # useBackClose (legacy location)
│   │   └── lib/                # markdown.jsx (ReactMarkdown component config)
│   ├── api/                    # Base44 client + entity wrappers
│   │   ├── base44Client.js     # SDK client init
│   │   └── entities.js         # All 19 entity exports
│   ├── lib/                    # App-wide utilities and contexts
│   │   ├── AuthContext.jsx     # Auth context + provider
│   │   ├── HomeCacheContext.jsx # Home page data cache (ref-based)
│   │   ├── animations.js       # Framer Motion presets
│   │   ├── app-params.js       # Base44 app params (appId, token)
│   │   ├── lottieLibrary.js    # Lottie CDN URL registry
│   │   ├── markdown.js         # Markdown parse utils
│   │   ├── query-client.js     # TanStack QueryClient instance
│   │   ├── utils.js            # cn() (classnames utility)
│   │   └── PageNotFound.jsx    # 404 fallback
│   ├── utils/                  # Domain utilities
│   │   ├── index.ts            # createPageUrl(), getActiveDog()
│   │   ├── premium.js          # isUserPremium(), isUserOnTrial(), getTrialDaysLeft()
│   │   ├── ai-credits.js       # initCredits(), consumeMessageCredit(), consumeActionCredit()
│   │   ├── analytics.js        # trackEvent(), getEvents() (localStorage-based)
│   │   ├── dateHelpers.js      # Date formatting utilities
│   │   ├── healthStatus.js     # Vaccine maps, health score, dog age helpers
│   │   ├── overpass.js         # OpenStreetMap Overpass API (vet finder)
│   │   └── recommendations.js  # buildRecommendations(), getTodayString()
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.jsx      # Mobile breakpoint detection
│   │   ├── useActionCredits.js # Action credit state management
│   │   ├── useBackClose.js     # Back button / sheet close hook
│   │   ├── useCountUp.js       # Animated number counter
│   │   └── useReducedMotion.js # prefers-reduced-motion
│   └── assets/                 # Static assets
│       ├── illustrations/      # 8 custom SVG illustrations
│       │   └── storyset/       # 23 Storyset SVG illustrations
│       └── images/             # 4 JPEG images (hero, profile, vet, walk)
├── base44/
│   └── functions/              # 22 Deno backend functions
│       └── {functionName}/
│           └── entry.ts        # One file per function (Deno.serve)
├── public/                     # Static public assets (favicon, manifest)
├── .planning/                  # GSD planning docs
│   └── codebase/               # Architecture, stack, conventions docs
├── index.html                  # Vite entry HTML
├── vite.config.js              # Vite config (path alias @/ → src/)
├── tailwind.config.js          # Tailwind config
├── jsconfig.json               # Path aliases for JS
└── package.json                # Dependencies
```

## Directory Purposes

**`src/pages/`:**
- Purpose: Route-level components. Each file = one URL route.
- Naming: PascalCase matching the route name (e.g., `Home.jsx` → `/Home`)
- Pattern: Pages call `base44.auth.me()` on mount, fetch entity data, manage local state, compose domain components
- Key files: `Home.jsx` (main dashboard), `Sante.jsx` (5-tab health center), `Activite.jsx` (4-tab activity), `Nutri.jsx` (5-tab nutrition), `Profile.jsx` (settings + subscriptions)

**`src/components/ui/`:**
- Purpose: shadcn/ui primitives (button, card, sheet, dialog, etc.) + custom UI atoms
- NEVER MODIFY shadcn files (accordion, alert, avatar, badge, button, calendar, card, checkbox, dialog, drawer, input, label, progress, select, separator, sheet, skeleton, slider, switch, tabs, textarea, toast)
- Custom atoms here (safe to modify): `AICreditsGate.jsx`, `EmptyState.jsx`, `IconBadge.jsx`, `LottieAnimation.jsx`, `MobileSelect.jsx`, `PawIllustrations.jsx`, `SkeletonPage.jsx`, `StorysetIllustration.jsx`, `VoiceInput.jsx`

**`src/components/{feature}/`:**
- Purpose: Sub-components for a specific page — never referenced by other pages directly
- Naming: Feature folder matches page name (lowercase): `home/`, `sante/`, `activite/`, `tracker/`, `training/`, `nutrition/`, `notebook/`, `vet/`, `dogprofile/`, `profile/`, `premium/`, `onboarding/`, `achievements/`, `dashboard/`, `scan/`, `notifications/`
- Components named descriptively: `DailyBriefing.jsx`, `NotebookContent.jsx`, `DiagnosisContent.jsx`

**`src/api/`:**
- Purpose: All data access — entity CRUD and backend function calls
- `base44Client.js`: singleton SDK client
- `entities.js`: all entities as named exports — import from here, never from SDK directly

**`src/lib/`:**
- Purpose: App infrastructure — contexts, SDK config, animation presets, utilities
- `animations.js`: single source of truth for all Framer Motion spring presets
- `lottieLibrary.js`: CDN URL registry for ~70 Lottie animations organized by category

**`src/utils/`:**
- Purpose: Pure domain logic — no React, no side effects
- `index.ts`: universal helpers imported everywhere (`createPageUrl`, `getActiveDog`)
- `premium.js`: always use `isUserPremium()` here for premium checks — do not inline

**`base44/functions/{name}/entry.ts`:**
- Purpose: Serverless Deno functions. Each has a single `entry.ts`.
- All 22 functions listed below under "Backend Functions"

## Key File Locations

**Entry Points:**
- `src/App.jsx`: Root component — router and auth wrapper
- `src/pages.config.js`: Page registry (auto-generated, only edit `mainPage`)
- `src/Layout.jsx`: Page layout shell

**Configuration:**
- `vite.config.js`: Build config, `@/` alias pointing to `src/`
- `tailwind.config.js`: Tailwind theme extensions
- `src/index.css`: CSS custom properties (design tokens) — DO NOT EDIT color values
- `src/lib/app-params.js`: Base44 app ID and token resolution

**Core Logic:**
- `src/utils/premium.js`: Premium gate logic
- `src/utils/ai-credits.js`: AI quota management
- `src/components/streakHelper.jsx`: Streak increment (used across pages)
- `src/utils/recommendations.js`: Daily recommendation engine
- `src/utils/healthStatus.js`: Vaccine schedule, health score, age utilities

**Auth:**
- `src/lib/AuthContext.jsx`: Auth provider and `useAuth()` hook
- `src/lib/HomeCacheContext.jsx`: Home cache provider and `useHomeCache()` hook

## Page Inventory (16 pages)

| Page | Route | Load | Tab in BottomNav |
|------|-------|------|-----------------|
| `Home.jsx` | `/` and `/Home` | Eager | Accueil |
| `Sante.jsx` | `/Sante` | Eager | Santé |
| `Activite.jsx` | `/Activite` | Eager | Activité |
| `Nutri.jsx` | `/Nutri` | Eager | Nutrition |
| `Profile.jsx` | `/Profile` | Eager | Profil |
| `Chat.jsx` | `/Chat` | Lazy | (child of Home) |
| `Dashboard.jsx` | `/Dashboard` | Lazy | (child of Profile) |
| `DogProfile.jsx` | `/DogProfile` | Lazy | (child of Profile) |
| `DogPublicProfile.jsx` | `/DogPublicProfile` | Lazy | Public (no auth) |
| `Library.jsx` | `/Library` | Lazy | (child of Profile) |
| `Onboarding.jsx` | `/Onboarding` | Lazy | — |
| `Premium.jsx` | `/Premium` | Lazy | — |
| `Scan.jsx` | `/Scan` | Lazy | — |
| `Training.jsx` | `/Training` | Lazy | — |
| `VetDogView.jsx` | `/VetDogView` | Lazy | Public (no auth) |
| `VetPortal.jsx` | `/VetPortal` | Lazy | (child of Profile) |

## Backend Functions (22 Deno functions)

| Function | Purpose |
|----------|---------|
| `pawcoachChat` | AI chat — quota enforcement, multi-modal (image) support |
| `dailyCheckinProcess` | Process daily check-in, update streak, generate AI response |
| `preDiagnosis` | Step 1 AI diagnosis — collect symptoms |
| `finalDiagnosis` | Step 2 AI diagnosis — generate structured vet-ready report |
| `generateDiagnosisPDF` | Generate PDF from DiagnosisReport entity |
| `stripeCheckout` | Create Stripe Checkout session (monthly/annual) |
| `stripePortal` | Create Stripe customer portal session |
| `stripeWebhook` | Handle Stripe events (checkout.completed, subscription.deleted) |
| `generateTrainingProgram` | AI-generated personalized training program |
| `parseHealthFile` | Parse uploaded health document (OCR/AI extraction) |
| `processHealthInput` | Process health assistant text/voice input |
| `analyzeGrowthPhoto` | AI analysis of dog growth photos |
| `weeklyInsightGenerate` | Generate weekly wellness insight (premium only) |
| `monthlySummary` | Generate monthly summary report |
| `vetAccess` | Manage vet sharing (create/list/revoke access codes) |
| `medicationReminders` | Cron: send medication reminder emails |
| `vaccineReminders` | Cron: send vaccine reminder emails |
| `vetVisitReminders` | Cron: send vet visit reminder emails |
| `walkReminder` | Cron: send walk reminder notifications |
| `streakReminder` | Cron: send streak at-risk reminder |
| `trialExpiryReminder` | Cron: send trial expiry reminder emails |
| `deleteUser` | GDPR user deletion (removes all user data) |

## Naming Conventions

**Files:**
- Pages: `PascalCase.jsx` matching the route key exactly (e.g., `DogProfile.jsx` → `/DogProfile`)
- Components: `PascalCase.jsx` describing the component (e.g., `DailyBriefing.jsx`)
- Utilities: `camelCase.js` or `camelCase.ts` (e.g., `premium.js`, `dateHelpers.js`)
- Backend functions: `camelCase` folder name, always `entry.ts` inside

**Directories:**
- Feature component folders: lowercase matching page context (e.g., `home/`, `sante/`, `tracker/`)
- Lib/util directories: lowercase

**Exports:**
- Components: default export always
- Utilities: named exports
- Entities: named exports from `src/api/entities.js`

## Where to Add New Code

**New page:**
- Create `src/pages/NewPage.jsx`
- Base44 auto-registers it in `pages.config.js` on next sync
- If it needs a BottomNav tab: add to `tabs` array in `src/components/BottomNav.jsx`
- If it's a secondary page under a tab: add to `SECONDARY_PAGE_PARENT` in `src/components/BottomNav.jsx`

**New feature component for an existing page:**
- Add to `src/components/{page-name}/NewComponent.jsx`
- Import in the page file

**New shared UI atom (not shadcn):**
- Add to `src/components/ui/NewAtom.jsx`

**New utility function:**
- Domain logic (premium, health, date): `src/utils/` appropriate file
- App infrastructure (animation, cache): `src/lib/` appropriate file

**New backend function:**
- Create `base44/functions/{functionName}/entry.ts`
- Invoke from frontend: `base44.functions.invoke("{functionName}", payload)`

**New entity:**
- Must be added via Base44 Build prompt (schema change) — NOT via git
- After schema change: add export to `src/api/entities.js`

**New Lottie animation:**
- Add CDN URL to `src/lib/lottieLibrary.js` in appropriate category
- Use via `<LottieAnimation src={LOTTIE.category.name[0]} />`

**New Storyset illustration:**
- Add SVG file to `src/assets/illustrations/storyset/`
- Use via `<StorysetIllustration name="filename-without-extension" />`

## Special Directories

**`src/components/ui/` (shadcn files):**
- Generated: Yes (by shadcn CLI)
- Committed: Yes
- Modification: NEVER modify shadcn primitives. Only modify custom atoms listed above.

**`node_modules/`:**
- Generated: Yes
- Committed: No

**`dist/`:**
- Generated: Yes (Vite build output)
- Committed: No (or gitignored)

**`.planning/`:**
- Generated: No (manual GSD docs)
- Committed: Yes

**`base44/`:**
- Generated: Partially (Base44 syncs function shells)
- Committed: Yes — this is the live backend code

---

*Structure analysis: 2026-03-27*
