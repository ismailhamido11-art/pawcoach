# Roadmap: PawCoach — v1.0 Data Flow Integrity

## Overview

Ce milestone corrige tous les flux de donnees casses ou orphelins identifies par l'audit du 11 mars 2026. Les 16 requirements se regroupent naturellement en 4 phases deployables independamment : corrections frontend pures (donnees), enrichissement backend IA, extension des notifications CRON, puis fixes independants mixtes (dashboard, nutrition, activite, sante). Chaque phase peut etre testee et pushee sans bloquer les suivantes.

## Phases

- [x] **Phase 1: Data Coherence** - Brancher les sources de donnees orphelines dans le frontend (allergies, poids, score sante, code mort)
- [x] **Phase 2: AI Enrichment** - Enrichir les 3 fonctions IA backend avec les donnees qu'elles ignorent actuellement (completed 2026-03-11)
- [x] **Phase 3: Notifications** - Etendre les rappels email aux medicaments, visites vet, et free users (completed 2026-03-11)
- [ ] **Phase 4: Independent Fixes** - Corriger les logiques bancales independantes (dashboard, nutrition, streak, comportement, PDF vet)

## Phase Details

### Phase 1: Data Coherence
**Goal**: Les donnees collectees dans le profil chien (allergies, poids, score sante) sont effectivement utilisees partout ou elles ont du sens — plus de champs fantomes ni de sources contradictoires
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Le scanner aliments et le comparateur affichent un avertissement si un ingredient correspond a DietPreferences.disliked_foods, en plus des allergies medicales du chien
  2. Le score sante frontend prend en compte les pesees de GrowthEntry et DailyLog, pas uniquement HealthRecord.type=weight
  3. Le PDF sante genere liste les poids issus de GrowthEntry et DailyLog (toutes les sources, pas seulement HealthRecord)
  4. Le fichier healthScoreCalculate.ts n'existe plus dans le repo (code mort supprime, aucune regression)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scanner + Comparateur : injecter DietPreferences.disliked_foods dans les prompts IA
- [x] 01-02-PLAN.md — HealthScore : migrer vers calcul local (computeHealthScore + GrowthEntry + DailyLog) et supprimer healthScoreCalculate.ts
- [x] 01-03-PLAN.md — PDF sante : merger les 3 sources de poids (HealthRecord + GrowthEntry + DailyLog)

### Phase 2: AI Enrichment
**Goal**: Les 3 fonctions IA (check-in quotidien, weekly insight, monthly summary) produisent des analyses basees sur toutes les donnees disponibles, pas un sous-ensemble
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. La reponse post check-in mentionne une tendance detectee sur les 7 derniers check-ins (ex: "tu signales de la fatigue depuis 3 jours") quand elle existe
  2. Le weekly insight inclut une reference aux evenements HealthRecord de la semaine (vaccin en retard, visite passee, medicament en cours) quand ils existent
  3. Le monthly summary affiche le mood moyen, l'energy moyen, les symptoms recurrents et le streak du mois — pas seulement l'activite physique
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — dailyCheckinProcess : charger les 7 derniers check-ins et injecter les tendances dans le prompt IA
- [x] 02-02-PLAN.md — weeklyInsightGenerate : ajouter fetch HealthRecord et notes check-ins dans le contexte prompt
- [x] 02-03-PLAN.md — monthlySummary : charger DailyCheckins du mois et enrichir l'email avec mood/energy/symptoms

### Phase 3: Notifications
**Goal**: Les rappels email couvrent tous les evenements de sante du chien (vaccins, medicaments, visites vet) pour tous les utilisateurs (free et premium)
**Depends on**: Phase 2
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03
**Success Criteria** (what must be TRUE):
  1. Un medicament avec next_date J+3 declenche un email de rappel au proprietaire (meme logique que les vaccins)
  2. Une visite vet avec next_date J+3 declenche un email de rappel au proprietaire
  3. Un utilisateur free recoit les rappels vaccins (le filtre premium est retire de la fonction vaccineReminders)
**Plans**: 2 plans

Plans:
- [ ] 03-01-PLAN.md — vaccineReminders (retirer filtre premium) + medicationReminders (nouvelle fonction CRON)
- [ ] 03-02-PLAN.md — vetVisitReminders (nouvelle fonction CRON)

### Phase 4: Independent Fixes
**Goal**: Les comportements bancaux independants sont corriges — dashboard, nutrition, streak, suivi comportement, et infos vet dans le PDF
**Depends on**: Phase 3
**Requirements**: DASH-01, NUTRI-01, ACT-01, ACT-02, SANTE-01, SANTE-02
**Success Criteria** (what must be TRUE):
  1. SmartAlerts affiche une alerte de tendance appetite quand l'appetit baisse sur plusieurs jours (comme il le fait pour mood et energy)
  2. La generation de plan nutrition 3 repas/jour produit des repas matin, midi et soir — la carte "midi" n'est plus absente de l'UI
  3. Une balade enregistree (DailyLog) maintient le streak actif — l'utilisateur ne perd pas son streak s'il a fait une balade mais pas de check-in
  4. Le suivi jour par jour des programmes comportement est visible (comme pour les programmes forme) — l'utilisateur voit quels jours sont completes
  5. Le PDF sante inclut le nom et la ville du veterinaire, et next_vet_appointment contribue au score sante
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — SmartAlerts : detection tendance appetit + WalkMode : streak apres balade
- [ ] 04-02-PLAN.md — NutritionMealPlan : noon dans le prompt JSON + affichage UI repas midi
- [ ] 04-03-PLAN.md — BehaviorProgramCard : tracking completion jour par jour (completed_days)
- [ ] 04-04-PLAN.md — DownloadHealthPDF : vet_name + vet_city + next_vet_appointment dans PDF et score sante

## Progress

**Execution Order:**
Phases executees en ordre numerique : 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Coherence | 3/3 | Complete | 2026-03-11 |
| 2. AI Enrichment | 3/3 | Complete   | 2026-03-11 |
| 3. Notifications | 2/2 | Complete   | 2026-03-11 |
| 4. Independent Fixes | 0/4 | Not started | - |

---
*Roadmap created: 2026-03-11 — Milestone v1.0 Data Flow Integrity*
*16/16 requirements mapped — 100% coverage*
*Phase 1 planned: 2026-03-11 — 3 plans, wave 1 (01-01 + 01-02 parallel) + wave 2 (01-03)*
*Phase 2 planned: 2026-03-11 — 3 plans, wave 1 (02-01 + 02-02 + 02-03 parallel)*
*Phase 3 planned: 2026-03-11 — 2 plans, wave 1 (03-01 + 03-02 parallel)*
*Phase 4 planned: 2026-03-11 — 4 plans, wave 1 (04-01 + 04-02 + 04-03 + 04-04 parallel)*
