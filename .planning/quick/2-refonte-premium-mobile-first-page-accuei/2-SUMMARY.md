---
phase: quick
plan: 2
subsystem: home-page
tags: [mobile-first, design, premium, refonte]
key-files:
  modified:
    - src/components/home/DogRadarHero.jsx
    - src/pages/Home.jsx
    - src/components/home/BentoGrid.jsx
    - src/components/home/QuickActions.jsx
    - src/components/home/StreakBar.jsx
decisions:
  - "computeArcs() conservee — scores reutilises comme mini barres de progression"
  - "DogRadarHero garde meme interface props (user, dog, streak, checkins, records, exercises, scans, dailyLogs)"
  - "getEmotionalMoment() supprimee (plus appelee apres suppression du bloc emotional moment)"
  - "WellnessBanner supprimee completement (pas juste cachee conditionnellement)"
  - "SmartAlerts remontee en position 2 (apres header, avant TodayCard)"
metrics:
  completed: 2026-03-12
  tasks: 3
  files_modified: 5
---

# Quick Task 2: Refonte premium mobile-first page d'accueil — Summary

**One-liner:** CompactHeader 3-lignes (greeting + dog card 48px + 4 stats avec mini barres) remplace le hero plein-ecran gradient sombre, hierarchie sections reorganisee, style light premium sur BentoGrid/QuickActions/StreakBar.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reecrire DogRadarHero en CompactHeader | dab1a61 | src/components/home/DogRadarHero.jsx |
| 2 | Reorganiser Home.jsx + supprimer WellnessBanner | 5fc792d | src/pages/Home.jsx |
| 3 | Polish BentoGrid + QuickActions + StreakBar | bc53128 | src/components/home/BentoGrid.jsx, QuickActions.jsx, StreakBar.jsx |

## What Was Built

### DogRadarHero — CompactHeader
- Fond `bg-background` (creme) avec `border-b border-border/10` — plus aucun gradient `#0d3d2e`
- Ligne 1: greeting (xs muted) + prenom (bold lg) + cloche avec badge rouge + avatar profil
- Ligne 2: dog card blanche (`rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]`) avec photo 48px ronde, nom/race/poids, statut dynamique colore, mini cercle SVG score global anime
- Ligne 3: 4 stat buttons en flex row — icone coloree + label + score + mini barre de progression animee (framer-motion width)
- `computeArcs()` conservee integralement — les scores alimentent les mini barres
- Props identiques — aucun changement d'interface pour Home.jsx

### Home.jsx — Nouvelle hierarchie
- `WellnessBanner` supprimee (import + 2 occurrences render)
- Bloc "emotional moment" supprime (motion.div + PawMascotInline + getEmotionalMoment)
- `pt-20` conditionnel supprime du wrapper principal
- Imports nettoyis: `PawMascotInline`, `useScroll`, `useTransform` supprimes
- Nouvel ordre sections: CompactHeader > SmartAlerts (px-4) > TodayCard > ActiveProgramCards > QuickActions > StreakBar > DailyCoaching > BentoGrid > TrialExpiryBanner > WeeklyInsightCard > disclaimer texte
- Loading skeleton remplace: `animate-pulse` Tailwind simple a la place du shimmer gradient sombre
- Disclaimer veterinaire en bas: `text-[10px] text-muted-foreground text-center`

### BentoGrid — Light premium
- Tiles blanches (`bg-white border border-border/20 shadow-[0_2px_8px_rgba(0,0,0,0.06)]`)
- Suppression `gradient` et `mascot` du tableau NAV_TILES
- Tache de couleur douce en arriere-plan (`opacity-[0.08]`)
- Icone dans container colore transparent (`iconColor + "15"` bg, `iconColor + "30"` border)
- `whileTap` passe a `scale: 0.98` (etait 0.96)
- Titre de section "Explorer" ajout en `text-xs font-semibold text-muted-foreground`

### QuickActions — Style soft
- Boutons blanc avec ombre douce (`bg-white border border-border/20 shadow-[0_2px_6px_rgba(0,0,0,0.06)]`)
- Icones colorees (style={{ color: action.color }}) — plus de `text-white` sur fond solide
- Suppression `linear-gradient` background et `border` coloree
- Suppression animation pulse ring (motion.div opacity/scale loop)
- Label: `text-foreground/70 font-semibold` (etait `font-bold text-foreground`)

### StreakBar — Card blanche
- Card principale: `background: "white"`, `boxShadow: "0 2px 8px rgba(0,0,0,0.06)"` — suppression du gradient dynamique
- Bordure: `border-border/20` fixe — suppression de `borderColor: level.color + "20"` dynamique
- `whileTap={{ scale: 0.98 }}` ajoute sur la card principale
- Walk streak chip et badge chip: inchanges (deja `bg-blue-50` / `bg-amber-50`)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

### Files exist
- [x] src/components/home/DogRadarHero.jsx — FOUND
- [x] src/pages/Home.jsx — FOUND
- [x] src/components/home/BentoGrid.jsx — FOUND
- [x] src/components/home/QuickActions.jsx — FOUND
- [x] src/components/home/StreakBar.jsx — FOUND

### Commits exist
- [x] dab1a61 — Task 1 DogRadarHero rewrite
- [x] 5fc792d — Task 2 Home.jsx reorganization
- [x] bc53128 — Task 3 BentoGrid/QuickActions/StreakBar polish

### Build
- [x] npm run build EXIT: 0 after each of the 3 tasks

## Self-Check: PASSED
