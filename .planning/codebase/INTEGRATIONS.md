# PawCoach — Integrations & External Services Reference

> Generated: 2026-03-26
> Source of truth: `src/api/`, `src/lib/AuthContext.jsx`, `base44/functions/`, `src/utils/`

---

## Platform: Base44

**App ID**: `699f971349f7fa56a125f672`
**Production URL**: `https://paw-coach-care.base44.app`
**Repo**: `github.com/ismailhamido11-art/pawcoach` (branch `main`)

Base44 is the managed platform that:
- Hosts and serves the Vite build
- Provides auth (token-based, managed login page)
- Provides the entity database (CRUD API)
- Runs the Deno backend functions
- Provides Core integrations (LLM, file upload, email)

---

## Base44 SDK

### Frontend SDK
- Package: `@base44/sdk` v0.8.0 (package.json) / v0.8.20 (installed)
- Client singleton: `src/api/base44Client.js`
- Initialization: `createClient({ appId, token, functionsVersion, requiresAuth: true })`
- Runtime params resolved from URL query params or localStorage via `src/lib/app-params.js`

**Key env vars read by app-params.js**:
- `VITE_BASE44_APP_ID`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `VITE_BASE44_APP_BASE_URL`

### Backend SDK (Deno)
- Import: `npm:@base44/sdk@0.8.20` (pinned)
- Pattern: `const base44 = createClientFromRequest(req)` — user-scoped client from HTTP request
- `base44.asServiceRole` — elevated access for scheduled/webhook functions

---

## Authentication

**Provider**: Base44 managed auth (token-based)
**Flow**:
1. App loads → checks app public settings via `/api/apps/public`
2. If `access_token` in URL/localStorage → validate via `base44.auth.me()`
3. If `auth_required` error → auto-redirect to Base44 login page
4. Token stored in localStorage as `base44_access_token`

**Auth methods used**:
- `base44.auth.me()` — get current user
- `base44.auth.logout(redirectUrl?)` — logout + optional redirect
- `base44.auth.redirectToLogin(returnUrl)` — redirect to login
- `base44.auth.isAuthenticated()` — check auth status (used in VetPortal)
- `base44.auth.updateMe({ referred_by })` — update user profile

**Auth state**: managed by `src/lib/AuthContext.jsx` (`AuthProvider` + `useAuth` hook).

---

## Database / Entity Layer

All data access goes through `base44.entities.<EntityName>` CRUD methods.

### CRUD Methods
```js
base44.entities.Dog.list()
base44.entities.Dog.filter({ owner: email })
base44.entities.Dog.create({ ... })
base44.entities.Dog.update(id, { ... })
base44.entities.Dog.delete(id)
```

### Entities Referenced in Frontend

| Entity | Usage |
|--------|-------|
| `Dog` | Core entity — profile, breed, birth date, weight, owner |
| `HealthRecord` | Vaccines, vet visits, medications, weight entries |
| `DailyCheckin` | Daily mood/energy/appetite check-ins |
| `DailyLog` | Walk logs (minutes, distance, GPS data) |
| `Streak` | Streak tracking per dog |
| `NutritionPlan` | AI-generated meal plans |
| `DietPreferences` | Dog diet preferences (budget, brands, restrictions) |
| `Bookmark` | Saved training programs |
| `GrowthEntry` | Weight/height growth tracking entries |
| `DiagnosisReport` | AI diagnosis reports saved per dog |
| `VetNote` | Veterinary consultation notes |
| `PlaceFavorite` | Bookmarked vet/park locations |
| `User` | User profile (premium status, credits, trial, Stripe IDs) |

### Key User Entity Fields
- `is_premium` — boolean, premium access gate
- `trial_expires_at` — ISO date string
- `actions_remaining` — daily AI action credits (free tier: 3/day)
- `actions_daily_reset` — last reset date
- `stripe_customer_id` — Stripe customer reference
- `stripe_subscription_id` — active Stripe subscription
- `walk_reminder_enabled` / `walk_reminder_time` — reminder preferences
- `email_notifications` — notification preferences
- `referred_by` — referral code

---

## Base44 Core Integrations

Base44 provides built-in integrations accessible as `base44.integrations.Core.*`.

### InvokeLLM — AI Text & Vision
Used for: nutrition advice, scan results, vet search, food comparator, training labels, achievement generation.

