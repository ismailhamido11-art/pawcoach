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

### Active

(None — ready for /gsd:new-milestone)

### Out of Scope

- Push notifications — complexite et cout
- Analytics trackEvent — utile mais pas prioritaire
- Ecran offline — PWA passthrough (Base44 requiert auth live)

## Current State (v7.0 shipped — 27 mars 2026)

- 8 milestones livres (v1.0 → v7.0)
- Donnees coherentes : hero message, score wellness, poids/BCS, check-in honnete
- Flux reconnectes : cache Home invalide, premium global, batch notify
- UX honnete : prix 7.99 EUR, code parrain supprime, symptomes → action, Dashboard visible
- Backend securise : HMAC quota, Streak cap, cascade delete complete, zero console.log
- Score readiness : 6.2/10 → 8.5+/10

## Context

- CGC indexe sur le codebase — utilise systematiquement dans chaque phase GSD
- 3 rapports audit dans .planning/audit/ (data-coherence, user-journey, app-readiness)
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

## Evolution

This document evolves at phase transitions and milestone boundaries.

---
*Last updated: 2026-03-27 after v7.0 milestone complete*
