# PawCoach — Architecture

Generated: 2026-03-26

---

## Overall Architecture Pattern

PawCoach is a **React 18 SPA (Single Page Application)** built on the Base44 platform.

- **Frontend**: React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Base44 managed backend (Deno serverless functions, no self-hosted server)
- **Data layer**: Base44 SDK (`@base44/sdk`) — entity CRUD + auth + function invocations
- **Deployment**: PWA hosted on Base44 CDN, GitHub 2-way sync on branch `main`
- **Pattern**: component-based, feature-organized, no Redux or Zustand — local `useState` + one global `AuthContext`

---

## Routing

File: `src/pages.config.js`

Base44 uses a **file-based page registry** (not React Router file-system routing). Routes are manually registered in `pages.config.js` and wired into `App.jsx`.

### Route convention
- Each page name becomes its URL path: `"Home"` → `/Home`, `"Activite"` → `/Activite`
- Exception: the `mainPage` (`"Home"`) is also mounted at `/`
- Query params (e.g. `?tab=carnet`) are used for sub-navigation within pages (Sante, Activite, Nutri)
- Deep links: `?tab=vaccine`, `?tab=weight`, etc. for Sante sub-content

### Loading strategy
Pages are split into two groups:

**Eagerly loaded** (in main bundle — always present for BottomNav):
- `Home`, `Activite`, `Nutri`, `Profile`, `Sante`

**Lazy loaded** (React.lazy — loaded on first navigation):
- `Chat`, `Dashboard`, `DogProfile`, `DogPublicProfile`, `Library`, `Onboarding`, `Premium`, `Scan`, `Training`, `VetDogView`, `VetPortal`

### Layout
All pages are wrapped in `Layout.jsx`, which provides:
- `AnimatePresence` with `motion.div` for page transitions (fade)
- `paddingBottom` for BottomNav safe area (`calc(6rem + env(safe-area-inset-bottom, 0px))`)
- `prefers-reduced-motion` support
- Force light mode (dark mode disabled pending QA)

---

## Page List

| Page | URL | Description |
|------|-----|-------------|
| `Home` | `/` and `/Home` | Main dashboard — daily briefing, streak, wellness hero, quick actions, recommendations, active programs |
| `Sante` | `/Sante` | Health hub — 5 sub-tabs: Carnet (notebook), Symptomes (diagnosis), Croissance (growth tracker), Documents (health import), Veto (find vet) |
| `Activite` | `/Activite` | Activity hub — 4 sub-tabs: Balade (walk tracker), Historique (history), Programme (AI training), Dressage (training exercises) |
| `Nutri` | `/Nutri` | Nutrition hub — 5 sub-tabs: Scanner, Plan repas (meal plan), Coach IA (chat), Comparer croquettes, Preferences |
| `Profile` | `/Profile` | User profile — dog switcher, achievements, coach settings, subscription, vet section, walk reminder settings |
| `Chat` | `/Chat` | AI chat assistant — full conversation with PawCoach AI, voice input, message bookmarking, credit system |
| `Dashboard` | `/Dashboard` | Analytics dashboard — health score, weight/walk/scan stats, Recharts graphs, smart alerts |
| `DogProfile` | `/DogProfile` | Dog detail page — identity, health, diet, personality sections, trophies, QR code, edit modal |
| `DogPublicProfile` | `/DogPublicProfile?dogId=xxx` | **Public page (no auth required)** — read-only dog health card for sharing via QR code |
| `Library` | `/Library` | Saved bookmarks — chat responses, nutrition plans, training content, filterable by source |
| `Onboarding` | `/Onboarding` | Multi-step onboarding — goal selection, dog photo, interview steps (10 questions), creates Dog entity + starts trial |
| `Premium` | `/Premium` | Paywall page — segment-personalized hero, feature comparison, Stripe checkout (monthly 7.99 EUR / annual 59.99 EUR) |
| `Scan` | `/Scan` | Food scanner — camera-based ingredient analysis, safety verdict (safe/caution/danger), scan history |
| `Training` | `/Training` | Training exercises — 10 exercises, journey-based progression, free/premium gating, celebration screens |
| `VetDogView` | `/VetDogView?dogId=xxx` | Vet view — authenticated vet sees dog health records, can add notes, view weight/vaccine data |
| `VetPortal` | `/VetPortal` | Vet portal — vet enters access code to link dog patients, manages their list |

