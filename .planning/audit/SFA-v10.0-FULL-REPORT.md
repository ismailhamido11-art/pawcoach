# Static Flow Analysis — Rapport Complet PawCoach v10.0

**Date :** 2026-03-29
**Methode :** 4 agents paralleles, lecture statique de tout le code source
**Couverture :** 18 pages, ~106 composants, ~120 flows traces

---

## Score Global

| Metrique | Valeur |
|----------|--------|
| Flows traces | ~120 |
| Flows OK | 112 |
| Ruptures trouvees | 8 |
| Critiques (P0) | 1 |
| Moyennes (P1) | 4 |
| Mineures (P2) | 3 |

---

## ISSUES PAR PRIORITE

### P0 — CRITIQUE

**1. Training.jsx:276 — `setUser` non defini (ReferenceError)**
- **Flow :** Marquer un exercice comme complete pour la premiere fois
- **Cause :** `setUser(prev => ({...prev, points: newPoints}))` appele mais `setUser` n'est pas expose par `useAuth()`. AuthContext expose `{ user, isLoadingAuth, checkAppState }`, pas `setUser`.
- **Impact :** Les premieres completions d'exercice crashent dans le catch, declenchent un rollback du UserProgress, et affichent "Erreur lors de la sauvegarde". Les points ne sont jamais credites. Les toggle (re-completions) fonctionnent car ils ne passent pas par ce code path.
- **Fix :** Remplacer `setUser(...)` par `checkAppState()` (qui re-fetch le user) ou simplement supprimer la ligne (les points sont deja persistes via `base44.auth.updateMe`).

### P1 — MOYENNES

**2. SettingsSection.jsx — Export RGPD incomplet**
- **Flow :** Profile > Reglages > Exporter mes donnees
- **Cause :** L'export ne contient que Dog, DailyLog, HealthRecord, DailyCheckin, FoodScan. Manquent : Streak, UserProgress, WeeklyInsight, ChatMessage, DogAchievement, GrowthEntry, NutritionPlan, DietPreferences, Bookmark, SharedVetAccess, VetNote, DiagnosisReport, ParkReview, PlaceFavorite.
- **Impact :** Non-conformite RGPD Article 20 (droit a la portabilite).
- **Fix :** Ajouter les 14 entites manquantes dans le Promise.all de handleExport.

**3. DiagnosisContent.jsx — Reports pas rafraichis apres diagnostic**
- **Flow :** Sante > Tab Symptomes > Lancer diagnostic > Fermer le modal
- **Cause :** `reports` charge au mount via useEffect([dog?.id]), jamais re-fetch. AIDiagnosisModal n'a pas de callback onReportCreated.
- **Impact :** L'utilisateur pense que le rapport n'a pas ete sauvegarde. Visible au rechargement.
- **Fix :** Ajouter un callback `onReportCreated` dans AIDiagnosisModal, ou re-fetch au `onOpenChange(false)`.

**4. GrowthTrackerContent.jsx — Dog.weight pas recalcule apres suppression**
- **Flow :** Sante > Tab Croissance > Supprimer une entree
- **Cause :** `deleteEntry` fait GrowthEntry.delete + state update, mais ne met pas a jour Dog.weight avec l'avant-derniere valeur.
- **Impact :** Le poids affiche partout (header, NutriCoach, Dashboard) est faux apres suppression.
- **Fix :** Apres suppression, recalculer Dog.weight avec l'entree la plus recente restante.

**5. Terms.jsx — CGU "conversion automatique" trial faux**
- **Flow :** Lecture des CGU article 5
- **Cause :** Les CGU disent "l'abonnement est automatiquement converti en abonnement payant" a la fin du trial. Le code ne fait PAS de souscription Stripe automatique — le trial expire simplement en mode gratuit.
- **Impact :** Les CGU sont trompeuses. Risque legal.
- **Fix :** Corriger le texte des CGU pour dire "l'acces Premium expire a la fin de la periode d'essai".

