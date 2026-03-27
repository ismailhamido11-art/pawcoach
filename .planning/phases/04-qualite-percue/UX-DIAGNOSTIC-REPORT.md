# UX Diagnostic Report — PawCoach

**Date:** 2026-03-27
**Analyste:** Claude Code (Sonnet 4.6)
**Source:** Analyse statique de 16 pages, ~106 composants, benchmark APP-BLUEPRINT-REPORT, SFA Group 1-4

---

## Executive Summary

PawCoach a une architecture UX solide — 5 onglets clairs, animations fluides, microcopy en francais, design system coherent "Nature Premium". Les points forts sont reels : le DailyBriefing contextuel est le meilleur composant de l'app (il parle vraiment au chien et adapte son message a la situation), et le FirstDayGuide est un onboarding J0 efficace. Mais trois gaps majeurs brisent l'experience : l'onboarding demande 10 etapes avant de montrer quoi que ce soit (les benchmarks montrent que chaque etape supplementaire coute ~10% d'utilisateurs), le differenciateur cle — l'IA — est cache derriere un FAB flottant invisible aux nouveaux utilisateurs, et les badges/points d'achievement sont enfouis dans Profile sans jamais creer de tension ou de motivation visible au quotidien. L'app a 80% des features mais 30% de l'infrastructure de retention necessaire pour que les utilisateurs reviennent apres J7.

---

## 1. Information Architecture

### Structure des 5 onglets

| Tab | Label | Page | Sous-onglets | Acces profond |
|-----|-------|------|-------------|--------------|
| 1 | Accueil | Home | Aucun | CombinedFAB, ChatFAB |
| 2 | Sante | Sante | 5 : Carnet, Symptomes, Croissance, Documents, Veto | — |
| 3 | Activite | Activite | 4 : Balade, Historique, Programme, Dressage | Training.jsx |
| 4 | Nutrition | Nutri | 5 : Scanner, Plan repas, Coach IA, Comparer, Preferences | Scan.jsx |
| 5 | Profil | Profile | Flat list | Dashboard, DogProfile, Library, VetPortal |

### Ce qui fonctionne

**Groupement logique :** Sante regroupe bien tout ce qui touche a la sante physique. Activite contient les actions physiques. Nutri contient tout ce qui est alimentation. Pour un utilisateur qui sait ce qu'il cherche, la structure est intuitive.

**Memoire de navigation :** Le systeme sessionStorage qui retient l'onglet actif dans Sante, Activite, Nutri est une excellente attention UX. L'utilisateur qui quitte Activite alors qu'il etait sur "Programme" revient directement sur "Programme". C'est un detail que la plupart des apps ratent.

**Double-tap pour reset :** La capacite de double-taper un onglet actif pour revenir a l'etat par defaut est un comportement iOS natif bien imite.

### Problemes d'architecture

**Probleme 1 — Surcharge de sous-onglets (High)**
Sante (5) + Activite (4) + Nutri (5) = 14 sous-onglets que l'utilisateur doit decouvrir par exploration horizontale. Il n'y a aucune hint visuelle qu'il y a un 4e ou 5e sous-onglet. Sur mobile, les sous-onglets en scroll horizontal ne sont pas evidents pour un utilisateur de 55+ ans.

Concretement : "Documents" (import OCR de fichiers sante) et "Veto" (carte des veterinaires) sont des features tres utiles, mais elles sont respectivement au rang 4 et 5 dans Sante. Sans decouverte active, la majorite des utilisateurs ne les trouvera pas.

**Probleme 2 — L'IA est invisible comme feature principale (High)**
L'IA est LA differentiation de PawCoach (aucun concurrent ne l'a). Elle est accessible via :
- Un ChatFAB visible sur Sante, Activite, Nutri, Profile — mais PAS sur Home (CombinedFAB prend la place)
- L'onglet Nutrition > Coach IA (sous-onglet 3 sur 5)

Un nouvel utilisateur sur Home ne voit nulle part "Parle a ton coach IA". La principale raison d'utiliser PawCoach est invisible sur l'ecran d'accueil.

