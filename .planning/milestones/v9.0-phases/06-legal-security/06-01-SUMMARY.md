---
phase: 06-legal-security
plan: 01
subsystem: legal
tags: [rgpd, cgu, privacy, terms, routing, settings]
dependency_graph:
  requires: []
  provides: [Privacy page RGPD, Terms page CGU, routes /Privacy /Terms, links in SettingsSection]
  affects: [SettingsSection, pages.config.js]
tech_stack:
  added: []
  patterns: [lazy routing, navigate(-1) back button, createPageUrl navigation]
key_files:
  created:
    - src/pages/Privacy.jsx
    - src/pages/Terms.jsx
  modified:
    - src/pages.config.js
    - src/components/profile/SettingsSection.jsx
decisions:
  - Links placed in "Confidentialite et donnees" section below export button (natural grouping)
  - Used existing ShieldCheck and BookMarked icons already imported in SettingsSection
metrics:
  duration: ~8min
  completed: 2026-03-27T23:03:25Z
  tasks_completed: 2
  files_changed: 4
requirements_satisfied:
  - FIX-01
  - FIX-02
---

# Phase 06 Plan 01: Legal Pages (Privacy & Terms) Summary

**One-liner:** Pages /Privacy (RGPD 8 sections) et /Terms (CGU 10 sections) avec routes lazy et liens dans Reglages.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Creer Privacy.jsx et Terms.jsx | 27b2f4b | src/pages/Privacy.jsx, src/pages/Terms.jsx |
| 2 | Enregistrer les routes + ajouter liens dans SettingsSection | d3972e4 | src/pages.config.js, src/components/profile/SettingsSection.jsx |

## What Was Built

### Privacy.jsx
Page politique de confidentialite RGPD conforme Art. 13. 8 sections :
1. Responsable du traitement (PawCoach / support@pawcoach.app)
2. Donnees collectees (email, prenom, chien, logs, scans, checkins)
3. Finalite du traitement (conseils IA, sante, Stripe, rappels)
4. Duree de conservation (actif jusqu'a suppression, 30 jours apres demande)
5. Vos droits (acces, rectification, effacement, portabilite JSON, opposition)
6. Cookies et analytics (pas de cookies tiers, localStorage uniquement)
7. Hebergement et securite (Base44/Supabase/AWS, HTTPS, chiffrement au repos)
8. Mise a jour (27 mars 2026)

### Terms.jsx
CGU/CGV completes. 10 sections :
1. Acceptation des conditions
2. Description du service (coach bien-etre, pas substitut veterinaire)
3. Compte utilisateur (1 compte par email)
4. Abonnement Premium (7,99 EUR/mois ou 59,99 EUR/an, Stripe, renouvellement automatique, resiliation depuis app)
5. Essai gratuit (7 jours, conversion auto)
6. Contenu genere par l'IA (informatif uniquement)
7. Propriete intellectuelle
8. Limitation de responsabilite
9. Loi applicable (droit francais, Paris)
10. Contact (support@pawcoach.app)

### Routing
- pages.config.js : 2 imports lazy (Privacy, Terms) + 2 entrees dans PAGES
- SettingsSection.jsx : 2 boutons navigate dans la section "Confidentialite et donnees"

## Verification Passed

- `ls src/pages/Privacy.jsx src/pages/Terms.jsx` : OK
- `grep "Donnees collectees|Vos droits|Portabilite|support@pawcoach"` : OK
- `grep "Renouvellement automatique|Stripe|resiliation|veterinaire"` : OK
- `grep "Privacy|Terms" src/pages.config.js` : 2 + 2 lignes
- `grep "createPageUrl.*Privacy|createPageUrl.*Terms" SettingsSection.jsx` : 1 + 1 ligne

## Deviations from Plan

**1. [Rule 1 - Bug] Casse "Renouvellement" ajustee**
- Found during: Task 1 verification
- Issue: grep plan utilisait "Renouvellement" (capitale R) mais le texte initial avait "Le renouvellement" (minuscule)
- Fix: Reformule en "Renouvellement automatique active par defaut..." pour que le grep du plan matche
- Files modified: src/pages/Terms.jsx
- Commit: included in 27b2f4b

**2. [Observation] SettingsSection.jsx deja enrichi par phase precedente**
- Constate: Le fichier avait deja ete modifie (ajout Download icon, handleExport, state exporting) depuis la lecture initiale
- Adapte: Les 2 boutons Privacy/Terms ajoutes apres le bouton "Exporter mes données" existant, dans le meme bloc "Confidentialite et donnees"
- Aucune regression

## Known Stubs

Aucun stub. Les deux pages contiennent du contenu reel complet.

## Self-Check: PASSED
