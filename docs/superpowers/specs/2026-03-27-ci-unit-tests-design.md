# Design — CI + Unit Tests
# Date: 2026-03-27
# Status: Approved

## Context

ORCHESTR is in active development. The CI pipeline only runs lint and build — no tests.
One test file exists (`src/lib/validations/candidate.test.ts`) but is never executed.
Vitest and Playwright are configured but unused in CI.

## Goal

Establish a reliable test safety net without creating maintenance overhead in a fast-moving codebase.

---

## Scope

### In scope
1. **Fix CI** — add Vitest unit tests step to `.github/workflows/ci.yml`
2. **New tests: `src/lib/stripe.test.ts`** — pure function tests for billing logic
3. **Existing tests pass** — `src/lib/validations/candidate.test.ts` already works

### Out of scope
- Mocking Prisma or Supabase (schema changes too frequently, high maintenance cost)
- React component tests (UI moves too fast, low ROI right now)
- E2E Playwright in CI (requires infra setup, separate concern)
- `plan-limits.ts` unit tests (pure glue code, covered by E2E)

---

## CI Changes

Add a `test` step to the existing `build` job in `.github/workflows/ci.yml`, after lint and before build:

```yaml
- name: Test (unit)
  run: npm run test -- --run
  env:
    # Same env vars as build step — Vitest doesn't need real DB/Stripe
    DATABASE_URL: "postgresql://local:local@localhost:5432/local?schema=public"
    DIRECT_URL: "postgresql://local:local@localhost:5432/local?schema=public"
    NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder"
```

`--run` flag ensures Vitest runs once (no watch mode) and exits with a non-zero code on failure.

---

## New Test File: `src/lib/stripe.test.ts`

Tests for pure, stable functions in `src/lib/stripe.ts`. No I/O, no mocks needed.

### Functions to test

**`formatPrice(amountInCents: number): string`**
- Formats cents to French EUR string (e.g. 4500 → "45,00 €")
- Edge cases: 0, large amounts, amounts with cents

**`calculateAnnualSavings(plan: 'CORE' | 'PRO')`**
- Returns `{ fourWeeksTotal, annualTotal, savings, savingsPercent }`
- Core: 4500 × 13 = 58500 total, annual = 49900, savings = 8600, ~15%
- Pro: 8200 × 13 = 106600 total, annual = 89900, savings = 16700, ~16%
- savingsPercent must be positive and < 100

**`getPriceId(plan, period): string`**
- Returns PRICING[plan][period].priceId
- Returns empty string when env var not set (expected in test env)

**`PLANS` constants**
- CORE.limits.maxUsers === 3
- PRO.limits.maxUsers === Infinity
- WHITE_LABEL.limits.aiCallsPerDay === Infinity
- Plans with customQuestionnaires: false have apiAccess: false too
- PRO and WHITE_LABEL have both customQuestionnaires and apiAccess: true

---

## Architecture notes

- Tests co-located with source files (pattern already established by `candidate.test.ts`)
- Vitest config already handles `**/*.test.{ts,tsx}` — no config changes needed
- No new dependencies required
- `vitest.setup.ts` mocks `next/navigation` and `next-intl` — not needed for stripe.ts but harmless

---

## Success criteria

- `npm run test -- --run` exits 0 locally
- CI job `test` passes on every push to main/PR
- `stripe.test.ts` covers the 4 functions above with meaningful cases
- No test that always passes regardless of implementation
