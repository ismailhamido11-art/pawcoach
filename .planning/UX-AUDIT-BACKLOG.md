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
- [x] **DASH-01**: ActiveProgramCards en position 3 (Bloc 3 apres TodayCard) ~~(VERIFIED — Home.jsx L350)~~
- [x] **DASH-02**: SmartAlerts importe et actif sur dashboard ~~(VERIFIED — Home.jsx L18, L354-362)~~
- [x] **DASH-03**: WeeklyInsightCard positionne Bloc 10, conditionnel ~~(VERIFIED — Home.jsx L393-407)~~
- [x] **DASH-04**: TrialExpiryBanner Bloc 9 apres les actions ~~(VERIFIED — Home.jsx L388-391)~~

### Suppression redondances dashboard
- [x] **DASH-05**: buildRecommendations() appele 1 seule fois via useMemo, partage TodayCard+DailyCoaching ~~(VERIFIED — Home.jsx L278)~~
- [~] **DASH-06**: SKIP — Streak x3 volontaire (DogRadarHero arc activite + StreakBar check-in + walk streak = 2 metriques differentes)
- [x] **DASH-07**: BentoGrid = pure navigation (no scores), DogRadarHero = 4 arcs. Pas de duplication ~~(VERIFIED — BentoGrid L7 comment)~~
- [x] **DASH-08**: TrialExpiryBanner seul, TodayCard n'affiche pas de banner ~~(VERIFIED)~~
- [x] **DASH-09**: WellnessBanner conditionnel : affiche si <3 checkins ~~(VERIFIED — Home.jsx L324)~~
- [x] **DASH-10**: BadgeTeaser merge dans StreakBar.jsx (L120-144), chip compact ~~(VERIFIED)~~

### Dead code dashboard
- [x] **DASH-11**: DailySnapshot.jsx, HealthScore.jsx, PremiumValueBanner.jsx n'existent plus ~~(VERIFIED — supprimes)~~

---

## Phase 3: Design Consistency

### Titres & headers (high)
- [x] **DESIGN-01**: Standardiser tous les h1 page → font-black text-2xl ~~(FIXED c3387db)~~
- [x] **DESIGN-02**: Remplacer raw hex gradient par gradient-primary ~~(FIXED c3387db)~~
- [x] **DESIGN-03**: Standardiser safe-pt padding headers ~~(FIXED c3387db)~~

### Boutons CTA (high)
- [x] **DESIGN-04**: Standardiser tous les CTA primaires → h-14 rounded-2xl ~~(FIXED c3387db)~~
- [x] **DESIGN-05**: VERIFIED — gradient-primary = feature CTA, gradient-warm = monetisation uniquement (tous usages conformes)
- [x] **DESIGN-06**: Supprimer tous les inline style gradient buttons → utiliser gradient-primary class ~~(FIXED c3387db)~~

### Patterns visuels (medium)
- [x] **DESIGN-07**: Back button → w-9 h-9 rounded-xl bg-white/20 + ArrowLeft partout ~~(FIXED)~~ — 6 boutons standardises (VetPortal, Premium, DogProfile, DogTwin, ExerciseDetail, JourneyView)
- [x] **DESIGN-08**: JourneyCard rounded-3xl → rounded-2xl ~~(FIXED)~~
- [~] **DESIGN-09**: SKIP — 71 fichiers impactes, tailles servent des contextes varies (avatars, badges, boutons, decorations)
- [x] **DESIGN-10**: N/A — Tracker.jsx supprime en Phase 1, pas de composant avec tab style "Tracker" restant
- [x] **DESIGN-11**: VERIFIED — --caution (38 92% 55%) est deja amber. Pas de yellow/orange inapproprie pour warnings

### Typography (low)
- [x] **DESIGN-12**: text-[9px] → text-[10px], text-[11px] → text-xs ~~(FIXED)~~ — 38 fichiers modifies (hors ui/)
- [~] **DESIGN-13**: SKIP — trop subjectif, pas de definition claire de "section label" vs label ordinaire
- [x] **DESIGN-14**: Bottom padding standardise ~~(FIXED)~~ — pb-28 par defaut, pb-32 pour FAB pages (Home, Scan)

