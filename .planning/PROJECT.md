# PawCoach

## Vision
PWA coach bien-etre canin — all-in-one pour proprietaires de chiens francophones. Mobile-first.

## Stack
React 18 + Vite 6 + Tailwind 3 + shadcn/ui + Framer Motion + Lucide React
Backend: Base44 platform (22 fonctions Deno)
AI: OpenRouter (DeepSeek + GPT-4o vision)
Payment: Stripe (mensuel 7.99 EUR, annuel 59.99 EUR)

## Current State (v3.0 shipped — 27 mars 2026)
- 16 pages, ~102 composants custom, 22 fonctions backend, 19 entites Base44
- Centralized data layer (src/api/entities.js)
- Home cache with stale-while-revalidate + dog-switch invalidation
- 92 UX issues fixed (error handling, dead-ends, empty states, premium flow, navigation)
- Public pages (QR code, vet view) accessible without login
- All unicode emojis replaced with Lucide icons
- Codebase docs: .planning/codebase/ (7 documents, 26 mars 2026)

## Current State (v4.0 shipped — 27 mars 2026)
- v4.0 "E2E Fixes": 35 requirements, 5 phases, 165 flows audites, 18 fichiers modifies
- RGPD conforme (deleteUser, VetNote, email masque)
- Backend scalable (queries filtrees, polling Stripe, guard double-clic)
- UX coherente (erreurs FR, confirmations, prefs refresh, sessionStorage safe)
- Edge cases couverts (BCS, QR fallback, PDF erreur, dead code supprime)

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

## Constraints
- Git-first workflow (0 credit) — Build prompts only for schema changes
- UI en francais, code en anglais
- Design system: cream bg + forest #1A4D3E + emerald #2D9F82, ZERO orange
- NE JAMAIS modifier pawcoach/src/components/ui/ (shadcn)
