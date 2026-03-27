# Rapport Audit E2E Complet — PawCoach

**Date** : 27 mars 2026
**Scope** : 165 flows | 16 pages | 22 fonctions backend | ~102 composants
**Methode** : 6 agents paralleles, lecture exhaustive de tout le code source

## Score global

| Verdict | Nombre | % |
|---------|--------|---|
| CASSE | 8 | 5% |
| FRAGILE | 70 | 42% |
| OK | 87 | 53% |

---

## Les 8 CASSES

### 1. F120 — RGPD : deleteUser ne supprime pas l'entite User [CRITIQUE]
**Fichier** : `base44/functions/deleteUser/entry.ts`
**Probleme** : Supprime toutes les donnees liees (dogs, logs, scans, etc.) mais PAS l'entite User elle-meme. Le compte reste en base avec email, nom, is_premium.
**Fix** : Ajouter `User.delete(users[0].id)` ou equivalent a la fin du backend.

### 2. F131 — Securite : VetNote.create() sans verification d'acces [CRITIQUE]
**Fichier** : `src/components/vet/VetNoteForm.jsx:30-38`
**Probleme** : Appelle `VetNote.create()` directement via SDK, sans passer par `vetAccess`. N'importe quel utilisateur authentifie connaissant un dogId peut creer une note veto sur n'importe quel chien.
**Fix** : Creer une action `addVetNote` dans `vetAccess/entry.ts` qui verifie l'acces actif avant de creer la note.

### 3. F30 — Double decrement credit diagnostic [HIGH]
**Fichiers** : `base44/functions/preDiagnosis/entry.ts:31-35`, `base44/functions/finalDiagnosis/entry.ts:31-35`
**Probleme** : preDiagnosis ET finalDiagnosis decrementent chacun `actions_remaining`. Un diagnostic complet consomme 2 credits sur 3 pour un free user. L'UI n'en affiche qu'un.
**Fix** : Retirer le decrement dans `finalDiagnosis/entry.ts`.

### 4. F13 — Lien FindVet → 404 dans recommendations [HIGH]
**Fichier** : `src/utils/recommendations.js:196`
**Probleme** : `page: "FindVet"` pointe vers une page inexistante. Tout user avec un DiagnosisReport recent voit un lien 404.
**Fix** : Remplacer par `page: "Sante"` avec `tab: "findvet"`.

### 5. F32 — Historique diagnostics inexistant [MEDIUM]
**Fichier** : `src/components/vet/AIDiagnosisModal.jsx:163-175`
**Probleme** : `DiagnosisReport.create` ecrit des rapports mais aucun composant ne les relit. Feature absente de l'UI.
**Fix** : Ajouter une section historique dans DiagnosisContent.jsx qui charge `DiagnosisReport.filter({dog_id})`.

### 6. F6 — Onboarding zero persistance [MEDIUM]
**Fichier** : `src/pages/Onboarding.jsx:112-115`
**Probleme** : L'etat de l'onboarding (10 etapes) est 100% en memoire React. Si l'user ferme l'app, tout est perdu.
**Fix** : Sauvegarder `answers[]` et `step` dans `sessionStorage` avec nettoyage post-creation.

### 7. F87 — Chat historique fantome [LOW - design]
**Fichier** : `src/pages/Chat.jsx:166-195`
**Probleme** : Les messages sont sauvegardes via `ChatMessage.create` mais jamais recharges. Chaque ouverture repart avec le message de bienvenue.
**Note** : Commentaire ligne 182 confirme c'est intentionnel. A documenter comme decision produit.

### 8. F82 — NutriCoach zero persistance [LOW - design]
**Fichier** : `src/pages/Nutri.jsx:254-258`
**Probleme** : Contrairement a Chat.jsx, NutriCoach ne persiste rien du tout. Pas de ChatMessage.create.
**Note** : Meme decision design que F87. A documenter.

---

## Top 15 FRAGILES les plus impactants

### 1. F70 — walkReminder charge TOUS les chiens [HIGH - scalabilite]
**Fichier** : `base44/functions/walkReminder/entry.ts:29`
**Probleme** : `Dog.list()` sans filtre charge tous les chiens de toute l'application.
**Fix** : Filtrer sur les emails des users avec reminder actif.

### 2. F159 — monthlySummary charge tout en memoire [HIGH - scalabilite]
**Fichier** : `base44/functions/monthlySummary/entry.ts`
**Probleme** : `HealthRecord.list()` et `DailyCheckin.list()` chargent TOUS les records de TOUTE la base.
**Fix** : Ajouter filtre par date/owner.

### 3. F104/F111 — Race condition post-paiement Stripe [HIGH]
**Fichiers** : `src/pages/Home.jsx:215-227`, `base44/functions/stripeWebhook/entry.ts`
**Probleme** : L'user arrive sur `/?premium=success` avant que le webhook ait mis a jour `is_premium`. Toast premium affiche mais features toujours verrouillees.
**Fix** : Ajouter polling `base44.auth.me()` toutes les 2s pendant 10s apres redirect success.

### 4. F107 — Email trial J-1 ment sur la limite [HIGH]
**Fichier** : `base44/functions/trialExpiryReminder/entry.ts:75`
**Probleme** : Annonce "retour a 5 messages/jour" alors que la limite reelle est 10 (MSG_DAILY_LIMIT = 10).
**Fix** : Corriger le texte.