### P2 — MINEURES

**6. Scan.jsx / LabelScanMode — Asymetrie food vs label**
- **Flow :** Scanner une etiquette > Sauvegarder
- **Cause :** `onLabelSaved` jamais passe en prop par Scan.jsx. `updateStreakSilently` et `user.points` non incrementes pour le mode etiquette.
- **Impact :** (a) Historique local pas mis a jour apres sauvegarde etiquette. (b) Scan etiquette ne contribue pas a la streak. (c) Points non credites.
- **Fix :** Passer `onLabelSaved` en prop + ajouter streak/points.

**7. Home.jsx CombinedFAB — State local pas rafraichi**
- **Flow :** Log rapide poids/eau/balade via le bouton "+"
- **Cause :** `onLogSaved` appelle `invalidateHome` mais le state local `dogData.dailyLogs` n'est pas mis a jour dans la session courante.
- **Impact :** DailyProgress, CalendarStrip, hero ne refletent pas le changement immediatement. OK au retour sur Home.
- **Fix :** Appeler aussi `refreshHome()` apres `invalidateHome()`.

**8. Nutri.jsx — lastFailedInput code mort**
- **Flow :** Coach IA > Message echoue
- **Cause :** `lastFailedInput` sauvegarde mais jamais expose dans le UI (pas de bouton "Reessayer").
- **Impact :** Fonctionnel mineur.
- **Fix :** Supprimer le state (code mort) ou l'afficher comme CTA retry.

---

## POINTS FORTS CONFIRMES

| Domaine | Constat |
|---------|---------|
| **Stripe** | Flux complet : checkout, 4 events webhook, polling success, idempotency, portal. Zero faille. |
| **Gate multi-chiens** | Triple verification coherente (Profile, DogSwitcher, Onboarding cote serveur). |
| **Suppression compte** | Cascade 16+ entites, annulation Stripe, suppression User. |
| **Suppression chien** | Cascade 18 entites, cleanup localStorage. |
| **RGPD consent** | Bloquant, double guard (disabled + early return). |
| **VetPortal securite** | Ownership checks systematiques, invite email-locked, expiration 48h. |
| **Loading states** | Zero fuite detectee sur ~30 composants verifies. |
| **Tab persistence** | useTabNavigation + sessionStorage + URL params coherent partout. |
| **Credits IA** | Double verification client + serveur, guard anti-double-appel. |
| **Offline resilience** | WalkMode persiste dans localStorage, synchro auto au remontage. |
| **Chat streaming** | Typewriter effect, retry, bookmark, credits, voice input — tout trace OK. |

---

## COUVERTURE PAR PAGE

| Page | Flows | OK | Issues | Domaine |
|------|-------|----|--------|---------|
| Home | 14 | 13 | 1 (P2) | 1 |
| Chat | 8 | 8 | 0 | 1 |
| Scan | 8 | 7 | 1 (P2) | 1 |
| Dashboard | 8 | 8 | 0 | 1 |
| Sante | 18 | 16 | 2 (P1) | 2 |
| Nutri | 14 | 13 | 1 (P2) | 2 |
| Activite | 10 | 10 | 0 | 3 |
| Training | 8 | 7 | 1 (P0) | 3 |
| Library | 10 | 10 | 0 | 3 |
| Profile | 7 | 6 | 1 (P1) | 4 |
| Premium | 7 | 7 | 0 | 4 |
| Onboarding | 8 | 8 | 0 | 4 |
| DogProfile | 6 | 6 | 0 | 4 |
| VetPortal | 5 | 5 | 0 | 4 |
| VetDogView | 4 | 4 | 0 | 4 |
| DogPublicProfile | 1 | 1 | 0 | 4 |
| Privacy | 1 | 1 | 0 | 4 |
| Terms | 1 | 0 | 1 (P1) | 4 |

**Total : ~120 flows, 112 OK, 8 issues (1 P0, 4 P1, 3 P2)**
