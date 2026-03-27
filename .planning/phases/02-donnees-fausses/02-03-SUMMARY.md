---
phase: 02-donnees-fausses
plan: 03
subsystem: dashboard
tags: [data-coherence, wellness-score, growth-entries, unified-sources]
dependency_graph:
  requires: []
  provides: [unified-wellness-score-sources]
  affects: [Dashboard.jsx, computeHealthScore]
tech_stack:
  added: []
  patterns: [Promise.all parallel fetch, merged extraWeightSources]
key_files:
  modified:
    - src/pages/Dashboard.jsx
decisions:
  - "Pass [...growthEntries, ...dailyLogs] to computeHealthScore in Dashboard — more complete than Sante (growthEntries only) but eliminates the major divergence caused by missing GrowthEntry data"
  - "GrowthEntry.filter added to existing Promise.all — no extra network roundtrip, zero performance regression"
metrics:
  duration: "< 5 min"
  completed: 2026-03-27T16:52:28Z
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 02 Plan 03: Unifier Sources Score Wellness (Dashboard) Summary

**One-liner:** Dashboard charge GrowthEntry et passe `[...growthEntries, ...dailyLogs]` a computeHealthScore, eliminant la divergence majeure avec le score de Sante (DATA-05).

## What Was Done

Dashboard.jsx affichait un score wellness calcule uniquement depuis `dailyLogs`, alors que la page Sante (NotebookContent) utilisait `growthEntries`. Un utilisateur pouvait voir deux scores differents pour le meme chien au meme moment.

4 modifications atomiques dans `src/pages/Dashboard.jsx` :

1. **Import** — `GrowthEntry` ajoute a la ligne d'import des entities
2. **State** — `const [growthEntries, setGrowthEntries] = useState([])` ajoute
3. **Promise.all** — `GrowthEntry.filter({ dog_id: d.id }, "-date", 50).catch(() => [])` charge en parallele avec les autres donnees existantes
4. **computeHealthScore** — appel passe de `dailyLogs` a `[...growthEntries, ...dailyLogs]` ; `growthEntries` ajoute aux deps du useMemo

## Verification

```
grep -n "GrowthEntry|growthEntries|computeHealthScore" src/pages/Dashboard.jsx
```

Resultats confirmes :
- Ligne 4 : `GrowthEntry` dans import
- Ligne 58 : `const [growthEntries` state
- Ligne 82 : `GrowthEntry.filter` dans Promise.all
- Ligne 90 : `setGrowthEntries(growthData || [])`
- Ligne 173 : `computeHealthScore(records, dog, [...growthEntries, ...dailyLogs])`
- Ligne 178 : `growthEntries` dans deps useMemo

Pattern-proactive : un seul appel `computeHealthScore` existe dans Dashboard.jsx (ligne 173) — pas d'autre instance manquee.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b4ca71d | feat(02-03): unify wellness score sources in Dashboard |

## Deviations from Plan

None — plan execute exactement comme ecrit.

## Known Stubs

None — donnees reelles chargees depuis l'API, pas de placeholder.

## Self-Check: PASSED

- [x] `src/pages/Dashboard.jsx` modifie et commit b4ca71d verifie
- [x] Toutes les acceptances criteria du plan validees par grep
- [x] Un seul appel computeHealthScore dans Dashboard (pattern-proactif confirme)
