# SFA Group 2 — Sante, Nutri, Activite
Static Flow Analysis — 27 mars 2026

---

## PAGE: Sante.jsx

**Fichier:** `src/pages/Sante.jsx`
**Data chargee au mount:** Dog, HealthRecord (200), DailyLog, GrowthEntry
**Auth pattern:** attend `isLoadingAuth` avant de lancer `loadData(authUser)`

---

### Action: Page load / mount
**Handler:** Sante.jsx:115-121 — `useEffect([isLoadingAuth, authUser])`
**Flow:**
```
AuthContext ready → loadData(authUser)
→ Dog.filter({ owner: u.email })
→ getActiveDog(dogs)
→ Promise.all([HealthRecord.filter, DailyLog.filter, GrowthEntry.filter])
→ setRecords / setDailyLogs / setGrowthEntries
→ setLoading(false) → render
```
**Guard conditions:** `isLoadingAuth === false`
**Edge cases:**
- `dogs.length === 0` → dog reste `null`, records/logs/growths restent `[]`. Pas d'erreur, rendu silencieux.
- `authUser` null mais `isLoadingAuth` false → `base44.auth.me()` appele en fallback (ligne 92)
- Erreur reseau → toast.error affiche, `loading` passe a false
**Verdict:** OK

---

### Action: Changement d'onglet (Carnet / Symptomes / Croissance / Documents / Veto)
**Handler:** Sante.jsx:75 — `changeTab(tabId)`
**Flow:**
```
onClick(tabId) → sessionStorage.set("tab_Sante", tabId) → setSearchParams({ tab: tabId })
→ URL update → activeTab recalcule → animation slide
```
**Guard conditions:** aucun — tous les onglets accessibles sans condition
**Edge cases:**
- Tab "findvet" charge FindVetContent en lazy via `Suspense` avec fallback squelette — OK
- TabDir calcule par `tabIndex >= prevTabIdx.current` — direction correcte
- sessionStorage persistee → tab restauree apres navigation back
**Verdict:** OK

---

### Action: Pull-to-refresh
**Handler:** Sante.jsx:224 — `PullToRefresh onRefresh={loadData}`
**Flow:**
```
swipe down → onRefresh() → loadData() sans argument
→ base44.auth.me() appele (pas de providedUser)
→ re-fetch Dog + HealthRecord + DailyLog + GrowthEntry
→ state mis a jour
```
**Guard conditions:** aucun
**Edge cases:**
- `loadData()` sans argument → fallback `base44.auth.me()`. Cela genere un appel API supplementaire. SUSPECT: si `authUser` est disponible en contexte, il est perdu lors du pull-to-refresh.
- Si le chien actif change entre deux pulls, le nouveau chien est bien detecte via `getActiveDog`
**Verdict:** SUSPECT — pull-to-refresh ignore `authUser` du contexte, genere un double appel API inutile

---

### Tab CARNET — NotebookContent

#### Action: Changement de sous-onglet (Journal / Vaccins / Visites / Poids / Medoc / Notes)
**Handler:** NotebookContent.jsx:65 — `setActiveTab(tab)`
**Flow:**
```
click pill → setActiveTab(tabId) → sessionStorage.set("subTab_Sante_carnet", tabId)
→ re-render avec records filtrés
```
**Guard conditions:** aucun
**Edge cases:** sub-tab persistee en sessionStorage, restauree au retour
**Verdict:** OK

---

#### Action: Ajouter un vaccin
**Handler:** SectionVaccins.jsx:55 — `handleSave()`
**Flow:**
```
click "Ajouter" → form.vaccineKey validation
→ HealthRecord.create({ dog_id, type: "vaccine", title, date, next_date })
→ onRecordAdded(record) → NotebookContent: setRecords(prev => [...prev, record])
→ toast.success + form reset
```
**Guard conditions:** `title && form.date` requis
**Edge cases:**
- `vaccineKey` vide et `customTitle` vide → toast.error (valide)
- `next_date` auto-calculee depuis `frequencyMonths` si non fournie
- Pas de propagation vers le Hero (compteur vaccineCount) → SUSPECT: le compteur affiché dans le hero (`vaccineCount`) est derive de `records` dans Sante.jsx. `setRecords` est passe via prop. Apres ajout, la derivation est immediate grace a l'update local.
- `dog.id` peut etre null si dog = null → SectionVaccins ne reçoit `dogId` que si dog existe dans NotebookContent
**Verdict:** OK

---

#### Action: Ajouter un poids (SectionPoids)
**Handler:** SectionPoids.jsx:18 — `handleSaveWeight()`
**Flow:**
```
click "Ajouter" → validation (w > 0 && w <= 200 && date)
→ HealthRecord.create({ dog_id, type: "weight", title: "Pesée", date, value: w })
→ Dog.update(dogId, { weight: w }) [sync poids]
→ onRecordAdded(record) → setRecords local
→ toast.success
```
**Guard conditions:** poids valide (0-200), date requise
**Edge cases:**
- `Dog.update` echoue silencieusement (try/catch avec warn)
- Double sync possible si GrowthTracker aussi appelle Dog.update le meme jour — derniere ecriture gagne
- `records` dans Sante.jsx mis a jour via callback mais `dog.weight` dans Sante.jsx NOT updated → SUSPECT: apres un poids ajoute via SectionPoids, `dog.weight` en memoire dans Sante.jsx reste l'ancienne valeur. Seul `Dog` en DB est mis a jour.
**Verdict:** SUSPECT — `dog` state non mis a jour dans Sante.jsx apres poids ajoute via SectionPoids

