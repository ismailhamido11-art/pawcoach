# PawCoach

## Vision
PWA coach bien-etre canin — all-in-one pour proprietaires de chiens francophones. Mobile-first.

## Stack
React 18 + Vite 6 + Tailwind 3 + shadcn/ui + Framer Motion + Lucide React
Backend: Base44 platform (22 fonctions Deno)
AI: OpenRouter (DeepSeek + GPT-4o vision)
Payment: Stripe (mensuel 7.99 EUR, annuel 59.99 EUR)

## Current State (v2.0 shipped)
- 16 pages, ~102 composants custom, 22 fonctions backend, 19 entites Base44
- Centralized data layer (src/api/entities.js)
- Home cache with stale-while-revalidate
- Error feedback on all critical paths
- Leaflet lazy-loaded
- Codebase docs: .planning/codebase/ (7 documents, 26 mars 2026)

## Constraints
- Git-first workflow (0 credit) — Build prompts only for schema changes
- UI en francais, code en anglais
- Design system: cream bg + forest #1A4D3E + emerald #2D9F82, ZERO orange
- NE JAMAIS modifier pawcoach/src/components/ui/ (shadcn)
