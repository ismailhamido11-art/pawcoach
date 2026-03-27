---
phase: 04-ux-trompeuse
plan: 02
subsystem: ui
tags: [react, sonner, toast, navigation, dashboard, home]

# Dependency graph
requires:
  - phase: 02-donnees-fausses
    provides: Donnees correctes dans DailyLog et Dashboard (prerequis coherence)
provides:
  - UX-01: Reaction symptomes apres check-in — toast secondaire avec bouton "Voir Sante"
  - UX-04: Carte "Tableau de bord" visible sur Home navigant vers Dashboard
affects: [Home.jsx, user-onboarding, dashboard-discoverability]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Toast action pattern: toast(msg, { action: { label, onClick } }) pour Sonner"
    - "Delayed second toast (800ms setTimeout) pour eviter chevauchement visuel"
    - "Card button pattern: w-full bg-gradient rounded-3xl p-4 flex items-center gap-4"

key-files:
  created: []
  modified:
    - src/pages/Home.jsx

key-decisions:
  - "Toast symptomes decale de 800ms pour laisser le premier toast s'afficher partiellement avant le second"
  - "Dashboard card inseree avant Quick Actions (apres DailyProgress) — position visible sans scroll excessif"
  - "StorysetIllustration vet-checkup pour la carte Dashboard — coherent avec illustration feeding existante"
  - "Pas de recalcul des alertes dans Home — simple lien vers Dashboard pour eviter duplication de computeAlerts"

patterns-established:
  - "UX feedback pattern: apres une action utilisateur avec impact sante, proposer un lien contextuel vers la page concernee"
  - "Dashboard discoverability: entree explicite depuis Home via carte visuelle, pas uniquement via navigation cachee"

requirements-completed: [UX-01, UX-04]

# Metrics
duration: 5min
completed: 2026-03-27
---

# Phase 4 Plan 2: UX Trompeuse (symptomes + Dashboard) Summary

**Symptomes cochés dans check-in declenchent maintenant un toast d'action vers Sante, et Dashboard accessible via carte visuelle permanente sur Home**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-27T17:24:00Z
- **Completed:** 2026-03-27T17:25:28Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- UX-01: Apres un check-in avec au moins un symptome coche, un second toast apparait 800ms apres avec bouton "Voir Sante" navigant vers la page Sante
- UX-04: Carte "Tableau de bord" visible sur la Home apres DailyProgress — mentionne vaccins, alertes poids, tendances humeur avec CTA "Voir les alertes"
- Les deux corrections touchent uniquement Home.jsx, zero regression possible sur autres pages

## Task Commits

1. **Task 1: Reaction symptomes apres check-in (UX-01)** - `8295bd6` (feat)
2. **Task 2: Carte Dashboard accessible depuis Home (UX-04)** - `d8bad97` (feat)

**Plan metadata:** (docs commit a suivre)

## Files Created/Modified
- `src/pages/Home.jsx` - handleCheckin: condition symptoms.length > 0 avec toast secondaire + carte Dashboard button avant Quick Actions

## Decisions Made
- Toast symptomes decale de 800ms pour ne pas chevaucher le premier toast "Check-in enregistre !"
- Dashboard card inseree entre DailyProgress et Quick Actions — premier emplacement visible apres les metriques du jour
- Pas de recalcul computeAlerts dans Home — simple lien vers Dashboard (evite duplication logique SmartAlerts.jsx)

## Deviations from Plan

None - plan execute exactement tel qu'ecrit.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- UX-01 et UX-04 corriges — les deux UX trompeuses majeures de Phase 04 sont traitees
- Plan 04-01 (prix trompeur + code parrain) et Plan 04-02 (symptomes + Dashboard) constituent les 4 UX trompeuses de v7.0
- Phase 05 (bugs techniques) peut demarrer

---
*Phase: 04-ux-trompeuse*
*Completed: 2026-03-27*
