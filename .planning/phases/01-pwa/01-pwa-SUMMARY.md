---
phase: "01"
plan: "pwa"
subsystem: "pwa"
tags: ["pwa", "manifest", "service-worker", "offline", "installable"]
dependency_graph:
  requires: []
  provides: ["pwa-installable", "sw-cache-first", "manifest-json"]
  affects: ["index.html", "main.jsx"]
tech_stack:
  added: ["service-worker-api", "web-app-manifest"]
  patterns: ["cache-first", "network-passthrough", "skipWaiting+clients.claim"]
key_files:
  created:
    - "public/manifest.json"
    - "public/sw.js"
    - "public/icons/icon-192.svg"
    - "public/icons/icon-512.svg"
  modified: []
decisions:
  - "Icônes SVG plutôt que PNG — pas d'images source disponibles, SVG universellement supporté pour PWA"
  - "Cache-first uniquement pour /assets/, /icons/, /mascot/ et extensions statiques — évite de cacher les appels API Base44"
  - "skipWaiting + clients.claim pour activation immédiate sans reload"
metrics:
  duration: "~5 min"
  completed: "2026-03-27"
  tasks_completed: 3
  files_created: 4
  files_modified: 0
---

# Phase 01 Plan PWA : Manifest + Service Worker Summary

**One-liner :** PWA installable avec manifest standalone (forest green) et SW cache-first pour assets statiques, passthrough API.

## Ce qui a été fait

### Tâche 1 — manifest.json
`public/manifest.json` créé avec tous les champs requis :
- `name: "PawCoach"`, `short_name: "PawCoach"`
- `start_url: "/"`, `display: "standalone"`
- `background_color: "#F5F0E8"`, `theme_color: "#1A4D3E"`
- `lang: "fr"`, `orientation: "portrait"`
- 2 icônes SVG (192x192, 512x512) avec `purpose: "any maskable"`

### Tâche 2 — service worker
`public/sw.js` avec 3 événements :
- **install** : pre-cache `/` et `/manifest.json`, `skipWaiting()`
- **activate** : purge caches obsolètes, `clients.claim()`
- **fetch** : cache-first pour assets statiques (`/assets/`, `/icons/`, `/mascot/`, extensions `.js/.css/.png/.jpg/.svg/.ico/.woff`), passthrough pour API et navigation HTML

### Tâche 3 — Icônes PWA
SVG paw print aux couleurs du design system (fond `#1A4D3E`, pads `#F5F0E8`).

## Vérifications

- `index.html` avait déjà `<link rel="manifest" href="/manifest.json" />` — aucune modification nécessaire
- `main.jsx` avait déjà le code `navigator.serviceWorker.register('/sw.js')` — aucune modification nécessaire
- `public/` n'existait pas — créé

## Commit

- `6417131` — `feat(01-pwa): add manifest.json and service worker`

## Déviations du plan

Aucune — plan exécuté exactement.

## Stubs connus

Aucun stub. Les icônes SVG sont fonctionnelles (pas de placeholder texte). Le manifest est complet.

## Self-Check: PASSED

- [x] `public/manifest.json` existe
- [x] `public/sw.js` existe
- [x] `public/icons/icon-192.svg` existe
- [x] `public/icons/icon-512.svg` existe
- [x] Commit `6417131` vérifié via `git log`
