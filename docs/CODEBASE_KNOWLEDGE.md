# PawCoach — Codebase Knowledge

> Document genere le 28 mars 2026 par analyse statique du code source.
> Chaque regle metier a une **reference** (fichier:ligne). Les elements incertains sont marques **[A VERIFIER]**.

---

## 1. Regles metier

### 1.1 Systeme de credits IA

Deux pools de credits independants, reinitialises quotidiennement pour les utilisateurs free.

| Pool | Limite free/jour | Premium | Reset | Reference |
|------|-----------------|---------|-------|-----------|
| Messages (chat IA) | 10 par jour | Illimite (Infinity) | Quotidien, verifie via `messages_daily_reset !== today` | `src/utils/ai-credits.js:6` |
| Actions IA (scan, diagnostic) | 3 par jour | Illimite (Infinity) | Quotidien, verifie via `actions_daily_reset !== today` | `src/utils/ai-credits.js:7` |

**Mecanisme de reset** (`src/utils/ai-credits.js:14-51`) :
- A chaque visite, `initCredits(user)` verifie si `messages_daily_reset` ou `actions_daily_reset` est different de la date du jour.
- Si oui, reset a `MSG_DAILY_LIMIT` (10) ou `ACTION_DAILY_LIMIT` (3) et mise a jour via `base44.auth.updateMe()`.
- Si le champ n'existe pas (`null`), initialisation au max.

