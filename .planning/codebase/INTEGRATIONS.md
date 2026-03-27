# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**AI / LLM (Base44 Core):**
- Base44 `Core.InvokeLLM` — Base44-managed LLM (model not exposed to app code)
  - Called via `base44.integrations.Core.InvokeLLM(params)` or `base44.asServiceRole.integrations.Core.InvokeLLM(params)`
  - Used in 7 backend functions:
    - `base44/functions/pawcoachChat/entry.ts` — AI chat with full dog memory context
    - `base44/functions/analyzeGrowthPhoto/entry.ts` — vision analysis, body condition score
    - `base44/functions/finalDiagnosis/entry.ts` — step-2 symptom diagnosis
    - `base44/functions/preDiagnosis/entry.ts` — step-1 pre-diagnosis questions
    - `base44/functions/generateTrainingProgram/entry.ts` — personalized training plan
    - `base44/functions/parseHealthFile/entry.ts` — parse uploaded vet documents
    - `base44/functions/processHealthInput/entry.ts` — process health data input
  - Supports vision (image analysis) via `file_urls` param — images must come from allowlisted hosts: `base44.app`, `amazonaws.com`, `s3.amazonaws.com`
  - Supports structured JSON output via `response_json_schema` param

**Email (Base44 Core):**
- Base44 `Core.SendEmail` — Base44-managed transactional email
  - Called via `base44.integrations.Core.SendEmail(params)` or `base44.asServiceRole.integrations.Core.SendEmail(params)`
  - Used in 8 backend notification/reminder functions:
    - `base44/functions/medicationReminders/entry.ts`
    - `base44/functions/monthlySummary/entry.ts`
    - `base44/functions/streakReminder/entry.ts`
    - `base44/functions/trialExpiryReminder/entry.ts`
    - `base44/functions/vaccineReminders/entry.ts`
    - `base44/functions/vetAccess/entry.ts`
    - `base44/functions/vetVisitReminders/entry.ts`
    - `base44/functions/walkReminder/entry.ts`

**Maps / Geospatial:**
- Overpass API (OpenStreetMap) — free, no auth required
  - Endpoint: `https://overpass-api.de/api/interpreter`
  - Purpose: fetch nearby dog parks and public parks
  - Client: `src/utils/overpass.js` (`fetchNearbyParks`, `findNearestPark`)
  - Cache: localStorage key `pawcoach_nearby_parks`, 4-hour TTL, drift-aware (1km threshold)
  - Timeout: 12 seconds with AbortController
  - No API key required

**Lottie Animations CDN:**
- LottieFiles CDN (`assets-v2.lottiefiles.com`) — no auth required
  - ~70 animation URLs served as `.lottie` (dotLottie format)
  - Catalog: `src/lib/lottieLibrary.js`
  - Player: `src/components/ui/LottieAnimation.jsx` via `@lottiefiles/dotlottie-react`

## Data Storage

**Primary Database:**
- Base44 managed database — all entities via `@base44/sdk`
  - Client setup: `src/api/base44Client.js`
  - Entity access layer: `src/api/entities.js` (wrapped entities with consistent error logging)
  - 19 entities: `Dog`, `HealthRecord`, `DailyCheckin`, `DailyLog`, `Streak`, `FoodScan`, `UserProgress`, `DiagnosisReport`, `NutritionPlan`, `Bookmark`, `WeeklyInsight`, `SharedVetAccess`, `DogAchievement`, `DietPreferences`, `GrowthEntry`, `ParkReview`, `PlaceFavorite`, `ChatMessage`, `VetNote`
  - `User` entity accessed only via `base44.auth.me()` / `base44.auth.updateMe()` / `base44.asServiceRole.entities.User`

**File Storage:**
- Base44 managed file storage (AWS S3 behind Base44)
  - Image uploads (dog photos, vet documents, growth photos) stored on `base44.app` or `amazonaws.com`
  - Server-side validation: `base44.app`, `amazonaws.com`, `s3.amazonaws.com` are the allowlisted domains for image URLs

