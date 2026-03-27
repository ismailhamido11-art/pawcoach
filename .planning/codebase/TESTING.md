# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- None installed. No Vitest, Jest, or any test runner in `package.json` dependencies or devDependencies.
- Config: No `vitest.config.*`, `jest.config.*` found.

**Assertion Library:**
- None.

**Run Commands:**
```bash
npm run lint          # ESLint — only automated quality check available
npm run typecheck     # tsc type-check via jsconfig.json
```

## Test File Organization

**Location:**
- No test files exist in `src/`. Zero `.test.*` or `.spec.*` files in the application source.
- Test files in `node_modules/` belong to third-party libraries only (e.g., `@radix-ui`, `@stripe`).

**Naming:**
- Not applicable.

## What Is Tested

**Automated tests: None.**

The codebase has no automated test suite at any level:
- No unit tests for utility functions (`src/utils/dateHelpers.js`, `src/utils/premium.js`, `src/utils/healthStatus.js`)
- No integration tests for API entity flows
- No component tests for UI behavior
- No E2E tests

## What Is Used Instead

**ESLint** (`eslint.config.js`):
- Unused import detection (`eslint-plugin-unused-imports`)
- React hooks rules enforcement (`eslint-plugin-react-hooks`)
- Scope: `src/components/**`, `src/pages/**`
- Run: `npm run lint`

**TypeScript type-checking** (`jsconfig.json`):
- `checkJs: true` for JS files
- Scope: `src/components/**`, `src/pages/**`, `src/Layout.jsx`
- Excludes: `src/lib/`, `src/components/ui/`, `src/api/`, `src/vite-plugins/`
- Run: `npm run typecheck`

**Manual QA** (primary quality gate):
- Developer deploys via `git push` → Base44 auto-sync → manual verification in browser
- PullToRefresh, error states, and toast messages provide visible runtime feedback

## ErrorBoundary (Runtime Safety Net)

Every page route is wrapped in `<ErrorBoundary>` in `src/App.jsx`. Catches React render errors per-page without crashing the full app. See `src/components/ErrorBoundary.jsx` for implementation.

This is the only formal safety mechanism beyond linting.

## Key Areas With Zero Test Coverage

**High business logic risk (no tests):**

| File | What it does | Risk if broken |
|------|-------------|----------------|
| `src/utils/premium.js` | `isUserPremium()`, `isUserOnTrial()`, `getTrialDaysLeft()` | Premium gating fails silently |
| `src/utils/ai-credits.js` | Credit init, consumption | Users charged wrong amounts |
| `src/hooks/useActionCredits.js` | consumingRef guard, credit state | Duplicate AI credit consumption |
| `src/utils/healthStatus.js` | Vaccine status, health score | Wrong health alerts shown |
| `src/utils/recommendations.js` | Daily recommendations engine | Recommendations always empty or wrong |
| `src/utils/dateHelpers.js` | French date formatting, age calc | Wrong dates shown throughout app |
| `src/lib/HomeCacheContext.jsx` | 2-min cache TTL, dog-switch invalidation | Stale data after dog switch |
| `src/components/streakHelper.jsx` | Streak silent update | Streaks not incremented |
| `src/components/achievements/badgeUtils.jsx` | Badge unlock logic | Badges never or always awarded |

**Medium risk (UI correctness, no tests):**

| File | Risk |
|------|------|
| `src/components/notebook/SectionVaccins.jsx` | Vaccine reminder date auto-calculation |
| `src/components/activite/AITrainingProgram.jsx` | Program day completion toggle |
| `src/pages/Library.jsx` | AlertDialog delete flows |

## If Tests Are Added

**Recommended framework:** Vitest (already uses Vite; zero-config integration)

**Highest-value tests to write first:**

1. **Unit: `src/utils/premium.js`**
   - `isUserPremium({ is_premium: true })` returns true
   - `isUserPremium({ trial_expires_at: future })` returns true
   - `isUserPremium({ trial_expires_at: past })` returns false
   - `isUserPremium(null)` returns false

2. **Unit: `src/utils/dateHelpers.js`**
   - `getAge()` returns correct string for < 12 months and > 12 months
   - `fmtDate()` returns "" for null/undefined
   - `addDaysToDate()` handles month boundaries without DST shift

3. **Unit: `src/utils/ai-credits.js`**
   - Credit consumption decrements correctly
   - consumingRef guard prevents double call

4. **Integration: `src/lib/HomeCacheContext.jsx`**
   - Cache invalidates when `activeDogId` changes
   - Cache expires after 2 minutes

**Setup needed:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```
Add to `vite.config.js`:
```js
test: { environment: "jsdom", globals: true }
```

## Coverage

**Requirements:** None enforced.

**Current coverage:** 0% (no test runner installed).

---

*Testing analysis: 2026-03-27*
