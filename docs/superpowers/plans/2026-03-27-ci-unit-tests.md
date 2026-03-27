# CI + Unit Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vitest unit tests for billing logic and wire them into CI so every push is validated.

**Architecture:** Two files touched — fix one implementation bug in `candidate.ts`, create `stripe.test.ts` for pure billing functions, add one step in `ci.yml`. No new dependencies, no mocks.

**Tech Stack:** Vitest, TypeScript, GitHub Actions

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Fix | `src/lib/validations/candidate.ts` | `joinSemicolonList`: `join(';')` → `join('; ')` |
| Create | `src/lib/stripe.test.ts` | Pure function tests for `formatPrice`, `calculateAnnualSavings`, `getPriceId`, `PLANS` |
| Modify | `.github/workflows/ci.yml` | Add `Test (unit)` step after Lint, before Build |

---

## Task 1 — Fix `joinSemicolonList` implementation

The existing test expects `'skill1; skill2; skill3'` (space after semicolon) but the implementation uses `.join(';')` (no space). Fix the implementation to match the intended behavior.

**Files:**
- Fix: `src/lib/validations/candidate.ts` (line 216)

- [ ] **Step 1: Run existing tests to confirm the failure**

```bash
cd /Users/clementsporrer/dev/orchestr
npm run test -- --run src/lib/validations/candidate.test.ts
```

Expected output: FAIL — `joinSemicolonList` test fails with `'skill1;skill2;skill3'` received, `'skill1; skill2; skill3'` expected.

- [ ] **Step 2: Fix `joinSemicolonList` in `candidate.ts`**

In `src/lib/validations/candidate.ts`, line 216, change:

```ts
// Before
return items.filter((item) => item.trim().length > 0).join(';')
```

```ts
// After
return items.filter((item) => item.trim().length > 0).join('; ')
```

- [ ] **Step 3: Run the tests again to confirm they all pass**

```bash
npm run test -- --run src/lib/validations/candidate.test.ts
```

Expected output: PASS — all 14 tests pass (5 parseSemicolonList + 3 joinSemicolonList + 6 transformCandidateInput).

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations/candidate.ts
git commit -m "fix(validations): joinSemicolonList separator should include space"
```

---

## Task 2 — Write `src/lib/stripe.test.ts`

Pure function tests for billing logic. No I/O, no mocks required. Co-located with `stripe.ts` following the pattern established by `candidate.test.ts`.

**Files:**
- Create: `src/lib/stripe.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/lib/stripe.test.ts` with this content:

```ts
import { describe, it, expect } from 'vitest'
import { formatPrice, calculateAnnualSavings, getPriceId, PLANS } from './stripe'

