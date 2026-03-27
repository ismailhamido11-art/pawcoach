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

- [x] **Phase 0: Socle** - CGC re-index + /gsd:map-codebase (completed 2026-03-27)
- [x] **Phase 1: Radiographie** - CGC analysis + production-checklist 73% (completed 2026-03-27)
- [x] **Phase 2: Architecture** - app-blueprint vs Woofz/Noom/Duolingo (completed 2026-03-27)
- [x] **Phase 3: Flux** - SFA 16 pages, 8 ruptures, ~28 suspects (completed 2026-03-27)
- [x] **Phase 4: Qualite Percue** - art-direction 8.1/10 + UX 6.2/10 (completed 2026-03-27)
- [x] **Phase 5: Synthese** - 76 findings → 58 requirements → 5 fix phases (completed 2026-03-27)
- [ ] **Phase 6: Legal & Security** - Privacy Policy, Terms, GDPR consent, CSP, input validation (P0)
- [ ] **Phase 7: Flow Fixes** - 6 ruptures + 7 suspects critiques (P0/P1)
- [ ] **Phase 8: UX & Activation** - Onboarding 5 etapes, IA visible, paywall, offline banner (P1)
- [x] **Phase 9: Visual Polish** - Orange cleanup, padding, typography, animation presets (P2) (completed 2026-03-27)
- [ ] **Phase 10: Performance & Cleanup** - Complexity, dead code, shared context, backend batch (P2/P3)

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

### Phase 6: Legal & Security
**Goal**: L'app est legalement conforme (RGPD, CGU) et securisee contre les attaques courantes
**Depends on**: Phase 5
**Requirements**: FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07, FIX-08, FIX-09, FIX-10
**Plans:** 4 plans
Plans:
- [ ] 06-01-PLAN.md — Privacy Policy + Terms of Service pages (FIX-01, FIX-02)
- [ ] 06-02-PLAN.md — Consentement RGPD Onboarding + gate analytics (FIX-03, FIX-04, FIX-08)
- [ ] 06-03-PLAN.md — Export donnees + disclosure renouvellement + disclaimer medical (FIX-05, FIX-06, FIX-07)
- [ ] 06-04-PLAN.md — CSP index.html + validation input backend (FIX-09, FIX-10)
**Success Criteria** (what must be TRUE):
  1. Page /Privacy accessible avec contenu RGPD complet
  2. Page /Terms accessible avec CGU/CGV
  3. Checkbox consentement RGPD bloque la creation de profil si non coche
  4. Disclosure renouvellement auto visible sur la page Premium
  5. CSP meta tag present dans index.html

