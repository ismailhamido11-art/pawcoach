---
phase: 4
plan: 1
type: auto
autonomous: true
wave: 1
depends_on: []
requirements: [SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04]
---

# Phase 4 Plan 1: Monolith Split

## Objective
Decouper les 4 fichiers monolithes en composants separes avec responsabilites claires.

## Tasks

### Task 1 — SPLIT-01: Extraire LabelScanMode depuis Scan.jsx
- Creer `src/pages/LabelScanMode.jsx` avec : LABEL_VERDICT_CONFIG, ScoreBar, etats label, fonctions analyzeLabel/handleLabelFile/resetLabel/saveLabelResult
- Dans Scan.jsx : importer LabelScanMode, passer les props necessaires, supprimer le code deplace

### Task 2 — SPLIT-02: Extraire CompletionCard depuis AITrainingProgram.jsx
- Creer `src/components/activite/CompletionCard.jsx` avec la fonction CompletionCard et ses dependances (FEELING_OPTIONS, GOAL_SUGGESTIONS, getCoachInsight)
- Dans AITrainingProgram.jsx : supprimer la definition locale, importer depuis le nouveau fichier

### Task 3 — SPLIT-03: Extraire WalkSummary depuis WalkMode.jsx
- Creer `src/components/tracker/WalkSummary.jsx` avec le bloc "done" (post-balade) comme composant separe
- Dans WalkMode.jsx : remplacer le bloc done par `<WalkSummary ... />`

### Task 4 — SPLIT-04: Extraire MealPlanGenerator depuis NutritionMealPlan.jsx
- Creer `src/components/nutrition/MealPlanGenerator.jsx` avec la fonction `renderGenerator` transformee en composant React
- Dans NutritionMealPlan.jsx : importer et utiliser `<MealPlanGenerator ... />`

## Success Criteria
1. Scan.jsx n'inclut plus le mode label inline — LabelScanMode est un composant importe separe
2. AITrainingProgram.jsx importe CompletionCard comme composant separe
3. WalkMode.jsx importe WalkSummary comme composant separe
4. NutritionMealPlan.jsx a sa section generateur separee dans MealPlanGenerator
5. Aucun import manquant dans les fichiers modifies
