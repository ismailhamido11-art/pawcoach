---
phase: 06-legal-security
plan: 04
subsystem: security
tags: [csp, input-validation, xss, prompt-injection, backend, fix-09, fix-10]
dependency_graph:
  requires: []
  provides: [csp-header, input-length-validation]
  affects: [index.html, pawcoachChat, preDiagnosis, processHealthInput]
tech_stack:
  added: []
  patterns: [meta-csp, explicit-reject-pattern, defense-in-depth]
key_files:
  created: []
  modified:
    - index.html
    - base44/functions/pawcoachChat/entry.ts
    - base44/functions/preDiagnosis/entry.ts
    - base44/functions/processHealthInput/entry.ts
decisions:
  - CSP via meta tag rather than HTTP header (Base44 does not expose response header config)
  - Input validation placed BEFORE sanitize() so reject fires before any truncation or LLM call
  - Messages array in processHealthInput also validated to cover multi-turn health coaching flow
metrics:
  duration: 8min
  completed: "2026-03-27"
  tasks_total: 2
  tasks_completed: 2
  files_modified: 4
---

# Phase 06 Plan 04: CSP + Input Validation Summary

CSP meta tag added to index.html covering Base44, Stripe, and SW; explicit HTTP 400 rejection added in 3 AI backend functions when any user input exceeds 2000 characters, layered on top of existing sanitize() helpers.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | CSP meta tag dans index.html | 5932db0 | index.html |
| 2 | Validation input longueur dans 3 fonctions backend | e090235 | pawcoachChat/entry.ts, preDiagnosis/entry.ts, processHealthInput/entry.ts |

## What Was Built

### Task 1 — FIX-09: Content Security Policy

Inserted a `<meta http-equiv="Content-Security-Policy">` tag in `index.html` after the viewport meta, covering:

- `default-src 'self'`
- `script-src 'self' https://js.stripe.com https://api.base44.com`
- `style-src 'self' 'unsafe-inline'` (required for Tailwind JIT inline styles)
- `img-src 'self' data: blob: https:` (Base44 uploads + AWS S3)
- `font-src 'self' data:`
- `connect-src 'self' https://api.base44.com https://api.stripe.com https://checkout.stripe.com wss://api.base44.com`
- `frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com`
- `worker-src 'self' blob:` (service worker)
- `object-src 'none'`
- `base-uri 'self'`

### Task 2 — FIX-10: Input Length Validation

Three Deno backend functions now reject HTTP 400 before calling the LLM if inputs exceed 2000 characters:

- **pawcoachChat**: `MAX_MSG_LENGTH = 2000` — iterates rawMessages array, rejects any user message exceeding the limit
- **preDiagnosis**: `MAX_INPUT_LENGTH = 2000` — rejects if `symptoms` or `additional_info` exceeds limit
- **processHealthInput**: `MAX_INPUT_LENGTH = 2000` — rejects if `text` exceeds limit, also iterates `messages` array for multi-turn validation

Existing `sanitize()` helpers remain as second line of defense (truncate + strip HTML tags).

## Decisions Made

1. **CSP via meta tag**: Base44 does not expose HTTP response header configuration, so meta tag is the only available mechanism. Browsers treat it equivalently for XSS protection.

2. **Validation before sanitize**: Explicit reject fires before sanitize() runs — this ensures oversized inputs never reach the LLM call or truncation logic, closing the prompt injection / quota abuse window.

3. **Messages array validation in processHealthInput**: The health input function accepts both `text` (single turn) and `messages` (multi-turn history). Both channels validated to maintain consistent security posture.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

```
# CSP
grep "Content-Security-Policy" index.html → 1 line found (line 9)
grep "api.base44.com|js.stripe.com|worker-src" index.html → 1 line found

# Input validation
MAX_MSG_LENGTH in pawcoachChat → lines 14 (declaration) + 17 (check)
MAX_INPUT_LENGTH in preDiagnosis → lines 14, 15, 18 (declaration + 2 checks)
MAX_INPUT_LENGTH in processHealthInput → lines 14, 15, 20 (declaration + 2 checks)

# Regression check
sanitize() present in all 3 functions → confirmed
```

## Known Stubs

None.

## Self-Check: PASSED

- index.html modified: confirmed (line 9 CSP tag)
- pawcoachChat/entry.ts commit e090235: confirmed
- preDiagnosis/entry.ts commit e090235: confirmed
- processHealthInput/entry.ts commit e090235: confirmed
- git push: confirmed (main pushed to origin)
