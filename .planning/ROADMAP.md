# Roadmap: PawCoach

## Overview

Milestone v2.0 "Cleanup Technique" — corriger les problemes trouves par le scan codebase du 26 mars 2026.

## Completed Work (archived)
- v1.0 "Data Flow Integrity" — 4 phases, 16 requirements (mars 11-12)
- v1.1 "Quality Audit" — 4 phases: dead code, error UX, security, consistency (mars 12-15)
- Visual Polish (partial) — skeletons, mascots, empty states, animations setup (mars 24-25)

## Phases

- [x] **Phase 1: Catch vides** — 14 catch corrigés avec toast.error en francais (26 mars)
- [x] **Phase 2: Leaflet lazy loading** — Dynamic import dans Sante.jsx + WalkMode.jsx (26 mars)
- [ ] **Phase 3: DogPublicProfile privacy** — Proteger les donnees medicales du profil public (decision produit requise)
- [ ] **Phase 4: Home cache** — Ajouter du cache sur les 11 requetes API de la Home (risque: Home redesignee 6+ fois)
- [ ] **Phase 5: activeDogId reactif** — Migrer le chien actif de localStorage vers un React state/context
- [ ] **Phase 6: Data layer** — Centraliser les 202 appels SDK bruts dans une couche d'abstraction (49 fichiers)

## Phase Details

### Phase 1: Catch vides
**Goal**: Remplacer les 30+ catch vides par des toast.error() pour que l'utilisateur sache quand quelque chose echoue
**Depends on**: Nothing
**Autonomie**: OUI — safe, mecanique, zero risque
**Success Criteria**:
  1. Zero catch{} vide dans le codebase
  2. Chaque catch affiche un message comprehensible en francais
  3. npm run build passe sans erreur

### Phase 2: Leaflet lazy loading
**Goal**: Dynamic import de Leaflet pour qu'il ne charge qu'a la demande
**Depends on**: Nothing
**Autonomie**: OUI — technique classique, impact isole
**Success Criteria**:
  1. Leaflet n'est plus dans le bundle initial
  2. La carte fonctionne toujours quand on y accede
  3. npm run build passe sans erreur

### Phase 3: DogPublicProfile privacy
**Goal**: Proteger les donnees medicales du profil public du chien
**Depends on**: Decision d'Ismail (share_token? champs publics/prives?)
**Autonomie**: NON — decision produit requise
**Success Criteria**:
  1. Un visiteur non-connecte ne voit que les infos choisies par le proprietaire
  2. Le QR code veto fonctionne toujours

### Phase 4: Home cache
**Goal**: Reduire les 11 appels API a chaque ouverture de la Home
**Depends on**: Phase 1 (catch vides corriges d'abord)
**Autonomie**: PARTIEL — risque regression sur la Home
**Success Criteria**:
  1. La Home charge en moins de 2 secondes sur 4G
  2. Les donnees se rafraichissent quand necessaire
  3. Pas de regression visuelle

### Phase 5: activeDogId reactif
**Goal**: Le changement de chien actif se repercute immediatement sur toutes les pages
**Depends on**: Nothing
**Autonomie**: PARTIEL — touche potentiellement toutes les pages
**Success Criteria**:
  1. Changer de chien met a jour tous les ecrans sans refresh
  2. Supprimer un chien ne laisse pas de donnees fantomes

### Phase 6: Data layer
**Goal**: Centraliser les appels Base44 dans une couche d'abstraction
**Depends on**: Phases 1-5 (faire le reste d'abord, c'est le plus gros chantier)
**Autonomie**: NON — refactoring de 49 fichiers, planification detaillee requise
**Success Criteria**:
  1. Tous les appels Base44 passent par un fichier central (ou par entite)
  2. Gestion d'erreur uniforme
  3. Pas de regression fonctionnelle

## Progress

| Phase | Status | Autonomie | Completed |
|-------|--------|-----------|-----------|
| 1. Catch vides | DONE | OUI | 26 mars 2026 |
| 2. Leaflet lazy | DONE | OUI | 26 mars 2026 |
| 3. DogPublicProfile | Not started | NON (decision) | - |
| 4. Home cache | Not started | PARTIEL | - |
| 5. activeDogId | Not started | PARTIEL | - |
| 6. Data layer | Not started | NON (gros refactor) | - |
