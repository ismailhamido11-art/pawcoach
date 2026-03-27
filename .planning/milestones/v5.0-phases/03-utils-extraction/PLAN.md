---
phase: "03"
plan: "01"
type: "auto"
autonomous: true
requirements: [REFAC-01, REFAC-02, REFAC-03, REFAC-04]
---

# Phase 03 — Utils Extraction

## Objectif
Eliminer les duplications de code utilitaire entre les composants : constantes de date en français, helpers de programme d'entraînement, CustomTooltip Recharts, calculs d'âge et de semaine.

## Contexte
Plusieurs fichiers (AITrainingProgram, ActiveProgramCards, Dashboard, Scan, GrowthTrackerContent, DogPublicProfile, NutritionMealPlan, SectionVaccins, DownloadHealthPDF) implémentaient des versions locales légèrement divergentes de fonctions communes.

## Tâches

### Task 1 — Enrichir dateHelpers.js [auto]
Ajouter à `src/utils/dateHelpers.js` :
- `JOURS_COURTS` : tableau des jours courts en français (indexé dimanche)
- `MOIS_FR` : tableau des mois courts en français
- `addDaysToDate(dateStr, days)` : ajoute N jours à une date string, retourne Date
- `formatDateFr(date)` : formate un objet Date en "lun. 3 jan."
- `getWeekStart()` : retourne la date ISO du lundi de la semaine courante
- `getAge(birthDate)` : âge en "X mois" ou "X ans"
- `fmtDate(d)` : format court fr-FR ("03/01/2025")
- `fmtDateLong(d)` : format long fr-FR ("3 janvier 2025")

### Task 2 — Créer programHelpers.js [auto]
Créer `src/utils/programHelpers.js` avec :
- `ACTIVITY_ICONS` : mapping type activité → { Icon, color } (version fusionnée incluant "repos actif")

### Task 3 — Créer chartHelpers.jsx [auto]
Créer `src/utils/chartHelpers.jsx` avec :
- `CustomTooltip` : composant Recharts générique (active/payload/label)

### Task 4 — Remplacer toutes les implémentations locales [auto]
Fichiers modifiés :
- `src/components/activite/AITrainingProgram.jsx` : ACTIVITY_ICONS, JOURS_COURTS, MOIS_FR, addDaysToDate, formatDateFr
- `src/components/home/ActiveProgramCards.jsx` : SESSION_ICONS+ACTIVITY_ICONS fusionnés, JOURS_COURTS, MOIS_FR, addDaysToDate, formatDateFr
- `src/pages/Dashboard.jsx` : CustomTooltip, getWeekStartDash → getWeekStart
- `src/components/sante/GrowthTrackerContent.jsx` : CustomTooltip
- `src/pages/Scan.jsx` : getWeekStart (Sunday-start bugué → Monday-start)
- `src/pages/DogPublicProfile.jsx` : getAge
- `src/components/nutrition/NutritionMealPlan.jsx` : getAge
- `src/components/notebook/SectionVaccins.jsx` : fmtDate
- `src/components/vet/DownloadHealthPDF.jsx` : fmtDate → fmtDateLong

## Critères de succès
- [ ] 0 définition locale de addDaysToDate, formatDateFr, JOURS_COURTS, MOIS_FR
- [ ] 0 définition locale de getWeekStart
- [ ] 0 définition locale de CustomTooltip (Recharts)
- [ ] 0 définition locale de getAge, fmtDate
- [ ] ACTIVITY_ICONS unique dans programHelpers.js
- [ ] Tous les imports pointent vers les utils partagés
