---
phase: "06"
plan: "01"
name: "performance"
type: "auto"
autonomous: true
---

# Phase 06 — Performance

## Objective
Nettoyer les dépendances inutilisées, corriger les fuites mémoire (setTimeout sans cleanup), et ajouter les validations manquantes.

## Requirements
- PERF-01: Dependencies inutilisees supprimees (three, react-quill, react-resizable-panels, embla-carousel-react)
- PERF-02: AITrainingProgram lazy-loaded dans Activite.jsx
- PERF-03: Les 5 setTimeout dans NotebookContent.jsx ont un clearTimeout en cleanup
- PERF-04: ParkReview comment textarea a maxLength=300 + validation

## Tasks

### Task 1 — PERF-01: Supprimer deps inutilisees
type: auto

Supprimer three, react-quill, react-resizable-panels, embla-carousel-react du package.json.
Verification : aucun import de ces libs dans src/ (hors composants ui/ shadcn).

### Task 2 — PERF-02: Lazy-load AITrainingProgram
type: auto

Dans Activite.jsx : remplacer l'import statique de AITrainingProgram par un lazy import.
Wrapper dans Suspense avec fallback SkeletonPage.

### Task 3 — PERF-03: clearTimeout dans NotebookContent
type: auto

5 setTimeout sans cleanup dans NotebookContent.jsx (lignes 80, 94, 201, 209, 219).
Chaque setTimeout doit stocker son ID dans une ref et avoir un clearTimeout dans le cleanup du useEffect.

### Task 4 — PERF-04: ParkReview validation
type: auto

textarea maxLength=300 (actuellement 200).
handleSubmit : rejeter si comment.trim() est vide quand l'utilisateur a tapé uniquement des espaces... non, le comment est optionnel. Ajouter seulement maxLength=300 et trim() sur le comment avant save.

## Success Criteria
- package.json ne contient plus three, react-quill, react-resizable-panels, embla-carousel-react
- Activite.jsx utilise lazy() + Suspense pour AITrainingProgram
- NotebookContent.jsx : tous les setTimeout ont un clearTimeout associe
- ParkReviews.jsx : maxLength=300, comment trimme avant envoi
