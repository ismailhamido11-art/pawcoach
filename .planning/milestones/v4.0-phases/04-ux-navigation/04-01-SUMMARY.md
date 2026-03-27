---
phase: 04-ux-navigation
plan: 01
subsystem: nutrition, health-tracking, profile, library
tags: [ux-bug, diet-preferences, health-record, logout, confirm-dialog]
dependency_graph:
  requires: []
  provides: [UX-01, UX-02, UX-05, UX-06]
  affects: [Nutri, CombinedFAB, SettingsSection, Library]
tech_stack:
  added: []
  patterns: [callback-prop, optimistic-re-fetch, confirmation-dialog]
key_files:
  created: []
  modified:
    - src/components/nutrition/DietPreferencesPanel.jsx
    - src/pages/Nutri.jsx
    - src/components/CombinedFAB.jsx
    - src/components/profile/SettingsSection.jsx
    - src/pages/Library.jsx
decisions:
  - "Logout dialog uses standard foreground styling (not red) — logout is reversible, unlike account deletion"
  - "HealthRecord create failure is isolated in try/catch — DailyLog save must never be blocked by a secondary write"
  - "refreshDietPrefs re-fetches from API (not from DietPreferencesPanel internal state) to guarantee Nutri.jsx state is canonical"
metrics:
  duration: "~8 min"
  completed: "2026-03-27T02:59:41Z"
  tasks_completed: 3
  files_modified: 5
---

# Phase 04 Plan 01: UX Bugs — Diet Prefs Stale, FAB Weight Desync, Logout + Delete Confirmations Summary

**One-liner:** Fixed 4 independent UX regressions — diet prefs re-fetch on save, weight FAB now writes HealthRecord for Sante/Growth, logout and NutritionPlan delete both require user confirmation.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | UX-01 — DietPreferencesPanel callback + Nutri re-fetch | 7ec0167 | DietPreferencesPanel.jsx, Nutri.jsx |
| 2 | UX-02 — CombinedFAB creates HealthRecord on weight log | 2bbc965 | CombinedFAB.jsx |
| 3 | UX-05/UX-06 — Confirmation logout + suppression NutritionPlan | 42d3755 | SettingsSection.jsx, Library.jsx |

## What Was Built

### UX-01: Diet preferences re-fetch after save
- `DietPreferencesPanel` now accepts `onPreferencesSaved` prop and calls it after `setSaved(true)` on successful save
- `Nutri.jsx` adds `refreshDietPrefs()` function that re-fetches `DietPreferences` entity and updates `dietPrefs` state
- `DietPreferencesPanel` in Nutri's JSX now receives `onPreferencesSaved={refreshDietPrefs}`
- Result: saving preferences immediately reflects in the parent Nutri page without a full page reload

### UX-02: CombinedFAB weight sync with Sante/Growth
- Added `HealthRecord` to CombinedFAB's entity imports
- After successful `DailyLog.update/create`, creates a `HealthRecord` with `type="weight"`, `title="Pesée"`, same `date` and `value` as the DailyLog payload
- Wrapped in isolated `try/catch` with `console.warn` — HealthRecord failure never blocks DailyLog save
- Result: weights logged via FAB are now visible in Sante/Growth chart

### UX-05: Logout confirmation dialog
- Added `showLogoutConfirm` state to `SettingsSection`
- Logout button now calls `setShowLogoutConfirm(true)` instead of direct `base44.auth.logout()`
- Dialog: `bg-white rounded-3xl`, `LogOut` icon in `bg-slate-100` container, "Se deconnecter ?" title, "Annuler" and "Se deconnecter" buttons
- Styled like the existing delete account confirm (same layout pattern, not red — logout is reversible)

### UX-06: NutritionPlan delete confirmation
- Added `window.confirm("Supprimer ce plan nutrition ?")` at the top of `handleDeleteNutritionPlan`
- Same pattern as `handleDelete` (Bookmark) and `handleDeleteScan` (FoodScan) — now consistent across all 3 delete handlers

## Verification Results

All 5 plan checks passed:
1. `onPreferencesSaved` in DietPreferencesPanel.jsx — 2 matches (prop + call)
2. `onPreferencesSaved` / `refreshDietPrefs` in Nutri.jsx — 3 matches
3. `HealthRecord` in CombinedFAB.jsx — 4 matches (import + comment + create + warn)
4. `showLogoutConfirm` in SettingsSection.jsx — 3 matches (state + open + close)
5. `window.confirm` count in Library.jsx — 3 (Bookmark + NutritionPlan + FoodScan)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 4 fixes are fully wired with real data and real entity operations.

## Self-Check: PASSED

Files exist:
- src/components/nutrition/DietPreferencesPanel.jsx — modified, verified grep
- src/pages/Nutri.jsx — modified, verified grep
- src/components/CombinedFAB.jsx — modified, verified grep
- src/components/profile/SettingsSection.jsx — modified, verified grep
- src/pages/Library.jsx — modified, verified grep

Commits exist:
- 7ec0167 — feat(04-01): UX-01
- 2bbc965 — feat(04-01): UX-02
- 42d3755 — feat(04-01): UX-05/UX-06