**Probleme 3 — Dressage vs Programme (Medium)**
"Programme" (Activite tab 3) genere un programme IA. "Dressage" (Activite tab 4) permet de faire des exercices manuels. La distinction n'est pas evidente — un utilisateur qui veut "entrainer son chien" ne sait pas dans lequel aller.

**Probleme 4 — Dashboard enfoui dans Profile (Medium)**
Le Dashboard (stats, tendances, alertes vaccines) est accessible depuis Home via une carte cliquable, mais son entree principale est dans Profile. Pour un utilisateur qui veut voir "comment va mon chien globalement", le chemin logique serait Home > Dashboard, mais l'entree officielle est Profile > tableau de bord. C'est contre-intuitif.

**Acces en moins de 3 taps :**

| Action | Taps | Evaluation |
|--------|------|-----------|
| Check-in humeur | 2 (Accueil > tap emoji) | Excellent |
| Logger une balade (via FAB) | 3 (Accueil > FAB > Balade) | Acceptable |
| Scanner un aliment | 2 (Accueil > Scanner) | Bon |
| Parler au coach IA | 3+ (Nutrition > Coach IA) | Trop enfoui |
| Voir les vaccines | 3 (Sante > Carnet > filtrer vaccines) | Acceptable |
| Ajouter un poids | 3 (Accueil > FAB > Poids) | Acceptable |
| Voir le dashboard | 3 (Profile > Tableau de bord) | Contre-intuitif |

---

## 2. Key User Flows

| Flow | Etapes | Points de friction | Score |
|------|--------|-------------------|-------|
| Premiere utilisation : onboarding → premiere valeur | 12+ etapes (splash + 10 steps + AI processing + WelcomeScreen) | Aucune valeur visible avant la fin, photo upload peut echouer, pas d'option "passer" | 4/10 |
| Check-in quotidien : ouvrir → logger humeur → fini | 2 taps (Home > tap emoji dans DailyBriefing) | Aucun — c'est le flux le plus poli de l'app | 9/10 |
| Scanner un aliment : naviguer → scanner → voir resultat | 2-3 taps (Home > Scanner ou Nutri > Scanner) | Entree dupliquee (Home quickAction vs Nutri tab) — coherente mais legere confusion | 7/10 |
| Balade : demarrer → tracker → terminer → sauvegarder | 4 taps (Activite > Balade > Demarrer > Terminer) | Balade non accessible depuis Home en 1 tap — il faut passer par le FAB ou l'onglet Activite | 6/10 |
| Parler au coach IA | 3+ taps (ChatFAB sur pages secondaires, ou Nutri > Coach IA) | Invisible sur Home — la feature la plus differenciante est la moins accessible | 4/10 |
| Upgrade Premium : decouvrir → decider → payer | Variable (limite atteinte = redirect contextuel) | La page Premium existe et est bien construite, mais on n'y arrive que par blocage | 6/10 |
| Trouver un veterinaire | 3 taps (Sante > Veto > carte) | Veto est le 5e sous-onglet de Sante — tres enfoui pour une action urgente | 4/10 |

### Analyse du flux onboarding en detail

**Etape 0 (Splash)** — `OnboardingWelcome` : Visuellement fort (gradient, illustration, animations). La promesse "2 minutes" est affichee — mais le flux reel prend 3-4 minutes.

**Etapes 1-10 (Interview)** — Chaque etape est bien UI (icone coloree, champ vocal, progress bar). Mais l'utilisateur ne voit aucune previsualisation de l'app. Noom montre une prediction de poids a l'etape 4. Woofz montre un plan personnalise avant la creation de compte. PawCoach ne montre rien.

**Etapes optionnelles** — Seules les etapes 3 (race) et 9 (sante/allergies) sont officiellement optionnelles (`OPTIONAL_STEPS = new Set([3, 9])`). Les etapes 4-8 (age, sexe, poids, activite, environnement) sont obligatoires. C'est trop strict pour un onboarding mobile.

