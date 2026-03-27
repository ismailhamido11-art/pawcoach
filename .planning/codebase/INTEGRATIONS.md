# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**Platform:**
- Base44 — managed hosting, auth, entity database, Deno function runtime, LLM proxy, file storage, transactional email
  - App ID: `699f971349f7fa56a125f672`
  - SDK (frontend): `@base44/sdk` v0.8.23, client singleton at `src/api/base44Client.js`
  - SDK (backend): `npm:@base44/sdk@0.8.20` (pinned) in all `base44/functions/*/entry.ts`
  - Auth env vars: `VITE_BASE44_APP_ID`, `VITE_BASE44_FUNCTIONS_VERSION`, `VITE_BASE44_APP_BASE_URL`

**Payments:**
- Stripe — subscription billing (monthly 7.99 EUR, annual 59.99 EUR)
  - Backend SDK: `npm:stripe@17.3.1`
  - Frontend SDK: `@stripe/react-stripe-js` v3.0.0 + `@stripe/stripe-js` v5.2.0 (redirect-based checkout, no embedded Elements)
  - Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Price IDs hardcoded in `src/pages/Premium.jsx`:
    - Monthly: `price_1T4tkFDuhaIxY4PGpnhDTx5L`
    - Annual: `price_1T4tkFDuhaIxY4PGWLeWApDL`

**AI / LLM:**
- OpenRouter — direct LLM API for chat, checkin insights, weekly summaries
  - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
  - Env var: `OPENROUTER_API_KEY` (backend only)
  - Models: `deepseek/deepseek-chat` (default), `openai/gpt-4o` (vision/image in `pawcoachChat`)
  - Headers: `HTTP-Referer: https://pawcoach.app`, `X-Title: PawCoach`
  - Used by: `base44/functions/pawcoachChat/entry.ts`, `dailyCheckinProcess/entry.ts`, `weeklyInsightGenerate/entry.ts`
- Base44 InvokeLLM — proxied LLM calls for structured JSON responses (no direct API key management)
  - Pattern: `base44.integrations.Core.InvokeLLM({ prompt, response_json_schema, file_urls? })`
  - Used by: `analyzeGrowthPhoto`, `finalDiagnosis`, `generateTrainingProgram`, `parseHealthFile`, `preDiagnosis`, `processHealthInput`
  - Also used directly from frontend (Nutri, Scan, FindVetContent, FoodComparator, AITrainingProgram)

**Maps:**
- Overpass API (OpenStreetMap) — fetch dog-friendly parks near GPS location
  - Endpoint: `https://overpass-api.de/api/interpreter`
  - Client-side only, 4-hour localStorage cache (`pawcoach_nearby_parks`)
  - File: `src/utils/overpass.js`
- CartoDB Tiles — map tile layer (Voyager style)
  - URL: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`
  - Used in: `src/components/tracker/WalkMap.jsx`, `src/components/tracker/NearbyParks.jsx`
- OpenStreetMap Tiles — fallback tile layer in some Leaflet instances
  - URL: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Google Maps — external links only, no API key
  - Walking directions: `https://www.google.com/maps/dir/?api=1&destination=...`
  - Search: `https://www.google.com/maps/search/...`
- Leaflet marker icons — loaded from CDN
  - URL: `https://unpkg.com/leaflet@1.9.4/dist/images/` (`marker-icon.png`, `marker-icon-2x.png`, `marker-shadow.png`)

## Data Storage

**Databases:**
- Base44 entity database — all structured app data
  - Connection: Base44 SDK via `createClient()` / `createClientFromRequest()`
  - Client: `src/api/base44Client.js` (frontend), `base44.asServiceRole` (backend)
  - Entities (19 total, all wrapped in `src/api/entities.js`):
    - `Dog` — core entity: profile, breed, birth date, weight, owner email
    - `HealthRecord` — vaccines, vet visits, medications, weight entries
    - `DailyCheckin` — daily mood (1-4)/energy (1-3)/appetite (1-3) check-ins
    - `DailyLog` — walk logs (minutes, distance km, GPS data, mood)
    - `Streak` — streak tracking per dog
    - `FoodScan` — food label scan results
    - `UserProgress` — training program exercise completion
    - `DiagnosisReport` — AI diagnosis reports per dog
    - `NutritionPlan` — AI-generated meal plans
    - `Bookmark` — saved training programs (source: `fitness_program` or `behavior_program`)
    - `WeeklyInsight` — weekly AI summaries per dog
    - `SharedVetAccess` — vet access tokens and permissions
    - `DogAchievement` — earned achievements per dog
    - `DietPreferences` — diet preferences (budget, brands, restrictions)
    - `GrowthEntry` — weight/height growth tracking over time
    - `ParkReview` — user park ratings/reviews
    - `PlaceFavorite` — bookmarked vet/park locations
    - `ChatMessage` — persisted chat history
    - `VetNote` — veterinary consultation notes
  - Key `User` entity fields:
    - `is_premium` (boolean) — primary premium gate
    - `trial_expires_at` (ISO date string) — trial expiry
    - `actions_remaining` (integer) — daily AI action credits (free: 3/day)
    - `actions_daily_reset` (date string) — tracks last quota reset
    - `messages_remaining` (integer) — daily chat message quota (free: 10/day)
    - `messages_daily_reset` (date string) — tracks last message reset
    - `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`
    - `walk_reminder_enabled`, `walk_reminder_time`, `email_notifications`
    - `referred_by` — referral code

