# Deployment

> Vercel & Supabase setup guide

---

## Overview

ORCHESTR is optimized for deployment on:
- **Vercel** — Serverless hosting and edge network
- **Supabase** — PostgreSQL database, authentication, and storage

---

## Prerequisites

- [Vercel](https://vercel.com) account
- [Supabase](https://supabase.com) account
- [Stripe](https://stripe.com) account (for billing)
- [OpenAI](https://platform.openai.com) API key (for AI features)

---

## Supabase Setup

### 1. Create Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Configure:
   - Project name: `orchestr-production`
   - Database password: Generate strong password
   - Region: Choose closest to your users
4. Wait for project initialization (~2 minutes)

### 2. Get Connection Strings

In **Project Settings → Database**:

```bash
# Transaction mode (for application)
# Port 6543 - Use PgBouncer for connection pooling
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Session mode (for migrations only)
# Port 5432 - Direct connection
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

### 3. Get API Keys

In **Project Settings → API**:

| Key | Variable |
|-----|----------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` |

### 4. Run Migrations

```bash
# Set environment variables
export DATABASE_URL="your-transaction-mode-url"
export DIRECT_URL="your-session-mode-url"

# Apply migrations
npx prisma migrate deploy

# Apply RLS policies
psql $DIRECT_URL < supabase/policies.sql
```

### 5. Verify RLS

In Supabase Dashboard → **Table Editor**:
- Check that all tables have "RLS Enabled" badge
- Test with SQL Editor:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## Vercel Setup

### 1. Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import from GitHub repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `.` (or subdirectory if monorepo)

### 2. Environment Variables

Add in **Settings → Environment Variables**:

#### Required Variables

| Variable | Value | Environments |
|----------|-------|--------------|
| `DATABASE_URL` | Supabase pooled URL | Production, Preview |
| `DIRECT_URL` | Supabase direct URL | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | Production, Preview |

#### Optional Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | OpenAI key | AI features |
| `STRIPE_SECRET_KEY` | Stripe secret | Billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook | Billing |
| `STRIPE_PRICE_CORE_4WEEKS` | Stripe price ID | Billing |
| `STRIPE_PRICE_CORE_ANNUAL` | Stripe price ID | Billing |
| `STRIPE_PRICE_PRO_4WEEKS` | Stripe price ID | Billing |
| `STRIPE_PRICE_PRO_ANNUAL` | Stripe price ID | Billing |
| `NEXT_PUBLIC_APP_URL` | Your domain | Billing redirects |
| `ENCRYPTION_KEY` | 64-char hex | Encryption |
| `HEALTH_CHECK_TOKEN` | Random string | Health endpoint |

### 3. Build Settings

Default settings work, but verify:

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Development Command | `npm run dev` |

### 4. Deploy

1. Push to main branch, or
2. Click **Deploy** in Vercel dashboard

### 5. Custom Domain (Optional)

1. Go to **Settings → Domains**
2. Add your domain
3. Configure DNS as instructed
4. SSL is automatic

---

## Stripe Setup

### 1. Create Products

In Stripe Dashboard → **Products**:

Create products and prices:

| Product | Price ID Variable | Amount |
|---------|-------------------|--------|
| Core 4-week | `STRIPE_PRICE_CORE_4WEEKS` | €45 |
| Core Annual | `STRIPE_PRICE_CORE_ANNUAL` | €499 |
| Pro 4-week | `STRIPE_PRICE_PRO_4WEEKS` | €82 |
| Pro Annual | `STRIPE_PRICE_PRO_ANNUAL` | €899 |

### 2. Configure Webhook

In Stripe Dashboard → **Developers → Webhooks**:

1. Click **Add endpoint**
2. URL: `https://your-domain.com/api/webhooks/stripe`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### 3. Test Mode

Use test mode first:
- Test cards: `4242 4242 4242 4242`
- Switch to live mode when ready

---

## Database Migrations

### Development Workflow

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Apply migration
npx prisma migrate dev
```

### Production Deployment

**Option A: Manual (Recommended for MVP)**

Before deploying code with schema changes:

```bash
export DATABASE_URL="production-url"
npx prisma migrate deploy
```

**Option B: GitHub Action**

```yaml
# .github/workflows/migrate.yml
name: Database Migration
on:
  push:
    branches: [main]
    paths: ['prisma/migrations/**']

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Health Checks

### Database Health

```bash
# Without auth
curl https://your-domain.com/api/health/db

# With auth (if HEALTH_CHECK_TOKEN is set)
curl "https://your-domain.com/api/health/db?token=YOUR_TOKEN"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-28T12:00:00.000Z",
  "latencyMs": 45,
  "environment": "production"
}
```

### Uptime Monitoring

Configure in your monitoring service (UptimeRobot, Pingdom, etc.):
- URL: `https://your-domain.com/api/health/db`
- Interval: 5 minutes
- Alert on: `status !== "ok"`

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured in Vercel
- [ ] Supabase project created and configured
- [ ] RLS policies applied
- [ ] Stripe products and webhook configured
- [ ] Custom domain (if applicable)

### Deployment

- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Push to main branch
- [ ] Wait for Vercel build
- [ ] Check build logs for errors

### Post-Deployment

- [ ] Verify health check endpoint
- [ ] Test login flow
- [ ] Test database operations (create/read/update)
- [ ] Test Stripe checkout (test mode)
- [ ] Test AI features (if configured)
- [ ] Monitor Vercel function logs

---

## Rollback Procedures

### Code Rollback

In Vercel Dashboard:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **...** → **Promote to Production**

Or via CLI:
```bash
vercel rollback
```

### Database Rollback

If a migration causes issues:

1. Identify the problematic migration
2. Write reverse SQL
3. Apply directly to database:
```bash
psql $DATABASE_URL < rollback.sql
```

---

## Performance Optimization

### Serverless Limits

| Limit | Value | Mitigation |
|-------|-------|------------|
| Function timeout | 10s (30s for API) | Async processing |
| Cold start | ~500ms-2s | Keep functions warm |
| Connections | ~100 pooled | Use `connection_limit=1` |

### Recommendations

1. **Connection pooling**: Always use `?pgbouncer=true&connection_limit=1`
2. **Edge caching**: Leverage Vercel's CDN for static assets
3. **ISR**: Use Incremental Static Regeneration for semi-static pages
4. **Lazy loading**: Load heavy components dynamically

---

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → **Analytics**:
- Web Vitals (LCP, FID, CLS)
- Function performance
- Error tracking

### Database Monitoring

In Supabase Dashboard:
- Query performance
- Connection usage
- Storage usage

### Error Tracking (Recommended)

Consider adding Sentry:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
});
```

---

## Troubleshooting

### Common Issues

#### P1001: Can't reach database

- Check `DATABASE_URL` format
- Verify Supabase project is running
- Check IP allowlist (if configured)

#### P1002: Connection timeout

- Add `?pgbouncer=true&connection_limit=1`
- Check Supabase connection limits

#### Build fails with Prisma error

- Ensure `prisma generate` runs in build command
- Check `binaryTargets` includes `rhel-openssl-3.0.x`

#### RLS blocking all queries

- Verify `current_org_id()` function exists
- Check user has matching `auth_user_id`
- Test with service role to bypass RLS

### Debug Queries

```sql
-- Check current user context
SELECT auth.uid(), current_org_id();

-- Test RLS policy
SET ROLE authenticated;
SELECT * FROM candidates LIMIT 1;
```

---

## Environment Reference

See [`.env.example`](../.env.example) for complete variable list.