describe('formatPrice', () => {
  it('should format cents to EUR string', () => {
    const result = formatPrice(4500)
    expect(result).toContain('45')
    expect(result).toContain('€')
  })

  it('should format zero cents', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('should format amount with non-zero cents', () => {
    const result = formatPrice(4567)
    expect(result).toContain('45')
    expect(result).toContain('€')
  })

  it('should format large amounts', () => {
    const result = formatPrice(89900)
    expect(result).toContain('899')
    expect(result).toContain('€')
  })
})

describe('calculateAnnualSavings', () => {
  it('should calculate CORE annual savings correctly', () => {
    const result = calculateAnnualSavings('CORE')
    // 4500 × 13 = 58500
    expect(result.fourWeeksTotal).toBe(58500)
    // 499 EUR in cents
    expect(result.annualTotal).toBe(49900)
    expect(result.savings).toBe(8600)
    expect(result.savingsPercent).toBe(15)
  })

  it('should calculate PRO annual savings correctly', () => {
    const result = calculateAnnualSavings('PRO')
    // 8200 × 13 = 106600
    expect(result.fourWeeksTotal).toBe(106600)
    // 899 EUR in cents
    expect(result.annualTotal).toBe(89900)
    expect(result.savings).toBe(16700)
    expect(result.savingsPercent).toBe(16)
  })

  it('should return positive savings for both plans', () => {
    const core = calculateAnnualSavings('CORE')
    const pro = calculateAnnualSavings('PRO')
    expect(core.savings).toBeGreaterThan(0)
    expect(pro.savings).toBeGreaterThan(0)
  })

  it('should return savingsPercent between 1 and 99', () => {
    const core = calculateAnnualSavings('CORE')
    const pro = calculateAnnualSavings('PRO')
    expect(core.savingsPercent).toBeGreaterThan(0)
    expect(core.savingsPercent).toBeLessThan(100)
    expect(pro.savingsPercent).toBeGreaterThan(0)
    expect(pro.savingsPercent).toBeLessThan(100)
  })
})

describe('getPriceId', () => {
  it('should return a string for CORE fourWeeks', () => {
    const result = getPriceId('CORE', 'fourWeeks')
    expect(typeof result).toBe('string')
  })

  it('should return a string for CORE annual', () => {
    const result = getPriceId('CORE', 'annual')
    expect(typeof result).toBe('string')
  })

  it('should return a string for PRO fourWeeks', () => {
    const result = getPriceId('PRO', 'fourWeeks')
    expect(typeof result).toBe('string')
  })

  it('should return a string for PRO annual', () => {
    const result = getPriceId('PRO', 'annual')
    expect(typeof result).toBe('string')
  })
})

describe('PLANS', () => {
  it('CORE should limit users to 3', () => {
    expect(PLANS.CORE.limits.maxUsers).toBe(3)
  })

  it('PRO should have unlimited users', () => {
    expect(PLANS.PRO.limits.maxUsers).toBe(Infinity)
  })

  it('WHITE_LABEL should have unlimited AI calls', () => {
    expect(PLANS.WHITE_LABEL.limits.aiCallsPerDay).toBe(Infinity)
  })

  it('CORE should not have customQuestionnaires or apiAccess', () => {
    expect(PLANS.CORE.limits.customQuestionnaires).toBe(false)
    expect(PLANS.CORE.limits.apiAccess).toBe(false)
  })

  it('PRO should have customQuestionnaires and apiAccess', () => {
    expect(PLANS.PRO.limits.customQuestionnaires).toBe(true)
    expect(PLANS.PRO.limits.apiAccess).toBe(true)
  })

  it('WHITE_LABEL should have customQuestionnaires and apiAccess', () => {
    expect(PLANS.WHITE_LABEL.limits.customQuestionnaires).toBe(true)
    expect(PLANS.WHITE_LABEL.limits.apiAccess).toBe(true)
  })
})
```

- [ ] **Step 2: Run the new tests to confirm they pass**

```bash
npm run test -- --run src/lib/stripe.test.ts
```

Expected: all 18 tests pass. If `formatPrice` locale format differs, adjust the `.toContain()` assertions to match the actual output — the goal is to verify the numeric value and currency symbol, not the exact locale string.

- [ ] **Step 3: Run all tests together to confirm no interference**

```bash
npm run test -- --run
```

Expected: all tests pass (candidate.test.ts + stripe.test.ts). Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/lib/stripe.test.ts
git commit -m "test(stripe): add unit tests for formatPrice, calculateAnnualSavings, getPriceId, PLANS"
```

---

## Task 3 — Wire Vitest into CI

Add a `Test (unit)` step to the GitHub Actions workflow. It runs after Lint and before Build so failures are caught early without wasting time on the build.

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Update `.github/workflows/ci.yml`**

Add the `Test (unit)` step between `Lint` and `Build`:

```yaml
name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Test (unit)
        run: npm run test -- --run
        env:
          DATABASE_URL: "postgresql://local:local@localhost:5432/local?schema=public"
          DIRECT_URL: "postgresql://local:local@localhost:5432/local?schema=public"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: "postgresql://local:local@localhost:5432/local?schema=public"
          DIRECT_URL: "postgresql://local:local@localhost:5432/local?schema=public"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
```

- [ ] **Step 2: Run tests locally one final time to confirm everything is green**

```bash
npm run test -- --run
```

Expected: all tests pass, exit code 0.

- [ ] **Step 3: Commit and push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add Vitest unit tests step to CI pipeline"
```

---

## Done

After Task 3:
- `npm run test -- --run` passes locally with 32+ tests
- Every push to main/develop triggers unit tests in CI
- Billing logic regressions are caught automatically
- Foundation ready to add more tests as features are built
