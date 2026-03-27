# External Integrations

**Analysis Date:** 2026-03-27

## Platform — Base44

**Core platform providing auth, database, storage, email, and LLM access:**
- SDK (frontend): `@base44/sdk ^0.8.23` — `src/api/base44Client.js`
- SDK (backend): `npm:@base44/sdk@0.8.20` — imported in every `base44/functions/*/entry.ts`
- Auth: `base44.auth.me()` on backend, `AuthContext.jsx` on frontend
- Entity CRUD: `base44.entities.X.filter/create/update/delete` (19 entities, see `src/api/entities.js`)
- Service role: `base44.asServiceRole.entities.X` — used in backend for admin-level operations
- File upload: `base44.integrations.Core.UploadFile({ file })` — uploads to S3-backed storage, returns `file_url`
- Allowed file URL hosts: `base44.app`, `amazonaws.com`, `s3.amazonaws.com` (enforced in SSRF guards)
- Email: `base44.integrations.Core.SendEmail({ to, subject, body })` — transactional email via Base44 (8 backend functions)
- LLM (managed): `base44.integrations.Core.InvokeLLM({ prompt, response_json_schema, file_urls })` — AI calls routed by Base44 (used in 7 functions + 4 frontend components)
- App URL: `https://paw-coach-care.base44.app`
- App ID: `699f971349f7fa56a125f672`

## AI / LLM

**Two integration paths: Base44-managed and direct OpenRouter.**

**Base44 InvokeLLM (managed — model not configurable):**
- Used for: food scan analysis (`src/components/scan/LabelScanMode.jsx`), food comparator (`src/components/nutrition/FoodComparator.jsx`), nutrition meal plan (`src/components/nutrition/NutritionMealPlan.jsx`), health file parsing (`base44/functions/parseHealthFile/entry.ts`), growth photo analysis (`base44/functions/analyzeGrowthPhoto/entry.ts`), pre-diagnosis (`base44/functions/preDiagnosis/entry.ts`), final diagnosis (`base44/functions/finalDiagnosis/entry.ts`), find vet suggestions (`src/components/sante/FindVetContent.jsx`)
- Supports `file_urls` parameter for multimodal (image) inputs
- Supports `response_json_schema` for structured JSON output

**OpenRouter (direct — model selection possible):**
- API endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Auth: `Deno.env.get("OPENROUTER_API_KEY")`
- HTTP headers: `Authorization: Bearer`, `HTTP-Referer: https://pawcoach.app`, `X-Title: PawCoach`
- Used in: `base44/functions/pawcoachChat/entry.ts`, `base44/functions/dailyCheckinProcess/entry.ts`, `base44/functions/weeklyInsightGenerate/entry.ts`
- Default model: `deepseek/deepseek-chat` (text conversations, daily check-in feedback, weekly insights)
- Vision model: `openai/gpt-4o` — activated automatically when `imageUrl` is present in chat (`pawcoachChat`)
- Fallback: if `OPENROUTER_API_KEY` not set, functions return gracefully with `{ ok: true, generated: 0, reason: "no_api_key" }`

## Payments — Stripe

**Subscription billing (monthly 7.99 EUR, annual 59.99 EUR):**
- Frontend SDK: `@stripe/stripe-js ^5.2.0` — used in `src/pages/Premium.jsx`, `src/components/profile/SubscriptionSection.jsx`
- Backend SDK: `npm:stripe@17.3.1` — used in 4 Deno functions

**Backend functions:**
- `base44/functions/stripeCheckout/entry.ts` — creates Stripe Checkout Session for subscription
  - Allowed price IDs: `price_1T4tkFDuhaIxY4PGpnhDTx5L` (monthly), `price_1T4tkFDuhaIxY4PGWLeWApDL` (annual)
  - Validates origin (must end with `.base44.app`)
  - Metadata: `base44_app_id`, `user_email`
- `base44/functions/stripePortal/entry.ts` — creates Stripe Billing Portal session (manage/cancel subscription)
  - Return URL: `https://paw-coach-care.base44.app/Profile`
- `base44/functions/stripeWebhook/entry.ts` — handles Stripe webhook events with signature verification
  - Events handled: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`
  - Premium revoked after 3 failed payment attempts
  - Idempotency checks on all events
- `base44/functions/deleteUser/entry.ts` — cancels Stripe subscription on account deletion (best-effort, non-blocking)

**User fields managed by Stripe:**
- `is_premium`, `premium_since`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`

**Env vars:**
- `STRIPE_SECRET_KEY` — Stripe secret key (backend)
- `STRIPE_WEBHOOK_SECRET` — webhook signature verification (backend)

## Maps & Geolocation

**OpenStreetMap (via Leaflet):**
- Tile server: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Used in: `src/components/tracker/WalkMap.jsx`, `src/components/sante/FindVetContent.jsx`, `src/components/tracker/NearbyParks.jsx`
- Marker icons loaded from unpkg CDN: `https://unpkg.com/leaflet@1.9.4/dist/images/`

**Overpass API (OpenStreetMap data):**
- Endpoint: `https://overpass-api.de/api/interpreter`
- Used in: `src/utils/overpass.js` (queried by `src/components/tracker/NearbyParks.jsx`)
- Fetches dog-friendly parks within configurable radius (default 3000m)
- Results cached in `localStorage` key `pawcoach_nearby_parks` for 4 hours (TTL-based, drift-tolerant)

