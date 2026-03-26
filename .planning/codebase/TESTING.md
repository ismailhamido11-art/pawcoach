# PawCoach — Testing & Quality
> Current state as observed in the codebase. Last updated: 2026-03-26.

---

## 1. Test Framework

**There is no test framework installed.**

Neither Jest, Vitest, Playwright, Testing Library, Cypress, nor any equivalent is listed in `package.json` (checked both `dependencies` and `devDependencies`). No test runner is configured.

---

## 2. Test Coverage

**Zero test files in `src/`.**

Glob search for `*.test.*` and `*.spec.*` in `pawcoach/src/` returned no results. No `__tests__` directories exist in the application source.

Test files found in `node_modules/` belong entirely to third-party libraries (hookform/resolvers, stripe-js, html2canvas, etc.) — not authored by the project.

**Coverage: 0%** — no unit tests, no integration tests, no e2e tests.

---

## 3. QA Approach

### Current state: fully manual
All QA is done by running the dev server (`npm run dev`) and visually testing in the browser. There is no documented QA checklist or test plan in the repo.

### Build validation
The build script (`npm run build`) is the only automated quality gate:
```bash
npm run build  # vite build — must pass without errors
```
This was explicitly documented as a hard rule in `CLAUDE.md`: *"Si une erreur de build survient, la corriger IMMÉDIATEMENT avant de continuer"*.

### Linting (ESLint)
ESLint is configured and functional:
```bash
npm run lint      # eslint . --quiet
npm run lint:fix  # eslint . --fix
```

**ESLint config** (`eslint.config.js` — flat config format, ESLint v9):
- Scope: `src/components/**/*.{js,mjs,cjs,jsx}`, `src/pages/**/*.{js,mjs,cjs,jsx}`, `src/Layout.jsx`
- Excluded: `src/lib/**/*`, `src/components/ui/**/*` (shadcn — never touch)
- Plugins active: `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-unused-imports`

**Active rules:**
| Rule | Level | Effect |
|------|-------|--------|
| `unused-imports/no-unused-imports` | error | Fails on unused imports |
| `unused-imports/no-unused-vars` | warn | Warns on unused vars (ignorant of `_` prefix) |
| `react-hooks/rules-of-hooks` | error | Enforces hooks rules |
| `react/jsx-uses-vars` | error | Prevents false "unused var" on JSX components |
| `react/no-unknown-property` | error | Catches invalid DOM props |
| `react/prop-types` | off | PropTypes not required |
| `react/react-in-jsx-scope` | off | No `import React` needed (React 18) |
| `no-unused-vars` | off | Replaced by unused-imports plugin |

---

## 4. Type Checking

### TypeScript (partial)
TypeScript is installed (`typescript ^5.8.2`) and a `jsconfig.json` is configured with `"checkJs": true`. The `typecheck` script exists:
```bash
npm run typecheck  # tsc -p ./jsconfig.json
```

**Scope of type checking:**
```json
"include": ["src/components/**/*.js", "src/pages/**/*.jsx", "src/Layout.jsx"]
"exclude": ["node_modules", "dist", "src/vite-plugins", "src/components/ui", "src/api", "src/lib"]
```

**Reality**: Most `.jsx` files have no JSDoc annotations and no type imports. The `checkJs` flag catches only the most obvious type errors. `src/utils/index.ts` is the only file with real TypeScript types. Backend functions (`entry.ts`) use TypeScript natively but with minimal annotations (most variables are typed as `any` implicitly).

There is **no strict TypeScript enforcement** — the project is effectively untyped JavaScript with a light type-check pass on a subset of files.

---

## 5. CI/CD

### GitHub Actions
**No `.github/workflows/` directory exists** in the project. There are no CI/CD pipelines.

### Deployment pipeline
The deployment flow is manual:
1. Developer (or Claude) pushes to `main` branch on GitHub
2. Base44 platform detects the push via 2-way sync and pulls the code
3. Ismail clicks "Publish" in the Base44 dashboard to deploy to production

There is no automated:
- Build check on PR
- Lint check on push
- Test run
- Preview deployment
- Branch protection rules (as far as can be determined from repo structure)

---

## 6. Quality Gaps — Summary

### Critical gaps
| Gap | Impact | Notes |
|-----|--------|-------|
| No unit tests | High | Business logic in `utils/` (premium checks, health status, recommendations) is completely untested |
| No integration tests | High | Data flows (checkin → streak update → badge unlock) never verified automatically |
| No e2e tests | High | User journeys (onboarding, payment, daily checkin) rely entirely on manual testing |
| No CI pipeline | Medium | A bad push can break production with no safety net |
| No TypeScript in components | Medium | No compile-time safety on prop shapes or API response shapes |

### Moderate gaps
| Gap | Impact | Notes |
|-----|--------|-------|
| No regression detection | Medium | Visual Polish work (current phase) can silently break existing functionality |
| No Prettier | Low | Formatting inconsistencies accumulate over time (mix of `@/` vs relative imports, hardcoded vs token colors) |
| `useReducedMotion` stub returns `false` always | Low | Accessibility: reduced motion preference not actually respected via this hook (Framer Motion's own import is used in critical components, so partially mitigated) |

### What exists (strengths)
- ESLint catches unused imports and hooks violations — prevents a common class of bugs
- `npm run build` as a hard gate — at minimum, broken imports get caught before push
- `ErrorBoundary` wraps pages — runtime errors don't crash the full app
- Backend functions validate inputs and use try/catch throughout
- Server-side quota checks for chat (not relying on client state)

---

## 7. Recommended Next Steps (if testing is to be added)

If automated testing were to be introduced, the logical order would be:

1. **Vitest** (already using Vite — zero config overhead) for unit tests on `src/utils/` functions (`premium.js`, `healthStatus.js`, `recommendations.js`) — highest ROI, pure functions, no DOM needed.
2. **GitHub Actions** — lint + build check on every push to `main`. Catches regressions before Base44 sync.
3. **Playwright** — e2e for the 3 critical user paths: onboarding flow, daily checkin, premium upgrade. MCP server already available in the workspace.

These are recommendations only — not the current state.
