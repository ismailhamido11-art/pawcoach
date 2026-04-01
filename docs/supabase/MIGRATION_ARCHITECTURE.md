# PawCoach — Architecture de Migration Base44 → Supabase

> CTO Skoolora Agency — 2026-04-01
> Ce document couvre : Edge Functions, RevenueCat, SDK mapping, CRONs, Storage, Auth.

---

## 1. Vue d'ensemble

| Composant | Base44 (actuel) | Supabase (cible) |
|-----------|----------------|------------------|
| Auth | `@base44/sdk` auth | Supabase Auth (email/magic-link + Apple/Google OAuth) |
| BDD | Base44 entities API | PostgreSQL + RLS (voir `001_schema.sql` + `002_schema_fixes.sql`) |
| Backend functions | 22 fonctions Deno `base44/functions/` | 22 Edge Functions `supabase/functions/` |
| File storage | `base44.integrations.Core.UploadFile` | Supabase Storage (5 buckets) |
| Email | `base44.integrations.Core.SendEmail` | Resend API (`resend.com`) |
| LLM | `base44.integrations.Core.InvokeLLM` + OpenRouter | OpenRouter direct (tous les appels) |
| Paiements | Stripe (checkout + webhooks) | RevenueCat (in-app purchases natif) |
| Scheduling | Base44 CRON triggers | pg_cron + pg_net → Edge Functions |

---

## 2. Edge Functions — Mapping complet

### 2.1 Structure des fichiers

```
supabase/functions/
  _shared/
    supabase-client.ts    # createClient avec service_role_key
    openrouter.ts         # wrapper OpenRouter API (models, streaming)
    resend.ts             # wrapper Resend email API
    auth.ts               # extract user from JWT, ownership checks
    sanitize.ts           # sanitize(s, max) — anti-XSS
    quota.ts              # check_and_consume_* wrappers (appelle les fonctions SQL)
    cors.ts               # CORS headers standard
  
  # --- Invokables (14) ---
  pawcoach-chat/index.ts
  daily-checkin/index.ts
  create-dog/index.ts
  analyze-food/index.ts
  analyze-growth-photo/index.ts
  compare-foods/index.ts
  final-diagnosis/index.ts
  pre-diagnosis/index.ts
  generate-diagnosis-pdf/index.ts
  generate-meal-plan/index.ts
  generate-training-program/index.ts
  parse-health-file/index.ts
  process-health-input/index.ts
  vet-access/index.ts
  delete-user/index.ts
  revenuecat-webhook/index.ts      # remplace stripeCheckout + stripePortal + stripeWebhook
  
  # --- CRONs (8) ---
  vaccine-reminders/index.ts
  medication-reminders/index.ts
  vet-visit-reminders/index.ts
  streak-reminder/index.ts
  walk-reminder/index.ts
  trial-expiry-reminder/index.ts
  monthly-summary/index.ts
  weekly-insight-generate/index.ts
```

### 2.2 Mapping SDK — Base44 → Supabase

| Base44 API | Supabase equivalent | Notes |
|-----------|---------------------|-------|
| `base44.entities.X.filter(query)` | `supabase.from('x').select().match(query)` | RLS applique automatiquement |
| `base44.entities.X.create(data)` | `supabase.from('x').insert(data).select().single()` | |
| `base44.entities.X.update(id, data)` | `supabase.from('x').update(data).eq('id', id)` | |
| `base44.entities.X.delete(id)` | `supabase.from('x').delete().eq('id', id)` | |
| `base44.asServiceRole.entities.X.*` | Client avec `service_role_key` (bypass RLS) | Pour CRONs et operations admin |
| `base44.auth.me()` | `supabase.auth.getUser(jwt)` puis `profiles` lookup | JWT dans header `Authorization: Bearer` |
| `base44.auth.updateMe(data)` | `supabase.from('profiles').update(data).eq('id', userId)` | |
| `base44.integrations.Core.InvokeLLM(...)` | Appel HTTP direct a OpenRouter | Voir section 3 |
| `base44.integrations.Core.SendEmail(...)` | Resend API (`POST https://api.resend.com/emails`) | Voir section 4 |
| `base44.integrations.Core.UploadFile(file)` | Supabase Storage `supabase.storage.from(bucket).upload(path, file)` | |

### 2.3 Pattern standard d'une Edge Function