### Loading & empty states (low)
- [~] **DESIGN-15**: SKIP — skeletons basiques deja presents, haute fidelite complexe et risque desynchronisation
- [~] **DESIGN-16**: SKIP — trop de variantes (texte, illustration, CTA, contextes sombres/clairs), composant unifie trop generique

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
- [x] **DRY-01**: getTodayString() defini 7 fois → exporter depuis utils/recommendations.js, supprimer copies ~~(FIXED 15076cc)~~
- [x] **DRY-02**: getDogAge() defini 8 fois → utiliser getDogAgeLabel()/dogAgeMonths() de healthStatus.js ~~(FIXED 5bd4f5f)~~
- [x] **DRY-03**: getDateLabel() + shouldShowDateSeparator() copie Chat/Nutri → extraire utils/dateHelpers.js ~~(FIXED ec4f8f4)~~
- [x] **DRY-04**: isValidDate() defini 2 fois → exporter depuis healthStatus.js ~~(FIXED 3dea98c)~~
- [x] **DRY-05**: getDaysLeft() defini 2 fois (ReminderAlert + NotificationCenter) → extraire utils/ ~~(FIXED 403053e)~~

### Composants dupliques
- [~] **DRY-06**: SKIP — InlineWeightForm vs SectionPoids: UI et state management trop differents, extraction hook sans valeur ajoutee
- [~] **DRY-07**: SKIP — InlineVaccineForm vs SectionVaccins: meme raison que DRY-06
- [x] **DRY-08**: VetSearchCard → supprime (aucun import, FindVet deja supprime Phase 1) ~~(FIXED 1f42e3a)~~
- [~] **DRY-09**: SKIP — ReminderAlert/NotificationCenter/UpcomingReminders: lifecycle et logique completement differents, hook partage forcerait un pattern artificiel

### Performance
- [~] **DRY-10**: SKIP — HealthScore.jsx deja supprime (n'existe plus dans le codebase)
- [~] **DRY-11**: SKIP — Vaccine logic dans 3 contextes differents (comptage simple vs map complet vs recommandations), unification risquerait regression

### Cosmetic DRY (priorite basse)
- [x] **DRY-12**: Spring animation constante dans 18 fichiers → exporter depuis lib/animations.js ~~(FIXED 8f0b52d)~~
- [~] **DRY-13**: SKIP — Spinner dans 38 fichiers avec tailles/couleurs variees, risque de regression disproportionne. Regle CLAUDE.md interdit modif ui/
- [x] **DRY-14**: mdComponents ReactMarkdown → extraire dans lib/markdown.js ~~(FIXED 423e358)~~

---

## Phase 6: Mobile Ergonomics Polish

### Touch targets
- [x] **MOBILE-01**: InlineCheckin symptom chips py-1.5 → py-2.5 (28px → 36px) ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-02**: DogProfile edit buttons py-1.5 → py-2.5, edit icon w-7 → w-10 ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-03**: NutritionMealPlan history delete button w-7 → w-9 ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-04**: NotificationCenter "Tout lire" py-1 → py-2 ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-05**: Back buttons VetPortal w-8 → w-9 h-9 (Tracker supprime Phase 1) ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-06**: SmartHealthAssistant "Nouvelle conversation" py-1 → py-2 ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-07**: QuickActions links → ajouter py-1 pour zone tap etendue ~~(FIXED 8fa7aad)~~

### Readabilite texte
- [x] **MOBILE-08**: InlineCheckin mood/energy/appetite labels text-[9px] → text-[11px] ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-09**: BottomNav labels text-[10px] → text-xs ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-10**: AITrainingProgram option labels text-[8px] → text-xs ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-11**: Training behavior do/don't list text-[10px] → text-xs ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-12**: Dashboard chart ticks fontSize 8-9 → fontSize 11 ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-13**: Dashboard info labels text-[10px] → text-xs ~~(FIXED 8fa7aad)~~

### Inputs
- [x] **MOBILE-14**: GrowthTracker weight/height inputs → ajouter inputMode="decimal" ~~(FIXED 8fa7aad)~~

### Gestes
- [x] **MOBILE-15**: NotebookContent sub-tabs scroll horizontal → touch-action: pan-x ~~(FIXED 8fa7aad)~~
- [x] **MOBILE-16**: Sub-tabs scrollables → indicateur de scroll (fade gradient) ~~(FIXED 8fa7aad)~~

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
