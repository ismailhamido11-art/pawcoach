# Requirements: PawCoach v4.0 E2E Fixes

## Source
Audit E2E exhaustif de 165 flows (27 mars 2026) — .planning/phases/1-audit/E2E-AUDIT-REPORT.md

## v4.0 Requirements

### SEC — Securite & Legal

- [x] **SEC-01**: deleteUser backend supprime l'entite User elle-meme apres avoir supprime les donnees liees (F120)
- [x] **SEC-02**: VetNote.create passe par une action vetAccess backend qui verifie l'acces actif avant creation (F131)
- [x] **SEC-03**: DogPublicProfile masque l'email du proprietaire ou le rend opt-in (F125)
- [x] **SEC-04**: Quota scan verifie cote serveur avant analyse (pas uniquement client-side) (F76/F101)
- [x] **SEC-05**: isUserPremium() utilise de maniere coherente partout au lieu de user.is_premium direct (F110/F29/F105)

### BUG — Bugs fonctionnels

- [x] **BUG-01**: Flow diagnostic complet consomme 1 seul action credit, pas 2 (F30)
- [ ] **BUG-02**: Historique des DiagnosisReport visible et consultable dans DiagnosisContent (F32)
- [x] **BUG-03**: buildRecommendations() ne genere que des liens vers des pages existantes (F13)
- [x] **BUG-04**: UserNotRegisteredError affiche en francais avec bouton de deconnexion fonctionnel (F2)
- [x] **BUG-05**: Email trial J-1 affiche la bonne limite (10 messages/jour, pas 5) (F107)
- [ ] **BUG-06**: Onboarding persiste answers[] et step dans sessionStorage, restaure au rechargement (F6)

### SCALE — Scalabilite backend

- [ ] **SCALE-01**: walkReminder, monthlySummary, trialExpiryReminder filtrent les queries au lieu de Dog.list()/HealthRecord.list() sans filtre (F70/F158/F159)
- [ ] **SCALE-02**: Home fetchDogData a un .catch sur chaque requete du Promise.all (F9)
- [ ] **SCALE-03**: weeklyInsightGenerate gere gracieusement l'absence de OPENROUTER_API_KEY (F160)

### PREM — Premium & Paiement

- [ ] **PREM-01**: Apres redirect /?premium=success, l'app poll base44.auth.me() toutes les 2s pendant 10s jusqu'a is_premium=true (F104/F111)
- [ ] **PREM-02**: Race conditions credits prevenues : guard anti-double-clic sur consume() et updateStreakSilently (F109/F67)
- [ ] **PREM-03**: Toutes les actions IA (AITrainingProgram, diagnostic, scan) montrent un UpgradePrompt visible quand credits = 0 (F56/F33)
- [ ] **PREM-04**: Section referral retiree ou backend de validation du code implemente (F118)

### UX — Experience utilisateur

- [ ] **UX-01**: Nutri.jsx recharge dietPrefs apres sauvegarde dans DietPreferencesPanel (F86)
- [ ] **UX-02**: CombinedFAB quick log poids cree aussi un HealthRecord type weight en plus du DailyLog (F146)
- [ ] **UX-03**: GPS erreurs codes 2/3, voice input onerror, camera refusee, geoloc sans query : feedback utilisateur clair (F47/F44/F89/F75/F41)
- [ ] **UX-04**: Messages d'erreur backend traduits en francais dans VetDogView et VetPortal (F134/F135)
- [ ] **UX-05**: Bouton logout demande confirmation avant deconnexion (F119)
- [ ] **UX-06**: Suppression NutritionPlan dans Library demande confirmation (F140)

### NAV — Navigation

- [ ] **NAV-01**: ChatFAB masque ou z-index inferieur quand CombinedFAB bottom-sheet est ouvert (F144)
- [ ] **NAV-02**: BottomNav highlight l'onglet parent pour VetPortal et VetDogView (F141)
- [ ] **NAV-03**: Tous les acces sessionStorage wrappes dans try/catch (F142/F154)
- [ ] **NAV-04**: ErrorBoundary utilise createPageUrl("Home") au lieu de "/" pour le redirect accueil (F150)

### EDGE — Edge cases & polish

- [ ] **EDGE-01**: computeNotebookSummary passe growthEntries a computeHealthScore pour inclure BCS (F25)
- [ ] **EDGE-02**: QR code image onError montre un fallback SVG valide (F26)
- [ ] **EDGE-03**: SmartHealthAssistant ne double-decremente pas les credits (frontend + backend) (F28)
- [ ] **EDGE-04**: VetDogView filtre les records weight de la liste chrono quand SectionPoids est visible (F130)
- [ ] **EDGE-05**: Walk recovery useEffect guard sur user?.email avant DailyLog.create (F48)
- [ ] **EDGE-06**: AIDiagnosisModal detecte response JSON erreur avant de creer un Blob PDF (F31)
- [ ] **EDGE-07**: Dead code supprime : walkStreak dans Home.jsx (F11), context prop inutilise dans PremiumNudgeSheet (F108)

## Future Requirements
None — all fixes scoped to this milestone.

## Out of Scope
- Chat/NutriCoach message persistence (F87/F82) — confirmed design decision, not a bug
- ParkReview entity-absent vs network-error distinction (F50) — minor, acceptable
- Training EXERCISES order_number non-sequential (F60) — maintenance concern, not user-facing
- Overpass single-point-of-failure (F49) — external dependency, no simple fix
- Analytics events never sent remotely (F161) — known, deferred to analytics integration milestone

## Traceability
| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| BUG-01 | Phase 2 | Complete |
| BUG-02 | Phase 2 | Pending |
| BUG-03 | Phase 2 | Complete |
| BUG-04 | Phase 2 | Complete |
| BUG-05 | Phase 2 | Complete |
| BUG-06 | Phase 2 | Pending |
| SCALE-01 | Phase 3 | Pending |
| SCALE-02 | Phase 3 | Pending |
| SCALE-03 | Phase 3 | Pending |
| PREM-01 | Phase 3 | Pending |
| PREM-02 | Phase 3 | Pending |
| PREM-03 | Phase 3 | Pending |
| PREM-04 | Phase 3 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |
| UX-04 | Phase 4 | Pending |
| UX-05 | Phase 4 | Pending |
| UX-06 | Phase 4 | Pending |
| NAV-01 | Phase 4 | Pending |
| NAV-02 | Phase 4 | Pending |
| NAV-03 | Phase 4 | Pending |
| NAV-04 | Phase 4 | Pending |
| EDGE-01 | Phase 5 | Pending |
| EDGE-02 | Phase 5 | Pending |
| EDGE-03 | Phase 5 | Pending |
| EDGE-04 | Phase 5 | Pending |
| EDGE-05 | Phase 5 | Pending |
| EDGE-06 | Phase 5 | Pending |
| EDGE-07 | Phase 5 | Pending |