### 5. F2 — UserNotRegisteredError en anglais sans bouton logout [HIGH]
**Fichier** : `src/components/UserNotRegisteredError.jsx`
**Probleme** : Texte en anglais, aucun bouton de logout. L'utilisateur est bloque.
**Fix** : Traduire en francais + ajouter bouton `base44.auth.logout()`.

### 6. F118 — Referral code = feature morte [MEDIUM]
**Fichier** : `src/components/profile/ReferralSection.jsx`
**Probleme** : Code genere mais jamais verifie nulle part. Aucun backend de validation.
**Fix** : Retirer la section ou implementer la verification.

### 7. F76/F101 — Quota scan 100% client-side [MEDIUM]
**Fichiers** : `src/pages/Scan.jsx:217-223`
**Probleme** : Contournable en vidant localStorage. Contrairement au chat (verifie cote serveur).
**Fix** : Ajouter verification dans le backend d'analyse.

### 8. F86 — Preferences diet stale dans la session [MEDIUM]
**Fichier** : `src/pages/Nutri.jsx`
**Probleme** : DietPreferencesPanel sauvegarde mais Nutri.jsx ne recharge pas `dietPrefs` apres.
**Fix** : Ajouter callback `onPreferencesSaved` → re-fetch.

### 9. F56 — Bouton Generer silencieux sans credits [MEDIUM]
**Fichier** : `src/components/activite/AITrainingProgram.jsx:679`
**Probleme** : Guard `!isPremium && !hasCredits` return silencieux. L'user clique, rien ne se passe.
**Fix** : Ajouter UpgradePrompt visible ou toast.

### 10. F67 — Race condition streak walk/training [MEDIUM]
**Fichier** : `src/components/streakHelper.jsx`
**Probleme** : Deux `updateStreakSilently` quasi-simultanes peuvent corrompre `graceDaysUsed`.
**Fix** : Verrou optimiste ou consolidation backend.

### 11. F125 — Email owner expose dans DogPublicProfile [MEDIUM]
**Fichier** : `src/pages/DogPublicProfile.jsx:247-258`
**Probleme** : L'email du proprietaire est affiche publiquement.
**Fix** : Masquer ou rendre opt-in.

### 12. F146 — Poids FAB desync avec Sante/Growth [MEDIUM]
**Fichiers** : `src/components/CombinedFAB.jsx`, `src/pages/Sante.jsx`
**Probleme** : Le poids logue via FAB va dans `DailyLog.weight_kg` mais Sante lit `HealthRecord`.
**Fix** : Creer aussi un `HealthRecord` type "weight" lors du quick log poids.

### 13. F144 — ChatFAB z-index au-dessus du backdrop [LOW]
**Fichier** : `src/components/ChatFAB.jsx`
**Probleme** : z-[45] reste cliquable au-dessus du backdrop CombinedFAB z-[42].
**Fix** : Passer ChatFAB a z-[41] ou le masquer quand CombinedFAB est ouvert.

### 14. F130 — Double affichage poids VetDogView [LOW]
**Fichier** : `src/pages/VetDogView.jsx:114`
**Probleme** : SectionPoids + liste chronologique affichent les records weight deux fois.
**Fix** : Filtrer les records weight de la liste chrono quand SectionPoids est affichee.

### 15. F142/F154 — sessionStorage sans try/catch [LOW]
**Fichiers** : `src/components/BottomNav.jsx:27-49`
**Probleme** : Peut lever une exception en navigation privee sur certains navigateurs.
**Fix** : Wrapper dans try/catch.

---

## Synthese par domaine

| Domaine | Flows | OK | Fragile | Casse |
|---------|-------|-----|---------|-------|
| Auth/Onboarding | 8 | 3 | 4 | 1 |
| Home | 11 | 6 | 4 | 1 |
| Sante (5 onglets) | 25 | 10 | 13 | 2 |
| Activite/Training | 29 | 12 | 16 | 0 |
| Nutrition | 13 | 7 | 5 | 1 |
| Chat | 10 | 7 | 2 | 1 |
| Scan | 6 | 1 | 5 | 0 |
| Premium/Stripe | 9 | 1 | 8 | 0 |
| Profil/Dog Mgmt | 17 | 10 | 6 | 1 |
| Veterinaire | 8 | 3 | 4 | 1 |
| Library | 4 | 2 | 2 | 0 |
| Navigation/Layout | 14 | 9 | 5 | 0 |
| Notifications/Backend | 6 | 3 | 3 | 0 |
| Utilitaires | 5 | 3 | 2 | 0 |

---

## Sprints recommandes

### Sprint 1 — Securite + Legal (3 fixes)
- F120 : RGPD deleteUser
- F131 : VetNote acces
- F125 : Email expose DogPublicProfile

### Sprint 2 — Bugs fonctionnels (5 fixes)
- F30 : Double credit diagnostic
- F13 : FindVet lien 404
- F107 : Email trial mensonger
- F2 : UserNotRegisteredError anglais
- F32 : Historique diagnostics

### Sprint 3 — Scalabilite backend (2 fixes)
- F70/F158 : walkReminder Dog.list()
- F159 : monthlySummary charge tout

### Sprint 4 — UX fragile (5 fixes)
- F56 : UpgradePrompt AITrainingProgram
- F86 : DietPreferences stale
- F6 : Onboarding persistance
- F104 : Polling post-paiement Stripe
- F146 : Poids FAB desync
