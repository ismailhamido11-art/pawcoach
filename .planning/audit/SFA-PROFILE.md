# Static Flow Analysis — Profile + Premium + DogProfile + Public Pages

**Date** : 27 mars 2026
**Scope** : Profile.jsx, Premium.jsx, DogProfile.jsx, DogPublicProfile.jsx, VetDogView.jsx, VetPortal.jsx, AuthContext.jsx

---

## 1. Profile.jsx

### 1.1 Edit profile (handleSaveUser)

```
User click "Enregistrer" (CoachSettings / WalkReminderSettings / ReferralSection)
  → handleSaveUser(updates)
  → base44.auth.updateMe(updates)     [API call — pas de confirmation d'erreur ici]
  → setUser(prev => ({ ...prev, ...updates }))   [merge local optimiste]
  → Rendu immédiat des sous-composants qui reçoivent `user` prop
```

**Rupture identifiée** : `base44.auth.updateMe` est appelé sans `try/catch` dans `handleSaveUser`. Si l'API échoue, le state local est quand même muté (via le `.then()` implicite de `await`). Le state affiche des données non sauvegardées.

**Pas d'invalidation du HomeCacheContext** après edit profil. Si le cache Home contient des données user (ex: nom, photo), elles restent périmées 2 minutes. [estimation — le cache stocke `user` dans `cacheRef.current.user`]

### 1.2 Switch dog (handleSwitchDog)

```
User tap sur un chien dans DogSwitcher
  → handleSwitchDog(dogId)
  → setActiveDogId(dogId)                              [state local]
  → localStorage.setItem("activeDogId", dogId)         [persiste entre sessions]
  → invalidateHome()                                   [vide HomeCacheContext.cacheRef]
```

**OK** : la cache Home est bien invalidée. Home rechargera depuis l'API au prochain mount.

**Rupture identifiée** : `achievementPoints` est rechargé dans le useEffect secondaire (ligne 72-81) — correct. Mais `activeDog` (ligne 36) est calculé à partir de `dogs` déjà chargé — pas de rechargement API. C'est OK car `dogs` est lu depuis le state existant.

**Rupture identifiée** : après switch, `AchievementFeed` et `AchievementsSection` reçoivent `activeDog` (prop derivée) mais pas de refetch propre. Ils dépendent du prop — à vérifier si ces composants chargent leurs propres données ou utilisent la prop dog.

### 1.3 Delete account (SettingsSection)

```
User clique "Supprimer mon compte"
  → Confirm modal
  → base44.functions.invoke('deleteUser', {})          [fonction backend]
  → Si success: toast + setTimeout 1500ms + base44.auth.logout()
```

**Rupture identifiée** : aucun cascade côté frontend avant `deleteUser`. Tout repose sur la fonction backend `deleteUser`. Non vérifié ici ce que `deleteUser` supprime exactement — à auditer séparément.

**Rupture identifiée** : `localStorage.removeItem("activeDogId")` n'est pas appelé avant le logout. Si le logout échoue silencieusement, l'ID d'un chien supprimé reste dans localStorage.

### 1.4 Premium card — toujours affichée pour les premium

**Rupture identifiée** : la card amber "Passe à Premium" (lignes 153-162) est affichée sans condition pour TOUS les utilisateurs, y compris les premium. Elle est distincte de `SubscriptionSection` qui elle affiche correctement l'état. Un utilisateur premium voit simultanément "Premium actif" et "Passe à Premium" — message contradictoire.

**Correction** : conditionner la card avec `{!isUserPremium(user) && (...)}`

---

## 2. Premium.jsx

### 2.1 Subscribe flow

```
User clique "Débloquer tout PawCoach"
  → handleSubscribe()
  → [bloque si dans iframe]
  → trackEvent("premium_checkout_clicked", { plan })
  → base44.functions.invoke("stripeCheckout", { priceId })
  → window.location.href = url   [redirect Stripe Checkout]
  → [Stripe traite le paiement]
  → Stripe webhook → base44 backend (stripeWebhook)
    → user.is_premium = true
    → user.premium_since = today
    → user.stripe_subscription_id = session.subscription
  → Stripe redirige vers l'app
  → App recharge, base44.auth.me() retourne user.is_premium = true
```

**OK** : le flow Stripe → webhook → user update est correct.

**Rupture identifiée** : après le retour depuis Stripe, `Premium.jsx` appelle `base44.auth.me()` dans son `useEffect` init — l'utilisateur voit bien son état premium. Mais si l'utilisateur navigue vers Home directement, le HomeCacheContext peut encore contenir `user.is_premium = false` (cache 2 minutes). Il verra des quotas free pendant 2 minutes max.

**Rupture identifiée** : `setIsFirstVisit` + confetti se basent sur `!u.premium_welcome_seen`. Si le webhook est lent (délai Stripe), l'utilisateur revient sur l'app et `is_premium` est encore false — la page Premium affiche le formulaire de souscription au lieu du success state. C'est un race condition possible mais rare.

### 2.2 Cancel subscription

**Rupture identifiée** : il n'y a pas de bouton "Annuler l'abonnement" dans l'app. L'utilisateur est redirigé vers le portail Stripe via `stripePortal` (SubscriptionSection). L'annulation se fait côté Stripe — le webhook `customer.subscription.deleted` met `is_premium = false`. Le frontend n'a aucun state local à mettre à jour — il faut que l'utilisateur recharge l'app pour voir son nouveau statut. Pas d'invalidation proactive.

### 2.3 Trial display

```
isOnTrial = trialDays > 0 && !user?.is_premium
trialDays = getTrialDaysLeft(user)
           = Math.floor((new Date(user.trial_expires_at) - new Date()) / 86400000)
```

**OK** : logique cohérente. Utilisateur trial = `is_premium=false` + `trial_expires_at` dans le futur.

**Rupture identifiée** : si l'utilisateur souscrit pendant son trial, `is_premium` devient `true`. `isUserPremium()` retourne true. Mais `isOnTrial` = `trialDays > 0 && !user?.is_premium` = false. La page Premium affiche correctement "Tu es Premium !" sans le countdown trial — **OK**.

### 2.4 Prix — cohérence

| Endroit | Prix mensuel | Prix annuel |
|---------|-------------|-------------|
| Premium.jsx plan selector | 7,99 €/mois | 59,99 €/an · 5 €/mois |
| Premium.jsx CTA non-premium | "7,99 €/mois" ou "5 €/mois" | OK |
| Premium.jsx CTA trial | "7,99 €/mois" ou "59,99 €/an" | OK |
| SubscriptionSection (Profile) | "7,99 €/mois" | N/A |
| FEATURES table | Non affiché | Non affiché |

**OK** : prix cohérent partout. Mensuel 7,99 EUR, annuel 59,99 EUR (-37%), équivalent 5 EUR/mois.

---

## 3. DogProfile.jsx

### 3.1 Edit dog info (DogEditModal)

```
User clique icône Pencil → setEditModal(true)
DogEditModal s'ouvre avec form initialisé depuis dog
User modifie nom/race/date/sexe/stérilisé → handleSave()
  → validation (name requis, sex requis, date pas dans le futur)
  → onSave(cleanForm) = handleSaveDog(updates)
    → Dog.update(dog.id, updates)    [API call]
    → setDog(prev => ({ ...prev, ...updates }))   [merge local]
  → setEditModal(false)
```

**Rupture identifiée** : `DogEditModal` ne gère que `name, breed, birth_date, sex, neutered`. Il n'expose pas `weight`, `activity_level`, `environment`, `allergies`, `health_issues` — ces champs sont édités inline via `InlineEditCard` dans `DogIdentityCards` et autres sections. Architecture correcte.

**Rupture identifiée** : `handleSaveDog` dans DogProfile.jsx manque de feedback visuel en cas d'erreur partielle — le `catch` affiche un toast mais le state local est déjà muté si l'erreur arrive après le `Dog.update` (improbable, mais le try/catch est autour de toute la logique donc OK).

**Pas d'invalidation HomeCacheContext** après save dog. Si le Home cache contient `dog.name` (c'est le cas — `cacheRef.current.dog`), le nom affiché sur Home reste périmé 2 minutes après un renommage.

### 3.2 Photo upload

```
User choisit photo → handlePhotoUpload(e)
  → base44.integrations.Core.UploadFile({ file })   [upload CDN]
  → onSave({ photo: file_url })
    → Dog.update(dog.id, { photo: file_url })
    → setDog(prev => ({ ...prev, photo: file_url }))
```

**OK** : flow direct. La photo est visible immédiatement dans le profil.

**Rupture identifiée** : pas d'invalidation Home cache. La photo du chien dans le Hero de Home reste l'ancienne pendant 2 minutes.

### 3.3 Delete dog (handleDeleteDog)

