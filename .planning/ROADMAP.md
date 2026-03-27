# Roadmap: PawCoach

## Milestones

- ✅ **v1.0 "Data Flow Integrity"** — Phases 1-4 (shipped mars 11-12)
- ✅ **v1.1 "Quality Audit"** — Phases 5-8 (shipped mars 12-15)
- ✅ **v2.0 "Cleanup Technique"** — 6 phases (shipped 26 mars). [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 "Consolidation"** — 92 fixes, 125 issues audited (shipped 26-27 mars). [Archive](milestones/v3.0-ROADMAP.md)
- ✅ **v4.0 "E2E Fixes"** — 5 phases, 35 requirements, 165 flows audites (shipped 27 mars). [Archive](milestones/v4.0-ROADMAP.md)
- 🚧 **v5.0 "Hardening & Refactoring"** — 7 phases, 26 requirements (in progress)

## Completed Work (archived)
- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation (92 fixes)
- v4.0: E2E Fixes (35 requirements, 5 phases, 165 flows audites)

---

## 🚧 v5.0 Hardening & Refactoring

**Milestone Goal:** Corriger les 23 issues restantes (3 CRITICAL + 6 HIGH + 7 MEDIUM + 7 LOW) identifiees par le scan post-v4.0, et refactorer les monolithes pour rendre le codebase maintenable.

## Phases

- [ ] **Phase 1: Security** - Corriger les 3 failles CRITICAL (ownership, privacy, chat unbounded)
- [ ] **Phase 2: Scalability** - Borner les 6 CRONs et les queries frontend sans limite
- [ ] **Phase 3: Utils Extraction** - Extraire les fonctions dupliquees dans des fichiers partages
- [ ] **Phase 4: Monolith Split** - Decouper les 4 fichiers monolithes en composants separes
- [ ] **Phase 5: UX Confirmations** - Remplacer les 6 window.confirm par AlertDialog PWA-friendly
- [ ] **Phase 6: Performance** - Nettoyer le bundle et les fuites memoire
- [ ] **Phase 7: Polish** - Consolider l'etat Home, fallbacks, pagination, analytics TTL

## Phase Details

### Phase 1: Security
**Goal**: Les donnees des chiens sont protegees — aucun utilisateur ne peut acceder aux donnees d'un autre chien via les fonctions backend
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Un utilisateur ne peut pas generer un programme d'entrainement ou analyser une photo de croissance pour un chien qui ne lui appartient pas (retour 403)
  2. Le profil public d'un chien n'est visible que si le proprietaire a active le flag is_public_profile
  3. Le chat IA ne charge pas plus de 90j de checkins, 60j de logs, 30 scans, 20 records par requete
**Plans**: TBD

### Phase 2: Scalability
**Goal**: Les queries backend et frontend sont bornees — aucune requete ne peut retourner un volume illimite de donnees
**Depends on**: Phase 1
**Requirements**: SCALE-01, SCALE-02, SCALE-03
**Success Criteria** (what must be TRUE):
  1. Les 6 fonctions CRON filtrent les users/dogs avant la boucle (pas de .list() global)
  2. FoodScan sur Home est limite a 20 resultats
  3. Les 5 composants qui appellent HealthRecord.filter ont un cap explicite (50-200 selon usage)
**Plans**: TBD

### Phase 3: Utils Extraction
**Goal**: Les fonctions utilitaires dupliquees existent en un seul endroit — modifier dateHelpers.js se repercute partout
**Depends on**: Phase 2
**Requirements**: REFAC-01, REFAC-02, REFAC-03, REFAC-04
**Success Criteria** (what must be TRUE):
  1. addDaysToDate, formatDateFr, JOURS_COURTS, MOIS_FR, ACTIVITY_ICONS existent uniquement dans src/utils/dateHelpers.js et src/utils/programHelpers.js
  2. getWeekStart a une seule implementation dans dateHelpers.js (lundi comme debut de semaine) utilisee par tous les composants
  3. CustomTooltip Recharts existe uniquement dans src/utils/chartHelpers.jsx
  4. getAge et fmtDate n'ont plus de doublons locaux dans les composants
**Plans**: TBD

### Phase 4: Monolith Split
**Goal**: Les 4 fichiers monolithes sont decoupe en composants separes — chaque fichier a une responsabilite claire
**Depends on**: Phase 3
**Requirements**: SPLIT-01, SPLIT-02, SPLIT-03, SPLIT-04
**Success Criteria** (what must be TRUE):
  1. Scan.jsx n'inclut plus le mode label inline — LabelScanMode est un composant importe separe
  2. AITrainingProgram.jsx importe ProgramBilanModal et CompletionCard comme composants separes
  3. WalkMode.jsx importe WalkSummary comme composant separe
  4. NutritionMealPlan.jsx a ses sections generateur et historique separees
**Plans**: TBD
**UI hint**: yes

### Phase 5: UX Confirmations
**Goal**: Les confirmations destructives sont des dialogues coherents — l'app ne montre plus la base44.app URL dans les alertes iOS
**Depends on**: Phase 4
**Requirements**: UX-01
**Success Criteria** (what must be TRUE):
  1. Les 6 actions destructives (abandon programme, supprimer plan, supprimer bookmark, supprimer food scan, remplacer plan, supprimer historique) affichent un AlertDialog Radix au lieu d'un window.confirm natif
  2. Sur iOS PWA standalone, aucun dialogue ne montre l'URL base44.app comme titre
**Plans**: TBD
**UI hint**: yes

### Phase 6: Performance
**Goal**: Le bundle est propre et les fuites memoire sont bouchees — trois est retire, AITrainingProgram est lazy-loaded, les timeouts sont nettoyes
**Depends on**: Phase 5
**Requirements**: PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):
  1. three et react-quill sont retires de package.json (bundle allege de ~900KB minifie)
  2. AITrainingProgram est lazy-loaded dans Activite.jsx (charge uniquement quand l'onglet programme est ouvert)
  3. Les 5 setTimeout dans NotebookContent.jsx ont un clearTimeout en cleanup — aucun warning React sur unmount
  4. Le textarea de ParkReview est limite a 300 caracteres avec validation
**Plans**: TBD

### Phase 7: Polish
**Goal**: Le code de Home est lisible, les animations ne laissent plus de containers vides, la memoire locale est purgee
**Depends on**: Phase 6
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06
**Success Criteria** (what must be TRUE):
  1. Home.jsx a ses 24 useState consolides en deux objets (dogData, insights) — un seul endroit a modifier pour ajouter une donnee
  2. LottieAnimation affiche un fallback icon/illustration quand le CDN est inaccessible — aucun container vide
  3. DogAchievement.filter filtre par badge_id directement (pas de fetch-all + filter memoire)
  4. Les silent catch dans AITrainingProgram et CombinedFAB ont au minimum un console.warn
  5. Library.jsx et analytics.js ont des limites et un TTL — aucun grow illimite de donnees locales
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security | 0/? | Not started | - |
| 2. Scalability | 0/? | Not started | - |
| 3. Utils Extraction | 0/? | Not started | - |
| 4. Monolith Split | 0/? | Not started | - |
| 5. UX Confirmations | 0/? | Not started | - |
| 6. Performance | 0/? | Not started | - |
| 7. Polish | 0/? | Not started | - |
