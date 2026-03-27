# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

### Base44 Platform (primary)
- **What:** App hosting, auth, entity storage, serverless function runtime
- **SDK (frontend):** `@base44/sdk` 0.8.23, initialized in `src/api/base44Client.js`
  ```js
  export const base44 = createClient({ appId, token, functionsVersion, requiresAuth: true, appBaseUrl });
  ```
- **SDK (backend):** `npm:@base44/sdk@0.8.20`, used via `createClientFromRequest(req)` in every `base44/functions/*/entry.ts`
- **Auth:** Token passed via URL param or localStorage (`base44_access_token`). Managed by `src/lib/AuthContext.jsx` via `base44.auth.me()` and `base44.auth.redirectToLogin()`
- **Entity access:** Via `src/api/entities.js` wrapper — 19 entities (Dog, HealthRecord, DailyCheckin, DailyLog, Streak, FoodScan, UserProgress, DiagnosisReport, NutritionPlan, Bookmark, WeeklyInsight, SharedVetAccess, DogAchievement, DietPreferences, GrowthEntry, ParkReview, PlaceFavorite, ChatMessage, VetNote)
- **Function invocation (frontend):** `base44.functions.invoke("functionName", payload)` — used in 20+ components and pages
- **App config:** `src/lib/app-params.js` reads `VITE_BASE44_APP_ID`, `VITE_BASE44_FUNCTIONS_VERSION`, `VITE_BASE44_APP_BASE_URL` from Vite env or URL params

### OpenRouter AI API
- **What:** LLM proxy used for chat, daily check-in, and weekly insights
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions` (direct fetch, not SDK)
- **Auth:** `Authorization: Bearer ${OPENROUTER_API_KEY}` (Deno secret)
- **Default model:** `deepseek/deepseek-chat`
- **Vision model:** `openai/gpt-4o` — triggered when image URL is present in chat
- **Headers required:** `HTTP-Referer: https://pawcoach.app`, `X-Title: PawCoach`
- **Functions using it:**
  - `base44/functions/pawcoachChat/entry.ts` — user chat + nutrition mode + vision (image analysis)
  - `base44/functions/dailyCheckinProcess/entry.ts` — daily AI wellness insight
  - `base44/functions/weeklyInsightGenerate/entry.ts` — weekly summary generation
- **Env var:** `OPENROUTER_API_KEY`

### Base44 InvokeLLM (internal AI)
- **What:** Base44-managed LLM calls, no external key needed — billed through Base44 credits
- **Pattern:** `base44.integrations.Core.InvokeLLM({ prompt, ... })` or `base44.asServiceRole.integrations.Core.InvokeLLM(...)`
- **Functions using it:**
  - `base44/functions/preDiagnosis/entry.ts` — symptom intake AI
  - `base44/functions/finalDiagnosis/entry.ts` — full AI diagnosis
  - `base44/functions/parseHealthFile/entry.ts` — health file OCR/parsing
  - `base44/functions/processHealthInput/entry.ts` — health data processing
  - `base44/functions/generateTrainingProgram/entry.ts` — AI training program (2 LLM calls per request)
  - `base44/functions/analyzeGrowthPhoto/entry.ts` — dog growth photo analysis

### Base44 SendEmail (internal email)
- **What:** Base44-managed transactional email — no external email provider needed
- **Pattern:** `base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body })`
- **Functions using it:**
  - `base44/functions/vetAccess/entry.ts` — vet share invitation email
  - `base44/functions/medicationReminders/entry.ts` — scheduled medication reminders
  - `base44/functions/vaccineReminders/entry.ts` — scheduled vaccine reminders
  - `base44/functions/vetVisitReminders/entry.ts` — scheduled vet visit reminders
  - `base44/functions/walkReminder/entry.ts` — scheduled walk reminders (runs hourly)
  - `base44/functions/streakReminder/entry.ts` — scheduled streak reminders
  - `base44/functions/trialExpiryReminder/entry.ts` — trial expiry reminders (3 days / 1 day before)
  - `base44/functions/monthlySummary/entry.ts` — monthly summary emails

## Payments

### Stripe
- **What:** Subscription billing (monthly 7.99 EUR, annual 59.99 EUR)
- **SDK (backend):** `npm:stripe@17.3.1` imported in 4 Deno functions
- **SDK (frontend):** `@stripe/stripe-js` 5.2.0 — used for Stripe.js loading and checkout redirect
- **Auth:** `STRIPE_SECRET_KEY` (Deno secret), `STRIPE_WEBHOOK_SECRET` (Deno secret)
- **Allowed price IDs (hardcoded in `stripeCheckout`):**
  - `price_1T4tkFDuhaIxY4PGpnhDTx5L` (monthly)
  - `price_1T4tkFDuhaIxY4PGWLeWApDL` (annual)
- **Functions:**
  - `base44/functions/stripeCheckout/entry.ts` — creates Checkout Session, returns `url`
  - `base44/functions/stripePortal/entry.ts` — creates Billing Portal session, redirects to `/Profile`
  - `base44/functions/stripeWebhook/entry.ts` — handles webhook events (see below)
  - `base44/functions/deleteUser/entry.ts` — cancels Stripe subscription on account deletion
