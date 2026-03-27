# Requirements: PawCoach v8.0 "SFA Fixes"

**Defined:** 2026-03-27
**Core Value:** Chaque action utilisateur fonctionne de bout en bout — zero crash, zero feature morte, zero donnee stale
**Source:** Static Flow Analysis (4 rapports SFA)

## v8.0 Requirements

### Crashs & Features Mortes (CRASH)

- [ ] **CRASH-01**: Le quick check-in (mood tap) fonctionne — handleQuickCheckin passe des valeurs par defaut pour energy/appetite au lieu de undefined (regression v7.0)
- [ ] **CRASH-02**: La page Scanner se charge sans erreur — labelResult declare dans Scan.jsx (pas seulement dans le composant enfant)
- [x] **CRASH-03**: DogPublicProfile ne crashe pas sur les records vet_visit/medication — imports Stethoscope et Pill manquants
- [ ] **CRASH-04**: CombinedFAB est visible et fonctionnel — importe dans au moins une page (Home ou Layout)

### Donnees Stale / Fausses (STALE)

- [x] **STALE-01**: SmartAlerts compare les 2 dernieres pesees (pas latest vs dog.weight stale) — l'alerte poids rouge est correcte
- [x] **STALE-02**: Apres Dog.update(weight), le state `dog` est rafraichi dans Sante.jsx (pas seulement en DB)
- [x] **STALE-03**: computeStatusPills inclut les GrowthEntries — "Poids: Non suivi" n'est plus affiche a tort
- [x] **STALE-04**: NutriCoach utilise le dernier poids reel (GrowthEntry ou DailyLog), pas dog.weight potentiellement stale
- [x] **STALE-05**: Score wellness identique entre Dashboard, DogRadarHero, et NotebookContent (memes sources)
- [x] **STALE-06**: FoodScan.create sauvegarde summary + allergen_alerts (plus de perte de donnees)

### Cache & Propagation (CACHE)

- [ ] **CACHE-01**: CombinedFAB appelle invalidateHome apres chaque log (poids, eau, balade)
- [ ] **CACHE-02**: Home cache invalide apres suppression d'un chien
- [ ] **CACHE-03**: Home cache invalide apres renommage ou changement photo chien
- [ ] **CACHE-04**: recentScans recharge dans Nutri apres retour de Scan

### UX & Securite (UX)

- [x] **UX-01**: Card "Passe a Premium" masquee pour les utilisateurs deja premium
- [x] **UX-02**: Email proprietaire non expose sur DogPublicProfile
- [x] **UX-03**: handleSaveUser entoure d'un try/catch avec feedback erreur
- [x] **UX-04**: checkWalkBadges appele une seule fois par fin de balade (pas de doublon)
- [x] **UX-05**: Training points rollback si updateMe echoue apres UserProgress.create

## Future Requirements (v9.0+)

- **PUSH-01**: Notifications push
- **ANAL-01**: Analytics trackEvent() fonctionnel
- **OFFLN-01**: Ecran offline coherent
- **GUIDE-01**: Guides comportement accessibles depuis Home/Chat
- Balades localStorage → streak update
- FoodScan.filter avec limite dans Library
- FileReader avec onerror dans Scan

## Out of Scope

| Feature | Reason |
|---------|--------|
| Nouvelles features utilisateur | v8.0 = corriger les ruptures SFA |
| Push notifications | Pas bloquant pour la qualite actuelle |
| Refonte UI | Design solide, c'est les flux qui cassent |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CRASH-01 | Phase 1 | Pending |
| CRASH-02 | Phase 1 | Pending |
| CRASH-03 | Phase 1 | Complete |
| CRASH-04 | Phase 1 | Pending |
| STALE-01 | Phase 2 | Complete |
| STALE-02 | Phase 2 | Complete |
| STALE-03 | Phase 2 | Complete |
| STALE-04 | Phase 2 | Complete |
| STALE-05 | Phase 2 | Complete |
| STALE-06 | Phase 2 | Complete |
| CACHE-01 | Phase 3 | Pending |
| CACHE-02 | Phase 3 | Pending |
| CACHE-03 | Phase 3 | Pending |
| CACHE-04 | Phase 3 | Pending |
| UX-01 | Phase 3 | Complete |
| UX-02 | Phase 3 | Complete |
| UX-03 | Phase 3 | Complete |
| UX-04 | Phase 3 | Complete |
| UX-05 | Phase 3 | Complete |

**Coverage:**
- v8.0 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