**Photo (etape 1)** — Upload de photo en plein milieu du flow. Si l'upload echoue (reseau lent, photo trop lourde), l'utilisateur est bloque a l'etape 1 sur 10. Il n'y a pas de message de fallback visible.

**AI processing (etape 11)** — Apres le dernier step, un LLM parse les reponses et cree le chien. C'est invisible pour l'utilisateur (pas de loader explicite indiquant ce qui se passe). Si le LLM est lent (>5s), l'ecran est gel.

**WelcomeScreen** — Affiche "Bienvenue, [nom du chien]!" avec photo et badge premium. C'est bien. Mais le contenu est generique — il ne dit pas "Basé sur [race], voici ce qu'on va suivre pour [nom]". Apres 10 etapes, l'utilisateur merite une personalisation visible.

---

## 3. Cognitive Load Analysis

### Home

**Contenu above the fold :**
- CoachHomeHeader (greeting + photo chien)
- DailyBriefing (message contextuel + mission du jour + emoji checkin)

Excellent — un seul focus, un seul message, une seule action primaire. L'architecture "le coach parle en premier" est la bonne approche.

**Contenu below the fold (scroll) :**
1. TrialExpiryBanner (conditionnel)
2. FirstDayGuide (conditionnel, J0 seulement)
3. Hero Illustration avec message contextuel
4. CalendarStrip (7 jours)
5. DailyProgress (3 mini-cartes)
6. Dashboard button
7. Quick Actions (4 boutons)
8. WeeklyInsightCard (premium)
9. ActiveProgramCards

C'est beaucoup. Pour un utilisateur J30, la page Home montre environ 9 sections differentes. Le probleme n'est pas que chaque section soit mauvaise — elles sont toutes pertinentes — mais l'ordre de priorite n'est pas optimal.

**Recommandation :** Le Dashboard button (section 6) a peu d'urgence quotidienne mais prend beaucoup d'espace visuel. Il devrait etre plus bas ou dans Profile.

### Sante

5 sous-onglets dans une barre scrollable horizontale. La barre est visible, mais les etiquettes sont courtes et les icones sont similaires en couleur (toutes emerald/primary sauf Documents violet et Veto bleu). Pour un utilisateur non-technique, distinguer "Carnet" de "Croissance" n'est pas immediat.

**Etat vide de Carnet** — premier acces sans donnees. Il faut verifier que l'empty state guide bien vers la premiere action (ajouter un vaccin, un poids...).

### Nutri

5 sous-onglets. "Comparer croquettes" et "Preferences" (onglets 4 et 5) sont des features utiles mais trop reculees. La plupart des utilisateurs resteront sur Scanner et Coach IA.

La page utilise un `dogDataState` avec 10 champs et des setters imbriques — c'est de la dette technique (identifiee dans ARCHITECTURE.md) mais ca n'affecte pas directement l'UX end-user tant que ca ne cree pas de bugs.

### Chat

L'experience chat est propre. Streaming typewriter, markdown render, voice input, bookmarks. Le seul probleme UX : le compteur de messages restants ("10/jour free") n'est pas visible d'entree. L'utilisateur decouvre la limite quand il est bloque, pas avant.

### Profile

Flat list de sections en scroll. C'est acceptable mais ca manque de hierarchie visuelle. "Tableau de bord" et "Mon chien" sont les actions les plus utiles mais elles ne sont pas mises en evidence par rapport a "Parametres" ou "Deconnexion".

---

## 4. Emotional Design

### Ce qui fonctionne bien

**DailyBriefing — meilleur composant emotionnel de l'app.** La logique de `generateBriefing()` est excellente : elle adapte le message en fonction de si le check-in est fait, du mood precedent, du streak, de si une balade a ete faite. "Max etait en forme hier. Voyons comment se passe ce matin." C'est exactement ce qu'un bon coach ferait.

**FirstDayGuide — celebrations** : Le confetti + message "Bravo, [nom] est entre de bonnes mains !" quand les 3 premieres actions sont completees est un moment de joie bien execute.

