# Requirements: PawCoach v5.0 Hardening & Refactoring

## Source
Scan codebase post-v4.0 — .planning/codebase/CONCERNS.md (27 mars 2026)

## v5.0 Requirements

### SEC — Securite Ownership

- [ ] **SEC-01**: generateTrainingProgram et analyzeGrowthPhoto verifient que le dogId appartient au user authentifie (C1)
- [ ] **SEC-02**: DogPublicProfile gate par un flag is_public_profile sur l'entite Dog, avec toggle dans DogProfile (C2)
- [ ] **SEC-03**: pawcoachChat limite les queries entites a 90j checkins, 60j logs, 30 scans, 20 records max (C3)

### SCALE — Scalabilite Restante

- [ ] **SCALE-01**: Les 6 fonctions CRON restantes (weeklyInsight, vaccineReminders, medicationReminders, vetVisitReminders, monthlySummary, streakReminder) filtrent au lieu de .list() (H1)
- [ ] **SCALE-02**: Home.jsx FoodScan.filter a une limite de 20 resultats (H2)
- [ ] **SCALE-03**: Les 5 composants frontend avec HealthRecord.filter sans limite ajoutent des caps (H3)

### REFAC — Extraction Utils

- [ ] **REFAC-01**: addDaysToDate, formatDateFr, JOURS_COURTS, MOIS_FR, ACTIVITY_ICONS extraits dans des fichiers utils partages (H4)
- [ ] **REFAC-02**: getWeekStart unifie dans dateHelpers.js — toutes les implementations locales remplacees (L6)
- [ ] **REFAC-03**: CustomTooltip Recharts extrait dans src/utils/chartHelpers.jsx (H4)
- [ ] **REFAC-04**: getAge, fmtDate et autres duplications extraites dans les utils existants (H4)

### SPLIT — Split Monolithes

- [x] **SPLIT-01**: Scan.jsx decoupe — LabelScanMode extrait comme composant separe (H5)
- [x] **SPLIT-02**: AITrainingProgram.jsx — ProgramBilanModal et CompletionCard extraits (H5)
- [x] **SPLIT-03**: WalkMode.jsx — WalkSummary extrait comme composant separe (H5)
- [x] **SPLIT-04**: NutritionMealPlan.jsx — sections generateur et historique separees (H5)

### UX — Confirmations PWA

- [ ] **UX-01**: Les 6 window.confirm() remplaces par Radix AlertDialog coherent (H6)

### PERF — Bundle & Performance

- [ ] **PERF-01**: Dependencies inutilisees supprimees du package.json (three, react-quill, react-resizable-panels si unused) (M1)
- [ ] **PERF-02**: AITrainingProgram lazy-loaded dans Activite.jsx (M2)
- [ ] **PERF-03**: Les 5 setTimeout dans NotebookContent.jsx ont un clearTimeout en cleanup (M4)
- [ ] **PERF-04**: ParkReview comment textarea a maxLength=300 + validation (M3)

### POLISH — Polish Final

- [ ] **POLISH-01**: Home.jsx 24 useState consolides en objets groupes (dogData, insights) (M5)
- [ ] **POLISH-02**: LottieAnimation affiche un fallback icon/illustration quand CDN echoue (M6)
- [ ] **POLISH-03**: DogAchievement.filter utilise badge_id dans le filtre au lieu de charger tous les badges (M7)
- [ ] **POLISH-04**: Silent catch blocks remplaces par console.warn dans AITrainingProgram et CombinedFAB (L1, L2)
- [ ] **POLISH-05**: Library.jsx ajoute limits aux queries Bookmark et NutritionPlan (L3)
- [ ] **POLISH-06**: analytics.js ajoute TTL 30 jours sur les events localStorage (L4)

## Future Requirements
None — all concerns scoped to this milestone.

## Out of Scope
- PawIllustrations.jsx split (L5) — tree-shaking fonctionne, cosmetic
- preDiagnosis/finalDiagnosis stateless dog data (L7) — design intentionnel, documenter seulement

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| SCALE-01 | Phase 2 | Pending |
| SCALE-02 | Phase 2 | Pending |
| SCALE-03 | Phase 2 | Pending |
| REFAC-01 | Phase 3 | Pending |
| REFAC-02 | Phase 3 | Pending |
| REFAC-03 | Phase 3 | Pending |
| REFAC-04 | Phase 3 | Pending |
| SPLIT-01 | Phase 4 | Complete |
| SPLIT-02 | Phase 4 | Complete |
| SPLIT-03 | Phase 4 | Complete |
| SPLIT-04 | Phase 4 | Complete |
| UX-01 | Phase 5 | Pending |
| PERF-01 | Phase 6 | Pending |
| PERF-02 | Phase 6 | Pending |
| PERF-03 | Phase 6 | Pending |
| PERF-04 | Phase 6 | Pending |
| POLISH-01 | Phase 7 | Pending |
| POLISH-02 | Phase 7 | Pending |
| POLISH-03 | Phase 7 | Pending |
| POLISH-04 | Phase 7 | Pending |
| POLISH-05 | Phase 7 | Pending |
| POLISH-06 | Phase 7 | Pending |
