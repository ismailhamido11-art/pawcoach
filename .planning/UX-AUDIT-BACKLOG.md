# PawCoach — UX Polish Audit Backlog
**Date**: 2026-03-11
**Sources**: 6 agents paralleles (flux, dashboard, design, redondances, intelligence, ergonomie)
**Total findings**: ~120

---

## Phase 1: Critical Fixes (bugs, dead ends, securite mobile)

### Bugs reels
- [x] **BUG-01**: TodayCard.jsx — checkins passes a buildRecommendations ~~(FIXED 1ce6c33)~~
- [x] **BUG-02**: DogTwin.jsx — donnees reelles chargees ~~(FIXED d53f2cf)~~
- [x] **BUG-03**: Nutri.jsx — tab grid corrige ~~(FIXED 1ce6c33)~~
- [x] **BUG-04**: ActiveProgramCards — deep link ?tab=mealplan corrige ~~(FIXED 1ce6c33)~~

### Dead code (suppression immediate)
- [x] **DEAD-01**: StyledButton.jsx supprime ~~(FIXED 1ce6c33)~~
- [x] **DEAD-02**: EnhancedCard.jsx supprime ~~(FIXED 1ce6c33)~~
- [x] **DEAD-03**: HeaderWithLogo.jsx supprime ~~(FIXED 1ce6c33)~~
- [x] **DEAD-04**: QuickLogFAB.jsx supprime ~~(FIXED 1ce6c33)~~
- [x] **DEAD-05**: useBackClose.jsx supprime + DogProfile migre ~~(FIXED 1ce6c33)~~

### Pages mortes / orphelines
- [x] **ORPHAN-01**: Tracker.jsx supprime + retire de pages.config.js ~~(FIXED d53f2cf)~~
- [x] **ORPHAN-02**: FindVet.jsx supprime + lien AIDiagnosisModal corrige ~~(FIXED d53f2cf)~~

### Dead ends critiques
- [x] **DEAD-END-01**: Training exerciseId fallback ~~(FIXED 1ce6c33)~~
- [x] **DEAD-END-02**: Training journeyId fallback ~~(FIXED 1ce6c33)~~
- [x] **DEAD-END-03**: Dashboard no dogs redirect ~~(FIXED 1ce6c33)~~
- [x] **DEAD-END-04**: Chat "A demain !" onClick ~~(FIXED 1ce6c33)~~
- [x] **DEAD-END-05**: DogPublicProfile bouton retour ajouté ~~(FIXED d53f2cf)~~

### Safe area critiques (iPhone)
- [x] **SAFE-01**: ExerciseDetail safe-area-inset-bottom ~~(FIXED 1ce6c33)~~
- [x] **SAFE-02**: Chat safe-area-inset-top ~~(FIXED 1ce6c33)~~ + safe-area-inset-bottom scrollable ~~(FIXED c3387db)~~
- [x] **SAFE-03**: Training behavior view safe-area ~~(FIXED d53f2cf)~~
- [x] **SAFE-04**: HealthImport safe-area ~~(FIXED d53f2cf)~~

### Touch targets critiques
- [~] **TOUCH-01**: SKIPPED — shadcn/ui non modifiable (CLAUDE.md rule)
- [x] **TOUCH-02**: Chat/Nutri copy+bookmark p-2 wrapper ~~(FIXED 1ce6c33)~~
- [x] **TOUCH-03**: CombinedFAB close button w-10 h-10 ~~(FIXED 1ce6c33)~~

---

## Phase 2: Dashboard Restructure

### Reorganisation hierarchy
- [ ] **DASH-01**: Remonter ActiveProgramCards en position 3 (apres TodayCard) — contenu le plus actionnable
- [ ] **DASH-02**: Activer SmartAlerts sur le dashboard (existe dans le code, pas importe dans Home.jsx)
- [ ] **DASH-03**: Descendre WeeklyInsightCard (ne montrer que le bilan non lu, deplacer historique vers Analytics)
- [ ] **DASH-04**: Descendre TrialExpiryBanner apres les actions (pas entre hero et check-in)

### Suppression redondances dashboard
- [ ] **DASH-05**: buildRecommendations() appele 2 fois (TodayCard + DailyCoaching) — ne garder topRec que dans TodayCard, recs #2/#3 dans DailyCoaching
- [ ] **DASH-06**: Streak affiche 3 fois (DogRadarHero + StreakBar + walkStreak badge) — fusionner en 1 dans TodayCard
- [ ] **DASH-07**: Scores affiches 2 fois (DogRadarHero arcs + BentoGrid tiles) — supprimer BentoGrid ou le transformer en nav pure
- [ ] **DASH-08**: Trial banner 2 fois (TrialExpiryBanner + TodayCard showTrialAlert) — supprimer showTrialAlert de TodayCard
- [ ] **DASH-09**: WellnessBanner permanent → conditionnel (masquer apres 3 visites, ou deplacer en tooltip)
- [ ] **DASH-10**: BadgeTeaser trop bas → fusionner en chip compact dans TodayCard ou StreakBar

