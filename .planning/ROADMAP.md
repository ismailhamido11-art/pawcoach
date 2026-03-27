# Roadmap: PawCoach

## Milestones

- ✅ **v1.0 "Data Flow Integrity"** — Phases 1-4 (shipped mars 11-12)
- ✅ **v1.1 "Quality Audit"** — Phases 5-8 (shipped mars 12-15)
- ✅ **v2.0 "Cleanup Technique"** — 6 phases (shipped 26 mars). [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 "Consolidation"** — 92 fixes, 125 issues audited (shipped 26-27 mars). [Archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 "E2E Fixes"** — 5 phases, 35 requirements, 165 flows audites (shipped 27 mars). [Archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 "Hardening & Refactoring"** — 7 phases, 26 requirements (shipped 27 mars). [Archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 "Deep Clean & PWA"** — 7 phases, 21 requirements, 10 gaps corriges (shipped 27 mars). [Archive](milestones/v6.0-ROADMAP.md)
- 🔄 **v7.0 "User-Ready"** — 4 phases, 20 requirements (active)

## Completed Work (archived)

- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation (92 fixes)
- v4.0: E2E Fixes (35 requirements, 165 flows audites)
- v5.0: Hardening & Refactoring (26 requirements, 4 composants extraits, 900KB bundle allege)
- v6.0: Deep Clean & PWA (21 requirements, PWA installable, accessibilite, monolithes decoupes)

---

## v7.0 "User-Ready" — Phases

### Summary

- [x] **Phase 1: Backend Critique** — Securite, quota, cleanup backend (TECH-01 a TECH-06) (completed 2026-03-27)
- [x] **Phase 2: Donnees Fausses** — Corriger toutes les donnees incorrectes affichees (DATA-01 a DATA-06) (completed 2026-03-27)
- [x] **Phase 3: Flux Deconnectes** — Invalider les caches et reconnecter les propagations (FLOW-01 a FLOW-04) (completed 2026-03-27)
- [ ] **Phase 4: UX Trompeuse** — Corriger les interfaces qui induisent l'utilisateur en erreur (UX-01 a UX-04)

---

## Phase Details

### Phase 1: Backend Critique

**Goal**: Le backend est securise, propre et sans bugs silencieux qui compromettent les donnees ou la securite
**Depends on**: Nothing (premier phase)
**Requirements**: TECH-01, TECH-02, TECH-03, TECH-04, TECH-05, TECH-06
**Success Criteria** (what must be TRUE):
  1. Un utilisateur free qui appelle finalDiagnosis plusieurs fois est bloque par le quota serveur — le bypass frontend ne fonctionne plus
  2. La fonction streakReminder en production ne fait plus de Streak.list() global — elle filtre par user_id
  3. Le fichier icon-192.svg est un SVG valide sans marqueurs de conflit Git (pas de "<<<<<<" dans le fichier)
  4. monthlySummary s'execute sans erreur sur tous les users — plus de reference a is_trial inexistant
  5. La suppression d'un chien efface ParkReview et PlaceFavorite sans erreur silencieuse — les entites orphelines n'existent plus
  6. Aucun console.log ne s'affiche dans les logs du backend en production
**Plans**: 3 plans
Plans:
- [x] 01-01-PLAN.md — Token HMAC preDiagnosis→finalDiagnosis (TECH-01) + Streak.filter sans .list() global (TECH-02)
- [x] 01-02-PLAN.md — Resoudre conflit Git icon-192.svg (TECH-03) + Supprimer console.log debug (TECH-06)
- [x] 01-03-PLAN.md — Corriger is_trial inexistant dans monthlySummary (TECH-04) + ParkReview/PlaceFavorite dans cascade delete (TECH-05)

### Phase 2: Donnees Fausses

**Goal**: Chaque donnee affichee a l'utilisateur correspond a la realite — plus aucune valeur par defaut trompeuse, fabrication de donnees, ou source incorrecte
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. Apres un check-in avec mood "fatigue", le hero Home affiche "Rex est fatigue" (et non "Rex est en forme" par defaut) — verifie dans DogRadarHero, Home, DailyBriefing, StreakBar, FreeExercisesGate
  2. La carte "Repas" dans DailyProgress et CalendarStrip compte uniquement les vrais repas (meal_type != 'water') — les bols d'eau ne sont plus comptabilises
  3. Apres la creation d'une GrowthEntry, Dog.weight est mis a jour — la valeur dans WeightCard et GrowthTracker est identique
  4. Le check-in rapide ne cree plus energy et appetite a partir du mood — les champs sont null/absents si non renseignes par l'utilisateur
  5. Dashboard et Sante affichent le meme score wellness pour le meme chien au meme moment — la source de calcul est unique
  6. Les textes de DailyBriefing et EmotionalTip s'affichent avec les accents corrects (debut, hydrate, regularite — sans caracteres manquants)
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — Hero mood conditionnel (DATA-01) + Repas vs eau (DATA-02) + Accents DailyBriefing (DATA-06)
- [x] 02-02-PLAN.md — GrowthTracker sync Dog.weight (DATA-03) + Supprimer fabrication energy/appetite (DATA-04)
- [x] 02-03-PLAN.md — Unifier source score wellness Dashboard = Sante (DATA-05)

### Phase 3: Flux Deconnectes

**Goal**: Toutes les actions utilisateur propagent leurs resultats immediatement — plus aucun cache perime qui montre des donnees depassees
**Depends on**: Phase 2
**Requirements**: FLOW-01, FLOW-02, FLOW-03, FLOW-04
**Success Criteria** (what must be TRUE):
  1. Apres avoir termine une balade, la section DailyProgress sur Home affiche la bonne distance et duree sans rechargement manuel de la page
  2. Apres avoir change de chien dans le selecteur, toutes les donnees sur Home (hero, repas, activite, wellnes) correspondent au chien selectionne — plus aucune donnee de l'ancien chien visible
  3. Quand SmartHealthAssistant traite un batch de 3 records, les 3 notifications apparaissent dans Sante — pas seulement la premiere
  4. Apres un paiement Stripe confirme, toutes les pages de l'app (Chat, Sante, Dashboard, Profile) affichent le statut premium — pas seulement Home
**Plans**: 2 plans
Plans:
- [x] 03-01-PLAN.md — invalidateHome apres balade (FLOW-01) + invalidateHome apres switch chien (FLOW-02)
- [x] 03-02-PLAN.md — Supprimer auto-save silencieux SmartHealthAssistant (FLOW-03) + propagation premium via AuthContext (FLOW-04)

### Phase 4: UX Trompeuse

**Goal**: Chaque interface reflète la realite — plus d'elements qui induisent l'utilisateur en erreur sur le prix, les fonctionnalites disponibles, ou les actions possibles
**Depends on**: Phase 3
**Requirements**: UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. Quand l'utilisateur coche au moins un symptome dans le check-in, une suggestion apparait (bouton ou message) proposant un diagnostic ou un lien vers Sante — les symptomes ne sont plus ignores silencieusement
  2. La page tarification affiche 7.99 EUR/mois comme prix mensuel explicite — le prix annuel ramene au mois (5 EUR) est clairement labelise "en abonnement annuel" et non presente comme le prix principal
  3. Le champ code parrain est invisible ou grise avec un message "bientot disponible" — l'utilisateur ne peut pas saisir un code qui sera ignore par le backend
  4. Les SmartAlerts (vaccins, poids) du Dashboard sont accessibles depuis la Home ou la navigation principale — l'utilisateur n'a pas a deviner qu'un Dashboard existe
**Plans**: 2 plans
Plans:
- [ ] 04-01-PLAN.md — Corriger CTAs prix trompeurs (UX-02) + Supprimer champ code parrain (UX-03)
- [ ] 04-02-PLAN.md — Reaction symptomes check-in (UX-01) + Carte Dashboard depuis Home (UX-04)

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Critique | 3/3 | Complete   | 2026-03-27 |
| 2. Donnees Fausses | 3/3 | Complete   | 2026-03-27 |
| 3. Flux Deconnectes | 2/2 | Complete   | 2026-03-27 |
| 4. UX Trompeuse | 0/? | Not started | - |