**Browser Geolocation API:**
- Used in: `src/components/tracker/WalkMode.jsx` (GPS walk tracking via `navigator.geolocation.watchPosition`), `src/components/tracker/NearbyParks.jsx`, `src/components/sante/FindVetContent.jsx`
- No external geolocation service — native browser API only

## Data Storage

**Database:**
- Base44 platform database — entity-based, accessed via `@base44/sdk`
- 19 entities: `Dog`, `HealthRecord`, `DailyCheckin`, `DailyLog`, `Streak`, `FoodScan`, `UserProgress`, `DiagnosisReport`, `NutritionPlan`, `Bookmark`, `WeeklyInsight`, `SharedVetAccess`, `DogAchievement`, `DietPreferences`, `GrowthEntry`, `ParkReview`, `PlaceFavorite`, `ChatMessage`, `VetNote`
- Full entity list in `src/api/entities.js`

**File Storage:**
- S3-compatible storage managed by Base44 (`amazonaws.com` or `s3.amazonaws.com`)
- Accessed via `base44.integrations.Core.UploadFile({ file })` — returns `{ file_url }`
- Used for: dog photos, health documents, food label photos, walk share cards, video coaching files

**Client-side Cache:**
- `localStorage` — Overpass parks cache (`pawcoach_nearby_parks`), app params (`base44_*` keys)
- React Query cache — in-memory, `refetchOnWindowFocus: false`
- Service Worker cache — static shell assets (js, css, images)

## Authentication & Identity

**Auth Provider:**
- Base44 platform — email-based auth (no OAuth/social login configured)
- Token stored in `localStorage` as `base44_access_token`
- Frontend: `src/lib/AuthContext.jsx` — wraps all authenticated routes, loads user + public app settings
- Backend: `base44.auth.me()` on every request — returns user object with `email`, `is_premium`, `trial_expires_at`, `messages_remaining`, `actions_remaining`

**Premium gating:**
- Two quota pools on `User` entity:
  - `messages_remaining` / `messages_daily_reset` — chat messages (10/day for free users)
  - `actions_remaining` / `actions_daily_reset` — AI actions (3/day for free users: growth analysis, health import, training program, etc.)
- Server-side enforcement in every AI backend function (not client-side)
- Trial: `trial_expires_at` field — if in future, treated as premium

## Email

**Provider:** Base44 `integrations.Core.SendEmail` — transactional email (provider managed by Base44, not configurable)

**Triggers (8 backend functions send email):**
- `base44/functions/walkReminder/entry.ts` — daily walk reminder (if no activity logged, scheduled hourly, Paris timezone)
- `base44/functions/vaccineReminders/entry.ts` — upcoming vaccine due dates
- `base44/functions/medicationReminders/entry.ts` — medication reminders
- `base44/functions/vetVisitReminders/entry.ts` — upcoming vet visit reminders
- `base44/functions/streakReminder/entry.ts` — streak at risk notification
- `base44/functions/trialExpiryReminder/entry.ts` — trial expiry warning
- `base44/functions/monthlySummary/entry.ts` — monthly wellness summary (premium users)
- `base44/functions/vetAccess/entry.ts` — vet invitation with health summary HTML + invite code

## Monitoring & Observability

**Error Tracking:**
- None detected — no Sentry, Datadog, or similar

**Logs:**
- `console.error` / `console.info` in Deno functions (visible in Base44 function logs)
- All `console.log` removed (cleanup in v7.0 — enforced by ESLint)
- Frontend: `console.error` used only in auth context and API error paths

## CI/CD & Deployment

**Hosting:** Base44 platform (`https://paw-coach-care.base44.app`)

**CI Pipeline:** None — no GitHub Actions, no automated testing pipeline

**Deployment flow:**
1. Edit files in `pawcoach/` (Claude Code or manual)
2. `git push` to `main` branch on `github.com/ismailhamido11-art/pawcoach`
3. Base44 detects push via 2-way sync, auto-deploys frontend
4. Ismail clicks "Publish" in Base44 to make live
5. Backend functions auto-deploy on push (managed by Base44)

**Schema changes** (entity modifications) require Base44 Build prompts — not achievable via git push alone.

## Webhooks & Callbacks

**Incoming:**
- Stripe webhook → `base44/functions/stripeWebhook/entry.ts` (POST, signature verified via `STRIPE_WEBHOOK_SECRET`)

**Outgoing:**
- Stripe Checkout session: `success_url` = `{origin}/?premium=success`, `cancel_url` = `{origin}/Premium`
- Stripe Billing Portal: `return_url` = `https://paw-coach-care.base44.app/Profile`

## Environment Configuration

**Required backend env vars (set in Base44 dashboard):**
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signature
- `OPENROUTER_API_KEY` — OpenRouter AI access (graceful degradation if missing)
- `BASE44_APP_ID` — injected by platform, used in Stripe metadata

**Required frontend env vars (via Vite):**
- `VITE_BASE44_APP_ID` — app identifier
- `VITE_BASE44_FUNCTIONS_VERSION` — backend functions version
- `VITE_BASE44_APP_BASE_URL` — base URL for app

---

*Integration audit: 2026-03-27*