---

#### Action: Supprimer un enregistrement sante
**Handler:** NotebookContent.jsx:116 — `handleDelete(id)`
**Flow:**
```
click delete → id.startsWith("dl-") ? return (no-op pour pseudo-records DailyLog)
→ HealthRecord.delete(id)
→ setRecords(prev => prev.filter(r => r.id !== id))
→ rollback si erreur
```
**Guard conditions:** Guard explicite contre la suppression des pseudo-records (`dl-` prefix)
**Edge cases:**
- Pseudo-records issus de GrowthEntry (`ge-` prefix) → `handleDelete("ge-...")` APPELLE HealthRecord.delete("ge-...") qui va echouer en API — RUPTURE: le guard ne couvre que `dl-`, pas `ge-`. La suppression d'un pseudo-record GrowthEntry va tenter une requete API et echouer avec toast d'erreur.
- Rollback sur erreur: OK, `previousRecords` sauvegardee avant
**Verdict:** RUPTURE — `handleDelete` ne filtre pas les pseudo-records `ge-*`, cause une tentative de suppression invalide

---

#### Action: Ouvrir l'Assistant Sante (HealthAssistantBar click)
**Handler:** Sante.jsx:306 — `onClick={() => setIsAssistantOpen(true)}`
**Flow:**
```
click FAB → setIsAssistantOpen(true)
→ HealthAssistantSheet visible
→ SmartHealthAssistant monte avec dogId
→ initCredits() + messages init + localStorage pending records restaures
```
**Guard conditions:** `dogId` present (dog peut etre null si pas de chien)
**Edge cases:**
- `dog = null` → `dogId = dog?.id = undefined` → SmartHealthAssistant ne monte pas (`if (dogId)` ligne 69 de HealthAssistantSheet)
- `useBackClose` gere le bouton back Android
**Verdict:** OK

---

#### Action: Sauvegarder un enregistrement depuis l'Assistant Sante
**Handler:** Sante.jsx:123 — `handleAddFromSheet(record)`
**Flow:**
```
SmartHealthAssistant → onRecordAdded(record)
→ setRecords(prev => [...prev, record])
→ navigator.vibrate(30)
→ updateStreakSilently(dog.id, user.email)
```
**Guard conditions:** `dog && user` pour streak update
**Edge cases:**
- `record` peut contenir des champs invalides si l'IA les genere mal — pas de validation cote frontend
- Streak update echoue silencieusement (`.catch(() => {})` implique dans `updateStreakSilently`)
**Verdict:** OK

---

### Tab MALADE — DiagnosisContent

#### Action: Clic sur symptome rapide
**Handler:** DiagnosisContent.jsx:38 — `openWithSymptom(symptom)`
**Flow:**
```
click symptome → setPreSelectedSymptom(symptom) → setShowModal(true)
→ AIDiagnosisModal s'ouvre avec symptome pre-selectionne
```
**Guard conditions:** aucun — accessible meme si `dog = null`
**Edge cases:**
- `dog = null` → modal s'ouvre mais `dog?.name` affiche "ton chien". Comportement acceptable.
- Rapports charges au mount depuis `DiagnosisReport.filter({ dog_id: dog.id })` — si dog null, effect ne s'execute pas (guard `if (!dog?.id) return`)
**Verdict:** OK

---

#### Action: Charger l'historique des rapports de diagnostic
**Handler:** DiagnosisContent.jsx:29-36 — `useEffect([dog?.id])`
**Flow:**
```
mount/dog change → DiagnosisReport.filter({ dog_id: dog.id }, "-report_date", 10)
→ setReports(data || []) ou setReports([]) sur erreur
```
**Guard conditions:** `dog?.id` present
**Edge cases:** erreur silencieuse (catch → setReports([]))
**Verdict:** OK

---

### Tab DOCUMENTS — HealthImportContent

#### Action: Selectionner source d'import (fichier / photo / texte)
**Handler:** HealthImportContent.jsx:78 — `handleSourceSelect(src)`
**Flow:**
```
click source → setSource(src)
→ src.id === "text" → setStep(INPUT)
→ sinon → fileInputRef.click() (accept + capture configures)
```
**Guard conditions:** `!isPremium && !hasCredits → UpgradePrompt (pas de bouton selectable)`
**Edge cases:** `fileInputRef.current.accept = src.accept` avant click — synchrone, OK
**Verdict:** OK

---

