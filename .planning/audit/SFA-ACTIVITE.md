# Static Flow Analysis — Activite + Training + Nutri

**Date:** 2026-03-27
**Scope:** Activite.jsx, Training.jsx, Nutri.jsx, WalkMode.jsx, CombinedFAB.jsx
**Method:** Static trace — no runtime, no CGC (index vide), lecture directe du code

---

## 1. ACTIVITE.JSX

### 1.1 Init & chargement

```
isLoadingAuth resolved
  → load(authUser)
    → base44.auth.me()           [si authUser absent]
    → Dog.filter({ owner: u.email })
    → getActiveDog(dogs)         → setDog(d)
    → DailyLog.filter({ dog_id: d.id }, "-date", 30)  → setLogs(l)
    → setLoading(false)
```

**Rupture #1 — Streak absent de Activite**
Activite charge `DailyLog` mais JAMAIS `Streak`. Le streak ne s'affiche pas sur cette page (pas de composant streak ici) — OK pour l'instant. Mais si un composant enfant doit afficher le streak, il ne l'a pas.

### 1.2 Walk : start → stop

```
User clique Start
  → WalkMode.handleStart()
    → setStatus("running")
    → startGPS() → navigator.geolocation.watchPosition
    → navigator.wakeLock.request("screen")
    → localStorage.setItem("pawcoach_walk_active", { startTime, dogId, paused: 0 })
    → setInterval(1s) → setElapsed()

User clique Stop
  → WalkMode.handleStop()
    → clearInterval + stopGPS + releaseWakeLock
    → localStorage.removeItem("pawcoach_walk_active")
    → setStatus("done")
    → DailyLog.filter({ dog_id, date: today })
      → si existe → DailyLog.update(existing[0].id, { walk_minutes: prev+minutes, notes, walk_distance_km? })
      → si absent  → DailyLog.create({ dog_id, owner, date, walk_minutes, notes, walk_distance_km? })
    → DailyLog.filter({ dog_id }, "-date", 60)    ← rechargement pour badges
    → checkWalkBadges(dog.id, user.email, allLogs)
    → updateStreakSilently(dog.id, user.email)
    → onLogged() → refreshLogs()
```

### 1.3 refreshLogs (callback après walk loggé)

```
refreshLogs()
  → DailyLog.filter({ dog_id }, "-date", 30)  → setLogs(l)
  → checkWalkBadges(dog.id, user.email, l)    [fire-and-forget]
  → invalidateHome()                           → HomeCacheContext.cacheRef = null
```

**Rupture #2 — Double checkWalkBadges**
`handleStop` dans WalkMode appelle `checkWalkBadges` avec 60 jours de logs, PUIS `refreshLogs` rappelle `checkWalkBadges` avec 30 jours. Double appel garanti à chaque fin de balade. Risque : badges vérifiés deux fois en cascade, potentiel doublon de `DogAchievement.create`.

**Rupture #3 — updateStreakSilently appelé dans WalkMode mais PAS dans refreshLogs**
WalkMode appelle `updateStreakSilently` lors du stop. C'est correct. Mais si la balade échoue et est retombée en offline (pending walks), lors du sync ultérieur (`onLogged` → `refreshLogs`), le streak n'est PAS mis à jour. Les balades syncées hors-ligne ne déclenchent pas `updateStreakSilently`.

### 1.4 Streak display sur Activite

Il n'y a **aucun affichage de streak** sur Activite.jsx. La page affiche uniquement l'historique des balades (`TrackerHistory`, `WalkMode`, `AITrainingProgram`). Le streak vit sur Home.jsx uniquement. Pas de rupture d'affichage ici, mais manque de cohérence UX.

### 1.5 Recovery walk interrompue

```
WalkMode mount
  → localStorage.getItem("pawcoach_walk_active")
  → si elapsedSec > 60 && < 18000 && dog.id === saved.dogId
    → setStatus("done"), setSavedMinutes
    → DailyLog.filter + update/create
    → onLogged() → refreshLogs()
    [MAIS : updateStreakSilently PAS appelé lors du recovery]
```

