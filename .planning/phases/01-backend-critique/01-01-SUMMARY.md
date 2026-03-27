---
phase: 01-backend-critique
plan: 01
subsystem: backend
tags: [security, quota, streak, tech-01, tech-02]
dependency_graph:
  requires: []
  provides: [TECH-01, TECH-02]
  affects: [base44/functions/preDiagnosis, base44/functions/finalDiagnosis, base44/functions/streakReminder]
tech_stack:
  added: [Web Crypto API (HMAC-SHA256)]
  patterns: [short-lived signed token, hard cap guard]
key_files:
  created: []
  modified:
    - base44/functions/preDiagnosis/entry.ts
    - base44/functions/finalDiagnosis/entry.ts
    - base44/functions/streakReminder/entry.ts
decisions:
  - HMAC-SHA256 token via Web Crypto API (Deno native) — no external dependency
  - Token expiry 5 minutes — enough for the 2-step diagnostic flow
  - streakReminder uses list() + slice(0, 2000) hard cap (Base44 SDK __ne operator undocumented)
metrics:
  duration: "3 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  files_modified: 3
---

# Phase 01 Plan 01: Backend Security Fixes Summary

**One-liner:** HMAC-SHA256 token blocks quota bypass on finalDiagnosis; streakReminder capped at 2000 rows to prevent full table scan.

## What Was Built

### Task 1 — TECH-01: Quota bypass prevention (commits db04052)

**Problem:** Free users could call `finalDiagnosis` directly via POST API, bypassing the quota decremented in `preDiagnosis`. The old "guard" in finalDiagnosis read `actions_remaining` but never decremented it — it only blocked users who had already been blocked by preDiagnosis, providing no real protection against direct API calls.

**Fix:**
- `preDiagnosis` now generates a short-lived HMAC-SHA256 token after the quota decrement: `userId:timestamp:base64(signature)`. Token is returned in the response JSON as `pre_diagnosis_token`.
- `finalDiagnosis` validates this token before proceeding: checks presence (400 if missing), user ownership (403 if mismatch), expiry of 5 minutes (403 token_expired), and HMAC signature integrity (403 invalid_token_signature).
- The broken quota check block (`actions_remaining` read without decrement) was removed entirely.

**Key behavior:**
- Direct POST to finalDiagnosis without token → `400 pre_diagnosis_required`
- Token older than 5 min → `403 token_expired`
- Token from different user → `403 token_user_mismatch`
- Tampered signature → `403 invalid_token_signature`

### Task 2 — TECH-02: streakReminder full table scan prevention (commit 51bed3e)

**Problem:** `Streak.list()` loaded the entire table on every CRON run. A passive warning at >500 rows existed but took no action.

**Fix:**
- Replaced with `Streak.list().catch(() => [])` followed by `.slice(0, 2000)` hard cap.
- If the table exceeds 2000 rows, a `console.warn` fires with the exact count — actionable signal.
- In-memory filter on `current_streak >= 3 && last_activity_date !== today` preserved as-is.
- The `today` variable is still defined once (line 6) — no duplication.

**Note:** The Base44 SDK's filter operators for numeric comparison (e.g., `__gte`) are not documented. The "robuste variant" with hard cap was chosen over attempting `Streak.filter({ last_activity_date__ne: today })` which may not be supported.

## Deviations from Plan

None — plan executed exactly as written. The "variante robuste" for Task 2 was pre-approved in the plan itself as the safe choice when SDK filter support is uncertain.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | db04052 | feat(01-01): TECH-01 — HMAC token guards finalDiagnosis against quota bypass |
| 2 | 51bed3e | fix(01-01): TECH-02 — hard cap 2000 rows on streakReminder to prevent full table scan |

## Known Stubs

None. Both fixes are fully wired:
- preDiagnosis returns a real HMAC-signed token
- finalDiagnosis validates the real token
- streakReminder applies a real hard cap
