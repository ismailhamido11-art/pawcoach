---
phase: 06-error-ux
plan: 02
subsystem: frontend-ux
tags: [empty-states, validation, illustration, dashboard, notebook, dog-profile]
dependency_graph:
  requires: ["06-01"]
  provides: ["ERR-02", "ERR-03"]
  affects: ["src/pages/Dashboard.jsx", "src/components/notebook/PremiumSection.jsx", "src/components/dogprofile/DogEditModal.jsx"]
tech_stack:
  added: []
  patterns: ["ternary-empty-state", "inline-validation", "Illustration-component"]
key_files:
  created: []
  modified:
    - src/pages/Dashboard.jsx
    - src/components/notebook/PremiumSection.jsx
    - src/components/dogprofile/DogEditModal.jsx
decisions:
  - "Ternaire weight/walkData < 2 plutôt que bloc conditionnel &&, pour afficher l'état vide au lieu du silence"
  - "Illustration 'veterinary' pour PremiumSection (générique multi-type : vet_visit, medication, note)"
  - "Validation name avant sex dans handleSave — ordre logique du formulaire"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 3
---

# Phase 06 Plan 02: Empty States + DogEditModal Validation Summary

**One-liner:** États vides illustrés pour graphiques Dashboard (dogPaw/dogWalking) et PremiumSection (veterinary), plus validation inline name/sex dans DogEditModal avec messages rouge sous chaque champ.

## Objective

Rendre l'app auto-explicative pour les nouveaux utilisateurs : les sections vides affichent maintenant un contexte visuel et une action claire. DogEditModal bloque la sauvegarde de données invalides avec des messages inline.

## Tasks Completed

### Task 1: États vides Dashboard (commit a65c3a8)

**Fichier:** `src/pages/Dashboard.jsx`

**Changements:**
- Graphique poids : remplacement du garde `{weightData.length >= 2 && (...)}` par ternaire `weightData.length < 2 ? <empty> : <chart>`
  - État vide : `Illustration name="dogPaw"` + texte "Suis l'évolution du poids" + lien "Ajouter une pesée →" vers `/Sante?tab=carnet`
- Graphique balades : même pattern avec `walkData.length < 2`
  - État vide : `Illustration name="dogWalking"` + texte "Suis les balades quotidiennes" + lien "Lancer une balade →" vers `/Activite?tab=balade`
- `Illustration` était déjà importé (phase 06-01), `Link` et `createPageUrl` déjà présents — pas de nouveaux imports

### Task 2: PremiumSection illustration + DogEditModal validation (commit 806d8fd)

**Fichier:** `src/components/notebook/PremiumSection.jsx`
- Ajout import `Illustration from "../illustrations/Illustration"`
- Remplacement de l'état vide (icone seule + texte) par : `Illustration name="veterinary"` + `config.emptyText` en gras + "Utilise le bouton ci-dessus pour en ajouter un"

**Fichier:** `src/components/dogprofile/DogEditModal.jsx`
- Ajout de `const [nameError, setNameError] = useState(false)` et `const [sexError, setSexError] = useState(false)`
- `handleSave` : validation en séquence — name.trim() vide → setNameError + return / sex vide → setSexError + return / date invalide (existant)
- Message inline `"Le nom est requis"` affiché sous l'input name quand `nameError === true`
- Message inline `"Sélectionne le sexe"` affiché sous les boutons Mâle/Femelle quand `sexError === true`
- `nameError` réinitialisé au onChange du champ name
- `sexError` réinitialisé au onClick des boutons sexe

## Build

```
✓ 4234 modules transformed.
✓ built in 16.62s
```

Seul avertissement : chunk size > 500 kB — pré-existant, non lié à ce plan.

## Deviations from Plan

None — plan executed exactly as written.

## Requirements Satisfied

- **ERR-02:** Dashboard affiche des états vides illustrés pour poids (< 2 pesées) et balades (< 2 entrées), avec liens d'action vers Santé et Activité. PremiumSection affiche l'illustration veterinary dans ses états vides.
- **ERR-03:** DogEditModal bloque la sauvegarde si `name` vide (message "Le nom est requis" sous le champ) et si `sex` non sélectionné (message "Sélectionne le sexe" sous les boutons). Logique de sauvegarde existante (validation date, sanitization name) préservée intacte.

## Self-Check: PASSED

- FOUND: src/pages/Dashboard.jsx
- FOUND: src/components/notebook/PremiumSection.jsx
- FOUND: src/components/dogprofile/DogEditModal.jsx
- FOUND: commit a65c3a8 (Task 1)
- FOUND: commit 806d8fd (Task 2)
