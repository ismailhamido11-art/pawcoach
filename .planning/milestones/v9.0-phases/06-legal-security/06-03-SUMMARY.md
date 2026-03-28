---
phase: 06-legal-security
plan: 03
subsystem: legal-ux
tags: [rgpd, eu-consumer-rights, disclaimer, export-data, premium, settings]
dependency_graph:
  requires: []
  provides: [disclosure-renewal, vet-disclaimer, data-export]
  affects: [Premium.jsx, DiagnosisContent.jsx, SettingsSection.jsx]
tech_stack:
  added: []
  patterns: [Blob download, Promise.all entity fetch, amber banner pattern]
key_files:
  created: []
  modified:
    - src/pages/Premium.jsx
    - src/components/sante/DiagnosisContent.jsx
    - src/components/profile/SettingsSection.jsx
decisions:
  - "Deux CTA dans Premium.jsx (trial et non-trial) — tous deux mis a jour avec disclosure renouvellement auto"
  - "Banner disclaimer DiagnosisContent insere avant le hero card, utilise pattern amber identique a Chat.jsx"
  - "Export RGPD: Promise.all sur 5 entites, Blob JSON download sans passer par le serveur"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-27T23:01:01Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 06 Plan 03: Disclosures legales + Export RGPD Summary

One-liner: Disclosure renouvellement automatique sous les 2 CTA Premium, disclaimer vétérinaire dans DiagnosisContent, bouton export JSON RGPD Art. 20 dans SettingsSection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Disclosure renouvellement auto + disclaimer vétérinaire | 996d90e | Premium.jsx, DiagnosisContent.jsx |
| 2 | Bouton export données RGPD | ef9dd81 | SettingsSection.jsx |

## What Was Built

### FIX-06 — EU Consumer Rights Directive (Premium.jsx)

Les deux blocs reassurance de Premium.jsx ont été enrichis avec la mention de renouvellement automatique et le montant exact facturé:

- CTA trial (lignes ~332-333): texte conditionnel `isOnTrial` avec montant EUR dynamique selon `plan`
- CTA non-trial (lignes ~510-512): même pattern pour le second bouton "Débloquer tout PawCoach"

Texte: "Renouvellement automatique à chaque période. Résiliation à tout moment depuis ton profil. Facturation mensuelle de 7,99 EUR. / Facturation annuelle de 59,99 EUR. Paiement sécurisé via Stripe."

### FIX-07 — Disclaimer vétérinaire (DiagnosisContent.jsx)

Banner amber inséré en premier enfant du composant DiagnosisContent, avant le hero card "Bilan de préparation visite". Pattern identique au disclaimer de Chat.jsx (bg-amber-50, border-amber-200, texte amber-800).

Texte: "Ces informations sont fournies à titre indicatif uniquement. Elles ne remplacent pas l'avis d'un vétérinaire qualifié. En cas de doute, consultez votre vétérinaire."

### FIX-05 — Export données RGPD Art. 20 (SettingsSection.jsx)

- Import `Download` ajouté aux imports lucide-react
- Import des 5 entités: `Dog, DailyLog, HealthRecord, DailyCheckin, FoodScan`
- État `exporting` + fonction `handleExport` asynchrone
- `Promise.all` sur les 5 entités, export JSON daté (`pawcoach-export-YYYY-MM-DD.json`)
- Blob MIME `application/json`, download via `<a>` créé dynamiquement, URL révoquée après 5s
- Bouton dans section Confidentialité avec état loading (Loader2 animate-spin) et toast succès/erreur
- Pas de régression sur suppression de compte ni logout

## Deviations from Plan

None — plan exécuté exactement comme spécifié. Les deux CTA détectés dans Premium.jsx correspondaient bien à la description du plan (trial aux lignes 286-340, non-trial aux lignes 480-520).

## Known Stubs

None — les trois features sont pleinement fonctionnelles. Les valeurs de montant EUR sont dynamiques (pas de valeurs hardcodées non-fonctionnelles). L'export appelle les vraies entités Base44.
