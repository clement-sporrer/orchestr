# Security

> Authentication, RLS, and access control

---

## Overview

ORCHESTR implements a multi-layered security model:

1. **Authentication** — Supabase Auth with JWT tokens
2. **Authorization** — Row Level Security (RLS) at database level
3. **Multi-tenancy** — Complete data isolation per organization
4. **External Access** — Hashed tokens for portals

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   1. User enters credentials                                                    │
│      │                                                                          │
│      ▼                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                         SUPABASE AUTH                                    │   │
│   │  - Validates email/password                                             │   │
│   │  - Creates JWT token                                                    │   │
│   │  - Sets HTTP-only cookies                                               │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                          │
│      ▼                                                                          │
│   2. Every request includes cookies                                             │
│      │                                                                          │
│      ▼                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          MIDDLEWARE                                      │   │
│   │  - Validates JWT token                                                  │   │
│   │  - Refreshes if needed                                                  │   │
│   │  - Redirects if unauthenticated                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│      │                                                                          │
│      ▼                                                                          │
│   3. Request reaches Server Action                                              │
│      │                                                                          │
│      ▼                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          DATABASE                                        │   │
│   │  - auth.uid() available from JWT                                        │   │
│   │  - RLS policies enforce organization scope                              │   │
│   │  - Only authorized data returned                                        │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### JWT Token Contents

```json
{
  "aud": "authenticated",
  "exp": 1735344000,
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "authenticated"
}
```

### Session Management

- Tokens stored in HTTP-only cookies
- Automatic refresh before expiration
- Middleware handles token lifecycle
- No client-side token storage

---

## Row Level Security (RLS)

### How RLS Works

```sql
-- Every table with organizationId has policies like:
CREATE POLICY "org_isolation" ON candidates
  FOR ALL USING (organization_id = current_org_id());

-- current_org_id() looks up the user's organization:
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS TEXT AS $$
  SELECT "organizationId"
  FROM public.users
  WHERE "auth_user_id" = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### RLS Policy Matrix

| Table | Policy Type | Condition |
|-------|-------------|-----------|
| `organizations` | Direct | `id = current_org_id()` |
| `users` | Direct | `organizationId = current_org_id()` |
| `clients` | Direct | `organizationId = current_org_id()` |
| `missions` | Direct | `organizationId = current_org_id()` |
| `candidates` | Direct | `organizationId = current_org_id()` |
| `pools` | Direct | `organizationId = current_org_id()` |
| `contacts` | Via Client | `client.organizationId = current_org_id()` |
| `mission_candidates` | Via Mission | `mission.organizationId = current_org_id()` |
| `interviews` | Via MissionCandidate | Chain through mission |
| `shortlists` | Via Mission | `mission.organizationId = current_org_id()` |

### Policy Examples

```sql
-- Direct organization check
CREATE POLICY "candidates_select" ON candidates
  FOR SELECT USING ("organizationId" = current_org_id());

-- Via relationship (contacts through clients)
CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = contacts."clientId"
      AND c."organizationId" = current_org_id()
    )
  );

-- Deep relationship (interviews through mission_candidates)
CREATE POLICY "interviews_select" ON interviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mission_candidates mc
      JOIN missions m ON m.id = mc."missionId"
      WHERE mc.id = interviews."missionCandidateId"
      AND m."organizationId" = current_org_id()
    )
  );
