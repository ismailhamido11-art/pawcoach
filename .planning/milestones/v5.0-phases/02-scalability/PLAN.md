---
phase: 02
plan: scalability
type: auto
autonomous: true
requirements: [SCALE-01, SCALE-02, SCALE-03]
---

# Phase 02 — Scalability : Caps & Filters

## Objectif
Eliminer tous les `.list()` sans filtre et tous les `.filter()` sans limite dans le backend et le frontend pour garantir que PawCoach tient la route a 10k+ utilisateurs.

## Context
- v4.0 a deja corrige monthlySummary et walkReminder
- 6 fonctions CRON restantes utilisent encore Dog.list() / User.list()
- 5+ composants frontend font des HealthRecord.filter() sans cap
- FoodScan.filter dans Home.jsx n'a pas de limite

## Tasks

### Task 1 — SCALE-01a : weeklyInsightGenerate (Dog.list + User.list)
**Fichier** : base44/functions/weeklyInsightGenerate/entry.ts

Remplacer :
- `Dog.list()` (ligne 20) par `User.filter({ is_premium: true })` pour ne traiter que les users premium, puis `Dog.filter({ owner: user.email })` par user
- `User.list()` (ligne 33) est redondant une fois qu'on filtre par premium upfront

Pattern : filtrer les users premium d'abord, iterer par user, fetch les chiens de ce user.

### Task 2 — SCALE-01b : vaccineReminders (Dog.list + User.list)
**Fichier** : base44/functions/vaccineReminders/entry.ts

La fonction charge deja les vaccines avec `HealthRecord.filter({ type: "vaccine" })` (bon).
Remplacer `Dog.list()` et `User.list()` par des maps construits a partir des dog_id uniques presents dans les vaccines upcoming uniquement.

### Task 3 — SCALE-01c : medicationReminders (Dog.list + User.list)
**Fichier** : base44/functions/medicationReminders/entry.ts

Meme pattern que vaccineReminders. Construire dogIds uniques depuis medications upcoming, puis Dog.filter + User.filter cibles.

### Task 4 — SCALE-01d : vetVisitReminders (Dog.list + User.list)
**Fichier** : base44/functions/vetVisitReminders/entry.ts

Meme pattern que medicationReminders.

### Task 5 — SCALE-01e : streakReminder (Streak.list + Dog.list + User.list)
**Fichier** : base44/functions/streakReminder/entry.ts

Remplacer Streak.list() par Streak.filter({ current_streak__gte: 3 }) si supporte, sinon garder Streak.list() mais filtrer Dog/User en ciblant uniquement les dog_ids uniques des streaks actifs.

### Task 6 — SCALE-02 : Home.jsx FoodScan.filter sans limite
**Fichier** : src/pages/Home.jsx

Ligne 53 : ajouter ", -timestamp, 20" au FoodScan.filter.

### Task 7 — SCALE-03 : HealthRecord.filter caps frontend
**Fichiers** :
- src/pages/Home.jsx ligne 51 : ajouter ", -date, 100"
- src/pages/Dashboard.jsx ligne 85 : ajouter ", -date, 100"
- src/pages/Sante.jsx ligne 99 : ajouter ", -date, 200" (page dediee sante, besoin de plus)
- src/components/notifications/NotificationCenter.jsx ligne 78 : ajouter ", -next_date, 50"
- src/components/notebook/SmartHealthAssistant.jsx ligne 338 : ajouter ", -date, 200" (dedup avant creation, besoin exhaustif)
- src/pages/DogPublicProfile.jsx ligne 88 : ajouter ", -date, 100"

## Verification
- Aucun `.list()` restant dans les 5 fonctions CRON ciblees
- Aucun `HealthRecord.filter` ni `FoodScan.filter` sans limite dans le frontend
- Git push reussi, build sans erreur

## Success criteria
- SCALE-01 : 5 fonctions CRON modifiees, plus de Dog.list()/User.list() non cibles
- SCALE-02 : FoodScan.filter dans Home.jsx a une limite de 20
- SCALE-03 : Tous les HealthRecord.filter frontend ont des caps entre 50 et 200
