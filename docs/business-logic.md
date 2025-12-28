# Business Logic

> Core workflows, rules, and domain concepts

---

## Overview

ORCHESTR manages the complete recruitment lifecycle for agencies:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RECRUITMENT LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│   │  CLIENT   │───▶│  MISSION  │───▶│  SOURCING │───▶│ PIPELINE  │             │
│   │ ACQUIRED  │    │  CREATED  │    │           │    │           │             │
│   └───────────┘    └───────────┘    └───────────┘    └───────────┘             │
│                                                            │                    │
│                    ┌───────────────────────────────────────┘                    │
│                    │                                                            │
│                    ▼                                                            │
│   ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐             │
│   │ SHORTLIST │───▶│  CLIENT   │───▶│   OFFER   │───▶│  PLACED   │             │
│   │   SENT    │    │ INTERVIEW │    │   MADE    │    │           │             │
│   └───────────┘    └───────────┘    └───────────┘    └───────────┘             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Concepts

### Organization (Tenant)

- Each recruitment agency is an **Organization**
- All data is completely isolated per organization
- Users belong to exactly one organization
- Billing is per organization

### Candidate vs Person

A **Candidate** represents a person in the recruitment database:

- Same person can exist as different candidates in different organizations
- Within one org, candidates are deduplicated by email or LinkedIn URL
- A candidate can exist without any job application
- Relationship level tracks overall engagement maturity

### Mission vs Job

A **Mission** is a recruitment assignment:

- Belongs to one Client
- Has one assigned Recruiter
- Contains job details with visibility controls
- Tracks all candidate applications

### Application (MissionCandidate)

When a candidate is considered for a mission:

- Creates a `MissionCandidate` record
- Tracks pipeline stage separately from global relationship
- Has its own scoring, notes, and history
- One candidate can be in multiple missions

---

## Candidate Lifecycle

### Relationship Levels

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        RELATIONSHIP PROGRESSION                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   SOURCED ──▶ CONTACTED ──▶ ENGAGED ──▶ QUALIFIED ──▶ SHORTLISTED ──▶ PLACED   │
│      │            │            │            │              │            │        │
│      ▼            ▼            ▼            ▼              ▼            ▼        │
│  Identified   Reached out   Responded   Validated    Presented    Hired        │
│  no contact   waiting for   actively    skills &     to client    success!     │
│              response       talking     fit                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Rules:**
- Relationship level is **global**, not mission-specific
- Level only moves forward (never regresses)
- Automatically upgraded when milestones are reached
- Used for filtering and reporting

### Candidate Status

| Status | When Used |
|--------|-----------|
| `ACTIVE` | Normal, contactable candidate |
| `TO_RECONTACT` | Follow up later (with date) |
| `BLACKLIST` | Never contact again |
| `DELETED` | GDPR deletion (soft delete) |

---

## Pipeline Workflow

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            PIPELINE STAGES                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │ SOURCED  │──▶│CONTACTED │──▶│ RESPONSE │──▶│INTERVIEW │──▶│INTERVIEW │      │
│  │          │   │          │   │ RECEIVED │   │SCHEDULED │   │   DONE   │      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘      │
│                                                                    │            │
│                    ┌───────────────────────────────────────────────┘            │
│                    │                                                            │
│                    ▼                                                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐                     │
│  │ SENT TO  │──▶│  CLIENT  │──▶│  OFFER   │──▶│  CLOSED  │                     │
│  │  CLIENT  │   │INTERVIEW │   │          │   │  HIRED   │                     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘                     │
│                                                     │                           │
│                                                     │                           │
│                                              ┌──────┴──────┐                    │
│                                              │   CLOSED    │                    │
│                                              │  REJECTED   │                    │
│                                              └─────────────┘                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Stage Transitions

| From | To | Trigger |
|------|-----|---------|
| SOURCED | CONTACTED | First message sent |
| CONTACTED | RESPONSE_RECEIVED | Candidate replies |
| RESPONSE_RECEIVED | INTERVIEW_SCHEDULED | Interview booked |
| INTERVIEW_SCHEDULED | INTERVIEW_DONE | Interview completed |
| INTERVIEW_DONE | SENT_TO_CLIENT | Added to shortlist |
| SENT_TO_CLIENT | CLIENT_INTERVIEW | Client wants to meet |
| CLIENT_INTERVIEW | OFFER | Offer extended |
| OFFER | CLOSED_HIRED | Offer accepted |
| Any | CLOSED_REJECTED | Rejected at any stage |

### Contact Status

Tracks outreach progress independently of pipeline:

| Status | Description |
|--------|-------------|
| `NOT_CONTACTED` | Initial state |
| `NO_RESPONSE` | Waiting for reply |
| `OPEN` | Active conversation |
| `CLOSED` | Conversation ended |
| `LATER` | Postponed follow-up |

---

## AI Scoring

### How Scoring Works

1. **Candidate added to mission** → Scoring triggered
2. **AI analyzes match** between candidate profile and job requirements
3. **Score calculated** (0-100) with reasons
4. **Recommendation generated**: `add`, `review`, or `archive`

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI SCORING                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   INPUTS:                              OUTPUTS:                                 │
│   ┌─────────────────┐                  ┌─────────────────┐                      │
│   │ Candidate       │                  │ Score: 85/100   │                      │
│   │ - Position      │                  │                 │                      │
│   │ - Experience    │   ┌─────────┐    │ Reasons:        │                      │
│   │ - Skills        │──▶│ GPT-4o  │───▶│ - Experience ✓  │                      │
│   │ - Location      │   │  mini   │    │ - Skills ✓      │                      │
│   └─────────────────┘   └─────────┘    │ - Location ✓    │                      │
│   ┌─────────────────┐                  │                 │                      │
│   │ Mission         │                  │ Recommendation: │                      │
│   │ - Requirements  │                  │ ADD             │                      │
│   │ - Must-haves    │                  └─────────────────┘                      │
│   │ - Location      │                                                           │
│   └─────────────────┘                                                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Score Thresholds

