---
phase: "03"
plan: "01"
subsystem: "utils"
tags: [refactoring, utils, dateHelpers, programHelpers, chartHelpers, deduplication]
requires: []
provides: [dateHelpers-extended, programHelpers, chartHelpers]
affects: [AITrainingProgram, ActiveProgramCards, Dashboard, GrowthTrackerContent, Scan, DogPublicProfile, NutritionMealPlan, SectionVaccins, DownloadHealthPDF]
tech-stack:
  added: []
  patterns: [shared-utils, single-source-of-truth]
key-files:
  created:
    - src/utils/programHelpers.js
    - src/utils/chartHelpers.jsx
  modified:
    - src/utils/dateHelpers.js
    - src/components/activite/AITrainingProgram.jsx
    - src/components/home/ActiveProgramCards.jsx
    - src/pages/Dashboard.jsx
    - src/components/sante/GrowthTrackerContent.jsx
    - src/pages/Scan.jsx
    - src/pages/DogPublicProfile.jsx
    - src/components/nutrition/NutritionMealPlan.jsx
    - src/components/notebook/SectionVaccins.jsx
    - src/components/vet/DownloadHealthPDF.jsx
decisions:
  - "fmtDate dans DownloadHealthPDF aliasée via const pour préserver les appels existants sans réécriture"
  - "ACTIVITY_ICONS fusionnée depuis AITrainingProgram (version complète avec repos actif) — SESSION_ICONS dans ActiveProgramCards supprimée"
  - "getAge NutritionMealPlan remplacée : ancienne formule approximative (30 jours/mois) → calcul précis par années calendaires"
  - "getWeekStart dans Scan.jsx corrigée (bug Sunday-start : lundi = +1 quand getDay()=1, mais dimanche = +1 aussi donc mardi incorrect)"
metrics:
  duration: "15 min"
  completed: "2026-03-27"
  tasks: 4
  files: 12
requirements: [REFAC-01, REFAC-02, REFAC-03, REFAC-04]
---

# Phase 03 Plan 01: Utils Extraction Summary

## One-liner
Extraction de 8 fonctions/constantes dupliquées vers 3 fichiers utils partagés, avec correction d'un bug getWeekStart Sunday-start dans Scan.jsx.

## Ce qui a été fait

### Fichiers créés
- **`src/utils/programHelpers.js`** : `ACTIVITY_ICONS` (6 types d'activité, version complète avec "repos actif")
- **`src/utils/chartHelpers.jsx`** : `CustomTooltip` Recharts générique (active/payload/label/unit)

### Fichiers enrichis
- **`src/utils/dateHelpers.js`** : +8 exports : `JOURS_COURTS`, `MOIS_FR`, `addDaysToDate`, `formatDateFr`, `getWeekStart`, `getAge`, `fmtDate`, `fmtDateLong`

### Remplacements effectués (9 fichiers)
| Fichier | Fonctions remplacées |
|---------|---------------------|
| AITrainingProgram.jsx | ACTIVITY_ICONS, JOURS_COURTS, MOIS_FR, addDaysToDate, formatDateFr |
| ActiveProgramCards.jsx | SESSION_ICONS+ACTIVITY_ICONS, JOURS_COURTS, MOIS_FR, addDaysToDate, formatDateFr |
| Dashboard.jsx | CustomTooltip, getWeekStartDash |
| GrowthTrackerContent.jsx | CustomTooltip |
| Scan.jsx | getWeekStart (bugué → corrigé) |
| DogPublicProfile.jsx | getAge |
| NutritionMealPlan.jsx | getAge |
| SectionVaccins.jsx | fmtDate |
| DownloadHealthPDF.jsx | fmtDate (via alias fmtDateLong) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Correction du getWeekStart Sunday-start dans Scan.jsx**
- **Found during:** Task 4 (analyse de l'implémentation locale)
- **Issue:** `d.setDate(d.getDate() - d.getDay() + 1)` — quand getDay()=0 (dimanche), donne `-0+1=+1`, ce qui décale au mardi suivant au lieu du lundi précédent.
- **Fix:** Remplacement par `getWeekStart()` de dateHelpers qui utilise `day === 0 ? -6 : 1 - day` (correct pour tous les jours).
- **Files modified:** src/pages/Scan.jsx
- **Commit:** a981aaa

**2. [Rule 2 - Amélioration] getAge NutritionMealPlan : formule précise**
- **Found during:** Task 4 (comparaison des implémentations)
- **Issue:** Version locale utilisait `Date.now() / (1000*60*60*24*30)` — approximatif (ignore longueur réelle des mois).
- **Fix:** Remplacement par la version partagée utilisant `getFullYear()` + `getMonth()` pour des mois/années calendaires exacts.
- **Files modified:** src/components/nutrition/NutritionMealPlan.jsx

**3. [Rule 2 - Architecture] SESSION_ICONS supprimée dans ActiveProgramCards**
- **Found during:** Task 4 (ActiveProgramCards avait SESSION_ICONS sans "repos actif" et ACTIVITY_ICONS avec)
- **Fix:** Les deux objets fusionnés dans ACTIVITY_ICONS partagée. Fallback `SESSION_ICONS[actType]` supprimé — tous les types sont couverts par ACTIVITY_ICONS.
- **Files modified:** src/components/home/ActiveProgramCards.jsx

## Known Stubs
Aucun stub introduit par cette phase.

## Commit
- `a981aaa` — refactor(03-utils-extraction): extract shared utils — dateHelpers, programHelpers, chartHelpers

## Self-Check: PASSED
- [x] src/utils/dateHelpers.js existe avec 8 nouveaux exports
- [x] src/utils/programHelpers.js créé
- [x] src/utils/chartHelpers.jsx créé
- [x] 9 fichiers consommateurs mis à jour avec imports corrects
- [x] Commit a981aaa existe dans git log
- [x] Aucune définition locale résiduelle (vérifié via grep)
