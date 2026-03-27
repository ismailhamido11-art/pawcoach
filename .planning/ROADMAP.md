# Roadmap: PawCoach

## Milestones

- ✅ **v1.0 "Data Flow Integrity"** — Phases 1-4 (shipped mars 11-12)
- ✅ **v1.1 "Quality Audit"** — Phases 5-8 (shipped mars 12-15)
- ✅ **v2.0 "Cleanup Technique"** — 6 phases (shipped 26 mars). [Archive](milestones/v2.0-ROADMAP.md)
- ✅ **v3.0 "Consolidation"** — 92 fixes, 125 issues audited (shipped 26-27 mars). [Archive](milestones/v3.0-ROADMAP.md)
- 🚧 **v4.0 "E2E Fixes"** — Phases 1-5 (in progress)

---

## v4.0 "E2E Fixes"

**Milestone Goal:** Corriger les 78 problemes (8 CASSES + 70 FRAGILES) identifies par l'audit E2E de 165 flows. Chaque fix est livre via Git direct (0 credit Build prompt).

**Source:** `.planning/phases/1-audit/E2E-AUDIT-REPORT.md`

## Phases

- [ ] **Phase 1: Security & Legal** - Corriger les failles RGPD et les acces non autorises
- [ ] **Phase 2: Bugs Fonctionnels** - Eliminer les bugs qui cassent des flows utilisateurs reels
- [ ] **Phase 3: Scalabilite & Premium** - Fixer le backend pour la croissance et le flux paiement
- [ ] **Phase 4: UX & Navigation** - Corriger les experiences utilisateur cassees ou confuses
- [ ] **Phase 5: Edge Cases & Polish** - Eliminer les cas limites et le dead code

## Phase Details

### Phase 1: Security & Legal
**Goal**: Les donnees des utilisateurs sont protegees et conformes RGPD
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05
**Success Criteria** (what must be TRUE):
  1. Un utilisateur qui supprime son compte n'existe plus dans la base (email, nom, is_premium supprimes)
  2. Un utilisateur quelconque ne peut pas creer une note veto sur le chien d'un autre sans acces verifie
  3. L'email du proprietaire n'est pas visible sur le profil public du chien
  4. Le quota scan ne peut pas etre contourne en vidant le localStorage
  5. isUserPremium() est utilise de facon coherente — plus d'acces direct a user.is_premium dans le code metier
**Plans**: TBD

### Phase 2: Bugs Fonctionnels
**Goal**: Les flows diagnostics, navigation et auth fonctionnent correctement sans perte de donnees
**Depends on**: Phase 1
**Requirements**: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06
**Success Criteria** (what must be TRUE):
  1. Un diagnostic complet (pre + final) consomme exactement 1 credit, pas 2
  2. Les rapports de diagnostic passes sont visibles et consultables depuis DiagnosisContent
  3. Cliquer sur une recommandation "Trouver un veto" ne mene plus a une page 404
  4. L'ecran d'erreur UserNotRegistered s'affiche en francais avec un bouton de deconnexion fonctionnel
  5. L'email trial J-1 annonce correctement "10 messages/jour" et non "5 messages/jour"
  6. Recharger le navigateur en plein onboarding restaure l'etape et les reponses deja saisies
**Plans**: TBD

### Phase 3: Scalabilite & Premium
**Goal**: Le backend tient la charge sans charger toute la base, et le paiement Stripe s'active sans race condition
**Depends on**: Phase 2
**Requirements**: SCALE-01, SCALE-02, SCALE-03, PREM-01, PREM-02, PREM-03, PREM-04
**Success Criteria** (what must be TRUE):
  1. walkReminder, monthlySummary et trialExpiryReminder ne chargent plus tous les dogs/records sans filtre
  2. Un fetch echoue dans Promise.all sur Home ne bloque plus le reste du chargement
  3. Si OPENROUTER_API_KEY est absente, weeklyInsightGenerate echoue proprement sans exception
  4. Apres un paiement Stripe reussi, les features premium s'activent dans l'app en moins de 10 secondes
  5. Double-cliquer sur "Generer" ou finir un walk/training rapidement ne consomme pas 2 credits
  6. Tenter une action IA sans credits affiche un UpgradePrompt visible (pas un echec silencieux)
  7. La section referral est soit retiree, soit reliee a un backend de validation reel
**Plans**: TBD
**UI hint**: yes

### Phase 4: UX & Navigation
**Goal**: Les interactions quotidiennes (poids, preferences, GPS, erreurs, navigation) sont coherentes et claires
**Depends on**: Phase 3
**Requirements**: UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. Sauvegarder ses preferences diet dans NutriCoach affiche immediatement les nouvelles prefs sans rechargement
  2. Logger un poids via le FAB cree bien un HealthRecord visible dans Sante/Growth
  3. Les erreurs GPS, micro, camera et geoloc affichent un message en francais, pas un ecran vide ou bloque
  4. Les erreurs dans VetPortal et VetDogView s'affichent en francais
  5. Cliquer "Se deconnecter" demande une confirmation avant de deconnecter
  6. Supprimer un plan nutrition dans Library demande une confirmation
  7. Le ChatFAB ne reste plus cliquable au-dessus du backdrop quand CombinedFAB est ouvert
  8. Les onglets VetPortal et VetDogView sont correctement highlights dans la BottomNav
  9. Plus aucun acces sessionStorage ne peut faire crasher l'app en navigation privee
  10. ErrorBoundary redirige vers Home via createPageUrl, pas vers "/"
**Plans**: TBD
**UI hint**: yes

### Phase 5: Edge Cases & Polish
**Goal**: Les calculs de sante sont complets, le dead code est supprime, et les cas limites sont couverts
**Depends on**: Phase 4
**Requirements**: EDGE-01, EDGE-02, EDGE-03, EDGE-04, EDGE-05, EDGE-06, EDGE-07
**Success Criteria** (what must be TRUE):
  1. Le score de sante du carnet inclut les donnees BCS (Body Condition Score) dans son calcul
  2. Un QR code dont l'image echoue affiche un SVG de fallback valide, pas une zone vide
  3. SmartHealthAssistant consomme 1 seul credit par analyse, pas 2 (frontend + backend)
  4. VetDogView n'affiche pas les records de poids en double quand SectionPoids est visible
  5. Finir une marche ne cree pas de DailyLog si user.email est absent
  6. AIDiagnosisModal detecte une reponse JSON d'erreur avant de tenter de creer un PDF
  7. Le dead code (walkStreak dans Home.jsx, prop inutile dans PremiumNudgeSheet) est supprime
**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security & Legal | 0/TBD | Not started | - |
| 2. Bugs Fonctionnels | 0/TBD | Not started | - |
| 3. Scalabilite & Premium | 0/TBD | Not started | - |
| 4. UX & Navigation | 0/TBD | Not started | - |
| 5. Edge Cases & Polish | 0/TBD | Not started | - |