| Score | Recommendation | Action |
|-------|----------------|--------|
| ≥60 | `add` | Strong match, proceed |
| 40-59 | `review` | Manual review needed |
| <40 | `archive` | Poor match |

The threshold can be customized per mission via `scoreThreshold`.

---

## Visibility System

### Visibility Levels

Job content has granular visibility controls:

| Level | Recruiter | Client | Candidate |
|-------|:---------:|:------:|:---------:|
| `INTERNAL` | ✅ | ❌ | ❌ |
| `INTERNAL_CLIENT` | ✅ | ✅ | ❌ |
| `INTERNAL_CANDIDATE` | ✅ | ❌ | ✅ |
| `ALL` | ✅ | ✅ | ✅ |

### Content Visibility Defaults

| Section | Default Visibility |
|---------|-------------------|
| Context | INTERNAL |
| Responsibilities | ALL |
| Must Have | ALL |
| Nice to Have | ALL |
| Red Flags | Always INTERNAL |
| Process | INTERNAL_CLIENT |

---

## Shortlist Workflow

### Creating a Shortlist

1. Recruiter selects candidates at `INTERVIEW_DONE` stage
2. Creates shortlist with name and summary
3. Generates access link for client
4. Client receives link (email or direct)

### Client Feedback Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT FEEDBACK                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   CLIENT PORTAL                            RECRUITER DASHBOARD                  │
│   ┌─────────────────┐                      ┌─────────────────┐                  │
│   │ Candidate 1     │                      │ Feedback Report │                  │
│   │ ┌─────┐ ┌─────┐ │                      │                 │                  │
│   │ │ OK  │ │ NO  │ │  ───────────────▶    │ ✓ Candidate 1   │                  │
│   │ └─────┘ └─────┘ │                      │ ✗ Candidate 2   │                  │
│   │ [Comment...]    │                      │ ? Candidate 3   │                  │
│   └─────────────────┘                      └─────────────────┘                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Feedback Options

| Decision | Meaning | Next Action |
|----------|---------|-------------|
| `OK` | Proceed | Schedule client interview |
| `TO_DISCUSS` | Questions | Call to discuss |
| `NO` | Reject | Move to rejected |

---

## Candidate Portal

### Portal Steps

1. **Welcome** — Introduction and consent
2. **Profile Review** — Verify extracted data
3. **Questionnaire** — Mission-specific questions (if configured)
4. **Availability** — Calendly integration or form
5. **Confirmation** — Thank you page

### Portal Access

- Unique token per candidate per mission
- Token expires after 30 days
- Token is one-time-use (but can be regenerated)
- Progress is saved between sessions

---

## Pools vs Taxonomy

### Pools (Operational)

Used for organizing sourcing campaigns:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Pool: "Q1 2024 Tech Sourcing"                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Created: Jan 2024       Members: 150       Status: Active                       │
│                                                                                  │
│ Description: Backend engineers sourced from LinkedIn for Q1 tech missions       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Taxonomy (Classification)

Used for categorizing candidates:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Pole: Engineering                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Positions:                                                                       │
│   - Backend Engineer                                                            │
│   - Frontend Engineer                                                           │
│   - DevOps Engineer                                                             │
│   - Data Engineer                                                               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Aspect | Pools | Taxonomy |
|--------|-------|----------|
| Purpose | Grouping for campaigns | Classification |
| Lifespan | Temporary | Permanent |
| Cardinality | Many-to-many | Many-to-many |
| Usage | Bulk actions, sourcing | Filtering, matching |

---

## Billing Logic

### Plan Features

| Feature | Core | Pro |
|---------|:----:|:---:|
| Max Users | 3 | Unlimited |
| AI Calls/day | 50 | 500 |
| Custom Questionnaires | ❌ | ✅ |
| API Access | ❌ | ✅ |

### Billing Cycle

- **4-week billing** (13 periods/year) — Core: €45, Pro: €82
- **Annual billing** — Core: €499, Pro: €899 (~15% discount)

### Trial Period

- 14-day free trial on signup
- All Pro features during trial
- Card required to start trial
- Automatic conversion at trial end

---

## Data Retention

### GDPR Compliance

| Data Type | Retention | After Deletion |
|-----------|-----------|----------------|
| Active candidates | `retentionDaysActive` (365 default) | Anonymize |
| Ignored candidates | `retentionDaysIgnored` (90 default) | Delete |
| Interactions | Same as candidate | Delete with candidate |
| Consent records | Kept for compliance | Anonymize personal data |

### Deletion Process

1. Mark candidate as `DELETED` status
2. After retention period:
   - Anonymize personal data
   - Keep statistical data
   - Remove from all pools
3. Log deletion event for audit

---

## Event Tracking

### Tracked Events

| Category | Events |
|----------|--------|
| Candidates | created, updated, deleted, scored |
| Pipeline | stage_changed, rejected, hired |
| Interactions | message_sent, call_logged, interview_scheduled |
| Portal | invited, started, completed |
| AI | scoring, structuring, message_generation |

### Event Schema

```typescript
{
  name: 'pipeline.stage_changed',
  properties: {
    from: 'CONTACTED',
    to: 'RESPONSE_RECEIVED',
    missionId: '...',
    candidateId: '...'
  },
  userId: '...',
  createdAt: '2024-12-28T...'
}
```

