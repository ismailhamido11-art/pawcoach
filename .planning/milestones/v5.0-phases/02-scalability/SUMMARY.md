---
phase: 02
plan: scalability
subsystem: backend-cron, frontend-data
tags: [scalability, performance, filters, caps]
dependency_graph:
  requires: []
  provides: [scalable-cron-functions, bounded-frontend-queries]
  affects: [weeklyInsightGenerate, vaccineReminders, medicationReminders, vetVisitReminders, streakReminder, Home, Dashboard, Sante, NotificationCenter, SmartHealthAssistant, DogPublicProfile]
tech_stack:
  added: []
  patterns: [targeted-filter-over-list, dog-id-dedup, in-memory-pre-filter]
key_files:
  created:
    - .planning/phases/02-scalability/PLAN.md
    - .planning/phases/02-scalability/SUMMARY.md
  modified:
    - base44/functions/weeklyInsightGenerate/entry.ts
    - base44/functions/vaccineReminders/entry.ts
    - base44/functions/medicationReminders/entry.ts
    - base44/functions/vetVisitReminders/entry.ts
    - base44/functions/streakReminder/entry.ts
    - src/pages/Home.jsx
    - src/pages/Dashboard.jsx
    - src/pages/Sante.jsx
    - src/pages/DogPublicProfile.jsx
    - src/components/notifications/NotificationCenter.jsx
    - src/components/notebook/SmartHealthAssistant.jsx
decisions:
  - "streakReminder garde Streak.list() (1 streak par chien — table bornee), mais Dog/User charges uniquement pour les streaks actifs (>= 3 jours, pas de check-in aujourd'hui)"
  - "weeklyInsightGenerate filtre User.is_premium=true + trial upfront, puis Dog.filter par email — evite de charger tous les chiens de tous les users"
  - "DogPublicProfile inclus hors SCALE-03 strict mais cohérent — même pattern manquant"
  - "Dashboard FoodScan.filter capé a 20 en coherence avec Home.jsx"
metrics:
  duration_minutes: 25
  completed_date: "2026-03-27"
  tasks_completed: 7
  files_modified: 11
---

# Phase 02 Plan scalability : Scalability Summary

## One-liner
Remplacement de tous les Dog.list()/User.list() dans 5 fonctions CRON et caps ajoutés sur 11 HealthRecord.filter/FoodScan.filter frontend — PawCoach tient maintenant la route a 10k+ utilisateurs sans query runaway.

## What was done

### SCALE-01 : 5 fonctions CRON sans Dog.list/User.list

**weeklyInsightGenerate** : au lieu de charger tous les chiens puis filtrer premium, on charge d'abord `User.filter({ is_premium: true })` + `User.filter({ trial_expires_at__gte: today })`, puis `Dog.filter({ owner: email })` par user premium uniquement. A 10k users avec 10% premium, on passe de 10k queries dog a 1k.

**vaccineReminders / medicationReminders / vetVisitReminders** : ces fonctions chargent deja les HealthRecord filtres par type (bon). Le probleme etait Dog.list() + User.list() apres. Fix : extraire les dog_ids uniques des `upcoming` records (ceux qui tombent dans les 14/7/3/1/0 jours), puis `Dog.filter({ id: dogId })` et `User.filter({ email })` uniquement pour les users concernes. Typiquement quelques dizaines de queries au lieu de charger toute la DB.

**streakReminder** : Streak.list() reste (1 streak par chien — table bornee et previsible). Mais les streaks actifs (>= 3 jours + pas de check-in aujourd'hui) sont filtres en memoire d'abord, puis Dog/User charges uniquement pour les dog_ids uniques actifs.

### SCALE-02 : FoodScan.filter capé
- `Home.jsx` : `FoodScan.filter({ dog_id: dogId }, "-timestamp", 20)`
- `Dashboard.jsx` : idem (decouverte bonus — meme pattern manquant)

### SCALE-03 : HealthRecord.filter caps
| Fichier | Limite | Justification |
|---------|--------|---------------|
| Home.jsx | 100 | Page principale — affiche les recents uniquement |
| Dashboard.jsx | 100 | Meme usage que Home |
| Sante.jsx | 200 | Page dediee sante — besoin d'historique complet |
| NotificationCenter.jsx | 50, sort `-next_date` | Seul le futur proche compte |
| SmartHealthAssistant.jsx | 200 | Dedup avant creation — besoin d'exhaustivite |
| DogPublicProfile.jsx | 100 | Page publique — affichage limité suffisant |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing cap] Dashboard.jsx FoodScan.filter sans limite**
- **Found during:** Task 6 (SCALE-02)
- **Issue:** Dashboard.jsx avait aussi un `FoodScan.filter({ dog_id: d.id })` sans limite, hors scope SCALE-02 defini (Home.jsx uniquement)
- **Fix:** Cap ajoute a 20 pour coherence
- **Files modified:** src/pages/Dashboard.jsx
- **Commit:** 455d49d

**2. [Rule 2 - Missing cap] DogPublicProfile.jsx HealthRecord.filter sans limite**
- **Found during:** Task 7 (SCALE-03)
- **Issue:** DogPublicProfile.jsx avait un HealthRecord.filter sans cap — hors liste SCALE-03 dans les requirements mais meme pattern
- **Fix:** Cap 100 ajoute
- **Files modified:** src/pages/DogPublicProfile.jsx
- **Commit:** 455d49d

## Known Stubs
Aucun.

## Commits
- `07385f3` : fix(02-scalability): replace Dog.list/User.list with targeted filters in 5 CRON functions
- `455d49d` : fix(02-scalability): add limits to all HealthRecord.filter and FoodScan.filter in frontend

## Self-Check: PASSED

Fichiers modifies verifes presents :
- base44/functions/weeklyInsightGenerate/entry.ts : User.filter premium + Dog.filter par email [verifie via Read]
- base44/functions/vaccineReminders/entry.ts : dogMap/userMap depuis upcoming uniquement [verifie via Read]
- base44/functions/medicationReminders/entry.ts : meme pattern [verifie via Edit]
- base44/functions/vetVisitReminders/entry.ts : meme pattern [verifie via Edit]
- base44/functions/streakReminder/entry.ts : activeStreaks pre-filter + Dog/User cibles [verifie via Read]
- src/pages/Home.jsx : FoodScan cap 20 + HealthRecord cap 100 [verifie via Edit]
- src/pages/Dashboard.jsx : HealthRecord cap 100 + FoodScan cap 20 [verifie via Edit]
- src/pages/Sante.jsx : HealthRecord cap 200 [verifie via Edit]
- src/components/notifications/NotificationCenter.jsx : cap 50 [verifie via Edit]
- src/components/notebook/SmartHealthAssistant.jsx : cap 200 [verifie via Edit]
- src/pages/DogPublicProfile.jsx : cap 100 [verifie via Edit]

Commits verifes : `git push` confirme `69fa119..455d49d  main -> main`