```

---

## Multi-Tenancy

### Data Isolation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA ISOLATION                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        ORGANIZATION A                                    │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│   │  │ User 1  │ │ Client1 │ │Mission1 │ │Candidate│ │  Pool1  │           │   │
│   │  │ User 2  │ │ Client2 │ │Mission2 │ │Candidate│ │  Pool2  │           │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    │ NO ACCESS                                  │
│                                    ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        ORGANIZATION B                                    │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│   │  │ User 3  │ │ Client3 │ │Mission3 │ │Candidate│ │  Pool3  │           │   │
│   │  │ User 4  │ │ Client4 │ │Mission4 │ │Candidate│ │  Pool4  │           │   │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Cross-Tenant Data

Only `linkedin_cache` is shared across organizations (public profile data).

---

## External Portal Access

### Token-Based Access

External portals (candidate and client) use hashed tokens:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL TOKEN FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   1. GENERATION                                                                 │
│      ┌─────────────┐                                                            │
│      │ Create      │───▶ Raw Token: "abc123..." (sent to user)                 │
│      │ Token       │───▶ Hash: SHA-256(raw) (stored in DB)                     │
│      └─────────────┘                                                            │
│                                                                                  │
│   2. STORAGE                                                                    │
│      ┌─────────────────────────────────────────────────────────────────────┐    │
│      │ external_access_tokens                                               │    │
│      │ ┌─────────────┬─────────────┬─────────────┬─────────────┐           │    │
│      │ │ id          │ tokenHash   │ expiresAt   │ missionId   │           │    │
│      │ │ uuid        │ sha256...   │ 2025-01-27  │ cuid...     │           │    │
│      │ └─────────────┴─────────────┴─────────────┴─────────────┘           │    │
│      └─────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│   3. VALIDATION (Server-side only)                                              │
│      ┌─────────────┐                                                            │
│      │ Incoming    │                                                            │
│      │ Request     │                                                            │
│      └──────┬──────┘                                                            │
│             │                                                                    │
│             ▼                                                                    │
│      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                   │
│      │ Hash token  │────▶│ Lookup hash │────▶│ Check       │                   │
│      │ SHA-256     │     │ in DB       │     │ expiration  │                   │
│      └─────────────┘     └─────────────┘     └─────────────┘                   │
│             │                   │                   │                           │
│             └───────────────────┴───────────────────┘                           │
│                                 │                                               │
│                                 ▼                                               │
│                          ┌─────────────┐                                        │
│                          │ Return data │                                        │
│                          │ or 401      │                                        │
│                          └─────────────┘                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Token Types

| Type | Purpose | References |
|------|---------|------------|
| `CANDIDATE_PORTAL` | Candidate accesses their application | `missionCandidateId` |
| `CLIENT_PORTAL` | Client accesses shortlist | `missionId` |

### Security Properties

- Raw token never stored (only SHA-256 hash)
- Tokens expire (default: 30 days)
- Tokens can be revoked (`revokedAt` field)
- Validation bypasses RLS (uses service role)
- One-time regeneration possible

---

## User Roles

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER ROLES                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ADMIN                                                                         │
│   ├── All RECRUITER permissions                                                │
│   ├── Manage organization settings                                             │
│   ├── Manage users                                                             │
│   ├── Manage billing                                                           │
│   └── Access analytics                                                         │
│                                                                                  │
│   RECRUITER                                                                     │
│   ├── CRUD on clients                                                          │
│   ├── CRUD on missions                                                         │
│   ├── CRUD on candidates                                                       │
│   ├── CRUD on pools                                                            │
│   ├── Manage pipeline                                                          │
│   └── Use AI features                                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Role Enforcement

Currently enforced at application level (Server Actions).
RLS provides organization-level isolation, not role-based restrictions.

---

## Data Encryption

### At Rest

- Database encrypted by Supabase (AES-256)
- Storage encrypted by Supabase

### In Transit

- TLS 1.3 for all connections
- HTTPS enforced by Vercel

### Application-Level Encryption

LinkedIn OAuth tokens are encrypted:

```typescript
// Uses ENCRYPTION_KEY (64-char hex = 256 bits)
import { encrypt, decrypt } from '@/lib/utils/encryption'

// Encrypt before storing
const encryptedToken = encrypt(accessToken)

// Decrypt when needed
const accessToken = decrypt(encryptedToken)
```

---

## Security Headers

Configured in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Recommended Additions

```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
},
{
  "key": "Referrer-Policy",
  "value": "strict-origin-when-cross-origin"
},
{
  "key": "Permissions-Policy",
  "value": "camera=(), microphone=(), geolocation=()"
}
```

---

## GDPR Compliance

### Data Rights

| Right | Implementation |
|-------|----------------|
| Access | Export all candidate data |
| Rectification | Edit candidate profile |
| Erasure | Soft delete → hard delete after retention |
| Portability | JSON/CSV export |

### Consent Tracking

```prisma
model Candidate {
  consentGiven  Boolean   @default(false)
  consentDate   DateTime?
  consentText   String?   // Version of consent text
}
```

### Data Retention

| Data Type | Default Retention | Action |
|-----------|-------------------|--------|
| Active candidates | 365 days | Anonymize |
| Ignored candidates | 90 days | Delete |
| Interactions | With candidate | Delete |
| Events | 2 years | Aggregate |

---

## API Security

### Authentication Methods

| Endpoint Type | Authentication |
|---------------|----------------|
| Server Actions | Supabase session (cookies) |
| API Routes | Supabase session or service role |
| Webhooks | Signature verification |
| Chrome Extension | Email + organization lookup |

### Webhook Verification

```typescript
// Stripe webhook
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

### Rate Limiting

- Vercel applies default rate limits
- AI features have daily quotas per plan
- No custom rate limiting implemented yet

---

## Audit Trail

### Event Tracking

All significant actions are logged:

```typescript
await prisma.event.create({
  data: {
    organizationId,
    name: 'candidate.updated',
    userId,
    candidateId,
    properties: { changes: ['email', 'phone'] }
  }
})
```

### Tracked Events

- User actions (login, logout, create, update, delete)
- Pipeline changes
- AI feature usage
- Portal access
- Billing events

---

## Security Checklist

### Development

- [ ] Never log sensitive data
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Validate all inputs (Zod schemas)
- [ ] Sanitize outputs (React handles this)

### Deployment

- [ ] All secrets in environment variables
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] RLS policies applied
- [ ] Webhook secrets configured

### Operations

- [ ] Monitor authentication failures
- [ ] Review access logs
- [ ] Regular security updates
- [ ] Backup verification