```typescript
// supabase/functions/example/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Auth: extraire user du JWT
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader! } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Parse body
    const body = await req.json()

    // 3. Business logic...
    // (RLS s'applique automatiquement via le client avec JWT)

    // 4. Response
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 2.4 Migration par fonction — Details

#### pawcoach-chat (CRITIQUE — la plus complexe)
- **Base44** : `base44/functions/pawcoachChat/entry.ts`
- **Lit** : Dog, User (quota), DailyCheckin (7 derniers), HealthRecord, FoodScan, Streak, WeeklyInsight, DailyLog, UserProgress, DietPreferences, NutritionPlan, DiagnosisReport, GrowthEntry, Bookmark (14 tables)
- **Ecrit** : User (messages_remaining)
- **LLM** : OpenRouter (deepseek-chat) via `InvokeLLM` → appel direct OpenRouter
- **Migration** :
  - Quota check : appeler la fonction SQL `check_and_consume_message_credit()` via RPC
  - Ownership : RLS le fait automatiquement (le client avec JWT ne voit que les dogs du user)
  - SSRF prevention : garder la whitelist d'URLs d'images (Supabase Storage URLs)
  - Sanitize : migrer `sanitize(s, max)` dans `_shared/sanitize.ts`
- **Risque** : Performance — 14 requetes paralleles. Optimiser avec des vues materialisees si necessaire.

#### daily-checkin
- **Base44** : `base44/functions/dailyCheckinProcess/entry.ts`
- **Lit** : Dog, DailyCheckin (dedup + tendances 7j), Streak
- **Ecrit** : DailyCheckin (create + update ai_response), Streak (create/update)
- **LLM** : OpenRouter directement (deepseek-chat, deja utilise dans le code Base44)
- **Migration** :
  - Dedup : `UNIQUE (dog_id, date)` dans le schema — le INSERT echoue si doublon
  - Streak : transaction pour atomicite (checkin + streak update)
  - Segment d'age : calculer depuis `dogs.birth_date`

#### create-dog
- **Base44** : `base44/functions/createDog/entry.ts`
- **Migration** :
  - Dog limit : trigger `enforce_dog_limit` dans le schema (automatique)
  - Owner enforcement : `owner_id = auth.uid()` force par RLS INSERT policy
  - SIMPLIFICATION : cette function peut disparaitre — le frontend INSERT directement via le client Supabase, le trigger + RLS font le travail.

#### analyze-food
- **Base44** : `base44/functions/analyzeFood/entry.ts`
- **Migration** :
  - LLM multimodal : passer l'URL de l'image a OpenRouter (vision model)
  - DietPreferences : lire via RLS pour allergen_alerts
  - Pas d'ecriture — retourne le resultat directement

#### analyze-growth-photo
- Similaire a analyze-food mais pour les photos de croissance
- Consomme 1 action credit → `check_and_consume_action_credit()` RPC

#### compare-foods
- LLM-only, pas d'ecriture. Peut etre simplifie en appel direct OpenRouter.

#### final-diagnosis / pre-diagnosis
- **Securite** : HMAC-SHA256 token entre pre et final (anti-bypass)
- Migrer le secret `PRE_DIAG_SECRET` en env var Supabase (`supabase secrets set`)
- Consomme 1 action credit (pre-diagnosis)

#### generate-diagnosis-pdf
- Utilise jsPDF — pas d'appel externe
- Peut etre deplace cote frontend (Expo) si les donnees sont disponibles via RLS

#### generate-meal-plan
- Quota mensuel : compter les `NutritionPlan` du mois en cours pour le dog
- `check_and_consume_action_credit()` n'est PAS utilise ici — c'est un quota mensuel custom (max 2/mois free)
- Il faut une fonction SQL supplementaire ou un check dans l'Edge Function

#### generate-training-program
- Consomme 1 action credit
- Dedup via Bookmarks (verifie les programmes deja generes)

#### parse-health-file / process-health-input
- LLM avec fichier uploade
- Consomme 1 action credit chacun

#### vet-access (COMPLEXE)
- Actions multiples : `listMyPatients`, `accept`, `share`, `revoke`, `addNote`
- Genere email HTML avec fiche sante complete
- Migrer `SendEmail` → Resend
- Invite code : generer un code 12 chars alphanumerique

#### delete-user (RGPD — CRITIQUE)
- Supprime TOUT en cascade (14+ types d'entites)
- **Simplification Supabase** : `ON DELETE CASCADE` sur toutes les FK fait 90% du travail
  - Supprimer `auth.users` → cascade vers `profiles` → cascade vers `dogs` → cascade vers tout le reste
  - Il reste : annuler l'abonnement RevenueCat (appel API)
- **Implementation** : `supabase.auth.admin.deleteUser(userId)` + RevenueCat revocation

#### revenuecat-webhook (NOUVEAU — remplace 3 fonctions Stripe)
- Voir section 5

---

## 3. LLM — OpenRouter

Toutes les fonctions qui utilisent `InvokeLLM` passent a des appels directs OpenRouter.

### Configuration

```typescript
// supabase/functions/_shared/openrouter.ts
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export async function invokeLLM(opts: {
  model?: string
  messages: Array<{ role: string; content: any }>
  response_format?: { type: string }
  temperature?: number
}) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model || 'deepseek/deepseek-chat',
      messages: opts.messages,
      response_format: opts.response_format,
      temperature: opts.temperature ?? 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}
