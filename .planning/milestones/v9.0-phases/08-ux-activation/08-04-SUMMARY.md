---
phase: 08-ux-activation
plan: "04"
subsystem: pwa-ux
tags: [pwa, offline, service-worker, stripe, loading-state]
dependency_graph:
  requires: []
  provides: [offline-banner, sw-update-toast, stripe-portal-loading]
  affects: [Layout.jsx, main.jsx, public/sw.js, SubscriptionSection.jsx, App.jsx]
tech_stack:
  added: []
  patterns: [online/offline events, SW message listener, toast action, loading guard]
key_files:
  created: []
  modified:
    - src/Layout.jsx
    - src/main.jsx
    - public/sw.js
    - src/components/profile/SubscriptionSection.jsx
    - src/App.jsx
decisions:
  - Toaster global ajouté dans App.jsx (manquant — toast SW aurait été silencieux sans)
  - sw.js skipWaiting déplacé du install event vers message listener pour update non-destructif
  - Offline banner en z-[100] spring animation pour ne pas bloquer le contenu
metrics:
  duration: "~15 minutes"
  completed: "2026-03-27T23:21:02Z"
  tasks_completed: 2
  files_modified: 5
---

# Phase 08 Plan 04: PWA Completeness — Offline banner, SW update toast, Stripe loading

**One-liner:** Offline banner global spring-animated dans Layout, SW update toast non-destructif via postMessage/SKIP_WAITING, spinner anti-double-clic sur le portail Stripe.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Offline banner dans Layout.jsx (FIX-39) | 36dcd83 | src/Layout.jsx |
| 2 | SW update toast + Stripe loading (FIX-40, FIX-41) | 074b51f | src/main.jsx, public/sw.js, src/components/profile/SubscriptionSection.jsx, src/App.jsx |

## What Was Built

### Task 1: Offline Banner (FIX-39)

`src/Layout.jsx` — Le composant global Layout détecte maintenant l'état réseau en temps réel via `addEventListener("offline")` / `addEventListener("online")`. Un bandeau fixe `z-[100]` s'anime depuis le haut (spring stiffness 400, damping 30) quand `navigator.onLine === false`. L'état initial est correctement capturé si l'app est déjà chargée en mode offline. `role="status" aria-live="polite"` pour l'accessibilité.

### Task 2: SW Update Toast (FIX-40)

- `public/sw.js` : `self.skipWaiting()` supprimé du `install` event. Un `message` listener détecte `{ type: 'SKIP_WAITING' }` et déclenche la mise à jour uniquement sur consentement utilisateur.
- `src/main.jsx` : Détection SW update via `updatefound` + `statechange`. Toast Sonner persistent avec action "Recharger" — envoie `postMessage({ type: 'SKIP_WAITING' })` puis `window.location.reload()` sur `controllerchange`.

### Task 2: Stripe Portal Loading (FIX-41)

`src/components/profile/SubscriptionSection.jsx` — `isLoadingPortal` state avec garde contre double-clic (`if (isLoadingPortal) return`). Bouton `disabled` pendant le chargement, affiche `<Loader2 className="animate-spin" />` + "Chargement...". `finally` remet `isLoadingPortal(false)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Toaster manquant dans App.jsx**
- **Found during:** Task 2 — vérification pré-implémentation de main.jsx
- **Issue:** `toast()` de Sonner importé dans main.jsx ne s'affiche jamais si `<Toaster />` n'est pas rendu dans le DOM. App.jsx n'avait aucun Toaster.
- **Fix:** Ajout de `<Toaster position="bottom-center" richColors />` dans le fragment racine de `App()`, en dehors du Router pour garantir sa présence sur toutes les routes.
- **Files modified:** src/App.jsx
- **Commit:** 074b51f

## Verification Results

1. `grep "isOffline\|hors ligne\|WifiOff" src/Layout.jsx` — 5 occurrences (useState, useEffect, JSX)
2. `grep "Nouvelle version\|SKIP_WAITING\|promptUpdate" src/main.jsx` — 5 occurrences
3. `grep "SKIP_WAITING" public/sw.js` — présent dans message listener (ligne 36)
4. `self.skipWaiting()` dans sw.js — uniquement en commentaire dans install + call réel dans message listener
5. `grep "isLoadingPortal\|Loader2" src/components/profile/SubscriptionSection.jsx` — 6 occurrences

## Known Stubs

None.

## Self-Check: PASSED
