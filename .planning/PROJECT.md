# PawCoach

## What This Is

PawCoach est une PWA coach bien-etre canin construite sur Base44. Elle combine check-in quotidien IA, suivi sante (vaccins, poids, visites vet), nutrition (plans repas, scanner aliments), activite (balades GPS, programmes IA 7j, dressage) et gamification (streak, badges). L'app cible les proprietaires de chiens francophones qui veulent un compagnon IA pour le suivi quotidien de leur animal.

## Core Value

Le check-in quotidien IA doit produire des conseils pertinents bases sur TOUTES les donnees du chien — pas des reponses generiques. Si les donnees collectees ne sont pas utilisees, l'app ment a l'utilisateur.

## Requirements

### Validated

- v1.0 Data Flow Integrity (16 requirements) — shipped 2026-03-11
  - Allergies unifiees, score sante enrichi, PDF 3 sources poids, 3 fonctions IA enrichies
  - Rappels email etendus, appetite alerts, 3 repas/jour, streak balade, comportement tracking
- v1.1 Quality Audit (20 requirements) — shipped 2026-03-12
  - COPY_FR, A11Y, PERF, EDGE_CASES: 120+ corrections
  - DEAD_CODE: 55 fichiers nettoyes, 9 orphelins supprimes
  - ERROR_UX: toasts FR, skeletons, etats vides, validation formulaire
  - SECURITY: 17 champs sanitises, URL allowlist, 0 secrets
  - CONSISTENCY: gradient-primary, rounded-2xl, emerald success colors

### Active

(No active requirements — next milestone not started)

### Out of Scope

- GPS path persistence — stockage lourd, valeur marginale pour le MVP
- Calories persistence — recalculable a la volee, pas critique
- Park reviews cross-system — reviews en silo acceptable pour le moment
- meal_times notifications — necessite push notifications (pas encore implemente)
- water_bowls UI — champ fantome, reporter a un futur sprint
- Refactoring architectural — trop risque sans framework de test
- Tests unitaires — pas de framework de test configure sur Base44
- i18n complet — app FR-only, pas besoin de systeme de traduction

## Context

- **Stack**: Base44 (Vite + React + Tailwind + shadcn/ui), backend Deno (.ts), Base44 SDK
- **Workflow**: Git push → Base44 2-way sync → 0 credit. Build prompts uniquement pour schema changes.
- **Entities**: ~22 entites actives (Dog, DailyCheckin, DailyLog, HealthRecord, GrowthEntry, DietPreferences, FoodScan, NutritionPlan, Streak, Bookmark, DogAchievement, ParkReview, WeeklyInsight, UserProgress, DiagnosisReport, VetNote, etc.)
- **Code map**: PAWCOACH-MAP.md (20 pages, ~112 composants apres cleanup, 22 fonctions backend)
- **Build credits**: 47/~200 utilises
- **Quality state**: v1.1 audit complet — 0 dead code, error UX couverte, securite renforcee, UI coherente

## Constraints

- **Platform**: Base44 — pas de cron custom, pas de push notifications natives, backend Deno uniquement
- **Budget**: 0 Build prompt pour les milestones qualite (tout via Git push, pas de schema changes)
- **Solo**: Ismail est seul, non-dev — tout doit etre fait par Claude Code
- **Regression risk**: 20 pages interconnectees — toujours verifier "qui utilise ce fichier" avant de modifier un utilitaire partage

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Unifier allergies dans le scanner (pas merger les entites) | Merger dog.allergies + DietPreferences.disliked_foods dans les prompts du scanner, sans restructurer le schema | ✓ Good — v1.0 |
| Supprimer healthScoreCalculate.ts backend | Code mort — aucun composant UI ne l'appelle. Le score frontend (healthStatus.js) est la seule source de verite | ✓ Good — v1.0 |
| Streak = check-in + balade | Les deux comptent comme activite quotidienne. La balade seule maintient le streak. | ✓ Good — v1.0 |
| 3 repas: ajouter noon au JSON schema | Plus simple que de forcer 2 repas max dans l'UI | ✓ Good — v1.0 |
| sanitize() inline dans chaque fonction backend | Pattern leger, pas de lib externe. replace(/[<>]/g, '') + substring(500) | ✓ Good — v1.1 |
| URL allowlist pour images IA | Domaines autorises: base44.app, amazonaws.com. Prevention SSRF. | ✓ Good — v1.1 |
| green→emerald sauf couleurs categorielles | ScoreBar Fibres garde bg-green-500 (couleur nutriment), AchievementsSection garde text-green-600 (rang) | ✓ Good — v1.1 |

---
*Last updated: 2026-03-12 after v1.1 Quality Audit milestone complete*