```

### Mapping par fonction

| Fonction | Model actuel | Model Supabase | Vision? |
|----------|-------------|----------------|---------|
| pawcoachChat | deepseek-chat (via InvokeLLM) | deepseek/deepseek-chat | Oui (images chat) |
| dailyCheckinProcess | deepseek-chat (direct) | deepseek/deepseek-chat | Non |
| analyzeFood | InvokeLLM (multimodal) | google/gemini-2.0-flash (vision) | Oui |
| analyzeGrowthPhoto | InvokeLLM (multimodal) | google/gemini-2.0-flash (vision) | Oui |
| compareFoods | InvokeLLM | deepseek/deepseek-chat | Non |
| preDiagnosis | InvokeLLM | deepseek/deepseek-chat | Non |
| finalDiagnosis | InvokeLLM (optionnel multimodal) | deepseek/deepseek-chat | Optionnel |
| generateMealPlan | InvokeLLM | deepseek/deepseek-chat | Non |
| generateTrainingProgram | InvokeLLM (service role) | deepseek/deepseek-chat | Non |
| parseHealthFile | InvokeLLM (optionnel fichier) | google/gemini-2.0-flash | Optionnel |
| processHealthInput | InvokeLLM | deepseek/deepseek-chat | Optionnel |
| weeklyInsightGenerate | OpenRouter direct | deepseek/deepseek-chat | Non |

---

## 4. Email — Resend

### Configuration

```typescript
// supabase/functions/_shared/resend.ts
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  from?: string
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from || 'PawCoach <noreply@pawcoach.app>',
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })
  if (!res.ok) throw new Error(`Resend error: ${res.status}`)
  return res.json()
}
```

### Fonctions qui envoient des emails

| Fonction CRON | Quand | Frequence |
|--------------|-------|-----------|
| vaccineReminders | J-14, J-7, J-3, J-1, J-0 avant rappel | Quotidien 09:00 |
| medicationReminders | Idem | Quotidien 09:00 |
| vetVisitReminders | Idem | Quotidien 09:00 |
| streakReminder | Si streak active et pas de checkin | Quotidien 20:00 |
| walkReminder | Si walk_reminder_enabled a l'heure configuree | Horaire |
| trialExpiryReminder | J-3 et J-1 avant fin trial | Quotidien 10:00 |
| monthlySummary | 1er du mois, premium only | Mensuel 08:00 |
| vetAccess (invokable) | A chaque partage de dossier | On-demand |

---

## 5. RevenueCat — Remplace Stripe

### Changements structurels

| Stripe (avant) | RevenueCat (apres) | Notes |
|----------------|-------------------|-------|
| `stripeCheckout` (Edge Function) | SUPPRIME | Achat gere par RevenueCat SDK natif (iOS/Android) |
| `stripePortal` (Edge Function) | SUPPRIME | Gestion abo via les stores natifs |
| `stripeWebhook` (Edge Function) | `revenuecat-webhook` | Webhook RevenueCat pour synchro serveur |
| `stripe_customer_id` (profiles) | `revenuecat_app_user_id` | Deja dans 001_schema.sql |
| `stripe_subscription_id` | `subscription_id` | Generique, pas Stripe-specifique |
| `stripe_subscription_status` | `subscription_status` | Idem |

### Flux d'achat RevenueCat

```
1. User tape "Devenir Premium" dans l'app
2. App appelle RevenueCat SDK → affiche la paywall native iOS/Android
3. Achat valide par Apple/Google → RevenueCat recoit la confirmation
4. RevenueCat envoie un webhook POST a notre Edge Function
5. Edge Function met a jour profiles.is_premium = true
6. Frontend verifie l'entitlement via RevenueCat SDK
```

### revenuecat-webhook Edge Function

```typescript
// supabase/functions/revenuecat-webhook/index.ts
// Ecoute les evenements RevenueCat :
//   INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION,
//   BILLING_ISSUE, PRODUCT_CHANGE

