# Requirements: PawCoach v6.0 Deep Clean & PWA

## Source
Scan codebase post-v5.0 — .planning/codebase/CONCERNS.md (27 mars 2026)

## v6.0 Requirements

### PWA — Progressive Web App

- [ ] **PWA-01**: Creer public/manifest.json fonctionnel (name, icons, start_url, display:standalone, theme_color) (C1)
- [ ] **PWA-02**: Creer public/sw.js minimal (passthrough fetch handler, offline fallback) (C1)

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

- [ ] **PERF-01**: react-leaflet lazy-loaded dans les composants qui l'utilisent (FindVetContent, NearbyParks, WalkMap) (M)
- [ ] **PERF-02**: index-as-key remplace par des IDs stables dans les 15 fichiers concernes (M)
- [ ] **PERF-03**: Les 20+ empty catch blocks sur des mutations de donnees remplacent par console.warn (M)

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
| (filled by roadmapper) | | |