**Rupture #4 — Recovery ne met pas à jour le streak**
Une balade récupérée depuis `localStorage` après crash est sauvegardée en BDD mais `updateStreakSilently` n'est PAS appelé. Le streak de ce jour reste potentiellement à 0.

---

## 2. TRAINING.JSX

### 2.1 Init & chargement

```
mount → loadData()
  → base44.auth.me()                         → setUser(u)
  → Dog.filter({ owner: u.email })
  → getActiveDog(dogs)                        → setDog(d)
  → UserProgress.filter({ user_email, dog_id })  → setProgresses(progs)
  → Bookmark.filter({ dog_id, source: "behavior_program" }, "-created_at", 5)  → setBehaviorBookmarks
```

**Note:** Training utilise `base44.auth.me()` directement, PAS `useAuth()`. Pas de `AuthContext`. Différence avec Activite/Nutri.

**Rupture #5 — Training ne recharge pas après navigation**
Training appelle `loadData()` dans `useEffect([], [])` — une seule fois au mount. Si l'utilisateur complète un exercice puis navigue vers une autre page et revient, `loadData` n'est PAS rappelé. Les `progresses` viennent de l'état local (optimistic update persisté). OK grâce à l'optimistic update, mais si une session est ouverte en parallèle (ex : autre onglet), la progression sera désynchronisée.

### 2.2 Compléter un exercice

```
User clique "Valider"
  → handleComplete(exercise)
    → optimistic update : setProgresses(optimisticProgresses)
    → navigate(Training?journey=...) ou Training

    → [background async]
      → si existing && completed : UserProgress.update(id, { completed: false, ... })
      → si existing && !completed : UserProgress.update(id, { completed: true, ... })
      → si !existing :
          UserProgress.create({ user_email, dog_id, exercise_id, completed, completed_date })
          base44.auth.updateMe({ points: user.points + 50 })
          setUser({ ...user, points: newPoints })

      → si !wasCompleted :
          updateStreakSilently(dog.id, user.email)
          checkStreakBadges(dog.id, user.email)

      → setProgresses(newProgresses)      [remplace l'optimistic]

    → si erreur : rollback → setProgresses(progresses)   ← l'ancien state
```

**Rupture #6 — Rollback utilise une closure périmée**
Le `catch` fait `setProgresses(progresses)` où `progresses` est capturé par closure au moment de l'appel de `handleComplete`. Si entre l'appel et l'erreur, l'état a changé (ex : autre exercice complété en parallèle), le rollback écrase des données valides. Race condition possible mais peu probable en usage normal.

**Rupture #7 — Points non rollbackés en cas d'erreur partielle**
Le flow crée `UserProgress` PUIS appelle `base44.auth.updateMe({ points })`. Si `updateMe` échoue après que `UserProgress.create` a réussi, l'exercice est marqué complété mais les points ne sont pas crédités. Pas de transaction atomique.

### 2.3 Gating free vs premium — exercices

```
EXERCISES (statique) : is_premium: true/false
isPremium = isUserPremium(user)   [calculé client-side depuis user]

ExerciseDetail :
  locked = exercise.is_premium && !isPremium
  → si locked : affiche paywall, désactive "Valider"

handleComplete gate :
  → prevCount === 2 && newCount === 3 && !isUserPremium(user)
    → setShowFreeGate(true)       ← bloque à 3 exercices pour les free
```

**Rupture #8 — Double gating incohérent**
Deux logiques de gating coexistent :
1. `exercise.is_premium` sur l'objet EXERCISES (exercices 4, 5, 6, 7, 8, 9, 10 sont premium)
2. `FreeExercisesGate` : bloque après 3 complétions totales

Un utilisateur free peut voir le détail des exercices 1, 2, 3 (non-premium) et les compléter. Mais si l'utilisateur complète exercice 1, 2, 3 → FreeGate s'affiche. Ensuite, les exercices 4+ sont `locked` dans ExerciseDetail. Les deux gates fonctionnent mais s'activent dans le mauvais ordre — l'utilisateur voit d'abord le FreeGate (après 3 complétions d'exercices libres), puis les exercices suivants sont de toute façon verrouillés. Redondant mais pas cassé.