**Client-Side Caching (localStorage):**
- `activeDogId` — currently selected dog ID
- `pawcoach_nearby_parks` — Overpass API results cache (4h TTL)
- `pawcoach_analytics_events` — local analytics event buffer (last 100, 30-day TTL)
- `base44_*` — Base44 SDK auth tokens and app params (managed by `src/lib/app-params.js`)

**In-Memory Cache:**
- `src/lib/HomeCacheContext.jsx` — Home page data cache (2-minute TTL, dog-ID-aware), prevents re-fetch on tab switch

## Authentication & Identity

**Auth Provider:**
- Base44 built-in auth — email/password managed by Base44 platform
  - Client: `base44.auth.me()`, `base44.auth.updateMe()`
  - Context: `src/lib/AuthContext.jsx` — wraps entire authenticated app
  - Token storage: localStorage key `base44_access_token` (managed by SDK)
  - App public settings checked at startup via Base44 public API

**User Premium Status Fields (on User entity):**
- `is_premium` — boolean flag set by Stripe webhook
- `trial_expires_at` — ISO date string for trial expiry
- `premium_since` — date premium was activated
- `stripe_customer_id` — Stripe customer reference
- `stripe_subscription_id` — active subscription ID
- `stripe_subscription_status` — subscription status string

**AI Credit Fields (on User entity):**
- `messages_remaining` — daily AI chat messages (free: 10/day)
- `messages_daily_reset` — YYYY-MM-DD string of last reset
- `actions_remaining` — daily AI actions like photo analysis (free: 3/day)
- `actions_daily_reset` — YYYY-MM-DD string of last reset
- Credit logic: `src/utils/ai-credits.js`, enforced server-side in each function

## Payments — Stripe

**Integration:**
- Stripe SDK (backend): `npm:stripe@17.3.1` in Deno functions
- Stripe SDK (frontend): `@stripe/react-stripe-js` + `@stripe/stripe-js`
- Environment var (backend Deno): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Price IDs (hardcoded allowlist):**
- Monthly: `price_1T4tkFDuhaIxY4PGpnhDTx5L` (7.99 EUR/month)
- Annual: `price_1T4tkFDuhaIxY4PGWLeWApDL` (59.99 EUR/year)

**Functions:**
- `base44/functions/stripeCheckout/entry.ts` — creates Checkout Session, validates priceId against allowlist
- `base44/functions/stripePortal/entry.ts` — creates Customer Portal session for subscription management
- `base44/functions/stripeWebhook/entry.ts` — handles Stripe webhook events:
  - `checkout.session.completed` → sets `is_premium: true`, stores `stripe_customer_id`, `stripe_subscription_id`
  - `customer.subscription.deleted` → sets `is_premium: false`
  - `customer.subscription.updated` → updates `is_premium` based on subscription status
  - `invoice.payment_failed` → revokes premium after 3 failed attempts, sets `stripe_subscription_status: "past_due"`

**Webhook security:**
- Signature verification via `stripe.webhooks.constructEventAsync()` with `STRIPE_WEBHOOK_SECRET`
- Origin validation in checkout: only `*.base44.app` or fallback to production URL

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry or equivalent integrated

**Logging:**
- Backend: `console.log` / `console.error` in Deno functions (visible in Base44 function logs)
- Frontend: `console.debug` via analytics module; `console.warn` for non-critical failures

**Analytics:**
- Local-only implementation in `src/utils/analytics.js`
  - Events stored in localStorage (key: `pawcoach_analytics_events`, last 100, 30-day TTL)
  - `trackEvent(name, properties)` — called on key user actions (limit reached, onboarding, etc.)
  - `getEvents()` — browser console debugging utility
  - No third-party analytics service — marked as temporary in code comments

## CI/CD & Deployment

**Hosting:**
- Base44 platform — `https://paw-coach-care.base44.app`
- App ID: `699f971349f7fa56a125f672`

