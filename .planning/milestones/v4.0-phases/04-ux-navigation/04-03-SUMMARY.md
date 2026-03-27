---
phase: 04-ux-navigation
plan: "03"
subsystem: navigation
tags: [bugfix, z-index, bottomnav, sessionStorage, private-browsing]
dependency_graph:
  requires: []
  provides: [NAV-01, NAV-02, NAV-03]
  affects: [ChatFAB, BottomNav, CombinedFAB]
tech_stack:
  added: []
  patterns: [z-index layering, sessionStorage defensive access, secondary page parent mapping]
key_files:
  created: []
  modified:
    - src/components/ChatFAB.jsx
    - src/components/BottomNav.jsx
decisions:
  - "ChatFAB z-index abaisse a z-[41] (approche sans prop) — plus simple que passer fabOpen en prop, fonctionne car backdrop CombinedFAB est a z-[42]"
  - "VetPortal et VetDogView mappes vers Profile dans SECONDARY_PAGE_PARENT — coherent avec l'arborescence (acces depuis Profile)"
  - "sessionStorage dans try/catch silencieux — pas de fallback UI, comportement degrade acceptable (scroll non restaure)"
metrics:
  duration: "~10 min"
  completed: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 04 Plan 03: Navigation Bug Fixes Summary

**One-liner:** 3 bugs navigation corriges — ChatFAB passe a z-[41] sous le backdrop CombinedFAB, VetPortal/VetDogView ajoutent au highlight BottomNav, sessionStorage protege par try/catch contre navigation privee.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | NAV-01 — ChatFAB z-index sous backdrop CombinedFAB | ae49331 | src/components/ChatFAB.jsx |
| 2 | NAV-02+NAV-03 — BottomNav VetPortal/VetDogView + sessionStorage try/catch | 8e85ae5 | src/components/BottomNav.jsx |

## Changes Made

### NAV-01 — ChatFAB z-[41]
- `ChatFAB.jsx` ligne 11 : `z-[45]` → `z-[41]`
- Le backdrop CombinedFAB (z-[42]) couvre maintenant le ChatFAB quand il est ouvert
- ChatFAB reste cliquable au-dessus de la BottomNav (z-40) quand CombinedFAB est ferme

### NAV-02 — VetPortal et VetDogView dans SECONDARY_PAGE_PARENT
- `BottomNav.jsx` : ajout de `VetPortal: "Profile"` et `VetDogView: "Profile"` dans la map
- L'onglet "Profil" est maintenant highlight quand l'utilisateur est sur une page vet

### NAV-03 — sessionStorage protege par try/catch
- `getNavUrl()` : lecture `tab_${page}` dans try/catch
- `useEffect` scroll restore : lecture `scroll_${currentPage}` dans try/catch
- `handleTabClick` : ecriture `scroll_${currentPage}` dans try/catch individuel
- `handleTabClick` : suppressions multiples (`scroll_`, `tab_`, `journey_`, `exercise_`) dans try/catch groupe
- Total : 4 blocs try/catch (>= 3 requis)

## Verifications

```
V1: grep -n "z-\[41\]" ChatFAB.jsx         → ligne 11 ✓
V2: grep -c "z-\[45\]" ChatFAB.jsx         → 0 ✓
V3: grep -n "VetPortal" BottomNav.jsx       → ligne 21 ✓
V4: grep -n "VetDogView" BottomNav.jsx      → ligne 22 ✓
V5: grep -c "try {" BottomNav.jsx           → 4 (>= 3) ✓
```

## Deviations from Plan

None - plan execute exactement comme ecrit.

## Known Stubs

None.

## Self-Check: PASSED

- `src/components/ChatFAB.jsx` — existe, z-[41] confirme
- `src/components/BottomNav.jsx` — existe, VetPortal/VetDogView confirmes, 4 try blocks confirmes
- Commits `ae49331` et `8e85ae5` — existent dans git log
