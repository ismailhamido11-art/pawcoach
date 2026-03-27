---
phase: 07-flow-fixes
plan: "03"
subsystem: scan, chat, nutri, sante
tags: [fix, ux, bug, state-sync]
dependency_graph:
  requires: []
  provides: [FIX-20, FIX-25, FIX-26]
  affects: [LabelScanMode, Scan.jsx, Chat, Nutri, Sante, NotebookContent]
tech_stack:
  added: []
  patterns: [optional-chaining-callback, loading-guard-chip, in-memory-state-sync]
key_files:
  modified:
    - src/components/scan/LabelScanMode.jsx
    - src/pages/Chat.jsx
    - src/pages/Nutri.jsx
    - src/pages/Sante.jsx
    - src/components/sante/NotebookContent.jsx
decisions:
  - "Nutri.jsx a bien isStreaming, donc !loading && !isStreaming appliqué (plus robuste que !loading seul)"
  - "Weight sync via prop onWeightAdded de NotebookContent → pas de refactor majeur de SectionPoids"
metrics:
  duration: ~15min
  completed: "2026-03-27T23:01:59Z"
  tasks_completed: 3
  files_changed: 5
---

# Phase 07 Plan 03: Flow Fixes — LabelScan + Chat/Nutri guards + Sante weight sync

One-liner: resetLabel notifie Scan.jsx parent, chips Chat/Nutri bloquées pendant loading/streaming, dog.weight mis à jour immédiatement après pesée SectionPoids.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | LabelScanMode resetLabel notifie parent | 068af61 | LabelScanMode.jsx (+1 ligne) |
| 2 | Chat showSuggestions désactivé pendant loading | a164391 | Chat.jsx (1 ligne modifiée) |
| 3 | Nutri quickActions + Sante weight sync | ac97c24 | Nutri.jsx, Sante.jsx, NotebookContent.jsx |

## Changements exacts par fichier

### src/components/scan/LabelScanMode.jsx (FIX-20)

**Avant :**
```javascript
const resetLabel = () => {
  setLabelFile(null);
  setLabelPreview(null);
  setLabelResult(null);
  setShowIngredients(false);
  setLabelSaved(false);
};
```

**Après :**
```javascript
const resetLabel = () => {
  setLabelFile(null);
  setLabelPreview(null);
  setLabelResult(null);
  setShowIngredients(false);
  setLabelSaved(false);
  onLabelResult?.(null); // Informe Scan.jsx parent → réaffiche ModeSwitcher
};
```

Ligne ajoutée : 157. `onLabelResult` apparaît désormais 2 fois : ligne 117 (avec résultat AI) et ligne 157 (null dans resetLabel).

---

### src/pages/Chat.jsx (FIX-25)

**Avant (ligne 338) :**
```javascript
const showSuggestions = messages.length <= 1 && !isLimitReached;
```

**Après :**
```javascript
const showSuggestions = messages.length <= 1 && !isLimitReached && !loading && !isStreaming;
```

---

### src/pages/Nutri.jsx (FIX-25)

**Avant (ligne 387) :**
```javascript
const showQuickActions = messages.length <= 1 && !isLimitReached;
```

**Après :**
```javascript
const showQuickActions = messages.length <= 1 && !isLimitReached && !loading && !isStreaming;
```

Note : Le plan indiquait Nutri.jsx sans `isStreaming` distinct, mais la vérification a confirmé que `isStreaming` existe bien (ligne 95 via `coachState`). Le guard complet a été appliqué pour cohérence avec Chat.jsx.

---

### src/pages/Sante.jsx + src/components/sante/NotebookContent.jsx (FIX-26)

**Structure du callback Sante → NotebookContent → SectionPoids :**

1. **Sante.jsx** — nouvelle fonction (ligne 129) :
```javascript
const handleWeightAdded = (weightKg) => {
  if (weightKg) setDog(prev => prev ? { ...prev, weight: weightKg } : prev);
};
```

2. **Sante.jsx** — prop passée à NotebookContent (ligne 255) :
```jsx
onWeightAdded={handleWeightAdded}
```

3. **NotebookContent.jsx** — signature enrichie (ligne 62) :
```javascript
export default function NotebookContent({ ..., onChangeMainTab, onWeightAdded }) {
```

4. **NotebookContent.jsx** — callback SectionPoids enrichi (ligne 425) :

**Avant :**
```jsx
onRecordAdded={(rec) => setRecords(prev => [...prev, rec])}
```

**Après :**
```jsx
onRecordAdded={(rec) => {
  setRecords(prev => [...prev, rec]);
  if (rec.type === "weight" && rec.value) onWeightAdded?.(rec.value);
}}
```

La propagation : SectionPoids retourne un HealthRecord (`{type: "weight", value: weightKg}`) → NotebookContent appelle `onWeightAdded?.(rec.value)` → Sante.jsx met à jour `dog.weight` en mémoire immédiatement sans rechargement.

## Deviations from Plan

### Auto-applied improvement (Nutri isStreaming)

**Found during:** Task 3
**Issue:** Le plan supposait que Nutri.jsx n'avait pas de `isStreaming` distinct. La vérification a montré que `isStreaming` existe bien dans `coachState` (ligne 95).
**Fix:** Appliqué `!loading && !isStreaming` au lieu de `!loading` seul — plus robuste, cohérent avec Chat.jsx.
**Files modified:** src/pages/Nutri.jsx
**Commit:** ac97c24

## Known Stubs

None.

## Self-Check: PASSED

- [x] LabelScanMode.jsx modifié (ligne 157 ajoutée)
- [x] Chat.jsx modifié (ligne 338)
- [x] Nutri.jsx modifié (ligne 387)
- [x] Sante.jsx modifié (lignes 129, 255)
- [x] NotebookContent.jsx modifié (lignes 62, 425-427)
- [x] Commits 068af61, a164391, ac97c24 existants
- [x] Vérification finale : 4/4 success criteria OK
