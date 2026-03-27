# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:** None
- No test runner configured (no `jest.config.*`, no `vitest.config.*` in `pawcoach/`)
- No test files exist in `src/` — only third-party test files in `node_modules/`
- `package.json` scripts: `dev`, `build`, `lint`, `lint:fix`, `typecheck`, `preview` — no `test` script

**Quality tools that DO exist:**
```bash
npm run lint          # ESLint — catches unused imports + hooks violations
npm run lint:fix      # Auto-fix ESLint issues
npm run typecheck     # TypeScript check via jsconfig.json (JS files with JSDoc)
npm run build         # Vite build — catches import errors, dead code
```

## Test File Organization

**Location:** No test files exist in the project source.

**Test files found:** Zero `*.test.*` or `*.spec.*` files in `src/`, `base44/functions/`, or project root.

## What Is Tested

**Nothing is formally tested.** Verification happens through:

1. **ESLint** (`eslint.config.js`) — enforces:
   - No unused imports (error)
   - No unused variables (warn, `^_` pattern exempted)
   - React hooks rules (error)
   - Known JSX property names

2. **TypeScript type checking** (`npm run typecheck`) — loose JS type checking via `jsconfig.json`

3. **Vite build** — catches missing imports, circular deps, syntax errors

4. **Manual testing** — developer tests in the browser

## What Is NOT Tested

Every critical business logic path is untested:

**High-value untested areas:**

- `src/utils/healthStatus.js` — `computeHealthScore`, `computeVaccineMap`, `computeWeightTrend`, `computeNextAction`, `computeStatusPills` are pure functions with complex branching logic. Prime candidates for unit tests.

- `src/utils/premium.js` — `isUserPremium`, `isUserOnTrial`, `getTrialDaysLeft` — gate premium features. Bugs here block or wrongly grant access.

- `src/utils/ai-credits.js` — `initCredits`, `consumeMessageCredit`, `consumeActionCredit` — credit daily reset logic; bugs cause users to lose credits or over-consume.

- `src/utils/recommendations.js` — `buildRecommendations` — 12 recommendation rules, priority ordering; easy to regress silently.

- `src/utils/dateHelpers.js` — `getDaysLeft`, `getDateLabel`, `shouldShowDateSeparator` — date edge cases are classically bug-prone.

- `src/components/streakHelper.jsx` — `updateStreakSilently` — grace day logic, dedup guard; streak reset bugs are user-facing.

- `src/hooks/useActionCredits.js` — `consumingRef` double-click guard; concurrency behavior untestable without tests.

- `src/pages/VetDogView.jsx` — `translateError` map — static, easy to test.

## Coverage

**Requirement:** None enforced.

**Actual:** 0% — no tests exist.

## Test Types

**Unit Tests:** Not used.

**Integration Tests:** Not used.

**E2E Tests:** Not used.

## If You Add Tests

If tests are introduced, recommended setup for this codebase:

**Recommended stack:**
- **Vitest** (preferred over Jest — native Vite integration, ESM-compatible, no config friction)
- **@testing-library/react** for component tests
- No need for jsdom for pure utility functions

**Suggested `vitest.config.js`:**
```js
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
```

**Suggested `package.json` additions:**
```json
"test": "vitest",
"test:coverage": "vitest run --coverage"
```

**Where to place test files:**
- Co-located with source: `src/utils/healthStatus.test.js`
- Or separate: `src/__tests__/utils/healthStatus.test.js`

## High Priority Tests to Write First

Priority order based on business impact and bug risk:

1. **`src/utils/healthStatus.js`** — all exported functions are pure (no API, no React), easy to unit test:
   ```js
   // Example
   import { computeHealthScore, computeVaccineMap, isValidDate } from "@/utils/healthStatus";

   describe("computeHealthScore", () => {
     it("returns 0 when no records", () => {
       expect(computeHealthScore([], {})).toBe(0);
     });
     it("caps at 100", () => {
       // ...feed perfect records
     });
   });
   ```

2. **`src/utils/premium.js`** — pure functions, 3 functions to cover in ~10 tests:
   ```js
   import { isUserPremium, isUserOnTrial, getTrialDaysLeft } from "@/utils/premium";

   it("returns true when is_premium flag is set", () => {
     expect(isUserPremium({ is_premium: true })).toBe(true);
   });
   it("returns false when trial_expires_at is in the past", () => {
     expect(isUserPremium({ trial_expires_at: "2020-01-01" })).toBe(false);
   });
   ```

3. **`src/utils/recommendations.js`** — `buildRecommendations` pure function, test each of 12 rules:
   - Priority ordering (vaccine_overdue = priority 1 must appear first)
   - Slice limit (returns at most 3 recommendations)

4. **`src/utils/dateHelpers.js`** — date edge cases:
   - `getDateLabel` for today, yesterday, older dates
   - `getDaysLeft` with past/future dates

5. **`src/utils/ai-credits.js`** — requires mocking `base44.auth.updateMe`:
   - Daily reset logic when `messages_daily_reset !== today`
   - Credit floor at 0 (`Math.max(0, ...)`)

## Mocking Needs

**For utils tests:** No mocking needed (all pure functions).

**For hook tests:**
```js
// Mock base44 client
vi.mock("@/api/base44Client", () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: "test@test.com", is_premium: false }),
      updateMe: vi.fn().mockResolvedValue({}),
    },
  },
}));
```

**For component tests:**
```js
// Mock entities
vi.mock("@/api/entities", () => ({
  Dog: { filter: vi.fn().mockResolvedValue([{ id: "dog1", name: "Rex" }]) },
}));
```

## Linting as Quality Gate

ESLint currently serves as the only automated quality gate. Run before every commit:

```bash
npm run lint        # Check — exits non-zero on errors
npm run lint:fix    # Auto-fix
```

Key catches:
- `unused-imports/no-unused-imports` — prevents dead import accumulation
- `react-hooks/rules-of-hooks` — prevents conditional hook calls
- Build (`npm run build`) — catches missing module resolutions and circular imports

---

*Testing analysis: 2026-03-27*
