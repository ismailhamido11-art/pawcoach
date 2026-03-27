---
phase: 03-flux-deconnectes
plan: "01"
subsystem: ui
tags: [react, cache, home, activite, profile]

# Dependency graph
requires:
  - phase: 02-donnees-fausses
    provides: Donnees corrigees (repas/eau, poids/BCS, checkin) que le cache Home doit propager
provides:
  - invalidateHome appele dans Activite.jsx apres chaque balade loggee (FLOW-01)
  - invalidateHome appele dans Profile.jsx apres chaque switch de chien (FLOW-02)
affects:
  - 03-flux-deconnectes (plans suivants)
  - UX Home (DailyProgress reflète desormais les vraies stats sans rechargement manuel)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cache invalidation explicite via useHomeCache().invalidateHome() apres toute mutation de donnee affectee par Home"

key-files:
  created: []
  modified:
    - src/pages/Activite.jsx
    - src/pages/Profile.jsx

key-decisions:
  - "invalidateHome() place en derniere ligne de refreshLogs() — apres setLogs et checkWalkBadges, garantit que le cache est null avant que l'utilisateur revient sur Home"
  - "invalidateHome() place apres localStorage.setItem dans handleSwitchDog — ordre coherent : etat local mis a jour d'abord, puis cache invalide"

patterns-established:
  - "Pattern cache-invalidation-post-mutation : tout appel qui mute des donnees affectant Home doit finir par invalidateHome()"

requirements-completed:
  - FLOW-01
  - FLOW-02

# Metrics
duration: 12min
completed: 2026-03-27
---

# Phase 03 Plan 01: Flux Deconnectes — Cache Home Summary

**Invalidation explicite du cache Home branchee sur deux mutations cles : fin de balade (Activite) et switch de chien (Profile)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-27T17:15:00Z
- **Completed:** 2026-03-27T17:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- FLOW-01 : `Activite.jsx` appelle `invalidateHome()` a la fin de `refreshLogs()` — le cache Home est null apres chaque log de balade, DailyProgress reflete les vraies stats au retour sur Home
- FLOW-02 : `Profile.jsx` appelle `invalidateHome()` dans `handleSwitchDog()` apres `localStorage.setItem` — le cache Home est null immediatement apres un switch de chien
- `HomeCacheContext.jsx` inchange (2 occurrences `invalidateHome` : definition + export) — aucune regression sur le contexte de cache

## Task Commits

Chaque tache commitee atomiquement :

1. **Task 1: FLOW-01 invalidateHome apres balade dans Activite** - `6538d96` (feat)
2. **Task 2: FLOW-02 invalidateHome apres switch de chien dans Profile** - `8e1dabd` (feat)

## Files Created/Modified

- `src/pages/Activite.jsx` — Import `useHomeCache`, destructure `invalidateHome`, appel en fin de `refreshLogs()`
- `src/pages/Profile.jsx` — Import `useHomeCache`, destructure `invalidateHome`, appel en fin de `handleSwitchDog()`

## Decisions Made

- `invalidateHome()` en derniere ligne de `refreshLogs()` — apres `setLogs` et `checkWalkBadges`, garantit que le cache est null avant que l'utilisateur revient sur Home
- `invalidateHome()` apres `localStorage.setItem` dans `handleSwitchDog` — coherence : etat local mis a jour d'abord, cache invalide ensuite

## Deviations from Plan

None — plan execute exactement tel qu'ecrit.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- FLOW-01 et FLOW-02 corriges — cache Home invalide correctement apres les deux principales mutations utilisateur
- Prochaine etape : 03-02 (batch notify et premium refresh selon ROADMAP)
- Aucun bloqueur identifie

---
*Phase: 03-flux-deconnectes*
*Completed: 2026-03-27*