**Verification serveur (double controle)** (`base44/functions/pawcoachChat/entry.ts:40-60`) :
- Le backend re-verifie le quota cote serveur pour eviter le bypass multi-onglets.
- Si `messages_remaining <= 0` ET `messages_daily_reset === today` : retourne `{ error: 'quota_exceeded' }` avec status 429.
- Le decrement est atomique par requete (pas de race condition possible au sein d'une requete).

**Consommation** :
- `consumeMessageCredit(current)` : decremente de 1, min 0, persiste via `base44.auth.updateMe` — `src/utils/ai-credits.js:56-63`
- `consumeActionCredit(current)` : idem — `src/utils/ai-credits.js:68-79`
- Hook `useActionCredits()` : gere l'etat frontend, inclut un guard anti-double-appel (`consumingRef`) — `src/hooks/useActionCredits.js:30-44`

**Scan alimentaire — pool separe** (`src/pages/Scan.jsx:63,166-179`) :
- `FREE_SCAN_LIMIT = 3` scans par **semaine** (pas par jour).
- Compteur stocke dans `user.scans_this_week` + `user.scans_week_start`.
- Reset hebdomadaire quand `scans_week_start !== getWeekStart()`.
- Premium : pas de limite.

### 1.2 Systeme Premium / Freemium

**Detection premium** (`src/utils/premium.js:4-11`) :
```
isUserPremium(user) = user.is_premium === true OU trial_expires_at > now
```

**Detection trial** (`src/utils/premium.js:16-20`) :
```
isUserOnTrial(user) = !user.is_premium ET trial_expires_at > now
```

**Jours restants trial** (`src/utils/premium.js:25-29`) :
```
getTrialDaysLeft(user) = max(0, floor(diff_ms / ms_per_day))
```

#### Tableau comparatif Free vs Premium

| Fonctionnalite | Free | Premium | Gate | Reference |
|---------------|------|---------|------|-----------|
| Chat IA (PawCoach) | 10 msg/jour | Illimite | Quota backend + frontend | `pages/Chat.jsx:213-224` |
| Scanner aliments | 3/semaine | Illimite | `checkScanLimit()` frontend | `pages/Scan.jsx:63,166-171` |
| Dressage — exercices | 3 exercices (bases) | 10 exercices (3 parcours) | `is_premium` sur chaque exercice | `pages/Training.jsx:26-36` |
| Dressage — parcours | "Les bases" (1 parcours free) | 4 parcours | `isPremium` sur chaque Journey | `pages/Training.jsx:38-71` |
| Carnet sante — vaccins + poids + notes | Oui | Oui | Pas de gate | — |
| Carnet sante — visites veto | Non | Oui | `PremiumSection` composant | `components/notebook/PremiumSection.jsx:16-22` |
| Carnet sante — medicaments | Non | Oui | `PremiumSection` composant | `components/notebook/PremiumSection.jsx:26-32` |
| Carnet sante — notes libres | Non | Oui | `PremiumSection` composant | `components/notebook/PremiumSection.jsx:33-39` |
| Rappels sante par email | Non | Oui | Backend filtre premium users | `base44/functions/vaccineReminders/entry.ts` |
| Bilan hebdomadaire IA | Non | Oui | Backend filtre `is_premium` + trial | `base44/functions/weeklyInsightGenerate/entry.ts:27-38` |
| Nombre de chiens | 1 | 3 | `FREE_DOG_LIMIT=1 / PREMIUM_DOG_LIMIT=3` enforced backend + frontend | `base44/functions/createDog/entry.ts`, `pages/Onboarding.jsx:265`, `pages/Profile.jsx:99` |
| Plans nutrition IA | 2 plans/mois (gratuit) | Illimite | `MONTHLY_FREE_LIMIT = 2` enforced frontend + backend | `components/nutrition/NutritionMealPlan.jsx:17`, `components/nutrition/MealPlanGenerator.jsx:7`, `base44/functions/generateMealPlan/entry.ts:3` |

#### Paiement Stripe

| Plan | Prix | Price ID | Reference |
|------|------|----------|-----------|
| Mensuel | 7,99 EUR/mois | `price_1T4tkFDuhaIxY4PGpnhDTx5L` | `pages/Premium.jsx:19` |
| Annuel | 59,99 EUR/an (5 EUR/mois, -37%) | `price_1T4tkFDuhaIxY4PGWLeWApDL` | `pages/Premium.jsx:20` |

**Flux Stripe** :
1. Frontend appelle `base44.functions.invoke("stripeCheckout", { priceId })` — `pages/Premium.jsx:110-113`
2. Backend cree une `checkout.session` Stripe avec `mode: "subscription"` — `base44/functions/stripeCheckout/entry.ts:21-33`
3. Success URL : `/?premium=success` — `base44/functions/stripeCheckout/entry.ts:27`
4. Webhook `stripeWebhook` ecoute les evenements :
   - `checkout.session.completed` : active `is_premium = true`, stocke `stripe_customer_id` et `stripe_subscription_id` — `entry.ts:31-63`
   - `customer.subscription.deleted` : desactive premium — `entry.ts:66-87`
   - `customer.subscription.updated` : met a jour selon `status` (active/trialing = premium) — `entry.ts:89-105`
   - `invoice.payment_failed` : garde premium pendant 2 echecs, revoque au 3eme — `entry.ts:107-129`

**Validation cote serveur** (`base44/functions/stripeCheckout/entry.ts:16`) :
```
ALLOWED_PRICES = ["price_1T4tkFDuhaIxY4PGpnhDTx5L", "price_1T4tkFDuhaIxY4PGWLeWApDL"]
```

**Nudge premium** (`pages/Home.jsx:183-188`) :
- Affiche `PremiumNudgeSheet` si : pas premium ET `premium_onboarding_nudge_shown !== true` ET signup >= 2 jours.
- Set le flag `premium_onboarding_nudge_shown = true` apres affichage.

**Post-trial sheet** (`pages/Home.jsx:190-199`) :
- Affiche `PostTrialSheet` si : pas premium ET trial expire depuis 0-3 jours ET `localStorage.pawcoach_post_trial_dismissed` absent.

### 1.3 Streaks et gamification

**Logique streak** (`components/streakHelper.jsx:4-49` + `base44/functions/dailyCheckinProcess/entry.ts:100-139`) :
- La streak est calculee a la fois cote frontend (pour les actions manuelles) et cote backend (pour le check-in quotidien).
- **Calcul** :
  - `diffDays === 1` (consecutif) : `current_streak += 1`
  - `diffDays === 2` ET `grace_days_remaining > 0` : `current_streak += 1`, consomme 1 grace day
  - Sinon : `current_streak = 1`, reset grace days
- **Grace days** : 1 jour de grace par defaut (`grace_days_remaining: 1`). Permet de rater 1 jour sans casser la streak.
- Dedup : si `last_activity_date === today`, ne rien faire.
- `longest_streak` : toujours mis a jour au max.
- Entite `Streak` : `dog_id, owner_email, current_streak, longest_streak, last_activity_date, grace_days_used, grace_days_remaining`

**Milestones** (`pages/Home.jsx:38-45`) :
```
3 jours, 7 jours, 14 jours, 30 jours, 60 jours, 100 jours
```
Chaque milestone declenche confetti + toast.

**Achievements (badges)** :
- Entite `DogAchievement` : stocke les badges gagnes avec `points_awarded`.
- Verifie par `checkStreakBadges()` — `components/achievements/badgeUtils.js`
- Points calcules et affiches sur la page Profile — `pages/Profile.jsx:52-58`

### 1.4 Check-in quotidien

**Flux complet** (frontend → backend → IA) :

1. L'utilisateur fait un check-in depuis Home avec `mood` (1-4), `energy` (1-3), `appetite` (1-3), `symptoms[]`, `notes`, `behavior_notes`.
2. Appel backend `dailyCheckinProcess` — `base44/functions/dailyCheckinProcess/entry.ts`
3. **Validations backend** :
   - `mood` : entier 1-4 — `entry.ts:15`
   - `energy` : entier 1-3 — `entry.ts:16`
   - `appetite` : entier 1-3 — `entry.ts:17`
   - Ownership check : `dog.owner === user.email` — `entry.ts:23`
   - Dedup : 1 seul check-in par jour par chien (verifie via `DailyCheckin.filter({ dog_id, date: today })`) — `entry.ts:46-47`
4. **Analyse de tendances** (backend, 7 derniers jours) :
   - Humeur basse 3+ jours de suite
   - Fatigue 3+ jours de suite
   - Appetit reduit 3+ jours de suite
   - Symptomes recurrents (2+ fois en 7 jours)
5. **Reponse IA** : le backend genere un conseil personnalise via LLM en incluant le contexte du chien, les tendances, et le segment d'age (chiot/adulte/senior).
6. **Streak** mise a jour backend (meme logique que `streakHelper`).

**Segment d'age** (backend `entry.ts:26-33`) :
- Chiot : < 12 mois
- Senior : >= 96 mois (8 ans)
- Adulte : entre les deux

### 1.5 Systeme de nutrition

**Tabs Nutri** (`pages/Nutri.jsx:43-49`) :
- Scanner, Plan repas, Coach IA, Comparer croquettes, Preferences

**Coach Nutri** : utilise un `useReducer` (`coachReducer`) pour gerer l'etat de la conversation IA — `pages/Nutri.jsx:51-77`.
- Actions : `SET_MESSAGES`, `SET_INPUT`, `SET_LOADING`, `SET_MESSAGES_REMAINING`, `SET_BOOKMARKED`, `SET_STREAMING`, `SET_STREAMING_TEXT`, `SET_SHOW_SCROLL_BTN`, `SET_LAST_FAILED_INPUT`, `RESET_COACH`

**Plan repas** : stocke dans `NutritionPlan` entite, `monthlyPlanCount` pour limiter les plans. Limite : 2/mois pour les gratuits (`MONTHLY_FREE_LIMIT = 2`). Enforcement double : frontend (`NutritionMealPlan.jsx:82`) bloque la generation, backend (`generateMealPlan/entry.ts:33`) retourne 429. Premium = illimite.

**Scan alimentaire** (`pages/Scan.jsx:195-241`) :
- Upload image via `base44.integrations.Core.UploadFile`
- Analyse via `base44.integrations.Core.InvokeLLM` avec prompt personnalise incluant race, age, poids, allergies, preferences alimentaires
- Verdicts : `safe`, `caution`, `toxic`
- Score : 1-10 (null si aliment brut)
- `allergen_alerts` : detection auto si aliment correspond aux `disliked_foods` des preferences
- Vibration haptique si `toxic` — `Scan.jsx:235`
- 2 modes : "food" (aliment brut) et "label" (etiquette croquettes) — `Scan.jsx:118`

### 1.6 Systeme de sante

**Tabs Sante** (`pages/Sante.jsx:37-43`) :
- Carnet, Symptomes, Croissance, Documents, Veto

**Health Score** (`utils/healthStatus.js:293-382`) :
- Score 0-100, pondere :
  - Vaccins : 40% (core vaccines up_to_date/due_soon/overdue)
  - Poids : 20% (recence + stabilite + BCS bonus/malus)
  - Visites veto : 25% (recence, bonus si RDV programme dans 30j)
  - Activite : 15% (fraicheur du dernier record)
- Labels : Excellent (>=80), Bon (>=60), A ameliorer (>=40), Attention requise (<40)

**Vaccins WSAVA 2024** (`utils/healthStatus.js:21-87`) :
- Core (essentiels) : CHP (3 ans), Leptospirose (1 an)
- Recommande : Rage (1 an)
- Optionnels : Toux de chenil, Piroplasmose, Leishmaniose (tous 1 an)
- Statuts : `up_to_date`, `due_soon` (<30j), `overdue`, `never`
- Aliases de noms (60+ alias pour matcher les entrees utilisateur) — `utils/healthStatus.js:91-105`

**Next Action** (`utils/healthStatus.js:469-617`) :
Priorites dans l'ordre :
1. Carnet vide → "Commence le carnet"
2. Vaccin core en retard → "Vaccin en retard"
3. Vaccin core jamais fait → "Primo-vaccination"
4. Pas de visite veto > 12 mois → "Visite annuelle"
5. Vaccin due soon → "Vaccin a prevoir"
6. Poids pas mis a jour > 60 jours → "Poids a mettre a jour"
7. Variation poids > 5% → "Prise/perte de poids"
8. Tout est a jour → "All good"

**Poids** (`utils/healthStatus.js:234-282`) :
- Direction : stable (<2% variation), up, down, unknown
- Compare le poids actuel au poids d'il y a ~30 jours
- BCS (Body Condition Score) WSAVA 1-9 : bonus si 4-5 (ideal), malus si <3 ou >6

**Rappels email (CRON)** :
- `vaccineReminders` : envoie a J-14, J-7, J-3, J-1, J-0 du rappel — `base44/functions/vaccineReminders/entry.ts:42`
- `medicationReminders` : rappels medicaments [A VERIFIER — structure similaire]
- `vetVisitReminders` : rappels visites veto [A VERIFIER]
- `streakReminder` : rappel si streak en cours et pas de check-in
- `walkReminder` : rappel de balade configurable
- `trialExpiryReminder` : rappel fin de trial
- `monthlySummary` : bilan mensuel premium

### 1.7 Systeme veterinaire (VetPortal)

**Flux** (`pages/VetPortal.jsx:14-74`) :
1. Le veterinaire se connecte et accede au portail via `/VetPortal`.
2. Accepte un code d'invitation (`inviteCode`) pour acceder au dossier d'un chien.
3. Backend `vetAccess` gere les actions :
   - `listMyPatients` : liste les chiens partages avec le veto — `entry.ts:42-45`
   - `accept` : accepte un code d'invitation — `entry.ts:54-73`
4. Le veto peut voir le dossier complet du chien via `VetDogView`.
5. Le proprietaire partage via `ShareVetModal` qui genere un code d'invitation.
6. Entites : `SharedVetAccess` (lien chien-veto), `VetNote` (notes du veto)

**Email de partage** : le backend `vetAccess` genere un email HTML avec la fiche sante complete (vaccins, medicaments, poids, alertes) — `base44/functions/vetAccess/entry.ts:13-95`

### 1.8 Recommandations Home

**Moteur** (`utils/recommendations.js:20-319`) — genere les 3 recommandations les plus prioritaires :

| Priorite | ID | Condition | Page cible |
|----------|----|-----------|------------|
| 1 | `vaccine_overdue` | Vaccin core en retard | Sante (tab vaccine) |
| 1 | `recurring_symptom` | Meme symptome 3+ fois sur 7 check-ins | Sante (tab malade) |
| 1 | `food_alert` (toxic) | Scan toxic recent (<7j) | Scan |
| 1 | `diagnosis_followup` (urgent) | Diagnostic urgent <14j | Sante (tab findvet) |
| 2 | `vaccine_soon` | Vaccin dans <30j | Sante (tab vaccine) |
| 2 | `no_checkin` | 0 check-in cette semaine | Home |
| 2 | `active_medication` | Medicament actif avec prochain rappel | Sante (tab medication) |
| 3 | `training` | <2 exercices cette semaine | Activite (tab dressage) |
| 3 | `no_walk` | Pas de balade depuis 3+ jours | Activite (tab balade) |
| 3 | `walk_behavior` | Tag comportemental 2+ fois/semaine | Activite (tab dressage) |
| 3 | `nutrition_plan` | Plan actif <7j | Nutri (tab mealplan) |
| 4 | `scan` | Jamais de scan | Scan |
| 4 | `daily_log` | Pas de log aujourd'hui | Home |
| 5 | `weight` | Pas de poids depuis 30+ jours | Sante (tab weight) |

### 1.9 Diagnostic IA

**Flux en 2 etapes** :
1. `preDiagnosis` : questions de triage basees sur les symptomes — `base44/functions/preDiagnosis/entry.ts`
2. `finalDiagnosis` : analyse complete avec generation de rapport — `base44/functions/finalDiagnosis/entry.ts`
3. `generateDiagnosisPDF` : export PDF du rapport — `base44/functions/generateDiagnosisPDF/entry.ts`
- Entite : `DiagnosisReport` avec `urgency_level` (high/urgent/normal)

### 1.10 Bilan hebdomadaire (Weekly Insight)

**Generation** (`base44/functions/weeklyInsightGenerate/entry.ts`) :
- CRON (execute automatiquement chaque semaine)
- Uniquement pour users premium ou en trial (`is_premium: true` OU `trial_expires_at >= today`)
- Utilise OpenRouter (pas Base44 InvokeLLM) via `OPENROUTER_API_KEY`
- Dedup : skip si insight existe deja pour ce chien + cette semaine
- Analyse check-ins, progress, scans, daily logs, health records de la semaine precedente
- Entite : `WeeklyInsight` avec `dog_id, week_start, is_read`

**Affichage** : uniquement sur Home, uniquement premium — `pages/Home.jsx:118-119`

### 1.11 Suppression de compte (RGPD)

**Flux** (`base44/functions/deleteUser/entry.ts`) :
1. Annule l'abonnement Stripe (best-effort, non-bloquant)
2. Recupere tous les chiens de l'utilisateur
3. Supprime toutes les entites liees aux chiens (14 types : HealthRecord, DailyCheckin, DailyLog, Streak, FoodScan, DogAchievement, UserProgress, WeeklyInsight, ChatMessage, GrowthEntry, DiagnosisReport, NutritionPlan, DietPreferences, SharedVetAccess, VetNote, ParkReview)
4. Supprime les entites liees a l'utilisateur (Dog, Bookmark, PlaceFavorite, SharedVetAccess, VetNote)
5. Supprime l'entite User elle-meme

---

## 2. Routes et navigation

### 2.1 Configuration des routes

**Fichier** : `src/pages.config.js`

| Route | Page | Chargement | BottomNav parent |
|-------|------|-----------|------------------|
| `/Home` | Home | Eager | Accueil |
| `/Sante` | Sante | Eager | Sante |
| `/Activite` | Activite | Eager | Activite |
| `/Nutri` | Nutri | Eager | Nutrition |
| `/Profile` | Profile | Eager | Profil |
| `/Chat` | Chat | Lazy | (enfant de Home) |
| `/Dashboard` | Dashboard | Lazy | (enfant de Profile) |
| `/DogProfile` | DogProfile | Lazy | (enfant de Profile) |
| `/DogPublicProfile` | DogPublicProfile | Lazy | — |
| `/Library` | Library | Lazy | (enfant de Profile) |
| `/Onboarding` | Onboarding | Lazy | — |
| `/Premium` | Premium | Lazy | — |
| `/Scan` | Scan | Lazy | — |
| `/Training` | Training | Lazy | — |
| `/VetDogView` | VetDogView | Lazy | (enfant de Profile) |
| `/VetPortal` | VetPortal | Lazy | (enfant de Profile) |
| `/Privacy` | Privacy | Lazy | — |
| `/Terms` | Terms | Lazy | — |

**Main page** : `Home` — `pages.config.js:99`

### 2.2 BottomNav

**5 onglets** (`components/BottomNav.jsx:8-14`) :
1. Accueil → Home
2. Sante → Sante
3. Activite → Activite
4. Nutrition → Nutri
5. Profil → Profile

**Pages secondaires → parent** (`components/BottomNav.jsx:17-24`) :
- Library, Dashboard, DogProfile, VetPortal, VetDogView → Profile
- Chat → Home

**Stack pages** avec sous-tabs persistants (`components/BottomNav.jsx:27`) : Sante, Activite, Nutri
- Le sous-tab est stocke dans `sessionStorage` et restaure a la navigation.

### 2.3 Sous-tabs par page

**Sante** (`pages/Sante.jsx:37-43`) : carnet, malade (symptomes), growth (croissance), import (documents), findvet (veto)
- Deep links supportes : `?tab=vaccine`, `?tab=weight`, `?tab=vet_visit`, `?tab=medication`, `?tab=note`, `?tab=vet`, `?tab=qr`

**Activite** (`pages/Activite.jsx:29-34`) : balade, historique, programme, dressage

**Nutri** (`pages/Nutri.jsx:43-49`) : scan, mealplan, coach, compare, prefs

### 2.4 Protection des pages

- **Auth requise** : Toutes les pages font `base44.auth.me()` au chargement. L'AuthContext gere la redirection vers login si pas authentifie.
- **VetPortal** verifie explicitement `base44.auth.isAuthenticated()` et redirige si non — `pages/VetPortal.jsx:27-29`
- **Onboarding** : pas de protection premium, accessible a tous.
- **Premium page** : accessible a tous (c'est la page de vente).
- **Privacy / Terms** : accessibles a tous (legal).

---

## 3. Architecture cle

### 3.1 DogContext

**Fichier** : `src/lib/DogContext.jsx`

**Fournit** :
- `dog` : le chien actif (ou null)
- `dogs` : la liste de tous les chiens de l'utilisateur
- `setDog` / `setDogs` : setters directs
- `loadingDog` : boolean de chargement
- `refreshDogs()` : recharge la liste depuis la BDD

**Fonctionnement** :
- Depend de `AuthContext` (attend que `user` soit disponible)
- Charge les chiens via `Dog.filter({ owner: user.email })`
- Selectionne le chien actif via `getActiveDog(list)` — qui utilise `localStorage.activeDogId`
- Hook : `useDog()` — throw si utilise hors du provider

**Important** : DogContext est un provider global. Mais certaines pages (Home, Chat, Scan, Training, Profile) chargent aussi leur propre `Dog.filter()` directement — duplication intentionnelle pour l'instant [A VERIFIER si des pages utilisent useDog ou non].

### 3.2 AuthContext

**Fichier** : `src/lib/AuthContext.jsx`

**Fournit** :
- `user` : objet utilisateur Base44 (ou null)
- `isAuthenticated` : boolean
- `isLoadingAuth` : boolean
- `isLoadingPublicSettings` : boolean
- `authError` : `{ type, message }` ou null — types: `auth_required`, `user_not_registered`, `unknown`
- `appPublicSettings` : settings publiques de l'app Base44
- `logout(shouldRedirect?)` : deconnexion + clear notifications
- `navigateToLogin()` : redirection vers la page de login Base44
- `checkAppState()` : re-verifie l'etat auth

**Flux auth** (`AuthContext.jsx:21-89`) :
1. `checkAppState()` appele au mount
2. Recupere les public settings via API
3. Si token present, appelle `base44.auth.me()` pour verifier l'authentification
4. Gere les erreurs 401/403 → `authError = { type: 'auth_required' }`

### 3.3 HomeCacheContext

**Fichier** : `src/lib/HomeCacheContext.jsx`

**Role** : Cache en memoire (useRef) des donnees de la page Home pour eviter les re-fetch a chaque navigation.

**TTL** : 2 minutes (`CACHE_TTL = 2 * 60 * 1000`) — `HomeCacheContext.jsx:3`

**Invalidation** : quand `activeDogId` change (compare `cacheRef.current.dogId` vs `localStorage.activeDogId`) — `HomeCacheContext.jsx:13-14`

**Fournit** :
- `getCachedHome()` : retourne le cache si frais, null sinon
- `setCachedHome(data)` : ecrit le cache (user, dog, dogData, insights)
- `invalidateHome()` : force la re-fetch

### 3.4 useHomeData

**Defini dans** : `pages/Home.jsx:50-149` (hook local, pas exporte)

**Retourne** : `{ dogData, setDogData, insights, setInsights, isDataStale, setIsDataStale, refreshHome, applyDogData, applyInsights, getCachedHome }`

**dogData** contient :
- `todayCheckin`, `streak`, `recentCheckins` (7 derniers), `records` (health), `exercises` (progress), `scans`, `dailyLogs`, `diagnosisReports`, `nutritionPlans`, `trainingBookmarks`, `behaviorBookmarks`

**Requetes paralleles** (`Home.jsx:77-89`) : 11 requetes en `Promise.all` avec `.catch(() => [])` pour chacune (resilience).

### 3.5 useReducer Nutri

**Fichier** : `pages/Nutri.jsx:51-77`

**Etat** : `COACH_INITIAL_STATE` — `messages`, `input`, `loading`, `messagesRemaining`, `bookmarked`, `isStreaming`, `streamingText`, `showScrollBtn`, `lastFailedInput`

**Actions** : `SET_MESSAGES`, `SET_INPUT`, `SET_LOADING`, `SET_MESSAGES_REMAINING`, `SET_BOOKMARKED`, `SET_STREAMING`, `SET_STREAMING_TEXT`, `SET_SHOW_SCROLL_BTN`, `SET_LAST_FAILED_INPUT`, `RESET_COACH`

Utilise pour gerer la complexite de la conversation IA dans la tab "Coach IA" de la page Nutri.

### 3.6 Systeme d'authentification

- **Provider** : `AuthProvider` dans `AuthContext.jsx`
- **SDK** : `@base44/sdk` avec `createClient({ requiresAuth: true })` — `api/base44Client.js:7-14`
- **Token** : gere automatiquement par le SDK Base44 (URL params ou localStorage)
- **Login** : `base44.auth.redirectToLogin(returnUrl)`
- **Logout** : `base44.auth.logout(redirectUrl)` + clear du cache notifications

---

## 4. Dependances critiques

### 4.1 Utilitaires partages et leurs consommateurs

| Utilitaire | Fichier | Consomme par |
|-----------|---------|--------------|
| `isUserPremium` | `utils/premium.js` | Home, Chat, Scan, Training, Nutri, Profile, Sante, Premium, Onboarding, DailyBriefing, WeeklyInsightCard |
| `getActiveDog` | `utils/index.ts` | Home, Chat, Scan, Training, Nutri, Profile, Dashboard, Premium, Activite, Sante |
| `createPageUrl` | `utils/index.ts` | Quasi-toutes les pages et composants avec navigation |
| `getTodayString` | `utils/recommendations.js` | Home, Chat, streakHelper, ai-credits |
| `getWeekStart` | `utils/dateHelpers.js` | Scan, Nutri, Dashboard, recommendations |
| `initCredits` | `utils/ai-credits.js` | Chat, Nutri |
| `updateStreakSilently` | `components/streakHelper.jsx` | Chat, Scan, Sante |
| `computeVaccineMap` | `utils/healthStatus.js` | Sante, Dashboard |
| `computeHealthScore` | `utils/healthStatus.js` | Sante, Dashboard |
| `buildRecommendations` | `utils/recommendations.js` | Home |
| `matchVaccineKey` | `utils/healthStatus.js` | recommendations.js, Sante |
| `getDogAgeSegment` | `utils/healthStatus.js` | Premium.jsx |
| `dogAgeMonths` | `utils/healthStatus.js` | Training.jsx |

### 4.2 Fonctions backend → Frontend

| Fonction backend | Appele par (frontend) | Methode d'appel |
|-----------------|----------------------|-----------------|
| `pawcoachChat` | Chat.jsx, Nutri.jsx (coach) | `base44.functions.invoke("pawcoachChat", {...})` |
| `stripeCheckout` | Premium.jsx | `base44.functions.invoke("stripeCheckout", { priceId })` |
| `stripePortal` | Profile (SubscriptionSection) | `base44.functions.invoke("stripePortal", ...)` |
| `dailyCheckinProcess` | Home.jsx | `base44.functions.invoke("dailyCheckinProcess", {...})` |
| `vetAccess` | VetPortal.jsx, ShareVetModal | `base44.functions.invoke("vetAccess", { action, ... })` |
| `finalDiagnosis` | Sante (DiagnosisContent) | `base44.functions.invoke("finalDiagnosis", {...})` |
| `preDiagnosis` | Sante (DiagnosisContent) | `base44.functions.invoke("preDiagnosis", {...})` |
| `generateDiagnosisPDF` | Sante (DownloadHealthPDF) | `base44.functions.invoke("generateDiagnosisPDF", {...})` |
| `deleteUser` | Profile (SettingsSection) | `base44.functions.invoke("deleteUser", ...)` |
| `parseHealthFile` | Sante (HealthImportContent) | `base44.functions.invoke("parseHealthFile", {...})` |
| `processHealthInput` | Sante (HealthAssistantSheet) | `base44.functions.invoke("processHealthInput", {...})` |
| `analyzeGrowthPhoto` | Sante (GrowthTrackerContent) | `base44.functions.invoke("analyzeGrowthPhoto", {...})` |
| `generateTrainingProgram` | Activite (AITrainingProgram) | `base44.functions.invoke("generateTrainingProgram", {...})` |

**Fonctions CRON (pas d'appel frontend)** :
- `vaccineReminders` — rappels vaccins par email
- `medicationReminders` — rappels medicaments par email
- `vetVisitReminders` — rappels visites veto
- `streakReminder` — rappel streak
- `walkReminder` — rappel balade
- `trialExpiryReminder` — rappel fin trial
- `monthlySummary` — bilan mensuel
- `weeklyInsightGenerate` — generation bilan hebdomadaire
- `stripeWebhook` — webhook Stripe (appele par Stripe, pas par le frontend)

### 4.3 Points de couplage dangereux

1. **`isUserPremium()`** — utilise par 10+ composants. Toute modification de la logique premium impacte toute l'app.
2. **`getActiveDog()`** — repose sur `localStorage.activeDogId`. Si le format de l'ID change, toute l'app casse.
3. **`base44.auth.me()`** — appele dans quasi-chaque page au mount. Un changement dans la structure du user object impacte partout.
4. **`utils/healthStatus.js`** — le plus gros fichier utilitaire (663 lignes). Utilise par Sante, Dashboard, recommendations.js. Toute modification des calculs de score impacte la Home ET le Dashboard.
5. **`streakHelper.jsx`** — logique dupliquee entre le frontend et le backend (`dailyCheckinProcess`). Les deux DOIVENT rester synchronises.
6. **Entites Base44** — le fichier `api/entities.js` est un wrapper leger. Toute modification du schema (ajout/suppression de champ) necessite un Build prompt Base44 (pas modifiable par Git).

---

## 5. Conventions

### 5.1 Entites Base44

**18 entites** definies dans `src/api/entities.js` :
`Dog`, `HealthRecord`, `DailyCheckin`, `DailyLog`, `Streak`, `FoodScan`, `UserProgress`, `DiagnosisReport`, `NutritionPlan`, `Bookmark`, `WeeklyInsight`, `SharedVetAccess`, `DogAchievement`, `DietPreferences`, `GrowthEntry`, `ParkReview`, `PlaceFavorite`, `ChatMessage`, `VetNote`

**API standard** : `.filter(query, sort?, limit?)`, `.create(data)`, `.update(id, data)`, `.delete(id)`

**User** : pas dans entities.js — acces via `base44.auth.me()` et `base44.auth.updateMe(data)`. Cote backend : `base44.asServiceRole.entities.User.filter/update/delete`.

### 5.2 Patterns de gestion d'erreur

**Frontend** :
- `.catch(() => [])` systematique sur les requetes paralleles dans Home (pattern resilient) — `Home.jsx:77-89`
- `try/catch` avec `toast.error("message utilisateur en francais")` dans chaque handler
- `console.warn()` pour les erreurs non-critiques (streak, nudge flag)
- `console.error()` pour les erreurs critiques

**Backend** :
- Validation des inputs avec `Response.json({ error: 'message' }, { status: 4xx })`
- `sanitize(s, max)` : `String(s).substring(0, max).replace(/[<>]/g, '')` — present dans `pawcoachChat`, `dailyCheckinProcess`
- Ownership checks : `dog.owner !== user.email → 403`
- Image URL validation (SSRF prevention) : whitelist `base44.app`, `amazonaws.com` — `pawcoachChat/entry.ts:29-37`

### 5.3 Patterns de loading states

- **SkeletonPage** (`components/ui/SkeletonPage.jsx`) : composant reutilisable avec variants (`list`, etc.)
- **Pattern standard** : `const [loading, setLoading] = useState(true)` → `if (loading) return <SkeletonPage ... />`
- **Shimmer** : `animate-pulse` sur des blocs gris pour simuler le contenu
- **Pull-to-refresh** : composant `PullToRefresh` utilise sur Home, Sante, Activite

### 5.4 Patterns d'animation

**Fichier central** : `src/lib/animations.js`

| Preset | Usage | Valeurs |
|--------|-------|---------|
| `spring` | Transitions UI generales | stiffness: 360, damping: 28 |
| `springGentle` | Messages, slide-ins | stiffness: 120, damping: 20 |
| `springSnappy` | Expand/collapse, reveals | stiffness: 300, damping: 25 |
| `springTab` | BottomNav, tab switches | stiffness: 500, damping: 35 |
| `tapScale` | Press feedback cards | scale: 0.97 |
| `pressIn` | CTA buttons | scale: 0.95, opacity: 0.82 |
| `fadeInUp` | Entrees de contenu | opacity: 0→1, y: 20→0 |
| `staggerContainer` / `staggerItem` | Listes animees | stagger: 80ms |
| `staggerDelay` | Delai entre items | 50ms |

**Convention** : utiliser les presets de `animations.js`, jamais de valeurs en dur dans les composants (sauf exceptions historiques).

### 5.5 Charte visuelle

- Background : cream `HSL(37,33%,95%)`
- Primaire : forest green `#1A4D3E`
- Accent : emerald `#2D9F82`
- **ZERO orange/teal/jaune** dans le design system
- Warnings : amber uniquement (pas orange)
- Padding horizontal standard : `px-5`
- Border radius : `rounded-2xl` (16px) pour les cartes
- Composants UI : `shadcn/ui` dans `src/components/ui/` — **NE JAMAIS MODIFIER**

### 5.6 Structure des fichiers

```
pawcoach/
  src/
    api/             # base44Client.js, entities.js
    components/
      ui/            # shadcn/ui (NE PAS TOUCHER) + AICreditsGate, SkeletonPage, etc.
      achievements/  # AchievementFeed, badgeUtils
      activite/      # AITrainingProgram
      dashboard/     # SmartAlerts
      dogprofile/    # DogHealthSection, DogDietSection, InlineEditCard, etc.
      home/          # BentoGrid, CalendarStrip, DailyBriefing, DailyProgress, etc.
      hooks/         # useBackClose
      illustrations/ # Illustration wrapper
      lib/           # markdown renderer
      notebook/      # HealthScoreCard, NextActionCard, PremiumSection, etc.
      nutrition/     # FoodComparator, NutritionMealPlan, DietPreferencesPanel
      onboarding/    # WelcomeScreen
      premium/       # PremiumNudgeSheet, PostTrialSheet
      profile/       # DogSwitcher, ProfileHeader, SubscriptionSection, etc.
      sante/         # HealthAssistantBar/Sheet, NotebookContent, etc.
      scan/          # ShareCard, LabelScanMode
      tracker/       # WalkMode, ActivityCalendar, WalkMap, TrackerHistory
      training/      # ExerciseDetail, CelebrationScreen, FreeExercisesGate, etc.
      vet/           # VetDogCard, VetNotesList, DiagnosisStep2Questions, etc.
    hooks/           # useActionCredits, useCountUp, useBackClose, use-mobile
    lib/             # AuthContext, DogContext, HomeCacheContext, animations.js, etc.
    pages/           # 18 pages (voir section 2)
    utils/           # premium, ai-credits, recommendations, healthStatus, etc.
  base44/
    functions/       # 22 fonctions backend Deno
  public/            # PWA (manifest.json, sw.js, icons/)
```

### 5.7 Conventions de code

- **UI en francais** (labels, messages, toasts), **code en anglais** (variables, fonctions, commentaires)
- **Imports** : `@/` = alias vers `src/`
- **Pages eager** : les 5 pages du BottomNav (Home, Sante, Activite, Nutri, Profile) sont importees directement dans `pages.config.js`
- **Pages lazy** : toutes les autres utilisent `React.lazy()` + `Suspense`
- **Framer Motion** : `useReducedMotion()` respecte systematiquement (Layout, Home, Premium, Profile, Activite, Nutri)
- **Toasts** : `sonner` (pas react-hot-toast)
- **Markdown** : `react-markdown` avec composants custom dans `components/lib/markdown.jsx`

---

## 6. Securite

### 6.1 Mesures en place

- **CSP** : meta tag Content-Security-Policy [A VERIFIER — dans index.html ou Layout]
- **Input validation backend** : `sanitize(s, max)` dans `pawcoachChat`, `dailyCheckinProcess`
- **SSRF prevention** : whitelist URL images dans `pawcoachChat` — `entry.ts:29-37`
- **Ownership checks** : `dog.owner !== user.email → 403` dans `dailyCheckinProcess`
- **Stripe webhook signature** : verification `stripe.webhooks.constructEventAsync` — `stripeWebhook/entry.ts:22-27`
- **Price ID whitelist** : `ALLOWED_PRICES` dans `stripeCheckout` — `entry.ts:16`
- **Idempotency** : checks dans `stripeWebhook` pour eviter les doubles traitements
- **Quota server-side** : verification cote backend du quota messages pour eviter bypass multi-tab
- **Max message length** : 2000 caracteres dans `pawcoachChat` — `entry.ts:14-20`
- **Payment in iframe blocked** : `window.self !== window.top` check dans Premium — `Premium.jsx:104`

### 6.2 RGPD

- Pages legales : `/Privacy`, `/Terms`
- GDPR consent : [A VERIFIER — dans Onboarding ou separement]
- Data export : [A VERIFIER — composant SettingsSection]
- Suppression complete : `deleteUser` backend (cascade totale) — voir section 1.11
- Auto-renewal disclosure : texte explicite sur Premium — `Premium.jsx:327-329, 507`
