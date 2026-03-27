---
phase: 02-donnees-fausses
plan: "01"
subsystem: home-display
tags: [data-correctness, hero-message, daily-progress, calendar, briefing, accents]
dependency_graph:
  requires: []
  provides: [DATA-01-partial, DATA-02, DATA-06]
  affects: [Home.jsx, DailyProgress.jsx, CalendarStrip.jsx, DailyBriefing.jsx]
tech_stack:
  added: []
  patterns: [mood-conditional-ternary, semantic-field-naming]
key_files:
  modified:
    - src/pages/Home.jsx
    - src/components/home/DailyProgress.jsx
    - src/components/home/CalendarStrip.jsx
    - src/components/home/DailyBriefing.jsx
decisions:
  - "DailyProgress card renamed 'Repas' -> 'Eau' (Droplets icon): DailyLog has no meals_count field — CombinedFAB only writes water_bowls, walk_minutes, weight_kg, notes"
  - "CalendarStrip logDates Set removed (dead code after hasActivity simplification)"
metrics:
  duration: ~10min
  completed: "2026-03-27T16:55:00Z"
  tasks_completed: 3
  files_modified: 4
---

# Phase 02 Plan 01: Corriger donnees fausses visibles — Summary

**One-liner:** Hero Home conditionnel sur mood (1-2/3/4-5), carte Eau renommee depuis faux Repas, CalendarStrip baseee sur walk_minutes uniquement, accents corriges dans DailyBriefing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hero message Home conditionnel sur mood | 3028f5d | src/pages/Home.jsx |
| 2 | Carte Eau (renommee depuis Repas) + CalendarStrip hasActivity | 5b2e9cd | src/components/home/DailyProgress.jsx, CalendarStrip.jsx |
| 3 | Accents manquants DailyBriefing | 8202f76 | src/components/home/DailyBriefing.jsx |

## What Changed

### Task 1 — Hero Home (DATA-01 partial)

Home.jsx affichait toujours "Rex est en forme !" independamment du mood. Remplace par:
- mood >= 4 : "est en forme !" + "Continue comme ca..."
- mood == 3 : "a une journee tranquille" + "Une petite balade lui ferait du bien."
- mood <= 2 : "n'est pas au top..." + "Garde un oeil sur lui..."
- pas de check-in : "attend son check-in" (inchange)

Pattern-proactif CGC: 4 autres instances de "en forme" dans le codebase (DogRadarHero, FreeExercisesGate, StreakBar, DailyBriefing) — verifiees comme contextuellement correctes (labels mood, badge name, message conditionnel).

### Task 2 — Carte Eau + CalendarStrip (DATA-02)

**DailyProgress.jsx:** La carte "Repas" lisait `water_bowls` (bols d'eau). Corrige en :
- Renomme la variable `meals` -> `waterBowls`
- Renomme le label "Repas" -> "Eau"
- Remplace l'icone `UtensilsCrossed` -> `Droplets`
- Couleur schema : amber -> cyan (semantiquement correct)
- Valeur : `N bol` au lieu d'un simple nombre

Note de deviation (voir ci-dessous) : `meals_count` n'existe pas dans le schema DailyLog.

**CalendarStrip.jsx:** `hasActivity` incluait `water_bowls > 0` — un point vert apparaissait si le chien avait juste bu de l'eau. Corrige en `walk_minutes > 0` uniquement. La variable `logDates` est devenue inutilisee et a ete supprimee (dead code cleanup).

### Task 3 — Accents DailyBriefing (DATA-06)

Corrections appliquees dans `generateBriefing()` :
- "debut" -> "début" (lignes 38, 76)
- "etait" -> "était" / "n'etait" -> "n'était" (lignes 44, 46)
- "energie" -> "énergie", "a revendre" -> "à revendre" (ligne 56)
- "Verifier sa sante" -> "Vérifier sa santé" (ligne 62)
- "recommandees" -> "recommandées" (ligne 66)
- "Verifie" -> "Vérifie" (ligne 69)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renomme 'Repas' -> 'Eau' au lieu de 'water_bowls -> meals_count'**
- **Found during:** Task 2
- **Issue:** Le plan demandait de remplacer `water_bowls` par `meals_count`, mais `meals_count` n'existe pas dans le schema DailyLog. CombinedFAB n'a pas de champ repas — LOG_FIELDS contient uniquement `weight_kg`, `walk_minutes`, `water_bowls`, `notes`. Il n'y a pas de tracking de repas dans DailyLog.
- **Fix:** La carte affiche maintenant `water_bowls` correctement labele "Eau" avec l'icone Droplets et les couleurs cyan. Semantiquement honnete — pas de champ fantome. La carte navigait vers Nutri ; on a retire ce lien car l'eau n'est pas liee a la nutrition dans ce contexte.
- **Files modified:** src/components/home/DailyProgress.jsx
- **Commit:** 5b2e9cd

**2. [Rule 1 - Dead code] Suppression de logDates dans CalendarStrip**
- **Found during:** Task 2
- **Issue:** Apres simplification de `hasActivity`, la variable `logDates = new Set(...)` n'etait plus utilisee.
- **Fix:** Variable supprimee.
- **Files modified:** src/components/home/CalendarStrip.jsx
- **Commit:** 5b2e9cd

## Verification Results

| Check | Expected | Result |
|-------|----------|--------|
| grep "todayCheckin.mood" Home.jsx | >= 1 ligne conditionnel | 4 lignes (ternaire double) |
| grep "water_bowls" DailyProgress.jsx | 0 instances hors lecture | 1 instance (lecture correcte) |
| grep "water_bowls" CalendarStrip.jsx | 0 instances | 0 instances |
| grep "debut\b" DailyBriefing.jsx | 0 instances | 0 instances |
| CGC "en forme" | instances conditionnelles | 5 instances, toutes conditionnelles |
| CGC "water_bowls" | 2 instances restantes | 2 instances (DailyProgress+Chat backend) |

## Known Stubs

Aucun stub — tous les champs lus existent dans le schema (water_bowls, walk_minutes, mood).

## Self-Check: PASSED

- [x] src/pages/Home.jsx modifie et commit 3028f5d
- [x] src/components/home/DailyProgress.jsx modifie et commit 5b2e9cd
- [x] src/components/home/CalendarStrip.jsx modifie et commit 5b2e9cd
- [x] src/components/home/DailyBriefing.jsx modifie et commit 8202f76
- [x] Commits verifies via git log
