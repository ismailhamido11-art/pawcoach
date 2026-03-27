---
phase: 06-legal-security
plan: 02
subsystem: onboarding, analytics
tags: [rgpd, consent, analytics, privacy, age-verification]
requirements: [FIX-03, FIX-04, FIX-08]
dependency_graph:
  requires: []
  provides: [gdpr-consent-gate, analytics-consent-gate]
  affects: [src/pages/Onboarding.jsx, src/utils/analytics.js]
tech_stack:
  added: []
  patterns: [localStorage-opt-in, consent-guard, screen-extraction]
key_files:
  created: []
  modified:
    - src/utils/analytics.js
    - src/pages/Onboarding.jsx
decisions:
  - "Consent screen extracted as dedicated showConsent state rather than adding a virtual INTERVIEW_STEPS entry — cleaner separation of concerns"
  - "handleNext() split: navigation stays in handleNext(), Dog.create() extracted to handleFinish() — enables consent guard without restructuring the 10-step interview"
  - "Analytics consent set to true immediately before Dog.create() — ensures consent recorded before any data persisted"
metrics:
  duration: "12min"
  completed: "2026-03-27T23:02:55Z"
  tasks: 2
  files: 2
---

# Phase 06 Plan 02: RGPD Consent + Analytics Gate Summary

Consentement RGPD bloquant dans l'onboarding (étape finale dédiée avant Dog.create()) et gate de consentement analytics dans trackEvent() via localStorage opt-in.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Gate analytics dans analytics.js | 769cf11 | src/utils/analytics.js |
| 2 | Checkbox RGPD + âge dans Onboarding avant Dog.create() | c6a31b0 | src/pages/Onboarding.jsx |

## What Was Built

### Task 1 — analytics.js consent gate

- Ajout de `CONSENT_KEY = "pawcoach_analytics_consent"` (localStorage key)
- Export de `setAnalyticsConsent(granted)` : écrit/supprime la clé selon le choix
- Export de `hasAnalyticsConsent()` : retourne `true` si l'utilisateur a explicitement opté
- Guard dans `trackEvent()` : `if (!hasAnalyticsConsent()) return;` — aucun event stocké ni loggué sans consentement

### Task 2 — Onboarding RGPD consent screen

- Import de `setAnalyticsConsent` depuis analytics.js
- Import de `ShieldCheck` (lucide-react)
- Nouveaux états : `showConsent`, `gdprConsent`, `consentError`
- `handleNext()` refactorisé : sur la dernière étape interview → `setShowConsent(true)` (plus de Dog.create ici)
- `handleFinish()` extrait : contient toute la logique Dog.create() avec guard RGPD en tête
- Guard : `if (!gdprConsent) { setConsentError(true); return; }` avant le moindre appel réseau
- `setAnalyticsConsent(true)` appelé juste avant `Dog.create()`
- Écran consent complet : icône ShieldCheck, checkbox "J'ai 16 ans ou plus...", liens /Privacy et /Terms, bouton disabled si non coché, message d'erreur si tentative sans consentement
- Bouton retour vers l'interview (chevron gauche) si l'utilisateur veut relire ses réponses

## Success Criteria Verification

- [x] `trackEvent()` no-op si `localStorage("pawcoach_analytics_consent") !== "true"` — guard en ligne 50
- [x] Onboarding : étape finale avec checkbox "J'ai 16 ans + j'accepte PdC + CGU" — showConsent screen
- [x] Dog.create() impossible sans `gdprConsent === true` (button disabled + guard dans handleFinish)
- [x] `setAnalyticsConsent(true)` appelé avant `Dog.create()` — ligne 257
- [x] Liens vers /Privacy et /Terms dans la checkbox — createPageUrl("Privacy") + createPageUrl("Terms")

## Deviations from Plan

### Auto-applied — Architecture consent screen

**Deviation:** Le plan suggérait d'utiliser `step === INTERVIEW_STEPS.length` comme condition dans le rendu existant. Implémenté avec un état `showConsent` séparé et un rendu conditionnel dédié.

**Raison:** L'approche par step aurait nécessité de modifier `canNext`, `progress`, le header step counter ("X/10"), et la logique `handleNext`. L'état `showConsent` est plus propre et n'altère pas du tout les 10 étapes interview.

**Deviation 2:** `handleNext()` n'est plus `async` — Dog.create() extrait dans `handleFinish()`. Plus simple, pas de confusion entre navigation et sauvegarde.

Aucune régression : les 10 étapes interview fonctionnent exactement comme avant. Le flow est désormais : Interview (10 étapes) → Consent screen → handleFinish() → WelcomeScreen.

## Known Stubs

Aucun stub. Les liens vers /Privacy et /Terms dépendent de 06-01 (pages créées dans le plan précédent).

## Self-Check: PASSED

- analytics.js : FOUND
- Onboarding.jsx : FOUND
- 06-02-SUMMARY.md : FOUND
- commit 769cf11 (analytics gate) : FOUND
- commit c6a31b0 (RGPD consent screen) : FOUND