```
User confirme suppression
  → cascade deleteMany sur 18 entités :
     HealthRecord, DailyCheckin, DailyLog, Streak, FoodScan, Bookmark,
     UserProgress, WeeklyInsight, ChatMessage, SharedVetAccess, VetNote,
     DiagnosisReport, DogAchievement, GrowthEntry, NutritionPlan,
     DietPreferences, ParkReview, PlaceFavorite
  → Dog.delete(dog.id)
  → localStorage.removeItem("activeDogId")  [si c'est le chien actif]
  → navigate(createPageUrl("Profile"))
```

**OK** : cascade couvre 18 entités, dont ParkReview et PlaceFavorite (TECH-05 documenté dans le code).

**Rupture identifiée** : `invalidateHome()` n'est pas appelé après suppression. Si l'utilisateur arrive sur Home depuis Profile après suppression, le HomeCacheContext peut encore contenir l'ancien chien (2 minutes). Home sera incohérent le temps que le cache expire ou que `localStorage.getItem("activeDogId")` détecte le changement (le cache vérifie cela — ligne 14 HomeCacheContext : `if (currentDogId && cacheRef.current.dogId !== currentDogId) return null`). Comme `activeDogId` a été retiré du localStorage, `currentDogId` sera `null` — la vérification `currentDogId &&` court-circuite, donc le cache périmé avec l'ancien chien sera retourné. **Bug réel.**

### 3.4 Height/taille — Question Ismail

**Question** : le champ taille/height est-il utile ? Doit-on garder seulement le poids ?

**Analyse** :

Le champ `dog.size` ou `dog.taille` ou `dog.height` **n'existe pas** sur l'entité Dog dans le frontend. Il n'y a aucun champ de ce type dans le Dog profile.

Ce qui existe : `height_cm` dans l'entité **GrowthEntry** (table séparée, non Dog).

`GrowthEntry.height_cm` est :
- Saisi via `GrowthTrackerContent.jsx` (section Santé) — manuellement ou via IA photo
- Stocké dans `GrowthEntry` (entité dédiée avec date, weight_kg, height_cm, body_condition_score)
- Affiché dans le Growth Tracker (last measurement card)
- Passé au contexte IA via `pawcoachChat/entry.ts` (ligne 336 : `Taille : ${latestGrowth.height_cm} cm`)
- Analysé par `analyzeGrowthPhoto/entry.ts`

**Verdict** : `height_cm` dans GrowthEntry est **utilisé** dans 3 endroits fonctionnels (affichage tracker, contexte IA chat, analyse photo). Ce n'est pas un champ mort. Il n'est pas dans l'entité Dog principale — c'est un champ de mesure de croissance daté.

**Recommandation** : garder `height_cm` dans GrowthEntry. Ce n'est pas la même chose que "taille" statique sur le profil chien. Il sert à tracer la croissance dans le temps, ce qui est pertinent pour chiots.

---

## 4. DogPublicProfile.jsx

### 4.1 Chargement sans authentification

```
URL: /DogPublicProfile?dogId=xxx
  → Dog.filter({ id: dogId })    [pas d'auth — public read]
  → HealthRecord.filter({ dog_id: dogId }, "-date", 100)   [public read]
  → Affiche: nom, race, âge, sexe, poids (dernier weight record), allergies, problèmes santé,
             chip_number, vet_name/city, email propriétaire (dog.owner), vaccins, pesées
```