### Dead code dashboard
- [ ] **DASH-11**: Supprimer DailySnapshot.jsx, HealthScore.jsx, PremiumValueBanner.jsx du dossier home/ (non utilises)

---

## Phase 3: Design Consistency

### Titres & headers (high)
- [x] **DESIGN-01**: Standardiser tous les h1 page → font-black text-2xl ~~(FIXED c3387db)~~
- [x] **DESIGN-02**: Remplacer raw hex gradient par gradient-primary ~~(FIXED c3387db)~~
- [x] **DESIGN-03**: Standardiser safe-pt padding headers ~~(FIXED c3387db)~~

### Boutons CTA (high)
- [x] **DESIGN-04**: Standardiser tous les CTA primaires → h-14 rounded-2xl ~~(FIXED c3387db)~~
- [ ] **DESIGN-05**: Regle gradient: gradient-primary = feature CTA, gradient-warm = monetisation uniquement
- [x] **DESIGN-06**: Supprimer tous les inline style gradient buttons → utiliser gradient-primary class ~~(FIXED c3387db)~~

### Patterns visuels (medium)
- [ ] **DESIGN-07**: Back button → w-9 h-9 rounded-xl bg-white/20 + ArrowLeft partout
- [ ] **DESIGN-08**: JourneyCard rounded-3xl → rounded-2xl (seul outlier)
- [ ] **DESIGN-09**: Icon containers → 2 tailles canoniques: w-9 h-9 (compact) et w-11 h-11 (stat cards)
- [ ] **DESIGN-10**: Tracker tab style → migrer vers pill-card gradient header (comme Sante/Nutri/Activite)
- [ ] **DESIGN-11**: Couleur warning: supprimer token caution, utiliser amber partout pour warnings

### Typography (low)
- [ ] **DESIGN-12**: Supprimer text-[9px] → text-[10px]. Supprimer text-[11px] → text-xs
- [ ] **DESIGN-13**: Section labels → text-xs font-bold text-muted-foreground uppercase tracking-widest
- [ ] **DESIGN-14**: Bottom padding → pb-28 partout (sauf pages avec FAB → pb-32)

### Loading & empty states (low)
- [ ] **DESIGN-15**: Premium.jsx et Profile.jsx loading skeletons → haute fidelite (comme Home/Training)
- [ ] **DESIGN-16**: Pattern EmptyState unifie: illustration + title + subtitle + CTA

---

## Phase 4: Data Intelligence & Smart Flows

### Post-action CTAs (fermer les boucles)
- [~] **INTEL-01**: SKIP — choix produit requis (design CTA, placement, logique routage)
- [~] **INTEL-02**: SKIP — choix produit requis (design CTA, placement, logique routage)
- [~] **INTEL-03**: SKIP — choix produit requis (design CTA, placement, logique routage)
- [~] **INTEL-04**: SKIP — choix produit requis (design CTA, placement, logique routage)

### Donnees sous-exploitees
- [x] **INTEL-05**: walk_tags (tire laisse, distrait) → recommendations.js rec vers Training behavior ~~(FIXED 3fda962)~~
- [~] **INTEL-06**: SKIP — necessite comprendre format donnees IA et priorite vs recommendations manuelles
- [x] **INTEL-07**: Dog.weight auto-update depuis HealthRecord type=weight ~~(FIXED 0d43057)~~
- [x] **INTEL-08**: Medicaments actifs → rec dans buildRecommendations ("Medicament en cours") ~~(FIXED c9de846)~~
- [~] **INTEL-09**: SKIP — necessite decision sur comment afficher le conflit avoid[] vs FoodScan
- [x] **INTEL-10**: GrowthEntry.body_condition_score → integrer dans computeHealthScore ~~(FIXED da731fc)~~

### Navigation intelligente
- [x] **INTEL-11**: Premium page → lire ?from= et retourner a la page d'origine apres souscription ~~(FIXED 8bbbbab)~~
- [x] **INTEL-12**: Onboarding max dogs → toast au lieu d'alert(), retour Profile au lieu de Home ~~(FIXED cf458d5)~~
- [x] **INTEL-13**: navigate(-1) fallbacks sur DogTwin, Library, Premium, Scan → fallback vers page parent ~~(FIXED b471689)~~

