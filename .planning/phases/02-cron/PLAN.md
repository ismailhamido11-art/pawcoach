---
phase: "02"
plan: "cron"
type: "auto"
---

# Phase 02 — CRON: Optimisation des requetes cron

## Objectif
Remplacer les `list()` globaux dans les fonctions cron par des requetes filtrees pour eviter de charger toute la base.

## Contexte
- `monthlySummary/entry.ts` charge `Dog.list()` + `User.list()` (toute la base)
- `streakReminder/entry.ts` charge `Streak.list()` (table petite mais sans cap)

## Tasks

### CRON-01: monthlySummary — remplacer Dog.list() + User.list()
- Remplacer `User.list()` par `User.filter({ is_premium: true })` pour ne charger que les users premium
- Remplacer `Dog.list()` par une iteration sur les users premium puis `Dog.filter({ owner: user.email })`
- Adapter la logique de construction du userMap et de l'iteration dogs

### CRON-02: streakReminder — cap + log warning sur Streak.list()
- Conserver `Streak.list()` (table 1-par-chien, petite)
- Ajouter un cap: si plus de 500 streaks, logger un warning
- Documenter clairement pourquoi list() est acceptable ici

## Fichiers
- `base44/functions/monthlySummary/entry.ts`
- `base44/functions/streakReminder/entry.ts`
