# PawCoach

## What This Is

PawCoach est une PWA coach bien-etre canin construite sur Base44. Elle combine check-in quotidien IA, suivi sante (vaccins, poids, visites vet), nutrition (plans repas, scanner aliments), activite (balades GPS, programmes IA 7j, dressage) et gamification (streak, badges). L'app cible les proprietaires de chiens francophones qui veulent un compagnon IA pour le suivi quotidien de leur animal.

## Core Value

Le check-in quotidien IA doit produire des conseils pertinents bases sur TOUTES les donnees du chien — pas des reponses generiques. Si les donnees collectees ne sont pas utilisees, l'app ment a l'utilisateur.

## Requirements

### Validated

<!-- Shipped and confirmed valuable — from Phases 0-5 of existing roadmap -->

- Sprint 0: 6 quick wins funnel (segmentation paywall, nudge J2+, post-trial sheet)
- Sprint 1: micro-conseil post check-in, next best action, weekly insight, comportement adulte, scanner viral
- Nutrition 360: plans repas IA 7j, preferences alimentaires, NutriCoach chat
- Programme Forme 7j: generation IA, completion tracking, bilan post-programme
- Walk & Parks: GPS tracking, parcs proches (Overpass API), reviews, share card
- Activite Cabinet QA: 18 bugs fixes (memory leaks, prompt injection, race conditions)
- Sante: flow fixes, smart notebook (score 0-100, WSAVA 2024), vaccine UX overhaul
- Audit complet: 113 findings examines, 56 corrections, 100% CRIT+HIGH fixed
- Strategie: benchmark 12 concurrents, SWOT, positionnement, 15 features priorisees

### Active

<!-- Current scope — Data Flow Integrity milestone v1.0 -->

- [ ] Unifier les sources d'allergies (dog.allergies vs DietPreferences.disliked_foods)
- [ ] Brancher GrowthEntry dans le score sante frontend
- [ ] Brancher GrowthEntry dans le PDF sante
- [ ] Nettoyer le score sante backend mort (healthScoreCalculate.ts)
- [ ] Weekly insight: integrer HealthRecord (vaccins, visites, medicaments)
- [ ] Etendre les rappels email aux medicaments et visites vet
- [ ] Rappels vaccins pour free users (pas seulement premium)
- [ ] Monthly summary: integrer les check-ins (mood, energy, symptoms)
- [ ] Reponse IA du check-in: ajouter memoire des check-ins precedents
- [ ] SmartAlerts: ajouter appetite aux tendances surveillees
- [ ] Scanner: lire DietPreferences pour contextualiser l'analyse
- [ ] Corriger la generation de plan 3 repas/jour (JSON morning/noon/evening)
- [ ] Streak: considerer les balades comme contribution (pas seulement check-in)
- [ ] Tracking completion des programmes comportement (jour par jour)
- [ ] Infos veto (vet_name, vet_city) dans le PDF sante
- [ ] next_vet_appointment dans le score sante et les rappels

### Out of Scope

- GPS path persistence — stockage lourd, valeur marginale pour le MVP
- Calories persistence — recalculable a la volee, pas critique
- Park reviews cross-system — reviews en silo acceptable pour le moment
- meal_times notifications — necessite push notifications (pas encore implemente)
- water_bowls UI — champ fantome, reporter a un futur sprint
- Dog.next_vet_appointment dans le PDF — faible impact, reporter

## Context

- **Stack**: Base44 (Vite + React + Tailwind + shadcn/ui), backend Deno (.ts), Base44 SDK
- **Workflow**: Git push → Base44 2-way sync → 0 credit. Build prompts uniquement pour schema changes.
- **Entities**: ~22 entites actives (Dog, DailyCheckin, DailyLog, HealthRecord, GrowthEntry, DietPreferences, FoodScan, NutritionPlan, Streak, Bookmark, DogAchievement, ParkReview, WeeklyInsight, UserProgress, DiagnosisReport, VetNote, etc.)
- **Code map**: PAWCOACH-MAP.md (20 pages, 121 composants, 21 fonctions backend)
- **Build credits**: 47/~200 utilises

## Constraints

- **Platform**: Base44 — pas de cron custom, pas de push notifications natives, backend Deno uniquement
- **Budget**: 0 Build prompt pour ce milestone (tout via Git push, pas de schema changes)
- **Solo**: Ismail est seul, non-dev — tout doit etre fait par Claude Code
- **Regression risk**: 20 pages interconnectees — toujours verifier "qui utilise ce fichier" avant de modifier un utilitaire partage

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Unifier allergies dans le scanner (pas merger les entites) | Merger dog.allergies + DietPreferences.disliked_foods dans les prompts du scanner, sans restructurer le schema | -- Pending |
| Supprimer healthScoreCalculate.ts backend | Code mort — aucun composant UI ne l'appelle. Le score frontend (healthStatus.js) est la seule source de verite | -- Pending |
| Streak = check-in + balade | Les deux comptent comme activite quotidienne. La balade seule maintient le streak. | -- Pending |
| 3 repas: ajouter noon au JSON schema | Plus simple que de forcer 2 repas max dans l'UI | -- Pending |

## Current Milestone: v1.1 Quality Audit

**Goal:** Audit qualite approfondi sur 8 axes — eliminer le code mort, renforcer l'UX d'erreur, securiser les donnees, et harmoniser les patterns UI.

**Target features:**
- Axe 1-4 (DONE): COPY_FR, A11Y, PERF, EDGE_CASES — 120+ corrections appliquees
- Axe 5: DEAD_CODE — imports inutilises, composants orphelins, variables mortes
- Axe 6: ERROR_UX — messages d'erreur vagues, etats vides, fallbacks manquants
- Axe 7: SECURITY — XSS, donnees exposees, sanitization, secrets
- Axe 8: CONSISTENCY — patterns UI incoherents (boutons, cards, spacing, couleurs)

---
*Last updated: 2026-03-12 after milestone v1.1 Quality Audit started*
