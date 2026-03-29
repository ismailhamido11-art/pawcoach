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
- ✅ **v10.0 "Hardening & Architecture"** — 5 phases, 12/12 requirements, securite + DogContext migration + dedup + perf (shipped 28 mars). [Archive](milestones/v10.0-ROADMAP.md)

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
- v10.0: Hardening & Architecture (12 requirements, securite HMAC, DogContext 14 pages, useTabNavigation, useMemo, Home 2-wave)

## Active: v11.0 "Visual Excellence"

**Goal:** Score design 7.4 → 9.0. Polish visuel + Home redesign.

### Phase 1: Visual Polish
- **Goal:** Corrections mecaniques pour monter a 8.5
- **Requirements:** VIS-01, VIS-02, VIS-03, VIS-04
- **Success criteria:**
  1. Max 3 font-weights (400, 600, 700) — zero font-black, font-medium rationalize
  2. Headers gradient pb max 5 (pas de pb-8/pb-10)
  3. Profile nom lisible sur 375px
  4. Cards Home unifiees (1 style sauf CTA principal)
  5. Score art-direction >= 8.5

### Phase 2: Home Redesign
- **Goal:** Repenser la Home pour 1 focal point par viewport
- **Requirements:** HOME-01, HOME-02, HOME-03, HOME-04, QUAL-01, QUAL-02, QUAL-03
- **Success criteria:**
  1. Above-fold = briefing + check-in uniquement
  2. Recommendations en progressive disclosure (scroll)
  3. 1 CTA dominant par viewport
  4. Score art-direction Home >= 8.5
  5. Score art-direction global >= 9.0
  6. Premium Feel >= 18/20
  7. AI Slop 0/15
