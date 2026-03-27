# Security Policy

## Reporting a Vulnerability

**Do not open a public issue.** Contact us privately at clement@sporrer.fr with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We will acknowledge within 48 hours and aim to resolve critical issues within 7 days.

## Scope

In scope: authentication, data isolation (multi-tenant RLS), billing, external portals, API routes.

Out of scope: third-party services (Supabase, Stripe, Vercel infrastructure).

## Security Practices

- All secrets managed via environment variables — never committed
- Multi-tenant isolation enforced via Supabase RLS on every table
- Input validation via Zod on all API boundaries
- Stripe webhook signature verification on every webhook
- ESLint with TypeScript strict rules enforced on every PR
