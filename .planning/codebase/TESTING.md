# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:** None — no test runner is installed or configured.

**Assertion Library:** None.

**Test files found:** Zero. `find src/ -name "*.test.*" -o -name "*.spec.*"` returns empty.

**Test config files found:** None. No `jest.config.*`, `vitest.config.*`, or `playwright.config.*` in the project root.

**Run Commands:**
```bash
# No test commands exist. package.json scripts:
npm run dev           # Vite dev server
npm run build         # Vite production build
npm run lint          # ESLint only
npm run lint:fix      # ESLint --fix
npm run typecheck     # tsc -p ./jsconfig.json (JS type checking, not tests)
npm run preview       # Vite preview
```

## Current Quality Assurance Tools

The project uses **static analysis only** as its quality layer:

**ESLint (active):**
- Config: `eslint.config.js` — ESLint v9 flat config
- Plugins: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-unused-imports`
- Enforces: hooks rules, unused imports, JSX correctness
- Run: `npm run lint`

**TypeScript type checking (active):**
- Config: `jsconfig.json` with `"checkJs": true`
- Covers: `src/components/**/*.js`, `src/pages/**/*.jsx`, `src/Layout.jsx`
- Excludes: `src/lib/`, `src/components/ui/`, `src/api/`
- Run: `npm run typecheck`

**CodeGraphContext MCP (active):**
- `cgc analyze complexity` — identifies functions with cyclomatic complexity > 10
- `cgc analyze dead-code` — detects potentially unused exports
- `cgc find pattern` — finds code patterns across the codebase
- Requires: `cgc index .` in the project root before use

**E2E Audit (historical):**
- `.planning/phases/1-audit/E2E-AUDIT-REPORT.md` — manual audit of 165 user flows conducted for v4.0
- Not automated — was a one-time manual QA exercise

## What Is Tested

Nothing is automated. There are no unit tests, integration tests, or E2E tests.

## What Is NOT Tested (coverage gaps)

**Critical business logic with zero test coverage:**

**Premium/credits system:**
- `src/utils/premium.js` — `isUserPremium`, `isUserOnTrial`, `getTrialDaysLeft`
- `src/utils/ai-credits.js` — `initCredits`, `consumeMessageCredit`, `consumeActionCredit`
- `src/hooks/useActionCredits.js` — credit consumption with anti-double-call guard
- Risk: incorrect credit logic would let free users bypass paywall or lock out paying users

**Health score engine:**
- `src/utils/healthStatus.js` — 655 lines of pure calculation logic
- Functions: `computeHealthScore`, `computeVaccineMap`, `computeWeightTrend`, `computeStatusPills`, `computeNextAction`, `computeNotebookSummary`
- CGC complexity: `buildHealthSummaryHTML` scores 28 (highest in codebase)
- Risk: silent regressions in WSAVA vaccine schedule logic, BCS bonus/malus calculations

**Date and formatting utilities:**
- `src/utils/dateHelpers.js` — `getWeekStart`, `getAge`, `fmtDate`, `fmtDateLong`, `getDaysLeft`
- Note: `getWeekStart` is duplicated in `src/utils/recommendations.js:12` — divergence risk

**Streak logic:**
- `src/components/streakHelper.jsx` — `updateStreakSilently`
- Risk: streak corruption on edge cases (timezone, midnight boundary)

**Backend Deno functions (zero test coverage):**
- All 22 functions in `base44/functions/*/entry.ts`
- Critical: `stripeWebhook/entry.ts` — payment processing, no tests
- Critical: `dailyCheckinProcess/entry.ts` — quota enforcement, no tests
- Critical: `pawcoachChat/entry.ts` — server-side message quota, AI call, no tests
- Critical: `deleteUser/entry.ts` — irreversible data deletion, no tests

**Authentication flows:**
- `src/lib/AuthContext.jsx` — auth state machine (`auth_required`, `user_not_registered`, token expiry)
- Risk: auth edge cases (expired trial, revoked token) are untested

**Ownership checks:**
- Backend: `dog.owner !== user.email` pattern in 10+ functions
- Risk: cross-user data access if email comparison has edge cases

## Backend Function Testing Notes

Backend functions are Deno scripts (`base44/functions/*/entry.ts`) that run on Base44's serverless infrastructure. They:
- Import only `npm:@base44/sdk@0.8.20` — no test-friendly dependency injection
- Are stateful (read/write Base44 entities, call OpenAI)
- Have no mock layer or test harness

Local testing would require either:
1. A Deno test runner with mocked `createClientFromRequest` and entity stubs
2. Integration tests against the Base44 staging environment

Neither is set up.

## Complexity Hotspots (CGC)

Functions exceeding cyclomatic complexity 10 that are at highest regression risk:

| Function | Complexity | Location | Risk |
|----------|-----------|----------|------|
| `buildHealthSummaryHTML` | 28 | `base44/functions/vetAccess/entry.ts:13` | HTML generation for vet PDF |
| `getAge` | 17 | `base44/functions/pawcoachChat/entry.ts:438` | Age-based AI context |
| `getAge` | 17 | `base44/functions/weeklyInsightGenerate/entry.ts:205` | Weekly insight generation |
| `formatDateFr` | 11 | `base44/functions/pawcoachChat/entry.ts:129` | Date display in AI prompt |

These functions have no unit tests and are modified only in backend Deno files.

## Manual QA Process

No formal QA process exists. The project relies on:
1. Developer visual inspection after each `git push` (Base44 auto-deploys to staging)
2. Ismail manually testing flows in the browser after each milestone
3. ESLint + typecheck running locally before commit (not enforced by CI)
4. CGC analysis run ad-hoc during development sprints

## Test Coverage Gaps — Priority Order

**High priority (business-critical, pure functions — easy to test):**
1. `src/utils/premium.js` — 3 pure functions, no dependencies
2. `src/utils/ai-credits.js` — credit arithmetic, daily reset logic
3. `src/utils/dateHelpers.js` — especially `getWeekStart` (duplicated, divergence risk)
4. `src/utils/healthStatus.js` — `computeHealthScore`, vaccine map logic

**Medium priority (stateful, needs mocking):**
5. `src/hooks/useActionCredits.js` — anti-double-call guard
6. `src/lib/AuthContext.jsx` — auth state transitions
7. `src/lib/HomeCacheContext.jsx` — TTL and dog-ID invalidation

**Low priority (infrastructure/platform-dependent):**
8. Backend Deno functions — require mock SDK or integration environment
9. E2E flows — require Playwright or similar browser automation setup

## Recommended Test Setup (if implemented)

Based on the tech stack (Vite + React 18 + JavaScript):

```bash
# Minimal setup for pure utility testing
npm install --save-dev vitest @vitest/ui jsdom
# Add to package.json scripts:
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest run --coverage"
```

Test file placement would follow co-location pattern:
```
src/utils/premium.test.js       # next to premium.js
src/utils/healthStatus.test.js  # next to healthStatus.js
src/utils/dateHelpers.test.js   # next to dateHelpers.js
```

Example test pattern for existing pure functions:
```javascript
// src/utils/premium.test.js
import { describe, it, expect } from "vitest";
import { isUserPremium, isUserOnTrial, getTrialDaysLeft } from "./premium";

describe("isUserPremium", () => {
  it("returns false for null user", () => {
    expect(isUserPremium(null)).toBe(false);
  });
  it("returns true when is_premium is set", () => {
    expect(isUserPremium({ is_premium: true })).toBe(true);
  });
  it("returns true when trial_expires_at is in the future", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isUserPremium({ trial_expires_at: future })).toBe(true);
  });
  it("returns false when trial_expires_at is in the past", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isUserPremium({ trial_expires_at: past })).toBe(false);
  });
});
```

---

*Testing analysis: 2026-03-27*
