# PawCoach

## What This Is

PWA coach bien-etre canin — all-in-one pour proprietaires de chiens francophones. Mobile-first. 16 pages, ~106 composants, 22 fonctions backend Deno sur Base44.

## Core Value

Un proprietaire de chien peut suivre la sante, l'alimentation, l'activite et le bien-etre de son chien au quotidien, avec des donnees fiables et coherentes qui refletent la realite.

## Stack

React 18 + Vite 6 + Tailwind 3 + shadcn/ui + Framer Motion + Lucide React
Backend: Base44 platform (22 fonctions Deno)
AI: OpenRouter (DeepSeek + GPT-4o vision)
Payment: Stripe (mensuel 7.99 EUR, annuel 59.99 EUR)

## Requirements

### Validated

- v1.0: Data flow integrity (4 phases)
- v1.1: Quality audit (4 phases)
- v2.0: Cleanup technique (6 phases)
- v3.0: Consolidation — 92 fixes, 125 issues audited
- v4.0: E2E Fixes — 35 requirements, 165 flows audites
- v5.0: Hardening & Refactoring — 26 requirements, securite, scalabilite
- v6.0: Deep Clean & PWA — 21 requirements, PWA installable, accessibilite
- v7.0: User-Ready — 20 requirements, donnees coherentes, flux reconnectes, UX honnete
- v8.0: SFA Fixes — 19 requirements, zero crash, donnees reelles, cache propagation, securite UX
- v9.0: Production Ready — 55 requirements, audit complet, legal RGPD, UX transformee, visual clean
- v10.0: Hardening & Architecture — 12 requirements, securite HMAC, DogContext 14 pages, dedup, perf

### Active

None — ready for v11.0

### Out of Scope

- Push notifications — complexite et cout
- Analytics trackEvent — utile mais pas prioritaire
- Ecran offline — PWA passthrough (Base44 requiert auth live)

## Current State (v9.0 shipped — 28 mars 2026)

- 10 milestones livres (v1.0 → v9.0)
- Conformite legale : Privacy Policy RGPD, Terms CGU, GDPR consent, data export, auto-renewal disclosure
- Zero rupture runtime : 8 ruptures SFA corrigees, Dashboard resilient, error handling complet
- UX transformee : Onboarding 5 groupes (etait 10), IA visible sur Home, offline banner, SW update toast
- Charte visuelle respectee : 0 orange, padding/spacing uniformes, animations centralisees, PWA icons PNG
- Architecture amelioree : DogContext, useHomeData, useReducer Nutri, VetPortal batch, buildHealthSummaryHTML decomposee
- Score readiness : 9.5/10 (Production Ready)

## Current State (v10.0 shipped — 28 mars 2026)

- 11 milestones livres (v1.0 → v10.0)
- Securite : HMAC sans fallback, Privacy/Terms dans Premium
- Architecture : DogContext + useAuth utilises par toutes les pages (14 migrees)
- Qualite : useTabNavigation hook, verdictConfig centralise, 15 silent catches corriges
- Performance : useMemo sur 4 pages, Home 2-wave loading
- Score readiness : 9.5/10

## No Active Milestone

Ready for v11.0. Run `/gsd:new-milestone` to start.

## Context

- CGC indexe sur le codebase — utilise systematiquement dans chaque phase GSD
- 4 rapports SFA v9.0 dans .planning/phases/03-flux/ (remplacent les anciens .planning/audit/)
- Static Flow Analysis ancre comme process de verification obligatoire
- Pipeline Rouleau Compresseur ancre en memoire (reference_rouleau_compresseur.md)
- Pattern proactif ancre dans CLAUDE.md

## Constraints

- Git-first workflow (0 credit) — Build prompts only for schema changes
- UI en francais, code en anglais
- Design system: cream bg + forest #1A4D3E + emerald #2D9F82, ZERO orange
- NE JAMAIS modifier pawcoach/src/components/ui/ (shadcn)
- CGC obligatoire dans chaque phase GSD

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v7.0 = coherence, pas features | L'app affichait des donnees fausses — priorite confiance | ✓ Good |
| CGC systematique dans GSD | Pattern proactif detecte des bugs caches | ✓ Good |
| Carte Repas → Eau | meals_count n'existe pas dans DailyLog | ✓ Good |
| Streak.list + slice(2000) | SDK filter operators undocumented | ⚠️ Revisit |
| v8.0 = SFA fixes, pas features | SFA a trouve 32 ruptures dont 7 critiques | ✓ Good — 19/19 |
| v9.0 = Rouleau Compresseur (audit + fix) | 76 findings, 14 P0 blockers, onboarding 10→5 | ✓ Good — 55/58 |
| Static Flow Analysis obligatoire | Grep ne suffit pas, il faut tracer les chemins complets | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-28 after v10.0 milestone start*
