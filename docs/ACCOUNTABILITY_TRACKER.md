# Accountability Tracker - Developer Documentation

> **Last Updated:** January 15, 2026

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Database Schema](#3-database-schema)
4. [API Endpoints](#4-api-endpoints)
5. [Agent Prompts](#5-agent-prompts)
6. [UK Data Sources](#6-uk-data-sources)
7. [Testing Guide](#7-testing-guide)
8. [Troubleshooting](#8-troubleshooting)
9. [Deployment](#9-deployment)

---

## 1. Feature Overview

### What It Does

The Accountability Tracker helps investigative journalists systematically investigate potential corruption using UK public records. It:

- **Aggregates UK public data** from Companies House, Charity Commission, Register of Interests, Electoral Commission, and Contracts Finder
- **Generates theoretical corruption scenarios** based on structural analysis of positions, interests, and conflicts
- **Creates prioritized action items** for journalists to investigate further
- **Maintains ethical framing** throughout—all findings are hypothetical, not accusations

### Why It Exists

Traditional corruption investigations require journalists to manually search dozens of public databases. This tool automates data aggregation and applies AI-powered analysis to identify patterns that might warrant investigation.

### Ethical Considerations

**Critical:** This tool identifies *theoretical possibilities*, not evidence of wrongdoing.

- All individuals are presumed innocent until proven guilty
- Correlation does not equal causation
- Findings must be verified through traditional investigative methods
- Users must acknowledge ethical principles before each investigation
- Every page displays ethics reminders

### Cost

- 1 credit per investigation (same as policy briefs)
- Credit refunded if quality score < 6.0 (insufficient public data)
- Rate limited to 3 investigations per hour per user

---

## 2. Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend
        LP[Landing Page<br/>/accountability]
        EM[Ethics Modal]
        GP[Generation Progress<br/>/accountability/generate]
        RP[Results Page<br/>/accountability/[id]]
        PP[Print Page<br/>/accountability/[id]/print]
    end

    subgraph API Layer
        GEN[POST /api/accountability/generate]
        FETCH[GET /api/accountability/[id]]
        LIST[GET /api/accountability]
        EXPORT[GET /api/accountability/[id]/export]
    end

    subgraph AI Orchestrator
        EC[Entity Classification<br/>Haiku]
        UKP[UK Profile Research<br/>Opus]
        CA[Corruption Analysis<br/>Opus]
        ALG[Action List Generation<br/>Opus]
        QC[Quality Check<br/>calculateQualityScore]
    end

    subgraph UK Data Sources
        CH[Companies House API]
        CC[Charity Commission<br/>Tavily]
        ROI[Register of Interests<br/>Tavily]
        ELEC[Electoral Commission<br/>Tavily]
        CF[Contracts Finder<br/>Tavily]
    end

    subgraph Database
        INV[(accountability_investigations)]
        SRC[(accountability_investigation_sources)]
        CRED[(credit_transactions)]
    end

    LP --> EM --> GP
    GP -->|SSE| GEN
    GEN --> EC --> UKP --> CA --> ALG --> QC
    UKP --> CH & CC & ROI & ELEC & CF
    QC --> INV & SRC
    GEN -->|deduct/refund| CRED
    GP -->|on complete| RP
    RP --> PP
    FETCH --> INV & SRC
```

### Flow Summary

1. User enters entity name on landing page
2. User acknowledges ethics principles in modal
3. Frontend calls POST `/api/accountability/generate` with SSE
4. API deducts 1 credit, creates investigation record
5. LangGraph orchestrator runs 5 agents sequentially:
   - Entity Classification (individual vs organization)
   - UK Profile Research (fetches from 5 data sources)
   - Corruption Analysis (generates theoretical scenarios)
   - Action List Generation (prioritized investigation steps)
   - Quality Check (validates data sufficiency)
6. SSE events stream progress to frontend
7. If quality score ≥ 6.0, investigation saved; else credit refunded
8. User redirected to results page

---

## 3. Database Schema

### Tables

#### `accountability_investigations`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `target_entity` | TEXT | Name being investigated |
| `entity_type` | TEXT | 'individual' or 'organization' |
| `ethics_acknowledged_at` | TIMESTAMPTZ | When user acknowledged ethics |
| `profile_data` | JSONB | UKProfileData object |
| `corruption_scenarios` | JSONB | CorruptionScenario[] |
| `action_items` | JSONB | ActionItem[] |
| `quality_score` | NUMERIC(3,1) | 0-10 score |
| `quality_notes` | TEXT[] | Scoring breakdown |
| `generation_time_ms` | INTEGER | Total generation time |
| `data_sources_count` | INTEGER | Number of sources used |
| `is_public` | BOOLEAN | Always false for MVP |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `accountability_investigation_sources`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `investigation_id` | UUID | FK to investigations |
| `source_type` | TEXT | 'companies_house', 'charity_commission', etc. |
| `url` | TEXT | Source URL |
| `title` | TEXT | Source title |
| `accessed_at` | TIMESTAMPTZ | When source was accessed |
| `data_extracted` | JSONB | Raw data from source |
| `verification_status` | TEXT | 'verified', 'unverified', 'disputed' |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### RLS Policies

```sql
-- Users can only see their own investigations
CREATE POLICY "Users can view own investigations"
ON accountability_investigations FOR SELECT
USING (auth.uid() = user_id);

-- Users can create investigations
CREATE POLICY "Users can create investigations"
ON accountability_investigations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Sources inherit investigation permissions
CREATE POLICY "Users can view sources for own investigations"
ON accountability_investigation_sources FOR SELECT
USING (
  investigation_id IN (
    SELECT id FROM accountability_investigations WHERE user_id = auth.uid()
  )
);
```

### Indexes

```sql
CREATE INDEX idx_investigations_user_id ON accountability_investigations(user_id);
CREATE INDEX idx_investigations_created_at ON accountability_investigations(created_at DESC);
CREATE INDEX idx_investigation_sources_investigation_id ON accountability_investigation_sources(investigation_id);
```

---

## 4. API Endpoints

### POST `/api/accountability/generate`

Generate a new investigation with SSE streaming.

**Request:**
```json
{
  "targetEntity": "Boris Johnson",
  "ethicsAcknowledged": true
}
```

**Response:** SSE stream

**SSE Events:**
```
event: agent_started
data: {"agent": "entity_classification", "timestamp": "2026-01-15T10:00:00Z"}

event: agent_completed
data: {"agent": "entity_classification", "duration": 2500, "timestamp": "2026-01-15T10:00:02Z"}

event: stage_changed
data: {"stage": "uk_profile_research", "timestamp": "2026-01-15T10:00:02Z"}

event: complete
data: {"investigationId": "uuid", "qualityScore": 7.5, "creditRefunded": false, "timestamp": "..."}

event: error
data: {"message": "Generation failed", "creditRefunded": true, "timestamp": "..."}
```

**Errors:**
- `400` - Ethics not acknowledged
- `401` - Not authenticated
- `402` - Insufficient credits (includes `redirectTo: "/credits"`)
- `429` - Rate limit exceeded (3/hour)

**Rate Limit:** 3 requests per hour per user

---

### GET `/api/accountability/[id]`

Fetch a single investigation with sources.

**Response:**
```json
{
  "investigation": {
    "id": "uuid",
    "target_entity": "Boris Johnson",
    "entity_type": "individual",
    "profile_data": { ... },
    "corruption_scenarios": [ ... ],
    "action_items": [ ... ],
    "quality_score": 7.5,
    "sources": [ ... ]
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - User doesn't own investigation
- `404` - Investigation not found

---

### GET `/api/accountability`

List user's investigations (most recent 50).

**Response:**
```json
{
  "investigations": [
    { "id": "uuid", "target_entity": "...", "created_at": "...", "quality_score": 7.5 }
  ]
}
```

---

### GET `/api/accountability/[id]/export`

Redirect to print page for PDF export.

**Response:** 302 redirect to `/accountability/[id]/print`

---

## 5. Agent Prompts

### Entity Classification Agent (Haiku)

**Model:** `claude-haiku-4-5-20251001`

**Purpose:** Determine if target is individual or organization.

**Prompt excerpt:**
```
You are an entity classification specialist. Determine whether the given 
entity is an individual person or an organization.

Return JSON: { "entityType": "individual" | "organization" }
```

### UK Profile Research Agent (Opus)

**Model:** `claude-opus-4-5-20251101`

**Purpose:** Synthesize data from UK public sources into structured profile.

**Prompt excerpt:**
```
You are a UK public records research specialist. Synthesize the following 
raw data into a structured profile covering: positions, company directorships, 
charity trusteeships, registered interests, political donations, and 
government contracts.

IMPORTANT: Only include information from verified UK public sources.
Do not make assumptions or inferences beyond what the data shows.
```

### Corruption Analysis Agent (Opus)

**Model:** `claude-opus-4-5-20251101`

**Purpose:** Generate theoretical corruption scenarios based on profile.

**Prompt excerpt:**
```
You are a corruption analysis specialist. Based on the profile data, 
identify THEORETICAL corruption scenarios that COULD exist given the 
subject's positions and interests.

CRITICAL ETHICAL CONSTRAINTS:
- Use conditional language ("could potentially", "may warrant investigation")
- NEVER make accusations or imply guilt
- Always include "Innocent Explanations" for each scenario
- Focus on structural possibilities, not character judgments
```

### Action List Generation Agent (Opus)

**Model:** `claude-opus-4-5-20251101`

**Purpose:** Create prioritized investigation action items.

**Prompt excerpt:**
```
You are an investigative journalism advisor. Generate prioritized action 
items for investigating the theoretical scenarios identified.

PRIORITIZATION:
- Priority 1 (High): Publicly available, quick to obtain
- Priority 2 (Medium): Requires FOI request, 2-8 week timeline
- Priority 3 (Low): Complex investigations, long timeline

Each action must be something a journalist could legally do in the UK.
```

### Quality Check

**Implementation:** `calculateQualityScore()` function in `accountability-service.ts`

**Scoring:**
- Sources score: 0-3 sources = 0pts, 4-6 = 2.5pts, 7+ = 5pts
- Scenarios score: <3 = 0pts, 3-5 = 2.5pts, 6+ = 5pts
- Total: 0-10 scale
- **Quality gate:** Score ≥ 6.0 required to pass

---

## 6. UK Data Sources

### Companies House API

**URL:** `https://api.company-information.service.gov.uk`

**Authentication:** Basic Auth with API key

**Setup:**
1. Register at https://developer.company-information.service.gov.uk/
2. Create application and get API key
3. Set `COMPANIES_HOUSE_API_KEY` environment variable

**Endpoints used:**
- `/search/officers?q={name}` - Search for officers
- `/officers/{id}/appointments` - Get officer's appointments

**Rate limits:** 600 requests per 5 minutes

### Tavily Search (for other sources)

**URL:** `https://api.tavily.com`

**Setup:**
1. Register at https://tavily.com
2. Get API key
3. Set `TAVILY_API_KEY` environment variable

**Used for:**
- Charity Commission data (scraping charity-commission.gov.uk)
- Register of Interests (scraping parliament.uk)
- Electoral Commission (scraping electoralcommission.org.uk)
- Contracts Finder (scraping contractsfinder.service.gov.uk)

### Caching Strategy

- Cache TTL: 24 hours for all sources
- Cache key: `accountability:${sourceType}:${entityName}`
- Cache location: Supabase (future: Redis)

### Error Handling

- Retry logic: 3 attempts with exponential backoff
- Graceful degradation: If source fails, continue with available data
- Partial results: Investigation can complete with incomplete data (quality score reflects this)

---

## 7. Testing Guide

### Run Unit Tests

```bash
# All accountability tests
npm test -- __tests__/unit/**/accountability*.test.ts

# Specific test file
npm test -- __tests__/unit/api/accountability-generate.test.ts
```

### Run E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run accountability-specific tests
npx playwright test tests/e2e/accountability-tracker.spec.ts

# Run with UI
npx playwright test --ui
```

### Test Data

**Happy path entity:** "Boris Johnson" (well-documented public figure)

**Failure test entity:** "Asdfghjkl Zxcvbnm Qwerty" (non-existent, triggers quality gate failure)

### Manual Testing Checklist

- [ ] Enter entity on landing page
- [ ] Check ethics acknowledgment
- [ ] Verify progress stages update
- [ ] Verify results page renders all sections
- [ ] Click Export PDF, verify print layout
- [ ] Test on mobile (responsive design)
- [ ] Test keyboard navigation
- [ ] Run Lighthouse accessibility audit

---

## 8. Troubleshooting

### Common Errors

#### "Insufficient credits"
**Cause:** User has 0 credits.
**Solution:** Purchase credits at /credits.

#### "Rate limit exceeded"
**Cause:** User ran 3+ investigations in 1 hour.
**Solution:** Wait until rate limit window resets (shown in error message).

#### "Generation failed" with credit refund
**Cause:** Anthropic API error or timeout.
**Solution:** Retry. If persistent, check Anthropic API status.

#### Quality gate failure (credit refunded)
**Cause:** Not enough public data found for entity.
**Solution:** Try a more prominent public figure, or check if name is spelled correctly.

#### SSE connection drops mid-generation
**Cause:** Network instability or browser issue.
**Solution:** Refresh page and check /accountability for completed investigation. Generation continues server-side.

### Debug Logging

Enable verbose logging:
```bash
DEBUG=accountability:* npm run dev
```

### Sentry Errors

Check Sentry for:
- `AccountabilityGenerationError` - Generation pipeline failures
- `CreditTransactionError` - Credit deduction/refund failures
- `UKDataSourceError` - External API failures

---

## 9. Deployment

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
COMPANIES_HOUSE_API_KEY=...
TAVILY_API_KEY=tvly-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional
DEBUG=accountability:*  # Enable debug logging
```

### Pre-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Companies House API key valid (test with curl)
- [ ] Tavily API key valid
- [ ] Run full E2E test suite
- [ ] Run typecheck: `npm run typecheck`
- [ ] Run build: `npm run build`
- [ ] Test on staging environment first

### Staging Deployment

```bash
# Deploy to staging
vercel --env staging

# Run smoke tests
npx playwright test --project=staging
```

### Production Deployment

```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://stateofclarity.com/api/accountability
```

### Rollback

If issues discovered post-deployment:

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-id]
```

---

## Appendix: Type Definitions

See `lib/types/accountability.ts` for full TypeScript types:

- `UKProfileData` - Profile data structure
- `CorruptionScenario` - Scenario structure
- `ActionItem` - Action item structure
- `AccountabilityInvestigation` - Database row type
- `AccountabilityInvestigationSource` - Source row type

---

*Document maintained by the State of Clarity engineering team.*