**JOURNEYS gating :**
```
journey.isPremium && !isPremium → locked
→ JourneyCard affiche un lock visuel, mais la navigation est quand même possible
  (le lock est géré visuellement dans JourneyCard/JourneyView)
```

### 2.4 Générer un programme comportement (Behavior guide)

```
User clique "Lancer le programme"
  → si !isPremium → navigate(Premium?from=behavior-program)  [guard OK]
  → setGeneratingProgram(true)
  → base44.functions.invoke("generateTrainingProgram", { dogId, dogName, dogBreed, dogBirthDate, activityLevel, healthIssues, mode: "behavior", problemId, problemLabel, problemDescription })
  → response.data.program → parse JSON si string
  → Bookmark.create({ dog_id, owner, source: "behavior_program", title, content: JSON.stringify(programData) })
  → setBehaviorProgram(programData)
```

**Rupture #9 — behaviorProgram stocké dans state local, non rechargé**
`setBehaviorProgram(programData)` met à jour le state local, mais si l'utilisateur quitte et revient, le program est rechargé depuis `behaviorBookmarks` (chargé au init). Cela fonctionne. MAIS : `behaviorBookmarks` est limité à `-created_at, 5` — si l'utilisateur a créé plus de 5 programmes, les anciens ne seront pas trouvés.

### 2.5 AITrainingProgram (tab "Programme" dans Activite)

```
AITrainingProgram reçoit { dog, logs }   ← depuis Activite.jsx

generate()
  → base44.functions.invoke("generateTrainingProgram", { dogId, walkStats... })
  → Bookmark.create({ dog_id, owner, source: "training" })
  → setProgram + setSaved

DayCard completion :
  → Bookmark.update(bookmarkId, { content: JSON.stringify({ ...program, completed_days }) })
  → checkTrainingBadges(...)
```

**Rupture #10 — AITrainingProgram recharge base44.auth.me() en interne**
Dans `generate()`, `AITrainingProgram` fait `const user = await base44.auth.me()` (ligne 315) pour créer le Bookmark. Cela fait un appel réseau supplémentaire alors que `dog` vient de `Activite` et que l'utilisateur est déjà authentifié. Pas de rupture fonctionnelle, mais overhead inutile.

---

## 3. NUTRI.JSX

### 3.1 Init & chargement

```
isLoadingAuth resolved
  → init(authUser)
    → base44.auth.me() [si authUser absent]
    → si !isPremium : initCredits(u) → setMessagesRemaining(msgCredits)
    → Dog.filter({ owner: u.email })
    → getActiveDog(dogs) → setDog(d)
    → Promise.all([
        FoodScan.filter({ dog_id }, "-timestamp", 5),
        DietPreferences.filter({ dog_id, owner_email }),
        DailyCheckin.filter({ dog_id }, "-date", 7),
        HealthRecord.filter({ dog_id }, "-date", 10),
        DailyLog.filter({ dog_id }, "-date", 7),          ← utilisé pour contexte coach IA
        NutritionPlan.filter({ dog_id, owner_email }, "-generated_at", 10),
      ])
    → setDog, setRecentScans, setDietPrefs, setCheckins, setHealthRecords, setDailyLogs
    → setAllPlans, setActivePlan, setMonthlyPlanCount
    → setMessages([{ role: "assistant", content: message_initial }])
```

### 3.2 dog.weight dans Nutri

**Rupture #11 — dog.weight non utilisé directement dans le contexte coach**
Le message initial du coach utilise `d.breed` et `d.weight` depuis l'objet Dog chargé localement. Ce dog vient de `Dog.filter({ owner: u.email })` → `getActiveDog()`. Le poids est donc celui qui est dans l'entité Dog, PAS le dernier pesée depuis HealthRecord. Si le poids a changé récemment via CombinedFAB (qui écrit dans `DailyLog.weight_kg` + `HealthRecord`), le profil Dog.weight n'est PAS mis à jour automatiquement. Le coach IA travaille donc avec un poids potentiellement périmé.

