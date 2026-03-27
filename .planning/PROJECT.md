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

### Active

None — ready for v9.0

### Out of Scope

- Push notifications — complexite et cout
- Analytics trackEvent — utile mais pas prioritaire
- Ecran offline — PWA passthrough (Base44 requiert auth live)

## Current State (v8.0 shipped — 27 mars 2026)

- 9 milestones livres (v1.0 → v8.0)
- Zero crash : quick checkin, scanner, DogPublicProfile, CombinedFAB tous fonctionnels
- Donnees reelles : SmartAlerts compare pesees reelles, computeStatusPills enrichi, NutritionMealPlan latestRealWeight, FoodScan data preserved
- Cache propagation : Home invalide apres chaque action (FAB log, dog delete, dog rename/photo), Nutri auto-refresh
- Securite UX : email proprietaire retire, premium card masquee, handleSaveUser try/catch, checkWalkBadges idempotent, training rollback
- Score readiness : 9.0+/10

## Current Milestone: v9.0 "Production Ready"

**Goal:** Passer PawCoach au rouleau compresseur — auditer chaque dimension par le code (completude, architecture, flux, qualite percue), puis corriger tout pour avoir une app presentable.

**Pipeline :**
- Phase 0: Socle (CGC re-index + map-codebase)
- Phases 1-4: Audits (radiographie, architecture, flux, qualite percue)
- Phase 5: Synthese (agreger, prioriser, creer les phases de fix)
- Phases 6+: Corrections (ajoutees dynamiquement apres synthese)

**Methode :** 100% code-based, zero Chrome. CGC en socle. GSD autonomous.

## Context

- CGC indexe sur le codebase — utilise systematiquement dans chaque phase GSD
- 4 rapports SFA dans .planning/audit/ — traces de flux end-to-end
- Static Flow Analysis ancre comme process de verification obligatoire
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
| Static Flow Analysis obligatoire | Grep ne suffit pas, il faut tracer les chemins complets | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-27 after v8.0 milestone complete*