**Deploy Flow:**
1. `git push` to `main` on `github.com/ismailhamido11-art/pawcoach`
2. Base44 auto-syncs frontend and functions (0 credits)
3. Manual "Publish" click in Base44 dashboard to promote to production

**CI Pipeline:**
- None — no GitHub Actions or CI configured; deploy is git-push-triggered via Base44 sync

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook → `base44/functions/stripeWebhook/entry.ts` (POST, signature-verified)
  - Events handled: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`

**Outgoing:**
- Stripe Checkout redirect → `https://paw-coach-care.base44.app/?premium=success` (success)
- Stripe Checkout redirect → `https://paw-coach-care.base44.app/Premium` (cancel)

## Scheduled / Cron Functions

All scheduled backend functions use Base44's cron trigger system (not HTTP-triggered):

| Function | Purpose |
|----------|---------|
| `base44/functions/dailyCheckinProcess/entry.ts` | Daily check-in processing |
| `base44/functions/medicationReminders/entry.ts` | Medication reminder emails |
| `base44/functions/monthlySummary/entry.ts` | Monthly summary emails |
| `base44/functions/streakReminder/entry.ts` | Streak reminder emails |
| `base44/functions/trialExpiryReminder/entry.ts` | Trial expiry warning emails |
| `base44/functions/vaccineReminders/entry.ts` | Vaccine due date reminder emails |
| `base44/functions/vetVisitReminders/entry.ts` | Vet visit reminder emails |
| `base44/functions/walkReminder/entry.ts` | Walk reminder emails |
| `base44/functions/weeklyInsightGenerate/entry.ts` | Generate weekly AI insights |

## HTTP-Triggered Functions (called from frontend)

| Function | Caller | Purpose |
|----------|--------|---------|
| `base44/functions/pawcoachChat/entry.ts` | `src/pages/Chat.jsx` | AI chat with dog memory |
| `base44/functions/analyzeGrowthPhoto/entry.ts` | `src/components/sante/GrowthTrackerContent.jsx` | Vision BCS analysis |
| `base44/functions/finalDiagnosis/entry.ts` | Symptom checker flow | Step-2 AI diagnosis |
| `base44/functions/preDiagnosis/entry.ts` | Symptom checker flow | Step-1 pre-diagnosis |
| `base44/functions/generateTrainingProgram/entry.ts` | `src/pages/Training.jsx` | AI training plan generation |
| `base44/functions/parseHealthFile/entry.ts` | Health file upload | Parse vet documents |
| `base44/functions/processHealthInput/entry.ts` | Health input forms | Process health data |
| `base44/functions/generateDiagnosisPDF/entry.ts` | Download flow | Generate diagnosis PDF |
| `base44/functions/vetAccess/entry.ts` | `src/pages/VetPortal.jsx` | Vet access management |
| `base44/functions/stripeCheckout/entry.ts` | `src/pages/Premium.jsx` | Create Stripe Checkout Session |
| `base44/functions/stripePortal/entry.ts` | `src/components/profile/SubscriptionSection.jsx` | Open Stripe Customer Portal |
| `base44/functions/deleteUser/entry.ts` | `src/pages/Profile.jsx` | Account deletion |

## Security Patterns

All backend functions enforce:
- **Auth check**: `base44.auth.me()` → 401 if unauthenticated
- **Ownership check**: `dog.owner !== user.email` → 403 Forbidden
- **Input sanitization**: `sanitize(s, max)` helper strips `<>` and truncates
- **SSRF prevention**: image URLs validated against allowlist (`base44.app`, `amazonaws.com`, `s3.amazonaws.com`)
- **Server-side quota**: credit checks re-enforced in functions (prevents multi-tab bypass)
- **Prompt injection protection**: message history filtered to `user`/`assistant` roles only, capped at 20 messages, 2000 chars each

---

*Integration audit: 2026-03-27*