// Logique :
// 1. Verifier la signature webhook (Authorization header)
// 2. Extraire app_user_id et event_type
// 3. Mapper app_user_id → profiles.id
// 4. Mettre a jour is_premium, subscription_status, premium_since
```

### Mapping des evenements

| Evenement RevenueCat | Action profiles | Notes |
|---------------------|----------------|-------|
| INITIAL_PURCHASE | `is_premium=true, premium_since=now(), subscription_status='active'` | |
| RENEWAL | `subscription_status='active'` | Renouvellement auto |
| CANCELLATION | `subscription_status='cancelled'` | Premium reste actif jusqu'a expiration |
| EXPIRATION | `is_premium=false, subscription_status='expired'` | |
| BILLING_ISSUE | `subscription_status='billing_issue'` | Garder premium 2 cycles max (meme logique Stripe) |
| PRODUCT_CHANGE | Mettre a jour le plan | Upgrade/downgrade |

### Configuration RevenueCat

1. Creer le projet RevenueCat avec les apps iOS et Android
2. Configurer les produits dans App Store Connect et Google Play Console :
   - `pawcoach_monthly` : 7,99 EUR/mois
   - `pawcoach_yearly` : 59,99 EUR/an
3. Creer l'entitlement `premium` dans RevenueCat
4. Configurer le webhook vers `https://<project>.supabase.co/functions/v1/revenuecat-webhook`
5. Stocker la cle API dans Supabase : `supabase secrets set REVENUECAT_WEBHOOK_SECRET=xxx`
6. Frontend : initialiser RevenueCat SDK avec `Purchases.configure({ apiKey: 'xxx' })`
7. A chaque login, `Purchases.logIn(userId)` pour lier l'user Supabase

---

## 6. Auth — Supabase Auth

### Migration Base44 Auth → Supabase Auth

| Aspect | Base44 | Supabase |
|--------|--------|----------|
| Provider | Base44 OAuth proprietaire | Supabase Auth (email + Apple + Google) |
| Token | Gere par `@base44/sdk` | JWT standard dans `Authorization: Bearer` |
| User object | `base44.auth.me()` | `supabase.auth.getUser()` + `profiles` table |
| Update user | `base44.auth.updateMe(data)` | `supabase.from('profiles').update(data)` |
| Login | `base44.auth.redirectToLogin(url)` | `supabase.auth.signInWithOAuth({ provider })` |
| Logout | `base44.auth.logout(url)` | `supabase.auth.signOut()` |

### Frontend SDK

```typescript
// src/lib/supabase.ts (Expo)
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // important pour Expo
    },
  }
)
```

---

## 7. Storage — Supabase Storage

### Buckets

| Bucket | Acces | Usage | Convention de path |
|--------|-------|-------|--------------------|
| `dog-photos` | Public read, auth write | Photos de profil des chiens | `{user_id}/{dog_id}/{filename}` |
| `food-scans` | Private | Photos de scan alimentaire | `{user_id}/{timestamp}_{filename}` |
| `growth-photos` | Private | Photos de croissance | `{user_id}/{dog_id}/{date}_{filename}` |
| `health-docs` | Private | Documents sante importes | `{user_id}/{dog_id}/{filename}` |
| `chat-images` | Private | Images envoyees dans le chat | `{user_id}/{timestamp}_{filename}` |

### RLS Storage

Chaque bucket a la meme policy :
- INSERT : `auth.uid()::text = (storage.foldername(name))[1]` (le 1er dossier = user_id)
- SELECT : idem pour les buckets prives
- SELECT : `true` pour `dog-photos` (public)

---

## 8. CRONs — pg_cron

