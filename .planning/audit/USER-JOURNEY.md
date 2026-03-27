# User Journey Audit — PawCoach
*Audit date: 27 mars 2026 — perspective propriétaire de chien, pas développeur*

---

## Critical UX Issues (l'utilisateur serait confus ou frustré)

### 1. La carte "en forme" s'affiche même quand le check-in dit le contraire
**Page:** Home (`src/pages/Home.jsx` ligne 493-496)
**Problème:** Après le check-in, la Hero Card affiche `"{dog.name} est en forme !"` dès que le check-in est fait — indépendamment du mood réel. Un chien noté 1 ou 2 (triste, bof) déclenche quand même ce message positif.
**Fichier exact:** `src/pages/Home.jsx` lignes 493-496
```jsx
{todayCheckin
  ? `${dog?.name || "Ton chien"} est en forme !`
  : `${dog?.name || "Ton chien"} attend son check-in`
}
```
**Pourquoi ça compte:** L'utilisateur vient de dire que son chien va mal. L'app lui répond qu'il est en forme. C'est exactement le scénario signalé par le fondateur.
**Fix:** Conditionner le message au mood réel (`todayCheckin.mood >= 4 ? "en forme" : todayCheckin.mood <= 2 ? "à surveiller" : "en bonne forme"`).

---

### 2. "Repas" dans DailyProgress est en réalité "bols d'eau"
**Page:** Home (`src/components/home/DailyProgress.jsx` ligne 11)
**Problème:** La mini-carte "Repas" sur la Home lit `todayLog?.water_bowls` — c'est le nombre de bols d'eau, pas les repas. L'icône est `UtensilsCrossed` (couverts), le label dit "Repas", mais la valeur affichée est le nombre de fois que le chien a bu.
**Fichiers:**
- `src/components/home/DailyProgress.jsx` ligne 11: `const meals = todayLog?.water_bowls || 0;`
- `src/components/CombinedFAB.jsx` ligne 13: le champ s'appelle "Eau" en unité "bols"

**Pourquoi ça compte:** L'utilisateur pense suivre les repas. En réalité il suit l'eau. Il ne peut pas savoir si son chien a mangé depuis cette carte. Confusion garantie.

---

### 3. Poids enregistré en Santé ne met pas à jour le poids affiché en Home
**Problème:** Le poids dans `CoachHomeHeader` (`src/components/home/CoachHomeHeader.jsx` ligne 72-76) affiche `dog.weight` — le poids de profil, pas le dernier pesée enregistré dans le carnet santé. En revanche, `SectionPoids.jsx` (ligne 32) fait bien `Dog.update(dogId, { weight: w })` quand on ajoute un poids via l'onglet Poids dans Santé. Mais si l'utilisateur ajoute un poids via le Growth Tracker (`GrowthTrackerContent.jsx`), seul `GrowthEntry` est créé — pas de sync vers `Dog.weight`.
**Fichier:** `src/components/sante/GrowthTrackerContent.jsx` lignes 113-162 (handleSaveAnalysis / handleManualSave): aucun `Dog.update({ weight })` après la sauvegarde.
**Pourquoi ça compte:** L'utilisateur mesure son chien dans "Croissance", voit un poids enregistré, mais le poids en header reste l'ancien. L'IA de nutrition utilise `dog.weight` pour ses calculs — elle utilise donc une valeur périmée.

---

### 4. DailyBriefing : Quick check-in à 4 options ne demande ni énergie ni appétit
**Page:** Home (`src/components/home/DailyBriefing.jsx` ligne 105-108)
**Problème:** Le check-in rapide dans la DailyBriefing card (`handleMoodTap`) forge automatiquement `energy` et `appetite` à partir du mood (`energy: mood >= 4 ? 4 : 3`). L'utilisateur sélectionne une humeur mais l'app décide seule de l'énergie et de l'appétit. Résultat : le check-in enregistré contient des données inventées, pas observées.
**Pourquoi ça compte:** L'IA nutrition/plan repas utilise ces valeurs. Un chien dont l'appétit est réellement à 1 (rien mangé) sera enregistré avec appétit à 3. Faux positif dangereux.

---

