---
phase: 08-ux-activation
plan: 02
subsystem: home-feed
tags: [ux, ai-visibility, vet-shortcut, dashboard-prominence, home]
dependency_graph:
  requires: []
  provides: [ai-card-home, vet-shortcut-home, dashboard-repositioned]
  affects: [Home.jsx]
tech_stack:
  added: []
  patterns: [gradient-primary card, overflow-x-auto quick actions, custom onClick in action map]
key_files:
  modified:
    - src/pages/Home.jsx
decisions:
  - AI card placed immediately after DailyBriefing (outside the motion.div fold) for maximum first-scroll visibility
  - Dashboard moved before Hero illustration (early in the fold) to surface it before CalendarStrip + DailyProgress
  - Vet button uses custom onClick pattern (qa.onClick ?? navigate(qa.page)) to avoid breaking existing 4 buttons
  - Quick actions container switched from fixed justify-between to overflow-x-auto + min-w for 5-button horizontal scroll
metrics:
  duration_minutes: 8
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
  completed_date: "2026-03-27"
requirements: [FIX-33, FIX-35, FIX-36]
---

# Phase 08 Plan 02: Home AI Visibility + Vet Shortcut + Dashboard Prominence

Home enriched with the IA card (gradient-primary, full-width, above the fold), a Véto quick action (navigate Sante?tab=findvet), and the Dashboard card repositioned before the Hero illustration for earlier discovery.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | AI Chat card + Vet shortcut + Dashboard repositioned | 156f24c | src/pages/Home.jsx |

## What Was Built

**FIX-33 — AI Chat Card:**
- Gradient card (`gradient-primary`) with Sparkles icon inserted immediately after DailyBriefing, outside the below-the-fold motion.div
- Text: "Parle au coach IA" + "Pose une question sur {dog?.name}"
- Navigates to Chat via `createPageUrl("Chat")`
- Added `Sparkles` and `ChevronRight` to lucide-react imports

**FIX-35 — Véto Quick Action:**
- 5th button added to quickActions array (rose gradient, cross SVG icon)
- Uses `onClick: () => navigate(createPageUrl("Sante") + "?tab=findvet")` via custom onClick pattern
- quickActions map updated: `qa.onClick ? qa.onClick() : navigate(createPageUrl(qa.page))`
- Container changed to `overflow-x-auto` with `min-w-[64px] flex-shrink-0` for mobile-safe 5-button layout

**FIX-36 — Dashboard Prominence:**
- Dashboard card block moved from position f (after CalendarStrip + DailyProgress) to position d (after TrialExpiryBanner + FirstDayGuide, before Hero illustration)
- Old duplicate block removed from its former position
- Exactly 1 occurrence of Dashboard access in the file (verified)

**Final feed order:**
1. CoachHomeHeader
2. DailyBriefing
3. AI Coach Card (new — gradient, full-width)
4. [motion.div fold]
   - TrialExpiryBanner
   - FirstDayGuide
   - Dashboard card (repositioned)
   - Hero illustration
   - CalendarStrip
   - DailyProgress
   - Quick Actions (5: Scanner, Balade, Santé, Dressage, Véto)
   - ... rest unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all navigation targets (Chat, Dashboard, Sante?tab=findvet) are live pages.

## Self-Check: PASSED

- `grep "Parle au coach IA"` → 1 occurrence (line 526)
- `grep "findvet"` → 1 occurrence (line 463)
- `grep "Sparkles"` → 2 occurrences (import line 25 + usage line 523)
- `grep "Dashboard access"` → 1 occurrence (line 553, repositioned)
- Commit 156f24c exists in git log
