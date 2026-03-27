# SFA-SANTE — Static Flow Analysis : Domaine Santé

**Date** : 27 mars 2026
**Périmètre** : Sante.jsx + sante/ + notebook/ + vet/ + Dashboard.jsx (poids)
**Priorité #1** : Flow poids complet (bug signalé : alerte rouge persistante après nouvelle pesée)

---

## 1. ARCHITECTURE DE Sante.jsx

### État global chargé au mount

```
Sante.jsx (loadData)
  ├── Dog.filter({ owner }) → dog (via getActiveDog)
  ├── HealthRecord.filter({ dog_id }, "-date", 200) → records[]
  ├── DailyLog.filter({ dog_id }) → dailyLogs[]
  └── GrowthEntry.filter({ dog_id }) → growthEntries[]
```

**État partagé** : `records`, `dailyLogs`, `growthEntries` sont passés en props aux enfants.
`setRecords` est passé à `NotebookContent` pour permettre les mises à jour optimistes.

### Tabs et contenu

| Tab | Composant | Données reçues |
|-----|-----------|----------------|
| `carnet` | NotebookContent | dog, records, setRecords, dailyLogs, growthEntries |
| `malade` | DiagnosisContent | dog seulement |
| `import` | HealthImportContent | dog, onImported callback |
| `growth` | GrowthTrackerContent | dog, user, healthRecords=records, dailyLogs, onGrowthAdded |
| `findvet` | FindVetContent (lazy) | dog, user |

**RUPTURE** : GrowthTrackerContent reçoit `healthRecords` (snapshot de `records` au moment du render) mais maintient son propre `entries` state chargé indépendamment depuis `GrowthEntry.filter`. Les deux états ne sont pas synchronisés en temps réel.

---

## 2. FLOWS POIDS — ANALYSE COMPLÈTE

### 2A. Entry Point : SectionPoids.jsx → handleSaveWeight

**Chemin** : `NotebookContent > tab "weight" > SectionPoids`

```
User clique "Ajouter un poids"
  → showAddForm = true
  → User saisit poids + date, clique "Enregistrer"
  → handleSaveWeight()
    → HealthRecord.create({ dog_id, type:"weight", title:"Pesée", date, value:w })
    → Dog.update(dogId, { weight: w })   [sync Dog.weight — fire and forget, try/catch]
    → onRecordAdded(record)
      → NotebookContent: setRecords(prev => [...prev, rec])
        → Sante.jsx: records state mis à jour (setRecords passé depuis parent)
    → toast.success
    → showAddForm = false
```

**État après save** :
- `records` dans Sante.jsx : ✅ mis à jour optimistement (nouveau record ajouté)
- `Dog.weight` dans DB : ✅ mis à jour
- `dog` state local dans Sante.jsx : **⚠️ PAS mis à jour** — dog object reste avec l'ancien weight
- Re-render NotebookContent : ✅ (records change → allRecords recalculé → summary recalculé → WeightCard reçoit nouveau weightTrend)