#### Action: Uploader un fichier / photo pour import IA
**Handler:** HealthImportContent.jsx:91 — `handleFileChange(e)`
**Flow:**
```
file selected → setStep(ANALYZING) → Promise.all([animateSteps(), UploadFile])
→ base44.functions.invoke("parseHealthFile", { file_url, dog_name, dog_breed })
→ processResult(res.data) → setStep(REVIEW)
```
**Guard conditions:** credit check en amont (UpgradePrompt)
**Edge cases:**
- `dog = null` → `dog?.name` et `dog?.breed` seront undefined — parseHealthFile reçoit des champs vides mais ne plante pas
- Erreur upload → toast.error + setStep(SELECT)
- `isSuspiciousRecord` filtre les records avec valeurs aberrantes ou dates hors range
**Verdict:** OK

---

#### Action: Confirmer l'import des records selectionnes
**Handler:** HealthImportContent.jsx:136 — `handleImport()`
**Flow:**
```
click "Importer" → filter selected records
→ for each: HealthRecord.create(...)
→ si type === "weight" && value: Dog.update(dog.id, { weight })
→ onImported(created) → Sante.jsx setRecords(prev => [...prev, ...newRecs])
→ setStep(SUCCESS)
```
**Guard conditions:** `selected` Set non vide
**Edge cases:**
- Import partiel: failedCount compte les echecs, toast.warning si > 0
- `dog.id` peut etre null si dog null — HealthRecord.create echouera — pas de guard explicite SUSPECT
- `Dog.update` tente si record.type === "weight" mais `dog` peut etre undefined RUPTURE
**Verdict:** SUSPECT — pas de guard `if (!dog)` avant `handleImport`, crash potentiel si dog null

---

### Tab CROISSANCE — GrowthTrackerContent

#### Action: Upload photo pour analyse IA de croissance
**Handler:** GrowthTrackerContent.jsx:77 — `handlePhotoUpload(e)`
**Flow:**
```
file selected → credit check (isPremium || hasCredits)
→ URL.createObjectURL → setPreviewUrl
→ base44.integrations.Core.UploadFile({ file })
→ base44.functions.invoke("analyzeGrowthPhoto", { dogId, photoUrl, dogBreed, dogBirthDate, currentWeight })
→ setAnalysisResult(resp.data?.analysis + photo_url)
→ if (!isPremium) consume()
```
**Guard conditions:** credit check bloquant au debut
**Edge cases:**
- `dog.id` null → analyzeGrowthPhoto appele avec dogId = undefined
- `resp.data?.analysis` null → setAnalysisResult(undefined + photo_url) → possible crash dans l'affichage
- Erreur → toast.error + setPreviewUrl(null)
**Verdict:** SUSPECT — si `resp.data?.analysis` est null/undefined, l'etat `analysisResult` devient `{ photo_url: "..." }` sans les champs attendus, pouvant causer des rendus incorrects

---

#### Action: Sauvegarder l'analyse photo en GrowthEntry
**Handler:** GrowthTrackerContent.jsx:108 — `saveAnalysis()`
**Flow:**
```
click "Sauvegarder" → GrowthEntry.create({ dog_id, owner_email, date, weight_kg, height_cm, bcs, ... })
→ Dog.update(dog.id, { weight: entry.weight_kg }) si weight present
→ onGrowthAdded(entry) → Sante.jsx: setGrowthEntries + setDog poids
→ setSavedAnalysis(true) → reset apres 1200ms
```
**Guard conditions:** `analysisResult` present
**Edge cases:**
- `Dog.update` echoue silencieusement (warn)
- `onGrowthAdded` declenche le callback Sante.jsx qui met a jour `dog.weight` en memoire (ligne 279)
**Verdict:** OK

---

#### Action: Ajouter une mesure manuelle (poids/taille)
**Handler:** GrowthTrackerContent.jsx:141 — `saveManual()`
**Flow:**
```
click "Ajouter" → validation (weight required, 0-200, height 0-150)
→ GrowthEntry.create({ dog_id, owner_email, date, weight_kg, height_cm, source: "manual" })
→ Dog.update(dog.id, { weight })
→ onGrowthAdded(entry) → setGrowthEntries + setDog
→ loadEntries() [re-fetch depuis DB]
```
**Guard conditions:** poids valide et obligatoire
**Edge cases:** hauteur optionnelle avec validation si fournie
**Verdict:** OK

---

#### Action: Supprimer une entree de croissance
**Handler:** GrowthTrackerContent.jsx:180 — `deleteEntry(id)`
**Flow:**
```
click delete → optimistic: setEntries(prev.filter(e => e.id !== id))
→ GrowthEntry.delete(id)
→ rollback sur erreur
```
**Guard conditions:** aucun
**Edge cases:** rollback sur erreur restaure `previousEntries` — OK
**Verdict:** OK

---

### Tab VETO — FindVetContent (lazy)

**Note:** Charge en lazy via Suspense. Pas trace dans ce SFA car hors perimetre direct (composant Leaflet/map). Flux: FindVetContent reçoit `dog` et `user`, affiche une carte des veterinaires proches.

---

---

## PAGE: Nutri.jsx

**Fichier:** `src/pages/Nutri.jsx`
**Data chargee au mount:** Dog, FoodScan(5), DietPreferences, DailyCheckin(7), HealthRecord(10), DailyLog(7), NutritionPlan(10)
**Auth pattern:** attend `isLoadingAuth` avant de lancer `init(authUser)`

---