- **Frontend invocation:**
  - `src/pages/Premium.jsx:115` — `base44.functions.invoke("stripeCheckout", { priceId })`
  - `src/components/profile/SubscriptionSection.jsx:13` — `base44.functions.invoke("stripePortal")`
- **User fields updated by Stripe webhooks:** `is_premium`, `premium_since`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`

## Webhooks

### Incoming (handled by Stripe webhook function)
- **Endpoint:** Base44 function URL for `stripeWebhook`
- **Verification:** `stripe.webhooks.constructEventAsync(body, signature, webhookSecret)`
- **Handled events:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `is_premium=true`, store `stripe_customer_id` + `stripe_subscription_id` |
| `customer.subscription.deleted` | Set `is_premium=false`, clear `stripe_subscription_id` |
| `customer.subscription.updated` | Sync `is_premium` based on subscription `status` (active/trialing = true) |
| `invoice.payment_failed` | After 3 failed attempts: revoke premium. Before: set `stripe_subscription_status=past_due` |

- **Idempotency:** All handlers check current user state before updating to prevent duplicate processing

## Maps & Geolocation

### OpenStreetMap / React-Leaflet
- **What:** Interactive maps for vet finder and nearby parks
- **Tile source:** OpenStreetMap tiles (no API key required)
- **Files:** `src/components/sante/FindVetContent.jsx`, `src/components/tracker/NearbyParks.jsx`, `src/components/tracker/WalkMap.jsx`
- **Marker icons:** Loaded from `https://unpkg.com/leaflet@1.9.4/dist/images/` (CDN)

### Overpass API (OpenStreetMap)
- **What:** Fetches nearby dog-friendly parks via OSM data
- **Endpoint:** `https://overpass-api.de/api/interpreter` (no API key required)
- **File:** `src/utils/overpass.js`
- **Caching:** localStorage cache with 4-hour TTL, invalidated if user moves >1 km
- **Query:** Fetches `leisure=dog_park`, `leisure=park` nodes and ways within configurable radius

### Browser Geolocation API
- **What:** User GPS position for walk tracking and nearby search
- **Usage:** `navigator.geolocation.getCurrentPosition()` and `navigator.geolocation.watchPosition()`
- **Files:** `src/components/tracker/WalkMode.jsx`, `src/components/tracker/NearbyParks.jsx`, `src/components/sante/FindVetContent.jsx`

## Animations & Media

### LottieFiles CDN
- **What:** .lottie animation files streamed from LottieFiles CDN
- **Endpoint:** `https://assets-v2.lottiefiles.com/...`
- **No API key required**
- **File:** `src/lib/lottieLibrary.js` (library of animation URLs)
- **Component:** `src/components/ui/LottieAnimation.jsx` via `@lottiefiles/dotlottie-react`

## Data Storage

**Databases:**
- Base44 managed database — all entity data stored via Base44 SDK (`base44.entities.*`)
- No direct DB connection string — fully abstracted by Base44 SDK

**File Storage:**
- Base44 managed file storage — image uploads (dog photos, health files) stored as Base44 file URLs
- Validated image URL domains in `pawcoachChat`: `base44.app`, `amazonaws.com`, `s3.amazonaws.com`

**Client-side Storage:**
- `localStorage` — auth token (`base44_access_token`), active dog ID (`activeDogId`), parks cache (`pawcoach_nearby_parks`), app params
- In-memory React ref — Home page cache (`src/lib/HomeCacheContext.jsx`)

**Caching:**
- No server-side cache layer. Client-side only (localStorage + React state)

## Authentication & Identity

**Auth Provider:**
- Base44 built-in auth — token-based, managed by Base44 platform
- **Implementation:** `src/lib/AuthContext.jsx`
  - `base44.auth.me()` — validate current token, fetch user object
  - `base44.auth.redirectToLogin(returnUrl)` — redirect to Base44 login page
  - `base44.auth.logout(returnUrl)` — clear token and redirect
- **User object fields used:** `email`, `is_premium`, `trial_expires_at`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`
- **Service role:** Backend functions use `base44.asServiceRole.entities.*` for admin operations (user lookup by email, cross-user data)

## Monitoring & Observability

**Error Tracking:** Not detected (no Sentry, Datadog, or similar SDK)

**Logs:**
- `console.error` / `console.log` in all Deno functions — visible in Base44 function logs
- Frontend: `console.error` in API wrappers (`src/api/entities.js`)

**Analytics:**
- `@base44/vite-plugin` has `analyticsTracker: true` — Base44 built-in analytics (page views, navigation)

## CI/CD & Deployment

**Hosting:** Base44 platform (`https://paw-coach-care.base44.app`)

**CI Pipeline:** None detected — no GitHub Actions, no test pipeline

**Deploy process:**
1. `git push origin main` from `pawcoach/` directory
2. Base44 auto-detects push via GitHub 2-way sync
3. Manual "Publish" click in Base44 dashboard to push live

## Environment Configuration

**Frontend env vars (Vite, set by Base44 platform):**
- `VITE_BASE44_APP_ID`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `VITE_BASE44_APP_BASE_URL`

**Backend secrets (Deno, set in Base44 dashboard):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENROUTER_API_KEY`
- `BASE44_APP_ID`

**Secrets location:** Base44 dashboard (not in code or `.env` files)

---

*Integration audit: 2026-03-27*
