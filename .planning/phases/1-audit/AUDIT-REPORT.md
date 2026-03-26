# PawCoach — Audit Consolidation v3.0
# Date: 27 mars 2026
# Total: 35 HIGH, 54 MEDIUM, 36 LOW = 125 issues

## CRITICAL (a corriger AVANT tout lancement)

### 1. DogPublicProfile bloque par l'authentification
FILE: src/App.jsx (routing architecture)
Le QR code d'urgence et les liens veto NE MARCHENT PAS pour les personnes non connectees. App.jsx wrappe TOUT dans AuthProvider qui redirige vers le login. La page "publique" n'est pas publique.
FIX: Router DogPublicProfile et VetDogView en dehors de AuthenticatedApp.

### 2. Faux numero d'urgence veterinaire 3115
FILE: src/components/sante/DiagnosisContent.jsx:87-92
Le numero "3115" est presente comme "Urgence veterinaire nationale" — c'est le numero de prevention du SUICIDE, pas des urgences veto. Risque reel si un utilisateur en panique compose ce numero.
FIX: Supprimer ou remplacer par les urgences locales.

### 3. FirstDayGuide — bouton "Faire le check-in" dead-end
FILE: src/components/home/FirstDayGuide.jsx:18
Le CTA le plus important de l'onboarding (premier jour) ne fait RIEN. onScrollToCheckin n'est jamais passe comme prop.
FIX: Passer la prop ou changer l'action.

### 4. Liens Amazon/Zooplus hardcodes partout
FILES: src/components/training/ExerciseDetail.jsx:99, src/pages/Scan.jsx:661, src/components/nutrition/NutritionMealPlan.jsx:48
Boutons "Voir l'offre" qui pointent vers amazon.fr (page d'accueil) et zooplus.fr. Faux liens partenaires. Impression d'arnaque.
FIX: Supprimer ces blocs jusqu'a avoir de vrais liens.

### 5. CombinedFAB — bouton sauvegarde bloque apres erreur
FILE: src/components/CombinedFAB.jsx:37-84
Pas de try/catch. Si l'API plante, le bouton reste bloque sur "Enregistrement..." pour toujours.
FIX: Ajouter try/catch + toast.error.

### 6. VetPortal — 3 cartes dead-end
FILE: src/pages/VetPortal.jsx:119-133
Les cartes "Patients / Notes / Rapports" ressemblent a des boutons mais ne font rien au clic.
FIX: Soit ajouter la navigation, soit retirer le style cliquable.

### 7. VetNoteForm — pas de try/catch, bouton bloque
FILE: src/components/vet/VetNoteForm.jsx:25-45
Si VetNote.create() plante, loading reste true, bouton desactive pour toujours.
FIX: Ajouter try/catch + finally.

### 8. Balade perdue silencieusement
FILE: src/components/tracker/WalkMode.jsx:303-308
Si dog/user est null au moment de handleStop, la balade n'est PAS sauvegardee. Aucun message. 45 minutes de balade perdues.
FIX: Message d'erreur + CTA "Reessayer".

### 9. Onboarding — utilisateur bloque sur champs optionnels
FILE: src/pages/Onboarding.jsx:172-174
Le bouton "Suivant" exige du texte pour avancer. Pas de bouton "Passer". Race, sante, allergies sont optionnels mais bloquants.
FIX: Marquer certains steps comme skippable.

### 10. Carte Premium dans Profile — dead-end
FILE: src/pages/Profile.jsx:149-157
La carte "Passe a Premium" n'a pas de onClick. C'est un CTA mort.
FIX: Ajouter navigate vers Premium.

## HIGH (35 issues au total)
Voir les rapports detailles des 6 agents dans le contexte de conversation.
Groupes principaux:
- Dead-end buttons (10 issues)
- Missing error handling / silent failures (8 issues)
- Incomplete flows / no feedback (7 issues)
- Hardcoded/fake content (5 issues)
- Security/data (3 issues)
- Premium gate confusion (2 issues)

## MEDIUM (54 issues au total)
Groupes principaux:
- Missing empty states (8)
- Confusing UX / unclear labels (10)
- Missing confirmations avant suppression (5)
- Silent failures sur edge cases (8)
- Premium flow incohérence (6)
- Navigation / back button issues (5)
- Copy/accents manquants (4)
- Performance (3)
- iOS-specific issues (3)
- Misc (2)

## LOW (36 issues)
Fautes d'accent, edge cases rares, micro-optimisations.
