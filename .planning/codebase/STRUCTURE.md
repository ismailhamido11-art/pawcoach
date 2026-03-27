# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
pawcoach/
├── src/                         # All frontend source code
│   ├── main.jsx                 # App bootstrap + PWA SW registration
│   ├── App.jsx                  # Router root + auth/public split
│   ├── Layout.jsx               # Page transition wrapper + bottom-nav padding
│   ├── pages.config.js          # Route registry (auto-generated, only change mainPage)
│   ├── index.css                # Design tokens (colors, typography — DO NOT MODIFY)
│   ├── pages/                   # One file per route (17 pages)
│   ├── components/              # Feature components + shared UI
│   │   ├── ui/                  # shadcn/ui primitives (NEVER modify)
│   │   ├── achievements/        # Badge system
│   │   ├── activite/            # Activity + walk program components
│   │   ├── dashboard/           # SmartAlerts
│   │   ├── dogprofile/          # Dog profile sections
│   │   ├── home/                # Home page blocks
│   │   ├── hooks/               # Component-scoped hooks (legacy — prefer src/hooks/)
│   │   ├── illustrations/       # PawMascot SVG illustration system
│   │   ├── lib/                 # Markdown renderer
│   │   ├── notebook/            # Health notebook sub-components
│   │   ├── notifications/       # NotificationCenter
│   │   ├── nutrition/           # Nutrition plan components
│   │   ├── onboarding/          # Welcome screen
│   │   ├── premium/             # Premium nudge sheets
│   │   ├── profile/             # Profile page sections
│   │   ├── reminders/           # Reminder components
│   │   ├── sante/               # Health page tab contents
│   │   ├── scan/                # Food scan share card
│   │   ├── tracker/             # Walk tracker components
│   │   ├── training/            # Training exercise components
│   │   └── vet/                 # Vet portal components
│   ├── api/
│   │   ├── base44Client.js      # Base44 SDK client (singleton)
│   │   └── entities.js          # Named entity exports (19 entities)
│   ├── hooks/                   # App-level custom hooks
│   │   ├── use-mobile.jsx       # Breakpoint detection
│   │   ├── useActionCredits.js  # AI action credit state + consume()
│   │   ├── useBackClose.js      # Android back button handler
│   │   ├── useCountUp.js        # Animated counter
│   │   └── useReducedMotion.js  # Prefers-reduced-motion
│   ├── lib/
│   │   ├── AuthContext.jsx      # Auth state provider + useAuth()
│   │   ├── HomeCacheContext.jsx # 2-min TTL home data cache
│   │   ├── animations.js        # Framer Motion spring presets
│   │   ├── app-params.js        # Runtime Base44 app parameters
│   │   ├── lottieLibrary.js     # Lottie animation CDN registry
│   │   ├── markdown.js          # Markdown parser
│   │   ├── query-client.js      # (Present but unused — no React Query)
│   │   └── utils.js             # cn() className helper (tailwind-merge)
│   └── utils/
│       ├── index.ts             # createPageUrl(), getActiveDog()
│       ├── ai-credits.js        # Credit init/consume, daily limits
│       ├── analytics.js         # trackEvent() wrapper
│       ├── chartHelpers.jsx     # CustomTooltip for Recharts
│       ├── dateHelpers.js       # Date formatting, age, JOURS_COURTS, MOIS_FR
│       ├── healthStatus.js      # Health score computation, dogAgeMonths()
│       ├── overpass.js          # Overpass API for nearby vets/parks
│       ├── premium.js           # isUserPremium(), isUserOnTrial(), getTrialDaysLeft()
│       ├── programHelpers.js    # ACTIVITY_ICONS map for training programs
│       └── recommendations.js  # buildRecommendations(), getTodayString()
├── base44/
│   └── functions/               # 22 Deno backend functions
│       ├── dailyCheckinProcess/ # Process check-in, update streak
│       ├── generateTrainingProgram/ # AI training program generation
│       ├── pawcoachChat/        # Chat AI response
│       ├── finalDiagnosis/      # AI symptom diagnosis
│       ├── preDiagnosis/        # Pre-diagnosis questions
│       ├── weeklyInsightGenerate/ # Weekly wellness insight
│       ├── monthlySummary/      # Monthly wellness summary
│       ├── parseHealthFile/     # Health document OCR/parsing
│       ├── processHealthInput/  # Health record creation
│       ├── analyzeGrowthPhoto/  # Growth photo analysis
│       ├── generateDiagnosisPDF/ # PDF export
│       ├── stripeCheckout/      # Stripe checkout session
│       ├── stripePortal/        # Stripe customer portal
│       ├── stripeWebhook/       # Stripe webhook (set is_premium)
│       ├── vaccineReminders/    # Scheduled vaccine reminders
│       ├── walkReminder/        # Scheduled walk reminders
│       ├── vetVisitReminders/   # Scheduled vet visit reminders
│       ├── medicationReminders/ # Scheduled medication reminders
│       ├── streakReminder/      # Streak loss warning
│       ├── trialExpiryReminder/ # Trial ending notification
│       ├── vetAccess/           # Vet share link token
│       └── deleteUser/          # GDPR user deletion
├── .planning/
│   └── codebase/                # GSD codebase analysis docs
├── dist/                        # Build output (generated, not committed)
└── pages.config.js              # Root alias (symlink/copy of src/pages.config.js)
```

## Pages — Complete List

| Page file | Route | Bundle | Description |
|---|---|---|---|
| `Home.jsx` | `/` and `/Home` | Eager | Dashboard, check-in, daily briefing |
| `Activite.jsx` | `/Activite` | Eager | Walk tracker, history, AI program, training |
| `Sante.jsx` | `/Sante` | Eager | Health notebook, symptoms, growth, docs, find vet |
| `Nutri.jsx` | `/Nutri` | Eager | Nutrition scan history, meal plans, diet prefs |
| `Profile.jsx` | `/Profile` | Eager | Settings, subscription, achievements, referral |
| `Chat.jsx` | `/Chat` | Lazy | AI chat with PawCoach |
| `Dashboard.jsx` | `/Dashboard` | Lazy | Analytics dashboard (premium) |
| `DogProfile.jsx` | `/DogProfile` | Lazy | Dog identity, health, personality cards |
| `DogPublicProfile.jsx` | `/DogPublicProfile` | Lazy + Public | Public shareable dog profile |
| `Library.jsx` | `/Library` | Lazy | Article library with bookmarks |
| `LabelScanMode.jsx` | `/LabelScanMode` | — | Food label scanner (extracted from Scan) |
| `Onboarding.jsx` | `/Onboarding` | Lazy | First-run dog setup wizard |
| `Premium.jsx` | `/Premium` | Lazy | Paywall and Stripe checkout |
| `Scan.jsx` | `/Scan` | Lazy | Food scan (camera + label mode) |
| `Training.jsx` | `/Training` | Lazy | Exercise library + journey view |
| `VetDogView.jsx` | `/VetDogView` | Lazy + Public | Vet-facing dog health summary |
| `VetPortal.jsx` | `/VetPortal` | Lazy | Owner vet access management |

Note: `LabelScanMode.jsx` is in `src/pages/` but is NOT registered in `pages.config.js` — it is used as a component imported directly by `Scan.jsx`.

## Backend Functions — Complete List (22)

All at `base44/functions/{name}/entry.ts`:

**AI / Data Processing:**
- `dailyCheckinProcess` — processes daily check-in, updates streak, returns AI response
- `generateTrainingProgram` — generates 7-day AI activity program
- `pawcoachChat` — streaming AI chat response
- `finalDiagnosis` — AI diagnosis from symptoms
- `preDiagnosis` — follow-up questions for diagnosis
- `weeklyInsightGenerate` — weekly wellness insight generation
- `monthlySummary` — monthly summary report
- `parseHealthFile` — OCR/parse uploaded health documents
- `processHealthInput` — create health records from parsed data
- `analyzeGrowthPhoto` — analyze growth photo for size estimation
- `generateDiagnosisPDF` — export diagnosis as PDF

**Payments:**
- `stripeCheckout` — create Stripe checkout session
- `stripePortal` — open Stripe billing portal
- `stripeWebhook` — handle Stripe events, set `is_premium` on user

**Scheduled Reminders:**
- `vaccineReminders` — upcoming vaccine due alerts
- `walkReminder` — daily walk reminder
- `vetVisitReminders` — upcoming vet visit alerts
- `medicationReminders` — medication schedule alerts
- `streakReminder` — warn user before streak breaks
- `trialExpiryReminder` — notify trial ending soon

**Misc:**
- `vetAccess` — generate/validate vet share token
- `deleteUser` — GDPR user account deletion

## Entities — Complete List (19)

All accessed via `src/api/entities.js`:

| Entity | Purpose |
|---|---|
| `Dog` | Core dog profile |
| `HealthRecord` | Vet visits, vaccines, medications |
| `DailyCheckin` | Daily mood/energy/appetite check-ins |
| `DailyLog` | Walk minutes, activities logged per day |
| `Streak` | Current + longest streak per dog |
| `FoodScan` | Scanned food items with AI verdict |
| `UserProgress` | Training exercise completion |
| `DiagnosisReport` | AI diagnosis sessions |
| `NutritionPlan` | Generated meal plans |
| `Bookmark` | Saved training exercises + behavior programs |
| `WeeklyInsight` | AI-generated weekly wellness insights |
| `SharedVetAccess` | Vet share access tokens |
| `DogAchievement` | Earned badges/achievements |
| `DietPreferences` | Dog dietary preferences and restrictions |
| `GrowthEntry` | Weight/size tracking entries |
| `ParkReview` | User reviews for parks |
| `PlaceFavorite` | Favorited parks/vets |
| `ChatMessage` | Chat history |
| `VetNote` | Notes added by vet via VetPortal |

## Key File Locations

**Entry Points:**
- `src/main.jsx` — app bootstrap
- `src/App.jsx` — router + auth split
- `src/pages.config.js` — page registry (change `mainPage` here)

**Core Utilities:**
- `src/utils/index.ts` — `createPageUrl()`, `getActiveDog()`
- `src/utils/premium.js` — `isUserPremium()`, `isUserOnTrial()`, `getTrialDaysLeft()`
- `src/utils/ai-credits.js` — credit limits and daily reset logic
- `src/utils/dateHelpers.js` — French date formatting, `JOURS_COURTS`, `MOIS_FR`, `getAge()`
- `src/utils/programHelpers.js` — `ACTIVITY_ICONS` map (used by AITrainingProgram + ActiveProgramCards)
- `src/utils/chartHelpers.jsx` — `CustomTooltip` for Recharts charts

**Contexts:**
- `src/lib/AuthContext.jsx` — `useAuth()` hook
- `src/lib/HomeCacheContext.jsx` — `useHomeCache()` hook

**Animation:**
- `src/lib/animations.js` — Framer Motion spring presets (`spring`, `tapScale`, `pressIn`, `hoverGlow`, `fadeInUp`, `staggerContainer`, `staggerItem`)

**Design System:**
- `src/index.css` — CSS custom properties (DO NOT MODIFY colors/tokens)
- `src/lib/utils.js` — `cn()` className merger (tailwind-merge + clsx)

**API:**
- `src/api/base44Client.js` — Base44 SDK singleton
- `src/api/entities.js` — all 19 entity exports

## Naming Conventions

**Files:**
- Pages: PascalCase, no suffix — `Home.jsx`, `Activite.jsx`
- Components: PascalCase, descriptive — `DailyBriefing.jsx`, `WalkSummary.jsx`
- Hooks: camelCase with `use` prefix — `useActionCredits.js`, `useBackClose.js`
- Utils: camelCase — `dateHelpers.js`, `programHelpers.js`, `chartHelpers.jsx`
- Contexts: PascalCase with `Context` suffix — `AuthContext.jsx`, `HomeCacheContext.jsx`

**Directories:**
- Feature component folders: lowercase, matches domain — `home/`, `tracker/`, `sante/`, `nutrition/`
- Pages folder: lowercase `pages/`

**Components:**
- React components: PascalCase function names
- Named exports for constants/utilities, default export for the main component of a file

## Where to Add New Code

**New page:**
- Create `src/pages/NewPage.jsx`
- Base44 auto-registers it in `pages.config.js` on next sync (or add manually)
- Change `mainPage` in `pages.config.js` only if it should be the new landing

**New feature component:**
- If domain-specific: `src/components/{domain}/ComponentName.jsx` (e.g., `src/components/sante/NewCard.jsx`)
- If shared across 2+ domains: `src/components/ComponentName.jsx` (root of components)
- If shared UI primitive (not shadcn): `src/components/ui/ComponentName.jsx`

**New utility function:**
- Date/time: add to `src/utils/dateHelpers.js`
- Training/activity display: add to `src/utils/programHelpers.js`
- Chart/data viz: add to `src/utils/chartHelpers.jsx`
- Premium checks: add to `src/utils/premium.js`
- Generic: `src/utils/index.ts` or a new file with a descriptive name

**New backend function:**
- Create `base44/functions/{functionName}/entry.ts`
- Call from frontend: `base44.functions.invoke("functionName", payload)`

**New custom hook:**
- App-level (used across pages): `src/hooks/useHookName.js`
- Component-scoped: `src/components/hooks/useHookName.jsx` (legacy location — prefer `src/hooks/`)

**New entity:**
- Schema change must go through Base44 Build prompt (uses 1 credit)
- After schema change: add named export to `src/api/entities.js`

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui component library
- Generated: Yes (via shadcn CLI)
- Committed: Yes
- NEVER modify files in this directory

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes
- Committed: No (gitignored)

**`base44/functions/`:**
- Purpose: Deno serverless functions deployed on Base44
- Generated: No
- Committed: Yes — synced to Base44 via GitHub 2-way sync

**`.planning/`:**
- Purpose: GSD planning documents (milestones, phases, codebase analysis)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-27*
