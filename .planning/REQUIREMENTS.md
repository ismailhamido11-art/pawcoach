# Requirements: PawCoach

**Defined:** 2026-03-11
**Core Value:** Les donnees collectees doivent etre utilisees partout ou elles ont du sens — pas de champs fantomes, pas de flux casses.

## v1.0 Requirements

Requirements pour le milestone Data Flow Integrity. Chaque requirement corrige un flux de donnees casse ou orphelin identifie par l'audit du 11 mars 2026.

### Coherence donnees

- [x] **DATA-01**: Le scanner aliments ET le comparateur prennent en compte DietPreferences.disliked_foods en plus de dog.allergies
- [x] **DATA-02**: Le score sante frontend (healthStatus.js) integre les poids GrowthEntry et DailyLog en plus de HealthRecord
- [ ] **DATA-03**: Le PDF sante inclut les poids GrowthEntry et DailyLog (pas seulement HealthRecord.type=weight)
- [x] **DATA-04**: Le code mort healthScoreCalculate.ts est supprime (le score frontend healthStatus.js est la seule source de verite)

### Flux IA

- [ ] **AI-01**: La reponse IA post check-in utilise les 7 derniers check-ins pour detecter les tendances (mood, energy, appetite, symptoms)
- [ ] **AI-02**: Le weekly insight integre les donnees HealthRecord (vaccins en retard, visites, medicaments) ET les behavior_notes/notes des check-ins
- [ ] **AI-03**: Le monthly summary integre les check-ins (mood moyen, energy moyen, symptoms signales, streak)

### Notifications

- [ ] **NOTIF-01**: Les rappels email couvrent les medicaments avec next_date (meme logique que vaccins)
- [ ] **NOTIF-02**: Les rappels email couvrent les visites vet avec next_date
- [ ] **NOTIF-03**: Les rappels vaccin sont envoyes aux free users (pas seulement premium/trial)

### Dashboard

- [ ] **DASH-01**: SmartAlerts detecte les tendances d'appetite en plus de mood et energy

### Nutrition

- [ ] **NUTRI-01**: La generation de plan 3 repas/jour produit un JSON avec morning/noon/evening (pas seulement morning/evening)

### Activite

- [ ] **ACT-01**: Une balade enregistree (DailyLog) contribue au streak quotidien
- [ ] **ACT-02**: Les programmes comportement 7j ont un tracking de completion jour par jour (comme les programmes forme)

### Sante

- [ ] **SANTE-01**: Le PDF sante inclut vet_name et vet_city du profil chien
- [ ] **SANTE-02**: next_vet_appointment contribue au score sante et apparait dans les rappels

## v2 Requirements

Deferred au prochain milestone.

- **PARK-01**: Park reviews integrees dans le contexte AI du chat
- **WALK-01**: GPS path persiste en base pour historique visuel
- **NUTRI-02**: meal_times declenchent des notifications de rappel repas
- **NUTRI-03**: water_bowls a une UI de saisie dans le check-in ou la page activite
- **WALK-02**: Calories de balade persistees en base

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nouvelles features (Sprint 2-3 strategy) | On corrige d'abord, on ajoute ensuite |
| Schema changes (Build prompts) | Tout corrigeable via Git push, 0 credit |
| Refactoring architecture global | On corrige les flux, pas la structure |
| Merge des 4 sources de poids en 1 | Trop risque, on corrige les consommateurs a la place |
| Merge dog.allergies + DietPreferences en 1 champ | Concepts differents (allergies medicales vs preferences), on les combine dans les prompts |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete (2026-03-11) |
| DATA-02 | Phase 1 | Complete (2026-03-11) |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Complete (2026-03-11) |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| NOTIF-01 | Phase 3 | Pending |
| NOTIF-02 | Phase 3 | Pending |
| NOTIF-03 | Phase 3 | Pending |
| DASH-01 | Phase 4 | Pending |
| NUTRI-01 | Phase 4 | Pending |
| ACT-01 | Phase 4 | Pending |
| ACT-02 | Phase 4 | Pending |
| SANTE-01 | Phase 4 | Pending |
| SANTE-02 | Phase 4 | Pending |

**Coverage:**
- v1.0 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 — DATA-02 + DATA-04 complete (01-02-PLAN execution)*
