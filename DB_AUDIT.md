# Database Audit Report - ORCHESTR

**Date**: December 2024  
**Auditor**: Automated DB Audit  
**Status**: ✅ COMPLETED

---

## Executive Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Database | PostgreSQL via Supabase | Properly configured with pooling |
| ORM | Prisma 6.19.1 | Singleton pattern, custom output |
| Hosting | Vercel serverless | Node.js runtime enforced |
| Migrations | Manual deploy | Safe for MVP stage |

---

## 1. Database Configuration

### 1.1 Database Provider
- **Type**: PostgreSQL 15+ (Supabase)
- **Connection Mode**: Transaction pooling via PgBouncer
- **Schema File**: `prisma/schema.prisma`
- **Generated Client**: `src/generated/prisma`

### 1.2 Connection Strings

| Variable | Purpose | Required Parameters |
|----------|---------|---------------------|
| `DATABASE_URL` | Pooled connection (runtime) | `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct connection (migrations) | None (uses session mode) |

**Format for Supabase**:
```
# DATABASE_URL (Transaction mode, port 6543)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# DIRECT_URL (Session mode, port 5432)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

---

## 2. Files Touching Database

### 2.1 Core Database Client
| File | Purpose |
|------|---------|
| `src/lib/prisma.ts` | Singleton client with retry logic |
| `src/lib/env.ts` | Environment validation |
| `src/lib/db-errors.ts` | Error categorization |

### 2.2 API Routes (8 files - all have `runtime = 'nodejs'`)
| File | Purpose |
|------|---------|
| `src/app/api/health/db/route.ts` | Health check endpoint |
| `src/app/api/auth/register/route.ts` | User registration |
| `src/app/auth/callback/route.ts` | OAuth callback |
| `src/app/api/extension/capture/route.ts` | Chrome extension API |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhook |
| `src/app/api/webhooks/calendly/route.ts` | Calendly webhook |
| `src/app/api/webhooks/meet/route.ts` | Google Meet webhook |
| `src/app/api/webhooks/zoom/route.ts` | Zoom webhook |

### 2.3 Server Actions (19 files)
Location: `src/lib/actions/`
- `candidates.ts`, `clients.ts`, `missions.ts`, `pools.ts`
- `pipeline.ts`, `tasks.ts`, `interviews.ts`, `shortlist.ts`
- `billing.ts`, `organizations.ts`, `portal.ts`, `reports.ts`
- `csv-import.ts`, `exports.ts`, `analytics.ts`, `search.ts`, `locale.ts`

### 2.4 Other DB-Using Files
| File | Purpose |
|------|---------|
| `src/app/(dashboard)/layout.tsx` | User lookup on page load |
| `src/lib/auth/helpers.ts` | Auth context with DB queries |
| `prisma/seed.ts` | Development seed script |

---

## 3. Critical Issues Fixed

### 3.1 Middleware Not Running (CRITICAL) ✅ FIXED
**Problem**: Auth middleware was in `src/proxy.ts` with wrong function name.  
**Fix**: Renamed to `src/middleware.ts` with `export async function middleware()`.

### 3.2 Missing Environment Validation (HIGH) ✅ FIXED
**Problem**: No validation of required env vars at startup.  
**Fix**: Created `src/lib/env.ts` with Zod validation.

### 3.3 No Explicit Runtime Declaration (MEDIUM) ✅ FIXED
**Problem**: DB routes could theoretically run on Edge runtime.  
**Fix**: Added `export const runtime = 'nodejs'` to all 8 API routes.

### 3.4 Missing Vercel Binary Targets (MEDIUM) ✅ FIXED
**Problem**: Prisma might fail on Vercel without Linux binaries.  
**Fix**: Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to schema.

### 3.5 Unprotected Health Check (LOW) ✅ FIXED
**Problem**: Health endpoint was publicly accessible.  
**Fix**: Added optional `HEALTH_CHECK_TOKEN` authentication.

---

