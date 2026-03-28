---
phase: 09-visual-polish
plan: "04"
subsystem: pwa-compliance
tags: [pwa, icons, profile, settings, cleanup]
dependency_graph:
  requires: []
  provides: [pwa-png-icons, apple-touch-icon, clean-profile, version-9.0]
  affects: [manifest.json, index.html, Profile.jsx, SettingsSection.jsx]
tech_stack:
  added: []
  patterns: [png-from-node-zlib, dead-import-removal]
key_files:
  created:
    - public/icons/icon-192.png
    - public/icons/icon-512.png
    - public/icons/apple-touch-icon.png
  modified:
    - public/manifest.json
    - index.html
    - src/pages/Profile.jsx
    - src/components/profile/SettingsSection.jsx
decisions:
  - "FIX-56 skipped for Dashboard.jsx and Premium.jsx: color prop used as inline style hex in StatCard and nextSteps; converting requires restructuring both data objects and JSX component — risk exceeds value"
  - "PNG generation via pure Node.js zlib (no sharp, no canvas) — portable, zero extra dependencies"
metrics:
  duration: ~8min
  completed: "2026-03-28"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
---

# Phase 09 Plan 04: PWA Compliance + Profile Cleanup Summary

One-liner: PNG icons for Android/iOS PWA compliance, dead ReferralSection import removed, version bumped to 9.0.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | PNG icons PWA (FIX-52, FIX-53) | 286399b | public/icons/icon-192.png, icon-512.png, apple-touch-icon.png, manifest.json, index.html |
| 2 | Dead import + version + hex colors (FIX-54, FIX-55, FIX-56) | 1d9a41e | src/pages/Profile.jsx, src/components/profile/SettingsSection.jsx |

## What Was Done

### FIX-52 — PNG icons in manifest.json
Generated `icon-192.png` (192x192) and `icon-512.png` (512x512) using pure Node.js with `zlib.deflateSync`. The PNG renders the same paw design as the SVG: forest green `#1A4D3E` background with rounded corners and cream `#F5F0E8` paw ellipses. Both entries added to `manifest.json` alongside the existing SVG entries for maximum compatibility.

### FIX-53 — apple-touch-icon PNG
Generated `apple-touch-icon.png` (180x180) using the same approach. Updated `index.html`:
- Line 5: `<link rel="icon" type="image/jpeg" href="/mascot/paw-happy.jpg" />` → `<link rel="icon" type="image/png" href="/icons/icon-192.png" />`
- Line 19: `<link rel="apple-touch-icon" href="/mascot/paw-happy.jpg" />` → `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`

### FIX-54 — ReferralSection dead import
Removed from `Profile.jsx`:
- Import line 17: `import ReferralSection from "../components/profile/ReferralSection.jsx";`
- Usage block around line 225-227: the `<ReferralSection user={user} onSave={handleSaveUser} />` motion.div wrapper
The `ReferralSection.jsx` file itself was not deleted (out of scope).

### FIX-55 — Version string
`SettingsSection.jsx` line 137: `"Version 1.0.0"` → `"Version 9.0"`. Simple text swap, no dynamic logic added.

### FIX-56 — Hex hardcodes (SKIPPED — documented below)

## Deviations from Plan

### Skipped Issue (FIX-56 — Dashboard.jsx and Premium.jsx)

**Found during:** Task 2 pre-analysis

**Issue:** `color` prop in Dashboard.jsx `StatCard` and `nextSteps` data objects is used as a hex value in `style={{ color: item.color }}` and `style={{ backgroundColor: \`${color}18\` }}`. Converting to Tailwind classes requires:
1. Renaming `color` → `colorClass` in all data objects
2. Adapting `StatCard` component (line 30-31) and the nextSteps render block (lines 426-427) to use `className` instead of `style`

Same pattern in Premium.jsx with `IconBadge`.

**Decision:** Skipped per plan guidance ("Si le changement implique une restructuration du JSX, SKIP FIX-56 [...] trop risque"). The hex values are semantically correct (#8b5cf6, #ec4899, #3b82f6); they only need changing if the design system tokens change.

**Impact:** Minimal. These hex values are isolated to 2 files, used consistently, and not causing any bugs.

## Verification Results

| Check | Expected | Result |
|-------|----------|--------|
| `ls public/icons/` | 3 PNG files | icon-192.png, icon-512.png, apple-touch-icon.png |
| `grep "image/png" manifest.json \| wc -l` | 2 | 2 |
| `grep "apple-touch-icon.png" index.html \| wc -l` | 1 | 1 |
| `grep "ReferralSection" Profile.jsx \| wc -l` | 0 | 0 |
| `grep "1\.0\.0" SettingsSection.jsx \| wc -l` | 0 | 0 |
| `grep "Version" SettingsSection.jsx` | "Version 9.0" | "Version 9.0" |

## Known Stubs

None. All changes are complete and functional.

## Self-Check: PASSED
