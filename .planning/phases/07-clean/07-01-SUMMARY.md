---
phase: "07"
plan: "01"
name: "CLEAN"
subsystem: "cleanup"
tags: [cleanup, deps, refactor, performance, security]
dependency_graph:
  requires: [phase-06-perf]
  provides: [clean-codebase, idempotent-webhook, parallel-db-queries]
  affects: [package.json, stripeWebhook, walkReminder, scan-components, hooks]
tech_stack:
  added: []
  patterns: [idempotency-check, promise-all-parallelism, component-colocation]
key_files:
  created:
    - .planning/phases/07-clean/07-01-PLAN.md
  modified:
    - package.json
    - src/pages/Scan.jsx
    - base44/functions/stripeWebhook/entry.ts
    - base44/functions/walkReminder/entry.ts
  deleted:
    - src/pages/LabelScanMode.jsx (moved)
    - src/hooks/useReducedMotion.js (duplicate removed)
  moved:
    - src/pages/LabelScanMode.jsx -> src/components/scan/LabelScanMode.jsx
decisions:
  - "Garder cmdk/vaul/input-otp : utilises dans ui/ (shadcn) — ne pas casser les composants shadcn meme si non importes ailleurs"
  - "Idempotency par comparaison d etat (is_premium + stripe_subscription_id) plutot que Set en memoire (Deno stateless)"
  - "useReducedMotion custom supprime : zero import — tous les fichiers utilisent framer-motion directement"
  - "DailyLog queries parallelisees via Promise.all, email sends restes sequentiels (acceptable)"
metrics:
  duration: "~15 min"
  completed: "2026-03-27"
  tasks_completed: 5
  files_changed: 6
---

# Phase 7 Plan 1: CLEAN Summary

**One-liner:** Suppression de 2 deps inutilisees, relocalisation de LabelScanMode, idempotency Stripe, deduplication hook, parallelisation DailyLog.

## Tasks Completed

| Task | Requirement | Action | Files |
|------|-------------|--------|-------|
| 1 | CLEAN-01 | Supprime @hello-pangea/dnd et @stripe/react-stripe-js | package.json |
| 2 | CLEAN-02 | Deplace LabelScanMode vers src/components/scan/ | src/pages/Scan.jsx, src/components/scan/LabelScanMode.jsx |
| 3 | CLEAN-03 | Ajoute idempotency checks dans stripeWebhook | base44/functions/stripeWebhook/entry.ts |
| 4 | CLEAN-04 | Supprime src/hooks/useReducedMotion.js (doublon inutilise) | src/hooks/useReducedMotion.js |
| 5 | CLEAN-05 | Parallelise DailyLog.filter avec Promise.all dans walkReminder | base44/functions/walkReminder/entry.ts |

## Commits

| Hash | Message |
|------|---------|
| 45e7134 | chore(07-01): remove unused npm deps @hello-pangea/dnd and @stripe/react-stripe-js |
| 2c57cc4 | refactor(07-01): move LabelScanMode.jsx to src/components/scan/ |
| d7ff486 | fix(07-01): add idempotency checks to stripeWebhook |
| e920522 | refactor(07-01): remove duplicate useReducedMotion hook |
| 2ca029e | perf(07-01): parallelize DailyLog queries in walkReminder with Promise.all |

## Decisions Made

1. **cmdk/vaul/input-otp conserves** : Ces deps sont dans `src/components/ui/` (shadcn). La regle est claire : NE PAS supprimer si un composant ui/ les utilise. Meme si `command.jsx`, `drawer.jsx`, `input-otp.jsx` ne sont pas importes ailleurs dans l'app aujourd'hui, ce sont des composants shadcn qui peuvent etre actives a tout moment.

2. **Idempotency par comparaison d'etat** : Deno est stateless (pas de memoire entre invocations). Un Set en memoire serait inefficace. La solution choisie compare l'etat actuel de l'utilisateur dans la DB (`is_premium` + `stripe_subscription_id`) — zero infrastructure additionnelle, zero risk de faux positif.

3. **useReducedMotion.js supprime** : Apres verification exhaustive via grep, zero fichier n'importe depuis `src/hooks/useReducedMotion.js`. Tous les 4 fichiers qui utilisent `useReducedMotion` l'importent de `framer-motion`. Le fichier custom etait un residuel d'un refactoring anterieur.

4. **Email sends sequentiels conserves** : Les requetes DailyLog sont parallelisees (gain de latence O(N) -> O(1)), mais les SendEmail restent sequentiels. Envoyer les emails en parallele pourrait saturer le quota d'envoi de Base44. Comportement conservateur correct.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] src/components/scan/LabelScanMode.jsx exists
- [x] src/pages/LabelScanMode.jsx deleted
- [x] src/pages/Scan.jsx imports from ../components/scan/LabelScanMode
- [x] src/hooks/useReducedMotion.js deleted
- [x] package.json: @hello-pangea/dnd absent, @stripe/react-stripe-js absent
- [x] stripeWebhook: idempotency checks present (grep "Idempotent skip" confirmed)
- [x] walkReminder: Promise.all for DailyLog present (grep "Promise.all" confirmed)
- [x] All commits verified via git log

## Note

Le premier commit CLEAN-01 (45e7134) avait ecrit en memoire mais pas persiste sur disque (bug outil Edit sur ce fichier). Corrige par Write complet du fichier — commit bd8b1e6 est la version effective sur disque. Le commit 45e7134 reste dans l'historique mais represente un etat intermediaire non effectif.
