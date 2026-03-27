---
phase: 02-bugs-fonctionnels
plan: "01"
subsystem: backend-frontend
tags: [bugfix, diagnostic, navigation, email, i18n]
dependency_graph:
  requires: []
  provides: [BUG-01-fix, BUG-03-fix, BUG-04-fix, BUG-05-fix]
  affects: [finalDiagnosis, recommendations, trialExpiryReminder, UserNotRegisteredError]
tech_stack:
  added: []
  patterns: [surgical-one-liner-fix, comment-explains-why]
key_files:
  created: []
  modified:
    - base44/functions/finalDiagnosis/entry.ts
    - src/utils/recommendations.js
    - base44/functions/trialExpiryReminder/entry.ts
    - src/components/UserNotRegisteredError.jsx
decisions:
  - "finalDiagnosis does not guard/decrement credits — preDiagnosis owns the full diagnostic flow credit"
  - "FindVet page does not exist; diagnosis_followup routes to Sante with tab=findvet param"
  - "UserNotRegisteredError rebuilt with base44.auth.logout() — no other logout mechanism available in error screen"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 3
  files_modified: 4
---

# Phase 02 Plan 01: Bugs Fonctionnels Chirurgicaux Summary

4 bugs critiques corriges par modifications chirurgicales (1-5 lignes chacune) : double-decrement credit diagnostic, lien 404 FindVet, texte email mensonger, ecran erreur en anglais sans issue de secours.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Retirer decrement credit finalDiagnosis (BUG-01) | 8638a5c | base44/functions/finalDiagnosis/entry.ts |
| 2 | Corriger lien FindVet vers Sante (BUG-03) | 80b809a | src/utils/recommendations.js |
| 3 | Email 5->10 messages/jour + UserNotRegisteredError FR (BUG-04 + BUG-05) | a4c59e9 | base44/functions/trialExpiryReminder/entry.ts, src/components/UserNotRegisteredError.jsx |

## Changes Made

### BUG-01 — Double-decrement credit diagnostic
**File:** `base44/functions/finalDiagnosis/entry.ts`

Suppression du bloc complet de quota check + decrement (lignes 13-35). Remplace par un commentaire explicatif. preDiagnosis reste l'unique point de decrement pour tout le flow diagnostic.

### BUG-03 — Lien 404 FindVet
**File:** `src/utils/recommendations.js` ligne 197

`page: "FindVet"` -> `page: "Sante", tab: "findvet"`. FindVet n'existe pas dans pages.config.js. La page Sante a un onglet findvet accessible via query param.

### BUG-05 — Email trial J-1 incorrect
**File:** `base44/functions/trialExpiryReminder/entry.ts` ligne 77

`5 messages/jour` -> `10 messages/jour`. La limite reelle du chat IA est 10/jour pour les non-premium.

### BUG-04 — Ecran erreur en anglais
**File:** `src/components/UserNotRegisteredError.jsx`

Remplacement complet : titre, corps, liste en francais. Ajout import `base44` et bouton "Se deconnecter" branche sur `base44.auth.logout()`. Structure visuelle (layout, icone amber SVG, classes Tailwind) preservee.

## Deviations from Plan

None - plan executed exactly as written.

## Success Criteria Verification

- [x] Un diagnostic complet consomme exactement 1 credit — `grep -c "actions_remaining" finalDiagnosis/entry.ts` = 0
- [x] recommendations.js ne contient plus aucune reference a "FindVet" — `grep -c "FindVet" recommendations.js` = 0
- [x] Email trial J-1 contient "10 messages/jour" — verified present
- [x] UserNotRegisteredError est en francais avec base44.auth.logout() — `grep -c "logout"` = 1

## Self-Check: PASSED

Files verified present:
- base44/functions/finalDiagnosis/entry.ts — FOUND (modified)
- src/utils/recommendations.js — FOUND (modified)
- base44/functions/trialExpiryReminder/entry.ts — FOUND (modified)
- src/components/UserNotRegisteredError.jsx — FOUND (modified)

Commits verified:
- 8638a5c — BUG-01 fix
- 80b809a — BUG-03 fix
- a4c59e9 — BUG-04 + BUG-05 fix
