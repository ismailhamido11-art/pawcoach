# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
pawcoach/
├── base44/
│   └── functions/          # 22 Deno serverless functions (backend)
│       └── {name}/
│           └── entry.ts    # One entry point per function
├── public/                 # Static PWA assets
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # App icons (various sizes)
├── src/
│   ├── App.jsx             # Root component — routing + providers
│   ├── Layout.jsx          # Page transition wrapper (Framer Motion)
│   ├── api/                # Base44 SDK client + entity wrappers
│   ├── assets/             # Static images and illustrations
│   ├── components/         # All React components (domain + shared)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Context providers, config, shared constants
│   ├── pages/              # 16 route-level page components
│   └── utils/              # Pure helper functions (no UI)
├── .planning/              # GSD planning docs (not deployed)
│   ├── codebase/           # Architecture docs (STACK, ARCH, STRUCTURE, etc.)
│   ├── milestones/         # Archived milestone phases
│   └── phases/             # Audit reports
├── index.html              # Vite entry point
├── vite.config.js          # Vite + Base44 plugin config
├── tailwind.config.js      # Tailwind + design tokens
├── jsconfig.json           # Path aliases (@/ → src/)
├── components.json         # shadcn/ui component config
├── package.json            # Node dependencies
└── eslint.config.js        # ESLint rules
```

## Directory Purposes

**`base44/functions/`:**
- Purpose: All backend logic — one subdirectory per serverless function
- Each function: single `entry.ts` file, `Deno.serve()` handler, standalone with no shared code between functions
- 22 functions total: AI chat, AI analysis, payment processing, cron reminders, GDPR

**`public/`:**
- Purpose: Files served as-is by Vite, not processed by the bundler
- `manifest.json` — PWA install manifest (name, icons, display mode, theme_color)
- `sw.js` — Service worker for offline support and PWA installability
- `icons/` — Multiple icon sizes (48px to 512px) for PWA install prompt

**`src/App.jsx`:**
- Root component: sets up `BrowserRouter`, public routes (`/DogPublicProfile`, `/VetDogView`), and auth-gated routes wrapping `AuthProvider` + `HomeCacheProvider`

**`src/Layout.jsx`:**
- Wraps all authenticated page content with Framer Motion `AnimatePresence` (page transition)
- Applies bottom padding for BottomNav + iOS safe area inset
- Receives `currentPageName` prop to key the transition

**`src/api/`:**
- `base44Client.js` — single Base44 SDK client instance exported as `base44`
- `entities.js` — 19 named entity exports; use these everywhere, never `base44.entities.X` directly

**`src/assets/`:**
- `illustrations/storyset/` — Storyset SVG illustration files used by `StorysetIllustration` component
- `images/` — other static images

**`src/components/`:**
- Root-level files: shared components used across multiple pages (BottomNav, ErrorBoundary, PawLoader, WellnessBanner, ChatFAB, CombinedFAB, PullToRefresh, WellnessBanner, UserNotRegisteredError, PawMascot, streakHelper)
- Domain subdirectories: each maps to a feature area (see Domain Component Directories below)
- `ui/` — shadcn/ui library + custom design primitives (DO NOT MODIFY)

**`src/hooks/`:**
- `useActionCredits.js` — credit state hook (message/action remaining)
- `useBackClose.js` — back-button close for modals
- `useCountUp.js` — animated number counter
- `use-mobile.jsx` — responsive breakpoint detection

**`src/lib/`:**
- Context providers and shared configuration
- `AuthContext.jsx` — user auth state
- `HomeCacheContext.jsx` — Home page data cache (2 min TTL)
- `animations.js` — Framer Motion spring presets
- `app-params.js` — reads Base44 runtime params from URL/localStorage
- `query-client.js` — TanStack Query client instance
- `lottieLibrary.js` — Lottie animation file registry
- `markdown.js` — ReactMarkdown component config (used in Chat, Nutri)
- `PageNotFound.jsx` — 404 fallback page
- `utils.js` — shadcn/ui `cn()` utility (clsx + tailwind-merge)

**`src/pages/`:**
- 16 route-level components, one per page
- Pages own their data fetching logic — no shared data layer
- 5 eager (BottomNav tabs) + 11 lazy-loaded

**`src/utils/`:**
- Pure functions only — no React imports, no side effects beyond `localStorage`/`sessionStorage`
- All cross-page business logic lives here

## Domain Component Directories

**`src/components/home/`** (17 components):
- `CoachHomeHeader.jsx` — top header with user greeting and dog name
- `CalendarStrip.jsx` — horizontal date strip for daily navigation
- `DailyBriefing.jsx` — today's summary card
- `DailyProgress.jsx` — progress rings / metrics
- `StreakBar.jsx` — streak display
- `QuickActions.jsx` — shortcut action buttons
- `WeeklyInsightCard.jsx` — AI-generated weekly insight
- `BentoGrid.jsx` — bento-style grid layout
- `ActiveProgramCards.jsx` — active training program cards
- `TodayCard.jsx` — main today summary card
- `WellnessScore.jsx` — wellness score display
- `InlineCheckin.jsx` — embedded daily check-in
- `DailyCoaching.jsx` — AI coaching tip
- `EmotionalTip.jsx` — emotional wellbeing tip
- `DogRadarHero.jsx` — radar chart of dog metrics
- `TrialExpiryBanner.jsx` — trial expiry countdown banner
- `FirstDayGuide.jsx` — onboarding guide for new users

**`src/components/sante/`** (8 components):
- `NotebookContent.jsx` — health notebook (vaccines, weight, vet visits, medications, notes)
- `DiagnosisContent.jsx` — symptom input and AI diagnosis display
- `GrowthTrackerContent.jsx` — growth chart and entries
- `HealthImportContent.jsx` — document upload and OCR
- `FindVetContent.jsx` — map-based vet finder (lazy-loaded, contains Leaflet ~150KB)
- `HealthAssistantBar.jsx` — floating assistant trigger bar
- `HealthAssistantSheet.jsx` — bottom sheet AI health assistant
- `PlaceCard.jsx` — vet/park place display card

**`src/components/tracker/`** (7 components):
- `WalkMode.jsx` — live walk tracking UI with map and timer
- `WalkMap.jsx` — Leaflet map for walk route
- `WalkSummary.jsx` — post-walk summary card
- `TrackerHistory.jsx` — walk history list
- `ActivityCalendar.jsx` — monthly activity calendar heatmap
- `NearbyParks.jsx` — nearby parks search via Overpass API
- `WalkShareCard.jsx` — shareable walk summary card
- `ParkReviews.jsx` — park review list and form

**`src/components/vet/`** (8 components):
- `AIDiagnosisModal.jsx` — AI diagnosis multi-step modal
- `DiagnosisReportView.jsx` — full diagnosis report display
- `DiagnosisStep2Questions.jsx` — follow-up symptom questions
- `DownloadHealthPDF.jsx` — PDF health report download trigger
- `ShareVetModal.jsx` — generate vet access share link
- `VetDogCard.jsx` — dog card shown in vet portal
- `VetNoteForm.jsx` — vet note creation form
- `VetNotesList.jsx` — vet notes list

**`src/components/nutrition/`** (4 components):
- `NutritionMealPlan.jsx` — AI meal plan display and generation
- `FoodComparator.jsx` — side-by-side food product comparison
- `MealPlanGenerator.jsx` — plan generation UI
- `DietPreferencesPanel.jsx` — dietary preferences settings

**`src/components/training/`** (7 components):
- `JourneyView.jsx` — training journey (program) overview
- `JourneyCard.jsx` — single journey card
- `ExerciseDetail.jsx` — exercise instructions and video
- `VideoCoaching.jsx` — video coaching player
- `CelebrationScreen.jsx` — completion celebration animation
- `MilestoneScreen.jsx` — milestone reached animation
- `FreeExercisesGate.jsx` — paywall gate for premium exercises

**`src/components/activite/`** (3 components):
- `AITrainingProgram.jsx` — AI-generated training program (lazy-loaded)
- `DayCard.jsx` — single training day card
- `CompletionCard.jsx` — day completion display

**`src/components/scan/`** (2 components):
- `LabelScanMode.jsx` — camera capture and label text extraction
- `ShareCard.jsx` — shareable scan result card

**`src/components/dogprofile/`** (9 components):
- `DogProfileHero.jsx` — hero card with dog photo and key info
- `DogIdentityCards.jsx` — identity card grid
- `DogHealthSection.jsx` — health overview section
- `DogDietSection.jsx` — diet preferences section
- `DogPersonalitySection.jsx` — personality and behavior traits
- `DogEditModal.jsx` — dog profile edit modal
- `DogTrophiesRow.jsx` — achievement trophies row
- `InlineEditCard.jsx` — inline field edit card

**`src/components/profile/`** (9 components):
- `ProfileHeader.jsx` — user avatar and name header
- `DogSwitcher.jsx` — multi-dog selector
- `SubscriptionSection.jsx` — subscription status and upgrade CTA
- `CoachSettings.jsx` — AI coach personality settings
- `VetSection.jsx` — veterinarian access management
- `ReferralSection.jsx` — referral link and stats
- `SettingsSection.jsx` — app settings (language, notifications)
- `WalkReminderSettings.jsx` — walk reminder schedule settings
- `AchievementsSection.jsx` — user achievements overview

**`src/components/achievements/`** (2 components):
- `AchievementFeed.jsx` — scrollable achievement unlock feed
- `badgeUtils.jsx` — badge check logic: `checkStreakBadges()`, `checkWalkBadges()`

**`src/components/dashboard/`** (1 component):
- `SmartAlerts.jsx` — intelligent health/activity alerts

**`src/components/onboarding/`** (1 component):
- `WelcomeScreen.jsx` — onboarding welcome animation

**`src/components/premium/`** (2 components):
- `PremiumNudgeSheet.jsx` — soft paywall bottom sheet for feature discovery
- `PostTrialSheet.jsx` — post-trial conversion sheet

**`src/components/notifications/`** (1 component):
- `NotificationCenter.jsx` — notification bell + tray (singleton module state pattern)

**`src/components/illustrations/`** (1 component):
- `Illustration.jsx` — SVG illustration renderer

**`src/components/lib/`** (1 component):
- `markdown.jsx` — ReactMarkdown component map for chat message rendering

## Key File Locations

**Entry Points:**
- `src/App.jsx` — React app root, Router, Providers
- `src/pages.config.js` — route registration and main page declaration
- `index.html` — Vite HTML entry

**Configuration:**
- `vite.config.js` — Vite plugins (Base44, React)
- `tailwind.config.js` — design tokens (colors, fonts, animations)
- `jsconfig.json` — TypeScript/JS config + `@/` path alias
- `components.json` — shadcn/ui configuration
- `eslint.config.js` — linting rules
- `public/manifest.json` — PWA manifest
- `public/sw.js` — Service worker

**Core Logic:**
- `src/api/entities.js` — entity access (all data reads/writes)
- `src/api/base44Client.js` — SDK client (single instance)
- `src/lib/AuthContext.jsx` — authentication state
- `src/utils/premium.js` — premium check logic
- `src/utils/ai-credits.js` — free-tier credit system
- `src/components/streakHelper.jsx` — streak update logic

**Backend:**
- `base44/functions/pawcoachChat/entry.ts` — main AI chat endpoint
- `base44/functions/stripeWebhook/entry.ts` — payment webhook (most critical)
- `base44/functions/stripeCheckout/entry.ts` — checkout session creation
- `base44/functions/deleteUser/entry.ts` — GDPR account deletion

## Naming Conventions

**Files:**
- Pages: PascalCase, `.jsx` — `Home.jsx`, `DogProfile.jsx`, `VetPortal.jsx`
- Components: PascalCase, `.jsx` — `BottomNav.jsx`, `WalkMode.jsx`
- Hooks: camelCase with `use` prefix, `.js` or `.jsx` — `useActionCredits.js`, `useBackClose.jsx`
- Utils: camelCase, `.js` — `premium.js`, `dateHelpers.js`, `ai-credits.js`
- Lib: PascalCase for context files, camelCase for configs — `AuthContext.jsx`, `animations.js`
- Backend: all functions in camelCase directories, each with `entry.ts`

**Directories:**
- Component domains: camelCase — `home/`, `sante/`, `dogprofile/`
- Everything else: kebab-case or lowercase — `base44/functions/`

**Component naming:**
- Domain prefix for clarity — `DogProfileHero` not `Hero`, `WalkMode` not `Mode`
- Content components suffixed with `Content` for tab panel components — `NotebookContent`, `DiagnosisContent`
- Modal/Sheet components suffixed with `Modal` or `Sheet` — `DogEditModal`, `PremiumNudgeSheet`

## Where to Add New Code

**New page:**
1. Create `src/pages/{PageName}.jsx` (PascalCase)
2. Base44 auto-registers it in `src/pages.config.js` on next sync
3. Add `import { lazy }` or eager import manually if needed
4. Add to `SECONDARY_PAGE_PARENT` in `src/components/BottomNav.jsx` if it's a sub-page

**New feature component:**
1. Identify the domain — pick the matching `src/components/{domain}/` directory
2. Create `src/components/{domain}/{ComponentName}.jsx`
3. Import in the relevant page

**New shared component (used by multiple pages/domains):**
- `src/components/{ComponentName}.jsx` (root level, not in a domain folder)

**New utility function:**
1. Check if it belongs in an existing util file (`premium.js`, `dateHelpers.js`, `healthStatus.js`, `recommendations.js`)
2. If it fits, add to existing file
3. If new domain, create `src/utils/{domain}.js`

**New custom hook:**
- `src/hooks/use{Name}.js` — follows `use` prefix convention

**New backend function:**
1. Create `base44/functions/{functionName}/entry.ts`
2. Pattern: `Deno.serve(async (req) => { ... })` with `createClientFromRequest(req)` and `base44.auth.me()` first
3. Always add server-side premium/quota check before AI calls

**New entity (requires Build prompt — rare):**
1. Add via Base44 Build prompt (`edit_base44_app()`)
2. Add `wrapEntity(base44.entities.{NewEntity}, "{NewEntity}")` to `src/api/entities.js`
3. Export the named constant

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow docs — milestones, phases, architecture docs, audit reports
- Generated: Partially (by GSD commands and agents)
- Committed: Yes (planning docs tracked in git)
- NOT deployed: Vite ignores it

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes (`npm run build`)
- Committed: No (in `.gitignore`)

**`node_modules/`:**
- Generated: Yes (`npm install`)
- Committed: No

**`.agents/`:**
- Purpose: Claude Code skill definitions (base44-cli, base44-sdk, base44-troubleshooter)
- Committed: Yes

**`.orchids/`:**
- Purpose: Orchids design tool config
- Committed: Yes

---

*Structure analysis: 2026-03-27*
