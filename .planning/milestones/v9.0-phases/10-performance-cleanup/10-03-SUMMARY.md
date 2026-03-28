---
phase: 10-performance-cleanup
plan: "03"
subsystem: frontend/pages
tags: [refactor, useReducer, state-management, boilerplate-removal]
dependency_graph:
  requires: [10-02]
  provides: [Nutri-useReducer]
  affects: [src/pages/Nutri.jsx]
tech_stack:
  added: []
  patterns: [useReducer, typed-action-dispatch]
key_files:
  created: []
  modified:
    - src/pages/Nutri.jsx
decisions:
  - "dogDataState ne migre pas vers useReducer : inline setDogDataState suffit, cout/benefice trop faible pour un seul plan"
  - "Functional updates (prev =>) conserves dans le reducer via typeof payload === function pour SET_MESSAGES et SET_BOOKMARKED"
metrics:
  duration: "~8 min"
  completed: "2026-03-28T00:01:33Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 10 Plan 03: Nutri.jsx useReducer Migration Summary

**One-liner:** Suppression de 19 shorthand setters boilerplate dans Nutri.jsx — coachState migre vers useReducer avec 9 actions typees, dogDataState setters remplaces par setDogDataState inline.

## What Was Done

### Task 1: Migrer coachState vers useReducer

**coachState (9 setters supprimes, useReducer introduit) :**
- Ajout `COACH_INITIAL_STATE` et `coachReducer` (10 cases dont RESET_COACH) avant le composant
- Remplacement `useState(coachState)` par `useReducer(coachReducer, COACH_INITIAL_STATE)`
- Suppression des 9 shorthand setters : setMessages, setInput, setLoading, setMessagesRemaining, setBookmarked, setIsStreaming, setStreamingText, setShowScrollBtn, setLastFailedInput
- 24 callsites `dispatchCoach({ type, payload })` dans startStreaming, handleBookmark, sendMessage, scrollToBottom, onSwitchToCoach, onChange textarea

**dogDataState (10 setters supprimes, inline) :**
- Suppression des 10 shorthand setters : setDog, setUser, setRecentScans, setDietPrefs, setCheckins, setHealthRecords, setDailyLogs, setActivePlan, setMonthlyPlanCount, setAllPlans
- Remplacement par `setDogDataState(p => ({ ...p, field: value }))` inline a tous les callsites dans init(), refreshPlans(), refreshDietPrefs(), useEffect CACHE-04

## Verification

| Check | Resultat | Attendu |
|-------|----------|---------|
| `grep -c "useReducer" Nutri.jsx` | 2 (1 import + 1 appel) | 1 appel |
| `grep -c "coachReducer" Nutri.jsx` | 2 (definition + usage) | 2 |
| `grep -c "dispatchCoach" Nutri.jsx` | 24 | >= 9 |
| `grep -c "const set" Nutri.jsx` | 0 | 0 |
| Types d'actions distincts | 9 (SET_MESSAGES, SET_INPUT, SET_LOADING, SET_MESSAGES_REMAINING, SET_BOOKMARKED, SET_STREAMING, SET_STREAMING_TEXT, SET_SHOW_SCROLL_BTN, SET_LAST_FAILED_INPUT) | 9 |
| git diff stat | 71 insertions, 74 suppressions | ~80-100 lignes |

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 — Migrer coachState useReducer | `040a9c4` | refactor(10-03): migrate coachState to useReducer, remove 19 shorthand setters |

## Deviations from Plan

None — plan execute exactement comme ecrit.

Note : le plan mentionnait "18 shorthand setters" dans l'objectif mais listait 9 pour coachState + 10 pour dogDataState = 19 au total. La suppression reelle est de 19 setters (compte exact du code).

## Known Stubs

Aucun stub introduce par cette tache. La logique metier est identique — uniquement le mecanisme de mise a jour d'etat a change.

## Self-Check: PASSED

- FOUND: src/pages/Nutri.jsx
- FOUND: .planning/phases/10-performance-cleanup/10-03-SUMMARY.md
- FOUND: commit 040a9c4