---

## Phase 5: Code Cleanup & DRY

### Utilitaires dupliques
- [ ] **DRY-01**: getTodayString() defini 7 fois → exporter depuis utils/recommendations.js, supprimer copies
- [ ] **DRY-02**: getDogAge() defini 8 fois → utiliser getDogAgeLabel()/dogAgeMonths() de healthStatus.js
- [ ] **DRY-03**: getDateLabel() + shouldShowDateSeparator() copie Chat/Nutri → extraire utils/dateHelpers.js
- [ ] **DRY-04**: isValidDate() defini 2 fois → exporter depuis healthStatus.js
- [ ] **DRY-05**: getDaysLeft() defini 2 fois (ReminderAlert + NotificationCenter) → extraire utils/

### Composants dupliques
- [ ] **DRY-06**: InlineWeightForm (WeightCard) + SectionPoids → extraire hook useAddWeightRecord
- [ ] **DRY-07**: InlineVaccineForm (VaccineCard) + SectionVaccins → extraire hook useAddVaccineRecord
- [ ] **DRY-08**: VetSearchCard → supprimer avec FindVet.jsx (PlaceCard est la version canon)
- [ ] **DRY-09**: 3 systemes de reminders (ReminderAlert, NotificationCenter, UpcomingReminders) → hook useUpcomingReminders partage

### Performance
- [ ] **DRY-10**: HealthScore.jsx re-fetch HealthRecord independamment → passer records en prop depuis Home.jsx
- [ ] **DRY-11**: Vaccine logic 3 endroits (SmartAlerts, recommendations, healthStatus) → unifier via computeVaccineMap

### Cosmetic DRY (priorite basse)
- [ ] **DRY-12**: Spring animation constante dans 18 fichiers → exporter depuis lib/animations.js
- [ ] **DRY-13**: Spinner inline dans 41 fichiers → composant Spinner dans ui/
- [ ] **DRY-14**: mdComponents ReactMarkdown → extraire dans lib/markdown.js

---

## Phase 6: Mobile Ergonomics Polish

### Touch targets
- [ ] **MOBILE-01**: InlineCheckin symptom chips py-1.5 → py-2.5 (28px → 36px)
- [ ] **MOBILE-02**: DogProfile edit buttons py-1.5 → py-2.5, edit icon w-7 → w-10
- [ ] **MOBILE-03**: NutritionMealPlan history delete button w-7 → w-9
- [ ] **MOBILE-04**: NotificationCenter "Tout lire" py-1 → py-2
- [ ] **MOBILE-05**: Back buttons Tracker/VetPortal w-8 → w-9 h-9
- [ ] **MOBILE-06**: SmartHealthAssistant "Nouvelle conversation" py-1 → py-2
- [ ] **MOBILE-07**: QuickActions links → ajouter py-1 pour zone tap etendue

### Readabilite texte
- [ ] **MOBILE-08**: InlineCheckin mood/energy/appetite labels text-[9px] → text-[11px]
- [ ] **MOBILE-09**: BottomNav labels text-[10px] → text-xs
- [ ] **MOBILE-10**: AITrainingProgram option labels text-[8px](!!) → text-xs
- [ ] **MOBILE-11**: Training behavior do/don't list text-[10px] → text-xs
- [ ] **MOBILE-12**: Dashboard chart ticks fontSize 8-9 → fontSize 11
- [ ] **MOBILE-13**: Dashboard info labels text-[10px] → text-xs

### Inputs
- [ ] **MOBILE-14**: GrowthTracker weight/height inputs → ajouter inputMode="decimal"

### Gestes
- [ ] **MOBILE-15**: NotebookContent sub-tabs scroll horizontal → touch-action: pan-x pour eviter conflit avec transition page
- [ ] **MOBILE-16**: Sub-tabs scrollables → indicateur de scroll (fade gradient)

---

## Stats

| Phase | Items | Impact |
|-------|-------|--------|
| 1. Critical Fixes | 24 | Ship-blocker |
| 2. Dashboard Restructure | 11 | UX majeur |
| 3. Design Consistency | 16 | Coherence visuelle |
| 4. Data Intelligence | 13 | Intelligence produit |
| 5. Code Cleanup | 14 | Dette technique |
| 6. Mobile Ergonomics | 16 | Ergonomie quotidienne |
| **Total** | **94** | |

---
*Audit: 2026-03-11 — 6 agents paralleles (Sonnet)*
*Backlog consolide par: Claude Opus 4.6*