### 5. La page "Dressage" dans Activité est une impasse fonctionnelle
**Page:** Activite (`src/pages/Activite.jsx` lignes 237-306, `DressageContent`)
**Problème:** L'onglet "Dressage" dans la page Activité affiche juste des conseils génériques hardcodés (5-10 min par session, terminer sur une réussite…) et un bouton "Voir les parcours d'entraînement" qui redirige vers Training. C'est une page vide habillée. L'utilisateur clique sur "Dressage", attend du contenu, trouve quatre bullets génériques et un bouton de sortie.
**Pourquoi ça compte:** Doublon avec la page Training. Crée de la confusion sur la navigation. L'onglet devrait soit être retiré, soit afficher le contenu Training directement.

---

### 6. Le prix "dès 5 €/mois" est trompeur — le vrai prix mensuel est 7,99 €
**Page:** Premium, Profile, Scan, Training (`src/pages/Premium.jsx` lignes 267, 281; `src/components/profile/SubscriptionSection.jsx` lignes 71, 91; `src/pages/Scan.jsx` ligne 399)
**Problème:** Plusieurs boutons et CTA affichent "dès 5 €/mois". C'est le tarif annuel ramené au mois (59,99 €/an ÷ 12 = 5 €). L'abonnement mensuel coûte 7,99 €. L'utilisateur s'attend à payer 5 €, découvre 7,99 € au checkout.
**Pourquoi ça compte:** Dark pattern classique. Crée de la méfiance post-achat.

---

### 7. Checkin "Symptômes" (InlineCheckin) : les symptômes cochés ne déclenchent aucune action visible
**Page:** Home via InlineCheckin (`src/components/home/InlineCheckin.jsx`)
**Problème:** L'InlineCheckin propose de cocher des symptômes (vomissements, boiterie, etc.). Ces symptômes sont envoyés en backend via `dailyCheckinProcess`. Mais après validation, aucune alerte, aucune suggestion ("As-tu consulté un vétérinaire ?"), aucune navigation vers l'onglet Symptômes de Santé n'est proposée. L'utilisateur coche "Vomissements", valide, et l'app dit "Check-in enregistré !" comme si tout allait bien.
**Pourquoi ça compte:** Signal d'urgence ignoré. Une app bien-être chien devrait réagir différemment à "mon chien vomit" vs "mon chien va super".

---

### 8. La page Nutri : onglet par défaut = "Coach IA", mais c'est le plus abstrait pour un nouvel utilisateur
**Page:** Nutri (`src/pages/Nutri.jsx` ligne 113: `default: "coach"`)
**Problème:** La page Nutrition s'ouvre sur le chat IA par défaut. Un nouvel utilisateur qui ne sait pas quoi demander verra une conversation vide avec un message de bienvenue de l'IA. L'onglet "Scanner" (le plus intuitif et actionnable) est le premier à gauche mais pas le défaut.
**Pourquoi ça compte:** Premier contact raté. "Scanner" serait l'onboarding naturel pour la nutrition.

---

## Missing User Expectations (ce qu'un propriétaire de chien attendrait mais qui n'existe pas)

### A. Pas de résumé du dernier check-in visible sur la Home si fait hier
Si le check-in d'hier était mood=1 (chien triste), la Home du lendemain affiche la DailyBriefing avec message positif ("en forme hier") ou neutre. Aucune continuité visible : l'utilisateur ne voit pas que son chien était malade la veille.

### B. Pas de rappel quand le prochain vaccin approche (visible in-app)
Le champ `next_vet_appointment` existe dans DogProfile (`src/components/dogprofile/DogHealthSection.jsx` ligne 98). Les rappels email sont mentionnés comme feature Premium. Mais aucune alerte in-app visible sur la Home quand un vaccin ou RDV approche à moins de 7 jours. SmartAlerts dans Dashboard couvre ça, mais Dashboard n'est pas dans la BottomNav — l'utilisateur moyen ne le voit pas.

### C. Pas de confirmation claire après check-in avec symptômes inquiétants
Voir issue #7 ci-dessus. Un propriétaire inquiet qui coche "Boiterie" s'attend à un conseil immédiat, pas juste "Check-in enregistré !".

### D. La balade est enregistrée en minutes mais jamais convertie en distance visible
L'utilisateur voit "30 min" de balade. Il aimerait savoir combien de km ça représente. La distance GPS est trackée (`distance` state dans `WalkMode.jsx`) et sauvegardée... quelque part (à vérifier dans DailyLog schema). Elle est affichée dans le summary de balade mais pas dans l'historique ni sur la Home.

