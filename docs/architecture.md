# Architecture

> System design, components, and data flow

---

## Overview

ORCHESTR is a multi-tenant SaaS platform built with a modern serverless architecture. It leverages Next.js App Router for full-stack capabilities, Supabase for authentication and database, and Vercel for edge deployment.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│   │   Browser   │    │   Chrome    │    │  Candidate  │    │   Client    │      │
│   │   (React)   │    │  Extension  │    │   Portal    │    │   Portal    │      │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│          │                  │                  │                  │              │
└──────────┼──────────────────┼──────────────────┼──────────────────┼──────────────┘
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APPLICATION LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         VERCEL EDGE NETWORK                              │   │
│   ├─────────────────────────────────────────────────────────────────────────┤   │
│   │                                                                          │   │
│   │   ┌───────────────────┐    ┌───────────────────┐                        │   │
│   │   │     MIDDLEWARE    │    │    STATIC ASSETS   │                       │   │
│   │   │   (Auth Check)    │    │   (CDN Cached)     │                       │   │
│   │   └─────────┬─────────┘    └───────────────────┘                        │   │
│   │             │                                                            │   │
│   │             ▼                                                            │   │
│   │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│   │   │                    NEXT.JS APP ROUTER                            │   │   │
│   │   ├─────────────────────────────────────────────────────────────────┤   │   │
│   │   │                                                                  │   │   │
│   │   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │   │
│   │   │  │   SERVER    │  │   SERVER    │  │    API      │              │   │   │
│   │   │  │ COMPONENTS  │  │   ACTIONS   │  │   ROUTES    │              │   │   │
│   │   │  │   (RSC)     │  │  (RPC)      │  │ (Webhooks)  │              │   │   │
│   │   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │   │   │
│   │   │         │                │                │                      │   │   │
│   │   └─────────┼────────────────┼────────────────┼──────────────────────┘   │   │
│   │             │                │                │                          │   │
│   └─────────────┼────────────────┼────────────────┼──────────────────────────┘   │
│                 │                │                │                              │
└─────────────────┼────────────────┼────────────────┼──────────────────────────────┘
                  │                │                │
                  ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                           SUPABASE                                       │   │
│   ├─────────────────────────────────────────────────────────────────────────┤   │
│   │                                                                          │   │
│   │   ┌─────────────┐    ┌─────────────────────┐    ┌─────────────┐         │   │
│   │   │    AUTH     │    │     POSTGRESQL      │    │   STORAGE   │         │   │
│   │   │   (JWT)     │    │  (Prisma + RLS)     │    │   (Files)   │         │   │
│   │   └─────────────┘    └─────────────────────┘    └─────────────┘         │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                  │                │                │
                  ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│   │   OPENAI    │    │   STRIPE    │    │  CALENDLY   │    │  LINKEDIN   │      │
│   │  GPT-4o-mini│    │  Payments   │    │ Scheduling  │    │   (read)    │      │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Application Layers

### 1. Presentation Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| React Components | React 19 | UI rendering |
| Server Components | RSC | Server-side rendering with streaming |
| Tailwind CSS | v4 | Styling |
| shadcn/ui | Radix + Tailwind | Component library |
| next-intl | Localization | English/French support |

### 2. Application Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Server Actions | Next.js | Data mutations (RPC-style) |
| API Routes | Next.js | Webhooks and external APIs |
| Middleware | Next.js | Authentication, redirects |
| React Query | TanStack Query | Client-side data fetching |

### 3. Data Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Prisma ORM | v6 | Database access and migrations |
| PostgreSQL | Supabase | Primary data store |
| Row Level Security | SQL policies | Multi-tenant data isolation |
| Connection Pooling | PgBouncer | Serverless connection management |

---

## Component Architecture

### Route Groups

```
src/app/
├── (auth)/              # Authentication flows
│   ├── login/           # Email/password login
│   ├── register/        # New user registration
│   ├── reset-password/  # Password reset flow
│   └── check-email/     # Email verification
│
├── (dashboard)/         # Protected application
│   ├── dashboard/       # Main dashboard
│   ├── clients/         # Client CRM
│   ├── missions/        # Job management
│   ├── candidates/      # Talent database
│   ├── pools/           # Candidate pools
│   ├── import/          # CSV import
│   ├── tasks/           # Task management
│   ├── settings/        # User/org settings
│   └── onboarding/      # First-time setup
│
├── (marketing)/         # Public pages
│   ├── page.tsx         # Landing page
│   ├── pricing/         # Pricing page
│   ├── product/         # Product features
│   └── legal/           # Terms & privacy
│
├── (portals)/           # External portals
│   ├── candidate/       # Candidate portal
│   └── client/          # Client portal
│
└── api/                 # API routes
    ├── auth/            # Auth callbacks
    ├── extension/       # Chrome extension API
    ├── health/          # Health checks
    ├── settings/        # Settings API
    └── webhooks/        # External webhooks
```

### Server Actions Structure

