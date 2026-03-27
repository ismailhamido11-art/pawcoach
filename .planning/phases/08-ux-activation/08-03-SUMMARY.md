---
phase: 08-ux-activation
plan: "03"
subsystem: UI / UX signals
tags: [tab-navigation, gradient, chat, messages, ux, transparency]
dependency_graph:
  requires: []
  provides: [FIX-34, FIX-38]
  affects: [Sante.jsx, Nutri.jsx, Activite.jsx, Chat.jsx]
tech_stack:
  added: []
  patterns: [CSS gradient overlay absolute positioning, conditional render on activeTab]
key_files:
  created: []
  modified:
    - src/pages/Sante.jsx
    - src/pages/Nutri.jsx
    - src/pages/Activite.jsx
    - src/pages/Chat.jsx
decisions:
  - "Gradient overlay is conditional: hidden when last tab is active to avoid masking it"
  - "Activite uses w-8 gradient (4 tabs, less crowded); Sante/Nutri use w-12 (5 tabs)"
  - "Secondary Chat input-area counter also updated to match header wording for consistency"
metrics:
  duration: "~8 minutes"
  completed: "2026-03-27T23:20:50Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 08 Plan 03: Tab Gradient Edge + Chat Counter Transparency Summary

**One-liner:** Gradient fade-to-forest overlay on 5-tab bars (Sante/Nutri) and 4-tab bar (Activite) signals hidden content on small screens; Chat header now shows "X messages restants aujourd'hui" with amber alert at <= 2 remaining.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Gradient edge on tab bars (FIX-34) | e267150 | Sante.jsx, Nutri.jsx, Activite.jsx |
| 2 | Chat message counter wording (FIX-38) | 96c19cb | Chat.jsx |

## What Was Built

### Task 1: Gradient Edge on Tab Bars

Each tab bar (Sante, Nutri, Activite) now has a `<div className="relative">` wrapper around the grid. A child div with `absolute top-0 right-0 h-full pointer-events-none` overlays a `linear-gradient(to right, transparent, rgba(26,77,62,0.4))` on the right edge.

The overlay is **conditional**: it only renders when `activeTab !== TABS[TABS.length - 1].id`. When the user is on the last tab, the gradient disappears — no visual masking of the active tab.

- Sante (5 tabs, last: `findvet`): w-12 gradient
- Nutri (5 tabs, last: `prefs`): w-12 gradient
- Activite (4 tabs, last: `dressage`): w-8 gradient (less crowded)

### Task 2: Chat Message Counter Wording

Header badge updated from `{X} credits IA` to `{X} messages restants aujourd'hui`.

Additional improvements:
- Badge class conditionally switches to `bg-amber-400/30 border border-amber-300/40` when `messagesRemaining <= 2` (proactive visual alert before limit hits)
- When `messagesRemaining === 0`: shows "Limite atteinte · Réessaie demain" instead of "0 messages"
- Secondary counter near input area also aligned to new wording for consistency
- `quota_exceeded` toast already present (2 occurrences in Chat.jsx from Phase 7) — no change needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Consistency] Secondary Chat counter also updated**
- **Found during:** Task 2
- **Issue:** Line 605 had a second `messagesRemaining` badge near the input area still using "credits restants" wording
- **Fix:** Updated to "messages restants aujourd'hui" to match header and avoid user confusion
- **Files modified:** src/pages/Chat.jsx
- **Commit:** 96c19cb

Otherwise, plan executed exactly as written.

## Verification

```
grep rgba(26,77,62,0.4) src/pages/Sante.jsx    → 1 match
grep rgba(26,77,62,0.4) src/pages/Nutri.jsx    → 1 match
grep rgba(26,77,62,0.4) src/pages/Activite.jsx → 1 match
grep "aujourd" src/pages/Chat.jsx              → 3 matches (header + secondary counter + existing message)
grep quota_exceeded src/pages/Chat.jsx         → 2 matches (already present from Phase 7)
```

## Known Stubs

None — all changes are functional UI wording and overlay CSS.

## Self-Check: PASSED

- [x] Sante.jsx gradient div present at line 215-216
- [x] Nutri.jsx gradient div present at line 506-507
- [x] Activite.jsx gradient div present at line 167-168
- [x] Chat.jsx "aujourd'hui" at lines 380 and 605
- [x] Commits e267150 and 96c19cb exist on main
- [x] Pushed to GitHub (074b51f)
