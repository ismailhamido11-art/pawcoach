---
phase: 07-security
plan: "02"
subsystem: backend-security
tags: [ssrf-prevention, url-validation, allowlist, deno-functions]
dependency_graph:
  requires: ["07-01"]
  provides: ["SEC-03", "SEC-04"]
  affects: [finalDiagnosis, preDiagnosis, processHealthInput, analyzeGrowthPhoto]
tech_stack:
  added: []
  patterns: ["validateImageUrl helper inline per Deno function", "allowedHosts allowlist pattern", "silent ignore vs 400 based on URL optionality"]
key_files:
  created: []
  modified:
    - pawcoach/functions/finalDiagnosis.ts
    - pawcoach/functions/preDiagnosis.ts
    - pawcoach/functions/processHealthInput.ts
    - pawcoach/functions/analyzeGrowthPhoto.ts
decisions:
  - "validateImageUrl inline per function (not shared module) — consistent with Phase 07-01 sanitize pattern: Deno functions deploy independently"
  - "processHealthInput images silently ignored (not 400) — imageUrl and lastMsg.image_url are optional, degraded gracefully"
  - "finalDiagnosis and preDiagnosis return 400 on invalid URL — image_url is explicit user input that should be rejected if invalid"
  - "analyzeGrowthPhoto returns 400 on invalid URL — photoUrl is a required field (already validated for presence), must be valid"
metrics:
  duration: "6 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 4
---

# Phase 07 Plan 02: SEC-03 + SEC-04 Security Fixes Summary

**One-liner:** SSRF prevention via validateImageUrl allowlist (base44.app, amazonaws.com, s3.amazonaws.com) applied to 4 AI backend Deno functions, SEC-04 confirmed clean by grep audit.

## Tasks Completed

| Task | Name | Commit | Result |
|------|------|--------|--------|
| 1 | SEC-04 audit — confirm absence of raw HTML rendering | n/a (audit only) | PASSED — 0 occurrences |
| 2 | SEC-03 fix — URL validation in 4 backend functions | 87a6df5 | 4 files corrected |

## SEC-04: Raw HTML Audit

Command run: grep for innerHTML and eval patterns in src/ JSX/JS files excluding ui/ and node_modules.

Result: **0 occurrences** outside shadcn/ui components.

The only usage of raw HTML rendering in the codebase is in the shadcn/ui chart component (CSS styles only, no user content). SEC-04 is **satisfied**.

## SEC-03: URL Validation Applied

### Pattern applied (validateImageUrl helper)

```typescript
const validateImageUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const allowedHosts = ['base44.app', 'amazonaws.com', 's3.amazonaws.com'];
    if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) return null;
    return url;
  } catch {
    return null;
  }
};
```

### Per-file changes

**finalDiagnosis.ts:**
- Added `validateImageUrl` helper after `sanitize`
- `const safeImageUrl = validateImageUrl(image_url)` + guard: if `image_url && !safeImageUrl` return 400
- `const fileUrls = safeImageUrl ? [safeImageUrl] : undefined` (was raw `image_url`)
- Prompt reference updated from `image_url` to `safeImageUrl`

**preDiagnosis.ts:**
- Same modification as finalDiagnosis.ts (identical structure, same `image_url` variable)
- Returns 400 on invalid `image_url`
- `fileUrls` and prompt use `safeImageUrl`

**processHealthInput.ts:**
- Added `validateImageUrl` helper after `sanitize`
- `const safeImageUrl = validateImageUrl(imageUrl)` — no 400 (imageUrl is optional)
- `const safeLastImageUrl = validateImageUrl(lastMsg?.image_url)` — no 400 (optional)
- `fileUrls.push(safeImageUrl)` replaces raw push
- `fileUrls.push(safeLastImageUrl)` replaces raw push from lastMsg

**analyzeGrowthPhoto.ts:**
- Added typed `validateImageUrl` helper (TypeScript types preserved for this file)
- `const safePhotoUrl = validateImageUrl(photoUrl)` + guard: if `!safePhotoUrl` return 400
- `file_urls: [safePhotoUrl]` (was `[photoUrl]`)

### Verification

```
grep -n "allowedHosts|validateImageUrl|safeImageUrl|safePhotoUrl" <4 files> | wc -l
-> 26 (all 4 files have multiple occurrences)
```

No raw `image_url`, `imageUrl`, or `photoUrl` used directly in fileUrls or file_urls in any of the 4 files.

## Build Verification

The backend `.ts` files in `functions/` are Deno runtime files — not compiled by Vite. The modifications do not touch any frontend code. Syntax verified by manual review of all modified files.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] 4 files modified with validateImageUrl pattern
- [x] Commit 87a6df5 exists: fix(07-02): SEC-03 — add URL allowlist validation to 4 AI backend functions
- [x] 67 insertions across 4 files
- [x] No raw image URLs reach fileUrls/file_urls (verified by grep)
- [x] SEC-04 confirmed clean (0 occurrences in non-shadcn code)
- [x] SEC-03 satisfied across all 4 functions
