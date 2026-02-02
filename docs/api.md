# API Reference

> API endpoints, webhooks, and server actions

---

## Overview

ORCHESTR uses three types of server-side interfaces:

1. **Server Actions** — Primary data mutation interface (RPC-style)
2. **API Routes** — Webhooks and external integrations
3. **Chrome Extension API** — LinkedIn profile capture

---

## Server Actions

Server Actions are the primary way to mutate data. They are called directly from React components and handle authentication automatically.

### Candidates (`src/lib/actions/candidates.ts`)

```typescript
// Create a new candidate
createCandidate(data: {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  location?: string
  currentPosition?: string
  currentCompany?: string
  profileUrl?: string
  tags?: string[]
  notes?: string
}) => Promise<Candidate>

// Update candidate
updateCandidate(id: string, data: Partial<CandidateData>) => Promise<Candidate>

// Delete candidate
deleteCandidate(id: string) => Promise<void>

// Get candidate with enrichment
getCandidate(id: string) => Promise<CandidateWithRelations>

// Search candidates
searchCandidates(query: string, filters?: CandidateFilters) => Promise<Candidate[]>

// Update relationship level
updateRelationshipLevel(id: string, level: RelationshipLevel) => Promise<void>

// Add tags
addCandidateTags(id: string, tags: string[]) => Promise<void>
```

### Clients (`src/lib/actions/clients.ts`)

```typescript
// CRUD operations
createClient(data: ClientData) => Promise<Client>
updateClient(id: string, data: Partial<ClientData>) => Promise<Client>
deleteClient(id: string) => Promise<void>
getClient(id: string) => Promise<ClientWithContacts>
getClients() => Promise<Client[]>

// Contacts
createContact(clientId: string, data: ContactData) => Promise<Contact>
updateContact(id: string, data: Partial<ContactData>) => Promise<Contact>
deleteContact(id: string) => Promise<void>
```

### Missions (`src/lib/actions/missions.ts`)

```typescript
// CRUD operations
createMission(data: MissionData) => Promise<Mission>
updateMission(id: string, data: Partial<MissionData>) => Promise<Mission>
deleteMission(id: string) => Promise<void>
getMission(id: string) => Promise<MissionWithRelations>
getMissions(filters?: MissionFilters) => Promise<Mission[]>

// Status management
updateMissionStatus(id: string, status: MissionStatus) => Promise<void>
closeMission(id: string, status: 'CLOSED_FILLED' | 'CLOSED_CANCELLED') => Promise<void>
```

### Pipeline (`src/lib/actions/pipeline.ts`)

```typescript
// Add candidate to mission
addCandidateToMission(candidateId: string, missionId: string) => Promise<MissionCandidate>

// Move candidate in pipeline
updatePipelineStage(missionCandidateId: string, stage: PipelineStage) => Promise<void>

// Update contact status
updateContactStatus(missionCandidateId: string, status: ContactStatus) => Promise<void>

// Reject candidate
rejectCandidate(missionCandidateId: string, reason?: string) => Promise<void>

// Get pipeline data
getMissionPipeline(missionId: string) => Promise<MissionCandidateWithDetails[]>
```

### Pools (`src/lib/actions/pools.ts`)

```typescript
// Pool management
createPool(data: { name: string; description?: string }) => Promise<Pool>
updatePool(id: string, data: Partial<PoolData>) => Promise<Pool>
deletePool(id: string) => Promise<void>
getPools() => Promise<Pool[]>

// Membership
addCandidateToPool(candidateId: string, poolId: string) => Promise<void>
removeCandidateFromPool(candidateId: string, poolId: string) => Promise<void>
getPoolCandidates(poolId: string) => Promise<Candidate[]>
```

### Interviews (`src/lib/actions/interviews.ts`)

```typescript
// Interview management
scheduleInterview(data: InterviewData) => Promise<Interview>
updateInterview(id: string, data: Partial<InterviewData>) => Promise<Interview>
cancelInterview(id: string) => Promise<void>
completeInterview(id: string, notes?: string) => Promise<void>

// Get interviews
getUpcomingInterviews() => Promise<Interview[]>
getCandidateInterviews(missionCandidateId: string) => Promise<Interview[]>
```

### Shortlist (`src/lib/actions/shortlist.ts`)

```typescript
// Shortlist management
createShortlist(missionId: string, name: string) => Promise<Shortlist>
addToShortlist(shortlistId: string, missionCandidateIds: string[]) => Promise<void>
removeFromShortlist(shortlistCandidateId: string) => Promise<void>
reorderShortlist(shortlistId: string, order: string[]) => Promise<void>

// Generate access token
generateShortlistLink(shortlistId: string) => Promise<string>
```

### Billing (`src/lib/actions/billing.ts`)

```typescript
// Subscription management
createCheckoutSession(plan: 'CORE' | 'PRO', period: 'fourWeeks' | 'annual') => Promise<{ url: string }>
createPortalSession() => Promise<{ url: string }>
getSubscriptionStatus() => Promise<SubscriptionStatus>
```