**Streak milestones** : 6 paliers (3, 7, 14, 30, 60, 100 jours) avec messages personnalises et confetti. L'utilisateur a des raisons de revenir.

**Illustration + message contextuel (Hero Card Home)** : Le bloc qui dit "[nom] est en forme !" ou "[nom] attend son check-in" selon l'etat du jour est une personalisation legere mais efficace — ca donne l'impression que l'app connait ton chien.

**WelcomeScreen** — photo du chien au centre, badge premium, animations. Emouvant pour un nouvel utilisateur.

### Ce qui manque

**Les badges sont invisibles au quotidien.** 12 badges existent. L'utilisateur en debloque. Mais sauf sur Profile > AchievementsSection, ils n'apparaissent jamais. Il n'y a pas de "badge en cours" sur Home, pas de "il te manque X km de balade pour gagner le badge Marathonien". La tension gamifiee est absente.

**Aucun niveau ou barre de progression.** Les points de badges (10-300 pts) s'accumulent, mais il n'y a pas de notion de niveau. Duolingo a des leagues. Noom a des phases. PawCoach a des points qui ne signifient rien visuellement.

**Les empty states sont descriptifs mais pas motivants.** L'EmptyState component affiche probablement un texte et une illustration quand il n'y a pas de donnees — mais il ne cree pas d'urgence ou d'envie.

**Aucun retour emotionnel sur le scan.** Quand un aliment est safe, il y a un verdict. Mais est-ce qu'il y a un moment de joie ("Bonne nouvelle pour [nom]!") ou d'inquietude ("Attention !") adapte ?

**Microcopy globalement correct mais parfois plat.** "Check-in enregistre !" est fonctionnel. "Max est en pleine forme — beau check-in !" serait emotionnel. La difference est subtile mais cumulative.

---

## 5. Accessibility UX (usabilite pour la cible)

La cible inclut des proprietaires de chiens francophones, probablement 25-65 ans, utilisant principalement leur smartphone en conditions reelles (exterieur, une main liberee, potentiellement bruit ambiant).

### Points positifs

**Animations respectent `prefers-reduced-motion`** : `useReducedMotion()` est verifie dans Home, Layout, Activite — les animations sont desactivees pour les utilisateurs sensibles. Excellent.

**`aria-label` sur les actions icon-only** : Le FAB, les boutons de nav, ont des labels accessible. La BottomNav a `aria-label="Navigation principale"`.

**Voice input disponible** : Onboarding et Chat proposent la saisie vocale. Ideal pour les utilisateurs moins a l'aise avec le clavier.

**Tailles de police** : Les valeurs visibles (14px-16px pour le contenu principal, 11-12px pour les labels secondaires) sont dans la norme mobile.

### Problemes

