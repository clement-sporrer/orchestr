# Database Release Checklist - ORCHESTR

Use this checklist before every production deployment that involves database changes.

---

## Pre-Deployment

### 1. Schema Changes
- [ ] **Review schema changes** in `prisma/schema.prisma`
- [ ] **Run locally**: `npx prisma validate`
- [ ] **Generate client**: `npx prisma generate`
- [ ] **Test migration locally**: `npx prisma migrate dev --name description`

### 2. Migration Review
- [ ] **Check migration SQL** in `prisma/migrations/[timestamp]/migration.sql`
- [ ] **Verify no destructive changes** (DROP TABLE, DROP COLUMN) without backup
- [ ] **Test rollback plan** if applicable

### 3. Environment Variables
- [ ] **Verify Vercel Production** has all required vars:
  - `DATABASE_URL` (with `?pgbouncer=true&connection_limit=1`)
  - `DIRECT_URL` (for migrations)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Verify Vercel Preview** has matching vars

### 4. Local Verification
```bash
# Run all checks
npx prisma validate
npx prisma generate
npx tsc --noEmit
npm run build
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health/db
```

---

## Deployment

### 5. Run Migration (BEFORE deploying code)
```bash
# Connect to production database
export DATABASE_URL="your-production-url"

# Deploy migrations
npx prisma migrate deploy

# Verify migration applied
npx prisma migrate status
```

### 6. Deploy Code
- [ ] **Push to main branch** or trigger Vercel deploy
- [ ] **Wait for build to complete** in Vercel dashboard
- [ ] **Check build logs** for any Prisma errors

---

## Post-Deployment

### 7. Health Check
```bash
# Replace with your production URL and token
curl "https://your-app.vercel.app/api/health/db?token=YOUR_TOKEN"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "latencyMs": <number>,
  "environment": "production"
}
```

### 8. Functional Verification
- [ ] **Login works** (auth flow uses DB)
- [ ] **Dashboard loads** (user lookup)
- [ ] **Create test record** (insert works)
- [ ] **Read test record** (select works)
- [ ] **Update test record** (update works)
- [ ] **Delete test record** (delete works)

### 9. Monitor Logs
- [ ] **Check Vercel Functions logs** for DB errors
- [ ] **Look for error codes**: P1001 (connection), P2002 (constraint), etc.
- [ ] **Monitor latency** in health check response

---

## Rollback Procedure

If issues occur:

### 1. Immediate (Code Rollback)
```bash
# In Vercel dashboard: Deployments → Previous → Promote to Production
# Or via CLI:
vercel rollback
```

### 2. Database Rollback (If migration caused issues)
```sql
-- Connect directly to database
-- Run reverse migration SQL (keep in migration folder as rollback.sql)
```

### 3. Emergency Contact
- Supabase Status: https://status.supabase.com
- Vercel Status: https://www.vercel-status.com

---

## Common Issues & Solutions

### Connection Timeout (P1002)
```bash
# Check if database is accessible
psql $DATABASE_URL -c "SELECT 1"

# Verify connection string format
echo $DATABASE_URL | grep "pgbouncer=true"
```

### Migration Failed (P3006)
```bash
# Check migration status
npx prisma migrate status

# Reset if needed (DEV ONLY)
npx prisma migrate reset
```

### Schema Drift
```bash
# Compare schema with database
npx prisma db pull --force

# Review differences
git diff prisma/schema.prisma
```

---

## Quick Reference

### Required Environment Variables
| Variable | Format |
|----------|--------|
| `DATABASE_URL` | `postgresql://...?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | `postgresql://...` (no pgbouncer param) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |

### Key Commands
```bash
npx prisma validate          # Check schema syntax
npx prisma generate          # Generate client
npx prisma migrate dev       # Create + apply migration (dev)
npx prisma migrate deploy    # Apply migrations (prod)
npx prisma migrate status    # Check migration status
npx prisma db push           # Push schema without migration
npx prisma studio            # Open database GUI
```

### Vercel Build Command
```
prisma generate && next build
```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Reviewer | | | |

---

*Last updated: December 2024*