### E. Aucune explication de "qu'est-ce que le score BCS" dans GrowthTracker
`GrowthTrackerContent.jsx` affiche un score BCS (Body Condition Score) de 1-9. Il n'y a aucune explication en-app de ce que c'est. L'utilisateur moyen ne sait pas que BCS=5 est idéal. Un tooltip ou une info-bulle est absent.

### F. Nutri : le plan repas de 7 jours ne dit pas quoi acheter
Le plan repas IA génère du contenu pour chaque jour de la semaine mais ne propose pas de liste de courses. C'est ce qu'un propriétaire demanderait naturellement après "Jour 1: poulet cuit + riz".

---

## Useless / Confusing Elements (à supprimer ou reformuler)

### 1. Le champ "hauteur" dans GrowthTracker est inutilisable en pratique
**Fichier:** `src/components/sante/GrowthTrackerContent.jsx` lignes 457-458
Le formulaire manuel demande `height_cm` (hauteur en cm). Mesurer la hauteur d'un chien au garrot à la maison sans équipement est quasi impossible et rarement fait. Le champ est présent mais presque jamais rempli. Il devrait soit être retiré (poids suffit pour le tracking), soit clairement labellisé "Hauteur au garrot (facultatif — mesure rare)".

### 2. L'onglet "Dressage" dans Activite duplique la page Training
**Fichier:** `src/pages/Activite.jsx` lignes 237-306
Voir issue critique #5. Cet onglet devrait être supprimé ou fusionné.

### 3. CalendarStrip : les points verts signifient "activité" mais incluent aussi l'eau
**Fichier:** `src/components/home/CalendarStrip.jsx` ligne 19
Un point vert apparaît si `walk_minutes > 0 OR water_bowls > 0`. Boire de l'eau affiche le même indicateur d'activité qu'une balade de 45 min. L'utilisateur ne peut pas faire la différence visuellement.

### 4. "Bilan mensuel personnalisé" dans la liste Premium ne correspond pas au vrai produit
**Fichier:** `src/pages/Premium.jsx` ligne 29 (`FEATURES` array)
Le produit livré est un `WeeklyInsight` (bilan **hebdomadaire**), pas mensuel. Le texte de vente dit "mensuel". Inconsistance créant des attentes erronées.

### 5. Profile affiche "Passer à Premium" même pour les utilisateurs en trial
**Fichier:** `src/pages/Profile.jsx` lignes 150-158
La carte "Passe à Premium" est visible pour tous les utilisateurs non-payants, y compris ceux en période d'essai gratuit (7 jours Premium offerts). Un utilisateur en trial est déjà Premium — lui montrer "Passe à Premium" est confus.

### 6. Le message d'accueil dit "Belle journée" même à 23h
**Fichier:** `src/components/home/CoachHomeHeader.jsx` ligne 27
`"Une belle journée avec {dog.name}"` est un texte hardcodé, pas conditionnel à l'heure. `DailyBriefing` utilise `getTimeGreeting()` correctement (matin/après-midi/soir), mais le header en haut de la Home utilise toujours "journée". Inconsistance entre les deux composants.

### 7. Le bouton d'action Check-in dans DailyProgress ne fait rien
**Fichier:** `src/components/home/DailyProgress.jsx` ligne 46
La mini-carte "Check-in" a `onClick: null` — elle ne clique nulle part. L'utilisateur voit "A faire" et tape dessus. Rien ne se passe. Il faut soit désactiver le curseur pointer, soit le relier à un scroll vers la DailyBriefing card.

---

## Page-by-Page Notes

### Home (/)
**Ce qui marche bien:**
- DailyBriefing contextuelle avec messages adaptatifs selon le mood du jour/veille
- Pull-to-refresh fonctionnel
- Milestone celebrations pour les streaks (confettis, animation)
- FirstDayGuide pour les nouveaux utilisateurs — très bien conçu
- Cache home pour un chargement perçu instantané