```js
await base44.integrations.Core.InvokeLLM({
  prompt: "...",
  response_json_schema: { ... }, // structured output
  add_context_from_entities: ["Dog", "HealthRecord"] // optional context injection
})
```

**Frontend callers** (partial list):
- `Nutri.jsx` — nutrition AI chat (also calls `pawcoachChat` backend function)
- `Scan.jsx` — food label scanning
- `components/sante/FindVetContent.jsx` — AI vet search
- `components/nutrition/FoodComparator.jsx` — food brand comparison
- `components/activite/AITrainingProgram.jsx` — training program generation (also calls `generateTrainingProgram` function)

### UploadFile — File / Image Storage
Files stored on Base44 managed storage (S3-backed, URLs end in `amazonaws.com` or `base44.app`).

```js
const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObject })
```

**Frontend callers**:
- `src/pages/Chat.jsx` — upload image for AI chat
- `src/components/vet/AIDiagnosisModal.jsx` — upload photo for diagnosis
- `src/components/sante/GrowthTrackerContent.jsx` — upload photo for AI growth analysis
- `src/components/training/VideoCoaching.jsx` — upload video for coaching analysis
- Multiple components for dog profile photos and health records

### SendEmail — Transactional Email
Used by backend functions only (via `base44.asServiceRole.integrations.Core.SendEmail`).

```js
await base44.asServiceRole.integrations.Core.SendEmail({
  to: user.email,
  from_name: "PawCoach",
  subject: "...",
  body: "..."
})
```

---

## Stripe — Payments

**Version**: `npm:stripe@17.3.1` (Deno backend), `@stripe/stripe-js` v5.10.0 + `@stripe/react-stripe-js` v3.0.0 (frontend)

**Environment variables** (backend):
- `STRIPE_SECRET_KEY` — server-side secret key
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification

**Price IDs** (hardcoded in `src/pages/Premium.jsx`):
- Monthly: `price_1T4tkFDuhaIxY4PGpnhDTx5L` (7.99 EUR/month)
- Annual: `price_1T4tkFDuhaIxY4PGWLeWApDL` (59.99 EUR/year)

**Backend functions**:

| Function | Purpose |
|----------|---------|
| `stripeCheckout` | Create Stripe Checkout session, returns session URL |
| `stripePortal` | Create Stripe Billing Portal session for subscription management |
| `stripeWebhook` | Handle Stripe webhook events (`checkout.session.completed`, `customer.subscription.*`, `invoice.*`) — updates `User.is_premium`, `stripe_customer_id`, `stripe_subscription_id` |
| `deleteUser` | Cancels Stripe subscription (best-effort) before deleting user data |

**Frontend flow**:
- `src/pages/Premium.jsx` → calls `stripeCheckout` function → redirects to Stripe Checkout URL
- `src/components/profile/SubscriptionSection.jsx` → calls `stripePortal` function → redirects to Stripe Billing Portal

---

## OpenRouter — AI LLM API

**Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
**Environment variable**: `OPENROUTER_API_KEY` (backend only)
**Used by**: Backend functions that need more control than `InvokeLLM` provides

**Models in use**:
- `deepseek/deepseek-chat` — default for most AI functions
- `openai/gpt-4o` — fallback/vision in `pawcoachChat` (image analysis)

**Backend functions using OpenRouter directly**:
- `pawcoachChat` — main AI chat, supports vision via GPT-4o
- `dailyCheckinProcess` — generate personalized insights from check-in data
- `weeklyInsightGenerate` — weekly AI summary per dog

