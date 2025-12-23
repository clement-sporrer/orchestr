# ORCHESTR - Recruitment Orchestration Platform

A modern, complete recruitment management platform for recruitment agencies. Built with Next.js 14, Supabase, and AI-powered features.

## Features

- **Client CRM**: Manage client accounts and contacts
- **Job Builder**: Multi-audience job descriptions with visibility controls
- **Candidate Database**: Unified talent pool with tags, history, and deduplication
- **CSV Import**: Smart import with auto-mapping and duplicate detection
- **Pipeline Management**: Kanban board and list view with drag-and-drop
- **AI Features**: Candidate scoring, profile structuring, message generation
- **Candidate Portal**: Mobile-friendly guided experience
- **Client Portal**: Shortlist review with structured feedback
- **Calendly Integration**: Automatic interview scheduling
- **Questionnaires**: Custom forms per mission
- **Analytics**: KPI dashboard and event tracking
- **GDPR Compliance**: Data export, deletion, and retention policies

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- An OpenAI API key
- (Optional) A Calendly account

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - Supabase PostgreSQL connection string (pooled)
   - `DIRECT_URL` - Supabase direct connection (for migrations)
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `OPENAI_API_KEY` - OpenAI API key

3. **Initialize the database** (see Database Migrations below):
   ```bash
   npx prisma migrate dev
   ```

4. **Apply Row Level Security policies**:
   ```bash
   # Using Supabase CLI or SQL Editor in Dashboard
   psql $DATABASE_URL < supabase/policies.sql
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Create First User

1. Create a user in Supabase Auth (Dashboard > Authentication > Users)
2. Create matching records in the database:
   ```sql
   INSERT INTO organizations (id, name) 
   VALUES ('org_1', 'My Agency');
   
   -- Note: auth_user_id should match the Supabase Auth user's id
   INSERT INTO users (id, organization_id, auth_user_id, email, name, role) 
   VALUES ('user_1', 'org_1', 'your-supabase-auth-uuid', 'your@email.com', 'Your Name', 'ADMIN');
   ```

## Database Migrations

ORCHESTR uses Prisma Migrate for database schema management. The schema is defined in `prisma/schema.prisma`.

### Development Workflow

Create and apply migrations during development:

```bash
# Create a new migration based on schema changes
npx prisma migrate dev --name descriptive_migration_name

# Apply pending migrations
npx prisma migrate dev
```

### Production Deployment

Apply migrations in production environments:

```bash
# Apply all pending migrations (does not create new ones)
npx prisma migrate deploy
```

### Quick Prototyping (Not Recommended for Production)

For rapid local prototyping only, you can push schema changes directly:

```bash
# WARNING: This skips migration history and may cause data loss
# Only use for throwaway local development
npm run db:push
```

**Important**: Do not use `db:push` in production or shared environments. Always use proper migrations.

### Baseline an Existing Database

If you have an existing database that was set up with `db:push`, baseline it before using migrations:

```bash
# Generate a baseline migration from current DB state
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0000_baseline/migration.sql

# Mark the baseline as applied
npx prisma migrate resolve --applied 0000_baseline
```

## Row Level Security (RLS)

ORCHESTR uses Supabase RLS for multi-tenant data isolation. All domain data is scoped by `organizationId`.

### Setup

RLS policies are defined in `supabase/policies.sql`. Apply them after migrations:

```bash
# Via Supabase CLI
supabase db push

# Or via psql
psql $DATABASE_URL < supabase/policies.sql
```

### How It Works

1. The `current_org_id()` helper function looks up the authenticated user's organization
2. Each table has policies that check `organization_id = current_org_id()`
3. Users can only access data belonging to their organization

For detailed documentation, see `docs/database-logic.md`.

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Supabase Setup

1. Create a new Supabase project
2. Apply migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Apply RLS policies:
   ```bash
   psql $DATABASE_URL < supabase/policies.sql
   ```
4. Verify RLS is enabled on all tables in Supabase Dashboard

## Project Structure

```
orchestr/
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login, password reset
│   │   ├── (dashboard)/    # Main app (protected)
│   │   ├── (portals)/      # Candidate/client portals
│   │   └── api/            # Webhooks
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── pipeline/       # Kanban components
│   │   ├── job-builder/    # Job form components
│   │   └── portals/        # Portal components
│   ├── lib/
│   │   ├── actions/        # Server actions
│   │   ├── ai/             # OpenAI integrations
│   │   └── supabase/       # Supabase clients
│   └── types/
├── prisma/
│   ├── schema.prisma       # Database schema (source of truth)
│   └── migrations/         # Prisma migrations
├── supabase/
│   └── policies.sql        # RLS policies and helper functions
├── docs/
│   └── database-logic.md   # Database architecture documentation
└── public/
```

## Documentation

- `docs/database-logic.md` - Database architecture, entity definitions, and access model

## License

Proprietary - Sporrer