### Action: Page load / mount
**Handler:** Nutri.jsx:237-241 — `useEffect([isLoadingAuth, authUser])`
**Flow:**
```
AuthContext ready → init(authUser)
→ base44.auth.me() si pas de providedUser
→ initCredits(u) si pas premium → setMessagesRemaining
→ Dog.filter({ owner: u.email }) → getActiveDog
→ Promise.all([FoodScan, DietPreferences, DailyCheckin, HealthRecord, DailyLog, NutritionPlan])
→ setDogDataState (all fields atomically via batch)
→ message d'accueil construit avec planInfo
→ setInitializing(false)
```
**Guard conditions:** `isLoadingAuth === false`
**Edge cases:**
- `dog = null` (pas de chien) → page "Crée le profil" affichee avec EmptyState
- `NutritionPlan.filter` echoue → `.catch(() => [])` — silencieux, activePlan reste null
- `planInfo` calcule via JSON.parse(active.plan_text) — si JSON invalide → catch → `""` (safe)
**Verdict:** OK

---

### Action: Changement d'onglet (Scanner / Plan repas / Coach IA / Comparer / Preferences)
**Handler:** Nutri.jsx:120 — `changeTab(tabId)`
**Flow:**
```
click tab → sessionStorage.set + setSearchParams({ tab: tabId })
→ AnimatePresence slide → nouveau contenu
```
**Guard conditions:** aucun — tous les onglets accessibles
**Edge cases:**
- `sessionStorage` persistee — tab restauree apres retour navigation
- Default tab: `"coach"` (ligne 113) — Coach IA s'ouvre en premier
**Verdict:** OK

---

### Tab COACH IA — Conversation NutriCoach

#### Action: Envoyer un message au NutriCoach
**Handler:** Nutri.jsx:328 — `sendMessage(text?)`
**Flow:**
```
click send ou Enter → content = (text || input).trim()
→ Guard: !content || !dog || loading → return
→ Guard premium: messagesRemaining <= 0 → return
→ setInput("") → setLastFailedInput(null)
→ setMessages(prev => [...prev, { role: "user", content, timestamp }])
→ setLoading(true)
→ contextMsgs = messages.slice(-15) + user message
→ base44.functions.invoke("pawcoachChat", { dogId, mode: "nutrition", messages: contextMsgs })
→ response.data?.error === "quota_exceeded" → setMessagesRemaining(0) return
→ startStreaming(assistantContent, ts) [typewriter]
→ setMessagesRemaining(response.data.messages_remaining) si non-premium
```
**Guard conditions:** content non vide, dog present, pas loading, credits suffisants
**Edge cases:**
- `isLimitReached` affiche wall premium mais `sendMessage` garde aussi le guard → double protection
- Erreur 429 → setMessagesRemaining(0), pas de message d'erreur affiché — SUSPECT: l'utilisateur ne voit rien si 429 retourne avant le toast
- Erreur generique → message d'erreur dans le chat + `lastFailedInput` stocke pour retry
- `messages.slice(-15)` — contexte tronque, OK pour limiter les tokens
**Verdict:** SUSPECT — erreur 429 silencieuse (setMessagesRemaining(0) mais pas de toast)

---

#### Action: Cliquer sur une quick action
**Handler:** Nutri.jsx:718 — `onClick={() => sendMessage(s)}`
**Flow:**
```
click chip → sendMessage(s) [same flow as above]
→ showQuickActions masque apres le 1er message (messages.length > 1)
```
**Guard conditions:** `showQuickActions = messages.length <= 1 && !isLimitReached`
**Edge cases:** si credits 0 → quick actions disparaissent (isLimitReached true)
**Verdict:** OK

---

#### Action: Retry un message echoue
**Handler:** Nutri.jsx:645 — `onClick={() => sendMessage(lastFailedInput)}`
**Flow:**
```
click "Reessayer" → sendMessage(lastFailedInput)
→ meme flow que sendMessage normal
→ setLastFailedInput(null) au debut
```
**Guard conditions:** `lastFailedInput` present && `msg.isError`
**Edge cases:** si la meme erreur se reproduit → nouveau message d'erreur + lastFailedInput re-stocke
**Verdict:** OK

---

#### Action: Sauvegarder un conseil (Bookmark)
**Handler:** Nutri.jsx:190 — `handleBookmark(msg)`
**Flow:**
```
click bookmark icon → Guard: !dog || !user || bookmarked[msg.timestamp] → return
→ BookmarkEntity.create({ dog_id, owner, content, source: "nutrition", title, created_at })
→ setBookmarked(prev => { ...prev, [msg.timestamp]: true })
→ toast.success
```
**Guard conditions:** dog present, user present, pas deja bookmarke
**Edge cases:**
- `bookmarked` est un state ephemere (pas persiste) → si l'utilisateur rafraichit, il peut re-bookmarker le meme message — cree des doublons en DB
- `title` tronque a 60 chars depuis le contenu — OK
**Verdict:** SUSPECT — pas de check DB pour doublon, re-bookmark possible apres refresh

---

