---
phase: 04-independent-fixes
plan: "04"
subsystem: health-score, pdf-export
tags: [vet, pdf, health-score, next-vet-appointment]
dependency_graph:
  requires: []
  provides: [vetScore-bonus, pdf-vet-header, pdf-next-rdv]
  affects: [computeHealthScore, DownloadHealthPDF]
tech_stack:
  added: []
  patterns: [optional-chaining, Math.min-cap, jsPDF-inline-text]
key_files:
  created: []
  modified:
    - src/utils/healthStatus.js
    - src/components/vet/DownloadHealthPDF.jsx
decisions:
  - "next_vet_appointment bonus capped a 25 (pas de double boost si visite recente + RDV programme)"
  - "Vet header Y=38 si chip present, Y=33 sinon — generated line reste a Y=40"
  - "else if (dog.next_vet_appointment) cree section minimale Veterinaire si aucune visite passee"
metrics:
  duration: 4min
  completed_date: "2026-03-11"
  tasks_completed: 2
  files_modified: 2
---

# Phase 04 Plan 04: Vet Fields — Score Sante et PDF Summary

**One-liner:** Bonus vetScore +15pts pour RDV vet programme dans les 30j + section veterinaire complete (nom, ville, prochain RDV) dans le PDF sante.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Ajouter next_vet_appointment au vetScore | bb2424f | src/utils/healthStatus.js |
| 2 | Ajouter vet_name, vet_city et next_vet_appointment dans le PDF | 187c0a7 | src/components/vet/DownloadHealthPDF.jsx |

## What Was Built

### Task 1 — healthStatus.js

Dans `computeHealthScore`, apres le calcul vetScore base sur les visites passees, ajout d'un bloc bonus :

- Si `dog.next_vet_appointment` est valide ET dans les 30 prochains jours : `vetScore = Math.min(25, vetScore + 15)`
- Un RDV programme sans visite recente donne 15/25 (pas encore fait, mais demarche proactive)
- Un RDV programme avec visite recente (<6 mois, deja a 25) reste plafonne a 25
- Signature `computeHealthScore(records, dog, extraWeightSources = [])` inchangee — 12 consumers non impactes

### Task 2 — DownloadHealthPDF.jsx

Deux ajouts independants :

**Header PDF :** Apres `chip_number` (Y=33), si `dog.vet_name` ou `dog.vet_city` sont renseignes, affichage `Veterinaire : [nom] — [ville]` en couleur `(200,220,210)` a Y=38 (chip present) ou Y=33 (sans chip). La ligne "Genere le..." reste a Y=40.

**Section visites veterinaire :**
- Quand `vetVisits.length > 0` : apres le tableau, si `dog.next_vet_appointment` est renseigne, ligne verte `Prochain RDV : [date formatee]`
- Quand `vetVisits.length === 0` mais `dog.next_vet_appointment` existe : section minimale "Veterinaire" avec la ligne prochain RDV (via `else if`)

## Deviations from Plan

None — plan execute exactement tel qu'ecrit.

## Success Criteria Verification

- [x] healthStatus.js : bonus vetScore +15 plafonne a 25 quand next_vet_appointment dans les 30j
- [x] DownloadHealthPDF.jsx : header contient "Veterinaire : [nom] — [ville]" si champs renseignes
- [x] DownloadHealthPDF.jsx : prochain RDV affiche dans section visites (ou section minimale si aucune visite)
- [x] Signature computeHealthScore inchangee — aucun consumer casse

## Self-Check: PASSED

- src/utils/healthStatus.js modifie : `next_vet_appointment` present (verifie via grep)
- src/components/vet/DownloadHealthPDF.jsx modifie : `vet_name`, `vet_city`, `next_vet_appointment` presents (verifie via grep)
- Commits bb2424f et 187c0a7 existent dans git log
