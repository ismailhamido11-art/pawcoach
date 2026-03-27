---
phase: "05"
plan: "01"
subsystem: "UX / Confirmations"
tags: [ux, dialogs, accessibility, shadcn]
dependency_graph:
  requires: []
  provides: [UX-01]
  affects: [AITrainingProgram, NutritionMealPlan, Library]
tech_stack:
  added: []
  patterns: [AlertDialog pattern (shadcn/ui), confirmDialog state, closure-based action callbacks]
key_files:
  created: []
  modified:
    - src/components/activite/AITrainingProgram.jsx
    - src/components/nutrition/NutritionMealPlan.jsx
    - src/pages/Library.jsx
decisions:
  - "confirmDialog state shape : { title, description, action } — action est une closure async, setConfirmDialog(null) appelé APRES action pour eviter fermeture prematuree"
  - "Extraction de _doStartNewProgram dans AITrainingProgram pour eviter la duplication de la logique async entre le chemin direct (pas de programme) et le chemin via AlertDialog"
  - "handleDelete/handleDeleteNutritionPlan/handleDeleteScan convertis de async vers synchrone — la logique async est capturee dans la closure action"
metrics:
  duration: "~15 min"
  completed_date: "2026-03-27"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 05 Plan 01 : UX Confirmations Summary

**One-liner :** Remplacement des 6 window.confirm() natifs par AlertDialog shadcn/ui avec textes contextuels en francais et actions destructives en rouge.

## Ce qui a ete fait

Les 6 occurrences de `window.confirm()` bloquants (navigation browser native, non stylisable) ont ete remplacees par le composant `AlertDialog` de shadcn/ui, coherent avec le design system existant.

### Fichiers modifies

| Fichier | window.confirm remplaces | Pattern |
|---------|-------------------------|---------|
| `src/components/activite/AITrainingProgram.jsx` | 1 (abandon programme) | confirmDialog state + _doStartNewProgram helper |
| `src/components/nutrition/NutritionMealPlan.jsx` | 2 (delete plan, replace plan) | confirmDialog state partage |
| `src/pages/Library.jsx` | 3 (delete bookmark, delete nutrition, delete scan) | confirmDialog state partage |

### Pattern applique

Chaque composant utilise un state unique `confirmDialog = { title, description, action }`. Les handlers deviennent synchrones et appellent `setConfirmDialog(...)` — la logique async est capturee dans la closure `action`. Le composant AlertDialog est rendu en fin de JSX avec `open={!!confirmDialog}`.

### Textes implementes (tous en francais)

- "Abandonner le programme ?" — avec le count jour X/Y
- "Supprimer ce plan ?" — plan nutritionnel
- "Remplacer le plan actif ?" — activation d'un ancien plan
- "Supprimer ce conseil ?" — bookmark bibliotheque
- "Supprimer ce plan nutrition ?" — plan nutrition bibliotheque
- "Supprimer ce scan ?" — scan alimentaire bibliotheque

Toutes les actions destructives utilisent `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`.

## Commits

| Hash | Message |
|------|---------|
| `42a8a9e` | feat(05-01): replace window.confirm with AlertDialog in AITrainingProgram |
| `e175401` | feat(05-01): replace window.confirm with AlertDialog in NutritionMealPlan |
| `b340b96` | feat(05-01): replace window.confirm with AlertDialog in Library |

## Deviations from Plan

### Auto-fixes

**1. [Rule 1 - Refactor] Extraction _doStartNewProgram dans AITrainingProgram**
- **Trouve pendant :** Task 1
- **Issue :** La logique d'archive/reset du programme est longue (~20 lignes). La dupliquer dans la closure AlertDialog et dans le chemin direct (completedCount >= totalDays) aurait ete du code mort.
- **Fix :** Extraction en `_doStartNewProgram()` appelee depuis les deux chemins.
- **Fichiers modifies :** `src/components/activite/AITrainingProgram.jsx`
- **Commit :** `42a8a9e`

**2. [Rule 1 - Refactor] handleDelete/handleDeleteNutritionPlan/handleDeleteScan passes de async a sync**
- **Trouve pendant :** Task 3
- **Issue :** Les handlers etaient `async` mais avec le pattern AlertDialog ils deviennent des declencheurs synchrones — la logique async va dans la closure `action`.
- **Fix :** Suppression de `async` sur les handlers, logique async capturee dans la closure.
- **Fichiers modifies :** `src/pages/Library.jsx`
- **Commit :** `b340b96`

## Known Stubs

Aucun stub detecte. Toutes les actions sont correctement cablees.

## Self-Check: PASSED

- `src/components/activite/AITrainingProgram.jsx` — existe, modifie [verifie]
- `src/components/nutrition/NutritionMealPlan.jsx` — existe, modifie [verifie]
- `src/pages/Library.jsx` — existe, modifie [verifie]
- 0 `window.confirm` restant dans les 3 fichiers [verifie via grep]
- 14 occurrences AlertDialog par fichier [verifie via grep -c]
- Commits `42a8a9e`, `e175401`, `b340b96` presents dans git log [verifie]
- Push vers origin main : succes [verifie]
