# Requirements: PawCoach v7.0 "User-Ready"

**Defined:** 2026-03-27
**Core Value:** Donnees fiables et coherentes qui refletent la realite du chien
**Source:** 3 rapports audit + CONCERNS.md + CGC pattern search

## v7.0 Requirements

### Donnees Fausses (DATA)

- [ ] **DATA-01**: Le message d'accueil reflète le vrai mood du dernier check-in (pas "en forme" par defaut) — inclut DogRadarHero, Home, DailyBriefing, StreakBar, FreeExercisesGate (5 instances trouvees par CGC)
- [ ] **DATA-02**: La carte "Repas" affiche les vrais repas, pas les bols d'eau (water_bowls) — DailyProgress + CalendarStrip (2 instances)
- [x] **DATA-03**: GrowthTracker met a jour Dog.weight apres creation de GrowthEntry (comme SectionPoids/WeightCard le font deja)
- [x] **DATA-04**: Le check-in rapide ne fabrique plus energy/appetite a partir du mood — demander ou laisser vide
- [ ] **DATA-05**: Dashboard et Sante utilisent la meme source pour le score wellness (pas de divergence)
- [ ] **DATA-06**: Textes DailyBriefing et EmotionalTip avec accents corrects (pas "debut", "hydrate", "regularite")

### Flux Deconnectes (FLOW)

- [ ] **FLOW-01**: Apres une balade terminee, le cache Home est invalide (DailyProgress montre les vraies stats)
- [ ] **FLOW-02**: Apres un switch de chien, le cache Home est invalide (toutes les donnees rafraichies)
- [ ] **FLOW-03**: SmartHealthAssistant notifie Sante pour TOUS les records d'un batch (pas juste le premier)
- [ ] **FLOW-04**: Apres paiement Stripe, le statut premium est rafraichi sur TOUTES les pages (pas juste Home)

### UX Trompeuse (UX)

- [ ] **UX-01**: Quand l'utilisateur coche des symptomes dans le check-in, l'app propose une action (suggestion diagnostic, lien vers Sante)
- [ ] **UX-02**: Le prix affiche correspond au vrai prix mensuel (7.99 EUR), pas au prix annuel ramene au mois (5 EUR)
- [ ] **UX-03**: Le champ code parrain est masque ou desactive tant que le backend n'existe pas
- [ ] **UX-04**: Le Dashboard (SmartAlerts vaccin/poids) est accessible depuis la Home ou la navigation principale

### Bugs Techniques (TECH)

- [x] **TECH-01**: finalDiagnosis verifie le quota cote serveur (free users ne peuvent pas bypasser)
- [x] **TECH-02**: streakReminder utilise une query filtree au lieu de Streak.list() global
- [x] **TECH-03**: Icone PWA (icon-192.svg) sans marqueurs de conflit Git — fichier valide
- [x] **TECH-04**: monthlySummary ne filtre plus sur is_trial (champ inexistant dans le schema User)
- [x] **TECH-05**: Suppression chien : deleteMany sur entites non-wrappees (ParkReview, PlaceFavorite) sans erreurs silencieuses
- [x] **TECH-06**: Supprimer les console.log restants dans le backend production

## Future Requirements (v8.0+)

- **PUSH-01**: Notifications push (rappels streak, balade, vaccins)
- **ANAL-01**: Analytics trackEvent() fonctionnel
- **OFFLN-01**: Ecran offline coherent pour PWA
- **GUIDE-01**: Guides comportement accessibles depuis Home/Chat

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nouvelles features utilisateur | v7.0 = coherence uniquement, features en v8.0 |
| Refonte UI/design | Le design est solide, c'est la coherence des donnees qui manque |
| Push notifications | Complexite + cout, pas bloquant pour la qualite actuelle |
| Analytics | Utile mais pas critique pour la coherence utilisateur |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TECH-01 | Phase 1 | Complete |
| TECH-02 | Phase 1 | Complete |
| TECH-03 | Phase 1 | Complete |
| TECH-04 | Phase 1 | Complete |
| TECH-05 | Phase 1 | Complete |
| TECH-06 | Phase 1 | Complete |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 2 | Pending |
| DATA-06 | Phase 2 | Pending |
| FLOW-01 | Phase 3 | Pending |
| FLOW-02 | Phase 3 | Pending |
| FLOW-03 | Phase 3 | Pending |
| FLOW-04 | Phase 3 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |

**Coverage:**
- v7.0 requirements: 20 total
- Mapped to phases: 20/20
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 — traceability completed after roadmap creation*
