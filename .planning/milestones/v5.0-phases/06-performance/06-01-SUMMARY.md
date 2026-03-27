---
phase: "06"
plan: "01"
subsystem: "performance"
tags: ["perf", "cleanup", "memory-leak", "lazy-load", "validation"]
dependency_graph:
  requires: []
  provides: ["PERF-01", "PERF-02", "PERF-03", "PERF-04"]
  affects: ["package.json", "Activite.jsx", "NotebookContent.jsx", "ParkReviews.jsx"]
tech_stack:
  added: []
  patterns: ["React.lazy + Suspense", "useRef for timeout cleanup", "clearTimeout on unmount"]
key_files:
  created: []
  modified:
    - "pawcoach/package.json"
    - "pawcoach/src/pages/Activite.jsx"
    - "pawcoach/src/components/sante/NotebookContent.jsx"
    - "pawcoach/src/components/tracker/ParkReviews.jsx"
decisions:
  - "Les 3 setTimeout dans handleNavigateToTab (hors useEffect) sont routés via scrollTimeoutRef avec cleanup au démontage — approche plus propre que de déplacer la logique dans un useEffect"
  - "embla-carousel-react et react-resizable-panels supprimés : seul usage dans shadcn/ui components non utilisés par l'app"
  - "PERF-04: comment.trim() au save était déjà présent — seul maxLength manquait"
metrics:
  duration: "~15min"
  completed: "2026-03-27"
  tasks: 4
  files: 4
---

# Phase 06 Plan 01: Performance — Summary

**One-liner:** Suppression de 4 deps inutilisées (~450KB bundle), lazy-load AITrainingProgram, correction de 5 fuites mémoire setTimeout, et maxLength=300 sur ParkReview.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | PERF-01: Remove unused deps | a356e70 | package.json |
| 2 | PERF-02: Lazy-load AITrainingProgram | 70fd730 | src/pages/Activite.jsx |
| 3 | PERF-03: clearTimeout cleanup | ccda10c | src/components/sante/NotebookContent.jsx |
| 4 | PERF-04: ParkReview maxLength | 4f438db | src/components/tracker/ParkReviews.jsx |

## What Was Done

### PERF-01 — Dependencies inutilisées supprimées
Supprimé du package.json :
- `three` (^0.171.0) — zero imports dans src/
- `react-quill` (^2.0.0) — zero imports dans src/
- `react-resizable-panels` (^2.1.7) — seul usage dans `ui/resizable.jsx` (shadcn), non importé ailleurs
- `embla-carousel-react` (^8.5.2) — seul usage dans `ui/carousel.jsx` (shadcn), non importé ailleurs

Estimation bundle : -400 à -500KB (three seul fait ~600KB minifié).

### PERF-02 — Lazy-load AITrainingProgram
- `import AITrainingProgram` remplacé par `const AITrainingProgram = lazy(() => import(...))`
- Ajout `lazy, Suspense` dans les imports React
- Render wrappé : `<Suspense fallback={<SkeletonPage variant="list" />}>`
- L'onglet "Programme" ne charge le composant que si l'utilisateur le sélectionne

### PERF-03 — clearTimeout en cleanup
5 setTimeout corrigés dans NotebookContent.jsx :

**useEffect initialVaccineKey (ligne 78)** :
- `const tid = setTimeout(...)` + `return () => clearTimeout(tid)`

**useEffect scrollToQR (ligne 93)** :
- `const tid = setTimeout(...)` + `return () => clearTimeout(tid)`

**handleNavigateToTab (3 setTimeout — lignes 202, 210, 222)** :
- Ajout `scrollTimeoutRef = useRef(null)`
- Chaque setTimeout stocké dans `scrollTimeoutRef.current`
- `clearTimeout(scrollTimeoutRef.current)` avant chaque nouveau setTimeout
- useEffect de démontage dédié : `return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); }`

### PERF-04 — ParkReview validation
- `maxLength` passé de 200 à 300 sur le textarea comment
- `comment.trim()` au submit était déjà présent (aucun changement nécessaire)

## Deviations from Plan

### Auto-fixed Issues

Aucune déviation. Plan exécuté tel quel.

Note : PERF-04 mentionnait "validation dans handleSubmit" — en lisant le code, `comment.trim()` était déjà appliqué (ligne 113) et `rating === 0` était déjà rejeté (ligne 101). Seul `maxLength` manquait.

## Known Stubs

Aucun stub introduit.

## Self-Check

- [x] package.json : three, react-quill, react-resizable-panels, embla-carousel-react absents
- [x] Activite.jsx : lazy() + Suspense présents
- [x] NotebookContent.jsx : 5 setTimeout avec clearTimeout (2 dans useEffect + 3 via scrollTimeoutRef)
- [x] ParkReviews.jsx : maxLength=300
- [x] Commits : a356e70, 70fd730, ccda10c, 4f438db

## Self-Check: PASSED