Les jobs pg_cron appellent les Edge Functions via pg_net (HTTP POST).

```sql
-- A executer APRES deploiement des Edge Functions
-- Remplacer <project> et <service_role_key>

select cron.schedule('vaccine-reminders',    '0 9 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/vaccine-reminders',    headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('medication-reminders', '0 9 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/medication-reminders', headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('vet-visit-reminders',  '0 9 * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/vet-visit-reminders',  headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('streak-reminder',      '0 20 * * *', $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/streak-reminder',      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('walk-reminder',        '0 * * * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/walk-reminder',        headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('trial-expiry',         '0 10 * * *', $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/trial-expiry-reminder', headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('monthly-summary',      '0 8 1 * *',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/monthly-summary',      headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
select cron.schedule('weekly-insight',       '0 8 * * 1',  $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/weekly-insight-generate', headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
```

---

## 9. Variables d'environnement (Supabase Secrets)

```bash
# A configurer via: supabase secrets set KEY=value

OPENROUTER_API_KEY=sk-or-...          # LLM API
RESEND_API_KEY=re_...                  # Email transactionnel
REVENUECAT_WEBHOOK_SECRET=whsec_...   # Signature webhook RevenueCat
REVENUECAT_API_KEY=sk_...             # RevenueCat Server API (pour revocation)
PRE_DIAG_SECRET=...                   # HMAC pour pre/final diagnosis chain
```

---

## 10. Ordre de migration recommande

### Phase 1 — Fondations (pas de code frontend)
1. Deployer le schema SQL (`001_schema.sql` + `002_schema_fixes.sql`)
2. Configurer Storage buckets + RLS
3. Deployer `_shared/` (helpers partages)
4. Deployer `revenuecat-webhook` + configurer RevenueCat
5. Deployer `delete-user` (RGPD)

### Phase 2 — Edge Functions simples (pas de LLM)
6. `create-dog` → ou supprimer si INSERT direct via RLS suffit
7. `vet-access`
8. CRONs rappels email (5 fonctions)

### Phase 3 — Edge Functions LLM
9. `pawcoach-chat` (la plus critique — tester en parallele avec Base44)
10. `daily-checkin`
11. `analyze-food`, `compare-foods`
12. `pre-diagnosis`, `final-diagnosis`, `generate-diagnosis-pdf`
13. `generate-meal-plan`, `generate-training-program`
14. `parse-health-file`, `process-health-input`
15. `analyze-growth-photo`
16. `weekly-insight-generate`, `monthly-summary`

### Phase 4 — Frontend (Expo React Native)
17. Remplacer `@base44/sdk` par `@supabase/supabase-js`
18. Remplacer `base44.auth.*` par `supabase.auth.*`
19. Remplacer `base44.entities.X.*` par `supabase.from('x').*`
20. Remplacer `base44.functions.invoke(name, body)` par `supabase.functions.invoke(name, { body })`
21. Integrer RevenueCat SDK (`react-native-purchases`)
22. Remplacer Stripe checkout par RevenueCat paywall

---

## 11. Risques et decisions ouvertes

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Performance pawcoach-chat (14 requetes) | Latence > 3s | Vue materialisee `dog_context` ou requete SQL jointure |
| Migration users existants Base44 → Supabase Auth | Perte de sessions | Export CSV + import batch + magic link re-auth |
| Doubles ecritures pendant migration | Incoherence donnees | Periode de dual-write avec flag `MIGRATION_MODE` |
| RevenueCat sandbox vs production | Achats test factores | Utiliser RevenueCat sandbox mode pendant dev |
| Edge Function cold starts | +500ms premiere requete | Garder les fonctions < 50KB, precharger les deps |
| Quota race condition | Double-consommation de credit | Fonctions SQL `FOR UPDATE` lock (deja implemente dans `001_schema.sql`) |

---

## 12. Fonctions supprimees (Stripe → RevenueCat)

| Fonction Stripe | Status | Raison |
|----------------|--------|--------|
| `stripeCheckout` | SUPPRIME | Achats geres natif par RevenueCat SDK |
| `stripePortal` | SUPPRIME | Gestion abo via stores natifs (Settings iOS/Android) |
| `stripeWebhook` | REMPLACE par `revenuecat-webhook` | Meme role, protocole different |

---

*Fin du document. Ce fichier sert de reference pour les devs pendant l'implementation.*
