---
phase: "07"
plan: "01"
name: "Polish — Code Quality"
subsystem: "frontend"
tags: ["refactoring", "polish", "code-quality", "analytics", "performance"]
dependency_graph:
  requires: []
  provides: ["POLISH-01", "POLISH-02", "POLISH-03", "POLISH-04", "POLISH-05", "POLISH-06"]
  affects: ["Home.jsx", "LottieAnimation.jsx", "badgeUtils.jsx", "AITrainingProgram.jsx", "CombinedFAB.jsx", "Library.jsx", "analytics.js"]
tech_stack:
  added: []
  patterns: ["useState grouping", "localStorage TTL", "query limits", "error visibility"]
key_files:
  created: []
  modified:
    - src/pages/Home.jsx
    - src/components/ui/LottieAnimation.jsx
    - src/components/achievements/badgeUtils.jsx
    - src/components/activite/AITrainingProgram.jsx
    - src/components/CombinedFAB.jsx
    - src/pages/Library.jsx
    - src/utils/analytics.js
decisions:
  - "Destructure dogData/insights objects at component level pour garder backward-compat avec le JSX sans toucher tous les props"
  - "POLISH-03 deja resolu dans le code existant — unlockBadge utilise deja badge_id dans le filtre"
  - "useMemo recommendations depend de [dog, dogData] au lieu des 10 variables individuelles"
metrics:
  duration: "~30 min"
  completed_date: "2026-03-27"
  tasks_completed: 6
  files_modified: 7
---

# Phase 7 Plan 1 : Polish — Code Quality Summary

**One-liner:** Consolidation de 24 useState en 11 objets groupes dans Home.jsx, fallback LottieAnimation, console.warn sur 4 silent catches, limits queries Library, TTL 30 jours analytics localStorage.

## Completed Tasks

| Task | Requirement | Commit | Files |
|------|-------------|--------|-------|
| 1 | POLISH-02 LottieAnimation fallback | e7b88e6 | LottieAnimation.jsx |
| 2 | POLISH-04 Silent catches -> console.warn | b371f89 | AITrainingProgram.jsx, CombinedFAB.jsx |
| 3 | POLISH-03 badgeUtils filter (already done) | — | badgeUtils.jsx (no change needed) |
| 4 | POLISH-05 Library query limits | 184e3c0 | Library.jsx |
| 5 | POLISH-06 Analytics TTL 30 jours | 0e0002d | analytics.js |
| 6 | POLISH-01 Home.jsx useState consolidation | e0034ff | Home.jsx |

## What was built

### POLISH-01 — Home.jsx useState 24 → 11
- `dogData` object regroupe 11 champs : todayCheckin, streak, recentCheckins, records, exercises, scans, dailyLogs, diagnosisReports, nutritionPlans, trainingBookmarks, behaviorBookmarks
- `insights` object regroupe 3 champs : weeklyInsight, previousInsight, pastInsights
- Destructuration au niveau render pour maintenir la compatibilite des variables dans le JSX existant
- `applyDogData()` et `applyInsights()` mis a jour pour setter les objets groupes
- `handleCheckin` utilise `setDogData(prev => ({...prev, ...}))` pour les updates partiels
- `handleMarkInsightRead` utilise `setInsights(prev => ({...prev, ...}))` pour l'update partiel
- Variables locales de fetch renommees `fetchedDogData` / `fetchedInsights` pour eviter le shadowing

### POLISH-02 — LottieAnimation fallback
- Import `PawPrint` de lucide-react
- Quand `!src` ou `failed=true` : affiche un `<div>` avec `PawPrint` (classe `text-muted-foreground/30`) au lieu de `return null`
- Maintient le style (`width`/`height` issu du prop `size`)

### POLISH-04 — Silent catches
- AITrainingProgram.jsx : 3 `catch {}` remplaces (parse bookmark, archive, JSON response)
- CombinedFAB.jsx : 1 `catch {}` remplace (walk badge fetch) + `.catch(() => {})` sur checkWalkBadges remplace par `.catch((e) => console.warn(...))`

### POLISH-05 — Library query limits
- `Bookmark.filter`: ajout `100` comme limit (etait non-borne)
- `NutritionPlan.filter`: ajout `50` comme limit (etait non-borne)

### POLISH-06 — Analytics TTL
- Constante `TTL_DAYS = 30`
- `trackEvent`: purge les events > 30 jours AVANT d'ajouter le nouvel event
- `getEvents`: filtre les events > 30 jours a la lecture
- Les events ont deja `ts: new Date().toISOString()` — timestamp garanti

## Decisions Made

1. Destructure `dogData`/`insights` au niveau composant (pas dans le render JSX) — permet de garder tous les noms de variables existants dans le JSX sans aucune modification des props
2. POLISH-03 est deja resolu : `unlockBadge` utilise `DogAchievement.filter({ dog_id: dogId, badge_id: badgeId })` depuis les phases precedentes. Aucun changement necessaire.
3. `useMemo` recommendations simplifie a `[dog, dogData]` — semantiquement correct et plus maintenable

## Deviations from Plan

### Verifications pre-code

**POLISH-03 deja resolu**
- **Trouve pendant:** analyse du fichier badgeUtils.jsx avant codage
- **Constat:** `unlockBadge` utilise deja `badge_id` dans le filtre (ligne 37). Le requirement dit "utiliser badge_id dans le filtre au lieu de charger tous les badges" — c'est exactement ce qui est fait. `checkPointMilestones` charge tous les badges sans filtre badge_id, mais c'est intentionnel : elle doit sommer les points de TOUS les badges pour verifier les seuils.
- **Action:** Aucune modification. Note dans le SUMMARY.
- **Commit:** N/A

## Known Stubs

Aucun stub detecte dans les fichiers modifies.

## Self-Check: PASSED

- FOUND: src/components/ui/LottieAnimation.jsx
- FOUND: src/utils/analytics.js
- FOUND: src/pages/Library.jsx
- FOUND: src/pages/Home.jsx
- FOUND: src/components/activite/AITrainingProgram.jsx
- FOUND: src/components/CombinedFAB.jsx
- FOUND commit e7b88e6 (POLISH-02)
- FOUND commit b371f89 (POLISH-04)
- FOUND commit 184e3c0 (POLISH-05)
- FOUND commit 0e0002d (POLISH-06)
- FOUND commit e0034ff (POLISH-01)
