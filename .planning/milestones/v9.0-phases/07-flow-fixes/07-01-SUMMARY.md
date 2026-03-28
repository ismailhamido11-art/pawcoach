---
phase: 07-flow-fixes
plan: "01"
subsystem: vet-notes, library
tags: [bug-fix, api-call, error-handling, p0]
dependency_graph:
  requires: []
  provides: [FIX-15, FIX-19]
  affects: [VetNoteForm, Library]
tech_stack:
  added: []
  patterns: [base44.functions.invoke, split-try-catch]
key_files:
  modified:
    - src/components/vet/VetNoteForm.jsx
    - src/pages/Library.jsx
decisions:
  - "Passer response?.note ?? response à onNoteAdded pour compatibilité avec la forme exacte de retour de vetAccess"
  - "Deux try/catch séparés dans handleActivateTraining : JSON parse d'abord, opération réseau ensuite"
metrics:
  duration: "~5 min"
  completed: "2026-03-27T23:00:24Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 07 Plan 01: Flow Fixes P0 (VetNoteForm + Library) Summary

**One-liner:** Remplacement de l'appel API vetAccess invalide par invoke(), et séparation des erreurs JSON/réseau dans Library.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix VetNoteForm — appel API incorrect | a164391 | src/components/vet/VetNoteForm.jsx |
| 2 | Améliorer Library handleActivateTraining | a164391 | src/pages/Library.jsx |

## Changes Made

### Task 1 — FIX-15 : VetNoteForm (ligne 30)

**Avant :**
```js
const { note } = await base44.functions.vetAccess({
  action: 'addVetNote',
  ...
});
if (onNoteAdded) onNoteAdded(note);
```

**Après :**
```js
const response = await base44.functions.invoke("vetAccess", {
  action: 'addVetNote',
  ...
});
if (onNoteAdded) onNoteAdded(response?.note ?? response);
```

La syntaxe `base44.functions.vetAccess()` génère une TypeError car les fonctions backend ne sont pas exposées comme propriétés directes de `base44.functions`. La forme correcte est `base44.functions.invoke("nomDeLaFonction", payload)`. Le fallback `response?.note ?? response` couvre les deux formes de retour possibles de vetAccess.

### Task 2 — FIX-19 : Library.handleActivateTraining

**Confirmation :** Le try/catch existait déjà (ligne 97-106 avant fix). Il était opérationnel mais ne distinguait pas les erreurs JSON des erreurs réseau.

**Amélioration appliquée :** Deux try/catch séparés :
1. Premier bloc : `JSON.parse(bk.content)` → si échec → "Programme corrompu — impossible de l'activer." + return immédiat
2. Second bloc : `Bookmark.update(...)` → si échec → "Impossible d'activer ce programme. Réessaie."

Cette séparation permet à l'utilisateur de comprendre la nature exacte de l'erreur.

## Verification Results

```
=== FIX-15 ===
OK - old pattern removed
      const response = await base44.functions.invoke("vetAccess", {
OK - invoke present
=== FIX-19 ===
      toast.error("Programme corrompu — impossible de l'activer.");
OK - message present
```

## Deviations from Plan

None — plan exécuté exactement comme écrit. Adaptation mineure non planifiée : `onNoteAdded(response?.note ?? response)` au lieu de `onNoteAdded(response)` pour préserver la compatibilité avec les appelants qui attendent un objet `note` (et non toute la réponse).

## Known Stubs

None.

## Self-Check: PASSED

- src/components/vet/VetNoteForm.jsx : modifié [verifie via Read + grep]
- src/pages/Library.jsx : modifié [verifie via Read + grep]
- commit a164391 : present [verifie via git log]
- `invoke("vetAccess"` : present dans VetNoteForm.jsx [grep confirme]
- `Programme corrompu` : present dans Library.jsx [grep confirme]
- `base44.functions.vetAccess` : 0 occurrence [grep confirme]