#### Action: Copier un message
**Handler:** Nutri.jsx:209 — `handleCopy(content)`
**Flow:**
```
click copy → navigator.clipboard?.writeText(content)
→ toast.success("Copie !")
→ .catch(() => {}) [silencieux si clipboard non disponible]
```
**Guard conditions:** aucun
**Edge cases:** clipboard non disponible (iOS safari certains contextes) → echec silencieux
**Verdict:** OK

---

#### Action: Scroll vers le bas (FAB)
**Handler:** Nutri.jsx:185 — `scrollToBottom()`
**Flow:**
```
click chevron-down FAB → bottomRef.current?.scrollIntoView({ behavior: "smooth" })
→ setShowScrollBtn(false)
```
**Guard conditions:** `showScrollBtn` pour afficher/masquer le bouton
**Edge cases:** `bottomRef.current` null → no-op safe avec `?.`
**Verdict:** OK

---

### Tab SCAN — Lien vers Scan page

#### Action: Clic "Ouvrir le Scanner"
**Handler:** Nutri.jsx:544 — `<Link to={createPageUrl("Scan")}>`
**Flow:**
```
click → react-router navigate vers /Scan
→ scan fait sur Scan.jsx
→ retour sur Nutri.jsx → visibilitychange event → refreshScans()
```
**Guard conditions:** aucun
**Edge cases:**
- CACHE-04: `visibilitychange` + `window.focus` declenchent refresh automatique des scans
- `dog?.id` verifie avant refresh (ligne 247) — OK
**Verdict:** OK

---

### Tab PLAN REPAS — NutritionMealPlan

#### Action: Generer un plan repas
**Handler:** NutritionMealPlan.jsx — `MealPlanGenerator` sous-composant
**Flow:**
```
click "Generer" → useActionCredits() check
→ isMonthlyLimitReached → UpgradePrompt si non-premium + count >= 2
→ base44.functions.invoke("generateMealPlan", {...})
→ plan JSON parse + setплан → affichage
→ consume() si non-premium
→ onPlanSaved() → refreshPlans() dans Nutri.jsx
```
**Guard conditions:** credit check (hasCredits || isPremium) + monthly limit check
**Edge cases:**
- `latestRealWeight` calcule depuis healthRecords + dailyLogs (STALE-04 fix) — correctement priorise les vraies pesees
- `parsePlanJSON` safe avec try/catch
**Verdict:** OK

---

#### Action: Sauvegarder une note sur le plan actif
**Handler:** NutritionMealPlan.jsx:92 — `handleSaveNote()`
**Flow:**
```
click "Enregistrer" → NutritionPlan.update(activePlan.id, { notes: tempNote })
→ setEditingNote(false) → toast.success
→ onPlanSaved() → refreshPlans() → setActivePlan mis a jour
```
**Guard conditions:** `activePlan` present
**Edge cases:** erreur → toast.error, editingNote reste false (form ferme meme en erreur) — SUSPECT: form ferme avant la confirmation du succes
**Verdict:** SUSPECT — `setEditingNote(false)` appele avant NutritionPlan.update, si l'update echoue le form est deja ferme

---

### Tab PREFERENCES — DietPreferencesPanel

#### Action: Sauvegarder les preferences alimentaires
**Handler:** DietPreferencesPanel.jsx — `onPreferencesSaved` → `refreshDietPrefs()`
**Flow:**
```
save → DietPreferences.create ou update
→ onPreferencesSaved() → refreshDietPrefs() dans Nutri.jsx
→ DietPreferences.filter re-fetch → setDietPrefs
```
**Guard conditions:** dog present
**Verdict:** OK (composant non trace en detail mais le callback chain est correct)

---

### Tab COMPARER — FoodComparator

#### Action: Ajouter un produit (scan photo)
**Handler:** FoodComparator.jsx — ProductSlot onChange
**Flow:**
```
file selected → base44.integrations.Core.UploadFile
→ base44.functions.invoke("analyzeFoodLabel" ou equivalent)
→ useActionCredits() consume
→ setProduct(result)
```
**Guard conditions:** credit check (hasCredits || isPremium)
**Edge cases:** erreur API → toast.error
**Verdict:** OK

---

#### Action: Sauvegarder comparaison en Bookmark
**Handler:** FoodComparator.jsx — `handleSave`
**Flow:**
```
click "Sauvegarder" → Bookmark.create({ dog_id, owner, content, source: "nutrition" })
→ toast.success
```
**Guard conditions:** comparaison completee (2 produits analyses)
**Verdict:** OK

---

### Refresh automatique des scans (CACHE-04)
**Handler:** Nutri.jsx:244-261 — `useEffect([dog?.id])`
**Flow:**
```
visibilitychange / window.focus → refreshScans()
→ FoodScan.filter({ dog_id }, "-timestamp", 5) → setRecentScans
```
**Guard conditions:** `dog?.id` present
**Edge cases:** echec silencieux (.catch(() => {}))
**Verdict:** OK

---

---

## PAGE: Activite.jsx

**Fichier:** `src/pages/Activite.jsx`
**Data chargee au mount:** Dog, DailyLog (30 derniers)
**Auth pattern:** attend `isLoadingAuth` avant de lancer `load(authUser)`

---