**Ce qui ne marche pas:**
- Hero card dit "en forme !" indépendamment du mood réel (issue #1)
- "Repas" dans DailyProgress affiche les bols d'eau (issue #2)
- Streak card invisible si streakDays = 0 — OK, mais pas d'encouragement pour commencer ("0 jours — commence aujourd'hui !")
- Quick actions (4 boutons) : "Scanner", "Balade", "Santé", "Dressage". Le bouton "Dressage" va vers Training. L'onglet "Dressage" dans Activite est différent. Confusion de navigation.
- EmotionalTip : tips hardcodés, jamais personnalisés au chien (race, âge, allergies). "Les races nordiques ont besoin de 2x plus d'activité" s'affiche à l'utilisateur d'un Chihuahua.
- La section "Carnet de santé" en bas avec le bouton "Voir le carnet" arrive après 5 scrolls. Un utilisateur mobile lambda ne la voit jamais.

### Santé (/Sante)
**Ce qui marche bien:**
- 5 onglets bien organisés (Carnet, Symptômes, Croissance, Documents, Véto)
- SectionPoids sync bien vers `Dog.weight` (issue #3 résolu pour cet onglet)
- PDF export présent
- QR code d'urgence — feature distincte et utile

**Ce qui ne marche pas:**
- L'onglet "Croissance" ajoute un poids mais ne sync pas vers `Dog.weight` (issue #3 partiel)
- Score BCS affiché sans explication (issue E)
- Champ hauteur inutilisable en pratique (issue #1 dans Useless)
- Onglet "Véto" = carte de recherche géo. Mais le label du tab est court "Véto" — l'utilisateur peut penser que c'est ses infos vétérinaire, pas une carte de recherche.
- FindVetContent : la recherche part de `dog.vet_city` pré-rempli — mais cette valeur vient du DogProfile, pas de la géolocalisation réelle. Un utilisateur qui voyage avec son chien obtiendra des résultats incorrects s'il ne change pas manuellement le champ.

### Activite (/Activite)
**Ce qui marche bien:**
- WalkMode avec timer, GPS, récupération de balade interrompue
- AITrainingProgram (lazy chargé)
- Historique des balades

**Ce qui ne marche pas:**
- Onglet "Dressage" = coquille vide avec 4 tips génériques (issue #5)
- La balade tracke la distance GPS mais l'historique (`TrackerHistory`) n'affiche que les minutes, pas les km
- Pas de statistiques hebdomadaires visible directement (combien de km cette semaine ?)

### Profile (/Profile)
**Ce qui marche bien:**
- DogSwitcher pour multi-chiens
- AchievementsSection et AchievementFeed
- WalkReminderSettings directement accessible

**Ce qui ne marche pas:**
- Carte "Passe à Premium" visible en trial (issue #5 dans Useless)
- Prix "dès 5 €/mois" trompeur (issue #6 critique)
- Lien Dashboard dans Profile mais Dashboard n'est pas dans la BottomNav — l'utilisateur lambda ne saurait jamais qu'il existe sans passer par Profile

### DogProfile (/DogProfile)
**Ce qui marche bien:**
- Edition inline de tous les champs
- Export .txt de la fiche
- Suppression avec confirmation et cascade complète

**Ce qui ne marche pas:**
- DogEditModal (`src/components/dogprofile/DogEditModal.jsx`) ne propose que Nom, Race, Date de naissance, Sexe, Stérilisé. Le poids n'est pas modifiable depuis le modal — il faut aller dans DogIdentityCards, comprendre que les cartes sont éditables (affordance peu visible : petit crayon en bas à droite)
- DogHealthSection (`src/components/dogprofile/DogHealthSection.jsx`) : "Prochain RDV vétérinaire" stocké mais non affiché sur Home ni dans aucune alerte in-app visible
- L'export produit un fichier `.txt` minimaliste. Un utilisateur s'attend à un PDF ou un format partageable.

### Nutri (/Nutri)
**Ce qui marche bien:**
- Coach IA avec streaming typewriter
- Scan d'aliments avec verdict clair (vert/orange/rouge)
- Plan repas 7 jours avec calories par jour
- Comparateur de croquettes

**Ce qui ne marche pas:**
- Onglet par défaut = Coach IA (le plus abstrait) au lieu de Scanner (issue #8)
- Le champ "Repas" dans DailyProgress liait `water_bowls` — mais dans Nutri, aucun endroit pour logger les repas réels du jour (juste un plan). Pas de suivi "j'ai donné ce repas aujourd'hui"
- Plan repas généré sans liste de courses (issue F dans Missing)
- Le coach dit connaître le profil mais si `dog.weight` est périmé (issue #3), il génère des conseils calorimétriques basés sur un mauvais poids

### Premium (/Premium)
**Ce qui marche bien:**
- Segmentation par âge du chien (puppy/adult/senior) avec messages adaptés
- Comparatif Free vs Premium clair
- Les deux plans (mensuel/annuel) bien présentés avec l'annuel mis en avant

**Ce qui ne marche pas:**
- Prix "dès 5 €/mois" trompeur partout sauf sur la page Premium elle-même (issue #6)
- "Bilan mensuel" dans FEATURES mais le produit est hebdomadaire (issue #4 Useless)
- La liste FEATURES dit "Carnet santé complet (visites, médicaments)" en premium mais les vaccins et le poids fonctionnent en gratuit — la limite n'est pas clairement expliquée

### Onboarding
**Ce qui marche bien:**
- Resume possible si interruption (sessionStorage)
- Voice input pour remplir les champs
- AI parse les réponses libres en JSON structuré — bonne UX
- Trial 7 jours activé automatiquement

**Ce qui ne marche pas:**
- L'étape "Quel âge a-t-il ?" accepte du texte libre ("2 ans", "6 mois"). Si l'utilisateur tape "pas sûr" ou "jeune", l'IA tente de parser mais peut mettre `null` pour `birth_date`. Aucun feedback utilisateur si l'âge n'a pas pu être parsé.
- L'étape "Mâle ou femelle ?" a un placeholder "Mâle ou Femelle" mais pas de boutons radio. L'utilisateur doit taper à la main (ou utiliser la voix) pour quelque chose qui devrait être un bouton.
- Pas d'étape "stérilisé ?" dans l'onboarding — information importante pour la nutrition mais collectée uniquement plus tard dans le profil.
- Email de bienvenue envoyé avec le texte `"Profitez de l'application !"` — très générique, pas personnalisé.

### Chat (/Chat)
**Ce qui marche bien:**
- Historique persistant des messages (ChatMessage entity)
- Streaming typewriter pour les réponses
- Bookmark des réponses
- Support image

**Ce qui ne marche pas:**
- Compteur de messages restants (`messagesRemaining`) affiché... quand il est bas. L'utilisateur ne sait pas dès le début combien il a. Surprise à la limite.
- Si l'utilisateur arrive sur Chat sans avoir fait de check-in, l'IA n'a pas de contexte humeur du jour. Elle dit connaître le profil mais ne sait pas comment le chien va aujourd'hui.

### Training (/Training)
**Ce qui marche bien:**
- 10 exercices avec steps détaillés
- Journeys (parcours) structurés par objectif
- Progress tracking par exercice (UserProgress entity)
- Behavior Guides pour problèmes comportementaux

**Ce qui ne marche pas:**
- Ordre 5 ("Donne la patte") a `order_number: 5` mais `is_premium: true`. L'ordre 6 ("Lâche") a `order_number: 6` mais est aussi premium. L'ordre 7 est "Au pied". Dans la liste affichée, les exercices apparaissent dans l'ordre `order_number` mais les numéros 4-10 sont tous premium. L'utilisateur gratuit ne voit que 3 exercices (Assis, Couché, Pas bouger) — clair, mais la mention "3 exercices" dans les features Premium est exacte.
- Les Behavior Guides sont accessibles mais aucun raccourci visible depuis Home ou Chat. L'utilisateur qui cherche "mon chien aboie" doit trouver Training lui-même.

### Dashboard (/Dashboard)
**Ce qui marche bien:**
- Stats complètes (poids, humeur, activité, streaks)
- SmartAlerts pour détecter les anomalies (poids +10%, vaccins en retard)
- Graphiques sur 7/30/90 jours

**Ce qui ne marche pas:**
- Dashboard n'est pas dans la BottomNav — accessible seulement via Profile > "Voir les statistiques". 90% des utilisateurs ne le trouvent jamais.
- SmartAlerts (les alertes importantes) sont sur Dashboard qui n'est pas visible. Si le vaccin est en retard, l'utilisateur ne le voit que s'il navigue jusqu'au Dashboard.

---

## Résumé priorités

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | "En forme" même si mood mauvais | Confus immédiatement | Faible |
| 2 | "Repas" = eau dans DailyProgress | Données fausses visibles | Faible |
| 7 | Check-in symptômes sans réaction | Signal dangereux ignoré | Moyen |
| 6 | Prix "5€" trompeur | Trust au checkout | Faible |
| 3 | GrowthTracker ne sync pas Dog.weight | IA calcule sur mauvais poids | Faible |
| 5 | Onglet Dressage dans Activité = vide | Dead-end de navigation | Faible |
| 8 | Nutri défaut = Coach IA pas Scanner | Mauvais first impression | Trivial |
| Dashboard | Pas dans BottomNav | Feature invisible | Moyen |