### 3.3 Envoi message coach IA

```
sendMessage(content)
  → si !isPremium && messagesRemaining <= 0 : return
  → setMessages([...messages, { role: "user", content }])
  → base44.functions.invoke("pawcoachChat", { dogId, mode: "nutrition", messages: contextMsgs[-15] })
    → [server] : quota check, dog ownership check, fetch full dog context
    → response.data.content → startStreaming(content, ts)
    → si !isPremium : setMessagesRemaining(response.data.messages_remaining)
```

**Rupture #12 — Quota vérifié côté client ET côté serveur avec potentiel désync**
Le client vérifie `messagesRemaining <= 0` avant d'envoyer. Le serveur fait sa propre vérification et reset. Si le client a un compteur périmé (ex : reset journalier pas encore reflété), l'utilisateur verra un blocage côté client alors que le serveur aurait accordé le message. Pour corriger, le client devrait rafraîchir `messagesRemaining` depuis le serveur à l'init ou via une API dédiée.

### 3.4 Connexion Nutri ↔ DailyLog

```
DailyLog.filter({ dog_id }, "-date", 7) → dailyLogs
→ passé à NutritionMealPlan comme prop
→ passé au serveur pawcoachChat via le "dog brain" server-side (non via les props)
```

Le serveur `pawcoachChat` charge lui-même les `dailyLogs` côté backend (ligne 76 : `dailyLogs` dans le fetch parallèle). Les `dailyLogs` passés en props à `NutritionMealPlan` servent à l'affichage client uniquement.

### 3.5 NutritionPlan — refreshPlans

```
onPlanSaved={refreshPlans}
refreshPlans()
  → NutritionPlan.filter({ dog_id, owner_email }, "-generated_at", 10)
  → setAllPlans, setActivePlan, setMonthlyPlanCount
```

**Rupture #13 — refreshPlans ne recharge pas DietPreferences ni DailyLogs**
Après sauvegarde d'un plan, seuls les plans sont rechargés. Si le plan généré dépend des préférences qui ont changé pendant la session, l'affichage peut être désynchronisé. Mineur car DietPreferences a son propre `onPreferencesSaved → refreshDietPrefs`.

### 3.6 Tab Scan → FoodScan

```
Tab "scan" → Link vers /Scan (page séparée)
Retour sur Nutri → init() non rappelé (SPA navigation)
→ recentScans reste à la valeur chargée au mount
```

**Rupture #14 — recentScans périmé après scan**
L'utilisateur fait un scan (navigue vers /Scan), puis revient sur Nutri. La page Nutri ne se remonte pas (React garde le state), donc `recentScans` n'est pas rechargé. Le compteur "X scans récents" affiché dans le header est périmé jusqu'au prochain reload complet.

---

## 4. COMBINEDFAB.JSX

### 4.1 Ce que fait CombinedFAB

```
CombinedFAB({ dog, user, onLogSaved })
  → handleSave()
    → DailyLog.filter({ dog_id, date: today })
      → update ou create avec { walk_minutes, water_bowls, weight_kg, notes }
    → si weight_kg : HealthRecord.create({ dog_id, type: "weight", date, value })
    → si walk_minutes > 0 :
        DailyLog.filter({ dog_id }, "-date", 60)
        checkWalkBadges(dog.id, user.email, allLogs)
    → onLogSaved?.()
```

### 4.2 RUPTURE CRITIQUE — CombinedFAB n'est monté nulle part

Recherche exhaustive dans tout `src/` :

```
grep "CombinedFAB" src/**/*
→ src/components/CombinedFAB.jsx  (définition uniquement)
Aucun import dans aucune page.
```

**Rupture #15 — CombinedFAB est un composant mort (dead code)**
`CombinedFAB` est défini mais jamais importé ni utilisé dans aucune page. Le "Log rapide" FAB n'est donc **pas du tout affiché** dans l'application. Toutes ses fonctionnalités (log poids, eau, balade rapide) sont inaccessibles.

Cette rupture explique potentiellement pourquoi la fonctionnalité "log rapide" ne fonctionne pas côté utilisateur.

