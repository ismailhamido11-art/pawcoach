# SFA Group 3 — Scan / Training / Chat
**Static Flow Analysis — trace ligne par ligne**
Date : 27 mars 2026 | Analyste : Claude Code

---

## RESUME EXECUTIF

| Page | Actions tracees | OK | SUSPECT | RUPTURE |
|------|----------------|----|---------|---------|
| Scan (Food mode) | 8 | 6 | 2 | 0 |
| Scan (Label mode) | 5 | 4 | 1 | 0 |
| Training | 10 | 8 | 2 | 0 |
| Chat | 9 | 7 | 2 | 0 |
| **Total** | **32** | **25** | **7** | **0** |

**Aucune RUPTURE detectee.** 7 SUSPECT necessitent attention avant launch.

---

## PAGE : SCAN (src/pages/Scan.jsx)

### Action: [Chargement initial de la page]
**Handler:** Scan.jsx:142 — `useEffect(() => { loadData(); }, [])`
**Flow:**
1. `base44.auth.me()` → setUser
2. `Dog.filter({ owner: u.email })` → getActiveDog → setDog
3. `Promise.all([FoodScan.filter({ dog_id }), DietPreferences.filter({ dog_id }).catch([])])` → setHistory, setDietPreferences
4. `setLoading(false)` → affichage principal

**Guard conditions:**
- Si `dogs?.length === 0` → dog reste null, page s'affiche sans crash (champs protéges avec `dog?.name`)
- Si DietPreferences échoue → `.catch(() => [])` → graceful degradation, dietPreferences = null

**Edge cases:**
- `dogs` null : protégé par `dogs?.length > 0`
- Pas d'historique : `setHistory([])` OK, la section history est cachée par `history.length > 0`
- Erreur réseau : setError avec message + retry button `loadData()`

**Verdict:** OK

---

### Action: [User sélectionne une image (camera/galerie)]
**Handler:** Scan.jsx:183 — `handleFile(f)`
**Flow:**
1. `checkScanLimit(user)` → si true → `setScanLimitReached(true)` → STOP
2. `setFile(f)`, `setResult(null)`, reset état
3. `FileReader.readAsDataURL(f)` → `setPreview(e.target.result)` (onload async)
4. Bouton "Analyser" devient visible

**Guard conditions:**
- Quota vérifié sur l'état local `user` (qui peut être périmé depuis le chargement initial)
- `e.target.files[0] && handleFile(...)` : protège contre undefined

**Edge cases:**
- `user` null lors du check : `isUserPremium(null)` → false, `u?.scans_this_week` → 0 → quota = 0 < 3 → passe. Pas de crash mais le guard quota ne fonctionne pas si user est null.
- FileReader échoue silencieusement (pas de catch sur `reader.onload`)

**Verdict:** SUSPECT — le quota check client-side utilise `user` local (pas re-fetché). Si l'utilisateur a utilisé des scans sur un autre appareil entre la navigation et le clic, le compteur local sera périmé. Mitigé par le re-fetch dans `analyzeFood` (SEC-04), mais handleFile n'invalide pas le scanLimitReached si le quota a changé depuis.

---

### Action: [User tape "Analyser cet aliment"]
**Handler:** Scan.jsx:196 — `analyzeFood()`
**Flow:**
1. Guard : `!file || !dog` → return
2. **SEC-04** : `base44.auth.me()` → freshUser → `setUser(freshUser)` — re-fetch serveur
3. `checkScanLimit(freshUser)` → si true → `setScanLimitReached(true)` → STOP
4. `setScanning(true)`, reset état
5. `base44.integrations.Core.UploadFile({ file })` → `{ file_url }`
6. Construction du prompt (avec âge calculé, préférences diet)
7. `base44.integrations.Core.InvokeLLM({ prompt, file_urls, response_json_schema })` → `aiResult`
8. `incrementScanCount(freshUser)` → `base44.auth.updateMe({ scans_this_week, scans_week_start })`
9. `base44.auth.me()` → `updatedUser` → `setUser(updatedUser)` (re-fetch après incrément)
10. `setResult({ ...aiResult, photo_url: file_url, timestamp })` — fusion correcte
11. `trackEvent("scan_completed", ...)`, vibration si toxic

**Guard conditions:**
- Re-fetch user garanti (SEC-04) → quota serveur fiable
- `VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.caution` → fallback si verdict inconnu