---

## Component Hierarchy

### Global Shell
```
App.jsx
  └── AuthProvider (AuthContext)
       └── Router (BrowserRouter)
            └── AuthenticatedApp
                 └── Routes
                      └── LayoutWrapper (Layout.jsx + Suspense)
                           └── ErrorBoundary
                                └── <Page />
```

### Layout Layer (present on every page)
- `Layout.jsx` — page transition wrapper (AnimatePresence + motion.div)
- `BottomNav.jsx` — 5-tab navigation fixed at bottom (Home, Sante, Activite, Nutri, Profil)
- `WellnessBanner.jsx` — fixed top disclaimer banner ("PawCoach n'est pas un vétérinaire")
- `ChatFAB.jsx` — floating action button linking to Chat page
- `CombinedFAB.jsx` — floating quick-log sheet (weight, walk, water, notes)
- `PullToRefresh.jsx` — touch gesture refresh wrapper

### Shared UI Components (`src/components/ui/`)
| Component | Purpose |
|-----------|---------|
| `EmptyState.jsx` | Reusable empty state with mascot/illustration/Lottie support |
| `SkeletonPage.jsx` | Loading skeletons (hero variant, list variant, tabs variant) |
| `LottieAnimation.jsx` | Dotlottie player with reduced-motion + error fallback |
| `StorysetIllustration.jsx` | 23 bundled SVG illustrations from Storyset (recolored #1A4D3E) |
| `PawIllustrations.jsx` | 20+ custom SVG dog mascots (DogWave, DogChat, DogDoctor, etc.) |
| `AICreditsGate.jsx` | `CreditBadge` + `UpgradePrompt` for free tier limits |
| `VoiceInput.jsx` | Web Speech API voice dictation button (fr-FR) |
| `IconBadge.jsx` | Colored icon badge wrapper |
| `MobileSelect.jsx` | Mobile-optimized select sheet |
| `shadcn/ui/*` | 40+ base UI primitives (button, card, dialog, sheet, tabs, etc.) — DO NOT MODIFY |

### Feature Component Groups
Each feature has its own subdirectory in `src/components/`:

| Directory | Feature | Key Components |
|-----------|---------|----------------|
| `home/` | Home page sections | `CoachHomeHeader`, `CalendarStrip`, `DailyBriefing`, `DailyProgress`, `HomeWellnessHero`, `WeeklyInsightCard`, `TrialExpiryBanner`, `FirstDayGuide`, `EmotionalTip`, `ContentArticles`, `ActiveProgramCards`, `StreakBar`, `QuickActions` |
| `sante/` | Health sub-pages | `NotebookContent`, `DiagnosisContent`, `GrowthTrackerContent`, `HealthImportContent`, `FindVetContent`, `HealthAssistantBar`, `HealthAssistantSheet` |
| `activite/` | Activity sections | `AITrainingProgram`, `SmartAlerts` |
| `nutrition/` | Nutrition sections | `NutritionMealPlan`, `FoodComparator`, `DietPreferencesPanel` |
| `dogprofile/` | Dog profile sections | `DogProfileHero`, `DogIdentityCards`, `DogHealthSection`, `DogDietSection`, `DogPersonalitySection`, `DogTrophiesRow`, `DogEditModal`, `InlineEditCard` |
| `training/` | Training UI | `ExerciseDetail`, `JourneyCard`, `JourneyView`, `CelebrationScreen`, `MilestoneScreen`, `FreeExercisesGate`, `VideoCoaching` |
| `tracker/` | Walk tracker | `WalkMode`, `WalkMap`, `TrackerHistory`, `ActivityCalendar`, `NearbyParks`, `ParkReviews`, `WalkShareCard` |
| `premium/` | Paywall sheets | `PremiumNudgeSheet`, `PostTrialSheet` |
| `profile/` | Profile sections | `ProfileHeader`, `DogSwitcher`, `CoachSettings`, `VetSection`, `SubscriptionSection`, `ReferralSection`, `SettingsSection`, `WalkReminderSettings`, `AchievementsSection` |
| `vet/` | Vet features | `AIDiagnosisModal`, `DiagnosisReportView`, `DiagnosisStep2Questions`, `DownloadHealthPDF`, `ShareVetModal`, `VetDogCard`, `VetNoteForm`, `VetNotesList` |
| `scan/` | Food scan UI | `ShareCard` |
| `achievements/` | Badges system | `AchievementFeed`, `badgeUtils.jsx` |
| `onboarding/` | Onboarding step | `WelcomeScreen` |
| `notifications/` | In-app alerts | `NotificationCenter` |
| `notebook/` | Health records | `HealthScoreCard`, `NextActionCard`, `PremiumSection`, `QRCodeCard`, `SectionPoids`, `SectionVaccins`, `SmartHealthAssistant`, `StatusPills`, `UpcomingReminders`, `VaccineCard`, `WeightCard` |
| `dashboard/` | Dashboard widgets | `BentoGrid`, `DailyCoaching`, `DogRadarHero`, `WellnessScore`, `InlineCheckin`, `TodayCard` |
| `reminders/` | Reminder UI | (reminder-related components) |
| `illustrations/` | CDN illustrations | `Illustration.jsx` (GitHub CDN SVGs) |
| `lib/` | Component-level utils | `markdown.jsx` (React Markdown renderer) |
| `hooks/` | Component-level hooks | `useBackClose.jsx` (back-gesture modal close) |

### Standalone Components
| Component | Purpose |
|-----------|---------|
| `BottomNav.jsx` | Main 5-tab navigation |
| `ChatFAB.jsx` | Floating chat button |
| `CombinedFAB.jsx` | Quick-log floating action |
| `ErrorBoundary.jsx` | React error boundary |
| `PawLoader.jsx` | Full-screen app loader (animated paw prints) |
| `PawMascot.jsx` | JPG-based mascot (10 moods: happy, curious, sleepy, etc.) |
| `PullToRefresh.jsx` | Touch pull-to-refresh gesture |
| `UserNotRegisteredError.jsx` | Error for unregistered users |
| `WellnessBanner.jsx` | Top disclaimer banner |
| `streakHelper.jsx` | Streak update logic (not a React component — utility function) |

---

## State Management

PawCoach uses **no global state library**. State management is:

### 1. AuthContext (single global context)
File: `src/lib/AuthContext.jsx`
- Provides: `user`, `isAuthenticated`, `isLoadingAuth`, `isLoadingPublicSettings`, `authError`, `appPublicSettings`, `logout()`, `navigateToLogin()`, `checkAppState()`
- Used in pages via `useAuth()` hook
- Handles: auth check on mount, error states (user_not_registered, auth_required)

### 2. Page-level local state
Each page manages its own state with `useState` and `useEffect`.
Pattern:
```jsx
const [user, setUser] = useState(null);
const [dog, setDog] = useState(null);
const [loading, setLoading] = useState(true);
// Load on mount
useEffect(() => { load(); }, []);
const load = async () => { ... }
```

### 3. URL state (sub-tab navigation)
Pages with sub-tabs (Sante, Activite, Nutri) use `useSearchParams` to persist active tab in the URL:
- `?tab=carnet` / `?tab=malade` / etc.
- Tab state is also saved to `sessionStorage` (`tab_Sante`, `tab_Activite`, `tab_Nutri`) to survive page switches

### 4. localStorage (persistent cross-session)
- `activeDogId` — which dog is currently active (set by DogSwitcher, read everywhere)
- `pawcoach_analytics_events` — analytics event log
- `pawcoach_read_notifs` — read notification IDs
- `base44_*` — Base44 SDK app params (token, app_id, etc.)

### 5. sessionStorage (within-session navigation)
- `scroll_<PageName>` — saved scroll position per page
- `tab_<PageName>` — saved active sub-tab per page (Sante/Activite/Nutri)
- `journey_<PageName>` / `exercise_<PageName>` — Training navigation stack

### 6. TanStack Query (QueryClient)
File: `src/lib/query-client.js`
- Configured with `refetchOnWindowFocus: false`, `retry: 1`
- Used sparingly — most data fetching is done with plain async/await in `useEffect`

---

## Data Flow

```
Base44 Platform (managed backend)
    │
    ▼
@base44/sdk (base44Client.js)
    │
    ├─ base44.auth.me()           → current user object
    ├─ base44.auth.updateMe()     → update user fields (credits, etc.)
    ├─ base44.entities.<Entity>   → CRUD on data entities
    │   ├─ .filter(query, sort, limit)
    │   ├─ .create(data)
    │   ├─ .update(id, data)
    │   └─ .delete(id)
    └─ base44.functions.invoke()  → call Deno backend functions

    ▼
Page component (useState + useEffect)
    │
    ├─ user state
    ├─ dog state  (from getActiveDog(dogs) utility)
    ├─ domain data states
    └─ loading/error states

    ▼
Feature components (receive props)
    │
    └─ Render UI with Tailwind + shadcn/ui + Framer Motion
```

### Key data entities (used across pages):
- `Dog` — dog profile (owner, name, breed, age, weight, etc.)
- `DailyCheckin` — daily wellness check-in
- `DailyLog` — quick log (walk, weight, water, notes)
- `Streak` — current/longest streak tracking
- `HealthRecord` — vaccine, vet visit, medication, weight, notes
- `FoodScan` — food scan history
- `UserProgress` — training exercise progress
- `DiagnosisReport` — AI diagnosis reports
- `NutritionPlan` — AI-generated meal plans
- `Bookmark` — saved AI responses
- `DogAchievement` — unlocked badges
- `GrowthEntry` — growth/weight measurements over time

---

## Layout System

### Page structure pattern (most pages):
```jsx
<>
  <WellnessBanner />          {/* fixed top disclaimer */}
  <BottomNav currentPage="..." />  {/* fixed bottom nav */}

  <PullToRefresh onRefresh={load}>
    <div className="min-h-screen pt-[safe-area + banner] pb-24">
      {/* Hero header (gradient-primary) */}
      {/* Tab bar (horizontal scroll) */}
      {/* Content panels (AnimatePresence tab transitions) */}
    </div>
  </PullToRefresh>

  {/* FABs */}
  <ChatFAB />
  {/* or */}
  <CombinedFAB />
</>
```

### CSS variables (from `src/index.css`):
- `--primary`: forest green HSL(160 50% 22%) = #1A4D3E
- `--accent`: emerald HSL(162 55% 42%) = #2D9F82
- `--background`: cream HSL(37 33% 95%)
- `--foreground`, `--muted`, `--card`, `--border`, etc.
- Custom classes: `gradient-primary` (linear from --primary to --accent), `safe-pt-14` (safe area top)

### Safe area handling:
- Top padding: `env(safe-area-inset-top)` via CSS utilities
- Bottom padding: `calc(6rem + env(safe-area-inset-bottom, 0px))` for BottomNav

---

## Key Architectural Decisions

### 1. Base44 platform dependency
All auth, data storage, and serverless execution goes through the Base44 SDK. No custom server. Entity schema changes require Build prompts (cost 1 credit each), code changes are free via Git.

### 2. Split loading strategy
5 main-tab pages are eagerly loaded for instant BottomNav response. All secondary pages are lazy-loaded.

### 3. URL-based sub-tab navigation
Sante, Activite, and Nutri store active tab in URL params (`?tab=...`). This enables deep linking, browser back button between sub-tabs, and sessionStorage persistence for cross-tab return.

### 4. Credit system (free tier gating)
- Free users: 10 messages/day, 3 AI actions/day
- Premium: unlimited
- Credits stored on the user entity: `messages_remaining`, `actions_remaining`, `messages_daily_reset`, `actions_daily_reset`
- `isUserPremium()` checks `user.is_premium || (trial_expires_at && trial not expired)`
- `AICreditsGate` components wrap gated features

### 5. No Redux/Zustand
State is kept local to pages. Cross-page state uses: URL params (tab state), localStorage (active dog, analytics), sessionStorage (scroll + tab positions), and the single AuthContext.

### 6. Streak system with grace days
Logic in `streakHelper.jsx` — 1 grace day allowed (misses 1 day without breaking streak). Streak entity stored in Base44 with `current_streak`, `longest_streak`, `last_activity_date`, `grace_days_remaining`.

### 7. Badge/achievement system
`badgeUtils.jsx` — client-side badge check after user actions. Badges stored as `DogAchievement` entities. Points threshold badges auto-checked when points change.

### 8. Analytics (localStorage-based)
`trackEvent()` stores last 100 events in localStorage. No third-party analytics service yet.

### 9. Public pages (no auth)
`DogPublicProfile` — accessible without login. Loads via `base44.entities` directly with a `dogId` query param. Designed for QR code sharing.

### 10. Vet access system
Vets get access via invite codes. `VetPortal` lets vets enter codes. `vetAccess` Deno function validates and manages permissions. `VetDogView` shows dog data to authorized vets only.