### Action: Page load / mount
**Handler:** Activite.jsx:83-87 — `useEffect([isLoadingAuth, authUser])`
**Flow:**
```
AuthContext ready → load(authUser)
→ base44.auth.me() fallback si pas de providedUser
→ Dog.filter({ owner: u.email }) → getActiveDog
→ DailyLog.filter({ dog_id }, "-date", 30)
→ setLogs(l || []) → setLoading(false)
```
**Guard conditions:** `isLoadingAuth === false`
**Edge cases:**
- `dogs.length === 0` → dog null → onglet Balade affiche EmptyState
- Erreur reseau → setLoadError(true) → banniere offline avec retry
- `loadError` + banniere retry: `load()` sans argument re-appele → base44.auth.me() fallback
**Verdict:** OK

---

### Action: Bouton Retry apres erreur de chargement
**Handler:** Activite.jsx:169 — `onClick={() => { setLoadError(false); load(); }}`
**Flow:**
```
click "Reessayer" → setLoadError(false) → load() sans argument
→ base44.auth.me() → Dog.filter → DailyLog.filter
```
**Guard conditions:** aucun
**Edge cases:** si auth toujours indisponible → re-erreur, banniere re-affichee
**Verdict:** OK

---

### Action: Changement d'onglet (Balade / Historique / Programme / Dressage)
**Handler:** Activite.jsx:55 — `changeTab(tabId)`
**Flow:**
```
click → sessionStorage.set("tab_Activite", tabId) → setSearchParams({ tab: tabId })
→ URL update → activeTab recalcule
```
**Guard conditions:** aucun
**Edge cases:**
- "programme" charge AITrainingProgram en lazy
- "dressage" affiche DressageContent inline (pas de lazy)
**Verdict:** OK

---

### Action: Pull-to-refresh (Activite)
**Handler:** Activite.jsx:178 — `PullToRefresh onRefresh={async () => { await refreshLogs(); }}`
**Flow:**
```
swipe down → refreshLogs()
→ DailyLog.filter({ dog_id }, "-date", 30) → setLogs
→ invalidateHome() [HomeCacheContext]
```
**Guard conditions:** `if (!dog || !user) return` en debut de refreshLogs
**Edge cases:** echec silencieux (pas de catch dans refreshLogs — RUPTURE: si DailyLog.filter echoue, l'exception bulle vers PullToRefresh)
**Verdict:** RUPTURE — `refreshLogs` n'a pas de try/catch, une erreur reseau crash silencieusement ou casse le PullToRefresh

---

### Tab BALADE — WalkMode

#### Action: Demarrer une balade
**Handler:** WalkMode.jsx:194 — `handleStart()`
**Flow:**
```
click "Demarrer" → guard: !dog?.id → toast.error return
→ setStatus("running") → reset counters
→ startGPS() [navigator.geolocation.watchPosition]
→ navigator.wakeLock.request("screen") [optionnel]
→ localStorage.setItem("pawcoach_walk_active", {...})
→ setInterval 1s → elapsed++
→ navigator.vibrate(100)
```
**Guard conditions:** `dog?.id` present
**Edge cases:**
- GPS refus (err.code=1) → toast.info "GPS desactive", distance non mesuree mais chrono continue
- GPS indisponible (err.code=2/3) → toast.error, distance non mesuree
- WakeLock echoue → silencieux (try/catch vide)
- localStorage full → silencieux (try/catch vide)
**Verdict:** OK

---

#### Action: Mettre en pause la balade
**Handler:** WalkMode.jsx:234 — `handlePause()`
**Flow:**
```
status === "running" → setStatus("paused") → clearInterval → stopGPS → releaseWakeLock
status === "paused" → setStatus("running") → pausedRef update → startGPS → re-wakeLock → restart interval
→ localStorage.setItem avec pausedRef.current mis a jour
```
**Guard conditions:** implicite (`status === "running"` ou "paused")
**Edge cases:**
- Crash pendant pause → localStorage contient `pausedRef` correct → recovery au remount
- GPS redemarre apres resume avec nouveau watchPosition → ancien watch nettoye avant via `clearWatch`
**Verdict:** OK

---

#### Action: Arreter et sauvegarder la balade
**Handler:** WalkMode.jsx:265 — `handleStop()`
**Flow:**
```
click stop → stoppingRef = true (guard anti-double-click)
→ clearInterval → stopGPS → releaseWakeLock
→ guard: !dog?.id || !user?.email → erreur
→ localStorage.removeItem("pawcoach_walk_active")
→ setStatus("done") → minutes = max(1, round(elapsed/60))
→ DailyLog.filter({ dog_id, date: today })
→ existing? update walk_minutes + distance : create
→ DailyLog.filter({ dog_id }, "-date", 60) pour badges
→ checkWalkBadges() + updateStreakSilently()
→ onLogged() → refreshLogs() dans Activite.jsx → invalidateHome()
```
**Guard conditions:** `stoppingRef.current` anti-double-click, `dog?.id && user?.email`
**Edge cases:**
- Sauvegarde DB echoue → localStorage pending walks + toast.info
- `minutes = Math.max(1, ...)` → minimum 1 minute meme si balade < 1 min
- `finalDistance = distanceRef.current` synchronise depuis le ref GPS (pas le state)
- `onLogged` appele dans le finally implicitement (fin du try) — SUSPECT: si DailyLog.create echoue mais la sauvegarde offline reussit, `onLogged()` N'EST PAS appele (catch block sauvegarde offline mais n'appelle pas onLogged)
**Verdict:** SUSPECT — si sauvegarde online echoue et offline reussit, `onLogged()` non appele → refreshLogs() non declenche → historique non mis a jour jusqu'au prochain pull

