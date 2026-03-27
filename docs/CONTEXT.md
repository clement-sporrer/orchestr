# Project Context — ORCHESTR
# Retrofitted by Claude Code on 2026-03-27

## What this project is
Plateforme SaaS de recrutement pour agences. Fonctionnalités principales :
- CRM clients et contacts
- Gestion des missions (offres)
- Base candidats avec pipeline 7 étapes
- Pools de candidats
- Portail candidat et portail client (accès externe tokenisé)
- Scoring IA (OpenAI GPT-4o-mini)
- Extension Chrome pour import depuis LinkedIn
- Billing Stripe (plans/limits)
- i18n EN/FR

Multi-tenant : chaque agence = une Organization. Isolation totale via RLS Supabase.

**Propriétaire : Sporrer. Usage interne uniquement.**

## Stack
| Couche | Tech |
|--------|------|
| Frontend | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind CSS v4, shadcn/ui (Radix UI) |
| Backend | Server Actions + API Routes (Next.js) |
| ORM | Prisma v6 |
| Database | PostgreSQL via Supabase + RLS |
| Auth | Supabase Auth (JWT, SSR cookies) |
| Cache client | TanStack Query v5 |
| State local | Zustand |
| Forms | React Hook Form + Zod v4 |
| Billing | Stripe |
| AI | OpenAI GPT-4o-mini |
| i18n | next-intl v4 |
| Tests unit | Vitest |
| Tests E2E | Playwright |
| Deploy | Vercel (région iad1) |
| CI | GitHub Actions |

## Architecture
```
src/
├── app/
│   ├── (auth)/          # Login, register, reset-password
│   ├── (dashboard)/     # App protégée : clients, missions, candidates, pools, tasks, settings
│   ├── (marketing)/     # Landing, pricing, product, legal
│   ├── (portals)/       # Portails externes (candidate/, client/)
│   └── api/             # Webhooks (stripe, calendly), extension Chrome, health
├── components/          # Composants par domaine (candidates, clients, pipeline, ui…)
├── lib/
│   ├── actions/         # Server Actions — toute la logique métier
│   ├── ai/              # Intégration OpenAI
│   ├── auth/            # Helpers Supabase Auth
│   ├── data/            # Queries de lecture (Prisma)
│   ├── validations/     # Schemas Zod
│   ├── query/           # React Query hooks
│   ├── prisma.ts        # Singleton Prisma client
│   ├── env.ts           # Validation env vars (runtime)
│   └── stripe.ts        # Client Stripe
├── i18n/                # Traductions EN/FR
└── types/               # Types TypeScript partagés
prisma/
├── schema.prisma        # Schéma DB + migrations
└── seed.ts
supabase/
└── policies.sql         # Politiques RLS
chrome-extension/        # Extension LinkedIn
```

## Key files to know
| Fichier | Rôle |
|---------|------|
| `src/middleware.ts` | Auth routing — protège toutes les routes dashboard |
| `src/lib/prisma.ts` | Singleton Prisma — ne pas instancier ailleurs |
| `src/lib/env.ts` | Validation env vars au démarrage |
| `src/lib/actions/*.ts` | Toute la logique métier — point d'entrée unique |
| `supabase/policies.sql` | RLS — isolation multi-tenant critique |
| `prisma/schema.prisma` | Schéma DB — 20+ tables, organizationId partout |
| `src/lib/plan-limits.ts` | Limites par plan Stripe |
| `src/lib/data/` | Queries Prisma en lecture seule (sans mutation) |

## Current state
Développement actif. Dernier rebuild majeur : 2026-03-27 (pipeline 7 étapes, dedup, CRM, portails).
Features récentes : dashboard filtres/pagination, React Query, optimisations performances.

## Known technical debt
- CI ne run pas les tests (Vitest ni Playwright) — uniquement lint + build
- Aucun test unitaire écrit malgré la config Vitest présente
- `puppeteer` en dep principale — devrait probablement être devDependency
- Pas de rate limiting explicite sur les routes portails (accès externe)
- Tests E2E non intégrés au CI

## What to always do before modifying
- Lire ce fichier
- Vérifier `git status` et la branche courante
- Lire `docs/architecture.md` pour le contexte système
- Vérifier `prisma/schema.prisma` avant tout changement data
- Ne jamais travailler directement sur `main`

## What to never touch without explicit instruction
- `supabase/policies.sql` — RLS multi-tenant, une erreur = fuite de données inter-org
- `src/middleware.ts` — routing auth global
- `prisma/schema.prisma` — migrations prod
- `src/lib/prisma.ts` — connexion pooling serverless
- Variables d'environnement dans `.env.local` — ne jamais commit