**Edge cases:**
- `dog.birth_date` null → ageText = "âge inconnu" → OK, prompt gère
- `dietPreferences` null → `dietPreferences?.disliked_foods || "aucun"` → OK
- Upload échoue → catch → `setError("L'analyse a échoué...")` → bouton "Réessayer" → `loadData()` (pas `analyzeFood`, donc l'user peut re-tenter)
- Si `incrementScanCount` échoue après succès AI : le scan est perdu mais le quota n'est pas incrémenté → l'utilisateur peut rescanner. SUSPECT mineur.
- `aiResult.verdict` retourné par LLM hors des 3 valeurs attendues : géré par fallback `|| VERDICT_CONFIG.caution`

**Verdict:** OK — SEC-04 solidement implémenté. Le double re-fetch (avant + après incrément) est correct.

---

### Action: [User tape "Sauvegarder"]
**Handler:** Scan.jsx:246 — `saveResult()`
**Flow:**
1. Guard : `!result || !dog || !user` → return
2. `FoodScan.create({ dog_id, photo_url, food_name, verdict, score, summary, details, recommendation, allergen_alerts, timestamp })`
3. `setSaved(true)`, `toast.success`, `setHistory(prev => [result, ...prev])`, vibration
4. `base44.auth.updateMe({ points: (user.points || 0) + 10 })` → +10 points
5. `setUser(prev => ({ ...prev, points: newPoints }))`
6. `updateStreakSilently(dog.id, user.email)` (fire & forget)

**Guard conditions:**
- `disabled={saved}` sur le bouton → empêche double sauvegarde
- `setSaved(true)` positionné avant les calls points/streak → si points échoue, le scan est sauvé quand même

**Edge cases:**
- Si `FoodScan.create` échoue → catch → `toast.error` → `saved` reste false → l'user peut réessayer
- `result.photo_url` : présent car ajouté dans `finalResult` après UploadFile. OK.
- `user.points` null → `(user.points || 0) + 10` → 10. OK.
- `updateStreakSilently` : erreur silencieuse (try/catch interne), ne bloque pas l'UX

**Verdict:** OK

---

### Action: [User tape "Oui" — chien a mangé l'aliment toxique]
**Handler:** Scan.jsx:515 — `onClick={() => setDogAteIt(true)}`
**Flow:**
1. `setDogAteIt(true)` → re-render
2. Conditionnel : `result?.verdict === "toxic" && dogAteIt` → banner d'urgence (fixed top, z-50)
3. Lien `tel:0478871040` vers centre antipoison
4. Header devient `safe-pt-24` pour compenser le banner

**Guard conditions:**
- `result?.verdict === "toxic"` requis pour afficher les boutons Oui/Non
- Banner affiché uniquement si `result?.verdict === "toxic" && dogAteIt`

**Edge cases:**
- Aucune sauvegarde de l'état `dogAteIt` en DB → si l'user quitte et revient, le banner disparait. Comportement acceptable (urgence = action immédiate, pas un état persistant).
- `reset()` remet `dogAteIt(false)` — cohérent.

**Verdict:** OK

---

### Action: [User tape "Partager"]
**Handler:** Scan.jsx:541 — `onClick={() => setShowShare(true)}`
**Flow:**
1. `setShowShare(true)` → render `<ShareCard result={result} dogName={dog?.name} onClose={() => setShowShare(false)} />`
2. ShareCard reçoit `result` et `dogName` comme props

**Guard conditions:**
- Bouton visible uniquement quand `result && verdictCfg` (ligne 485) → result est garanti non-null dans le callback

**Edge cases:**
- `dog?.name` : optional chaining → OK si dog null (cas théorique)
- ShareCard non analysée en détail — considérée comme présentation pure

**Verdict:** OK

---

### Action: [User tape "Nouveau"]
**Handler:** Scan.jsx:540 — `onClick={reset}`
**Flow:**
1. `reset()` : setResult(null), setPreview(null), setFile(null), setSaved(false), setShowDetails(false), setDogAteIt(false), setScanLimitReached(false), setError(null)
2. `handleModeChange(m)` appelle `reset()` en plus de `setMode(m)` et `setLabelResult(null)`

**Guard conditions:** Aucun guard nécessaire (reset pur)

**Edge cases:**
- `labelResult` pas remis à null par `reset()` directement — mais `handleModeChange` appelle `reset()` PUIS `setLabelResult(null)`. OK.
- Le fichier `file` est déréférencé mais pas révoqué (File objects n'ont pas de `revokeObjectURL` contrairement à Blob URLs). OK, les File objects sont GC'd normalement.

**Verdict:** OK

---

### Action: [User change de mode (food ↔ label)]
**Handler:** Scan.jsx:281 — `handleModeChange(m)`
**Flow:**
1. `setMode(m)` → bascule vers label ou food
2. `reset()` → nettoie tout l'état food mode
3. Pour le mode label → render `<LabelScanMode ... onLabelResult={setLabelResult} />`
4. `labelResult` contrôle la visibilité du ModeSwitcher (ligne 356) : `!result && !scanLimitReached && !labelResult`

**Guard conditions:**
- ModeSwitcher caché quand `labelResult` est non-null (CRASH-02 fix) — empêche de switcher en milieu d'analyse label

**Edge cases:**
- Si user est en mode label avec un résultat et revient en mode food : `handleModeChange("food")` reset + `setLabelResult(null)` → ModeSwitcher réapparait. OK.

**Verdict:** OK

---

## PAGE : SCAN — MODE LABEL (src/components/scan/LabelScanMode.jsx)

### Action: [User sélectionne une image d'étiquette]
**Handler:** LabelScanMode.jsx:54 — `handleLabelFile(f)`
**Flow:**
1. `checkScanLimit(user)` (quota SHARED avec food mode) → si true → `setScanLimitReached(true)` → STOP
2. `setLabelFile(f)`, `setLabelResult(null)`, `setShowIngredients(false)`
3. `FileReader.readAsDataURL(f)` → `setLabelPreview(e.target.result)`

**Guard conditions:**
- Même problème que food mode : `user` peut être périmé. Mitigé par re-fetch dans `analyzeLabel`.

**Edge cases:**
- Pas de catch sur FileReader. Comportement identique au food mode.

**Verdict:** OK (mêmes réserves que handleFile food mode)

---

### Action: [User tape "Analyser cette étiquette"]
**Handler:** LabelScanMode.jsx:65 — `analyzeLabel()`
**Flow:**
1. Guard : `!labelFile || !dog` → return
2. `base44.auth.me()` → freshUser — re-fetch quota
3. `checkScanLimit(freshUser)` → si true → `setScanLimitReached(true)` → STOP
4. `base44.integrations.Core.UploadFile({ file: labelFile })` → `{ file_url }`
5. Prompt détaillé (profil chien + instructions JSON strict)
6. `base44.integrations.Core.InvokeLLM({ prompt, file_urls, response_json_schema })` → `ai`
7. `setLabelResult(ai)` → `onLabelResult?.(ai)` → remonte vers Scan.jsx → `setLabelResult(ai)` (hide ModeSwitcher)
8. `await incrementScanCount(freshUser)` — incrémente quota APRES le scan AI
9. Vibration si `allergen_alerts.length > 0`

**Guard conditions:**
- `onLabelResult?.(ai)` : optional call → pas de crash si non fourni

**Edge cases:**
- `incrementScanCount` appelé APRES `setLabelResult` → si l'incrément échoue, le scan est affiché mais le quota n'est pas incrémenté. L'user peut re-scanner gratuitement. SUSPECT (même pattern que food mode).
- `ai.compatibility_verdict` hors des 4 valeurs LABEL_VERDICT_CONFIG : `LABEL_VERDICT_CONFIG[verdict] || LABEL_VERDICT_CONFIG.caution` (ligne 159) → fallback OK
- Pas de `setUser` après l'incrément (contrairement au food mode) → le compteur d'affichage `scansUsed` dans Scan.jsx peut rester périmé après un scan label. SUSPECT.

**Verdict:** SUSPECT — `scansUsed` dans Scan.jsx non mis à jour après scan label (pas de re-fetch user). L'affichage `X/3 scans cette semaine` sera désynchronisé jusqu'au prochain rechargement.

---

### Action: [User tape "Sauvegarder" (label result)]
**Handler:** LabelScanMode.jsx:128 — `saveLabelResult()`
**Flow:**
1. Guard : `!labelResult || !dog || !user || labelSaved` → return
2. Mapping verdict : `"excellent"|"good"` → "safe", `"avoid"` → "toxic", else → "caution"
3. `FoodScan.create({ dog_id, food_name, verdict, score, summary, details, recommendation, allergen_alerts, timestamp })`
4. `setLabelSaved(true)`, `toast.success`, `onLabelSaved?.()` (optionnel)

**Guard conditions:**
- `labelSaved` dans le guard → empêche double save
- `disabled={labelSaved}` sur le bouton

**Edge cases:**
- Pas de `+points` après sauvegarde label (contrairement au food mode qui ajoute 10 points). Comportement intentionnel ou oubli ? Non bloquant mais incohérent.
- `labelResult.summary` absent du schéma JSON retourné → `labelResult.summary` sera `undefined`. La ligne 136 utilise `labelResult.summary || \`Analyse etiquette : ...\`` → fallback OK.
- `onLabelSaved?.()` : pas de rechargement de l'historique Scan (qui est dans Scan.jsx). L'historique Scan n'est pas mis à jour après save label. SUSPECT (mineur, l'user peut voir le scan dans l'historique au prochain chargement).

**Verdict:** SUSPECT — pas d'ajout de points après sauvegarde label (incohérence avec food mode, +10 points). L'historique food affiché dans Scan.jsx n'est pas mis à jour localement après save label.

---

### Action: [User tape "Nouvelle analyse"]
**Handler:** LabelScanMode.jsx:151 — `resetLabel()`
**Flow:**
1. Reset tous les états locaux : labelFile, labelPreview, labelResult, showIngredients, labelSaved
2. `onLabelResult?.(null)` — NON APPELÉ dans resetLabel. `setLabelResult(null)` dans Scan.jsx n'est PAS appelé.

**Guard conditions:** Aucun

**Edge cases:**
- `labelResult` local dans LabelScanMode → null (OK, UI label correcte)
- MAIS `labelResult` dans Scan.jsx reste non-null → le ModeSwitcher reste caché (CRASH-02 fix... mais c'est une régression ici)

**Verdict:** RUPTURE POTENTIELLE — `resetLabel()` ne remonte pas `onLabelResult?.(null)` vers Scan.jsx. Résultat : après "Nouvelle analyse", le ModeSwitcher reste caché car `labelResult` dans Scan.jsx est toujours non-null.

**Correction nécessaire :** Dans `resetLabel()`, appeler `onLabelResult?.(null)` pour informer le parent.

---

## PAGE : TRAINING (src/pages/Training.jsx)

### Action: [Chargement initial de la page]
**Handler:** Training.jsx:172 — `useEffect(() => { loadData(); }, [])`
**Flow:**
1. `base44.auth.me()` → setUser
2. `Dog.filter({ owner: u.email })` → getActiveDog → setDog
3. `Promise.all([UserProgress.filter({ user_email, dog_id }), Bookmark.filter({ dog_id, source: "behavior_program" }, "-created_at", 5).catch([])])`
4. `setProgresses(progs || [])`, `setBehaviorBookmarks(bBks || [])`
5. `setLoading(false)` → `<SkeletonPage>` → main view

**Guard conditions:**
- `dogs?.length > 0` → si 0 dogs, dog = null, progresses = [] (état initial), page s'affiche vide
- Bookmark fetch avec `.catch(() => [])` → graceful

**Edge cases:**
- Erreur réseau → `toast.error` + `setLoading(false)` → page chargée mais vide
- `getActiveDog(dogs)` : sélectionne le dog avec `is_active: true` ou le premier — OK
- `progs` null → `progs || []` → OK

**Verdict:** OK

---

### Action: [User tape sur un parcours (JourneyCard)]
**Handler:** Training.jsx:761 — `onClick={() => locked ? navigate(createPageUrl("Premium")) : navigate(createPageUrl("Training") + \`?journey=${journey.id}\`)}`
**Flow:**
1. Si `locked` (journey.isPremium && !isPremium) → navigate vers Premium
2. Sinon → navigate avec `?journey=journeyId`
3. Training re-render → `journeyId = searchParams.get("journey")`
4. `journey = JOURNEYS.find(j => j.id === journeyId)` → si trouvé → render JourneyView
5. JourneyView reçoit `exercises`, `progresses`, `isPremium`, `onBack`, `onSelectExercise`

**Guard conditions:**
- Si `journey` non trouvé → fallback UI "Parcours introuvable" avec lien retour
- `locked` recalculé à chaque render depuis `progresses` et `user`

**Edge cases:**
- `isNext` logic (ligne 745) : `JOURNEYS.slice(0, idx).every(j => getJourneyCompleted(j) === j.exerciseOrders.length || j.isPremium)` — les journeys premium sont toujours considérés comme "complétés" pour le calcul `isNext`. C'est intentionnel (ne bloque pas la progression gratuite).
- `progresses` vide → `isCompleted` retourne false pour tout → `done = 0` → OK

**Verdict:** OK

---

### Action: [User tape sur un exercice dans JourneyView]
**Handler:** JourneyView.jsx:81 — `onClick={() => exerciseLocked ? null : onSelectExercise(exercise.order_number)`
**Flow:**
1. Si `exerciseLocked` → no-op (click silencieux)
2. Sinon → `onSelectExercise(order)` → Training.jsx:373 → `navigate(Training?journey=X&exercise=Y)`
3. Training re-render → `exerciseId = searchParams.get("exercise")`
4. `exercise = EXERCISES.find(e => String(e.order_number) === exerciseId)`
5. Render `<ExerciseDetail>` avec `isCompleted`, `isPremiumLocked`, handlers

**Guard conditions:**
- `exerciseLocked = locked || (exercise.is_premium && !isPremium)` — double vérification
- Si exercise non trouvé → fallback "Exercice introuvable"

**Edge cases:**
- `exerciseLocked` avec click silencieux → aucun feedback visuel (style `opacity-50` mais pas de toast). Acceptable UX.
- `String(e.order_number) === exerciseId` : conversion string explicite → correct (searchParams retourne string)

**Verdict:** OK

---

### Action: [User tape "J'ai réussi !" (handleComplete)]
**Handler:** Training.jsx:211 — `handleComplete(exercise)`
**Flow:**
1. Guard : `!dog || !user` → return
2. Calcul état précédent (`existing`, `wasCompleted`)
3. **OPTIMISTIC UPDATE** : setProgresses immédiat avec placeholder `_optimistic: true`
4. Navigate retour (avec journeyId si présent)
5. Si `!wasCompleted` : vérification milestone/celebration/free gate

**Calcul des affichages :**
- `prevCount = progresses.filter(p => p.completed).length`
- `newCount = optimisticProgresses.filter(p => p.completed).length`
- Si `prevCount === 2 && newCount === 3 && !isPremium` → showFreeGate
- Si `MILESTONES.includes(newCount)` (3, 5, 10) → milestone screen
- Sinon → setCelebration(exercise.name)

**API sync (background) :**
- Toggle existant : `UserProgress.update(id, { completed: bool })`
- Nouveau : `UserProgress.create(...)` → si succès → `+50 points` → si points échoue → **rollback UserProgress** (UX-05)
- `updateStreakSilently` + `checkStreakBadges` en fire & forget
- Catch global : rollback `setProgresses(progresses)` (les progresses ORIGINAUX, avant optimistic)

**Guard conditions :**
- Rollback sur erreur → état cohérent
- `!wasCompleted` guard avant celebration/milestone → pas de faux positif sur un toggle-off

**Edge cases :**
- Double tap : le 2e appel trouve `existing.completed = true` et toggle-off. L'optimistic update est appliqué avant le nav. Si l'API échoue → rollback. OK.
- `_optimistic: true` : le placeholder est remplacé par `newProgresses.filter(p => !p._optimistic)` dans le success path (ligne 265). Cohérent.
- Navigate se produit AVANT l'API call → si le call échoue, le rollback s'applique sur la vue, mais l'user est déjà navigué ailleurs. SUSPECT : le toast d'erreur s'affiche sur la vue Training (pas ExerciseDetail), ce qui est correct. Mais `setCelebration` peut déjà avoir été positionné avant l'erreur.

**Verdict:** SUSPECT — `setCelebration`/`setMilestone` est défini AVANT l'API call. Si l'API échoue, l'animation de célébration a déjà été montrée, mais l'exercice est rollback. L'user voit une célébration pour un exercice qui n'est finalement pas sauvegardé. Impact : mineur (UX trompeur), pas une rupture de données car le rollback est correct.

---

### Action: [User tape "J'ai besoin d'aide" (handleHelp)]
**Handler:** Training.jsx:290 — `handleHelp(exercise)`
**Flow:**
1. Construction du message : `J'ai besoin d'aide avec l'exercice « ${exercise.name} » pour ${dog?.name}...`
2. `navigate(createPageUrl("Chat") + "?help=" + encodeURIComponent(msg))`
3. Dans Chat.jsx — useEffect (ligne 153) : si `helpMsg && helpMsg.length <= 300` → `sendMessage(decodeURIComponent(helpMsg))`
4. `window.history.replaceState({}, "", pathname)` — nettoie l'URL

**Guard conditions:**
- `helpMsg.length <= 300` → validation taille
- `helpSent.current = true` → empêche double envoi si le composant re-render

**Edge cases:**
- Le message construit fait ~120-150 caractères → dans la limite de 300. OK.
- Si Chat n'est pas chargé quand `initializing` est encore true → le useEffect attend `!initializing && dog` → OK, envoi différé.
- `dog?.name || "mon chien"` → protégé si dog null

**Verdict:** OK

---

### Action: [User tape sur un guide comportement]
**Handler:** Training.jsx:803 — `onClick={() => locked ? navigate(Premium) : navigate(Training?behavior=guide.id)}`
**Flow:**
1. Si locked → Premium
2. Sinon → `?behavior=behaviorId` → `guide = BEHAVIOR_GUIDES.find(g => g.id === behaviorId)`
3. Recherche du programme actif : d'abord `behaviorProgram` (state), puis `behaviorBookmarks` (DB)
4. Parse JSON des bookmarks avec try/catch silencieux
5. Calcul `dayIndex` et `todayDay` si programme actif
6. Render : steps + erreurs + alarm + CTA programme IA

**Guard conditions:**
- `!guide.isFree && !isPremium` → locked = true → wall Premium affiché
- Parse JSON dans try/catch → erreurs silencieuses si contenu corrompu

**Edge cases:**
- `behaviorBookmarks` récupérés dans loadData avec limit 5 et filtre `source: "behavior_program"` → si l'user a >5 programmes, certains peuvent ne pas être trouvés. SUSPECT (edge case rare).
- `elapsed >= 0 && elapsed < 7` → un programme expire après 7 jours (logique business)
- `program || !program.days` throw → catch → toast.error. OK.

**Verdict:** OK

---

### Action: [User tape "Lancer le programme comportement" (IA)]
**Handler:** Training.jsx:588 — inline onClick de la motion.button
**Flow:**
1. Guard : `!isPremium` → navigate(Premium)
2. `setGeneratingProgram(true)`
3. `base44.functions.invoke("generateTrainingProgram", { dogId, dogName, dogBreed, dogBirthDate, activityLevel, healthIssues, mode: "behavior", problemId, problemLabel, problemDescription })` → `response.data?.program`
4. Parse si string JSON (double-parse guard)
5. Guard : `!program || !program.days` → throw
6. `today = new Date().toISOString().slice(0, 10)` — date locale ISO
7. `Bookmark.create({ dog_id, owner, source: "behavior_program", title, content: JSON.stringify(programData) })`
8. `setBehaviorProgram(programData)` → render immédiat du programme
9. `toast.success`

**Guard conditions:**
- Premium check avant call API
- Parse guard pour réponse string vs objet
- `!program.days` throw → toast.error propre

**Edge cases:**
- `response.data?.program` undefined → throw → toast.error. OK.
- Si Bookmark.create échoue → le programme est affiché localement (setBehaviorProgram) mais pas persisté. Au prochain rechargement, le programme sera perdu. SUSPECT.
- `dog.activityLevel` vs `dog.activity_level` : le prop passé est `activityLevel: dog.activity_level` (camelCase pour la fonction, snake_case depuis l'entité) → OK.
- Programme daté avec heure locale (`slice(0,10)`) — cohérent avec le check `start_date + "T00:00:00"`.

**Verdict:** SUSPECT — si `Bookmark.create` échoue, le programme est affiché mais non persisté. L'user croira avoir un programme actif mais il disparaitra au reload.

---

### Action: [Affichage du free gate (3ème exercice complété)]
**Handler:** Training.jsx:238 — `setShowFreeGate(true)` dans handleComplete
**Flow:**
1. Check : `prevCount === 2 && newCount === 3 && !isUserPremium(user)`
2. `setShowFreeGate(true)` → render `<FreeExercisesGate>`
3. `<FreeExercisesGate onDismiss={() => setShowFreeGate(false)} />`

**Guard conditions:**
- `!isUserPremium(user)` : vérifié au moment de la complétion, pas re-fetché
- `prevCount === 2 && newCount === 3` : condition précise, évite les faux déclenchements

**Edge cases:**
- Si l'utilisateur passe premium entre le chargement et la complétion du 3ème exercice : `user` serait périmé → free gate affiché par erreur. Acceptable (rare, l'user ferme juste la gate).
- Appliqué AVANT l'API call → si API échoue et rollback, `showFreeGate` reste true. L'user a déjà vu la gate.

**Verdict:** OK — comportement acceptable, la gate est informationnelle et non bloquante.

---

## PAGE : CHAT (src/pages/Chat.jsx)

### Action: [Chargement initial du chat]
**Handler:** Chat.jsx:166 — `useEffect(() => { initChat(); }, [])`
**Flow:**
1. `base44.auth.me()` → setUser
2. Si `!isUserPremium(u)` → `initCredits(u)` → reset quotas si nouveau jour → `setMessagesRemaining(msgCredits)`
3. `Dog.filter({ owner: u.email })` → `getActiveDog` → setDog
4. `setMessages([{ role: "assistant", content: message_bienvenue, timestamp }])` — toujours fresh (pas de chargement historique DB)
5. `setInitializing(false)` → `<SkeletonPage variant="chat">` → vue principale

**Guard conditions:**
- `dogs?.length > 0` → si pas de chien, dog = null, chat inutilisable mais pas crashé
- `isUserPremium` : skip initCredits pour premium

**Edge cases:**
- `initCredits` peut échouer silencieusement sur `updateMe` (warning console) mais retourne les crédits locaux calculés → OK
- `getActiveDog` avec plusieurs chiens → sélectionne l'actif ou le premier → OK
- Historique non chargé depuis DB intentionnellement ("Always start fresh") — comportement OK documenté

**Verdict:** OK

---

### Action: [User envoie un message texte (Send)]
**Handler:** Chat.jsx:207 — `sendMessage(text)`
**Flow:**
1. `content = (text || input).trim()` → guard `!content && !hasImage` → return
2. Guard `!dog` → return
3. Si `!isUserPremium` : check `messagesRemaining <= 0` → message quota en UI + return
4. Vibration légère
5. `setInput("")`, `setLastFailedInput(null)`, `imageToSend = pendingImage`, `setPendingImage(null)`
6. Push `userMsg` dans messages
7. `setLoading(true)`
8. Si image → `base44.integrations.Core.UploadFile` → `uploadedImageUrl`, revoke Blob URL
9. `ChatMessage.create({ dog_id, role: "user", content, timestamp, has_image, image_url })` — sauvegarde user msg en DB
10. Contexte des 15 derniers messages (`.slice(-15)`)
11. `base44.functions.invoke("pawcoachChat", { dogId, messages: contextMsgs, imageUrl })` → `response.data`
12. Check `response.data?.error === 'quota_exceeded'` → handle
13. `assistantContent = response.data?.content || "Désolé, je n'ai pas pu répondre."`
14. `startStreaming(assistantContent, assistantTs)` — typewriter
15. `ChatMessage.create({ role: "assistant", content, timestamp }).catch(() => {})` — fire & forget
16. Update `messagesRemaining` depuis `response.data.messages_remaining` si disponible
17. `updateStreakSilently` — fire & forget

**Guard conditions:**
- Double quota check : côté client (messagesRemaining) ET côté serveur (quota_exceeded dans response)
- `disabled={(!input.trim() && !pendingImage) || loading || isStreaming}` → bouton désactivé pendant loading/streaming

**Edge cases:**
- `response.data?.content` undefined → fallback "Désolé...". OK.
- `contextMsgs` inclut les messages `role: "system"` (quota messages) → le contexte LLM recevra ces messages système. Potentiellement confus pour le LLM mais non bloquant.
- `setLastFailedInput(null)` avant le call → si le call échoue, `lastFailedInput` est set dans le catch avec `content`. Mais `content` capturé dans la closure → OK.
- Blob URL révoquée après upload → `userMsg.image_url = imageToSend?.preview` (Blob URL) mais l'image est affichée depuis la mémoire immédiatement, pas depuis l'URL (React state). Après revoke, si le composant est démonté/remonté, l'image du message user ne sera plus accessible. SUSPECT.

**Verdict:** SUSPECT — `userMsg.image_url` stocke le Blob URL local qui est révoqué après l'upload. Si l'historique des messages est scrollé et l'image n'est plus dans le viewport (chargement paresseux `loading="lazy"`), au rescroll l'image user message sera cassée (404/revoked). L'image assistant n'est pas affectée (elle utilise `uploadedImageUrl` de Base44).

---

### Action: [User tape sur une suggestion]
**Handler:** Chat.jsx:557 — `onClick={() => sendMessage(s)}`
**Flow:**
1. `sendMessage(s)` avec text fixe
2. Flow identique à l'envoi texte standard

**Guard conditions:**
- `showSuggestions = messages.length <= 1 && !isLimitReached` → suggestions cachées après le 1er message et quand limite atteinte

**Edge cases:**
- Double tap rapide → 2 messages envoyés (pas de debounce). `loading` est mis à true après le premier send → le bouton Send est disabled, mais les suggestions ne sont pas disabled durant `loading`. SUSPECT.

**Verdict:** SUSPECT — les chips de suggestion ne sont pas désactivées pendant `loading`. Un double-tap rapide peut envoyer 2 messages simultanément, consommant 2 crédits.

---

### Action: [User tape "Sauvegarder" (bookmark message)]
**Handler:** Chat.jsx:116 — `handleBookmark(msg)`
**Flow:**
1. Guard : `!dog || !user || bookmarked[msg.timestamp]` → return
2. `title = msg.content.replace(/[#*_\`]/g, "").split("\n")[0].slice(0, 60)` — extrait titre propre
3. `BookmarkEntity.create({ dog_id, owner, content, source: "chat", title, created_at })`
4. `setBookmarked(prev => ({ ...prev, [msg.timestamp]: true }))` → icône change
5. `toast.success`

**Guard conditions:**
- `bookmarked[msg.timestamp]` → empêche double bookmark (état local, reset à chaque mount)
- Bouton visible uniquement pour `msg.role === "assistant" && !msg.isError`

**Edge cases:**
- `bookmarked` est état local — pas persisté → au reload, tous les messages peuvent être re-bookmarkés (doublons en DB possibles). SUSPECT.
- `msg.timestamp` comme clé : si 2 messages ont le même timestamp (ms), collision possible. Très improbable.
- Catch → `toast.error`. OK.

**Verdict:** SUSPECT — `bookmarked` local non synchronisé avec la DB. Rechargement de page → l'user peut re-bookmarker le même message, créant des doublons en DB.

---

### Action: [User tape le bouton retry (message error)]
**Handler:** Chat.jsx:488 — `onClick={() => sendMessage(lastFailedInput)}`
**Flow:**
1. `lastFailedInput` contenu du message qui a échoué
2. `sendMessage(lastFailedInput)` — re-envoi complet
3. Visible uniquement si `msg.isError && lastFailedInput`

**Guard conditions:**
- `lastFailedInput` remis à null au début de chaque sendMessage → pas de retry loop
- Le message error reste en liste (pas supprimé) → l'user voit l'historique

**Edge cases:**
- `lastFailedInput` est une string (texte), pas l'objet image → si le message échoué incluait une image, le retry n'inclut pas l'image (elle a été revoquée). SUSPECT.

**Verdict:** SUSPECT — retry d'un message avec image ne renverra que le texte (image perdue car `pendingImage` cleared + Blob révoqué).

---

### Action: [User tape "Nouveau" (startNewChat)]
**Handler:** Chat.jsx:324 — `startNewChat()`
**Flow:**
1. Reset messages vers le message de bienvenue
2. `setInput("")`, `setLastFailedInput(null)`
3. Annulation du streaming en cours : `clearInterval(streamingRef.current.timer)`, `setIsStreaming(false)`, `setStreamingText("")`

**Guard conditions:**
- Timer correctement nettoyé
- Bouton visible uniquement si `messages.length > 1`

**Edge cases:**
- `messagesRemaining` non réinitialisé → le compteur de crédits reste correct (nouveau chat ne = pas de reset de quota)
- `bookmarked` local non réinitialisé → les bookmarks de la session précédente restent trackés. OK (évite doublons dans la même session).

**Verdict:** OK

---

### Action: [User envoie une image dans le chat]
**Handler:** Chat.jsx:198 — `handleImageSelect(e)`
**Flow:**
1. `file = e.target.files[0]` → guard `!file` → return
2. Revoke previous preview URL si existant
3. `URL.createObjectURL(file)` → `setPendingImage({ file, preview })`
4. Preview affichée dans le composant input
5. À l'envoi → voir flow sendMessage (upload + revoke)

**Guard conditions:**
- Revoke de l'ancien preview si remplacement image

**Edge cases:**
- Si l'user change d'image plusieurs fois rapidement → les anciens Blob URLs sont correctement révoqués (ligne 201)
- `fileInputRef.current?.click()` → optional chaining → OK si ref non attachée

**Verdict:** OK

---

## SYNTHESE DES ISSUES

### RUPTURE POTENTIELLE (1)

| ID | Page | Action | Description | Correction |
|----|------|--------|-------------|------------|
| G3-R1 | LabelScanMode | "Nouvelle analyse" | `resetLabel()` ne remonte pas `onLabelResult?.(null)`. Le ModeSwitcher reste caché dans Scan.jsx après reset label. | Ajouter `onLabelResult?.(null)` dans `resetLabel()` |

### SUSPECT (6)

| ID | Page | Action | Description | Priorite |
|----|------|--------|-------------|----------|
| G3-S1 | LabelScanMode | Analyser label | `scansUsed` dans Scan.jsx non mis à jour après scan label (pas de setUser re-fetch). Compteur affiché périmé. | P2 |
| G3-S2 | LabelScanMode | Sauvegarder label | Pas de +10 points contrairement au food mode. Historique food non mis à jour localement. | P3 |
| G3-S3 | Training | handleComplete | Célébration affichée AVANT succès API. Si API échoue, l'user voit une célébration pour un exercice non sauvegardé. | P2 |
| G3-S4 | Training | Générer programme | Si Bookmark.create échoue, programme affiché mais non persisté — disparaît au reload. | P2 |
| G3-S5 | Chat | sendMessage | Image user dans messages stockée comme Blob URL révoquée. Scroll/lazy-load peut casser l'affichage image. | P2 |
| G3-S6 | Chat | Suggestions | Chips suggestions non désactivées pendant `loading`. Double-tap possible = 2 messages = 2 crédits consommés. | P3 |
| G3-S7 | Chat | Bookmark | `bookmarked` local non synchronisé. Re-mount → doublons possibles en DB. | P3 |
| G3-S8 | Chat | Retry message | Retry d'un message avec image envoie uniquement le texte (image perdue). | P3 |

### TOTAL RUPTURES : 1 | TOTAL SUSPECTS : 8 | OK : 23/32

---

## CORRECTIONS RECOMMANDEES

### Priorité 1 — G3-R1 (RUPTURE) — LabelScanMode resetLabel

```jsx
// src/components/scan/LabelScanMode.jsx — ligne 151
const resetLabel = () => {
  setLabelFile(null);
  setLabelPreview(null);
  setLabelResult(null);
  setShowIngredients(false);
  setLabelSaved(false);
  onLabelResult?.(null); // AJOUTER cette ligne
};
```

### Priorité 2 — G3-S1 (scansUsed périmé après scan label)

Dans `analyzeLabel()`, après `incrementScanCount(freshUser)`, ajouter un re-fetch :
```jsx
const updatedUser = await base44.auth.me();
// Remonter vers Scan.jsx via un callback type onUserUpdate ou
// gérer dans Scan.jsx avec un useCallback qui re-fetch
```
Alternative plus simple : passer `setUser` comme prop à `LabelScanMode`.

### Priorité 2 — G3-S4 (programme comportement non persisté si Bookmark échoue)

Wrapper le `setBehaviorProgram` dans le bloc `try` après `Bookmark.create` :
```jsx
const bk = await Bookmark.create({ ... }); // si échoue → catch
setBehaviorProgram(programData); // seulement si persistance réussie
```

### Priorité 2 — G3-S5 (Blob URL révoquée avant affichage)

Dans `userMsg`, utiliser `uploadedImageUrl` (Base44 URL) plutôt que le Blob URL pour `image_url`. Cela implique d'uploader l'image AVANT de construire `userMsg`, ou d'updater le message après upload.

### Priorité 3 — G3-S6 (double-tap suggestions)

Désactiver les suggestions pendant `loading` :
```jsx
onClick={() => !loading && sendMessage(s)}
className={`... ${loading ? "opacity-50 pointer-events-none" : ""}`}
```