---

#### Action: Sauvegarder le mood post-balade
**Handler:** WalkMode.jsx:342 — `saveMoodData()`
**Flow:**
```
click "Sauvegarder le mood" → guard: !walkMood → return
→ localStorage: stocker { mood, tags } par date (cleanup moods > 90 jours)
→ DailyLog.filter({ dog_id, date: today }) → DailyLog.update(id, { walk_mood, walk_tags })
→ setMoodSaved(true)
```
**Guard conditions:** `walkMood` present
**Edge cases:**
- `DailyLog.update` echoue silencieusement `.catch(() => {})`
- Si le DailyLog n'existe pas encore pour aujourd'hui → le filter retourne [] → update non effectue — RUPTURE: si la balade a ete sauvegardee offline et que DailyLog n'existe pas encore en DB, le mood n'est pas sauvegarde en DB (seulement dans localStorage)
- Cleanup des moods anciens fonctionne correctement
**Verdict:** RUPTURE — mood non sauvegarde en DB si DailyLog n'existe pas encore (scenario offline walk)

---

#### Action: Recovery de balade interrompue (mount)
**Handler:** WalkMode.jsx:68-107 — `useEffect([dog?.id, user?.email])`
**Flow:**
```
mount → localStorage.getItem("pawcoach_walk_active")
→ guard: !user?.email → abort (securite proprietaire)
→ dog?.id === saved.dogId
→ elapsedSec entre 60s et 18000s (5h)
→ setStatus("done") → setSavedMinutes → toast.info
→ DailyLog.create/update pour sauvegarder la balade recuperee
→ localStorage.removeItem
→ onLogged()
```
**Guard conditions:** `user?.email` present, match dogId, temps raisonnable
**Edge cases:**
- Balade de moins de 1 min non recuperee (< 60s) — comportement intentionnel
- Balade de plus de 5h non recuperee — comportement intentionnel (probablement un oubli)
- Erreur DB → console.error, localStorage reste (sera re-tente au prochain mount) — SUSPECT: localStorage non nettoye si save echoue → recovery infinie au chaque remount jusqu'a succes DB
**Verdict:** SUSPECT — localStorage walk_active non nettoye si la sauvegarde DB echoue lors de la recovery

---

#### Action: Sync des balades offline en attente
**Handler:** WalkMode.jsx:110-140 — `useEffect([], [])`
**Flow:**
```
mount → localStorage.getItem("pawcoach_pending_walks")
→ for each pending: DailyLog.filter + update/create
→ localStorage.set des remaining (non-synces)
→ toast.success si sync
→ onLogged()
```
**Guard conditions:** `pending.length > 0`
**Edge cases:**
- Erreur DB → `break` (stop trying, reste en pending) — OK
- `synced.includes(w)` — comparaison par reference object (identity check) — SUSPECT: si les objects walks en pending sont deserialises depuis JSON, la comparaison par reference ne fonctionnera jamais → `remaining` sera toujours egal a `pending` → les walks synces ne seront jamais retirees de pending
**Verdict:** RUPTURE — `pending.filter(w => !synced.includes(w))` utilise la reference object apres JSON.parse, les walks ne seront jamais marquees comme synces → duplication infinie potentielle

---

### Tab HISTORIQUE — TrackerHistory

**Handler:** Activite.jsx:219 — `<TrackerHistory logs={logs} dog={dog} />`
**Flow:**
```
props: logs (30 derniers), dog
→ useMemo: sorted par date desc
→ moods: enrichis depuis localStorage + DailyLog.walk_mood
→ calculateStreaks(sorted)
→ getDayAverages(sorted)
→ render BarChart + ActivityCalendar
```
**Guard conditions:** aucun — rendu meme si logs = []
**Edge cases:**
- `logs = []` → EmptyState affiche
- Moods: priorite localStorage > DailyLog.walk_mood — peut creer inconsistance si l'user change d'appareil
- `calculateStreaks` utilise `format(subDays(new Date(), 1))` pour yesterday — correct
**Verdict:** OK

---

### Tab PROGRAMME — AITrainingProgram (lazy)

#### Action: Generer un programme d'entrainement
**Handler:** AITrainingProgram.jsx — `generateProgram` (deduit depuis le flow base44.functions)
**Flow:**
```
click "Generer" → useActionCredits check
→ base44.functions.invoke("generateTrainingProgram", { dogId, logs, goals, ... })
→ setProgram(data) → consume()
```
**Guard conditions:** credit check
**Verdict:** OK (structure generale)

---

