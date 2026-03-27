# Roadmap: PawCoach

## Milestones

- ✅ **v1.0 "Data Flow Integrity"** — Phases 1-4 (shipped mars 11-12)
- ✅ **v1.1 "Quality Audit"** — Phases 5-8 (shipped mars 12-15)
- ✅ **v2.0 "Cleanup Technique"** — 6 phases (shipped 26 mars). [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 "Consolidation"** — 92 fixes, 125 issues audited (shipped 26-27 mars). [Archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 "E2E Fixes"** — 5 phases, 35 requirements, 165 flows audites (shipped 27 mars). [Archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 "Hardening & Refactoring"** — 7 phases, 26 requirements (shipped 27 mars). [Archive](milestones/v5.0-ROADMAP.md)
- 🚧 **v6.0 "Deep Clean & PWA"** — 7 phases, 21 requirements (in progress)

## Completed Work (archived)
- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation (92 fixes)
- v4.0: E2E Fixes (35 requirements, 165 flows audites)
- v5.0: Hardening & Refactoring (26 requirements, 7 phases, 4 composants extraits, 900KB bundle allege)

---

### 🚧 v6.0 "Deep Clean & PWA" (In Progress)

**Milestone Goal:** Corriger les 21 issues restantes post-v5.0 — PWA fonctionnelle, CRONs scalables, securite backend, monolithes decoupes, accessibilite, performance, nettoyage final. Tout via Git direct, 0 credit.

## Phases

- [x] **Phase 1: PWA** - Creer manifest.json et sw.js pour rendre l'app installable (completed 2026-03-27)
- [x] **Phase 2: CRON** - Rendre les deux fonctions CRON restantes scalables (completed 2026-03-27)
- [ ] **Phase 3: SEC** - Corriger les 3 failles de securite backend restantes
- [ ] **Phase 4: SPLIT** - Decouperles 4 monolithes restants en composants separes
- [ ] **Phase 5: A11Y** - Ajouter aria-labels et navigation clavier sur les boutons interactifs
- [ ] **Phase 6: PERF** - Lazy-load leaflet, corriger les index-as-key, logger les catch silencieux
- [ ] **Phase 7: CLEAN** - Supprimer les deps inutilisees, deplacer LabelScanMode, deduplication

## Phase Details

### Phase 1: PWA
**Goal**: L'app est installable comme application native sur iOS et Android
**Depends on**: Nothing (first phase)
**Requirements**: PWA-01, PWA-02
**Success Criteria** (what must be TRUE):
  1. Le navigateur propose le prompt "Ajouter a l'ecran d'accueil" sur mobile
  2. public/manifest.json existe avec name, icons, start_url, display:standalone, theme_color
  3. public/sw.js existe et le service worker s'enregistre sans erreur dans la console
  4. L'app charge en mode standalone (sans barre URL du navigateur) apres installation
**Plans**: 1 plan
Plans:
- [x] 01-pwa-01-PLAN.md — Creer public/manifest.json et public/sw.js
**UI hint**: yes

### Phase 2: CRON
**Goal**: Les fonctions CRON backend ne chargent plus la table entiere a chaque execution
**Depends on**: Phase 1
**Requirements**: CRON-01, CRON-02
**Success Criteria** (what must be TRUE):
  1. monthlySummary n'appelle plus Dog.list() ni User.list() sans filtre — uniquement User.filter({ is_premium: true })
  2. streakReminder filtre les streaks a la source ou applique un cap avec log d'avertissement
  3. Les deux fonctions passent le code review sans aucun appel .list() non filtre
**Plans**: 1 plan
Plans:
- [x] 02-cron-01-PLAN.md — Remplacer list() globaux dans monthlySummary et streakReminder

### Phase 3: SEC
**Goal**: Les trois failles de securite backend restantes sont bouchees
**Depends on**: Phase 2
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Un utilisateur free ne peut pas appeler finalDiagnosis directement pour bypasser le quota — la verification est presente dans la fonction
  2. finalDiagnosis et generateDiagnosisPDF verifient que dog_id appartient a l'utilisateur authentifie avant d'executer
  3. La suppression d'un compte via deleteUser supprime aussi toutes les ParkReview de l'utilisateur (droit a l'effacement RGPD)

### Phase 4: SPLIT
**Goal**: Les 4 fichiers monolithes restants sont decoupes en composants maintenables
**Depends on**: Phase 3
**Requirements**: SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04
**Success Criteria** (what must be TRUE):
  1. DayCard existe comme composant separe dans src/components/activite/DayCard.jsx — Training.jsx l'importe
  2. Nutri.jsx a ses useState groupes en objets logiques et chaque tab est un composant separe
  3. SmartHealthAssistant.jsx n'integre plus la section voice et le review panel en ligne — ils sont des composants separes
  4. DownloadHealthPDF.jsx exporte la logique de layout PDF dans des helpers distincts, hors du render tree React
**UI hint**: yes

### Phase 5: A11Y
**Goal**: Les utilisateurs avec lecteur d'ecran peuvent naviguer et comprendre tous les boutons interactifs
**Depends on**: Phase 4
**Requirements**: A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. Tous les boutons icon-only (BottomNav, WalkMode, InlineCheckin, AITrainingProgram) ont un aria-label descriptif en francais
  2. Les motion.div interactifs repondent a la touche Entree et Espace (tabIndex + onKeyDown)
  3. VoiceOver iOS lit un label comprehensible sur chaque bouton de navigation principale
**UI hint**: yes

### Phase 6: PERF
**Goal**: Le bundle initial est allege et les erreurs silencieuses sur mutations de donnees sont visibles
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):
  1. react-leaflet n'est charge que quand l'utilisateur navigue vers l'onglet carte (lazy import dynamique)
  2. Les 15 fichiers avec index-as-key utilisent des IDs stables sur les listes dynamiques
  3. Les 20+ catch blocks vides sur des mutations de donnees ont au minimum un console.warn avec contexte

### Phase 7: CLEAN
**Goal**: Le codebase est propre — deps inutilisees supprimees, fichiers bien places, hooks dedupliques
**Depends on**: Phase 6
**Requirements**: CLEAN-01, CLEAN-02, CLEAN-03, CLEAN-04, CLEAN-05
**Success Criteria** (what must be TRUE):
  1. Les deps npm inutilisees (@hello-pangea/dnd, cmdk, input-otp, vaul, @stripe/react-stripe-js, @stripe/stripe-js) sont absentes de package.json
  2. LabelScanMode.jsx est dans src/components/scan/ et Scan.jsx l'importe depuis ce nouvel emplacement
  3. stripeWebhook verifie si l'event.id a deja ete traite avant d'executer
  4. Un seul useReducedMotion est utilise dans le codebase — la version Framer Motion
  5. walkReminder parallelise ses requetes DailyLog avec Promise.all au lieu de les faire sequentiellement

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. PWA | 1/1 | Complete   | 2026-03-27 |
| 2. CRON | 1/1 | Complete | 2026-03-27 |
| 3. SEC | 0/TBD | Not started | - |
| 4. SPLIT | 0/TBD | Not started | - |
| 5. A11Y | 0/TBD | Not started | - |
| 6. PERF | 0/TBD | Not started | - |
| 7. CLEAN | 1/1 | Complete | 2026-03-27 |
