---
phase: 01-crashs-features-mortes
plan: 04
subsystem: home/fab
tags: [crash-fix, combined-fab, daily-log, cache-invalidation]
requires: []
provides: [CRASH-04-fixed]
affects: [CombinedFAB, HomeCacheContext, DailyProgress]
tech-stack:
  added: []
  patterns: [cache-invalidation-on-log]
key-files:
  modified:
    - src/pages/Home.jsx
decisions:
  - "CombinedFAB place apres </PullToRefresh> avant les sheets — gere son propre positionnement fixed"
  - "onLogSaved={invalidateHome} — invalide le cache Home apres chaque log pour que DailyProgress se rafraichisse"
metrics:
  duration: "< 5 min"
  completed: "2026-03-27"
  tasks: 1
  files: 1
---

# Phase 01 Plan 04: CRASH-04 CombinedFAB Mount Summary

**One-liner:** Import et montage de CombinedFAB dans Home.jsx avec invalidateHome comme callback pour que le FAB log rapide soit visible et connecte au cache.

## What Was Done

`CombinedFAB.jsx` existait dans `src/components/` mais n'etait jamais importe ni monte dans aucune page (CGC confirmait 0 consumer). Le bouton FAB de log rapide (poids, eau, balade) etait completement invisible pour l'utilisateur.

Fix en 2 etapes :
1. `import CombinedFAB from "../components/CombinedFAB"` ajoute apres ChatFAB dans le bloc imports
2. `<CombinedFAB dog={dog} user={user} onLogSaved={invalidateHome} />` monte apres `</PullToRefresh>` et avant les sheets premium

`invalidateHome` etait deja destructure depuis `useHomeCache` — pas de modification supplementaire necessaire.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Importer et monter CombinedFAB dans Home.jsx | 8e4adc2 | src/pages/Home.jsx |

## Verification Results

```
grep "CombinedFAB" Home.jsx       -> ligne 14 (import) + ligne 682 (JSX) OK
grep "onLogSaved={invalidateHome}" -> ligne 685 OK
grep "ChatFAB"                    -> lignes 13 + 677 (toujours present, non modifie)
grep "invalidateHome"             -> lignes 68 (destructure) + 332 + 685 OK
```

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] src/pages/Home.jsx modifie avec import + JSX CombinedFAB (verifie via grep)
- [x] Commit 8e4adc2 existe (verifie via git log)
- [x] ChatFAB intact (non supprime)
- [x] invalidateHome correctement passe comme onLogSaved