#### Action: Activer/sauvegarder un programme
**Handler:** AITrainingProgram.jsx:139 — `saveProgram()`
**Flow:**
```
click "Activer" → guard: !program || !dog || saved → return
→ base44.auth.me() [SUSPECT: re-appel API pour recuperer user]
→ Bookmark.create({ dog_id, owner, content: JSON.stringify(payload), source: "training" })
→ setSaved(true) → setOpenDay(0) → toast.success
```
**Guard conditions:** program present, dog present, pas deja save
**Edge cases:**
- `base44.auth.me()` appele sans passer `user` du parent — genere un appel API supplementaire inutile
- Si Bookmark.create echoue → toast.error, saved reste false
**Verdict:** SUSPECT — re-appel `base44.auth.me()` inutile, user disponible dans `logs` context depuis Activite.jsx (les logs sont passes mais pas le user)

---

#### Action: Marquer un jour du programme comme complete
**Handler:** AITrainingProgram.jsx:163 — `toggleDay(dayIdx)`
**Flow:**
```
click day → optimistic: setCompletedDays(next)
→ allDone check → setProgram({ ...updatedProgram })
→ Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) })
→ rollback si erreur
```
**Guard conditions:** `bookmarkId` present
**Edge cases:** rollback: `setCompletedDays(prev)` + `setProgram({ ...program, completed_days: prev })`
**Verdict:** OK

---

#### Action: Sauvegarder le bilan de programme
**Handler:** AITrainingProgram.jsx:188 — `saveBilan()`
**Flow:**
```
click "Sauvegarder" → guard: !bookmarkId || bilanSaved → return
→ bilan = { observed_indicators, feeling, feedback, next_focus }
→ setProgram({ ...program, bilan })
→ setBilanSaved(true) → setBilanJustSaved(true)
→ Bookmark.update(bookmarkId, { content: JSON.stringify(updatedProgram) })
```
**Guard conditions:** bookmarkId present, pas deja save
**Edge cases:** `bilanSaved = true` apres premier save → idempotent
**Verdict:** OK

---

### Tab DRESSAGE — DressageContent

#### Action: Clic "Voir les parcours d'entrainement"
**Handler:** Activite.jsx:277 — `<Link to={createPageUrl("Training")}>`
**Flow:**
```
click → react-router navigate vers /Training
```
**Guard conditions:** aucun
**Edge cases:** `dog?.name` utilise avec `||` fallback — safe
**Verdict:** OK

---

---

## SYNTHESE PAR SEVERITE

### RUPTURES (bloquants — a corriger)

| # | Page | Composant | Description |
|---|------|-----------|-------------|
| R1 | Sante | NotebookContent.jsx:117 | `handleDelete` ne filtre pas les pseudo-records `ge-*`, tente un HealthRecord.delete invalide |
| R2 | Activite | WalkMode.jsx:343 | Mood non sauvegarde en DB si DailyLog n'existe pas (scenario walk offline) |
| R3 | Activite | WalkMode.jsx:132 | `pending.filter(w => !synced.includes(w))` utilise reference object apres JSON.parse — walks offline jamais marquees comme synces, duplication potentielle |
| R4 | Activite | Activite.jsx:178 | `refreshLogs()` sans try/catch — une erreur reseau crash silencieusement PullToRefresh |

### SUSPECTS (a investiguer)

| # | Page | Composant | Description |
|---|------|-----------|-------------|
| S1 | Sante | Sante.jsx:224 | Pull-to-refresh ignore `authUser` du contexte, genere un appel `base44.auth.me()` supplementaire |
| S2 | Sante | SectionPoids | `dog.weight` en memoire dans Sante.jsx non mis a jour apres ajout poids via SectionPoids |
| S3 | Sante | HealthImportContent:136 | Pas de guard `if (!dog)` avant `handleImport`, crash si dog null |
| S4 | Sante | GrowthTrackerContent:97 | Si `resp.data?.analysis` null, `analysisResult` sans champs attendus |
| S5 | Nutri | Nutri.jsx:356 | Erreur 429 silencieuse dans sendMessage — setMessagesRemaining(0) sans toast |
| S6 | Nutri | Nutri.jsx:190 | Bookmark doublon possible si re-bookmark apres refresh (bookmarked state ephemere) |
| S7 | Nutri | NutritionMealPlan.jsx:92 | `setEditingNote(false)` avant confirmation update reussie |
| S8 | Activite | WalkMode.jsx:319 | `onLogged()` non appele si sauvegarde online echoue et offline reussit |
| S9 | Activite | WalkMode.jsx:100 | `localStorage walk_active` non nettoye si sauvegarde DB echoue en recovery |
| S10 | Activite | AITrainingProgram.jsx:142 | `base44.auth.me()` re-appele dans saveProgram alors que user non passe en prop |

### OK (flux valides)

- Sante: mount, tab change, HealthAssistant open/save, DiagnosisContent, SectionVaccins, GrowthEntry delete, HealthImport file/text/review
- Nutri: mount, tab change, send message, retry, quick actions, copy, scroll, scan link, FoodComparator, DietPreferences, plan generation
- Activite: mount, retry erreur, tab change, WalkMode start/pause/stop (cas nominal), TrackerHistory, AITrainingProgram toggle/bilan, DressageContent

---

*Genere le 27 mars 2026 — SFA Group 2*