## 4. Connection Management

### 4.1 Singleton Pattern
```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### 4.2 Retry Logic
The `withRetry()` helper handles transient errors:
- P1001: Can't reach database
- P1002: Connection timeout
- P1008: Operations timed out
- ECONNRESET, ETIMEDOUT

### 4.3 Recommended Connection String
```
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
```

---

## 5. Error Handling

### 5.1 Error Categories
| Category | HTTP Status | Retryable | Example Codes |
|----------|-------------|-----------|---------------|
| connection | 503 | Yes | P1001, ECONNREFUSED |
| timeout | 504 | Yes | P1002, P1008 |
| auth | 500 | No | P1010 |
| not_found | 404 | No | P2001, P2025 |
| constraint | 409/400 | No | P2002, P2003 |
| migration | 500 | No | P2021, P3006 |

### 5.2 User-Safe Messages
All error responses use French user-safe messages:
- No connection strings exposed
- No IP addresses or ports
- No authentication details

---

## 6. Environment Variables

### 6.1 Required (Server)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Pooled PostgreSQL connection |
| `DIRECT_URL` | Direct connection for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

### 6.2 Optional (Server)
| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Billing features |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `OPENAI_API_KEY` | AI scoring/messages |
| `ENCRYPTION_KEY` | LinkedIn data encryption (64 hex chars) |
| `HEALTH_CHECK_TOKEN` | Protect health endpoint |

---

## 7. Build & Deploy

### 7.1 Build Command
```json
{
  "build": "prisma generate && next build"
}
```

### 7.2 Post-Install Hook
```json
{
  "postinstall": "prisma generate"
}
```

### 7.3 Vercel Configuration
```json
{
  "buildCommand": "npm run build",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 7.4 Migration Deployment
Migrations are **manual** (recommended for MVP):
```bash
# Before deploying schema changes
npx prisma migrate deploy
```

---

## 8. Verification Commands

### 8.1 Local Development
```bash
# Validate Prisma schema
npx prisma validate

# Generate client
npx prisma generate

# TypeScript check
npx tsc --noEmit

# Full build
npm run build

# Start dev server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health/db
```

### 8.2 Vercel Production
```bash
# Health check (if token required)
curl "https://your-app.vercel.app/api/health/db?token=YOUR_TOKEN"

# Or via header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.vercel.app/api/health/db
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-23T12:00:00.000Z",
  "latencyMs": 45,
  "environment": "production"
}
```

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Connection exhaustion | Medium | `connection_limit=1` in URL |
| Cold start timeout | Low | 30s function timeout configured |
| Migration on deploy | Low | Manual migrations (safe) |
| Secrets in logs | Low | Error sanitization in `db-errors.ts` |

---

## 10. Recommendations

### 10.1 Short Term
- [ ] Run `prisma generate` after pulling schema changes
- [ ] Verify all env vars are set in Vercel dashboard
- [ ] Test health endpoint after each deploy

### 10.2 Medium Term
- [ ] Add GitHub Action for automated migration deploy
- [ ] Implement structured logging (e.g., Pino)
- [ ] Add Sentry for error monitoring

### 10.3 Long Term
- [ ] Consider Prisma Accelerate for connection pooling
- [ ] Add database backup verification
- [ ] Implement query performance monitoring

---

## Appendix: File Changes Made

| File | Change |
|------|--------|
| `src/proxy.ts` | **Deleted** |
| `src/middleware.ts` | **Created** - Fixed auth middleware |
| `src/lib/env.ts` | **Created** - Environment validation |
| `src/lib/db-errors.ts` | **Created** - Error categorization |
| `src/lib/prisma.ts` | **Updated** - Connection hardening |
| `prisma/schema.prisma` | **Updated** - Added binaryTargets |
| `src/app/api/health/db/route.ts` | **Updated** - Token protection |
| `src/app/api/*/route.ts` (8 files) | **Updated** - Added `runtime = 'nodejs'` |

