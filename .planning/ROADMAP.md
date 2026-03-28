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
- ✅ **v9.0 "Production Ready"** — 11 phases, 55/58 requirements, audit complet + legal + flow fixes + UX + visual + perf (shipped 28 mars). [Archive](milestones/v9.0-ROADMAP.md)

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
- v9.0: Production Ready (55 requirements, audit complet, legal RGPD, UX transformee, visual clean)

## Active: v10.0 "Hardening & Architecture"

**Goal:** Securite, gate premium, DogContext migration, dedup, performance.

### Phase 1: Security Fixes
- **Goal:** Eliminer les failles de securite identifiees par l'audit
- **Requirements:** SEC-01, SEC-02
- **Success criteria:**
  1. preDiagnosis et finalDiagnosis echouent si PRE_DIAG_SECRET n'est pas defini (pas de fallback)
  2. Premium.jsx affiche les liens Privacy Policy et Terms dans le footer
  3. Aucun secret en dur dans le code source (verifie par grep)

### Phase 2: Premium Multi-Dog Gate
- **Goal:** Proteger le business model en gateant la creation de chiens selon le plan
- **Requirements:** BIZ-01, BIZ-02
- **Success criteria:**
  1. Un utilisateur free ne peut creer qu'un seul chien
  2. Un utilisateur premium peut creer jusqu'a 3 chiens
  3. Un nudge Premium s'affiche quand un user free tente de creer un 2eme chien
  4. L'Onboarding respecte la limite

### Phase 3: DogContext & useAuth Migration
- **Goal:** Eliminer les 14 appels API redondants en migrant vers les contextes partages
- **Requirements:** ARCH-01, ARCH-02, ARCH-03
- **Success criteria:**
  1. Toutes les pages BottomNav utilisent useDog() (Home, Sante, Activite, Nutri, Profile)
  2. Les pages secondaires utilisent useDog() (DogProfile, Chat, Scan, etc.)
  3. Aucun appel Dog.filter({ owner }) direct dans les pages (sauf DogContext lui-meme)
  4. useAuth() utilise partout au lieu de base44.auth.me()

### Phase 4: Code Dedup & Error Handling
- **Goal:** Eliminer la duplication de code et les erreurs silencieuses
- **Requirements:** QUAL-01, QUAL-02, QUAL-03
- **Success criteria:**
  1. Hook useTabNavigation extrait, utilise par Activite, Nutri, Sante
  2. verdictConfig.js centralise, importe par Scan, LabelScanMode, Library
  3. Zero .catch(() => {}) dans le code (remplace par error handling visible)

### Phase 5: Performance Optimization
- **Goal:** Reduire les re-renders et optimiser le chargement initial
- **Requirements:** PERF-01, PERF-02
- **Success criteria:**
  1. useMemo utilise pour les calculs derives dans Library, Training, Sante
  2. Home charge les 4 donnees above-fold avant le reste (checkin, streak, reco, briefing)
  3. Pas de regression fonctionnelle