### 4.3 CombinedFAB ne notifie pas Home

Même si CombinedFAB était monté, `onLogSaved` est le seul callback. CombinedFAB n'appelle PAS `invalidateHome()`. Donc même si un log rapide est sauvegardé, le cache Home n'est pas invalidé et `DailyProgress` sur Home ne se rafraîchit pas avant le prochain mount de Home ou expiry du TTL (2 minutes).

**Rupture #16 — CombinedFAB ne déclenche pas updateStreakSilently**
Si l'utilisateur log une balade via CombinedFAB (ex: 30 min walk_minutes), le streak n'est PAS mis à jour. Seul `checkWalkBadges` est appelé.

---

## 5. RÉSUMÉ DES RUPTURES

| # | Sévérité | Composant | Description | Impact |
|---|----------|-----------|-------------|--------|
| 1 | Faible | Activite | Streak non chargé sur la page | Pas d'affichage streak (pas de rupture affichage actuel) |
| 2 | Moyen | WalkMode+refreshLogs | Double checkWalkBadges à chaque fin de balade | Potentiel doublon de badge |
| 3 | Moyen | WalkMode offline sync | updateStreakSilently absent lors sync pending walks | Streak pas mis à jour sur balades hors-ligne |
| 4 | Moyen | WalkMode recovery | updateStreakSilently absent lors recovery localStorage | Streak pas mis à jour après crash |
| 5 | Faible | Training | loadData() une seule fois, pas de refresh sur revisit | Désync si multi-session |
| 6 | Faible | Training | Rollback closure périmée | Race condition improbable |
| 7 | Moyen | Training | Points non rollbackés si updateMe échoue après UserProgress.create | Points perdus |
| 8 | Faible | Training | Double gating redondant (is_premium + FreeExercisesGate) | UX confuse mais pas cassé |
| 9 | Faible | Training | behaviorBookmarks limité à 5 | Anciens programmes inaccessibles |
| 10 | Faible | AITrainingProgram | base44.auth.me() appelé en interne inutilement | Overhead réseau |
| 11 | Moyen | Nutri | dog.weight périmé (Dog entity vs HealthRecord) | Coach IA avec poids inexact |
| 12 | Moyen | Nutri | Quota free désync client/serveur | Blocage fantôme ou bypass |
| 13 | Faible | Nutri | refreshPlans ne recharge pas DietPrefs/DailyLogs | Désync mineur |
| 14 | Moyen | Nutri | recentScans périmé après retour de /Scan | Compteur faux |
| **15** | **CRITIQUE** | **CombinedFAB** | **Composant jamais monté = fonctionnalité inexistante** | **Log rapide 100% inaccessible** |
| **16** | **Élevé** | **CombinedFAB** | **Pas d'invalidateHome + pas de updateStreakSilently** | **Home périmé + streak raté** |

---

## 6. PRIORITÉS DE CORRECTION

### P0 — Blocker immédiat
- **#15** : Monter CombinedFAB dans au moins une page (Home, ou globalement dans App.jsx avec dog/user passés depuis le contexte). C'est la rupture la plus grave — une feature entière est invisible.

### P1 — Correctifs streak
- **#16** : Ajouter `invalidateHome()` + `updateStreakSilently()` dans `CombinedFAB.handleSave`
- **#3 + #4** : Ajouter `updateStreakSilently` dans le sync offline et le recovery localStorage de WalkMode

### P2 — Données fraîches
- **#14** : Rafraîchir `recentScans` sur focus/visibilité de Nutri (ou via `usePageRefresh`)
- **#11** : Utiliser le dernier `HealthRecord` de type `weight` pour le dog.weight envoyé au coach

### P3 — Qualité
- **#2** : Supprimer le `checkWalkBadges` dans `refreshLogs` (déjà fait dans `handleStop`)
- **#7** : Wrapper `UserProgress.create` + `updateMe` dans un try avec rollback du progress si updateMe échoue
- **#12** : Rafraîchir `messagesRemaining` depuis le serveur à l'init (appel `/me` ou endpoint dédié)
