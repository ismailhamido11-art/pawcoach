# Requirements: PawCoach v9.0 "Production Ready"

**Defined:** 2026-03-27
**Core Value:** Une app presentable, complete, qui suit les conventions des meilleures apps — prete a etre montree
**Source:** Pipeline Rouleau Compresseur (5 couches d'audit code-based + corrections)

## v9.0 Requirements

### Socle (SOCLE)

- [ ] **SOCLE-01**: CGC re-indexe sur le codebase post-v8.0 (30 fichiers changes)
- [ ] **SOCLE-02**: 7 docs architecture rafraichis via /gsd:map-codebase (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS)

### Radiographie (RADIO)

- [ ] **RADIO-01**: Inventaire dead code complet — chaque fonction/composant non utilise identifie
- [ ] **RADIO-02**: Analyse complexite — fonctions > seuil cyclomatique identifiees
- [ ] **RADIO-03**: Production checklist scoree (300+ items Apple HIG, Material Design, WCAG, OWASP, RGPD, App Store)
- [ ] **RADIO-04**: Features standard manquantes identifiees (settings, about, feedback, empty states, loading states, error states)

### Architecture (ARCH)

- [ ] **ARCH-01**: App blueprint compare aux meilleures apps pet-care (Woofz, AllTrails, Noom) — ecarts identifies
- [ ] **ARCH-02**: Navigation structure evaluee (tab bar, onboarding, retention mechanics, paywall placement)
- [ ] **ARCH-03**: Hub analysis CGC — fonctions les plus couplees identifiees comme points fragiles

### Flux (FLUX)

- [ ] **FLUX-01**: Chaque action utilisateur tracee de bout en bout (clic → resultat) sur les 16 pages
- [ ] **FLUX-02**: Data flow integrity verifiee (UI → API → state → cache → display)
- [ ] **FLUX-03**: Features mortes identifiees (code present mais jamais appele)

### Qualite Percue (QUAL)

- [ ] **QUAL-01**: Audit visuel score 1-10 (color system, typography, spacing, hierarchy, motion)
- [ ] **QUAL-02**: Premium Feel Checklist (20 items) + AI Slop Detector (15 signes)
- [ ] **QUAL-03**: Diagnostic UX profond avec benchmarks concurrents

### Synthese (SYNTH)

- [ ] **SYNTH-01**: Findings des 4 audits agreges et dedupliques
- [ ] **SYNTH-02**: Priorisation Critical → Important → Nice-to-have
- [ ] **SYNTH-03**: Phases de correction creees via /gsd:add-phase

## Future Requirements (v10.0+)

- PUSH-01: Notifications push
- ANAL-01: Analytics trackEvent() fonctionnel
- OFFLN-01: Ecran offline coherent
- GUIDE-01: Guides comportement accessibles depuis Home/Chat

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nouvelles features utilisateur | v9.0 = finir ce qui existe, pas ajouter |
| Push notifications | Pas bloquant pour la presentabilite |
| Refonte UI complete | Polish oui, redesign non |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SOCLE-01 | Phase 0 | Pending |
| SOCLE-02 | Phase 0 | Pending |
| RADIO-01 | Phase 1 | Pending |
| RADIO-02 | Phase 1 | Pending |
| RADIO-03 | Phase 1 | Pending |
| RADIO-04 | Phase 1 | Pending |
| ARCH-01 | Phase 2 | Pending |
| ARCH-02 | Phase 2 | Pending |
| ARCH-03 | Phase 2 | Pending |
| FLUX-01 | Phase 3 | Pending |
| FLUX-02 | Phase 3 | Pending |
| FLUX-03 | Phase 3 | Pending |
| QUAL-01 | Phase 4 | Pending |
| QUAL-02 | Phase 4 | Pending |
| QUAL-03 | Phase 4 | Pending |
| SYNTH-01 | Phase 5 | Pending |
| SYNTH-02 | Phase 5 | Pending |
| SYNTH-03 | Phase 5 | Pending |

**Coverage:**
- v9.0 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
