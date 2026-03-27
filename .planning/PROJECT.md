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

## Current Milestone: v4.0 E2E Fixes

**Goal:** Corriger les 78 problemes (8 CASSES + 70 FRAGILES) identifies par l'audit E2E exhaustif de 165 flows.

**Target features:**
- Securite + Legal : RGPD deleteUser, VetNote acces, email expose, quota scan server-side
- Bugs fonctionnels : double credit diagnostic, lien 404, historique diagnostics, erreur anglaise, email mensonger
- Scalabilite backend : queries non filtrees (Dog.list, HealthRecord.list, etc.)
- UX fragile : polling Stripe, UpgradePrompt silencieux, prefs stale, onboarding persistance, poids desync
- Edge cases : sessionStorage try/catch, z-index, error handling, voice input, auth flow

**Source:** .planning/phases/1-audit/E2E-AUDIT-REPORT.md (27 mars 2026)

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
