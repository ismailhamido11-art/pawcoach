---
phase: "06"
plan: "01"
subsystem: "frontend-performance"
tags: [performance, react-keys, error-logging, leaflet]
dependency_graph:
  requires: []
  provides: [stable-react-keys, mutation-error-visibility]
  affects: [all-pages-with-dynamic-lists]
tech_stack:
  added: []
  patterns: [stable-key-strategy, console.warn-on-mutation-fail]
key_files:
  created:
    - .planning/phases/06-perf/06-01-PLAN.md
    - .planning/phases/06-perf/06-01-SUMMARY.md
  modified:
    - src/components/activite/AITrainingProgram.jsx
    - src/components/activite/CompletionCard.jsx
    - src/components/dogprofile/DogTrophiesRow.jsx
    - src/components/home/ActiveProgramCards.jsx
    - src/components/home/CalendarStrip.jsx
    - src/components/home/WeeklyInsightCard.jsx
    - src/components/notebook/SectionPoids.jsx
    - src/components/notebook/SmartHealthAssistant.jsx
    - src/components/notebook/WeightCard.jsx
    - src/components/nutrition/DietPreferencesPanel.jsx
    - src/components/nutrition/MealPlanGenerator.jsx
    - src/components/nutrition/NutritionMealPlan.jsx
    - src/components/sante/FindVetContent.jsx
    - src/components/sante/HealthImportContent.jsx
    - src/components/scan/LabelScanMode.jsx
    - src/components/tracker/NearbyParks.jsx
    - src/components/tracker/TrackerHistory.jsx
    - src/components/tracker/WalkMode.jsx
    - src/components/tracker/WalkShareCard.jsx
    - src/components/training/ExerciseDetail.jsx
    - src/components/vet/DiagnosisReportView.jsx
    - src/pages/Chat.jsx
    - src/pages/Dashboard.jsx
    - src/pages/Home.jsx
decisions:
  - "PERF-01 deja implemente : FindVetContent lazy dans Sante.jsx, WalkMap+NearbyParks lazy dans WalkMode.jsx — aucune modification necessaire"
  - "Strategie cles stables : .id si dispo, sinon label/nom unique, sinon prefix-i pour les strings"
  - "Catches non-critiques laisses vides : localStorage, JSON.parse defensive, audio, SpeechRecognition abort, wakeLock"
metrics:
  duration: "45min"
  completed: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 24
---

# Phase 6 Plan 1: PERF — Bundle & Error Visibility Summary

**One-liner:** Stable React keys sur 22 listes dynamiques API + console.warn sur 6 mutations silencieusement echouees (Dog.update, DailyLog.update).

## What Was Built

### PERF-01: Leaflet Lazy Loading
Deja implemente avant execution de ce plan :
- `Sante.jsx` : `const FindVetContent = lazy(() => import("@/components/sante/FindVetContent"))` + Suspense wrapping (ligne 23 et 280)
- `WalkMode.jsx` : `WalkMap` et `NearbyParks` charges avec `lazy()` + Suspense (lignes 9-10, 448, 488)

Aucune modification necessaire. Confirme en pre-execution.

### PERF-02: Index-as-Key Corriges (22 fichiers)

Strategie appliquee :
- Listes d'objets avec ID : `key={item.id}` ou `key={item.label}` ou `key={item.theme}`
- Listes de strings : `key={\`prefix-\${i}\`}` (allergens, tips, supplements, steps, etc.)
- Listes carte (Leaflet) : `key={\`\${lat}-\${lng}\`}` pour les markers
- Messages : `key={msg.timestamp || msg.id || i}`

Listes statiques laissees en `key={i}` (correct) :
- Skeletons (`[...Array(6)]`, `[1,2,3]`)
- Options hardcodees (`FEATURES`, `FEELING_OPTIONS`, `[1,2,3].map(i => ...)` anneaux)
- Progress indicators sequentiels

### PERF-03: Console.warn sur Mutations Silencieuses (5 mutations)

| Fichier | Mutation | Warn ajouté |
|---------|----------|-------------|
| SectionPoids.jsx | Dog.update(weight) | "SectionPoids: Dog.weight sync failed" |
| WeightCard.jsx | Dog.update(weight) | "WeightCard: Dog.weight sync failed" |
| SmartHealthAssistant.jsx | Dog.update(weight) | "SmartHealthAssistant: Dog.weight sync failed" |
| HealthImportContent.jsx | Dog.update(weight) | "HealthImportContent: Dog.weight sync failed" |
| WalkMode.jsx (2) | offline sync + mood save | "WalkMode: offline walks sync failed" + "WalkMode: mood save failed" |

Catches laisses vides (non-critiques) :
- localStorage read/write (QuotaExceededError tres rare, non-bloquant)
- JSON.parse defensive (donnees corrompues attendues)
- SpeechRecognition.abort() (browser API, toujours safe)
- navigator.wakeLock (non supporte sur tous les browsers)
- Crash walk recovery read (outermost catch, parse-only)

## Commits

| Hash | Message |
|------|---------|
| 987488b | fix(06-01): replace index-as-key with stable keys on dynamic lists |
| e2b9f1f | fix(06-01): add console.warn to empty catch blocks on data mutations |

## Deviations from Plan

### PERF-01 Already Implemented
- **Found during:** Pre-execution audit
- **Issue:** Plan demandait de lazy-loader les 3 composants Leaflet
- **Reality:** WalkMap + NearbyParks deja lazy dans WalkMode.jsx (lignes 9-10), FindVetContent deja lazy dans Sante.jsx (ligne 23)
- **Action:** Aucune modification, documente comme "done by previous work"
- **Rule:** N/A (pre-existing correct implementation)

### Fichiers Supplementaires Traites (Rule 2)
- **Found during:** Grep initial
- **Issue:** LabelScanMode.jsx, DiagnosisReportView.jsx, Chat.jsx, Dashboard.jsx, Home.jsx, WalkShareCard.jsx, ExerciseDetail.jsx avaient aussi des `key={i}` sur des listes dynamiques
- **Fix:** Meme correction appliquee (cles stables)
- **Rule 2:** Correction appliquee automatiquement — meme categorie de fix, meme execution

## Known Stubs

Aucun stub detecte. Toutes les corrections sont purement syntaxiques (attributs React) et ne creent pas de nouvelles fonctionnalites ou de data sources.

## Self-Check: PASSED

Fichiers crees :
- .planning/phases/06-perf/06-01-PLAN.md : FOUND
- .planning/phases/06-perf/06-01-SUMMARY.md : EN COURS DE CREATION

Commits :
- 987488b (PERF-02) : FOUND
- e2b9f1f (PERF-03) : FOUND

Aucun `key={i}` restant sur des listes de donnees API dans les fichiers modifies : VERIFIE
