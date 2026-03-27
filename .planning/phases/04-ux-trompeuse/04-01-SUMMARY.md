---
phase: 04-ux-trompeuse
plan: 01
subsystem: premium-ctas, onboarding
tags: [ux, pricing, dark-pattern, referral, onboarding]
requirements: [UX-02, UX-03]

dependency_graph:
  requires: []
  provides:
    - Honest pricing CTAs in all premium upsell surfaces
    - Clean WelcomeScreen without dead referral UI
  affects:
    - PostTrialSheet.jsx
    - SubscriptionSection.jsx
    - ExerciseDetail.jsx
    - Scan.jsx
    - WelcomeScreen.jsx

tech_stack:
  added: []
  patterns:
    - Text replacement for honest pricing labels

key_files:
  modified:
    - src/components/premium/PostTrialSheet.jsx
    - src/components/profile/SubscriptionSection.jsx
    - src/components/training/ExerciseDetail.jsx
    - src/pages/Scan.jsx
    - src/components/onboarding/WelcomeScreen.jsx

decisions:
  - "SubscriptionSection has two CTA buttons (trial-expired + free plan) — both corrected independently"
  - "WelcomeScreen: base44 and toast imports removed entirely (were only used by handleReferralSubmit)"
  - "PostTrialSheet shows full dual pricing ('7,99 €/mois ou 59,99 €/an') to surface annual option honestly"

metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 04 Plan 01: UX Trompeuse — Prix honnete et suppression parrain Summary

**One-liner:** Replaced 5 misleading "des 5 €/mois" CTAs with accurate 7,99 €/mois pricing and removed dead referral code UI from WelcomeScreen.

## What Was Done

### Task 1: CTAs prix trompeurs corriges (4 fichiers)

Cinq occurrences du prix trompeur "des 5 €/mois" ou "5 EUR/mois" ont ete remplacees dans les surfaces d'upsell premium :

| Fichier | Avant | Apres |
|---------|-------|-------|
| PostTrialSheet.jsx | `S'abonner — a partir de 5 EUR/mois` | `S'abonner — 7,99 €/mois ou 59,99 €/an` |
| SubscriptionSection.jsx (trial expire) | `S'abonner · des 5 €/mois` | `S'abonner · 7,99 €/mois` |
| SubscriptionSection.jsx (plan gratuit) | `Passer Premium · des 5 €/mois` | `Passer Premium · a partir de 7,99 €/mois` |
| ExerciseDetail.jsx | `Passer Premium · des 5 €/mois` | `Passer Premium · a partir de 7,99 €/mois` |
| Scan.jsx | `Passer Premium · des 5 €/mois` | `Passer Premium · a partir de 7,99 €/mois` |

Note : Premium.jsx n'a pas ete modifie — le prix 5 €/mois y est correctement contextualise avec le plan annuel.

### Task 2: Code parrain supprime de WelcomeScreen

Suppression complete du bloc code parrain dans `WelcomeScreen.jsx` :

- 3 states supprimes : `referralCode`, `referralSaved`, `showReferral`
- Fonction `handleReferralSubmit` supprimee
- Bloc JSX conditionnel supprime (Gift button + input CODE PARRAIN + bouton OK)
- Imports nettoyes : `Gift`, `Check`, `base44`, `toast` retires (plus utilises)
- Resultat : WelcomeScreen = photo chien -> titre -> description -> badge trial -> CTA "Decouvrir PawCoach"

## Verification

| Critere | Commande | Resultat |
|---------|---------|---------|
| UX-02 : 0 CTA trompeur | `grep "des 5\|5 EUR/mois"` sur 4 fichiers | 0 match (exit 1) |
| UX-02 : 7,99 present | `grep -c "7,99"` sur 4 fichiers | 1, 2, 1, 1 (OK) |
| UX-03 : 0 trace parrain | `grep "parrain\|referral\|Gift"` WelcomeScreen | 0 match (exit 1) |

## Commits

| Task | Hash | Description |
|------|------|-------------|
| Task 1 | e36bfea | fix(04-01): replace misleading '5 €/mois' CTAs with honest 7,99 €/mois price |
| Task 2 | da22794 | fix(04-01): remove dead referral code field from WelcomeScreen |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED
