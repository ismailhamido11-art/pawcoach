# Requirements: PawCoach v6.0 Deep Clean & PWA

## Source
Scan codebase post-v5.0 — .planning/codebase/CONCERNS.md (27 mars 2026)

## v6.0 Requirements

### PWA — Progressive Web App

- [x] **PWA-01**: Creer public/manifest.json fonctionnel (name, icons, start_url, display:standalone, theme_color) (C1)
- [x] **PWA-02**: Creer public/sw.js minimal (passthrough fetch handler, offline fallback) (C1)

### CRON — Backend Scalabilite Restante

- [ ] **CRON-01**: monthlySummary remplace Dog.list()+User.list() par des filtres cibles (C2)
- [ ] **CRON-02**: streakReminder remplace Streak.list() par un filtre ou un cap (C2)

### SEC — Securite Restante

- [ ] **SEC-01**: finalDiagnosis verifie le quota (empecher appel direct sans preDiagnosis) (H4)
- [ ] **SEC-02**: finalDiagnosis et generateDiagnosisPDF ajoutent un ownership check sur dog_id (H3)
- [ ] **SEC-03**: deleteUser supprime aussi les ParkReview du chien (H5 — gap RGPD)

### SPLIT — Monolithes Restants

- [ ] **SPLIT-01**: Training.jsx — extraire DayCard comme composant separe (H1)
- [ ] **SPLIT-02**: Nutri.jsx — consolider 20 useState en objets groupes + extraire tabs (H1/H2)
- [ ] **SPLIT-03**: SmartHealthAssistant.jsx — extraire section voice + review panel (H1)
- [ ] **SPLIT-04**: DownloadHealthPDF.jsx — extraire PDF layout logic en helpers (H1)

### A11Y — Accessibilite

- [ ] **A11Y-01**: Tous les boutons icon-only ont un aria-label descriptif (M)
- [ ] **A11Y-02**: Les motion.div interactifs ont tabIndex={0} + onKeyDown Enter/Space (M)

### PERF — Performance Restante

- [x] **PERF-01**: react-leaflet lazy-loaded dans les composants qui l'utilisent (FindVetContent, NearbyParks, WalkMap) (M) — deja implemente
- [x] **PERF-02**: index-as-key remplace par des IDs stables dans les 15 fichiers concernes (M) — 22 fichiers corriges
- [x] **PERF-03**: Les 20+ empty catch blocks sur des mutations de donnees remplacent par console.warn (M) — 6 mutations loggees

### CLEAN — Nettoyage Final

- [ ] **CLEAN-01**: Deps npm inutilisees restantes supprimees de package.json (L)
- [ ] **CLEAN-02**: LabelScanMode deplace dans src/components/scan/ (L — mal place dans pages/)
- [ ] **CLEAN-03**: Stripe webhook ajoute idempotency check (L)
- [ ] **CLEAN-04**: useReducedMotion hook deduplique (L)
- [ ] **CLEAN-05**: walkReminder requetes parallelisees au lieu de sequentielles (L)

## Out of Scope
- Overpass API rate limiting — dependance externe, pas de fix simple
- ContentArticles feature gap — feature produit, pas technique
- next-themes removal — shadcn dep, risque de casse

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PWA-01 | Phase 1 | Complete |
| PWA-02 | Phase 1 | Complete |
| CRON-01 | Phase 2 | Pending |
| CRON-02 | Phase 2 | Pending |
| SEC-01 | Phase 3 | Pending |
| SEC-02 | Phase 3 | Pending |
| SEC-03 | Phase 3 | Pending |
| SPLIT-01 | Phase 4 | Pending |
| SPLIT-02 | Phase 4 | Pending |
| SPLIT-03 | Phase 4 | Pending |
| SPLIT-04 | Phase 4 | Pending |
| A11Y-01 | Phase 5 | Pending |
| A11Y-02 | Phase 5 | Pending |
| PERF-01 | Phase 6 | Complete — 2026-03-27 |
| PERF-02 | Phase 6 | Complete — 2026-03-27 |
| PERF-03 | Phase 6 | Complete — 2026-03-27 |
| CLEAN-01 | Phase 7 | Pending |
| CLEAN-02 | Phase 7 | Pending |
| CLEAN-03 | Phase 7 | Pending |
| CLEAN-04 | Phase 7 | Pending |
| CLEAN-05 | Phase 7 | Pending |