**File Storage:**
- Base44 managed storage (S3-backed)
  - Upload: `base44.integrations.Core.UploadFile({ file: fileObject })`
  - URL allowlist (backend SSRF protection): `base44.app`, `amazonaws.com`, `s3.amazonaws.com`
  - Used for: dog profile photos, health record attachments, diagnosis images, growth photos, video coaching uploads

**Caching:**
- localStorage (browser-side only)
  - `pawcoach_analytics_events` — last 100 tracked events
  - `pawcoach_nearby_parks` — Overpass API park results, 4-hour TTL
  - `base44_access_token` — auth token
  - `base44_app_id`, `base44_functions_version` — runtime params

## Authentication & Identity

**Auth Provider:**
- Base44 managed auth (token-based)
  - Implementation: `src/lib/AuthContext.jsx` (`AuthProvider` + `useAuth` hook)
  - Flow: check app public settings → validate token → redirect to Base44 login if needed
  - Token storage: `localStorage` as `base44_access_token`; injected via `?access_token=` URL param
  - Auth methods: `base44.auth.me()`, `base44.auth.logout()`, `base44.auth.redirectToLogin()`, `base44.auth.isAuthenticated()`, `base44.auth.updateMe()`
  - Error types handled: `user_not_registered` (show error), `auth_required` (auto-redirect)

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar configured

**Logs:**
- Backend: `console.error()` and `console.log()` in all Deno functions (visible in Base44 function logs)
- Frontend: `console.debug("[Analytics]", ...)` via `src/utils/analytics.js`

**Analytics:**
- Custom localStorage-based tracker (`src/utils/analytics.js`)
  - Stores last 100 events in `pawcoach_analytics_events`
  - Exposes `trackEvent(name, props)` and `getEvents()` for debugging
  - No third-party service — placeholder for future implementation
  - Called from: `src/pages/Onboarding.jsx`, `src/pages/Premium.jsx`, `src/pages/Scan.jsx`, `src/utils/ai-credits.js`

## CI/CD & Deployment

**Hosting:**
- Base44 platform → `https://paw-coach-care.base44.app`
- GitHub repo: `github.com/ismailhamido11-art/pawcoach` (branch: `main`)

**CI Pipeline:**
- None — no GitHub Actions or other CI configured

**Deploy flow:**
- `git push origin main` → Base44 syncs automatically → Ismail clicks "Publish" in Base44 dashboard
- Backend functions deploy alongside frontend (same push)
- 0 Build credits consumed for Git-based deployments

## Environment Configuration

**Required env vars (frontend, set by Base44 platform):**
- `VITE_BASE44_APP_ID` — app ID (`699f971349f7fa56a125f672`)
- `VITE_BASE44_FUNCTIONS_VERSION` — function version routing
- `VITE_BASE44_APP_BASE_URL` — base URL

**Required env vars (backend, set in Base44 platform dashboard):**
- `STRIPE_SECRET_KEY` — Stripe server secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `OPENROUTER_API_KEY` — OpenRouter API key (used by pawcoachChat, dailyCheckinProcess, weeklyInsightGenerate)
- `BASE44_APP_ID` — injected by Base44 runtime (used by monthlySummary for service role ops)

**Secrets location:**
- No `.env` files in repo — all secrets managed via Base44 platform environment configuration
- Frontend env vars injected by Base44 at build time (Vite `import.meta.env.VITE_*`)

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook → `base44/functions/stripeWebhook/entry.ts`
  - Events handled: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`
  - Verification: `stripe.webhooks.constructEventAsync()` with `STRIPE_WEBHOOK_SECRET`
  - Effect: updates `User.is_premium`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`
  - Grace period: premium revoked only after 3 failed payment attempts (`invoice.payment_failed`)

**Outgoing (scheduled backend functions):**
- `walkReminder` — hourly, sends email if no walk logged today (CET timezone)
- `streakReminder` — daily, streak-at-risk email notifications
- `vaccineReminders` — daily, vaccine due date reminders at 14/7/3/1/0 days
- `medicationReminders` — daily, medication end date reminders at 14/7/3/1/0 days
- `vetVisitReminders` — daily, vet visit reminders at 14/7/3/1/0 days
- `trialExpiryReminder` — daily, trial expiry warning at 3 and 1 days before
- `monthlySummary` — monthly (1st), personalized dog health summary email to premium users
- `weeklyInsightGenerate` — weekly (Monday), generates AI weekly insight per dog via OpenRouter (premium only)