### CSV Import (`src/lib/actions/csv-import.ts`)

```typescript
// Import workflow
parseCSV(file: File) => Promise<ParseResult>
mapColumns(mapping: ColumnMapping) => Promise<MappingPreview>
executeImport(data: ImportData, destination: ImportDestination) => Promise<ImportResult>
rollbackImport(importId: string) => Promise<void>
```

### Analytics (`src/lib/actions/analytics.ts`)

```typescript
// Track events
trackEvent(name: string, properties?: Record<string, unknown>) => Promise<void>

// Get dashboard data
getDashboardStats() => Promise<DashboardStats>
getPipelineMetrics(missionId?: string) => Promise<PipelineMetrics>
getActivityFeed() => Promise<Activity[]>
```

---

## API Routes

### Health Check

```
GET /api/health/db
```

Check database connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-28T12:00:00.000Z",
  "latencyMs": 45,
  "environment": "production"
}
```

**Authentication:** Optional token via `HEALTH_CHECK_TOKEN`

---

### Chrome Extension API

```
POST /api/extension/capture
```

Capture a LinkedIn profile from the Chrome extension.

**Headers:**
```
Content-Type: application/json
X-User-Email: user@example.com
```

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "headline": "Senior Software Engineer",
    "location": "Paris, France",
    "profileUrl": "https://linkedin.com/in/johndoe",
    "experiences": [...],
    "education": [...],
    "skills": ["JavaScript", "TypeScript", "React"]
  },
  "missionId": "optional-mission-id"
}
```

**Response:**
```json
{
  "success": true,
  "candidateId": "clx123...",
  "isNew": true,
  "score": 85,
  "scoreReasons": ["Strong experience match", "Location compatible"]
}
```

---

### Webhooks

#### Stripe Webhook

```
POST /api/webhooks/stripe
```

Handles Stripe subscription events.

**Events Handled:**
- `checkout.session.completed` — New subscription created
- `customer.subscription.updated` — Subscription changed
- `customer.subscription.deleted` — Subscription cancelled
- `invoice.payment_succeeded` — Payment successful
- `invoice.payment_failed` — Payment failed

**Verification:** Stripe signature verification via `STRIPE_WEBHOOK_SECRET`

#### Calendly Webhook

```
POST /api/webhooks/calendly
```

Handles Calendly scheduling events.

**Events Handled:**
- `invitee.created` — Interview scheduled
- `invitee.canceled` — Interview cancelled

#### Meeting Webhooks

```
POST /api/webhooks/meet    # Google Meet
POST /api/webhooks/zoom    # Zoom
```

Handle meeting events for transcript integration.

---

## Portal Access

### Candidate Portal

Candidates access their portal via a unique token:

```
GET /candidate?token=<portal-token>
```

**Token Validation:**
1. Token is hashed (SHA-256)
2. Hash is looked up in `external_access_tokens`
3. Expiration and revocation are checked
4. Associated `missionCandidate` is returned

### Client Portal

Clients access shortlists via access token:

```
GET /client?token=<shortlist-token>
```

**Token Validation:**
1. Hash lookup in `shortlists` table
2. Expiration check
3. Mission and candidates are returned

---

## AI Endpoints (via Server Actions)

### Scoring

```typescript
import { scoreCandidate } from '@/lib/ai/scoring'

const result = await scoreCandidate(candidate, mission)
// Returns: { score: 85, reasons: [...], recommendation: 'add' }
```

### Message Generation

```typescript
import { generateMessage } from '@/lib/ai/messages'

const message = await generateMessage({
  candidate,
  mission,
  type: 'INITIAL_CONTACT',
  format: 'LINKEDIN_CONNECTION'
})
// Returns: { subject?: string, content: string }
```

### Profile Structuring

```typescript
import { structureProfile } from '@/lib/ai/structuring'

const structured = await structureProfile(rawProfileData)
// Returns normalized candidate data
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Candidate not found",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Prisma Error Codes

| Code | Description |
|------|-------------|
| `P1001` | Cannot reach database |
| `P1002` | Connection timeout |
| `P2002` | Unique constraint violation |
| `P2003` | Foreign key constraint failed |
| `P2025` | Record not found |

---

## Rate Limiting

### AI Features

| Plan | Daily Limit |
|------|-------------|
| Core | 50 calls |
| Pro | 500 calls |
| White-label | Unlimited |

Usage is tracked in the `events` table with `ai.*` event names.

### API Routes

Vercel automatically applies rate limiting to API routes:
- 1000 requests per 10 seconds per IP (default)

---

## Authentication

All API routes and Server Actions require authentication except:
- Health check (`/api/health/db`)
- Portal access (token-based)
- Marketing pages

Authentication is handled via Supabase Auth:
1. Client sends cookies with request
2. Middleware validates session
3. User is looked up in database
4. Organization context is established for RLS

---

## Versioning

The API is currently unversioned. Breaking changes are avoided where possible.

Future versioning will use URL prefixes:
```
/api/v1/...
/api/v2/...
```


