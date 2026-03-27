# Roadmap: PawCoach

## Milestones

- ✅ **v1.0 "Data Flow Integrity"** — Phases 1-4 (shipped mars 11-12)
- ✅ **v1.1 "Quality Audit"** — Phases 5-8 (shipped mars 12-15)
- ✅ **v2.0 "Cleanup Technique"** — 6 phases (shipped 26 mars). [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 "Consolidation"** — 92 fixes, 125 issues audited (shipped 26-27 mars). [Archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 "E2E Fixes"** — 5 phases, 35 requirements, 165 flows audites (shipped 27 mars). [Archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 "Hardening & Refactoring"** — 7 phases, 26 requirements (shipped 27 mars). [Archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 "Deep Clean & PWA"** — 7 phases, 21 requirements, 10 gaps corriges (shipped 27 mars). [Archive](milestones/v6.0-ROADMAP.md)
- ✅ **v7.0 "User-Ready"** — 4 phases, 20 requirements, coherence donnees + UX (shipped 27 mars). [Archive](milestones/v7.0-ROADMAP.md)

## Completed Work (archived)
- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation (92 fixes)
- v4.0: E2E Fixes (35 requirements, 165 flows audites)
- v5.0: Hardening & Refactoring (26 requirements, 4 composants extraits, 900KB bundle allege)
- v6.0: Deep Clean & PWA (21 requirements, PWA installable, accessibilite, monolithes decoupes)
- v7.0: User-Ready (20 requirements, donnees coherentes, flux reconnectes, UX honnete)

## v8.0 "SFA Fixes" — Active

## Phases

- [ ] **Phase 1: Crashs & Features Mortes** - Eliminer les 4 ruptures qui bloquent l'acces aux features
- [ ] **Phase 2: Donnees Stale** - Corriger les 6 sources de donnees fausses ou perdues
- [ ] **Phase 3: Cache, UX & Securite** - Propager les invalidations manquantes + corriger les 5 failles UX/securite

## Phase Details

### Phase 1: Crashs & Features Mortes
**Goal**: Toutes les features critiques sont accessibles et fonctionnent sans erreur JavaScript
**Depends on**: Nothing (first phase)
**Requirements**: CRASH-01, CRASH-02, CRASH-03, CRASH-04
**Success Criteria** (what must be TRUE):
  1. L'utilisateur peut taper sur une humeur dans Home (quick check-in) sans que l'action echoue silencieusement
  2. La page Scanner s'ouvre sans erreur de reference JavaScript (labelResult defini)
  3. DogPublicProfile s'affiche completement pour un chien avec des visites vet ou medicaments (pas de crash Stethoscope/Pill)
  4. Le bouton CombinedFAB est visible sur au moins une page et ses actions (log poids, eau, balade) se declenchent
**Plans**: 4 plans
Plans:
- [x] 01-01-PLAN.md — CRASH-01: handleQuickCheckin defaults energy=2 appetite=2 (Home.jsx)
- [ ] 01-02-PLAN.md — CRASH-02: labelResult declare dans Scan.jsx (ReferenceError fix)
- [x] 01-03-PLAN.md — CRASH-03: imports Stethoscope + Pill dans DogPublicProfile.jsx
- [ ] 01-04-PLAN.md — CRASH-04: CombinedFAB monte dans Home.jsx avec invalidateHome

### Phase 2: Donnees Stale
**Goal**: Chaque donnee affichee reflète la realite — aucune valeur perimee ou perdue en base
**Depends on**: Phase 1
**Requirements**: STALE-01, STALE-02, STALE-03, STALE-04, STALE-05, STALE-06
**Success Criteria** (what must be TRUE):
  1. Apres une mise a jour de poids dans Sante, le poids affiché dans la meme page est immediatement correct (pas de reload necessaire)
  2. L'alerte poids dans SmartAlerts compare deux pesees relles (GrowthEntries) et non le poids initial du profil chien
  3. La pill "Poids: Non suivi" disparait des que le chien a au moins une GrowthEntry enregistree
  4. Le score wellness est identique sur Dashboard, DogRadarHero et NotebookContent (meme valeur, meme source)
  5. Apres un scan alimentaire, les champs summary et allergen_alerts sont retrouves intacts dans la bibliotheque
**Plans**: TBD

### Phase 3: Cache, UX & Securite
**Goal**: Les changements se propagent immediatement dans Home et les failles UX/securite identifiees par le SFA sont eliminées
**Depends on**: Phase 2
**Requirements**: CACHE-01, CACHE-02, CACHE-03, CACHE-04, UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. Apres un log via CombinedFAB (poids, eau, balade), Home se rafraichit sans reload manuel
  2. Apres suppression ou renommage d'un chien, Home ne montre plus l'ancienne donnee
  3. Apres un scan alimentaire, la liste recentScans dans Nutri se met a jour au retour sur la page
  4. La card "Passe a Premium" est invisible pour un utilisateur deja abonne
  5. L'email du proprietaire n'est pas visible sur DogPublicProfile
  6. Une erreur lors de la sauvegarde du profil utilisateur affiche un message d'erreur (pas de silence)
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Crashs & Features Mortes | 2/4 | In Progress|  |
| 2. Donnees Stale | 0/? | Not started | - |
| 3. Cache, UX & Securite | 0/? | Not started | - |
