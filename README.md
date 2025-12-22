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
   - `DATABASE_URL` - Supabase PostgreSQL connection string
   - `DIRECT_URL` - Supabase direct connection (for migrations)
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   - `OPENAI_API_KEY` - OpenAI API key

3. **Initialize the database**:
   ```bash
   npm run db:push
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Create First User

1. Create a user in Supabase Auth (Dashboard > Authentication > Users)
2. Create matching records in the database:
   ```sql
   INSERT INTO organizations (id, name) 
   VALUES ('org_1', 'My Agency');
   
   INSERT INTO users (id, organization_id, email, name, role) 
   VALUES ('user_1', 'org_1', 'your@email.com', 'Your Name', 'ADMIN');
   ```

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy

### Supabase Setup

1. Create a new Supabase project
2. Run migrations: `npm run db:push`
3. Set up Row Level Security policies (see `supabase/policies.sql`)

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
│   └── schema.prisma       # Database schema
└── public/
```

## License

Proprietary - Sporrer
