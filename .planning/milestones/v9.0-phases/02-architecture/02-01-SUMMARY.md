---
phase: 02-architecture
plan: 01
subsystem: audit
tags: [app-blueprint, architecture, benchmark]
requires: [SOCLE-01, SOCLE-02]
provides: [ARCH-01-fixed, ARCH-02-fixed, ARCH-03-fixed]
affects: [phase-5-synthese]
key-files:
  created:
    - .planning/phases/02-architecture/APP-BLUEPRINT-REPORT.md
metrics:
  duration: "~5 min"
  completed: "2026-03-27"
  tasks: 1
  files: 1
---

# Phase 02 Architecture — Summary

**One-liner:** App blueprint compare a Woofz/Noom/Duolingo — onboarding trop long, IA Chat cachee, paywall reactif, Home God Component.

## Key Findings

### Navigation
- 5 onglets OK mais 14 sous-onglets noient les features
- IA Chat (differenciateur) cachee derriere FAB au lieu d'etre onglet

### Onboarding
- 10 etapes avant contenu (Duolingo: 2, Calm: 3)
- Aucune valeur montree pendant le flow
- Gap le plus couteux en activation

### Retention
- Streak + 12 badges existent
- MANQUE: push notifications (backend pret, 0 cote client), progression visible, contenu quotidien, composante sociale
- D7 retention estimee < 15% sans push

### Feature Map
- ~80% parite avec Woofz
- MANQUE: logging repas, videos dressage, album photo, contenu breed-specific

### Paywall
- Placement reactif (apres limite) au lieu de proactif (apres premier succes)
- 1 seul temoignage, pas de prix par jour

### Architecture
- Home.jsx = God Component (11 entities, 15+ imports)
- Chaque page re-fetch dogs independamment
- Pas de cache partagee au-dela de HomeCacheContext

## Top 3 Actions
1. Push notifications (critique retention)
2. Raccourcir onboarding a 5 etapes + valeur pendant le flow
3. Soft paywall apres premier succes

## Self-Check: PASSED
- [x] App blueprint report written
- [x] Benchmarks vs 5 apps de reference
- [x] 3 ARCH requirements addressed