**Other functions use `base44.integrations.Core.InvokeLLM`** (which proxies through Base44's own LLM routing):
- `analyzeGrowthPhoto`, `finalDiagnosis`, `generateTrainingProgram`, `parseHealthFile`, `preDiagnosis`, `processHealthInput`

---

## Backend Functions — Complete List

All functions in `base44/functions/`. Runtime: Deno. Entry: `entry.ts`. SDK: `@base44/sdk@0.8.20`.

### AI / LLM Functions (user-triggered, quota-gated)

| Function | Trigger | LLM | Purpose | Premium gate |
|----------|---------|-----|---------|-------------|
| `pawcoachChat` | Frontend `base44.functions.invoke()` | OpenRouter (deepseek + gpt-4o for vision) | Main AI chat assistant, multi-modal | 3 actions/day free, unlimited premium |
| `dailyCheckinProcess` | Frontend (Home check-in) | OpenRouter deepseek | Process mood/energy/appetite + generate insight | No LLM limit, but updates credits |
| `preDiagnosis` | Frontend (Diagnosis modal) | Base44 InvokeLLM | Pre-diagnosis triage + follow-up questions | 3 actions/day |
| `finalDiagnosis` | Frontend (Diagnosis modal) | Base44 InvokeLLM | Full AI diagnosis with PDF generation | 3 actions/day |
| `generateDiagnosisPDF` | Frontend (Diagnosis modal) | None (jsPDF) | Generate PDF from diagnosis data | No credit cost |
| `analyzeGrowthPhoto` | Frontend (Growth tracker) | Base44 InvokeLLM | Analyze weight/body condition from photo | 3 actions/day |
| `parseHealthFile` | Frontend (Health import) | Base44 InvokeLLM | Parse uploaded vet document, extract records | 3 actions/day |
| `processHealthInput` | Frontend (Smart health assistant) | Base44 InvokeLLM | Process text/image health input, create HealthRecord | 3 actions/day |
| `generateTrainingProgram` | Frontend (Training page) | Base44 InvokeLLM | Generate personalized training program | 3 actions/day |

### Stripe Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `stripeCheckout` | Frontend | Create Checkout session |
| `stripePortal` | Frontend | Create Billing Portal session |
| `stripeWebhook` | Stripe webhook POST | Handle subscription lifecycle events |

### Scheduled / Reminder Functions

| Function | Schedule | Purpose |
|----------|----------|---------|
| `walkReminder` | Hourly | Send walk reminder email if no activity logged (timezone: Paris/CET) |
| `streakReminder` | Daily | Notify users at risk of losing streak |
| `vaccineReminders` | Daily | Remind users at 14/7/3/1/0 days before vaccine due date |
| `medicationReminders` | Daily | Remind users at 14/7/3/1/0 days before medication end date |
| `vetVisitReminders` | Daily | Remind users at 14/7/3/1/0 days before vet visit |
| `trialExpiryReminder` | Daily | Send email to users whose trial expires in 3 or 1 day |
| `monthlySummary` | Monthly (1st of month) | Generate and send monthly dog health summary email |
| `weeklyInsightGenerate` | Weekly (Monday) | Generate weekly AI insights per dog via OpenRouter |

### Vet / Admin Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `vetAccess` | Frontend | Multi-action: list/get/revoke vet access, generate HTML health summary, generate vet PDF |
| `deleteUser` | Frontend (Profile settings) | Full account deletion: cancel Stripe, delete all entities |

---

## Maps & Location

### OpenStreetMap (Overpass API)
- **Endpoint**: `https://overpass-api.de/api/interpreter`
- **Usage**: Find dog-friendly parks near user's GPS location
- **Client-side caching**: 4-hour TTL in localStorage (`pawcoach_nearby_parks`)
- **File**: `src/utils/overpass.js`

### CartoDB Tiles
- **URL pattern**: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
- **Usage**: Map tile layer in Leaflet (Voyager style — clean, no labels overload)

### OpenStreetMap Tiles (fallback reference)
- `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` — referenced in some map instances

### Leaflet Marker Icons
- Loaded from CDN: `https://unpkg.com/leaflet@1.9.4/dist/images/`
- Files: `marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`

### Google Maps (external links only)
- No Google Maps API key — links only
- `https://www.google.com/maps/dir/?api=1&destination=...` (walking directions)
- `https://www.google.com/maps/search/...` (search links)

---

## CDN Assets

### Lottie Animations
- **Source**: LottieFiles CDN (`assets-v2.lottiefiles.com`)
- **Format**: `.lottie` (dotLottie)
- **Player**: `@lottiefiles/dotlottie-react` v0.18.7
- **Library**: `src/lib/lottieLibrary.js` — ~70 URLs organized in categories:
  - `dogs` (walking, sitting, running, happy, sad, sleeping, error, petLovers)
  - `paw` (print)
  - `loading` (general, dots, paperplane, book)
  - `success` (checkmark, confetti, trophy, stars)
  - `error` (general, warning, notFound)
  - `scan` (search, document, face, qrCode)
  - `health` (heartbeat, ecg, medical, stethoscope)
  - `food` (general, loading, choice)
  - `chat` (typing, chatbot)
  - `misc` (calendar, notification, share, unlock, crown, fire, video, book, qrCode)

### Storyset Illustrations (local, recolored)
- **Location**: `src/assets/illustrations/storyset/` (23 SVGs, colored `#1A4D3E`)
- `achievement.svg`, `calendar.svg`, `community.svg`, `cooking.svg`, `diagnosis.svg`, `error.svg`, `examination.svg`, `feeding.svg`, `growth.svg`, `health-record.svg`, `healthy-food.svg`, `meal-plan.svg`, `no-results.svg`, `onboarding-1.svg`, `playing.svg`, `premium.svg`, `running.svg`, `search.svg`, `success.svg`, `training.svg`, `vet-checkup.svg`, `walking.svg`, `welcome.svg`

### Remote Illustrations (GitHub CDN)
- **Base URL**: `https://raw.githubusercontent.com/ismailhamido11-art/pawcoach-assets/main/illustrations/`
- **Component**: `src/components/illustrations/Illustration.jsx`
- 12 named illustrations: `adoptAPet`, `goodDoggy`, `dogHighFive`, `petFood`, `dogWalking`, `veterinary`, `petCare`, `qualityTime`, `cautiousDog`, `dogPaw`, `petGrooming`, `walkingAround`

### Local SVG Illustrations
- **Location**: `src/assets/illustrations/` (9 files directly)
- `adopt-a-pet.svg`, `cautious-dog.svg`, `dog-high-five.svg`, `dog-walking.svg`, `good-doggy.svg`, `pet-care.svg`, `pet-food.svg`, `quality-time-in-nature.svg`, `veterinary.svg`

### PawMascot (local JPG)
- **Location**: `public/mascot/` (referenced in `index.html` for PWA icon)
- 10 moods: `paw-happy.jpg` (main icon), others
- Also used via `src/components/PawMascot.jsx`

### Leaflet Icons (CDN)
- `https://unpkg.com/leaflet@1.9.4/dist/images/` — marker icons

---

## Analytics

**Current implementation**: Custom localStorage-based (no third-party service)
- File: `src/utils/analytics.js`
- Stores last 100 events in `pawcoach_analytics_events` localStorage key
- Exposes `trackEvent(name, props)` and `getEvents()` for debugging
- **Note**: Will be replaced by a real analytics service in a future phase

**Tracked events** (partial list — callers found in):
- `src/pages/Onboarding.jsx`
- `src/pages/Premium.jsx`
- `src/pages/Scan.jsx`
- `src/utils/ai-credits.js`

---

## Browser APIs Used

| API | Usage |
|-----|-------|
| `navigator.geolocation` | Walk tracking GPS, park/vet location search |
| `localStorage` | Token storage, analytics, park cache, overpass cache |
| `serviceWorker` | PWA offline support |
| `navigator.share` / `html2canvas` | Share walk cards as images |
| `window.open` | Open Google Maps, Stripe, external links |

---

## Environment Variables Summary

| Variable | Used by | Description |
|----------|---------|-------------|
| `VITE_BASE44_APP_ID` | Frontend `app-params.js` | Base44 application ID |
| `VITE_BASE44_FUNCTIONS_VERSION` | Frontend `app-params.js` | Functions deployment version |
| `VITE_BASE44_APP_BASE_URL` | Frontend `app-params.js` | Base44 app base URL |
| `STRIPE_SECRET_KEY` | Backend (stripeCheckout, stripePortal, deleteUser) | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Backend (stripeWebhook) | Stripe webhook signing secret |
| `OPENROUTER_API_KEY` | Backend (pawcoachChat, dailyCheckinProcess, weeklyInsightGenerate) | OpenRouter API key |
| `BASE44_APP_ID` | Backend (monthlySummary) | App ID for service role ops |

---

## Data Flow Summary

```
User action (frontend)
    └── base44.entities.*          → Base44 entity DB (CRUD)
    └── base44.auth.*              → Base44 auth service
    └── base44.integrations.Core.InvokeLLM    → Base44 LLM proxy → AI models
    └── base44.integrations.Core.UploadFile   → Base44 file storage (S3)
    └── base44.functions.invoke("fnName", {}) → Deno function (base44/functions/)
            └── base44.asServiceRole.entities.*       → DB with elevated permissions
            └── base44.asServiceRole.integrations.Core.SendEmail → transactional email
            └── base44.asServiceRole.integrations.Core.InvokeLLM → AI (some functions)
            └── fetch("https://openrouter.ai/api/v1/chat/completions") → OpenRouter LLM
            └── stripe.*           → Stripe API
```
