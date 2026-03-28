# SFA — Group 1: Home · Dashboard · Profile
**Date:** 2026-03-27
**Analyste:** Claude Code (Sonnet 4.6)
**Scope:** src/pages/Home.jsx · src/pages/Dashboard.jsx · src/pages/Profile.jsx + composants imbriqués

---

## Légende
- **OK** — flux complet, erreurs gérées, état cohérent
- **SUSPECT** — flux fonctionne mais dépend d'un contrat implicite fragile
- **RUPTURE** — flux cassé ou état incohérent possible

---

# PAGE: HOME (`src/pages/Home.jsx`)

## Chargement initial

### Action: L'utilisateur ouvre l'app / navigue vers Home
**Handler:** Home.jsx:214 — `loadData()` (dans useEffect dépendance `[navigate]`)
**Flow:**
1. `getCachedHome()` vérifie le cache en mémoire (TTL 2 min, invalidé si `activeDogId` change dans localStorage)
2. **Si cache présent** → applique immédiatement (user, dog, dogData, insights), `setLoading(false)`, puis `fetchAndCache(true)` en arrière-plan (silent refresh)
3. **Si pas de cache** → `fetchAndCache(false)` : affiche skeleton, fetch full
4. `fetchAndCache` : `base44.auth.me()` → `Dog.filter({owner})` → si 0 chiens → redirect Onboarding
5. `getActiveDog(dogs)` → lit `localStorage.activeDogId`, fallback sur dogs[0]
6. `fetchDogData(d.id)` → 11 appels en `Promise.all` (checkins aujourd'hui, streaks, checkins 30j, HealthRecords, UserProgress, FoodScans, DailyLogs, DiagnosisReports, NutritionPlans, 2x Bookmarks)
7. `loadInsights(u, d.id)` → uniquement si premium → `WeeklyInsight.filter`
8. `setCachedHome({user, dog, dogData, insights})`
9. `applyPremiumLogic(u)` → nudge sheet si signup > 2j + non-premium

**Guard conditions:**
- Aucun chien → redirect Onboarding
- Non-premium → insights non chargés (retourne null, applyInsights reçoit null et ne fait rien)

**Edge cases:**
- `fetchDogData` : chaque promesse a un `.catch(() => [])` — aucune erreur ne fait planter le Promise.all. Le composant reçoit des tableaux vides, s'affiche sans données.
- `loadInsights` : try/catch avec `console.warn` — silencieux en cas d'échec.
- Si le background refresh (`fetchAndCache(true)`) échoue : le toast d'erreur ne s'affiche PAS (condition `if (!skipLoadingState)`). L'utilisateur voit des données périmées sans le savoir.

**Verdict:** SUSPECT
**Evidence:** Home.jsx:204-211 — erreur silencieuse sur background refresh. L'utilisateur peut voir des données jusqu'à 2 min de retard sans aucun signal.

---

### Action: Paramètre `?premium=success` détecté (retour Stripe)
**Handler:** Home.jsx:234 — `handlePremiumSuccess()`
**Flow:**
1. Détecté via `new URLSearchParams(window.location.search).get("premium")`
2. `window.history.replaceState` → nettoie l'URL
3. Confetti + polling `base44.auth.me()` toutes 2s, max 5 tentatives (10s)
4. Dès `freshUser.is_premium === true` : `setUser(freshUser)` + `checkAppState()` (propage via AuthContext)
5. Toast succès

**Guard conditions:** `premiumSuccessHandledRef` empêche double exécution

**Edge cases:**
- Si le webhook Stripe est lent (> 10s) → toast fallback "visible dans quelques secondes". L'utilisateur doit rafraîchir manuellement pour voir les features premium débloquées.
- `checkAppState()` ne met pas à jour le `user` local dans Home.jsx — seul `setUser(freshUser)` le fait. Les sections premium dans les sous-composants (`isUserPremium(user)`) continueront à lire l'ancien `user` local jusqu'au prochain cycle de rendu complet.

**Verdict:** SUSPECT
**Evidence:** Home.jsx:252-254 — `checkAppState()` met à jour AuthContext mais pas le state local `user` dans Home.jsx. DailyBriefing et autres sous-composants reçoivent le bon `user` (il est passé en prop depuis le state `user` mis à jour par `setUser(freshUser)`), donc ça marche en pratique. Mais la dépendance est fragile.

---

## Actions utilisateur — Check-in

### Action: Tap sur un emoji d'humeur dans DailyBriefing (quick check-in)
**Handler:** DailyBriefing.jsx:105 — `handleMoodTap(mood)` → Home.jsx:447 — `handleQuickCheckin({mood})`
**Flow:**
1. `DailyBriefing.handleMoodTap(mood)` → `setMoodPicked(true)` + appelle `onQuickCheckin({mood})`
2. `handleQuickCheckin` injecte `energy: 2` et `appetite: 2` par défaut (valeurs neutres) → appelle `handleCheckin`
3. `handleCheckin` (Home.jsx:272) :
   - Guard : `if (!mood || !energy || !appetite || submitting) return` — bloque si déjà en cours
   - **Optimistic update** : crée un `optimisticCheckin` avec `_syncing: true`, l'injecte dans `todayCheckin` et `recentCheckins`
   - Vibration haptic si supportée
   - `base44.functions.invoke("dailyCheckinProcess", {dogId, mood, energy, appetite, notes, symptoms, behavior_notes})`
   - En cas de succès : remplace le checkin optimiste par le vrai, met à jour streak, vérifie milestones MILESTONES[], toast succès
   - Si symptoms > 0 : toast secondaire après 800ms avec lien vers Santé
   - `checkStreakBadges(dog.id, user.email).catch(() => {})` — asynchrone, silencieux
   - En cas d'erreur : **rollback** : `todayCheckin: null`, retire les entrées `_syncing`

**Guard conditions:** `submitting` state bloque les double-taps

**Edge cases:**
- `energy` et `appetite` sont toujours 2 (neutre) pour le quick check-in — aucune saisie d'énergie/appétit réelle dans ce flow. Les SmartAlerts calculent des moyennes sur ces champs, ce qui introduit un biais vers 2.
- Le rollback remet `todayCheckin: null`, mais `recentCheckins` peut avoir une entrée orpheline si le filtre `c => !c._syncing` rate (race condition si plusieurs erreurs).
- `result.checkin` peut être absent de la réponse API → fallback sur un objet construit localement sans `id`. Toute opération future sur `todayCheckin.id` planterait.

**Verdict:** SUSPECT
**Evidence:** Home.jsx:286-288 — `const newCheckin = result.checkin || { mood, energy, appetite, ai_response: result.aiResponse, date: getTodayString() }`. Ce fallback n'a pas de champ `id`. Si une autre fonction lit `todayCheckin.id`, ça casse.

---

### Action: Tap sur le bouton mission dans DailyBriefing (ex: "Lancer une balade")
**Handler:** DailyBriefing.jsx:110 — `handleMissionTap()`
**Flow:**
1. Si `mission.type === "checkin"` → early return (géré par les boutons mood)
2. Si `missionConfig.page` existe → `navigate(createPageUrl(missionConfig.page))`
3. Pas de side-effects, pas d'API call

**Guard conditions:** Aucune — navigation simple

**Edge cases:**
- Si `mission.type` n'est pas dans `MISSION_CONFIG` → `missionConfig` est `null` → `MissionIcon = PawPrint`, `page = undefined`. Le bouton s'affiche mais `handleMissionTap` ne fait rien (aucun `navigate`). Mission silencieusement inopérante.

**Verdict:** SUSPECT
**Evidence:** DailyBriefing.jsx:102 — `const missionConfig = mission ? MISSION_CONFIG[mission.type] : null`. Si `mission.type` vaut une valeur non listée dans MISSION_CONFIG, le bouton est affiché mais mort.

---

## Actions utilisateur — CombinedFAB (Log rapide)

### Action: Tap sur le FAB "+"
**Handler:** CombinedFAB.jsx:210 — `onClick={() => setOpen(true)}`
**Flow:**
1. `setOpen(true)` → affiche le sheet bottom avec les 4 champs (poids, balade, eau, note)
2. `useBackClose(open, () => setOpen(false))` gère le retour arrière

**Verdict:** OK

---

### Action: Saisie et validation du log rapide
**Handler:** CombinedFAB.jsx:38 — `handleSave()`
**Flow:**
1. Guard : `if (!dog || saving) return` — bloque si pas de chien ou en cours
2. Si form vide → `setOpen(false)` sans API call
3. `validateFields()` → vérifie min/max pour champs numériques, accumule erreurs
4. Si erreurs → affiche inline, retour sans API call
5. Construit `payload` avec `dog_id`, `date: getTodayString()`, `owner: user?.email`
6. `DailyLog.filter({dog_id, date})` → si existant → `DailyLog.update()` sinon `DailyLog.create()`
7. Si `payload.weight_kg` → `HealthRecord.create({type:"weight", ...})` (try/catch indépendant avec console.warn si échec)
8. Si `payload.walk_minutes > 0` → fetch tous les logs 60j + `checkWalkBadges()` (try/catch indépendant)
9. `setSaved(true)` → feedback visuel 1.2s → close + reset form
10. `onLogSaved?.()` → `invalidateHome()` — invalide le cache Home

**Guard conditions:**
- `user?.email` — utilisé avec `?.` : si user est null, owner sera `""` dans le payload.
- Validation min/max côté client uniquement

**Edge cases:**
- `onLogSaved` est appelé avant le timeout de fermeture (ligne 94, puis close à ligne 97-99). Si `invalidateHome()` se déclenche et que l'utilisateur navigue vers Home pendant la fenêtre de 1200ms, il verra des données fraîches. OK.
- Le `HealthRecord.create` pour le poids est dans un try/catch silencieux. Si ça rate, le Dashboard affichera les données DailyLog mais pas le HealthRecord. Le graphique poids fusionne les deux sources donc l'affichage sera partiellement cohérent.
- `checkWalkBadges` nécessite un fetch supplémentaire de 60j de logs — si ça rate silencieusement, les badges ne sont pas mis à jour.

**Verdict:** OK
**Evidence:** CombinedFAB.jsx:62-99 — logique robuste avec double protection catch.

---

### Action: Tap "Fermer" ou backdrop du CombinedFAB sheet
**Handler:** CombinedFAB.jsx:142 — `onClick={() => setOpen(false)}` / CombinedFAB.jsx:118 — backdrop `onClick`
**Flow:** `setOpen(false)` → sheet masqué. Form non reset → si l'utilisateur rouvre, les données précédentes sont là.
**Verdict:** SUSPECT
**Evidence:** Le form n'est reset qu'après un save réussi (ligne 98). Si l'utilisateur ferme sans sauvegarder, les champs persistent. C'est UX discutable mais pas une rupture.

---

## Actions utilisateur — Pull-to-Refresh

### Action: Tirer vers le bas pour rafraîchir
**Handler:** Home.jsx:330 — `handleRefresh()`
**Flow:**
1. `invalidateHome()` — vide le cache
2. `base44.auth.me()` + `Dog.filter()` + `getActiveDog()` + `fetchDogData()` + `loadInsights()`
3. `setCachedHome(...)` — recrée le cache
4. Toast d'erreur si exception

**Edge cases:**
- Pas de `setLoading(true)` pendant le refresh — l'utilisateur voit les anciennes données pendant le fetch. C'est le comportement voulu du pull-to-refresh.
- Si `dogs?.length > 0` est faux après le refresh (ex: chien supprimé entre-temps) → aucun `navigate(Onboarding)` ici, contrairement à `fetchAndCache`. L'écran reste sur Home avec le chien précédent.

**Verdict:** SUSPECT
**Evidence:** Home.jsx:335-346 — pas de guard "no dogs" dans `handleRefresh`. Si le chien est supprimé côté serveur, l'écran reste figé avec l'ancien état.

---

## Actions utilisateur — Navigation quick actions

### Action: Tap sur Scanner / Balade / Santé / Dressage (4 boutons rapides)
**Handler:** Home.jsx:563-578 — `onClick={() => navigate(createPageUrl(qa.page))}`
**Flow:** Navigation directe. Pas d'API, pas de state.
**Verdict:** OK

---

### Action: Tap "Tableau de bord" (bouton bleu centre)
**Handler:** Home.jsx:547 — `onClick={() => navigate(createPageUrl("Dashboard"))}`
**Flow:** Navigation directe.
**Verdict:** OK

---

### Action: Tap "Scanner un aliment" (carte nutrition)
**Handler:** Home.jsx:587 — `onClick={() => navigate(createPageUrl("Scan"))}`
**Flow:** Navigation directe.
**Verdict:** OK

---

### Action: Tap "Voir le carnet" (carte santé)
**Handler:** Home.jsx:622 — `onClick={() => navigate(createPageUrl("Sante"))}`
**Flow:** Navigation directe.
**Verdict:** OK

---

## Actions utilisateur — Weekly Insight

### Action: Tap "Marquer comme lu" sur le Weekly Insight
**Handler:** Home.jsx:349 — `handleMarkInsightRead()`
**Flow:**
1. Guard : `if (!weeklyInsight || markingRead) return`
2. `setMarkingRead(true)`
3. `WeeklyInsight.update(weeklyInsight.id, { is_read: true })`
4. Mise à jour state local : `weeklyInsight: null`, déplace l'insight dans `pastInsights`
5. `setInsightExpanded(false)`

**Edge cases:**
- Si l'update API échoue → toast erreur, state local non modifié. OK.
- L'insight est retiré du state local immédiatement après le `update()`. Si l'API répond en succès mais le backend ne met pas à jour, au prochain chargement l'insight reviendra comme non-lu.

**Verdict:** OK
**Evidence:** Home.jsx:349-362

---

## Actions utilisateur — Premium sheets

### Action: Fermeture du PremiumNudgeSheet
**Handler:** Home.jsx:690 — `onClose={() => setShowPremiumNudge(false)}`
**Flow:** `setShowPremiumNudge(false)`. La flag `premium_onboarding_nudge_shown` a déjà été sauvegardée lors de l'affichage — le sheet ne reviendra plus.
**Verdict:** OK

### Action: Fermeture du PostTrialSheet
**Handler:** Home.jsx:696 — `onClose={() => setShowPostTrial(false)}`
**Flow:** `setShowPostTrial(false)`. La persistance est gérée par `localStorage.getItem("pawcoach_post_trial_dismissed")` dans le composant.
**Verdict:** OK (non vérifié côté PostTrialSheet — hors scope groupe 1)

---

# PAGE: DASHBOARD (`src/pages/Dashboard.jsx`)

## Chargement initial

### Action: L'utilisateur navigue vers Dashboard
**Handler:** Dashboard.jsx:62 — `useEffect(() => { ... }, [])`
**Flow:**
1. `base44.auth.me()` → `setUser(u)`
2. `Dog.filter({owner: u.email})` → si 0 chiens → redirect Onboarding
3. `getActiveDog(dogs)` → lit `localStorage.activeDogId`
4. `Promise.all([7 requêtes])` : HealthRecords (100), DailyCheckins (90), Streaks, UserProgress, DailyLogs (90), FoodScans (20), GrowthEntries (50)
5. FoodScans et GrowthEntries ont `.catch(() => [])` — les autres NON

**Edge cases:**
- Si `HealthRecord.filter`, `DailyCheckin.filter`, `Streak.filter`, `UserProgress.filter`, ou `DailyLog.filter` échouent → le `Promise.all` rejette → caught par le try/catch global → toast erreur. Mais les autres requêtes réussies sont perdues. L'utilisateur voit un écran vide avec une erreur.
- Pas de cache sur Dashboard — chaque visite refetch tout. Sur mobile avec connexion lente : skeleton visible systématiquement.
- `setCheckins((cks || []).sort(...))` — tri correct, mais `cks` null devient `[]`.

**Verdict:** SUSPECT
**Evidence:** Dashboard.jsx:75-82 — FoodScans et GrowthEntries protégés individuellement avec `.catch(() => [])`, mais pas les 5 autres appels dans le Promise.all. Une erreur réseau sur HealthRecord = écran vide complet.

---

## Actions utilisateur — Navigation

### Action: Tap sur la fiche chien (Dog info card)
**Handler:** Dashboard.jsx:444 — `onClick={() => navigate(createPageUrl("DogProfile"))}`
**Flow:** Navigation directe vers DogProfile.
**Verdict:** OK

### Action: Tap sur un lien "CTA" des StatCards (ex: "Ajouter une pesée")
**Handler:** Dashboard.jsx:310 — `<Link to={createPageUrl("Sante") + "?tab=carnet"}>` et Dashboard.jsx:352 — `<Link to={createPageUrl("Activite") + "?tab=balade"}>` (liens React Router)
**Flow:** Navigation déclarative.
**Verdict:** OK

### Action: Tap sur un CTA des alertes (StatAlerts section dans le Dashboard — section "alerts")
**Handler:** Dashboard.jsx:152 — liste `alerts` calculée dans useMemo, chaque alerte a un champ `to: createPageUrl(...)`. Rendue via `nextSteps` avec `<Link to={step.to}>`.
**Flow:** Navigation déclarative.
**Verdict:** OK

### Action: Tap "Voir plus" / "Voir moins" dans SmartAlerts
**Handler:** SmartAlerts.jsx:288 — `setExpanded(e => !e)`
**Flow:** Toggle local, aucune API.
**Verdict:** OK

---

## Données calculées — useMemo

### Score santé (computeHealthScore)
**Handler:** Dashboard.jsx:173 — `computeHealthScore(records, dog, [...growthEntries, ...dailyLogs])`
**Flow:** Calcul pur, synchrone, pas d'API.
**Edge cases:**
- Si `dog` est null au moment du calcul → `computeHealthScore` reçoit null. Risque de `null.breed` etc. selon l'implémentation. Non vérifié ici (hors scope).
- Score utilisé deux fois : une fois dans Dashboard, une fois dans Home (SmartAlerts ne le calcule pas directement — il utilise les données brutes).

**Verdict:** SUSPECT (dépend de l'implémentation de computeHealthScore non vérifiée)

### Graphique poids (weightData)
**Handler:** Dashboard.jsx:104-114
**Flow:** Fusionne `HealthRecord` (type="weight") + `DailyLog` (weight_kg), dedupe par date, garde les 10 derniers.
**Edge cases:**
- Dedupe : `if (!weightByDate[p.date]) weightByDate[p.date] = p.value` — garde le premier trouvé, pas forcément le plus récent si l'ordre des arrays n'est pas chronologique. Mais les deux sources sont triées, donc en pratique le premier est le plus ancien. Résultat : pour un même jour, HealthRecord prime sur DailyLog si HealthRecord vient en premier dans le tableau.

**Verdict:** SUSPECT
**Evidence:** Dashboard.jsx:109-110 — logique de dedupe "first wins" peut créer une incohérence si HealthRecord et DailyLog ont des valeurs différentes le même jour.

---

# PAGE: PROFILE (`src/pages/Profile.jsx`)

## Chargement initial

### Action: L'utilisateur navigue vers Profile
**Handler:** Profile.jsx:38 — `useEffect(() => { load() }, [])`
**Flow:**
1. `base44.auth.me()` → `setUser(u)`
2. `Dog.filter({owner: u.email})` → `setDogs(d || [])`
3. Si pas d'`activeDogId` en state ET des chiens existent → `setActiveDogId(d[0].id)` + `localStorage.setItem`
4. Si `firstDogId` → `DogAchievement.filter({dog_id})` → somme les points → `setAchievementPoints`
5. DogAchievement a son propre try/catch interne → setAchievementPoints(0) en cas d'erreur

**Edge cases:**
- `activeDogId` est initialisé depuis `localStorage` (Profile.jsx:32). Si localStorage contient un `activeDogId` d'un chien supprimé, `activeDog = dogs.find(d => d.id === activeDogId) || dogs[0]` récupère dogs[0] en fallback. OK.
- Pas de redirect Onboarding si aucun chien — contrairement à Home/Dashboard. L'écran Profile s'affiche avec un état vide (dogs=[]).

**Verdict:** OK
**Evidence:** Profile.jsx:36 — fallback `|| dogs[0]` protège des stale IDs en localStorage.

---

## Actions utilisateur — DogSwitcher

### Action: Tap sur un autre chien dans DogSwitcher
**Handler:** Profile.jsx:83 — `handleSwitchDog(dogId)`
**Flow:**
1. `setActiveDogId(dogId)` → update state local
2. `localStorage.setItem("activeDogId", dogId)` → persiste cross-session
3. `invalidateHome()` → invalide le cache Home

**Edge cases:**
- Le chien switché n'est PAS rechargé dans Profile (pas de re-fetch DogAchievement ici). MAIS il y a un second useEffect (Profile.jsx:72) qui écoute `activeDogId` et recharge les achievements.
- Home lira le nouvel `activeDogId` depuis localStorage au prochain chargement. Le cache est invalidé, donc Home re-fetche.

**Verdict:** OK
**Evidence:** Profile.jsx:83-88 (switch) + Profile.jsx:72-81 (reload achievements on switch)

---

### Action: Tap "Profil" sous un chien (lien vers DogProfile)
**Handler:** DogSwitcher.jsx:55 — `onClick={() => navigate(createPageUrl("DogProfile") + "?dogId=" + dog.id)}`
**Flow:** Navigation avec paramètre dogId.
**Verdict:** OK

### Action: Tap "Ajouter" (nouveau chien)
**Handler:** Profile.jsx:90 — `handleAddDog()`
**Flow:**
1. Si non-premium ET déjà 1 chien → redirect Premium (`?from=profile`)
2. Si premium ET déjà 3 chiens → toast erreur (limite atteinte)
3. Sinon → redirect Onboarding (`?addDog=true`)

**Guard conditions:** `isUserPremium(user)` — si `user` est null ici (cas rare), `isUserPremium(null)` retourne probablement false → flow non-premium. Pas de crash.

**Verdict:** OK
**Evidence:** Profile.jsx:90-98

---

## Actions utilisateur — SubscriptionSection

### Action: Tap "Gérer mon abonnement" (premium actif)
**Handler:** SubscriptionSection.jsx:11 — `handlePortal()`
**Flow:**
1. `base44.functions.invoke("stripePortal")`
2. `const { url } = res.data`
3. `window.location.href = url` → navigation externe Stripe

**Edge cases:**
- Si `res.data.url` est undefined → `window.location.href = undefined` → l'URL devient la chaîne "undefined". L'utilisateur reste sur la page mais l'URL change en "/undefined". Pas de guard sur la valeur de `url`.

**Verdict:** RUPTURE
**Evidence:** SubscriptionSection.jsx:15 — `if (url) window.location.href = url` — wait, il y a bien un guard `if (url)`. Re-lecture : ligne 14 `const { url } = res.data` et ligne 15 `if (url) window.location.href = url`. OK, le guard est là. **Correction : SUSPECT** car si `res.data` est null/undefined → destructuring crash avec TypeError avant même d'arriver au `if (url)`.

**Verdict:** SUSPECT
**Evidence:** SubscriptionSection.jsx:14 — `const { url } = res.data` — si `res.data` est `null` ou `undefined`, TypeError non catchée avant le try/catch (le catch est sur l'ensemble, donc la TypeError sera catchée). En pratique protégé. Verdict rétrogradé à **OK**.

---

### Action: Tap "Passer Premium" (non-premium)
**Handler:** SubscriptionSection.jsx:67 — `onClick={() => navigate(createPageUrl("Premium"))}`
**Flow:** Navigation directe.
**Verdict:** OK

---

## Actions utilisateur — CoachSettings

### Action: Tap sur un ton de coach (Encourageant / Direct / Pédagogue)
**Handler:** CoachSettings.jsx:26 — `handleTone(val)`
**Flow:**
1. Sauvegarde l'ancien ton
2. `setSaving("tone")`
3. `onSave({coach_tone: val})` → `base44.auth.updateMe({coach_tone: val})` + `setUser(prev => ({...prev, coach_tone: val}))`
4. Si erreur → toast + `onSave({coach_tone: prev})` → restore

**Edge cases:**
- Si le premier `onSave` échoue ET le second `onSave` (restore) échoue aussi → le ton en UI est dans un état indéterminé (la valeur locale de `currentTone` vient de `user?.coach_tone` — le `setUser` a peut-être déjà été appelé avec la nouvelle valeur avant l'erreur). Le rollback est best-effort.
- `handleSaveUser` dans Profile.jsx:100 : ne gère que le succès avec `setUser(prev => ({...prev, ...updates}))`. Le rollback dans CoachSettings rappelle `onSave(prev)` — mais si le premier a réussi partiellement, `setUser` a déjà été appelé. L'état UI peut diverger du backend.

**Verdict:** SUSPECT
**Evidence:** CoachSettings.jsx:29-36 — le rollback `await onSave({coach_tone: prev})` peut être appelé sur un `onSave` qui lui-même échoue, créant une double erreur avalée (le catch ne catch que l'erreur du premier onSave, pas du rollback).

---

### Action: Tap sur un sujet favori (toggle topic)
**Handler:** CoachSettings.jsx:39 — `handleTopic(val)`
**Flow:** Identique à handleTone, mais sur `coach_topics` (array JSON stringifié).
**Edge cases:**
- `currentTopics` est parsé via `JSON.parse(user?.coach_topics || "[]")` — si `user.coach_topics` est une chaîne malformée → catch silencieux → `return []`. L'UI affichera 0 topics sélectionnés même si des topics existent en base.

**Verdict:** SUSPECT
**Evidence:** CoachSettings.jsx:22-24 — `try { return JSON.parse(...) } catch { return [] }`. Pas de signal à l'utilisateur en cas de corruption.

---

## Actions utilisateur — WalkReminderSettings

### Action: Toggle du rappel balade (Switch)
**Handler:** WalkReminderSettings.jsx:17 — `handleToggle(val)`
**Flow:**
1. `setEnabled(val)` → update local immédiat
2. `onSave({walk_reminder_enabled: val, walk_reminder_time: time})`
3. Toast succès/désactivation
4. `finally { setSaving(false) }` — pas de try/catch explicite : si `onSave` throw, l'erreur remonte dans la pile non catchée.

**Verdict:** RUPTURE
**Evidence:** WalkReminderSettings.jsx:17-26 — `handleToggle` n'a pas de try/catch. Si `base44.auth.updateMe` échoue, l'erreur est non catchée. L'état local (`enabled`) a déjà été mis à jour → divergence UI/backend sans rollback, sans toast d'erreur.

---

### Action: Tap sur une heure de rappel
**Handler:** WalkReminderSettings.jsx:28 — `handleTimeChange(val)`
**Flow:** Même problème — pas de try/catch. Si `!enabled`, retourne tôt sans appel API (correct).
**Verdict:** RUPTURE
**Evidence:** WalkReminderSettings.jsx:28-38 — même absence de try/catch que handleToggle.

---

## Actions utilisateur — VetSection

### Action: Tap "Inviter" (lien vers Sante ?tab=vet)
**Handler:** VetSection.jsx:33 — `onClick={() => navigate(createPageUrl("Sante") + "?tab=vet")}`
**Flow:** Navigation directe.
**Verdict:** OK

### Action: Chargement de la liste vétérinaires
**Handler:** VetSection.jsx:18 — `useEffect(() => { SharedVetAccess.filter({dog_id}).then(...).catch(() => {}) }, [activeDogId])`
**Flow:** Fetch sur changement d'`activeDogId`. `.catch(() => {})` silencieux.
**Edge cases:** Si `activeDogId` est null → early return. Si le fetch rate → liste vide sans signal.
**Verdict:** OK

---

## Actions utilisateur — SettingsSection

### Action: Toggle accordéon Réglages
**Handler:** SettingsSection.jsx:23 — `onClick={() => setOpen(!open)}`
**Flow:** Toggle local.
**Verdict:** OK

### Action: Tap "Ma Bibliothèque"
**Handler:** SettingsSection.jsx:45 — `onClick={() => navigate(createPageUrl("Library"))}`
**Flow:** Navigation directe.
**Verdict:** OK

### Action: Tap "Supprimer mon compte"
**Handler:** SettingsSection.jsx:60 — `onClick={() => setShowDeleteConfirm(true)}`
**Flow:** Affiche dialog de confirmation.
**Verdict:** OK

### Action: Confirmer la suppression du compte
**Handler:** SettingsSection.jsx:163 — handler inline async
**Flow:**
1. `setDeleting(true)`
2. `base44.functions.invoke('deleteUser', {})`
3. Si `response.data?.success` → toast + délai 1500ms + `base44.auth.logout()`
4. Sinon → toast erreur avec le message renvoyé par le backend
5. catch → toast erreur générique
6. finally → `setDeleting(false)`

**Verdict:** OK
**Evidence:** SettingsSection.jsx:163-180 — gestion complète succès/échec avec feedback utilisateur.

### Action: Se déconnecter (confirmer logout)
**Handler:** SettingsSection.jsx:125 — `onClick={() => base44.auth.logout()}`
**Flow:** Appel direct SDK. Pas de try/catch — si `logout()` échoue, rien ne se passe visuellement.
**Verdict:** SUSPECT
**Evidence:** SettingsSection.jsx:125 — pas de gestion d'erreur sur `base44.auth.logout()`.

---

## Actions utilisateur — Lien vers Dashboard statistiques

### Action: Tap "Voir les statistiques de [chien]"
**Handler:** Profile.jsx:196 — `<Link to={createPageUrl("Dashboard")}>`
**Flow:** Navigation React Router.
**Verdict:** OK

### Action: Tap "Passe à Premium" (carte amber pour non-premium)
**Handler:** Profile.jsx:161 — `onClick={() => navigate(createPageUrl("Premium") + "?from=profile")}`
**Flow:** Navigation directe.
**Verdict:** OK

---

# SYNTHÈSE — Verdicts par page

## HOME
| Action | Verdict |
|--------|---------|
| Chargement initial (cache hit) | SUSPECT — background refresh silencieux si erreur |
| Chargement initial (no cache) | OK |
| Retour Stripe ?premium=success | SUSPECT — webhook potentiellement lent, polling 10s max |
| Quick check-in (emoji mood) | SUSPECT — fallback checkin sans `id` si API ne retourne pas `result.checkin` |
| Mission tap (DailyBriefing) | SUSPECT — mission type non reconnu → bouton mort sans signal |
| CombinedFAB open/close | SUSPECT — form non reset à la fermeture sans save |
| CombinedFAB save (log rapide) | OK |
| Pull-to-refresh | SUSPECT — pas de guard "no dogs" |
| Navigations rapides (4 boutons) | OK |
| Weekly Insight mark read | OK |
| Premium sheets | OK |

## DASHBOARD
| Action | Verdict |
|--------|---------|
| Chargement initial | SUSPECT — Promise.all sans protection individuelle sur 5/7 appels |
| Navigation (fiche chien, liens CTA) | OK |
| SmartAlerts expand/collapse | OK |
| Score santé (computeHealthScore) | SUSPECT — implémentation non vérifiée sur dog=null |
| Graphique poids (dedupe) | SUSPECT — first-wins peut cacher la valeur la plus récente |

## PROFILE
| Action | Verdict |
|--------|---------|
| Chargement initial | OK |
| Switch chien | OK |
| Lien DogProfile | OK |
| Ajouter un chien | OK |
| Gérer abonnement (stripePortal) | OK |
| Passer Premium | OK |
| Coach tone/topic | SUSPECT — rollback fragile, JSON parse silencieux |
| Walk reminder toggle | RUPTURE — pas de try/catch, état UI diverge si API échoue |
| Walk reminder heure | RUPTURE — même problème |
| Vet section | OK |
| Bibliothèque navigation | OK |
| Supprimer compte | OK |
| Déconnexion | SUSPECT — pas de catch sur base44.auth.logout() |

---

# ISSUES PRIORITAIRES À CORRIGER

## P0 — RUPTURES
1. **WalkReminderSettings — handleToggle/handleTimeChange sans try/catch** (WalkReminderSettings.jsx:17-38)
   Si l'API échoue, l'état UI est mis à jour mais le backend ne l'est pas. L'utilisateur croit avoir activé le rappel. Pas de feedback d'erreur, pas de rollback.
   **Fix:** Entourer `onSave` d'un try/catch, rollback si erreur, toast erreur.

## P1 — SUSPECTS CRITIQUES
2. **Dashboard — Promise.all non protégé** (Dashboard.jsx:75-83)
   Une erreur réseau sur HealthRecord ou DailyCheckin rend le Dashboard entièrement vide.
   **Fix:** Ajouter `.catch(() => [])` sur chaque appel individuel, comme déjà fait pour FoodScans/GrowthEntries.

3. **Quick check-in — fallback checkin sans id** (Home.jsx:288)
   Si `result.checkin` est absent de la réponse API, le checkin local n'a pas d'`id`. Toute opération future sur `todayCheckin.id` (ex: update, display) plantera silencieusement.
   **Fix:** Si `result.checkin` est absent, ne pas utiliser le fallback local — soit rejeter avec un toast, soit re-fetch le checkin depuis l'API.

4. **Background refresh silencieux** (Home.jsx:203-207)
   Si le background refresh échoue, l'utilisateur voit des données périmées sans le savoir.
   **Fix:** Au minimum, un `console.warn` ou un indicateur visuel discret (ex: toast "Données non actualisées").

## P2 — SUSPECTS MINEURS
5. **CoachSettings — rollback fragile sur erreur** (CoachSettings.jsx:29-36)
6. **DailyBriefing — mission type inconnu → bouton mort** (DailyBriefing.jsx:102)
7. **Dashboard — dedupe poids "first wins"** (Dashboard.jsx:109-110)
8. **Pull-to-refresh — pas de guard "no dogs"** (Home.jsx:335-346)
9. **CombinedFAB — form non reset à la fermeture** (CombinedFAB.jsx — post-close)
10. **Déconnexion sans catch** (SettingsSection.jsx:125)

---

*Fin SFA Group 1 — 2026-03-27*
