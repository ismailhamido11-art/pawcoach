---
phase: 03-sec
verified: 2026-03-27T00:00:00Z
status: gaps_found
score: 2/3 must-haves verified
gaps:
  - truth: "finalDiagnosis blocks calls when the user has no quota remaining"
    status: failed
    reason: "The guard reads ai_credits, a field no function ever writes. preDiagnosis decrements actions_remaining instead. ai_credits is always null for all users, triggering the legacy bypass unconditionally. The guard is permanently inoperative."
    artifacts:
      - path: "base44/functions/finalDiagnosis/entry.ts"
        issue: "Lines 25-30: reads ai_credits which is never set by any function. preDiagnosis (lines 31-34) decrements actions_remaining. Wrong field — guard always reaches the null check and allows through."
    missing:
      - "Replace the ai_credits read with an actions_remaining check that mirrors the pattern in preDiagnosis (read user.actions_remaining, check <= 0, apply daily reset logic from lastReset/today comparison)"
      - "Alternatively: read actions_remaining from the User entity via asServiceRole and gate on remaining <= 0"
---

# Phase 03: SEC — Securite backend — Verification Report

**Phase Goal:** Les trois failles de securite backend restantes sont bouchees (SEC-01, SEC-02, SEC-03)
**Verified:** 2026-03-27
**Status:** gaps_found — 2/3 truths verified
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | finalDiagnosis blocks calls when user has no quota remaining (SEC-01) | FAILED | Guard reads `ai_credits` (line 25) — field never written by any function. `preDiagnosis` decrements `actions_remaining` instead. Guard always hits `credits === null` legacy bypass. |
| 2 | finalDiagnosis and generateDiagnosisPDF reject dog_id belonging to another user (SEC-02) | VERIFIED | Both files: `if (dog_id)` block with `Dog.filter({ id: dog_id })`, `dog.owner !== user.email` check, 403 on mismatch, 404 if not found. Lines 14-19 in finalDiagnosis, lines 39-44 in generateDiagnosisPDF. |
| 3 | deleteUser cascade deletes ParkReview records linked to each dog (SEC-03) | VERIFIED | Line 52 of deleteUser/entry.ts: `base44.asServiceRole.entities.ParkReview.deleteMany({ dog_id: dogId }).catch(() => {})` — present in the `flatMap` alongside the 15 other dog-linked entities. |

**Score:** 2/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `base44/functions/finalDiagnosis/entry.ts` | Quota guard + ownership check | PARTIAL | Ownership check (SEC-02): VERIFIED. Quota guard (SEC-01): present in code but reads wrong field — effectively disabled. |
| `base44/functions/generateDiagnosisPDF/entry.ts` | Ownership check on dog_id | VERIFIED | Lines 39-44: dog_id param, Dog.filter, owner check, 403/404 responses. |
| `base44/functions/deleteUser/entry.ts` | ParkReview in cascade delete | VERIFIED | Line 52: ParkReview.deleteMany with dog_id, best-effort catch, inside the Promise.all flatMap. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| SEC-01 guard | preDiagnosis quota system | ai_credits field | NOT_WIRED | preDiagnosis writes `actions_remaining`. finalDiagnosis reads `ai_credits`. These are different fields. `ai_credits` is never written by any of the 22 backend functions (confirmed by grep). |
| SEC-02 ownership (finalDiagnosis) | Dog entity | Dog.filter + owner check | WIRED | Lines 15-18: filter by id, check owner === user.email, 403/404 responses. |
| SEC-02 ownership (generateDiagnosisPDF) | Dog entity | Dog.filter + owner check | WIRED | Lines 40-43: same pattern, identical logic. |
| SEC-03 cascade | ParkReview entity | deleteMany(dog_id) | WIRED | Line 52: inside dogIds.flatMap, same best-effort pattern as all other entities. |

### Data-Flow Trace (Level 4)

Not applicable — these are backend authorization guards, not data-rendering components.

### Behavioral Spot-Checks

Step 7b: SKIPPED — backend Deno functions require a running Base44 runtime, cannot invoke without live server.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | PLAN.md | finalDiagnosis verifie le quota (empecher appel direct sans preDiagnosis) | BLOCKED | Guard code exists but reads `ai_credits` (never written). All users see null, guard bypasses. No effective blocking. |
| SEC-02 | PLAN.md | finalDiagnosis et generateDiagnosisPDF ajoutent un ownership check sur dog_id | SATISFIED | Both functions: dog_id param, Dog.filter, owner check, 403 on mismatch. Conditional (if dog_id) per backward-compat decision. |
| SEC-03 | PLAN.md | deleteUser supprime aussi les ParkReview du chien | SATISFIED | ParkReview.deleteMany in cascade at line 52 of deleteUser/entry.ts. |

Note: REQUIREMENTS.md still shows SEC-01/02/03 as "Pending" — status not updated after implementation. Not a code gap, but a docs inconsistency.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `base44/functions/finalDiagnosis/entry.ts` | 25-30 | Reads `ai_credits` field — never written by any backend function | BLOCKER | SEC-01 guard is always bypassed. A user with 0 remaining actions can call finalDiagnosis directly, skipping preDiagnosis entirely, at no cost. |
| `base44/functions/finalDiagnosis/entry.ts` | 27 | Comment contradicts code: says "credits === 0 means preDiagnosis was never called — block" but condition only fires at `< 0`, not `=== 0` | WARNING | Minor — the logic inconsistency is moot since the field is never set, but would cause confusion when fixing. |
| `base44/functions/finalDiagnosis/entry.ts` | 14 | SEC-02 ownership check is conditional (`if (dog_id)`) | INFO | Known/deliberate per SUMMARY: backward-compat. Calls without dog_id bypass the ownership check. Flagged in SUMMARY as a known stub to resolve later. |
| `base44/functions/generateDiagnosisPDF/entry.ts` | 39 | Same conditional SEC-02 ownership check | INFO | Same as above — calls without dog_id bypass the check. |

### Human Verification Required

None beyond the gap — SEC-01 is fully diagnosable from code inspection.

### Gaps Summary

**SEC-01 is inoperative.** The quota guard was implemented against `ai_credits`, a field that does not exist in practice. The actual quota field used across the entire codebase is `actions_remaining` (used by preDiagnosis, analyzeGrowthPhoto, generateTrainingProgram, parseHealthFile, processHealthInput — 5 functions confirmed by grep). Because `ai_credits` is always null, the guard always hits the legacy bypass and allows every call through. A user with 0 `actions_remaining` can still call `finalDiagnosis` directly without going through `preDiagnosis`.

**Fix required:** Replace lines 23-30 of `finalDiagnosis/entry.ts` with the same `actions_remaining` quota check pattern used in `preDiagnosis/entry.ts` (lines 13-35): read `user.actions_remaining`, apply daily reset comparison, block on `remaining <= 0`.

**SEC-02 and SEC-03 are verified.** The ownership checks and ParkReview cascade are correctly implemented and wired. The backward-compat caveat on SEC-02 (`if (dog_id)` conditional) is documented and expected per the plan decisions.

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
