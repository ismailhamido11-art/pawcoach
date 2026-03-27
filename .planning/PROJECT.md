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

### Active

- [ ] Corriger les donnees fausses affichees a l'utilisateur (hero message, repas=eau, poids/BCS, checkin fabrique)
- [ ] Reconnecter les flux de donnees deconnectes (cache Home, dog switch, batch notify, premium refresh)
- [ ] Corriger les UX trompeuses (symptomes ignores, prix trompeur, code parrain mort, dashboard cache)
- [ ] Corriger les bugs techniques critiques (quota bypass, Streak.list, icone PWA, is_trial, deleteMany)
- [ ] Nettoyage code (console.log, accents manquants)

### Out of Scope

- Notifications push — complexite et cout, pas prioritaire pour v7.0
- Analytics (trackEvent) — utile mais pas bloquant pour la coherence
- Ecran offline — PWA passthrough (Base44 requiert auth live)
- Nouvelles features — v7.0 = coherence uniquement

## Current Milestone: v7.0 "User-Ready"

**Goal:** Rendre l'app coherente et presentable a un vrai utilisateur — zero donnees fausses, zero flux deconnectes, zero UX trompeuse.

**Target features:**
- Corriger 6 donnees fausses
- Corriger 4 flux deconnectes
- Corriger 4 UX trompeuses
- Corriger 6 bugs techniques
- Pattern proactif : chaque fix verifie et corrige toutes les instances du meme anti-pattern

**Source:** 3 rapports d'audit (.planning/audit/) + CONCERNS.md + CGC pattern search

## Context

- 7 milestones techniques livres (v1.0-v6.0) — code solide mais donnees incoherentes
- Score readiness actuel: 6.2/10 (audit app-readiness)
- CGC indexe sur le codebase — utilise systematiquement dans chaque phase
- Audit complet: DATA-COHERENCE.md, USER-JOURNEY.md, APP-READINESS.md dans .planning/audit/

## Constraints

- Git-first workflow (0 credit) — Build prompts only for schema changes
- UI en francais, code en anglais
- Design system: cream bg + forest #1A4D3E + emerald #2D9F82, ZERO orange
- NE JAMAIS modifier pawcoach/src/components/ui/ (shadcn)
- CGC obligatoire dans chaque phase GSD (plan, execute, verify)
- Pattern proactif : chaque bug corrige doit etre verifie dans toute l'app

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v7.0 = coherence, pas features | L'app fonctionne mais affiche des donnees fausses — priorite confiance utilisateur | — Pending |
| Pas de push notifications en v7.0 | Complexite + cout, pas bloquant pour la coherence | — Pending |
| CGC systematique dans GSD | Detecte les patterns repetes, evite les corrections partielles | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after v7.0 milestone start*
