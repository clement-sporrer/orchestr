# ORCHESTR

> Modern Recruitment Orchestration Platform for Agencies

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

</div>

---

## Overview

ORCHESTR is a complete recruitment management platform designed for recruitment agencies. It streamlines the entire recruitment workflow from client management to candidate placement, with AI-powered features and modern UX.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ORCHESTR PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │   CLIENTS    │   │   MISSIONS   │   │  CANDIDATES  │                 │
│  │     CRM      │──▶│  (Jobs)      │◀──│   DATABASE   │                 │
│  └──────────────┘   └──────────────┘   └──────────────┘                 │
│         │                  │                  │                          │
│         ▼                  ▼                  ▼                          │
│  ┌──────────────────────────────────────────────────────┐               │
│  │                    PIPELINE                           │               │
│  │  Sourced → Contacted → Interview → Sent → Hired      │               │
│  └──────────────────────────────────────────────────────┘               │
│         │                  │                  │                          │
│         ▼                  ▼                  ▼                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                 │
│  │   CLIENT     │   │  CANDIDATE   │   │     AI       │                 │
│  │   PORTAL     │   │   PORTAL     │   │   FEATURES   │                 │
│  └──────────────┘   └──────────────┘   └──────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### Core Features
- **Client CRM** — Manage client accounts, contacts, and relationships
- **Job Builder** — Multi-audience job descriptions with visibility controls
- **Candidate Database** — Unified talent pool with tags, history, and deduplication
- **Pipeline Management** — Kanban board and list view with drag-and-drop
- **CSV Import** — Smart import with auto-mapping and duplicate detection
- **Candidate Pools** — Segment and organize candidates for sourcing campaigns

### Portals
- **Candidate Portal** — Mobile-friendly guided experience for candidates
- **Client Portal** — Shortlist review with structured feedback collection

### AI Features
- **Candidate Scoring** — AI-powered match scoring against job requirements
- **Profile Structuring** — Automatic profile data extraction and organization
- **Message Generation** — AI-assisted outreach messages

### Integrations
- **Chrome Extension** — Capture LinkedIn profiles directly into the platform
- **Calendly Integration** — Automatic interview scheduling
- **Stripe Billing** — Subscription management and payments

### Enterprise
- **Multi-tenant Architecture** — Complete data isolation per organization
- **GDPR Compliance** — Data export, deletion, and retention policies
- **Analytics** — KPI dashboard and event tracking

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js Server Actions |
| **Database** | PostgreSQL (Supabase) with Prisma ORM |
| **Auth** | Supabase Auth with Row Level Security |
| **AI** | OpenAI GPT-4o-mini |
| **Payments** | Stripe |
| **Deployment** | Vercel |
| **i18n** | next-intl (EN/FR) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account
- An [OpenAI](https://platform.openai.com) API key
- A [Stripe](https://stripe.com) account (for billing features)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/orchestr.git
cd orchestr

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Apply Row Level Security policies
psql $DATABASE_URL < supabase/policies.sql

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## Project Structure

```
orchestr/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Main application (protected)
│   │   ├── (marketing)/      # Public marketing pages
│   │   ├── (portals)/        # Candidate & client portals
│   │   └── api/              # API routes & webhooks
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── pipeline/         # Kanban components
│   │   ├── job-builder/      # Job form components
│   │   └── portals/          # Portal components
│   ├── lib/
│   │   ├── actions/          # Server actions (17 modules)
│   │   ├── ai/               # OpenAI integrations
│   │   ├── auth/             # Auth helpers
│   │   └── supabase/         # Supabase clients
│   ├── i18n/                 # Internationalization
│   └── types/                # TypeScript definitions
├── prisma/
│   ├── schema.prisma         # Database schema (source of truth)
│   └── migrations/           # Prisma migrations
├── supabase/
│   └── policies.sql          # Row Level Security policies
├── chrome-extension/         # LinkedIn capture extension
└── docs/                     # Documentation
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/architecture.md) | System design, components, and data flow |
| [Database](./docs/database.md) | Schema, relationships, and entity definitions |
| [API Reference](./docs/api.md) | API endpoints and webhooks |
| [Business Logic](./docs/business-logic.md) | Core workflows and rules |
| [Deployment](./docs/deployment.md) | Vercel & Supabase setup guide |
| [Security](./docs/security.md) | Authentication, RLS, and access control |
| [Chrome Extension](./docs/chrome-extension.md) | LinkedIn capture extension guide |

---

## Environment Variables

See [`.env.example`](./.env.example) for the complete list of required and optional environment variables.

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection (pooled) |
| `DIRECT_URL` | Supabase direct connection (migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Optional

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (AI features) |
| `STRIPE_SECRET_KEY` | Stripe secret key (billing) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `ENCRYPTION_KEY` | 64-char hex key for encryption |

---

## Development

```bash
# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database commands
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Create migration
npm run db:push       # Push schema (dev only)
npm run db:studio     # Open Prisma Studio
```

---

## Deployment

ORCHESTR is optimized for deployment on Vercel with Supabase.

1. **Push to GitHub**
2. **Import to Vercel** — Set environment variables
3. **Run migrations** — `npx prisma migrate deploy`
4. **Apply RLS policies** — Execute `supabase/policies.sql`

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│   Browser          Chrome Extension          External Portals           │
│      │                    │                        │                    │
└──────┼────────────────────┼────────────────────────┼────────────────────┘
       │                    │                        │
       ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│   Next.js App Router                                                     │
│   ├── Server Components (RSC)                                           │
│   ├── Server Actions                                                    │
│   ├── API Routes (Webhooks)                                             │
│   └── Middleware (Auth)                                                 │
└─────────────────────────────────────────────────────────────────────────┘
       │                    │                        │
       ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE                                      │
├─────────────────────────────────────────────────────────────────────────┤
│   Auth              PostgreSQL + RLS              Storage               │
│   (JWT)             (Prisma ORM)                  (Files)               │
└─────────────────────────────────────────────────────────────────────────┘
       │                    │                        │
       ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│   OpenAI             Stripe                Calendly                     │
│   (AI)               (Billing)             (Scheduling)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Subscription Plans

| Feature | Core | Pro | White-label |
|---------|:----:|:---:|:-----------:|
| Users | 3 | Unlimited | Unlimited |
| Missions | Unlimited | Unlimited | Unlimited |
| AI Calls/day | 50 | 500 | Unlimited |
| Custom Questionnaires | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ❌ | ✅ |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Proprietary — Sporrer © 2024