### Phase 7: Flow Fixes
**Goal**: Zero rupture runtime — chaque action utilisateur aboutit ou affiche une erreur claire
**Depends on**: Phase 5
**Requirements**: FIX-15, FIX-16, FIX-17, FIX-18, FIX-19, FIX-20, FIX-21, FIX-22, FIX-23, FIX-24, FIX-25, FIX-26, FIX-27
**Plans:** 3/4 plans executed
Plans:
- [x] 07-01-PLAN.md — VetNoteForm invoke fix + Library handleActivateTraining (FIX-15, FIX-19)
- [x] 07-02-PLAN.md — WalkReminderSettings rollback + NotebookContent ge-guard + Activite try/catch (FIX-16, FIX-17, FIX-18)
- [x] 07-03-PLAN.md — LabelScanMode resetLabel + Chat/Nutri suggestions disable + Sante weight sync (FIX-20, FIX-25, FIX-26)
- [x] 07-04-PLAN.md — Dashboard Promise.all + Home stale indicator + checkin guard + Nutri 429 toast + DogProfile revokeObjectURL (FIX-21, FIX-22, FIX-23, FIX-24, FIX-27)
**Success Criteria** (what must be TRUE):
  1. VetNoteForm soumet correctement via invoke("vetAccess", {...})
  2. Dashboard affiche meme si un fetch echoue (pas d'ecran blanc)
  3. LabelScanMode "Nouvelle analyse" reaffiche le ModeSwitcher
  4. Activite pull-to-refresh ne crash plus sur erreur reseau

### Phase 8: UX & Activation
**Goal**: L'onboarding active les utilisateurs en <2min et l'IA est visible des la premiere visite
**Depends on**: Phase 6, Phase 7
**Requirements**: FIX-31, FIX-32, FIX-33, FIX-34, FIX-35, FIX-36, FIX-37, FIX-38, FIX-39, FIX-40, FIX-41
**Plans:** 3/4 plans executed
Plans:
- [ ] 08-01-PLAN.md — Onboarding 5 groupes + quick-start + WelcomeScreen personnalisee (FIX-31, FIX-32, FIX-37)
- [x] 08-02-PLAN.md — AI card Home + Vet shortcut + Dashboard prominence (FIX-33, FIX-35, FIX-36)
- [x] 08-03-PLAN.md — Gradient edge sub-tabs + compteur messages Chat (FIX-34, FIX-38)
- [x] 08-04-PLAN.md — Offline banner + SW update prompt + Stripe loading (FIX-39, FIX-40, FIX-41)
**Success Criteria** (what must be TRUE):
  1. Onboarding en 5-6 etapes max (pas 10)
  2. Un element IA (card ou FAB) est visible sur Home
  3. Banner offline visible quand navigator.onLine === false
  4. SW update prompt au lieu de skipWaiting() force
**UI hint**: yes

### Phase 9: Visual Polish
**Goal**: L'app respecte la charte Nature Premium sans exception et le design est coherent
**Depends on**: Phase 8
**Requirements**: FIX-44, FIX-45, FIX-46, FIX-47, FIX-48, FIX-49, FIX-50, FIX-51, FIX-52, FIX-53, FIX-54, FIX-55, FIX-56, FIX-57
**Plans:** 4/4 plans complete
Plans:
- [x] 09-01-PLAN.md — Orange/yellow/teal cleanup (FIX-44, FIX-45, FIX-46)
- [x] 09-02-PLAN.md — Spacing px-5 + section rhythm + font sizes (FIX-47, FIX-48, FIX-49)
- [x] 09-03-PLAN.md — Animation presets centralises + useReducedMotion (FIX-50, FIX-51, FIX-57)
- [x] 09-04-PLAN.md — PWA icons PNG + dead import + version + hex tokens (FIX-52, FIX-53, FIX-54, FIX-55, FIX-56)
**Success Criteria** (what must be TRUE):
  1. grep "orange" dans src/ retourne 0 classes Tailwind orange
  2. Toutes les pages utilisent px-5 pour le padding horizontal
  3. Les spring values inline sont remplacees par des presets animations.js

### Phase 10: Performance & Cleanup
**Goal**: Code propre, performant, sans dette technique critique
**Depends on**: Phase 9
**Requirements**: FIX-59, FIX-60, FIX-61, FIX-62, FIX-63, FIX-64, FIX-65, FIX-66, FIX-67, FIX-68
**Plans:** 2/4 plans executed
Plans:
- [x] 10-01-PLAN.md — Backend complexity: buildHealthSummaryHTML + getAge sync + handleDownload audit (FIX-59, FIX-60, FIX-61)
- [ ] 10-02-PLAN.md — Frontend architecture: DogContext + useHomeData hook (FIX-62, FIX-63)
- [ ] 10-03-PLAN.md — Nutri useReducer migration (FIX-64)
- [x] 10-04-PLAN.md — VetPortal batch + dead code + analytics cleanup (FIX-65, FIX-66, FIX-67, FIX-68)
**Success Criteria** (what must be TRUE):
  1. buildHealthSummaryHTML complexite < 15 (etait 28)
  2. getAge annote avec commentaire de sync dans les 2 backends
  3. analytics.js supprime, zero trackEvent dans src/
  4. VetPortal charge patients en 1 roundtrip (listMyPatients)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 0. Socle | 1/1 | Complete | 2026-03-27 |
| 1. Radiographie | 1/1 | Complete | 2026-03-27 |
| 2. Architecture | 1/1 | Complete | 2026-03-27 |
| 3. Flux | 1/1 | Complete | 2026-03-27 |
| 4. Qualite Percue | 1/1 | Complete | 2026-03-27 |
| 5. Synthese | 1/1 | Complete | 2026-03-27 |
| 6. Legal & Security | 0/4 | Not started | - |
| 7. Flow Fixes | 4/4 | Complete | 2026-03-27 |
| 8. UX & Activation | 3/4 | In Progress|  |
| 9. Visual Polish | 4/4 | Complete   | 2026-03-27 |
| 10. Performance | 2/4 | In Progress|  |
