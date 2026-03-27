---
phase: 03-scalabilite-premium
plan: "02"
subsystem: home-stability
tags: [resilience, premium, stripe, api-key, promise-all]
dependency_graph:
  requires: []
  provides: [SCALE-02, SCALE-03, PREM-01]
  affects: [src/pages/Home.jsx, base44/functions/weeklyInsightGenerate/entry.ts]
tech_stack:
  added: []
  patterns:
    - Promise.all avec .catch(() => []) par requete individuelle
    - Polling setInterval avec maxAttempts pour activation premium post-Stripe
    - Early return guard sur variable d'environnement manquante
key_files:
  modified:
    - src/pages/Home.jsx
    - base44/functions/weeklyInsightGenerate/entry.ts
decisions:
  - Polling 2s x 5 = 10s max (pas de retry infini) avec fallback toast si webhook lent
  - Early return weeklyInsight avant boucle dogs (pas apres) pour eviter tout work inutile
metrics:
  duration: "8 minutes"
  completed: "2026-03-27"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
---

# Phase 03 Plan 02: Home Stability Fixes Summary

**One-liner:** Protection .catch sur 11 requetes Promise.all Home, polling Stripe post-paiement 2s/10s, guard early-return OPENROUTER_API_KEY dans weeklyInsightGenerate.

## What Was Built

Trois fixes de stabilite dans Home.jsx et weeklyInsightGenerate/entry.ts :

1. **fetchDogData resilience** : Les 7 requetes non protegees du Promise.all recoit desormais `.catch(() => [])`. Un echec reseau sur une entite (ex: FoodScan, HealthRecord) ne bloque plus le chargement complet de la Home — les autres donnees s'affichent normalement.

2. **Polling premium post-Stripe** : Apres redirect `/?premium=success`, l'app poll `base44.auth.me()` toutes les 2 secondes pendant 10 secondes max. Des que `is_premium=true` est detecte, l'UI est mise a jour immediatement et le toast de bienvenue s'affiche. Si le webhook Stripe tarde au-dela de 10s, un toast alternatif est affiche.

3. **Guard API key weeklyInsightGenerate** : Si `OPENROUTER_API_KEY` est absent, la fonction retourne immediatement `{ ok: true, generated: 0, reason: "no_api_key" }` avant toute iteration sur les chiens. Aucun WeeklyInsight vide n'est cree.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | fetchDogData — .catch sur 7 requetes | 7016673 | src/pages/Home.jsx |
| 2 | handlePremiumSuccess — polling base44.auth.me() | 7016673 | src/pages/Home.jsx |
| 3 | weeklyInsightGenerate — early return si !apiKey | 7016673 | base44/functions/weeklyInsightGenerate/entry.ts |

## Verification Results

- `grep -c "catch(() => \[\])" src/pages/Home.jsx` → **11** (toutes les requetes protegees)
- `setInterval`, `maxAttempts`, `auth.me()`, `is_premium` presents dans handlePremiumSuccess
- `if (!apiKey)` + `return Response.json({ ..., reason: "no_api_key" })` present ligne 26-29

## Deviations from Plan

None — plan execute exactement tel qu'ecrit.

## Known Stubs

None — aucune donnee hardcodee ou placeholder introduit.

## Self-Check: PASSED

- `src/pages/Home.jsx` modifie et commite : verifie (git log 7016673)
- `base44/functions/weeklyInsightGenerate/entry.ts` modifie et commite : verifie (git log 7016673)
- 11 `.catch(() => [])` dans Home.jsx : verifie (grep retourne 11)
- polling present avec setInterval/maxAttempts : verifie
- early return no_api_key present : verifie