All outgoing email sent via `base44.asServiceRole.integrations.Core.SendEmail({ to, from_name, subject, body })`.

## Backend Functions — Complete Reference

All 22 functions in `base44/functions/`. Entry: `entry.ts`. Runtime: Deno. SDK: `npm:@base44/sdk@0.8.20`.

**AI functions (user-triggered, quota-gated on free tier):**

| Function | LLM | Quota | Purpose |
|----------|-----|-------|---------|
| `pawcoachChat` | OpenRouter (deepseek-chat / gpt-4o for vision) | 10 messages/day free | Main AI chat, multi-modal |
| `dailyCheckinProcess` | OpenRouter deepseek-chat | No LLM limit (credits updated) | Process check-in + generate insight |
| `preDiagnosis` | Base44 InvokeLLM | 3 actions/day free | Pre-diagnosis triage + follow-up questions |
| `finalDiagnosis` | Base44 InvokeLLM | 3 actions/day free | Full AI diagnosis report |
| `generateDiagnosisPDF` | None (jsPDF) | No quota | Generate PDF from diagnosis data |
| `analyzeGrowthPhoto` | Base44 InvokeLLM | 3 actions/day free | Body condition score + weight/height from photo |
| `parseHealthFile` | Base44 InvokeLLM | 3 actions/day free | Parse vet document, extract health records |
| `processHealthInput` | Base44 InvokeLLM | 3 actions/day free | Process text/image health input, create HealthRecord |
| `generateTrainingProgram` | Base44 InvokeLLM | 3 actions/day free | Generate personalized training program |

**Stripe functions:**

| Function | Trigger | Purpose |
|----------|---------|---------|
| `stripeCheckout` | Frontend | Create Checkout session, return redirect URL |
| `stripePortal` | Frontend | Create Billing Portal session for subscription management |
| `stripeWebhook` | Stripe webhook POST | Handle subscription lifecycle, update User premium status |

**Admin / vet functions:**

| Function | Trigger | Purpose |
|----------|---------|---------|
| `vetAccess` | Frontend | List/get/revoke vet access, generate HTML health summary and vet PDF |
| `deleteUser` | Frontend (Profile) | Full account deletion: cancel Stripe subscription, delete all entities |

**Scheduled functions:**

| Function | Schedule | Purpose |
|----------|----------|---------|
| `walkReminder` | Hourly | Walk reminder email if no activity today |
| `streakReminder` | Daily | Streak-at-risk notification |
| `vaccineReminders` | Daily | Vaccine due date reminders |
| `medicationReminders` | Daily | Medication end date reminders |
| `vetVisitReminders` | Daily | Vet visit upcoming reminders |
| `trialExpiryReminder` | Daily | Trial expiry warning (3 days and 1 day before) |
| `monthlySummary` | Monthly | Personalized monthly health summary email (premium only) |
| `weeklyInsightGenerate` | Weekly (Monday) | AI weekly insight per dog via OpenRouter (premium only) |

## CDN Assets

**Lottie animations:**
- Source: LottieFiles CDN (`assets-v2.lottiefiles.com`)
- Format: `.lottie` (dotLottie)
- Player: `@lottiefiles/dotlottie-react` v0.18.7
- Library: `src/lib/lottieLibrary.js` (~70 URLs in categories: dogs, health, food, success, error, scan, chat, misc)

**Storyset illustrations (local):**
- Location: `src/assets/illustrations/storyset/` — 23 SVGs recolored to `#1A4D3E`

**Remote illustrations:**
- Base URL: `https://raw.githubusercontent.com/ismailhamido11-art/pawcoach-assets/main/illustrations/`
- Component: `src/components/illustrations/Illustration.jsx` (12 named illustrations)

**PawMascot:**
- Location: `public/mascot/` — 10 mood JPGs, `paw-happy.jpg` used as PWA icon
- Component: `src/components/PawMascot.jsx`

## Data Flow Summary

```
User action (frontend)
    ├── base44.entities.*                              → Base44 entity DB (CRUD)
    ├── base44.auth.*                                  → Base44 auth service
    ├── base44.integrations.Core.InvokeLLM             → Base44 LLM proxy → AI models
    ├── base44.integrations.Core.UploadFile            → Base44 file storage (S3)
    └── base44.functions.invoke("fnName", {})          → Deno function (base44/functions/)
            ├── base44.asServiceRole.entities.*        → DB with elevated permissions
            ├── base44.asServiceRole.integrations.Core.SendEmail  → transactional email
            ├── base44.asServiceRole.integrations.Core.InvokeLLM  → AI (some functions)
            ├── fetch("https://openrouter.ai/api/v1/chat/completions") → OpenRouter LLM
            └── stripe.*                               → Stripe API

Stripe webhook → stripeWebhook/entry.ts → base44.asServiceRole.entities.User.update()
Scheduled job  → function/entry.ts      → base44.asServiceRole.entities.* + Core.SendEmail
```

---

*Integration audit: 2026-03-27*
