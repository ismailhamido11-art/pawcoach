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
- ✅ **v8.0 "SFA Fixes"** — 3 phases, 19 requirements, zero crash + donnees coherentes + cache + securite (shipped 27 mars). [Archive](milestones/v8.0-ROADMAP.md)

## Completed Work (archived)
- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation (92 fixes)
- v4.0: E2E Fixes (35 requirements, 165 flows audites)
- v5.0: Hardening & Refactoring (26 requirements, 4 composants extraits, 900KB bundle allege)
- v6.0: Deep Clean & PWA (21 requirements, PWA installable, accessibilite, monolithes decoupes)
- v7.0: User-Ready (20 requirements, donnees coherentes, flux reconnectes, UX honnete)
- v8.0: SFA Fixes (19 requirements, zero crash, donnees reelles, cache propagation, securite UX)

## v9.0 "Production Ready" — Active

## Phases

- [ ] **Phase 0: Socle** - CGC re-index + /gsd:map-codebase pour donnees fraiches
- [ ] **Phase 1: Radiographie** - CGC dead-code/complexity + /production-checklist (300+ items)
- [ ] **Phase 2: Architecture** - /app-blueprint + CGC hub analysis (vs meilleures apps)
- [ ] **Phase 3: Flux** - /static-flow-analysis sur les 16 pages + CGC chains
- [ ] **Phase 4: Qualite Percue** - /art-direction-mobile + /design-analyst (scoring visuel + UX)
- [ ] **Phase 5: Synthese** - Agreger, prioriser, creer les phases de correction

## Phase Details

### Phase 0: Socle
**Goal**: Donnees fraiches pour que tous les audits partent d'une base a jour
**Depends on**: Nothing (first phase)
**Requirements**: SOCLE-01, SOCLE-02
**Success Criteria** (what must be TRUE):
  1. CGC indexe sur le codebase post-v8.0 sans erreur
  2. 7 docs architecture dans .planning/codebase/ sont a jour (date > v8.0 completion)

### Phase 1: Radiographie
**Goal**: Inventaire complet de ce qui manque et ce qui est en trop dans l'app
**Depends on**: Phase 0
**Requirements**: RADIO-01, RADIO-02, RADIO-03, RADIO-04
**Success Criteria** (what must be TRUE):
  1. Liste de dead code avec fichier + fonction pour chaque item
  2. Liste de fonctions complexes (cyclomatique > seuil) avec score
  3. Production checklist scoree avec OK/MISSING/NA par item
  4. Liste des features standard manquantes (settings, about, empty states, etc.)

### Phase 2: Architecture
**Goal**: Savoir si l'app est structuree comme une vraie app pro du meme vertical
**Depends on**: Phase 0
**Requirements**: ARCH-01, ARCH-02, ARCH-03
**Success Criteria** (what must be TRUE):
  1. Comparaison tabulaire PawCoach vs 3+ apps de reference (patterns presents/absents)
  2. Navigation structure evaluee avec recommandations
  3. Top 10 fonctions hub identifiees avec couplage score

### Phase 3: Flux
**Goal**: Chaque action utilisateur fonctionne de bout en bout sans rupture
**Depends on**: Phase 0
**Requirements**: FLUX-01, FLUX-02, FLUX-03
**Success Criteria** (what must be TRUE):
  1. Chaque page a ses flux traces avec verdict (OK/RUPTURE/SUSPECT)
  2. Data flow documente pour les 5 entites principales (Dog, DailyLog, HealthRecord, FoodScan, GrowthEntry)
  3. Features mortes listees avec code location

### Phase 4: Qualite Percue
**Goal**: Savoir si l'app fait professionnelle et premium, pas generique
**Depends on**: Phase 0
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Score visuel global (1-10) avec detail par dimension
  2. Premium Feel Checklist completee (20 items OK/MISSING)
  3. Diagnostic UX avec problemes structurels identifies et priorises

### Phase 5: Synthese
**Goal**: Une liste priorisee de tout ce qu'il faut corriger, prete pour execution
**Depends on**: Phase 1, Phase 2, Phase 3, Phase 4
**Requirements**: SYNTH-01, SYNTH-02, SYNTH-03
**Success Criteria** (what must be TRUE):
  1. Rapport consolide avec tous les findings dedupliques
  2. Chaque finding classe Critical/Important/Nice-to-have
  3. Phases de correction creees dans ROADMAP.md via /gsd:add-phase

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Socle | 0/? | Not started | - |
| 1. Radiographie | 0/? | Not started | - |
| 2. Architecture | 0/? | Not started | - |
| 3. Flux | 0/? | Not started | - |
| 4. Qualite Percue | 0/? | Not started | - |
| 5. Synthese | 0/? | Not started | - |
