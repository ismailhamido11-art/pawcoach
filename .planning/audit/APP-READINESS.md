# App Readiness Audit — PawCoach
*Date : 27 mars 2026 | Auditeur : Claude Code*

---

## Blockers (must fix before showing to users)

### B1 — Git conflict dans l'icône PWA [CRITIQUE]
**Fichier :** `public/icons/icon-192.svg`
**Problème :** Le fichier contient des marqueurs de conflit Git non résolus (`<<<<<<< HEAD`, `=======`, `>>>>>>>`) directement dans le SVG. L'icône est **cassée** — le fichier n'est pas un SVG valide. Un utilisateur qui installe l'app voit une icône corrompue sur son écran d'accueil, ou pas d'icône du tout. À vérifier aussi pour `icon-512.svg`.
**Impact :** Toute personne installant la PWA verra une icône cassée — impression de produit bâclé immédiate.

### B2 — Code parrain affiché mais non fonctionnel [CRITIQUE CONFIANCE]
**Fichiers :** `src/components/onboarding/WelcomeScreen.jsx` (ligne 66-102), `src/components/profile/ReferralSection.jsx`
**Problème :** L'écran de bienvenue post-onboarding affiche un champ "CODE PARRAIN" et permet de saisir un code. Il est envoyé via `base44.auth.updateMe({ referred_by: code })` mais `ReferralSection.jsx` contient ce commentaire explicite : `// Section referral retiree : aucun backend de validation du code parrain (PREM-04)`. Le code est stocké mais n'a aucun effet (pas de remise, pas d'avantage, pas de validation). Un utilisateur qui saisit un code "reçu d'un ami" ne verra rien se passer — pire, s'il s'attend à une extension d'essai ou une remise et ne la reçoit pas, c'est une rupture de confiance.
**Action :** Soit supprimer complètement le champ de l'écran de bienvenue, soit implémenter le backend.

### B3 — `deleteMany` sur des entités non exposées [CRITIQUE DONNÉES]
**Fichier :** `src/pages/DogProfile.jsx` (ligne 128-138)
**Problème :** La suppression d'un chien appelle `base44.entities[name].deleteMany(...)` via l'objet `base44` direct, alors que l'API entities wrapper dans `src/api/entities.js` n'expose pas `deleteMany`. Le code utilise `base44.entities.ParkReview.deleteMany` et `base44.entities.PlaceFavorite.deleteMany` mais `ParkReview` et `PlaceFavorite` ne sont pas dans la liste des entités du wrapper. Le risque est que la suppression partielle laisse des données orphelines (reviews de parcs sans chien) ou plante silencieusement. À vérifier en environnement réel — les `.catch(() => {})` masquent les erreurs.

---

## Important Gaps (users will notice)

### G1 — Rappels = email only, aucune notification push [ENGAGEMENT]
**Fichiers :** `base44/functions/vaccineReminders/entry.ts`, `base44/functions/streakReminder/entry.ts`, `base44/functions/walkReminder/entry.ts`, `src/components/profile/WalkReminderSettings.jsx`
**Problème :** Tous les rappels (vaccins, streak, balade) sont uniquement par email. Le rappel balade envoie un email à une heure précise si pas d'activité — utile, mais en 2026 un email de rappel à 18h00 est quasi-invisible pour la plupart des utilisateurs. Il n'y a aucune notification push PWA (Web Push API). Un utilisateur installe l'app sur son téléphone et attend d'être "rappelé" par l'app — ça n'arrivera jamais.
**Impact :** Rétention faible. Les streaks meurent silencieusement.
**Note :** La WalkReminderSettings est bien construite mais l'implémentation est un email, pas une notif push. C'est mentionné dans l'UI (texte "Un email sera envoyé") — honnête, mais décevant pour une app installée.

### G2 — Check-in : mood scale incohérente [UX CONFUSION]
**Fichiers :** `src/pages/Home.jsx` (DailyBriefing rapide), `src/components/home/InlineCheckin.jsx`, `base44/functions/dailyCheckinProcess/`
**Problème :** Le check-in rapide dans DailyBriefing utilise des valeurs 2/3/4/5 pour mood (MOOD_OPTIONS : 5=Super, 4=Bien, 3=Bof, 2=Pas top), mais le Dashboard calcule la moyenne en /4 (`"${(animatedMood / 10).toFixed(1)}/4"`). Il y a une incohérence entre l'échelle affichée à l'utilisateur (implicitement sur 5) et l'affichage de la moyenne (sur 4). Un utilisateur voyant "3.2/4" ne comprend pas ce que ça mesure.

### G3 — Contenu éditorial absent [VALEUR PERÇUE]
**Fichier :** `src/pages/Home.jsx` (ligne 21 et 593)
**Problème :** Le commentaire dans le code est explicite : `// ContentArticles removed — hardcoded placeholder content, will be replaced with real content later`. La section "articles" / contenu éditorial a été retirée car elle était fausse, mais rien ne l'a remplacée. L'app manque d'un flux de contenu (articles, conseils de la semaine, actualités canines) qui ferait revenir les utilisateurs même sans check-in à faire. La section "Le savais-tu ?" (EmotionalTip) avec 20 tips statiques rotatifs est une solution de fortune, pas un remplacement.

### G4 — Welcome email : contenu trop pauvre [ONBOARDING]
**Fichier :** `src/pages/Onboarding.jsx` (ligne 257-262)
**Problème :** L'email de bienvenue envoyé après l'onboarding a ce body : `"${dog.name} est maintenant inscrit ! Profitez de l'application !"`. Un email aussi basique arrive probablement en spam et n'aide pas l'utilisateur à démarrer. Il n'y a pas de "3 choses à faire en premier", pas de lien vers l'app, pas de personnalisation au-delà du prénom du chien.

### G5 — Onboarding : retour arrière possible jusqu'à l'écran vide [EDGE CASE]
**Fichier :** `src/pages/Onboarding.jsx`
**Problème :** Quand `isAddDog=false`, l'utilisateur voit d'abord `OnboardingWelcome`, puis `started=true`. Si l'utilisateur appuie sur "Back" du navigateur/système après avoir commencé l'interview, il peut potentiellement revenir à l'écran splash et recommencer depuis le début — l'état sessionStorage est restauré, donc les réponses sont préservées, mais la navigation n'est pas bloquée. Pas de `useEffect` qui remplace l'historique pour empêcher le retour arrière.

### G6 — Quota chat free : 10 messages/jour mais reset non garanti server-side [SÉCURITÉ SOFT]
**Fichier :** `src/utils/ai-credits.js`
**Problème :** Le quota de messages (10/jour) est géré côté client via `base44.auth.updateMe`. Il n'y a pas de validation server-side dans la fonction `pawcoachChat` visible. Un utilisateur qui manipule le localStorage ou `user.messages_remaining` via DevTools peut contourner la limite. Pour un MVP c'est acceptable, mais à signaler avant la croissance.

### G7 — Multi-chien : switching ne recharge pas les pages [UX]
**Fichier :** `src/components/profile/DogSwitcher.jsx`, toutes les pages principales
**Problème :** Quand l'utilisateur change de chien actif dans DogSwitcher (via `localStorage.setItem("activeDogId", dogId)`), les pages ne se rechargent pas automatiquement. L'utilisateur doit naviguer manuellement vers une autre page et revenir pour voir les données du nouveau chien. Il n'y a pas de `storage` event listener global ou de context refresh. Sur Home, Dashboard, Sante, etc., le chien affiché reste l'ancien jusqu'à rechargement.

### G8 — Offline : expérience vide sans message clair [PWA QUALITY]
**Fichier :** `public/sw.js`
**Problème :** Le service worker met en cache les assets statiques correctement, mais quand l'API échoue hors ligne, chaque page affiche soit une erreur toast (`"Impossible de charger..."`) soit reste vide. Il n'y a pas d'écran "Tu es hors connexion" cohérent — chaque page gère l'erreur différemment. La page Home affiche `SkeletonPage` indéfiniment si le réseau échoue. C'est l'app installée sur un téléphone — les utilisateurs s'attendent à voir au moins les données du cache.

### G9 — VetPortal accessible depuis le BottomNav sans être une feature finalisée [CONFIANCE]
**Fichier :** `src/pages/VetPortal.jsx`, `src/components/BottomNav.jsx`
**Problème :** Le portail vétérinaire est une feature B2B (vétérinaires qui consultent les données patients) accessible par URL. Elle fonctionne via des codes d'accès. C'est une bonne idée, mais la navigation vers cette page n'est pas protégée, et le flux d'invitation vétérinaire est peu documenté in-app. Un utilisateur qui clique par erreur atterrit sur un écran qui lui demande "d'entrer un code" sans explication claire du contexte.

### G10 — Analytics : stub vide [BUSINESS BLIND]
**Fichier :** `src/utils/analytics.js`
**Problème :** Le fichier contient : `Will be replaced by a real analytics service when the time comes.` Tous les `trackEvent` dans l'app ne font rien. Pas de Mixpanel, PostHog, Amplitude, ni même Google Analytics. Tu ne sauras pas combien d'utilisateurs complètent l'onboarding, cliquent sur Premium, ou abandonnent le check-in. Impossible de prendre des décisions produit.

---

## Nice-to-Have (polish)

### N1 — EmotionalTip : tips sans accents [QUALITÉ TEXTE]
**Fichier :** `src/components/home/EmotionalTip.jsx`
**Problème :** Tous les tips sont écrits sans accents (`"Un chien bien hydrate digere mieux"`, `"Les caresses lentes sur le flanc reduisent"`) — probablement une conversion automatique. L'utilisateur lit "hydrate" au lieu de "hydraté". **Effort : 30 min** — corriger les 20 textes.

### N2 — DailyBriefing : messages sans accents [QUALITÉ TEXTE]
**Fichier :** `src/components/home/DailyBriefing.jsx`
**Problème :** Les messages générés par `generateBriefing` manquent d'accents (`"C'est le debut de l'aventure"`, `"Voyons comment se passe ce matin"`, `"la regularite paie"`). C'est le message que l'utilisateur voit en premier chaque jour — il doit être impeccable. **Effort : 20 min.**

### N3 — Témoignage Premium : probablement fictif [CRÉDIBILITÉ]
**Fichier :** `src/pages/Premium.jsx` (ligne 474-477)
**Problème :** `"Depuis que j'utilise PawCoach, je suis enfin serein sur l'alimentation de Rex. Le chat IA répond à toutes mes questions en 30 secondes." — Thomas, propriétaire d'un Golden Retriever`. Si c'est un faux témoignage et que l'app est réelle, c'est un risque légal et de confiance. Si l'app est encore en beta, retirer ou remplacer par un vrai témoignage. **Effort : 5 min.**

### N4 — Manifest : icônes SVG non reconnues par tous les OS [PWA]
**Fichier :** `public/manifest.json`
**Problème :** Les icônes sont au format SVG (`type: "image/svg+xml"`). Certains OS (notamment Android < 12, Samsung Internet) ne supportent pas les icônes SVG pour l'écran d'accueil PWA. Il faudrait des fallbacks PNG 192x192 et 512x512. De plus, le conflit Git dans `icon-192.svg` rend cela urgent. **Effort : 1h** (générer les PNGs depuis le design).

### N5 — Avis parcs : "Avis bientôt disponibles" affiché si entité manquante [UX]
**Fichier :** `src/components/tracker/ParkReviews.jsx` (ligne 138-145)
**Problème :** Si l'entité `ParkReview` n'est pas créée dans Base44, tous les parcs affichent un texte désactivé "Avis bientôt disponibles". C'est honnête mais donne une impression d'inachevé. L'entité existe dans `entities.js` — soit la connecter soit cacher la section. **Effort : 30 min de vérification.**

### N6 — Scores de santé : pas de tooltip d'explication [UX]
**Fichier :** `src/pages/Dashboard.jsx`
**Problème :** Le score de santé circulaire (ex: 72/100) apparaît sans explication de ce qu'il mesure. Un utilisateur voit "72 — À surveiller" mais ne sait pas pourquoi c'est 72 et pas 90. Un tooltip ou une section d'explication améliorerait la confiance. **Effort : 2h.**

### N7 — Pas de confirmation par email après paiement [STRIPE]
**Fichier :** `base44/functions/stripeWebhook/`
**Problème :** Après le paiement, l'utilisateur reçoit un confetti + toast. Il n'est pas clair si Base44/Stripe envoie un email de confirmation de paiement automatiquement. Si non, l'absence de confirmation email rassurante est un vrai manque pour un achat (même faible valeur). **Effort : à vérifier dans Stripe Dashboard.**

### N8 — Suppression du chien : pas de migration du chien actif [EDGE CASE]
**Fichier :** `src/pages/DogProfile.jsx` (ligne 141-144)
**Problème :** Quand un utilisateur supprime son chien actif, le code retire `activeDogId` du localStorage. L'utilisateur revient au Profile. Mais si l'utilisateur a un autre chien, le nouveau chien actif n'est pas sélectionné automatiquement. L'utilisateur atterrit sur Profile avec un switcher vide ou des données pour `undefined`. **Effort : 30 min.**

---

## Ce qui fonctionne bien

1. **Onboarding conversationnel** — Les 10 étapes avec dictée vocale, photo, et persistance sessionStorage sont bien conçues. La logique de reprise en cas de refresh est là.

2. **Trial gratuit 7 jours automatique** — L'activation à la fin de l'onboarding, la logique `isUserPremium` qui inclut le trial, et les bannières d'expiration (TrialExpiryBanner, PostTrialSheet) sont bien implémentées. Pas de demande de carte bancaire au départ — bonne décision produit.

3. **Paywall graduel** — Les messages contextuels par point d'entrée (chat, scan, training, nutrition, profile) sont pertinents. La page Premium est propre avec tableau comparatif et urgence adaptée au segment du chien (puppy/adult/senior).

4. **Notifications in-app (NotificationCenter)** — La cloche avec badge rouge, le panel slide-in, le système de dedup par localStorage et TTL 5 min sont bien faits. Les rappels vaccins pointent vers la bonne section.

5. **Backend robuste** — Les 22 fonctions Deno couvrent tous les cas : reminders (vaccin, streak, balade, visite véto), Stripe (checkout, webhook, portal), diagnostic, NutriCoach, insights hebdomadaires. Le code backend est solide avec logs, dedup et gestion d'erreurs.

6. **Multi-chien avec switching** — Le DogSwitcher est visuellement clair (avatar + nom + badge actif), la limite free/premium (1 vs 3) est bien gérée, et l'ajout de chien via le même onboarding est cohérent.

7. **Suppression complète d'un chien** — Le cascade delete couvre 16 entités. Rare d'avoir ça bien implémenté.

8. **Empty states** — Toutes les pages ont des états vides avec illustrations et CTA clairs (ex: "Enregistre au moins 2 pesées pour voir le graphique").

9. **Performance** — Pages secondaires en lazy loading, HomeCacheContext pour le cache SWR-like, SkeletonPage pour l'impression de vitesse.

10. **Design system cohérent** — Cream background, forest green, emerald, pas d'orange/teal parasite. Les gradients sont définis centralement dans `index.css`.

---

## Readiness Score : 6.2/10

| Dimension | Score | Justification |
|-----------|-------|---------------|
| **Onboarding** | 7/10 | Flow bien structuré, trial automatique, WelcomeScreen soignée. Manques : email de bienvenue trop pauvre, code parrain affiché mais mort. |
| **Core Loops** | 7/10 | Check-in → streak → celebration bien ficelé. Dashboard avec charts complets. Problème : multi-chien switching ne recharge pas les pages, scale mood incohérente. |
| **Visual Consistency** | 8/10 | Design system respecté partout. Textes sans accents dans EmotionalTip et DailyBriefing dégradent la qualité perçue. |
| **PWA Quality** | 4/10 | Icône PWA avec conflit Git non résolu = bloquant. Pas de notifications push. Offline sans message cohérent. SVG icons non supportées partout. |
| **Premium Flow** | 8/10 | Paywall contextuel, trial 7j, banners d'expiration, page Premium avec comparatif et social proof. Témoignage possiblement fictif. |
| **Error Handling** | 5/10 | Toast errors partout, optimistic updates sur check-in. Mais : erreurs offline silencieuses, deleteMany sur entités non-wrappées (.catch masqué), analytics stub vide = pas de visibilité sur les erreurs prod. |

---

## Prochaines étapes recommandées

1. **Urgent (bloquant)** : Résoudre le conflit Git dans `public/icons/icon-192.svg` + générer des PNG fallbacks
2. **Urgent (confiance)** : Supprimer le champ "code parrain" de WelcomeScreen ou l'implémenter vraiment
3. **Court terme** : Corriger les textes sans accents dans EmotionalTip et DailyBriefing
4. **Court terme** : Ajouter un analytics réel (PostHog free tier suffit) pour voir ce qui se passe
5. **Moyen terme** : Web Push notifications pour les rappels streak/balade — c'est le plus grand levier de rétention manquant