**RUPTURE IDENTIFIÉE #1** : `dog.weight` dans le state local de Sante.jsx n'est pas mis à jour après Dog.update. Cela affecte :
- Dashboard "Poids réf." card (affiche l'ancien dog.weight)
- SmartAlerts : calcul `drift = latest - dog.weight` utilise l'**ancien** dog.weight comme référence

### 2B. Entry Point : WeightCard.jsx → InlineWeightForm → handleSave

**Chemin** : `NotebookContent > WeightCard > InlineWeightForm`

```
User clique "Nouvelle pesée" dans WeightCard
  → showForm = true
  → User saisit poids + date, clique "C'est noté !"
  → handleSave()
    → HealthRecord.create({ dog_id, type:"weight", title:"Pesée", date, value:w })
    → Dog.update(dogId, { weight: w })
    → onRecordAdded(record)
      → NotebookContent: setRecords(prev => [...prev, rec])
        → Sante.jsx records mis à jour
    → toast.success
    → onClose() → showForm = false
```

**Résultat** : identique à SectionPoids. Le record est ajouté, NotebookContent se re-render, WeightCard reçoit un nouveau `summary.weightTrend` calculé depuis les records mis à jour.

**QUESTION CRITIQUE** : `summary.weightTrend` est calculé via `computeNotebookSummary(allRecords, dog, ...)`. `allRecords` inclut les HealthRecords + DailyLogs + GrowthEntries fusionnés. Après le nouveau record, `allRecords` contient le nouveau poids → `computeWeightTrend` devrait retourner la bonne valeur.

**MAIS** : `computeWeightTrend` prend comme `current` le record le plus récent par date. Si le nouveau record a une **date antérieure** à un record existant, il ne sera PAS le `current`. WeightCard afficherait toujours l'ancien poids le plus récent.

### 2C. Entry Point : GrowthTrackerContent.jsx → saveManual

**Chemin** : `Sante.jsx > tab "growth" > GrowthTrackerContent`

```
User clique "Mesure manuelle"
  → showAddManual = true
  → User saisit poids, date, taille (optionnel)
  → saveManual()
    → GrowthEntry.create({ dog_id, owner_email, date, weight_kg, height_cm, source:"manual" })
    → Dog.update(dog.id, { weight: parsedWeight })
    → onGrowthAdded(entry)
      → Sante.jsx: setGrowthEntries(prev => [...prev, entry])
    → loadEntries()  [re-fetch GrowthEntry depuis DB]
```

**État après save** :
- `GrowthEntry` DB : ✅ créé
- `Dog.weight` DB : ✅ mis à jour
- `growthEntries` dans Sante.jsx : ✅ mis à jour (via onGrowthAdded)
- `records` (HealthRecord) dans Sante.jsx : **NON modifié** — GrowthEntry est une entité séparée
- `entries` state local dans GrowthTrackerContent : ✅ rechargé via loadEntries()

**RUPTURE IDENTIFIÉE #2** : Sauvegarder dans GrowthTrackerContent (tab "growth") ne met PAS à jour `records` dans Sante.jsx. Quand l'utilisateur revient sur l'onglet "carnet", le WeightCard (qui utilise `summary.weightTrend` calculé depuis `allRecords` + `growthEntries`) **devrait** voir le nouveau poids via `growthEntries` mis à jour. Mais `computeWeightTrend` dans `computeNotebookSummary` n'utilise que les HealthRecords-like (via `allRecords`), pas les GrowthEntries directement.

**Analyse fine** :
```javascript
// NotebookContent.jsx ligne 190-193
const summary = useMemo(
  () => computeNotebookSummary(allRecords, dog, [...(growthEntries || []), ...(dailyLogs || [])]),
  [allRecords, dog, growthEntries, dailyLogs]
);
```

`computeNotebookSummary` appelle `computeHealthScore(recs, dog, extraWeightSources)` avec `growthEntries` en extraWeightSources — ces sources sont utilisées pour le **score** mais pas directement pour `computeWeightTrend` dans le summary.

**RUPTURE IDENTIFIÉE #3** : Dans `computeNotebookSummary` (healthStatus.js ligne 642-655), `weightTrend` est calculé via `computeWeightTrend(recs)` où `recs = allRecords` — **sans** les growthEntries/dailyLogs. Le WeightCard affiche donc uniquement les HealthRecords pour la tendance, pas les GrowthEntries.

```javascript
// healthStatus.js ligne 642-655
export function computeNotebookSummary(records, dog, growthEntries = []) {
  const recs = records || [];
  const score = computeHealthScore(recs, dog, growthEntries); // growthEntries utilisées ici
  return {
    // ...
    weightTrend: computeWeightTrend(recs),  // ⚠️ growthEntries IGNORÉES ici
  };
}
```

### 2D. Entry Point : GrowthTrackerContent.jsx → saveAnalysis (Photo IA)

Identique à saveManual, mais source="photo_ai" et inclut body_condition_score.
Mêmes ruptures #2 et #3 s'appliquent.

### 2E. Entry Point : SmartHealthAssistant.jsx → saveAllRecords

```
User termine la conversation, clique "Sauver"
  → saveAllRecords()
    → HealthRecord.filter({ dog_id }) // re-fetch pour dédupliquer vaccins
    → Pour chaque pendingRecord :
      → HealthRecord.create({ dog_id, ...rec })
      → Si type === "weight" : Dog.update(dogId, { weight: rec.value }) [fire and forget]
      → onRecordAdded(created)  [callback vers Sante.jsx ou HealthAssistantSheet]
```

**RUPTURE IDENTIFIÉE #4** : `saveAllRecords` gère les poids de façon séquentielle (loop for). Si plusieurs poids sont créés, `Dog.update` est appelé plusieurs fois sans attendre — le dernier appel "gagne" mais l'ordre n'est pas garanti (race condition potentielle). De plus, `Dog.update` est appelé avec `toCreate[i].value` (la valeur avant création) et non la valeur confirmée par le serveur.

**RUPTURE IDENTIFIÉE #5** : `onRecordAdded` dans l'assistant sheet est connecté à `handleAddFromSheet` dans Sante.jsx, qui fait `setRecords(prev => [...prev, record])`. Ça update records ✅. Mais si l'assistant est ouvert via HealthAssistantSheet (bottom sheet), le dogId vient de `dog?.id` dans Sante.jsx — OK si dog est chargé.

### 2F. Entry Point : HealthImportContent.jsx → handleImport

```
User sélectionne des records, clique "Importer"
  → handleImport()
    → Pour chaque record sélectionné :
      → HealthRecord.create({ dog_id, type, title, date, ... })
      → Si type === "weight" : Dog.update(dog.id, { weight: record.value })
    → onImported(created) [tableau de records créés]
      → Sante.jsx: setRecords(prev => [...prev, ...newRecs])
```

**RUPTURE IDENTIFIÉE #6** : Si plusieurs poids sont importés, `Dog.update` est appelé une fois par poids, séquentiellement dans le for-loop. La dernière valeur gagne mais l'ordre de création dans le for-loop ne correspond pas forcément à l'ordre chronologique des dates — `Dog.weight` pourrait finir avec une valeur arbitraire (pas la plus récente).

---

## 3. FLOW DE DISPLAY DU POIDS

### 3A. WeightCard (dans NotebookContent)

```
Sante.jsx records + growthEntries + dailyLogs
  → NotebookContent.allRecords (useMemo)
    [HealthRecords + DailyLog weights (gap-fill) + GrowthEntry weights (gap-fill)]
  → computeNotebookSummary(allRecords, dog, [growthEntries, dailyLogs])
    → computeWeightTrend(allRecords)  ← HealthRecords + DailyLog + GrowthEntry pseudo-records
  → summary.weightTrend → WeightCard prop
```

**Ce que WeightCard affiche** :
- `weightTrend.current` : valeur du record le plus récent par date
- `weightTrend.changeKg` : différence entre current et le record ~30 jours avant
- `weightTrend.direction` : "stable" | "up" | "down" | "unknown"
- `isAlert` : `Math.abs(changePct) > 5`

**Source du "lost 3 kg" alert** : `isAlert = true` + `direction = "down"` → le message affiché est :
`"Attention : ${changeKg} kg (${changePct}%) en ${period} jours"`

### 3B. Dashboard — "Dernier poids" StatCard

```
Dashboard.jsx (mount fetch indépendant)
  → HealthRecord.filter + DailyLog.filter → records, dailyLogs
  → useMemo → allWeightPoints = [HealthRecord weights] + [DailyLog weights]
  → weightByDate (deduplication par date, garde le premier trouvé)
  → weightData = 10 dernières mesures triées par date
  → lastWeightRaw = weightData[last].poids
  → StatCard affiche lastWeightRaw
  → sub: dog?.weight ? `Référence : ${dog.weight} kg` : undefined
```

**RUPTURE IDENTIFIÉE #7** : Dashboard fait son **propre fetch** au mount. Il ne partage pas l'état de Sante.jsx. Quand l'utilisateur ajoute un poids dans Sante puis navigue vers Dashboard, Dashboard **refetch** — il verra la nouvelle valeur. Mais si Dashboard est déjà monté (React Router garde les composants en mémoire selon la config), il ne refetch pas. Dashboard n'a pas de cache invalidation explicite.

**Confirmation** : Dashboard utilise `GrowthEntry` en plus (`growthData`) mais uniquement pour le `computeHealthScore`. Il n'intègre PAS les GrowthEntries dans `allWeightPoints` pour le graphique. Seuls HealthRecord + DailyLog.

### 3C. SmartAlerts — Alert "weight_drift" (LE BUG SIGNALÉ)

```javascript
// SmartAlerts.jsx lignes 196-217
const allWeights = [
  ...records.filter(r => r.type === "weight" && r.value).map(r => ({ date: r.date, v: r.value })),
  ...dailyLogs.filter(l => l.weight_kg).map(l => ({ date: l.date, v: l.weight_kg })),
].sort((a, b) => a.date > b.date ? 1 : -1);

if (allWeights.length >= 2 && dog?.weight) {
  const latest = allWeights[allWeights.length - 1].v;
  const drift = latest - dog.weight;   // ← dog.weight = RÉFÉRENCE (poids du profil)
  const pct = Math.abs(drift / dog.weight) * 100;
  if (pct >= 10) { /* alerte weight_drift */ }
}
```

**LOGIQUE DE L'ALERTE** :
- `latest` = dernière valeur de poids dans HealthRecord ou DailyLog (triée par date ASC)
- `dog.weight` = champ `weight` du profil Dog (mis à jour par Dog.update à chaque pesée)
- `drift = latest - dog.weight` = écart entre dernière pesée enregistrée ET poids de référence du profil

**HYPOTHÈSE BUG** : Quand l'utilisateur ajoute un nouveau poids et que Dog.update réussit, `dog.weight` est mis à jour dans la DB. MAIS dans Dashboard.jsx, l'objet `dog` est **chargé au mount** et n'est pas réactualisé. Si `dog.weight` n'est pas mis à jour dans le state local de Dashboard, l'alerte compare :
- `latest` = nouvelle pesée (ex: 18 kg)
- `dog.weight` = ancienne valeur en state (ex: 21 kg, l'**ancienne** valeur)
- `drift = 18 - 21 = -3 kg` → pct = 14.3% >= 10% → **alerte rouge persistante**

**CAUSE RACINE DU BUG** : `dog.weight` dans Dashboard.jsx state n'est **jamais mis à jour** après qu'un poids soit enregistré ailleurs dans l'app. Dog.update dans la DB est bien fait, mais Dashboard charge `dog` une seule fois au mount et ne rafraîchit pas l'objet dog. L'alerte "weight_drift" compare `latest` (correcte) contre `dog.weight` (obsolète).

**SCÉNARIO EXACT** :
1. Dog créé avec weight=21 kg
2. Utilisateur pèse son chien : 18 kg → HealthRecord.create + Dog.update(18)
3. Dashboard chargé : Dog.filter → dog.weight=18 ✅ (si rechargé après)
4. Mais si Dashboard était déjà en cache depuis avant la pesée → dog.weight=21 en state
5. SmartAlerts calcule : drift = 18 - 21 = -3 kg → alerte rouge

**SCÉNARIO ALTERNATIF** : L'alerte reste même si dog.weight est correct, car le seuil est 10%. Si le chien a vraiment un écart ≥10% entre sa dernière pesée et son poids de profil, l'alerte est légitime. Le problème serait alors que Dog.update n'a pas réussi à mettre à jour dog.weight en DB.

### 3D. DogRadarHero (Home) — Score Santé

```
DogRadarHero reçoit records + dailyLogs + dog (passé depuis Home.jsx)
  → computeArcs → computeHealthScore(records, dog, dailyLogs)
  → healthStatus.computeHealthScore inclut le poids dans son calcul (weightScore)
```

Pas d'affichage direct du poids — le poids influence le score. `dog.weight` non affiché directement.

### 3E. CoachHomeHeader (Home)

```javascript
// CoachHomeHeader.jsx ligne 74
{dog.weight} kg
```

Affiche `dog.weight` directement depuis le prop `dog`. Pas de recalcul. Si dog.weight est stale → valeur obsolète affichée.

---

## 4. HEALTH RECORDS — FLOWS GÉNÉRAUX

### 4A. Ajouter un record (vaccine, vet_visit, medication, note)

**Via SectionVaccins** :
```
SectionVaccins → HealthRecord.create → onRecordAdded
  → NotebookContent: setRecords(prev => [...prev, rec])
  → Sante.jsx records mis à jour
  → computeNotebookSummary se recalcule → vaccineMap mis à jour → VaccineCard re-render
```
✅ Chain complète, pas de rupture.

**Via VaccineCard.jsx** (ajout direct depuis la carte WSAVA) :
```
VaccineCard → HealthRecord.create → onRecordAdded
  → NotebookContent: setRecords(prev => [...prev, rec])
  → vaccineMap recalculé → VaccineCard montre le nouveau statut
```
✅ Chain complète.

**Via PremiumSection (vet_visit, medication, note)** :
```
PremiumSection → HealthRecord.create → onRecordAdded
  → NotebookContent: setRecords → records mis à jour
```
✅ Chain complète.

### 4B. Supprimer un record

```
NotebookContent.handleDelete(id)
  → HealthRecord.delete(id)
  → setRecords(prev => prev.filter(r => r.id !== id))  [optimiste]
  → Si erreur : rollback vers previousRecords
```

**RUPTURE IDENTIFIÉE #8** : handleDelete ignore les pseudo-records DailyLog (`id.startsWith("dl-")`) — ils ne peuvent pas être supprimés depuis le notebook. C'est un comportement voulu mais non documenté dans l'UI (le bouton delete n'est probablement pas affiché pour ces records).

**Vérification** : Dans SectionPoids, `onDelete` est passé mais les records filtrés incluent `dl-*` pseudo-records. Le bouton delete appelle `onDelete(r.id)` avec `id = "dl-${l.id}"` → handleDelete retourne sans rien faire. **RUPTURE UX** : l'utilisateur voit un bouton delete mais rien ne se passe (pas de feedback).

### 4C. Reminders → Vaccine records

```
UpcomingReminders reçoit records (HealthRecord[])
  → Filtre les records avec next_date dans les 60 prochains jours
  → Affiche les rappels
```

Pas de connexion directe avec les notifications système. Les rappels sont uniquement visuels dans l'app.

---

## 5. SCORE WELLNESS — computeHealthScore

### Inputs

```javascript
computeHealthScore(records, dog, extraWeightSources = [])
  records = HealthRecord[] (+ pseudo-records DailyLog, GrowthEntry via allRecords)
  dog = { birth_date, next_vet_appointment, ... }
  extraWeightSources = GrowthEntry[] + DailyLog[]
```

### Composantes

| Composante | Poids | Critères |
|------------|-------|---------|
| Vaccins core (CHPPi + Lepto) | 40 pts | up_to_date=40, due_soon=60%, overdue/never=0 |
| Poids | 20 pts | Récent+stable=20, récent=14, <90j=10, >90j=5. BCS bonus/malus |
| Visite vétérinaire | 25 pts | <6m=25, <12m=20, <18m=10, >18m=5 |
| Activité (fraîcheur records) | 15 pts | <7j=15, <30j=12, <90j=8, >90j=3 |

**Utilisation dans l'app** :
- `NotebookContent` → `computeNotebookSummary` → HealthScoreCard
- `Dashboard` → `computeHealthScore(records, dog, [...growthEntries, ...dailyLogs])`
- `DogRadarHero` → `computeHealthScore(records, dog, dailyLogs)`

**RUPTURE IDENTIFIÉE #9** : Dashboard appelle `computeHealthScore` avec `[...growthEntries, ...dailyLogs]`. DogRadarHero appelle avec `dailyLogs` **seulement** (pas growthEntries). Les deux calculent un score légèrement différent.

```javascript
// Dashboard.jsx ligne 173
const score = computeHealthScore(records, dog, [...growthEntries, ...dailyLogs]);

// DogRadarHero.jsx computeArcs ligne 20
const health = computeHealthScore(records, dog, dailyLogs);
```

**Effet** : Si des GrowthEntries existent avec des BCS, le score de Dashboard sera potentiellement plus précis que celui de DogRadarHero. Divergence cosmétique mais peut créer de la confusion.

### computeNotebookSummary vs computeHealthScore

```javascript
// computeNotebookSummary — healthStatus.js ligne 642
export function computeNotebookSummary(records, dog, growthEntries = []) {
  const recs = records || [];
  const score = computeHealthScore(recs, dog, growthEntries);
  return {
    score,
    weightTrend: computeWeightTrend(recs),  // ← SANS les extraWeightSources
    ...
  };
}
```

**RUPTURE IDENTIFIÉE #10** : `computeNotebookSummary` calcule le score avec `extraWeightSources` mais calcule `weightTrend` **sans** elles. WeightCard dans le Carnet ne montre que les tendances HealthRecord+DailyLog+GrowthEntry (via allRecords), mais computeWeightTrend dans le summary n'utilise que `recs` (= allRecords qui inclut déjà les pseudo-records DailyLog et GrowthEntry fusionnés). C'est correct en fait — `allRecords` dans NotebookContent contient déjà les DailyLog et GrowthEntry comme pseudo-records. Pas de rupture ici, c'est cohérent.

**Correction de l'analyse #10** : En réalité :
- `allRecords` dans NotebookContent = HealthRecord + DailyLog (pseudo) + GrowthEntry (pseudo)
- `computeNotebookSummary(allRecords, dog, [growthEntries, dailyLogs])` → `recs = allRecords`
- `computeWeightTrend(recs)` reçoit donc les 3 sources → OK ✅

---

## 6. FLOW DIAGNOSTIC IA

### Étapes

```
DiagnosisContent → AIDiagnosisModal (step="form")
  → User décrit symptômes
  → handleStep1()
    → base44.functions.invoke("preDiagnosis", { symptoms, dog context })
    → phase1 = { preliminary_observations, followup_questions }
    → setStep("questions")
    → if(!isPremium) consume()  ← 1 crédit consommé ICI

  → User répond aux questions
  → handleStep2()
    → base44.functions.invoke("finalDiagnosis", { ... + user_answers })
    → diagnosisData = report
    → DiagnosisReport.create({ dog_id, owner_email, symptoms, diagnosis_text, urgency_level, ... })
    → toast.success("Rapport sauvegardé")
    → setStep("report")
```

**Entité écrite** : `DiagnosisReport` (entité séparée de HealthRecord — ne pollue pas le carnet de santé)

**State update** : Aucun callback vers Sante.jsx. Le rapport est sauvegardé en DB mais :
- `records` dans Sante.jsx : **non mis à jour** (DiagnosisReport ≠ HealthRecord)
- `DiagnosisContent` recharge ses propres reports via `DiagnosisReport.filter` au mount

**RUPTURE IDENTIFIÉE #11** : Après un diagnostic, si l'utilisateur passe sur l'onglet "carnet", le nouveau DiagnosisReport n'apparaît pas dans le carnet (c'est voulu — entité séparée). Mais le **score de santé** dans HealthScoreCard ne change pas non plus car il ne lit que les HealthRecords, pas DiagnosisReports. Comportement cohérent.

**PDF Diagnostic** : `generateDiagnosisPDF` — backend function, génère un PDF téléchargeable. Aucune écriture en DB supplémentaire.

---

## 7. RUPTURES CRITIQUES — RÉSUMÉ PRIORISÉ

### CRITIQUE — BUG SIGNALÉ

**R-SANTE-01** : SmartAlerts.weight_drift compare `latest weight` vs `dog.weight` du profil. Si `dog` state dans Dashboard n'est pas rechargé après une nouvelle pesée dans une autre page, l'alerte persiste avec l'ancien `dog.weight` comme référence.

**Fichier** : `src/components/dashboard/SmartAlerts.jsx` lignes 196-217
**Cause** : Dashboard charge `dog` une fois au mount. Aucune invalidation de cache si Dog.update est fait depuis Sante.jsx.
**Fix** : Soit (a) relire Dog après chaque navigation vers Dashboard, soit (b) utiliser `computeWeightTrend` (qui compare les pesées entre elles) à la place de `dog.weight` comme référence, soit (c) s'assurer que Dog.update est systématiquement fait et que Dashboard est refetch au focus.

**R-SANTE-02** : `dog.weight` dans Sante.jsx state n'est **jamais mis à jour** localement après Dog.update. Seule la DB est mise à jour. Si CoachHomeHeader ou d'autres composants lisent `dog.weight` depuis le state Sante, ils voient l'ancienne valeur jusqu'au prochain reload.

**Fichier** : `src/pages/Sante.jsx` — aucun `setDog` après Dog.update dans les handlers
**Fix** : Après `Dog.update(dogId, { weight })`, faire `setDog(prev => ({ ...prev, weight }))` dans les composants qui ont accès au dog state.

### IMPORTANT

**R-SANTE-03** : `computeNotebookSummary` dans `healthStatus.js` passe `recs` (qui inclut les pseudo-records DailyLog/GrowthEntry) à `computeWeightTrend`, mais le paramètre est nommé `records` et `growthEntries` — la documentation interne est trompeuse. En pratique, `allRecords` dans NotebookContent inclut déjà les sources secondaires, donc c'est correct. [Risque de régression si refacto mal comprise]

**R-SANTE-04** : Plusieurs sauvegardes de poids consécutives (ex: import de 3 poids) déclenchent plusieurs `Dog.update` sans ordre garanti. La dernière en termes de résolution réseau gagne — pourrait ne pas être la valeur chronologiquement la plus récente.

**Fichiers** : `src/components/sante/HealthImportContent.jsx` handleImport, `src/components/notebook/SmartHealthAssistant.jsx` saveAllRecords
**Fix** : Trier les poids par date DESC avant import, n'appeler `Dog.update` qu'avec la valeur la plus récente.

**R-SANTE-05** : `computeHealthScore` reçoit des extraWeightSources différentes selon le contexte :
- Dashboard : `[...growthEntries, ...dailyLogs]` (complet)
- DogRadarHero : `[...dailyLogs]` seulement (GrowthEntries absentes)

Score légèrement différent selon la page. [Incohérence cosmétique]

### MINEUR

**R-SANTE-06** : Pseudo-records DailyLog (`id = "dl-${l.id}"`) affichés dans SectionPoids avec un bouton delete. Le delete ne fait rien (handleDelete ignore les `dl-*`). Pas de feedback UI.

**R-SANTE-07** : `GrowthTrackerContent` maintient son propre `entries` state chargé indépendamment. Si un poids est ajouté dans le "carnet" (SectionPoids), GrowthTrackerContent ne le voit pas dans son graphique `unifiedEntries` jusqu'au prochain mount/reload. Les deux se synchronisent via la prop `healthRecords` mais GrowthTrackerContent charge ses propres GrowthEntries indépendamment.

**R-SANTE-08** : `computeWeightTrend` dans `computeStatusPills` et dans `computeNextAction` ne reçoit que `recs` (HealthRecords) — sans les GrowthEntries ou DailyLogs. Les pills "Poids" et l'action "poids à mettre à jour" peuvent être incorrectes si les pesées sont enregistrées uniquement via GrowthTracker.

**Fichier** : `src/utils/healthStatus.js` fonctions `computeStatusPills` et `computeNextAction`
**Effet** : Si l'utilisateur n'enregistre que des GrowthEntries, le pill "Poids" affiche "Non suivi" même si des mesures existent.

---

## 8. FLOW EXACT DU BUG "lost 3 kg alert persiste"

**Scénario le plus probable** :

```
État initial :
  - Dog.weight = 21 kg (dans la DB ET dans le state Dashboard)
  - Un HealthRecord type="weight" date=J-45 value=21 kg existe

Utilisateur ajoute un poids 18 kg dans Sante (WeightCard) :
  - HealthRecord.create { type:"weight", date=today, value=18 } ✅
  - Dog.update(dogId, { weight: 18 }) ✅ (en DB)
  - setRecords(prev => [...prev, newRecord]) ✅ (Sante.jsx state)

Utilisateur navigue vers Dashboard :
  - Dashboard était déjà en mémoire (React Router) OU Dashboard refetch

Cas A : Dashboard refetch au mount :
  - Dog.filter → dog.weight = 18 (mis à jour) ✅
  - allWeights = [{ date:J-45, v:21 }, { date:today, v:18 }]
  - latest = 18, dog.weight = 18
  - drift = 18 - 18 = 0 → pas d'alerte ✅

Cas B : Dashboard ne refetch pas (en mémoire) :
  - dog.weight dans state = 21 (ancienne valeur) ❌
  - allWeights refetched = [{ date:J-45, v:21 }, { date:today, v:18 }] ← HealthRecord correct
  - latest = 18, dog.weight = 21 (stale)
  - drift = 18 - 21 = -3 → pct = 14.3% → ALERTE ROUGE "Variation de poids : -3 kg" ❌

Cas C : Dog.update a échoué (silencieusement) :
  - dog.weight dans DB = 21 toujours
  - Même résultat que Cas B
```

**Probabilité Cas B** : Dashboard est une route React Router. Il est unmount/remount à chaque navigation (React Router v6 sans keepAlive) → normalement il refetch. MAIS si l'utilisateur navigue rapidement ou si la fetch en cours est annulée, le state initial `dog` pourrait être stale.

**Probabilité Cas C** : `Dog.update` est wrappé dans un try/catch silencieux (console.warn seulement). Si ça échoue, aucun toast, aucune indication → `dog.weight` reste à la valeur profil originale → alerte persiste.

**Conclusion du bug** : La cause la plus probable est **Cas C** — `Dog.update` échoue silencieusement dans certains cas et `dog.weight` en DB n'est pas mis à jour. L'alerte SmartAlerts compare alors la dernière pesée contre un `dog.weight` obsolète (initialement saisi dans le profil).

---

## 9. RECOMMANDATIONS FIXES

### Fix #1 — BUG CRITIQUE (SmartAlerts alerte persistante)

**Option A — Court terme** : Changer la logique SmartAlerts pour comparer les deux dernières pesées au lieu de `dog.weight` profil. Alignement avec `computeWeightTrend`.

```javascript
// SmartAlerts.jsx — Remplacer la section poids par :
if (allWeights.length >= 2) {
  const latest = allWeights[allWeights.length - 1].v;
  const previous = allWeights[allWeights.length - 2].v;
  const drift = latest - previous;
  const pct = Math.abs(drift / previous) * 100;
  if (pct >= 10) { /* alerte */ }
}
// Supprimer la dépendance à dog.weight
```

**Option B — Long terme** : S'assurer que `dog` dans Dashboard est rechargé après navigation (window focus listener ou cache invalidation).

### Fix #2 — dog.weight sync locale

Dans chaque handler qui appelle `Dog.update(dogId, { weight })`, si l'accès au setter `setDog` est disponible, mettre à jour le state local immédiatement après :

```javascript
// Exemple dans GrowthTrackerContent (si dog passé en ref mutable ou callback)
await Dog.update(dog.id, { weight: parsedWeight });
// Actuellement aucun setState dog ici — dog est stale dans Sante.jsx
```

La solution minimale : dans Sante.jsx, créer un handler `updateDogWeight(w)` qui fait `setDog(prev => ({ ...prev, weight: w }))` et le passer aux composants enfants.

### Fix #3 — computeStatusPills / computeNextAction weight gap

Passer les extraWeightSources à ces fonctions pour qu'elles voient les GrowthEntries.

### Fix #4 — Delete pseudo-records UX

Masquer le bouton delete pour les records `dl-*` et `ge-*` dans SectionPoids, ou afficher un message explicatif.

### Fix #5 — Import multi-poids Dog.update ordering

Dans `handleImport` et `saveAllRecords`, calculer le poids le plus récent (max date) parmi les records type="weight" et n'appeler `Dog.update` qu'une seule fois avec cette valeur.

---

## 10. FLOWS NOMINAUX SANS RUPTURE

- ✅ Ajout vaccin → VaccineCard mis à jour → vaccineMap recalculé
- ✅ Ajout vet_visit → HealthScoreCard score recalculé
- ✅ computeHealthScore cohérent entre NotebookContent et Dashboard (avec extraWeightSources)
- ✅ DiagnosisReport entité séparée → pas de pollution du carnet santé
- ✅ UpcomingReminders correctement alimenté par records filtré next_date
- ✅ GrowthTrackerContent chart unifié (HealthRecord + DailyLog + GrowthEntry via unifiedEntries)
- ✅ Suppression HealthRecord optimiste avec rollback sur erreur
- ✅ Déduplication des poids par date dans GrowthTrackerContent (Priority: GrowthEntry > HealthRecord > DailyLog)
