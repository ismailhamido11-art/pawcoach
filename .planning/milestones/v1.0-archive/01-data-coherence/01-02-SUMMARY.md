---
phase: 01-data-coherence
plan: 02
subsystem: ui
tags: [healthscore, health-score, frontend-calc, dead-code, weight-sources, growthentry, dailylog]

# Dependency graph
requires: []
provides:
  - computeHealthScore accepte extraWeightSources (GrowthEntry + DailyLog) comme sources de poids supplementaires
  - HealthScore.jsx calcule le score en local via computeHealthScore — plus de backend
  - functions/healthScoreCalculate.ts supprime (code mort)
affects: [DownloadHealthPDF, NotebookContent, Dashboard, tout composant affichant le score sante]

# Tech tracking
tech-stack:
  added: []
  patterns: [extraWeightSources optional 3rd param pattern, deduplication-by-date HealthRecord-wins]

key-files:
  created: []
  modified:
    - pawcoach/src/utils/healthStatus.js
    - pawcoach/src/components/home/HealthScore.jsx
  deleted:
    - pawcoach/functions/healthScoreCalculate.ts

key-decisions:
  - "computeHealthScore modifie (3e param optionnel) plutot que computeWeightTrend — moins risque, les 11 consumers existants inchanges"
  - "Deduplication par date: HealthRecord prioritaire sur GrowthEntry/DailyLog en cas de doublon"
  - "HealthScore.jsx affiche computeStatusPills au lieu des insights backend (plus coherent avec le reste de l'app)"
  - "healthScoreCalculate.ts supprime : algorithme different (DailyCheckin-based), code mort non appele"

patterns-established:
  - "extraWeightSources pattern: passer des sources de poids supplementaires avec { weight_kg, date } — deduplication incluse"
  - "Pre-merge pattern: normaliser GrowthEntry/DailyLog en pseudo-records avant computeHealthScore"

requirements-completed: [DATA-02, DATA-04]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 01 Plan 02: HealthScore Migration Summary

**HealthScore.jsx migre du backend mort vers calcul local computeHealthScore enrichi de GrowthEntry + DailyLog, et healthScoreCalculate.ts supprime**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T05:36:03Z
- **Completed:** 2026-03-11T05:37:53Z
- **Tasks:** 2/2
- **Files modified:** 2 (+ 1 supprime)

## Accomplishments

- `computeHealthScore` accepte maintenant un 3e parametre optionnel `extraWeightSources` — les pesees GrowthEntry et DailyLog contribuent au score poids sans casser les 11 consumers existants (tous en 2-arg)
- `HealthScore.jsx` reecrit : fetch de 3 entites (HealthRecord + GrowthEntry + DailyLog), calcul 100% local, affichage via `computeStatusPills` — plus de `base44.functions.invoke('healthScoreCalculate')`
- `functions/healthScoreCalculate.ts` supprime : algorithme DailyCheckin different et inferieur, non appele depuis `src/`, code mort sans regression

## Task Commits

1. **Task 1: etendre computeHealthScore avec extraWeightSources** — `03ec46a` (feat)
2. **Task 2: migrer HealthScore.jsx + supprimer healthScoreCalculate.ts** — `2e999d7` (feat)

**Plan metadata:** voir commit final docs

## Files Created/Modified

- `pawcoach/src/utils/healthStatus.js` — `computeHealthScore` + param optionnel `extraWeightSources = []`, pre-merge + dedup par date, weightScore utilise `enrichedRecs`
- `pawcoach/src/components/home/HealthScore.jsx` — reecrit : imports locaux, 3 fetches paralleles, calcul local, pills au lieu d'insights backend
- `pawcoach/functions/healthScoreCalculate.ts` — **supprime**

## Decisions Made

- Modifier `computeHealthScore` (3e param) plutot que `computeWeightTrend` : plus sur car `computeWeightTrend` est appele par 3 endroits distincts (computeStatusPills, computeNextAction, computeNotebookSummary) avec les records bruts
- Deduplication par date (HealthRecord prioritaire) : si une pesee existe a la meme date dans HealthRecord et GrowthEntry, HealthRecord gagne — source de verite medicale
- Supprimer l'alert section du HealthScore rendu : elle dependait du backend `alert` object qui n'existe plus en local

## Deviations from Plan

None — plan execute exactement comme specifie. L'approche "3e param sur computeHealthScore plutot que sur computeWeightTrend" etait deja documentee dans le plan comme decision preferee.

## Issues Encountered

Aucun. Le grep initial a confirme que `healthScoreCalculate` n'etait appele que par HealthScore.jsx dans `src/` — suppression sans risque.

## Self-Check

- [x] `grep -rn "healthScoreCalculate" pawcoach/src/` → 0 resultats [verifie]
- [x] `functions/healthScoreCalculate.ts` n'existe plus [verifie]
- [x] `HealthScore.jsx` importe `computeHealthScore` + fetche GrowthEntry + DailyLog [verifie]
- [x] `healthStatus.js` contient `extraWeightSources`, `enrichedRecs` [verifie]
- [x] Commits `03ec46a` et `2e999d7` existent [verifie]

## Self-Check: PASSED

## Next Phase Readiness

- DATA-02 et DATA-04 satisfaits
- Les 11 consumers de healthStatus.js (SmartAlerts, BentoGrid, DailySnapshot, etc.) ne sont pas impactes — 3e param optionnel, comportement identique sans lui
- DownloadHealthPDF appelle `computeHealthScore(records, dog)` sans extraWeightSources — acceptable (le PDF ne fetch pas GrowthEntry/DailyLog, amelioration possible plus tard)

---
*Phase: 01-data-coherence*
*Completed: 2026-03-11*
