---
phase: "01"
plan: "pwa"
type: "auto"
autonomous: true
---

# Phase 01 - Plan PWA : Service Worker et Manifest

## Objectif

Rendre PawCoach installable comme PWA sur iOS et Android — manifest.json complet et service worker minimal avec stratégie cache-first pour les assets statiques.

## Contexte

- `index.html` avait déjà `<link rel="manifest" href="/manifest.json" />` et `<meta name="theme-color" content="#1A4D3E" />`
- `src/main.jsx` avait déjà le code d'enregistrement SW
- Le dossier `public/` n'existait pas — créé dans ce plan

## Tâches

### Tâche 1 — manifest.json (PWA-01)
- Créer `public/manifest.json`
- Champs : name, short_name, start_url, display:standalone, background_color, theme_color, orientation, lang, scope, categories, icons
- Icons : SVG 192x192 et 512x512 (paw print forest green)

### Tâche 2 — service worker (PWA-02)
- Créer `public/sw.js`
- Install : pre-cache shell minimal (`/`, `/manifest.json`)
- Activate : purge des anciens caches
- Fetch : cache-first pour assets statiques (JS, CSS, images, fonts, SVG)
- Passthrough réseau pour API/fonctions Base44 et HTML navigation

### Tâche 3 — Icônes PWA
- Créer `public/icons/icon-192.svg` (192x192, paw print, fond #1A4D3E, texte #F5F0E8)
- Créer `public/icons/icon-512.svg` (512x512, même design)

## Critères de succès

- [ ] `public/manifest.json` valide (champs requis présents)
- [ ] `public/sw.js` s'enregistre sans erreur
- [ ] Icônes SVG 192x192 et 512x512 accessibles
- [ ] index.html déjà pret (link rel=manifest existant)
- [ ] main.jsx déjà pret (SW register existant)
