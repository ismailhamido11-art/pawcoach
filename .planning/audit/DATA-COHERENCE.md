# Data Flow Coherence Audit
**Date** : 27 mars 2026
**Auditeur** : Claude Code (analyse statique du code source)
**Scope** : 16 pages, ~106 composants, 22 fonctions backend Deno

---

## Synthese

L'app a plusieurs flux de donnees concrets mais **disconnected** — une action ecrit dans la DB, mais les autres pages ne recoivent pas les nouvelles donnees a moins d'un rechargement manuel complet. Les deux cas signales par Ismail (poids/BCS et etat "malade" sur Home) sont confirmes et expliques ci-dessous, avec 7 autres problemes identifies.

---

## Flux Deconnectes (CONFIRMES)

### 1. Poids enregistre dans GrowthTracker → CoachHomeHeader ne se met pas a jour

**Action** : L'utilisateur ajoute un poids dans Sante > Croissance (via photo IA ou saisie manuelle).
**Ce qui est ecrit** : `GrowthEntry.create(...)` dans `GrowthTrackerContent.jsx` (lignes 111, 154).
**Ce qui devrait se mettre a jour** : Le badge `{dog.weight} kg` dans `CoachHomeHeader.jsx` (ligne 72-76).
**Gap** : `GrowthTrackerContent` ne fait jamais `Dog.update({ weight: ... })` apres un `GrowthEntry.create`. Seuls `WeightCard`, `SectionPoids`, `SmartHealthAssistant` et `HealthImportContent` font cette sync. Resultat : ajouter un poids via l'onglet Croissance ne met pas a jour `Dog.weight`, donc le header Home affiche l'ancien poids indefiniment.
**Fichiers** : `GrowthTrackerContent.jsx:108-135 / 137-172`, `WeightCard.jsx:34`, `CoachHomeHeader.jsx:72`
**Fix** : Apres `GrowthEntry.create(...)`, appeler `Dog.update(dog.id, { weight: entry.weight_kg })` — comme le font WeightCard et SectionPoids.

---

### 2. Poids enregistre dans Sante → BCS non reflate sur Home