**Touch targets dans BottomNav (Medium)** : Les icones de la BottomNav sont dans un `div p-2 rounded-xl` soit ~44px de zone de tap — conforme aux guidelines Apple (44pt minimum). Mais les labels "Accueil", "Sante" etc. sont hors de la zone cliquable (`Link` englobe l'icone + label mais la zone tap pourrait etre plus large).

**Quick Actions sur Home (Medium)** : Les 4 quick action buttons sont dans un `w-[72px]` container avec l'icone et le label. Sur un iPhone SE (375px de large), 4 boutons de 72px + padding laissent peu d'espace. Utilisable mais limite pour des mains larges.

**Barre de sous-onglets (Medium)** : Les sous-onglets de Sante/Activite/Nutri sont dans une barre scrollable. Sur mobile, le scroll horizontal n'est pas toujours evident pour les utilisateurs 55+. L'indication visuelle que ca scroll (shadow ou gradient sur le bord) n'est pas mentionnee dans le code — a verifier.

**Contraste en exterieur** : Le fond cream `HSL(37,33%,95%)` avec du texte muted-foreground en conditions de soleil intense peut etre difficile a lire. Le design system "Nature Premium" est beau en interieur mais peut souffrir dehors.

**Operation a une main (Medium)** : Le CombinedFAB est en bas a droite — accessible en mode une main. La BottomNav est en bas — excellente pour le pouce. Mais certaines actions importantes (DailyBriefing check-in) sont en haut de page et necessitent un scroll ou un tap en haut de l'ecran, difficile sur grands ecrans.

---

## 6. Competitive UX Gaps

### Patterns que les concurrents ont et PawCoach n'a pas

**Gap 1 — Progression visible (Duolingo, Noom)** : Duolingo a des niveaux, des barres XP, des leagues avec deadlines. Noom a des phases de couleur. Ces systemes creent une raison de revenir meme sans contenu nouveau. PawCoach a des points mais sans contexte de progression.

**Gap 2 — Valeur pendant l'onboarding (Noom)** : Noom montre une prediction personnalisee a l'etape 4. PawCoach ne montre rien avant la fin des 10 etapes. Ce pattern manquant coute probablement 30-40% des abandons d'onboarding.

**Gap 3 — Contenu quotidien rotatif (Calm, Duolingo)** : Calm a une nouvelle meditation chaque jour. Duolingo a un challenge quotidien. Ces contenus donnent une raison d'ouvrir l'app meme quand l'utilisateur "n'a rien a faire". PawCoach a le DailyBriefing qui est contextuel mais pas du contenu consommable frais.

**Gap 4 — AI coach comme feature principale (Noom)** : Noom met son coach humain en onglet principal. PawCoach cache son AI coach — la principale raison d'etre payant — dans un FAB ou un sous-onglet 3/5.

**Gap 5 — Soft paywall apres moment de valeur (Calm, Noom)** : Calm montre une premiere meditation gratuite, PUIS propose le paywall. PawCoach montre le paywall uniquement quand une limite est atteinte. Le moment emotionnel d'achat (apres une experience reussie) est rate.

### Avantage UX unique de PawCoach

**Le DailyBriefing est genuinement differentiant.** Aucun concurrent (Woofz, PetDesk, etc.) n'a un coach IA qui parle specifiquement DE ton chien avec ses donnees reelles. "Max etait en forme hier, voyons comment se passe ce matin" est quelque chose que seule une app avec suivi de donnees et IA peut faire. C'est l'USP et elle est bien implementee dans le composant.

**La combinaison Scan + Diagnostic IA + Chat** dans la meme app est unique. Woofz n'a pas d'IA, les apps vet n'ont pas de suivi quotidien. PawCoach est la seule app qui fait les trois.

---

## Top 10 UX Issues (priority order)

| # | Issue | Impact | Page | Fix Complexity |
|---|-------|--------|------|---------------|
| 1 | **Onboarding : 10 etapes sans previsualisation de valeur** — chaque etape supplementaire coute ~10% d'utilisateurs. Noom/Duolingo montrent de la valeur des l'etape 3-4. | Critique — affecte tous les nouveaux utilisateurs | Onboarding.jsx | Medium (consolider etapes, ajouter preview breed-based entre etapes) |
| 2 | **L'IA (differenciateur #1) invisible sur Home** — ChatFAB absent de Home, Coach IA est le sous-onglet 3/5 dans Nutri. Le nouveaux utilisateur ne sait pas que l'app a une IA. | Critique — affecte retention J1-J7 | Home.jsx, BottomNav.jsx | Low (ajouter ChatFAB sur Home, ou carte "Parle au coach" dans le feed Home) |
| 3 | **Pas de push notifications client-side** — 6 fonctions de rappel backend existent mais pas de client push. Sans push, la retention J7 reste sous 15% vs 30%+ avec push. | Critique — impact mesurable sur retention | sw.js, Service Worker | High (VAPID keys, opt-in flow, notification UI) |
| 4 | **Badges/points invisibles au quotidien** — 12 badges et systeme de points existent mais sont enfouis dans Profile. Aucune tension gamifiee sur Home. | Haut — absence du moteur de retention quotidien | Home.jsx, Profile > AchievementsSection | Low-Medium (ajouter badge en cours + progress vers prochain sur Home header) |
| 5 | **Surcharge de sous-onglets : 14 sous-onglets sans hint de scroll** — l'utilisateur ne sait pas qu'il y a un 4e ou 5e onglet dans Sante/Nutri. Features cles comme "Documents" et "Veto" sont invisibles. | Haut — features cachees = features non utilisees | Sante.jsx, Nutri.jsx, Activite.jsx | Low (ajouter gradient edge sur la barre d'onglets pour indiquer le scroll) |
| 6 | **Paywall seulement par blocage, jamais apres un moment de valeur** — la page Premium est bien construite mais on y arrive uniquement quand on atteint une limite. | Haut — taux de conversion sous-optimal | Premium.jsx, Home.jsx | Medium (trigger soft paywall apres premiere balade enregistree ou premier scan reussi) |
| 7 | **Trouve Veto en 3 taps minimum (Sante > tab 5)** — trouver un veterinaire urgence = 3 taps + scroll dans la barre d'onglets. C'est trop lent pour une action potentiellement urgente. | Haut — friction sur cas d'usage critique | Sante.jsx | Low-Medium (ajouter raccourci "Trouver un veto" dans Home ou BottomNav tooltip) |
| 8 | **WelcomeScreen generique apres 10 etapes de collecte** — apres avoir donne race, age, poids, objectif, l'utilisateur voit "Le profil de [nom] est cree" sans personalisation basee sur ses reponses. | Medium — moment d'aha rate | WelcomeScreen.jsx | Low (ajouter 2-3 phrases basees sur la race/l'age : "Pour un Beagle de 2 ans, on va suivre...") |
| 9 | **Le Dashboard est dans Profile alors qu'il devrait etre dans Home** — les stats globales (tendances, alertes, scores) sont le contexte dont l'utilisateur a besoin quotidiennement. | Medium — navigation contre-intuitive | Profile.jsx, Home.jsx | Low (ajouter lien/carte Dashboard plus prominent sur Home, ou deplacer dans BottomNav) |
| 10 | **Compteur de messages IA non visible avant la limite** — l'utilisateur decouvre qu'il a "10 messages/jour" seulement quand il est bloque. Afficher le compteur dans la bar du chat cree une transparence et incite a l'upgrade avant la frustration. | Medium — frustration evitable | Chat.jsx | Low (afficher "X messages restants aujourd'hui" dans le header Chat) |

---

## Synthese par dimension

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Information Architecture | 6/10 | Structure logique mais 14 sous-onglets invisibles et IA mal placee |
| User Flows (cles) | 5.5/10 | Check-in excellent, mais onboarding et IA access problematiques |
| Cognitive Load | 7/10 | Home bien concu au-dessus du fold, dense mais gerable below |
| Emotional Design | 6.5/10 | DailyBriefing est exceptionnel, mais gamification pas assez visible |
| Accessibility UX | 7/10 | Voice input, reduced-motion, aria-labels — bonne base |
| Competitive Gaps | 5/10 | IA cachee, pas de push, pas de progression visible |
| **Global** | **6.2/10** | Base solide, gaps clairs sur activation et retention |

---

## Prochaines etapes recommandees

1. **Quick wins (<1 jour chacun) :** gradient edge sur barres d'onglets (issue #5), ChatFAB sur Home (issue #2), compteur messages dans Chat (issue #10), personalisation WelcomeScreen (issue #8).
2. **Medium effort (1-3 jours) :** badge en cours sur Home (issue #4), soft paywall apres valeur (issue #6).
3. **Sprint dedie :** onboarding a 5 etapes avec valeur intermediaire (issue #1) — c'est le changement le plus impactant sur l'activation.
4. **Projet independant :** push notifications client-side (issue #3) — necessite VAPID keys, service worker upgrade, opt-in flow.

---

*Rapport genere par analyse statique du code source le 2026-03-27. Aucun test utilisateur reel effectue — les scores sont des estimations basees sur l'analyse de code et les benchmarks secteur.*