**Rupture de sécurité identifiée** : `dog.owner` (email du propriétaire) est affiché publiquement en clair (ligne 243 : `href=\`mailto:${dog.owner}\``). L'email de l'utilisateur PawCoach est exposé à quiconque a accès au QR code. Ce design est volontaire (fiche d'urgence) mais représente une fuite de données RGPD si le propriétaire ne réalise pas que son email est exposé.

**Rupture identifiée** : `TYPE_CONFIG` (ligne 19) référence `Stethoscope` et `Pill` sans les importer (seuls `Syringe, Weight, AlertTriangle, Calendar, MapPin, PawPrint, ShieldCheck, FileText, Mail, Fingerprint` sont importés). Si un record de type `vet_visit` ou `medication` est présent, `Icon` sera `undefined` et l'app crashera. [fait — vérification des imports ligne 5]

**Rupture identifiée** : le filtre des records dans l'historique médical (ligne 283) affiche uniquement `vaccine` et `weight` — les `vet_visit`, `medication`, `note` sont silencieusement exclus. L'utilisateur ne voit pas ses visites véto sur la page publique.

### 4.2 Données exposées

Sans connexion, quiconque avec le lien voit : nom, race, âge, sexe, photo, allergies, problèmes de santé, numéro de puce, vet_name, vet_city, email propriétaire, vaccins, pesées.

**Note** : c'est une fiche d'urgence QR code — l'exposition est intentionnelle. Mais `chip_number` + email = combinaison identifiable hors chien.

---

## 5. VetDogView.jsx

### 5.1 Chargement

```
URL: /VetDogView?dogId=xxx
  → [optionnel] base44.auth.me()   [identité du vétérinaire — peut échouer sans bloquer]
  → base44.functions.invoke("vetAccess", { action: "getDogData", dogId })
    [backend vérifie SharedVetAccess pour ce vet + ce chien]
    [retourne: dog, records, checkins, scans, vetNotes, sharedSections]
  → Affiche via tabs: Carnet / Check-ins / Mes notes / Scans
```

**OK** : accès via fonction backend sécurisée (pas de lecture directe d'entité). Le backend vérifie l'accès avant de retourner les données.

**Rupture identifiée** : `localRecords` permet un ajout optimiste de records (via `handleRecordAdded`). Mais si le vet recharge la page, les records locaux disparaissent — ils doivent être vraiment sauvegardés via `SectionPoids` → `HealthRecord.create`. Vérifier que `SectionPoids` appelle réellement l'API avant d'appeler `onRecordAdded`. [estimation — non vérifié ici]

**Rupture identifiée** : les données ne sont pas "fresh" — elles sont chargées une fois à l'init (`useEffect` sur `dogId`). Pas de polling ou de refresh. Si le propriétaire ajoute un vaccin pendant la consultation, le vétérinaire ne le verra pas sans recharger la page.

### 5.2 Badge "caution" — bug visuel

Dans l'onglet Scans (ligne 233-234) : le verdict `caution` utilise `bg-emerald-100 text-emerald-700` au lieu d'une couleur ambre/warning. C'est le même style que `safe` — impossible de distinguer "précaution" de "sûr" visuellement.

---

## 6. VetPortal.jsx

### 6.1 Chargement

```
→ base44.auth.isAuthenticated()    [si non auth → redirectToLogin]
→ base44.auth.me()
→ loadAccesses()
  → base44.functions.invoke("vetAccess", { action: "listMyAccess" })
  → Pour chaque accès: base44.functions.invoke("vetAccess", { action: "getDogData", dogId })
    [N+1 requests — 1 listMyAccess + 1 getDogData par chien]
```

**Rupture performance** : si un vétérinaire a 10 patients, cela génère 11 appels parallèles. `Promise.all` les parallélise — OK pour la latence réseau, mais N+1 reste un anti-pattern. Acceptable à faible volume.

**Rupture identifiée** : les compteurs "Notes" et "Rapports" dans le hub rapide affichent "—" statiques (lignes 135, 141). Ce sont des placeholders non implémentés affichés comme s'ils étaient fonctionnels.

### 6.2 Accepter une invitation

```
User entre code → handleAcceptInvite()
  → base44.functions.invoke("vetAccess", { action: "accept", inviteCode })
  → Si success: setInviteCode("") + loadAccesses()  [rechargement complet]
```

**OK** : rechargement propre après acceptation.

---

## 7. AuthContext.jsx

### 7.1 Login / checkAppState

```
App mount → useEffect → checkAppState()
  → GET /api/apps/public/prod/public-settings/by-id/{appId}    [settings publics]
  → Si token présent: checkUserAuth()
      → base44.auth.me()
      → setUser(currentUser)
      → setIsAuthenticated(true)
  → Sinon: setIsAuthenticated(false)
```

**OK** : flow linéaire et clair.

**Rupture identifiée** : `checkAppState` ne retourne rien et ne déclenche pas d'invalidation du HomeCacheContext. Les pages qui utilisent `useAuth()` reçoivent `user` depuis AuthContext, mais la majorité des pages (Profile, Premium, DogProfile, Home) font leur propre `base44.auth.me()` dans leur `useEffect` local. Il y a **deux sources de vérité** pour `user` : AuthContext.user et les états locaux des pages. Elles ne sont pas synchronisées.

### 7.2 isUserPremium — cohérence

```javascript
isUserPremium(user):
  if (user.is_premium) return true           // payé
  if (user.trial_expires_at) return new Date(trial_expires_at) > new Date()  // trial actif
  return false
```

**OK** : logique simple et cohérente. Utilisé dans : Profile.jsx, Premium.jsx, SubscriptionSection.jsx, useActionCredits.js, Chat.jsx, Nutri.jsx, Scan.jsx, Training.jsx, Sante.jsx, Onboarding.jsx.

**Rupture identifiée** : `isUserPremium` opère sur l'objet `user` passé en argument (snapshot au moment du chargement de la page). Si l'abonnement expire pendant la session (utilisateur laisse l'app ouverte), `isUserPremium(user)` continue de retourner `true` jusqu'à un rechargement de page. Acceptable (session TTL), mais à noter.

---

## Résumé des Ruptures

### Critiques
| # | Rupture | Fichier | Impact |
|---|---------|---------|--------|
| C1 | "Passe à Premium" card visible pour les utilisateurs premium | Profile.jsx:154-162 | Message contradictoire, UX confuse |
| C2 | Bug crash : `Stethoscope` et `Pill` non importés dans DogPublicProfile | DogPublicProfile.jsx:19 | Crash si record type `vet_visit` ou `medication` |
| C3 | Suppression chien: Home cache non invalidé + `activeDogId` null court-circuite la vérification de fraîcheur | DogProfile.jsx:handleDeleteDog + HomeCacheContext.jsx:14 | Home affiche chien supprimé pendant 2 minutes |

### Importantes
| # | Rupture | Fichier | Impact |
|---|---------|---------|--------|
| I1 | `handleSaveUser` sans try/catch — state muté même si API échoue | Profile.jsx:100-103 | Données corrompues localement |
| I2 | Pas d'invalidation Home cache après save dog (nom, photo) | DogProfile.jsx:handleSaveDog | Nom/photo périmés sur Home 2 minutes |
| I3 | Email propriétaire exposé en clair sur DogPublicProfile | DogPublicProfile.jsx:243 | Exposition RGPD — intentionnelle mais à documenter |
| I4 | DogPublicProfile filtre silencieusement vet_visit et medication dans l'historique | DogPublicProfile.jsx:283 | Données incomplètes sur fiche urgence |
| I5 | Badge "caution" identique visuellement à "safe" dans VetDogView scans | VetDogView.jsx:233 | Impossible distinguer précaution de sûr |
| I6 | `localStorage` non nettoyé avant logout dans delete account | SettingsSection.jsx | activeDogId orphelin si logout échoue |

### Mineures
| # | Rupture | Fichier | Impact |
|---|---------|---------|--------|
| M1 | Données VetDogView non rafraîchies sans reload page | VetDogView.jsx | Vet voit données potentiellement périmées pendant consultation |
| M2 | Compteurs Notes/Rapports = "—" dans VetPortal | VetPortal.jsx:135,141 | UX trompeuse — placeholders affichés |
| M3 | Race condition Stripe webhook: utilisateur retourne avant que is_premium soit true | Premium.jsx | Affiche formulaire souscription au lieu du success |
| M4 | N+1 queries dans VetPortal loadAccesses | VetPortal.jsx:49-52 | Perf à >5 patients |
| M5 | HomeCacheContext et AuthContext.user — deux sources de vérité non synchronisées | App-wide | Cohérence theoritique, risque faible en pratique |

---

## Question Ismail : supprimer taille/height ?

**Réponse** : Non, ne pas supprimer.

`height_cm` n'est pas dans l'entité Dog. Il est dans `GrowthEntry` (entité dédiée avec historique daté). Il est utilisé dans :
1. `GrowthTrackerContent.jsx` — affiché dans le tracker de croissance
2. `pawcoachChat/entry.ts` — injecté dans le contexte IA ("Taille : X cm")
3. `analyzeGrowthPhoto/entry.ts` — analysé par l'IA photo

C'est un champ de mesure de croissance, pas un attribut statique du profil. Pertinent pour chiots, utile pour l'IA. Le garder.

Ce qui pourrait être simplifié : l'entrée manuelle du champ `height_cm` dans le formulaire GrowthTracker est optionnelle et peu remplie en pratique. Mais le champ lui-même a une valeur réelle pour le contexte IA.

---

## Prochaines Actions Suggérées

1. **Fix C1** (5 min) : conditionner la Premium card dans Profile avec `{!isUserPremium(user) && (...)}`
2. **Fix C2** (5 min) : ajouter `Stethoscope, Pill` aux imports de DogPublicProfile
3. **Fix C3** (10 min) : appeler `invalidateHome()` dans `handleDeleteDog` + tester le cas `activeDogId = null`
4. **Fix I2** (5 min) : appeler `invalidateHome()` dans `handleSaveDog`
5. **Fix I5** (5 min) : corriger le badge `caution` dans VetDogView (utiliser `bg-amber-100 text-amber-700`)