**Action** : L'utilisateur ajoute une entree de poids dans le carnet Sante (onglet Carnet > Poids).
**Ce qui est ecrit** : `HealthRecord.create({type:"weight",...})` via `WeightCard.jsx`, `SectionPoids.jsx`.
**Ce qui devrait se mettre a jour** : Le score BCS visible dans `GrowthTrackerContent` (affiche via `latest.body_condition_score`).
**Gap** : Le score BCS (`body_condition_score`) n'est stocke que dans `GrowthEntry`, jamais dans `HealthRecord`. Quand l'utilisateur ajoute un simple poids depuis le carnet, aucun BCS n'est calcule ni stocke. L'affichage dans Croissance ne montre donc pas de BCS pour les entrees "carnet" — seulement pour les entrees via photo IA ou saisie manuelle dans Croissance.
**Fichiers** : `GrowthTrackerContent.jsx:190-228` (la logique `unifiedEntries` ne transfère pas le BCS de HealthRecord car HealthRecord n'en a pas), `WeightCard.jsx:26-37`
**Fix** : Soit ajouter un champ `body_condition_score` optionnel au formulaire WeightCard, soit accepter que seul GrowthTracker gere le BCS (clarifier dans l'UI).

---

### 3. Check-in "chien malade" → Home dit "Rex est en forme" (le bug rapporte)

**Action** : L'utilisateur fait un check-in avec `mood=1` ou `mood=2`.
**Ce qui est ecrit** : `DailyCheckin` cree par le backend `dailyCheckinProcess`, retourne le checkin dans la reponse.
**Ce qui devrait se mettre a jour** : Le message dans `DailyBriefing.jsx` via `generateBriefing()`.
**Fonctionnement actuel** : En realite, `DailyBriefing` IS connected — il recoit `todayCheckin` en prop depuis Home.jsx et genere le bon message si `mood <= 2`. Le statut badge dit "A surveiller" et la mission devient "Verifier sa sante".
**MAIS** : Le texte de la hero illustration (Home.jsx lignes 493-503) dit :
- Si `todayCheckin` existe ET `mood >= 4` : "Rex est en forme !"
- Si `todayCheckin` existe (toute valeur de mood) : "Rex est en forme !" — **le branch ne verifie pas le mood**

Ligne 493-504 de `Home.jsx` :
```jsx
{todayCheckin
  ? `${dog?.name || "Ton chien"} est en forme !`
  : `${dog?.name || "Ton chien"} attend son check-in`
}
```
Ce message s'affiche "en forme" meme quand `mood=1`. C'est le bug exact rapporte.
**Fichiers** : `Home.jsx:493-504`
**Fix** : Conditionner le message sur `todayCheckin.mood` :
```jsx
{todayCheckin
  ? (todayCheckin.mood >= 4 ? `${dog?.name} est en forme !`
     : todayCheckin.mood <= 2 ? `${dog?.name} n'est pas au top...`
     : `${dog?.name} a une journee tranquille`)
  : `${dog?.name || "Ton chien"} attend son check-in`
}
```

---

### 4. Walk logge dans Activite → Home ne se rafraichit pas (DailyProgress reste a 0 min)

**Action** : L'utilisateur finit une balade dans `WalkMode`.
**Ce qui est ecrit** : `DailyLog.create/update({walk_minutes: ...})` (WalkMode.jsx:294-314).
**Ce qui devrait se mettre a jour** : `DailyProgress` dans Home, qui lit `dailyLogs` et affiche les minutes de balade du jour.
**Gap** : `WalkMode` appelle `onLogged()` → `refreshLogs()` dans `Activite.jsx` (ligne 88-93). Ca rafraichit l'onglet Activite. Mais Home.jsx n'est pas notifie. `HomeCacheContext` n'est pas invalide. Quand l'utilisateur revient sur Home, il voit encore `0 min` jusqu'a ce que le cache expire (2 minutes) ou qu'il pull-to-refresh.
**Fichiers** : `WalkMode.jsx:319`, `Activite.jsx:88-94`, `Home.jsx:511`, `HomeCacheContext.jsx:2 (CACHE_TTL=2min)`
**Fix** : Dans `Activite.jsx`, appeler `invalidateHome()` apres un log reussi. Necessite de passer `invalidateHome` depuis `App.jsx` ou via un hook global.
**Gravite** : Moyenne — le cache expire en 2 min, mais l'utilisateur voit des stats incorrectes pendant ce temps.

---

### 5. Dog switche dans Profile → toutes les autres pages gardent l'ancien chien

**Action** : L'utilisateur change de chien actif dans Profile > DogSwitcher.
**Ce qui est ecrit** : `localStorage.setItem("activeDogId", dogId)` dans `Profile.jsx:83`.
**Ce qui devrait se mettre a jour** : Home, Sante, Activite, Dashboard, Chat, Training, Nutri — toutes les pages qui utilisent `getActiveDog()`.
**Gap** : `getActiveDog()` lit `localStorage` a chaque appel, donc les pages qui re-fetchent au montage chargeront le bon chien. Mais le probleme est le **cache Home** : `HomeCacheContext` a une logique de validation `dogId` (ligne 13-14 de `HomeCacheContext.jsx`), mais elle ne s'invalide que si `dogId` dans le cache differe de `activeDogId`. Si l'utilisateur est deja sur Home quand il switch, Home ne se recharge pas — il reste sur l'ancien chien jusqu'a un refresh manuel.
**Fichiers** : `Profile.jsx:81-84`, `HomeCacheContext.jsx:13-14`, `Home.jsx:211-228`
**Fix** : Appeler `invalidateHome()` dans `handleSwitchDog()`. Necessite que Profile ait acces au HomeCache context.

---

### 6. HealthRecord cree via SmartHealthAssistant → Sante.records pas mis a jour dans la meme session

**Action** : L'utilisateur ajoute un vaccin ou un poids via l'assistant IA dans Sante.
**Ce qui est ecrit** : `HealthRecord.create(...)` dans `SmartHealthAssistant.jsx:112` et `328`.
**Ce qui devrait se mettre a jour** : `records` state dans `Sante.jsx`, et par cascade `NotebookContent`, `HealthScoreCard`, `StatusPills`, `NextActionCard`, `WeightCard`, `VaccineCard`.
**Gap (partiel)** : `Sante.jsx` passe `onRecordAdded={handleAddFromSheet}` au sheet (ligne 307), et `handleAddFromSheet` fait `setRecords(prev => [...prev, record])` (ligne 123-126). C'est correct POUR UN SEUL RECORD. Mais `SmartHealthAssistant` peut creer plusieurs records en une fois (`toCreate.map(rec => HealthRecord.create(...))`, ligne 328), et n'appelle `onRecordAdded` que pour le premier record (ligne 112 dans le parcours singular). Les records suivants sont crees sans notifier le parent.
**Verification** : `SmartHealthAssistant.jsx:112` appelle `HealthRecord.create(...)` avec `.catch(() => {})` — le resultat n'est pas recupere pour passer a `onRecordAdded`.
**Fichiers** : `SmartHealthAssistant.jsx:112`, `Sante.jsx:123-126`
**Fix** : Apres la creation en batch, appeler `onRecordAdded` avec tous les records crees (ou declencher un refetch complet).

---

### 7. WeeklyInsight genere (premium) → Home ne le charge pas si cache est encore frais

**Action** : Un cron backend genere un `WeeklyInsight` pour un utilisateur premium.
**Ce qui est ecrit** : `WeeklyInsight` entity creee en DB.
**Ce qui devrait se mettre a jour** : `WeeklyInsightCard` dans Home (visible si `weeklyInsight` existe).
**Gap** : `loadInsights()` dans Home n'est appelee qu'au montage (dans `fetchAndCache`). Si le cache Home est encore frais (< 2 min), la version en cache est retournee immediatement et `fetchAndCache` tourne en arriere-plan — mais si l'insight a ete genere entre-temps, le cache contient `null`. L'utilisateur ne verra l'insight qu'au prochain rechargement complet (navigation vers une autre page puis retour, ou pull-to-refresh).
**Fichiers** : `Home.jsx:133-150`, `HomeCacheContext.jsx:15-16`
**Gravite** : Faible — l'insight apparait apres 2 minutes max, ou lors du prochain pull-to-refresh.

---

## Donnees Potentiellement Perimees

### A. Dog.weight dans le header (CoachHomeHeader)

- Affiche `dog.weight` (champ de l'entite Dog), pas le dernier `HealthRecord` de type "weight".
- Si l'utilisateur ajoute un poids via GrowthTracker (voir #1), le header reste desynchronise.
- `WeightCard`, `SectionPoids`, `SmartHealthAssistant` et `HealthImportContent` synchro `Dog.weight` correctement, mais pas `GrowthTrackerContent`.

### B. Dashboard.score vs Sante.score

- `Dashboard.jsx:170` appelle `computeHealthScore(records, dog, dailyLogs)` avec `dailyLogs` comme `extraWeightSources`.
- `NotebookContent` (via `computeNotebookSummary`) appelle `computeHealthScore(recs, dog, growthEntries)` avec `growthEntries`.
- Les deux utilisent des sources differentes pour enrichir le score poids. Le Dashboard ne lit pas les `GrowthEntry`, donc son score poids peut etre different de celui de Sante si l'utilisateur a des entrees Croissance mais pas de `HealthRecord` poids.
- **Pas un bug critique** — les deux sont "corrects" selon leurs sources — mais les scores peuvent diverger et confondre l'utilisateur.

### C. DailyProgress (Home) apres balade offline

- Si une balade est sauvee offline (`pawcoach_pending_walks` dans localStorage), la synchro se fait au prochain montage de `WalkMode`.
- Pendant ce temps, Home affiche "0 min" de balade pour le jour concerne.

### D. Streak dans Home apres check-in depuis DailyBriefing (quick checkin)

- Le quick checkin appelle `handleCheckin()` qui met a jour `streak` depuis la reponse backend.
- **Correctement gere** : `setDogData(prev => ({...prev, streak: result.streak || prev.streak}))` (Home.jsx:289).

### E. NotebookContent.allRecords apres delete

- `handleDelete` dans `NotebookContent.jsx:116-127` fait `setRecords(prev => prev.filter...)`.
- La suppression est bien repercutee en local, et `summary` est recalcule par `useMemo`.
- **Pas de bug** — gere correctement.

### F. Premium status apres paiement Stripe

- Home poll `base44.auth.me()` toutes les 2s pendant max 10s apres `?premium=success` (Home.jsx:231-262).
- Mais les autres pages (Sante, Activite, Training) ne recoivent pas le nouvel etat premium. Elles affichent "Premium requis" jusqu'a un refresh.
- **Impact modere** : L'utilisateur revient sur Home ou rafraichit.

---

## Entity-Action Map

| Entite | Actions d'ecriture | Pages qui lisent | Mecanisme de sync | Gap ? |
|---|---|---|---|---|
| **DailyCheckin** | `dailyCheckinProcess` (backend) via Home | Home, Dashboard | Optimistic update dans Home + reponse backend | Aucun (bien gere) |
| **Streak** | `dailyCheckinProcess`, `updateStreakSilently`, `WalkMode` | Home, Dashboard, DogProfile | Retourné dans reponse checkin pour Home | Faible |
| **HealthRecord** (weight) | `WeightCard`, `SectionPoids`, `SmartHealthAssistant`, `HealthImportContent`, `CombinedFAB` | Sante (records state), Dashboard, GrowthTrackerContent | `setRecords(prev => [...prev, rec])` via callback | **OUI** — SmartHealthAssistant batch cree sans notifier tous |
| **HealthRecord** (vaccine) | `VaccineCard`, `SmartHealthAssistant`, `HealthImportContent` | Sante, Dashboard, GrowthTrackerContent | `setRecords(prev => [...prev, rec])` via callback | Idem batch |
| **GrowthEntry** | `GrowthTrackerContent` (photo IA, saisie manuelle) | GrowthTrackerContent, NotebookContent (poids unifies) | `onGrowthAdded(entry)` + `loadEntries()` local | **OUI** — Dog.weight pas mis a jour |
| **DailyLog** (walk) | `WalkMode`, `CombinedFAB`, `SectionPoids` (?) | Home (DailyProgress), Dashboard, Activite, CalendarStrip | `onLogged()` → `refreshLogs()` dans Activite uniquement | **OUI** — Home non notifie |
| **Dog** (weight) | `WeightCard`, `SectionPoids`, `SmartHealthAssistant`, `HealthImportContent` (mais pas `GrowthTrackerContent`) | CoachHomeHeader (badge poids), Dashboard | Re-fetch au montage de chaque page | **OUI** — GrowthTracker ne synchro pas Dog.weight |
| **Dog** (name/breed/photo) | `DogProfile.handleSaveDog()` | Toutes les pages (re-fetch au montage) | Re-fetch au montage | Acceptable |
| **WeeklyInsight** | Backend cron (`weeklyInsightGenerate`) | Home | Cache 2min + background refresh | Faible (max 2 min de delai) |
| **UserProgress** (training) | `AITrainingProgram`, `Training.jsx` | Home (ActiveProgramCards), Dashboard | Re-fetch au montage | Acceptable |
| **NutritionPlan** | `Nutri.jsx` | Home (ActiveProgramCards) | Re-fetch au montage | Acceptable |
| **DogAchievement** | `badgeUtils.js` (check functions) | Profile (AchievementsSection) | Re-fetch au montage | Acceptable |
| **activeDogId** (localStorage) | `Profile.handleSwitchDog()` | Toutes les pages via `getActiveDog()` | Lu au montage de chaque page | **OUI** — Home cache pas invalide |

---

## Priorite de correction

| # | Bug | Impact utilisateur | Effort fix |
|---|---|---|---|
| 1 | Hero image dit "en forme" meme si chien malade (check-in) | **Eleve** — vu a chaque check-in negatif | **Faible** — 3 lignes dans Home.jsx |
| 2 | GrowthTracker ne synchro pas Dog.weight | **Moyen** — badge header desynchro | **Faible** — 1 ligne dans GrowthTrackerContent |
| 3 | Balade loggee non visible dans Home DailyProgress | **Moyen** — stats du jour fausses | **Moyen** — propagation invalidateHome |
| 4 | Dog switch Profile → Home garde l'ancien chien | **Moyen** — multi-dog uniquement | **Faible** — invalidateHome dans handleSwitchDog |
| 5 | SmartHealthAssistant batch create sans notifier parent | **Faible** — reload page suffit | **Moyen** — refetch apres batch |
| 6 | Dashboard.score diverge de Sante.score (sources differentes) | **Faible** — confusion cosmétique | **Moyen** — unifier les sources dans Dashboard |
| 7 | WeeklyInsight delai max 2 min | **Tres faible** | Ne pas corriger (acceptable) |

---

## Recommandation d'action immediate

**Fix #1 (hero message)** : Correction en 3 lignes dans `Home.jsx:493`. Risque zero.

**Fix #2 (GrowthTracker → Dog.weight)** : Ajouter dans `GrowthTrackerContent.jsx` apres `GrowthEntry.create(...)` :
```js
try { await Dog.update(dog.id, { weight: entry.weight_kg }); } catch (e) { console.warn(e); }
```

**Fix #3 (walk → Home)** : Exposer `invalidateHome` de `HomeCacheContext` dans `Activite.jsx` via le contexte React deja disponible en haut de l'arbre. Appeler dans `refreshLogs` apres DailyLog fetch.

**Fix #4 (dog switch → Home)** : Dans `Profile.jsx:83`, apres `localStorage.setItem(...)`, appeler `invalidateHome()` si le composant peut acceder au HomeCacheContext.
