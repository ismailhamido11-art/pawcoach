# Decisions pour Ismail — A repondre quand tu veux

Ces 6 questions bloquent ~15 corrections. Tout le reste est en cours de fix autonome.

## 1. Faux numero 3115 (URGENT)
Le "3115" affiche comme "Urgence veterinaire" est le numero prevention du suicide.
- A) Supprimer le bloc entier
- B) Remplacer par quoi ? (il n'existe pas de numero national d'urgence veto en France)

## 2. Liens Amazon/Zooplus
Des boutons "Voir l'offre" pointent vers amazon.fr et zooplus.fr (pages d'accueil, pas de produit).
- A) Supprimer ces blocs entierement (recommande)
- B) Les garder mais les desactiver

## 3. Articles hardcodes sur la Home
"5 plantes toxiques" et "Friandises maison" avec photos Unsplash. Faux articles.
- A) Supprimer la section ContentArticles
- B) Les pointer vers la page Library
- C) Les garder tels quels

## 4. Onboarding — champs optionnels
Actuellement TOUS les champs sont obligatoires (race, sante, allergies, activite).
- A) Rendre race + allergies + problemes de sante optionnels (recommande)
- B) Tout rendre optionnel sauf le nom
- C) Garder tout obligatoire

## 5. Chat — historique
Quand l'utilisateur revient sur le Chat, il repart de zero (pas d'historique).
- A) Garder comme ca (conversation fraiche a chaque visite)
- B) Charger les 10 derniers messages au demarrage

## 6. Profil public QR — quelles donnees
Actuellement : vaccins + poids. Les medications et visites veto sont comptees mais pas affichees.
- A) Garder vaccins + poids seulement (recommande pour la vie privee)
- B) Ajouter medications + visites veto