```
src/lib/actions/
├── analytics.ts         # Event tracking
├── billing.ts           # Stripe operations
├── candidates.ts        # Candidate CRUD
├── clients.ts           # Client CRUD
├── csv-import.ts        # CSV processing
├── exports.ts           # Data exports
├── interviews.ts        # Interview management
├── locale.ts            # Language settings
├── missions.ts          # Mission CRUD
├── organizations.ts     # Org settings
├── pipeline.ts          # Pipeline operations
├── pools.ts             # Pool management
├── portal.ts            # Portal operations
├── reports.ts           # Report generation
├── search.ts            # Global search
├── shortlist.ts         # Shortlist management
└── tasks.ts             # Task CRUD
```

---

## Data Flow

### Authentication Flow

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│ Browser │────▶│  Middleware │────▶│  Supabase   │────▶│ Database │
└─────────┘     └─────────────┘     │    Auth     │     └──────────┘
     │                │              └─────────────┘          │
     │                │                    │                  │
     │                ▼                    ▼                  │
     │          ┌─────────────┐     ┌─────────────┐          │
     │          │   Redirect  │     │    JWT      │          │
     │          │  to /login  │     │   Token     │          │
     │          └─────────────┘     └─────────────┘          │
     │                                    │                  │
     ▼                                    ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RLS Policy Enforcement                        │
│                                                                  │
│   current_org_id() = SELECT organizationId                      │
│                      FROM users                                  │
│                      WHERE auth_user_id = auth.uid()            │
└─────────────────────────────────────────────────────────────────┘
```

### Server Action Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. User triggers action (button click, form submit)           │
│                          │                                       │
│                          ▼                                       │
│   2. React calls Server Action with form data                   │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Vercel)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   3. Server Action receives request                             │
│                          │                                       │
│                          ▼                                       │
│   4. Authenticate user via Supabase                             │
│                          │                                       │
│                          ▼                                       │
│   5. Execute Prisma query (RLS enforced)                        │
│                          │                                       │
│                          ▼                                       │
│   6. Return result or revalidate path                           │
│                                                                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   7. UI updates with new data (React re-renders)                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy

### Organization Isolation

Every piece of domain data is scoped to an organization:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORGANIZATION A                              │
├─────────────────────────────────────────────────────────────────┤
│  Users    │  Clients  │  Missions  │  Candidates  │  Pools     │
├───────────┼───────────┼────────────┼──────────────┼────────────┤
│  User 1   │  ClientA  │  Mission1  │  Candidate1  │  Pool1     │
│  User 2   │  ClientB  │  Mission2  │  Candidate2  │  Pool2     │
└───────────┴───────────┴────────────┴──────────────┴────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ORGANIZATION B                              │
├─────────────────────────────────────────────────────────────────┤
│  Users    │  Clients  │  Missions  │  Candidates  │  Pools     │
├───────────┼───────────┼────────────┼──────────────┼────────────┤
│  User 3   │  ClientC  │  Mission3  │  Candidate3  │  Pool3     │
│  User 4   │  ClientD  │  Mission4  │  Candidate4  │  Pool4     │
└───────────┴───────────┴────────────┴──────────────┴────────────┘
```

### RLS Enforcement

```sql
-- Every table with organizationId enforces:
CREATE POLICY "org_isolation" ON table_name
  FOR ALL USING (organization_id = current_org_id());

-- current_org_id() looks up the authenticated user's org:
CREATE FUNCTION current_org_id() RETURNS TEXT AS $$
  SELECT "organizationId" FROM users
  WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## Serverless Considerations

### Connection Pooling

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Function   │     │  Function   │     │  Function   │
│  Instance 1 │     │  Instance 2 │     │  Instance N │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │      PGBOUNCER          │
              │   Connection Pooler     │
              │   (port 6543)           │
              └───────────┬─────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │      POSTGRESQL         │
              │   (Supabase)            │
              │   (port 5432)           │
              └─────────────────────────┘
```

### Configuration

```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

- Each serverless function uses **1 connection**
- PgBouncer manages connection reuse
- Direct URL (port 5432) used only for migrations

---

## External Integrations

### Chrome Extension

```
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│  LinkedIn   │  scrape  │   Chrome    │   POST   │  ORCHESTR   │
│   Page      │────────▶│  Extension  │────────▶│    API      │
└─────────────┘          └─────────────┘          └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Candidate  │
                                                  │  Database   │
                                                  └─────────────┘
```

### Webhook Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   STRIPE    │────▶│  /api/      │────▶│  Database   │
│   Event     │     │  webhooks/  │     │  Update     │
└─────────────┘     │  stripe     │     └─────────────┘
                    └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  CALENDLY   │────▶│  /api/      │────▶│  Interview  │
│   Event     │     │  webhooks/  │     │  Created    │
└─────────────┘     │  calendly   │     └─────────────┘
```

---

## Scalability

### Current Architecture Limits

| Component | Limit | Mitigation |
|-----------|-------|------------|
| Serverless Functions | 10s default, 30s max | Async processing for heavy tasks |
| Database Connections | ~100 pooled | PgBouncer + connection_limit=1 |
| Cold Starts | ~500ms-2s | Vercel edge caching, lazy loading |

### Future Scaling Options

1. **Prisma Accelerate** — Query caching and connection management
2. **Background Jobs** — Inngest or Trigger.dev for async processing
3. **Read Replicas** — Database read scaling
4. **Edge Functions** — For latency-sensitive operations

---

## Security Architecture

See [Security Documentation](./security.md) for:
- Authentication flow details
- Row Level Security policies
- External portal access tokens
- Encryption standards


