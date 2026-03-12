# Roadmap: PawCoach

## Milestones

- **v1.0 Data Flow Integrity** - Phases 1-4 (shipped 2026-03-11)
- **v1.1 Quality Audit** - Phases 5-8 (in progress)

## Phases

<details>
<summary>v1.0 Data Flow Integrity (Phases 1-4) — SHIPPED 2026-03-11</summary>

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
- [x] 03-01-PLAN.md — vaccineReminders (retirer filtre premium) + medicationReminders (nouvelle fonction CRON)
- [x] 03-02-PLAN.md — vetVisitReminders (nouvelle fonction CRON)

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
- [x] 04-01-PLAN.md — SmartAlerts : detection tendance appetit + WalkMode : streak apres balade
- [x] 04-02-PLAN.md — NutritionMealPlan : noon dans le prompt JSON + affichage UI repas midi
- [x] 04-03-PLAN.md — BehaviorProgramCard : tracking completion jour par jour (completed_days)
- [x] 04-04-PLAN.md — DownloadHealthPDF : vet_name + vet_city + next_vet_appointment dans PDF et score sante

</details>

---

### v1.1 Quality Audit (In Progress)

**Milestone Goal:** Audit qualite approfondi sur 4 axes — eliminer le code mort, renforcer l'UX d'erreur, securiser les donnees, et harmoniser les patterns UI. Qualite production.

- [ ] **Phase 5: Dead Code** - Supprimer tous les imports, variables, composants et fichiers backend morts du repo
- [ ] **Phase 6: Error UX** - Garantir que chaque erreur, liste vide, formulaire et chargement communique clairement a l'utilisateur
- [ ] **Phase 7: Security** - Eliminer toute exposition de secrets, inputs non sanitizes, et rendus HTML bruts non proteges
- [ ] **Phase 8: Consistency** - Harmoniser les patterns visuels (boutons, cards, espacements, couleurs d'etat) sur toutes les pages

## Phase Details

### Phase 5: Dead Code
**Goal**: Le repo ne contient plus de code mort — aucun import inutilise, variable declaree sans usage, composant orphelin ou fichier backend non reference. Le codebase est propre et lisible.
**Depends on**: Nothing (independent — suggested first to reduce noise for phases 6-8)
**Requirements**: DEAD-01, DEAD-02, DEAD-03, DEAD-04
**Success Criteria** (what must be TRUE):
  1. Aucun fichier JSX/JS n'a d'import en ligne 1-N qui n'est pas utilise dans le corps du fichier
  2. Aucune variable ou fonction n'est declaree sans etre appelee (zero unused declarations)
  3. Aucun composant React n'existe dans le repo sans etre importe quelque part (orphelin verifiable par grep)
  4. Aucun fichier .ts dans functions/ n'est absent des configs de routing backend
**Plans**: TBD

Plans:
- [ ] 05-01: Audit et suppression imports/variables/fonctions morts (JSX/JS frontend)
- [ ] 05-02: Audit et suppression composants orphelins + fichiers backend morts

### Phase 6: Error UX
**Goal**: Chaque situation d'erreur, liste vide, validation formulaire et etat de chargement produit un feedback clair et actionnable pour l'utilisateur — plus d'ecrans blancs ni de silence silencieux.
**Depends on**: Nothing (independent — suggested after Phase 5)
**Requirements**: ERR-01, ERR-02, ERR-03, ERR-04
**Success Criteria** (what must be TRUE):
  1. Un appel API qui echoue affiche un message en francais expliquant ce qui s'est passe (pas une console.error invisible, pas de crash)
  2. Une liste sans donnees affiche un etat vide illustre avec un texte explicatif et une action suggeree (pas un conteneur vide)
  3. Un formulaire soumis avec des donnees invalides affiche le champ en erreur et un message specifique sous le champ
  4. Une page ou un bloc de donnees en cours de chargement affiche un spinner ou un skeleton — l'utilisateur sait que quelque chose se charge
**Plans**: TBD

Plans:
- [ ] 06-01: Audit et ajout try/catch avec messages user-friendly sur tous les appels API
- [ ] 06-02: Ajout etats vides explicites sur toutes les listes + skeletons/spinners sur les chargements
- [ ] 06-03: Ajout messages de validation clairs sur tous les formulaires

### Phase 7: Security
**Goal**: Le code ne contient aucun secret en clair, aucun input utilisateur directement injecte dans du HTML ou des prompts IA, et aucune donnee externe utilisee sans validation.
**Depends on**: Nothing (independent — suggested after Phase 6)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04
**Success Criteria** (what must be TRUE):
  1. Aucune cle API, token ou secret n'est present en clair dans un fichier source (frontend ou backend)
  2. Tout input utilisateur injecte dans un prompt IA ou affiche en HTML passe par une fonction de sanitization
  3. Toute URL externe et toute donnee issue d'une API tierce est validee (format, domaine) avant utilisation
  4. Aucun rendu HTML brut depuis du contenu utilisateur sans sanitization prealable dans le repo
**Plans**: TBD

Plans:
- [ ] 07-01: Audit secrets en clair + sanitization des inputs dans les prompts IA
- [ ] 07-02: Audit validation URLs/donnees externes + audit rendus HTML bruts non proteges

### Phase 8: Consistency
**Goal**: L'interface visuelle est coherente sur toutes les pages — meme pattern de boutons primaires, meme style de cards, meme espacement, meme code couleur pour les etats.
**Depends on**: Nothing (independent — suggested last as polish)
**Requirements**: CONS-01, CONS-02, CONS-03, CONS-04
**Success Criteria** (what must be TRUE):
  1. Tous les boutons d'action principale utilisent le meme variant (gradient-primary ou btn-primary) — aucun bouton rouge/bleu/vert qui devrait etre le style standard
  2. Toutes les cards de contenu ont le meme arrondi (rounded-2xl), meme bordure et meme padding interne
  3. Les marges laterales de page sont uniformes (mx-4 ou mx-5 selon la page) et les gaps entre elements sont coherents (gap-3 ou gap-4)
  4. Les etats succes affichent du vert emerald, les warnings de l'amber, et les erreurs du rouge — partout dans l'app sans exception
**Plans**: TBD

Plans:
- [ ] 08-01: Harmonisation boutons primaires sur toutes les pages
- [ ] 08-02: Harmonisation cards + espacements sur toutes les pages
- [ ] 08-03: Harmonisation couleurs d'etat (success/warning/error) sur toutes les pages

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Coherence | v1.0 | 3/3 | Complete | 2026-03-11 |
| 2. AI Enrichment | v1.0 | 3/3 | Complete | 2026-03-11 |
| 3. Notifications | v1.0 | 2/2 | Complete | 2026-03-11 |
| 4. Independent Fixes | v1.0 | 4/4 | Complete | 2026-03-11 |
| 5. Dead Code | v1.1 | 0/2 | Not started | - |
| 6. Error UX | v1.1 | 0/3 | Not started | - |
| 7. Security | v1.1 | 0/2 | Not started | - |
| 8. Consistency | v1.1 | 0/3 | Not started | - |

---
*Roadmap v1.0 created: 2026-03-11 — 16/16 requirements mapped*
*Roadmap v1.1 created: 2026-03-12 — 16/16 requirements mapped (phases 5-8)*
