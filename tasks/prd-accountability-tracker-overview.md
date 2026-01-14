# Accountability Tracker - PRD Breakdown

## Epic Overview
Build the Accountability Tracker feature for investigative journalists to systematically investigate potential corruption using UK public records, AI-powered scenario analysis, and prioritized action lists.

**Estimated Timeline:** 5 weeks (1 week per PRD, with PRD 6 overlapping)

---

## PRD 1: Foundation - Database Schema & Core Types

**Goal:** Establish the data foundation for the Accountability Tracker feature.

**Dependencies:** None (can start immediately)

**Estimated Effort:** 1 week

### User Stories
- As a developer, I need database tables to store investigation data
- As a developer, I need TypeScript types to ensure type safety
- As a developer, I need CRUD service functions to interact with the database

### Technical Specifications

#### Database Tables
Create migration: `/lib/supabase/migrations/013_add_accountability_tracker_tables.sql`

**Table: `accountability_investigations`**
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users, NOT NULL)
- target_entity (TEXT, NOT NULL)
- entity_type (TEXT, CHECK IN ('individual', 'organization'))
- ethics_acknowledged_at (TIMESTAMPTZ, NOT NULL)
- profile_data (JSONB, DEFAULT '{}')
- corruption_scenarios (JSONB, DEFAULT '[]')
- action_items (JSONB, DEFAULT '[]')
- quality_score (NUMERIC(3,1), CHECK 0-10)
- quality_notes (TEXT[])
- generation_time_ms (INTEGER)
- data_sources_count (INTEGER, DEFAULT 0)
- is_public (BOOLEAN, DEFAULT false)
- created_at (TIMESTAMPTZ, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, DEFAULT NOW())
```

**Table: `accountability_investigation_sources`**
```sql
- id (UUID, PK)
- investigation_id (UUID, FK, NOT NULL)
- source_type (TEXT, CHECK IN (...))
- url (TEXT, NOT NULL)
- title (TEXT)
- accessed_at (TIMESTAMPTZ, DEFAULT NOW())
- data_extracted (JSONB)
- verification_status (TEXT, DEFAULT 'unverified')
- created_at (TIMESTAMPTZ, DEFAULT NOW())
```

**Indexes:**
- `idx_investigations_user_id` ON accountability_investigations(user_id)
- `idx_investigations_created_at` ON accountability_investigations(created_at DESC)
- `idx_investigations_target` ON accountability_investigations(target_entity)
- `idx_investigation_sources_investigation_id` ON accountability_investigation_sources(investigation_id)
- `idx_investigation_sources_source_type` ON accountability_investigation_sources(source_type)

**RLS Policies:**
- Users can SELECT their own investigations only
- Users can INSERT investigations (user_id = auth.uid())
- Service role has full access
- Investigation sources follow parent investigation permissions

#### Type Definitions
Create `/lib/types/accountability.ts`

**Core Types:**
```typescript
// Entity types
export type EntityType = 'individual' | 'organization';

// Position data
export interface Position {
  title: string;
  organization: string;
  startDate: string;
  endDate?: string;
  description?: string;
  sourceUrl: string;
}

// UK Profile Data (Block 1 output)
export interface UKProfileData {
  // Basic Identity
  fullName: string;
  aliases: string[];
  dateOfBirth?: string;

  // Public Roles & Positions
  currentPositions: Position[];
  pastPositions: Position[];

  // Companies House Data
  companiesHouseEntities: CompanyRecord[];

  // Financial Interests
  registerOfInterests: InterestDeclaration[];

  // Charity Commission
  charityInvolvements: CharityRecord[];

  // Electoral Commission
  politicalDonations: Donation[];

  // Government Contracts
  governmentContracts: Contract[];

  // Source Metadata
  sources: InvestigationSource[];
  dataCompleteness: {
    companiesHouseAvailable: boolean;
    charityCommissionAvailable: boolean;
    registerOfInterestsAvailable: boolean;
    electoralCommissionAvailable: boolean;
  };
}

// Corruption Scenario (Block 2 output)
export interface CorruptionScenario {
  scenarioId: string;
  title: string;
  description: string;
  mechanism: string; // How this corruption could theoretically work
  incentiveStructure: {
    financialIncentives: string[];
    politicalIncentives: string[];
    careerIncentives: string[];
  };
  enablingPositions: string[]; // Which positions create this opportunity
  potentialConflicts: ConflictOfInterest[];
  redFlags: string[]; // Theoretical indicators to look for
  innocentExplanations: string[]; // Alternative non-corrupt explanations
  riskLevel: 'low' | 'medium' | 'high';
  detectionDifficulty: 'easy' | 'moderate' | 'difficult';
  historicalPrecedents: HistoricalCase[]; // Real cases of similar corruption
}

// Action Item (Block 5 output)
export interface ActionItem {
  actionId: string;
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  action: string; // What to do
  rationale: string; // Why this matters
  dataSource: string; // Where to look
  expectedEvidence: string; // What you'd find if corruption exists
  estimatedTime?: string; // e.g., "2 weeks for FOI response"
  legalConsiderations?: string[]; // Any legal issues to be aware of
  relatedScenarios: string[]; // Scenario IDs this action investigates
}

// Supporting types
export interface CompanyRecord {
  companyNumber: string;
  companyName: string;
  role: string; // Director, PSC, etc.
  appointedOn?: string;
  resignedOn?: string;
  companyStatus: string;
  sourceUrl: string;
}

export interface InterestDeclaration {
  category: string; // Employment, Donations, Land, Shareholdings, etc.
  description: string;
  value?: string;
  dateRegistered: string;
  sourceUrl: string;
}

export interface CharityRecord {
  charityNumber: string;
  charityName: string;
  role: string; // Trustee, etc.
  startDate?: string;
  endDate?: string;
  charityIncome?: number;
  sourceUrl: string;
}

export interface Donation {
  donor?: string;
  recipient?: string;
  amount: number;
  date: string;
  type: string; // Donation, loan, etc.
  sourceUrl: string;
}

export interface Contract {
  contractTitle: string;
  buyer: string;
  supplier: string;
  value: number;
  awardDate: string;
  sourceUrl: string;
}

export interface ConflictOfInterest {
  description: string;
  positionA: string;
  positionB: string;
  conflictType: 'financial' | 'regulatory' | 'oversight' | 'personal';
}

export interface HistoricalCase {
  name: string;
  year: number;
  description: string;
  outcome: string;
  sourceUrl?: string;
}

export interface InvestigationSource {
  sourceType: SourceType;
  url: string;
  title: string;
  accessedAt: string;
  verificationStatus: 'verified' | 'unverified' | 'disputed';
}

export type SourceType =
  | 'companies_house'
  | 'charity_commission'
  | 'register_of_interests'
  | 'electoral_commission'
  | 'contracts_finder'
  | 'web_search'
  | 'gov_uk'
  | 'other';

// Database row types
export interface AccountabilityInvestigation {
  id: string;
  user_id: string;
  target_entity: string;
  entity_type: EntityType;
  ethics_acknowledged_at: string;
  profile_data: UKProfileData;
  corruption_scenarios: CorruptionScenario[];
  action_items: ActionItem[];
  quality_score: number | null;
  quality_notes: string[];
  generation_time_ms: number | null;
  data_sources_count: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountabilityInvestigationSource {
  id: string;
  investigation_id: string;
  source_type: SourceType;
  url: string;
  title: string | null;
  accessed_at: string;
  data_extracted: Record<string, unknown> | null;
  verification_status: 'verified' | 'unverified' | 'disputed';
  created_at: string;
}
```

#### Service Layer
Create `/lib/services/accountability-service.ts`

**Functions:**
```typescript
// CRUD operations
export async function createInvestigation(
  targetEntity: string,
  userId: string,
  entityType: EntityType,
  ethicsAcknowledgedAt: Date
): Promise<{ id: string }>;

export async function getInvestigation(
  investigationId: string
): Promise<AccountabilityInvestigation | null>;

export async function updateInvestigationResults(
  investigationId: string,
  data: {
    profileData?: UKProfileData;
    corruptionScenarios?: CorruptionScenario[];
    actionItems?: ActionItem[];
    qualityScore?: number;
    qualityNotes?: string[];
    generationTimeMs?: number;
    dataSourcesCount?: number;
  }
): Promise<void>;

export async function listUserInvestigations(
  userId: string,
  limit?: number
): Promise<AccountabilityInvestigation[]>;

// Source tracking
export async function addInvestigationSource(
  investigationId: string,
  source: {
    sourceType: SourceType;
    url: string;
    title?: string;
    dataExtracted?: Record<string, unknown>;
  }
): Promise<void>;

export async function getInvestigationSources(
  investigationId: string
): Promise<AccountabilityInvestigationSource[]>;

// Quality gate
export async function calculateQualityScore(
  profileData: UKProfileData,
  scenarios: CorruptionScenario[],
  actionItems: ActionItem[]
): Promise<{ score: number; notes: string[] }>;
```

**Quality Gate Logic:**
```typescript
// Score 0-10 based on:
// - Data sources found (0-3 = 0 points, 4-6 = 2.5 points, 7+ = 5 points)
// - Scenarios generated (<3 = 0 points, 3-5 = 2.5 points, 6+ = 5 points)
// - Action items generated (<5 = 0 points, 5-10 = 2.5 points, 11+ = 5 points)
// - Profile completeness (<5 fields = 0 points, 5-10 = 2.5 points, 11+ = 5 points)
// Refund if total score < 6.0
```

### Files to Create
1. `/lib/supabase/migrations/013_add_accountability_tracker_tables.sql`
2. `/lib/types/accountability.ts`
3. `/lib/services/accountability-service.ts`

### Acceptance Criteria
- [ ] Database migration runs successfully without errors
- [ ] Tables created with correct columns, constraints, and indexes
- [ ] RLS policies prevent users from accessing other users' investigations
- [ ] Service role can perform all CRUD operations
- [ ] TypeScript types compile without errors
- [ ] All service functions have proper error handling
- [ ] Quality score calculation logic returns scores 0-10
- [ ] Unit tests pass for service functions (mock Supabase client)

### Testing Requirements
**Unit Tests:**
- Test `calculateQualityScore()` with various inputs
- Test CRUD operations with mocked Supabase client
- Test RLS policies (attempt cross-user access)

**Integration Tests:**
- Create investigation, verify it's stored in DB
- Fetch investigation, verify all fields returned correctly
- Update investigation results, verify changes persisted
- Add sources, verify junction table populated

### Definition of Done
- [ ] All files created and code committed
- [ ] Migration applied to development database
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated (README or ARCHITECTURE.md)

---

## PRD 2: Data Integration - UK Public Records Service

**Goal:** Build the service layer that fetches data from UK public APIs and sources.

**Dependencies:** PRD 1 (needs types and database schema)

**Estimated Effort:** 1 week

### User Stories
- As an agent, I need to fetch Companies House data for any UK entity
- As an agent, I need to fetch Charity Commission data for trustees
- As an agent, I need to search Register of Members' Interests for MPs
- As an agent, I need to query Electoral Commission for political donations
- As a system, I need to cache API responses to avoid rate limits
- As a system, I need to gracefully handle API failures

### Technical Specifications

#### UK Public Data Service
Create `/lib/services/uk-public-data-service.ts`

**Core Functions:**
```typescript
// Main orchestrator
export async function fetchUKPublicData(
  targetEntity: string,
  entityType: EntityType
): Promise<{
  profileData: Partial<UKProfileData>;
  sources: InvestigationSource[];
  errors: Array<{ source: string; error: string }>;
}>;

// Individual source fetchers
async function fetchCompaniesHouseProfile(
  entityName: string
): Promise<{
  companies: CompanyRecord[];
  sources: InvestigationSource[];
}>;

async function fetchCharityCommissionData(
  entityName: string
): Promise<{
  charities: CharityRecord[];
  sources: InvestigationSource[];
}>;

async function fetchRegisterOfInterests(
  mpName: string
): Promise<{
  interests: InterestDeclaration[];
  sources: InvestigationSource[];
}>;

async function fetchElectoralCommissionData(
  entityName: string
): Promise<{
  donations: Donation[];
  sources: InvestigationSource[];
}>;

async function fetchGovernmentContracts(
  supplierName: string
): Promise<{
  contracts: Contract[];
  sources: InvestigationSource[];
}>;
```

#### Companies House API Integration

**Authentication:**
```typescript
// API Key stored in env: COMPANIES_HOUSE_API_KEY
// Basic auth: base64(apiKey + ':')
const auth = Buffer.from(apiKey + ':').toString('base64');
```

**Endpoints to Use:**
- Search officers: `GET /search/officers?q={name}`
- Get officer appointments: `GET /officers/{officer_id}/appointments`
- Get company profile: `GET /company/{company_number}`
- Get company officers: `GET /company/{company_number}/officers`
- Get PSC (People with Significant Control): `GET /company/{company_number}/persons-with-significant-control`

**Rate Limits:** 600 requests per 5 minutes (carefully manage)

#### Tavily Integration for Other Sources

**Pattern for sources without APIs:**
```typescript
import { tavilySearch } from '@/lib/services/tavily-service';

async function searchCharityCommission(name: string) {
  const results = await tavilySearch({
    query: `${name} site:register-of-charities.charitycommission.gov.uk`,
    max_results: 10,
    search_depth: 'advanced'
  });

  // Parse results to extract charity data
  return parseCharityData(results);
}
```

**Sources using Tavily:**
- Charity Commission (no official API)
- Register of Members' Interests (Parliament.uk)
- Electoral Commission (limited API)
- Contracts Finder (limited API)

#### Caching Strategy

**Cache Layer:**
```typescript
import { withCache } from '@/lib/cache/with-cache';

async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 86400 // 24 hours default
): Promise<T> {
  return withCache(key, fetcher, ttlSeconds);
}

// Cache key format: uk_data:{source}:{entity_name}
const cacheKey = `uk_data:companies_house:${entityName.toLowerCase()}`;
```

**TTLs:**
- Companies House: 24 hours (data changes infrequently)
- Charity Commission: 24 hours
- Register of Interests: 12 hours (more frequent updates)
- Electoral Commission: 12 hours

#### Error Handling

**Graceful Degradation:**
```typescript
const results = {
  companiesHouse: null as CompanyRecord[] | null,
  charityCommission: null as CharityRecord[] | null,
  registerOfInterests: null as InterestDeclaration[] | null,
  electoralCommission: null as Donation[] | null,
  errors: [] as Array<{ source: string; error: string }>
};

// Try each source independently
try {
  results.companiesHouse = await fetchCompaniesHouseProfile(entity);
} catch (error) {
  results.errors.push({
    source: 'Companies House',
    error: error.message
  });
  // Log to Sentry but continue
  Sentry.captureException(error, {
    tags: { component: 'uk-public-data', source: 'companies_house' }
  });
}

// Continue with other sources...
```

**Retry Logic:**
```typescript
import { withRetry } from '@/lib/agents/retry-wrapper';

const data = await withRetry(
  () => fetchCompaniesHouseAPI(endpoint),
  {
    agentName: 'companies-house-fetcher',
    maxRetries: 3,
    initialDelayMs: 1000
  }
);
```

### Files to Create
1. `/lib/services/uk-public-data-service.ts` (main orchestrator)
2. `/lib/services/companies-house-api.ts` (Companies House integration)
3. `/lib/parsers/charity-commission-parser.ts` (parse Tavily results)
4. `/lib/parsers/parliament-parser.ts` (parse Register of Interests)
5. `/lib/parsers/electoral-commission-parser.ts` (parse donation data)

### Environment Variables Required
```bash
# Add to .env.local
COMPANIES_HOUSE_API_KEY=your_key_here
```

**Registration:** https://developer.company-information.service.gov.uk/

### Acceptance Criteria
- [ ] Companies House API integration works for real entities (test: "Boris Johnson")
- [ ] Charity Commission search returns results via Tavily
- [ ] Register of Interests search works for MPs
- [ ] Electoral Commission donation search returns data
- [ ] All sources have proper error handling (API down doesn't crash)
- [ ] Caching works (duplicate requests don't hit APIs)
- [ ] All fetched data includes source URLs for attribution
- [ ] Integration with existing Tavily service works
- [ ] Errors logged to Sentry with proper context

### Testing Requirements
**Unit Tests:**
- Mock Companies House API responses, test parsing logic
- Test cache hit/miss behavior
- Test error handling (API returns 404, 500, rate limit)
- Test retry logic for transient failures

**Integration Tests:**
- Fetch real data for "Boris Johnson" (high-profile UK figure)
- Fetch real data for "Serco Ltd" (major contractor)
- Test with non-existent entity ("Asdfghjkl Zxcvbnm")
- Verify cache populated after first request
- Test concurrent requests (ensure no race conditions)

**Manual Testing:**
- Register for Companies House API key
- Test API key works with live API
- Verify rate limiting respected (no 429 errors)
- Check Sentry logs for any errors

### Definition of Done
- [ ] All files created and code committed
- [ ] Companies House API key registered and configured
- [ ] Unit tests written and passing (with mocked APIs)
- [ ] Integration tests written and passing (with real APIs)
- [ ] Successfully fetched data for 3+ test entities
- [ ] Caching verified working (no duplicate API calls)
- [ ] Error handling tested (simulate API failures)
- [ ] Code reviewed and approved
- [ ] Sentry integration verified (errors logged correctly)

---

## PRD 3: AI Agents - LangGraph Orchestration & Agent Implementation

**Goal:** Build the LangGraph workflow and all AI agents (entity classification, Blocks 1/2/5, quality check).

**Dependencies:** PRD 1 (types), PRD 2 (UK data service)

**Estimated Effort:** 1 week

### User Stories
- As a system, I need to classify entities as individual or organization
- As a system, I need to analyze UK profile data and generate a structured report (Block 1)
- As a system, I need to map theoretical corruption scenarios based on positions (Block 2)
- As a system, I need to generate prioritized investigation action items (Block 5)
- As a system, I need to check quality and trigger refunds if insufficient data

### Technical Specifications

#### LangGraph Orchestrator
Create `/lib/agents/accountability-tracker-orchestrator.ts`

**State Schema:**
```typescript
import { Annotation, StateGraph } from '@langchain/langgraph';

export const AccountabilityStateAnnotation = Annotation.Root({
  // Input
  targetEntity: Annotation<string>(),
  investigationId: Annotation<string | null>(),

  // Agent outputs
  entityType: Annotation<'individual' | 'organization' | null>(),
  profileData: Annotation<UKProfileData | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  corruptionScenarios: Annotation<CorruptionScenario[] | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),
  actionItems: Annotation<ActionItem[] | null>({
    reducer: (prev, next) => next ?? prev,
    default: () => null,
  }),

  // Quality & tracking
  qualityScore: Annotation<number | null>(),
  qualityNotes: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  error: Annotation<string | null>(),
  completedSteps: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

export type AccountabilityState = typeof AccountabilityStateAnnotation.State;
```

**Graph Structure:**
```typescript
export function createAccountabilityGraph() {
  const graph = new StateGraph(AccountabilityStateAnnotation)
    .addNode("entity_classification", entityClassificationNode)
    .addNode("uk_profile_research", ukProfileResearchNode)
    .addNode("corruption_analysis", corruptionAnalysisNode)
    .addNode("action_list_generation", actionListGenerationNode)
    .addNode("quality_check", qualityCheckNode)
    .addEdge(START, "entity_classification")
    .addEdge("entity_classification", "uk_profile_research")
    .addEdge("uk_profile_research", "corruption_analysis")
    .addEdge("corruption_analysis", "action_list_generation")
    .addEdge("action_list_generation", "quality_check")
    .addEdge("quality_check", END);

  return graph.compile();
}
```

**Main Execution Function:**
```typescript
export async function generateAccountabilityReport(
  targetEntity: string,
  investigationId: string,
  callbacks?: GenerationCallbacks
): Promise<{
  profileData: UKProfileData;
  corruptionScenarios: CorruptionScenario[];
  actionItems: ActionItem[];
  qualityScore: number;
  qualityNotes: string[];
}>;
```

#### Agent System Prompts
Create `/lib/agents/accountability-personas.ts`

**Entity Classification Agent (Haiku):**
```typescript
export const ENTITY_CLASSIFICATION_PROMPT = `You are an entity classification agent.

Your task: Determine if the target entity is an individual person or an organization.

Input: Entity name (e.g., "Boris Johnson" or "Serco Ltd")

Output: JSON with:
{
  "entityType": "individual" | "organization",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Brief explanation"
}

Guidelines:
- "Ltd", "Limited", "plc", "PLC" indicates organization
- Personal names (First Last) indicate individual
- If unsure, default to "individual" with low confidence
`;
```

**UK Profile Research Agent (Opus):**
```typescript
export const UK_PROFILE_RESEARCH_PROMPT = `You are a UK investigative research agent specializing in public records analysis.

Your task: Build a comprehensive factual profile of the target entity using ONLY publicly available UK data sources.

MANDATORY DATA SOURCES (prioritize in this order):
1. **Companies House** - Directorships, PSC, company filings
2. **Register of Members' Interests** (if MP/Peer) - Employment, donations, land, shareholdings
3. **Charity Commission** - Trustee positions, charity finances
4. **Electoral Commission** - Political donations given and received
5. **Contracts Finder** - Government contracts awarded

OUTPUT FORMAT:
Return structured JSON following the UKProfileData interface exactly.

CRITICAL RULES:
- ONLY use verified public records (provided in context)
- NO speculation or inference beyond data
- NO social media or news as primary sources
- Mark uncertainty clearly ("unclear if...", "appears to be...")
- Include source URL for EVERY claim
- Use null for missing data
- Include date ranges for all positions

TONE: Clinical, factual, neutral. This is NOT an accusation - it's a factual profile.
`;
```

**Corruption Analysis Agent (Opus):**
```typescript
export const CORRUPTION_ANALYSIS_PROMPT = `You are a structural corruption analyst specialized in UK governance and business systems.

Your task: Analyze the provided profile data to map THEORETICAL corruption scenarios based on incentive structures, NOT to prove wrongdoing occurred.

⚠️ CRITICAL ETHICAL FRAMING:
This is theoretical structural analysis. You are analyzing the ROLE and POSITION, not the PERSON's character. Every scenario must be framed as hypothetical.

FRAMEWORK:
1. **Position Analysis**: What powers/access does each position grant?
2. **Financial Incentive Mapping**: What financial interests exist? Where could they conflict?
3. **Network Analysis**: What relationships create potential influence pathways?
4. **Theoretical Scenario Construction**: IF someone wanted to abuse these positions, HOW could they theoretically do it?

OUTPUT: 3-5 corruption scenarios, each with:
- Clear description of the theoretical mechanism
- Which positions enable it
- What incentives exist
- What red flags to look for
- **Innocent alternative explanations** (MANDATORY)
- Risk level (low/medium/high)
- Historical precedents (real cases of similar corruption in similar roles)

MANDATORY LANGUAGE RULES:
- Use conditional language: "could enable", "might create pressure to"
- State clearly: "This is theoretical structural analysis, NOT evidence of wrongdoing"
- For every scenario, include innocent alternative explanations
- Emphasize: Correlation does NOT equal causation
- Remind: Innocent until proven guilty

RANK BY:
1. Structural plausibility (how easy would this be to execute?)
2. Financial magnitude (how much money/benefit involved?)
3. Detection difficulty (how well could this be hidden?)

FOCUS: Structural vulnerabilities, not character accusations.
`;
```

**Action List Generation Agent (Opus):**
```typescript
export const ACTION_LIST_GENERATION_PROMPT = `You are an investigative journalism advisor providing actionable next steps.

Your task: Generate prioritized action items for investigating the theoretical scenarios identified.

For each action item:
1. **What to do**: Specific, actionable step
2. **Why it matters**: How this advances the investigation
3. **Where to look**: Exact data source or authority to contact
4. **What you'd find**: If corruption exists, what evidence would this reveal?
5. **Priority**: 1 (high), 2 (medium), 3 (low)
6. **Estimated time**: Realistic timeline (e.g., "2 weeks for FOI response")
7. **Legal considerations**: Any defamation, GDPR, or FOI Act issues

PRIORITIZATION CRITERIA:
- **Priority 1 (High)**: Publicly available, high-impact, quick to obtain
  - Examples: Check Companies House filings, search Register of Interests, query Electoral Commission
- **Priority 2 (Medium)**: Requires FOI/formal request, medium-impact, 2-8 week timeline
  - Examples: FOI to government departments, request minutes from council meetings
- **Priority 3 (Low)**: Complex investigations, long timeline, confirmatory only
  - Examples: Deep financial forensics, interview programs, long-term surveillance

OUTPUT: 8-15 action items total, balanced across priorities.

LEGAL/ETHICAL BOUNDARIES:
- Focus on legal, ethical investigation methods ONLY
- Emphasize FOI requests, public records, financial disclosures
- NO illegal methods (hacking, bribery, trespassing)
- NO harassment or privacy violations
- Respect GDPR journalism exemptions
- Consider UK defamation law (truth, public interest, honest opinion defenses)

IMPORTANT: Each action must be something a journalist could realistically do within UK law.
`;
```

**Quality Check Agent (Haiku):**
```typescript
export const QUALITY_CHECK_PROMPT = `You are a quality assessment agent.

Evaluate the investigation results on these criteria:

1. **Data Sources** (0-3 sources = FAIL, 4+ sources = PASS)
2. **Scenarios Generated** (fewer than 3 = FAIL, 3+ = PASS)
3. **Action Items Generated** (fewer than 5 = FAIL, 5+ = PASS)
4. **Profile Completeness** (fewer than 5 data fields = FAIL, 5+ = PASS)

Calculate score 0-10:
- Each criterion contributes 2.5 points
- Must score ≥6.0 to pass quality gate

Output JSON:
{
  "score": 7.5,
  "notes": ["reason 1", "reason 2"],
  "passesGate": true
}
`;
```

#### Agent Implementation Files

**Create `/lib/agents/entity-classification-agent.ts`:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

export async function entityClassificationNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", // Cheap for simple classification
    max_tokens: 500,
    messages: [{
      role: "user",
      content: ENTITY_CLASSIFICATION_PROMPT + `\n\nEntity: ${state.targetEntity}`
    }]
  });

  const result = JSON.parse(message.content[0].text);

  return {
    entityType: result.entityType,
    completedSteps: ['entity_classification']
  };
}
```

**Create `/lib/agents/uk-profile-research-agent.ts`:**
```typescript
export async function ukProfileResearchNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  // 1. Fetch UK public data
  const { profileData, sources, errors } = await fetchUKPublicData(
    state.targetEntity,
    state.entityType!
  );

  // 2. Pass to Claude Opus for synthesis
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101", // Complex reasoning
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: UK_PROFILE_RESEARCH_PROMPT +
        `\n\nTarget Entity: ${state.targetEntity}` +
        `\n\nEntity Type: ${state.entityType}` +
        `\n\nRaw Data:\n${JSON.stringify(profileData, null, 2)}`
    }]
  });

  const synthesizedProfile = JSON.parse(message.content[0].text);

  // 3. Store sources in DB
  if (state.investigationId) {
    for (const source of sources) {
      await addInvestigationSource(state.investigationId, source);
    }
  }

  return {
    profileData: synthesizedProfile,
    completedSteps: ['uk_profile_research']
  };
}
```

**Create `/lib/agents/corruption-analysis-agent.ts`:**
```typescript
export async function corruptionAnalysisNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: CORRUPTION_ANALYSIS_PROMPT +
        `\n\nProfile Data:\n${JSON.stringify(state.profileData, null, 2)}`
    }]
  });

  const scenarios = JSON.parse(message.content[0].text);

  return {
    corruptionScenarios: scenarios,
    completedSteps: ['corruption_analysis']
  };
}
```

**Create `/lib/agents/action-list-agent.ts`:**
```typescript
export async function actionListGenerationNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await anthropic.messages.create({
    model: "claude-opus-4-5-20251101",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: ACTION_LIST_GENERATION_PROMPT +
        `\n\nProfile:\n${JSON.stringify(state.profileData, null, 2)}` +
        `\n\nScenarios:\n${JSON.stringify(state.corruptionScenarios, null, 2)}`
    }]
  });

  const actionItems = JSON.parse(message.content[0].text);

  return {
    actionItems,
    completedSteps: ['action_list_generation']
  };
}
```

**Create `/lib/agents/quality-check-agent.ts`:**
```typescript
export async function qualityCheckNode(
  state: AccountabilityState
): Promise<Partial<AccountabilityState>> {
  // Use calculateQualityScore from accountability-service
  const { score, notes } = await calculateQualityScore(
    state.profileData!,
    state.corruptionScenarios!,
    state.actionItems!
  );

  // Update investigation in DB
  if (state.investigationId) {
    await updateInvestigationResults(state.investigationId, {
      profileData: state.profileData!,
      corruptionScenarios: state.corruptionScenarios!,
      actionItems: state.actionItems!,
      qualityScore: score,
      qualityNotes: notes
    });
  }

  return {
    qualityScore: score,
    qualityNotes: notes,
    completedSteps: ['quality_check']
  };
}
```

### Files to Create
1. `/lib/agents/accountability-tracker-orchestrator.ts` (state machine)
2. `/lib/agents/accountability-personas.ts` (all system prompts)
3. `/lib/agents/entity-classification-agent.ts`
4. `/lib/agents/uk-profile-research-agent.ts`
5. `/lib/agents/corruption-analysis-agent.ts`
6. `/lib/agents/action-list-agent.ts`
7. `/lib/agents/quality-check-agent.ts`

### Acceptance Criteria
- [ ] LangGraph graph compiles without errors
- [ ] All 5 agent nodes execute successfully
- [ ] Entity classification returns correct type for test entities
- [ ] UK profile research synthesizes data from UK data service
- [ ] Corruption analysis generates 3-5 scenarios with proper ethical framing
- [ ] Action list generates 8-15 items across priority levels
- [ ] Quality check calculates scores correctly (0-10 range)
- [ ] All agent outputs match TypeScript interfaces
- [ ] Ethical language validated (no accusations, conditional phrasing)
- [ ] Error handling works (agents fail gracefully)

### Testing Requirements
**Unit Tests:**
- Mock Anthropic API responses for each agent
- Test state transitions in LangGraph
- Validate output schemas against TypeScript types
- Test quality score calculation with various inputs

**Integration Tests:**
- Run full pipeline for "Boris Johnson"
- Run full pipeline for "Serco Ltd"
- Run with minimal data (test quality gate failure)
- Verify all state updates persist correctly
- Test error handling (Anthropic API failure)

**Prompt Testing:**
- Verify ethical framing in corruption scenarios (no direct accusations)
- Check conditional language usage ("could", "might", "theoretically")
- Validate innocent alternative explanations included
- Test with edge cases (entity with no data, highly controversial figure)

### Definition of Done
- [ ] All files created and code committed
- [ ] LangGraph workflow executes end-to-end successfully
- [ ] Unit tests written and passing (mocked Anthropic API)
- [ ] Integration tests written and passing (real Anthropic API)
- [ ] Prompt engineering validated (ethical framing correct)
- [ ] Successfully generated reports for 3+ test entities
- [ ] Quality gate tested (both pass and fail scenarios)
- [ ] Code reviewed and approved
- [ ] Anthropic API usage costs estimated and logged

---

## PRD 4: API Layer - REST Endpoints & SSE Streaming

**Goal:** Build the API routes that expose the Accountability Tracker functionality.

**Dependencies:** PRD 1 (service layer), PRD 3 (orchestrator)

**Estimated Effort:** 1 week

### User Stories
- As a frontend, I need an endpoint to generate investigations with SSE progress updates
- As a frontend, I need an endpoint to fetch completed investigation results
- As a frontend, I need an endpoint to export investigations to PDF
- As a system, I need to enforce rate limiting (3 per hour)
- As a system, I need to integrate with the credit system (deduct/refund credits)

### Technical Specifications

#### Main Generation Endpoint
Create `/app/api/accountability/generate/route.ts`

**Method:** POST
**Middleware:** `withRateLimit` (3 per hour) + `withAuth`
**Max Duration:** 300 seconds (5 minutes)

**Request Body:**
```typescript
{
  targetEntity: string;
  ethicsAcknowledged: boolean;
}
```

**Response:** SSE stream with events:
- `agent_started` - Agent begins execution
- `agent_completed` - Agent finishes (includes duration)
- `stage_changed` - Pipeline moves to next stage
- `complete` - Investigation ready
- `error` - Generation failed

**Implementation:**
```typescript
import { withAuth } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/auth/rate-limit';
import { compose } from '@/lib/auth/compose';
import { hasCredits, deductCredits, refundCredits } from '@/lib/services/credit-service';
import { createInvestigation } from '@/lib/services/accountability-service';
import { generateAccountabilityReport } from '@/lib/agents/accountability-tracker-orchestrator';

export const maxDuration = 300; // 5 minutes
export const dynamic = "force-dynamic";

function createSSEResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function sendSSE(
  controller: ReadableStreamDefaultController,
  event: string,
  data: any
) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

export const POST = compose(
  withRateLimit({ requests: 3, window: 3600 }), // 3 per hour
  withAuth,
  async (req, { user }) => {
    try {
      const { targetEntity, ethicsAcknowledged } = await req.json();

      // Validate ethics acknowledgment
      if (!ethicsAcknowledged) {
        return Response.json(
          { error: "Ethics acknowledgment required" },
          { status: 400 }
        );
      }

      // Check credits
      const INVESTIGATION_COST = 1;
      const hasSufficientCredits = await hasCredits(user.id, INVESTIGATION_COST);

      if (!hasSufficientCredits) {
        return Response.json({
          error: "Insufficient credits",
          creditsLink: "/credits"
        }, { status: 402 });
      }

      // Create investigation record
      const { id: investigationId } = await createInvestigation(
        targetEntity,
        user.id,
        'individual', // Will be determined by agent
        new Date()
      );

      // Deduct credit
      await deductCredits(
        user.id,
        INVESTIGATION_COST,
        investigationId,
        `Accountability investigation: ${targetEntity}`
      );

      // Run orchestrator with SSE streaming
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const result = await generateAccountabilityReport(
              targetEntity,
              investigationId,
              {
                onAgentStarted: (agentName, stageName) => {
                  sendSSE(controller, "agent_started", {
                    agentName,
                    stageName,
                    timestamp: new Date().toISOString()
                  });
                },
                onAgentCompleted: (agentName, stageName, durationMs) => {
                  sendSSE(controller, "agent_completed", {
                    agentName,
                    stageName,
                    durationMs,
                    timestamp: new Date().toISOString()
                  });
                },
                onStageChanged: (stageName, activeAgents) => {
                  sendSSE(controller, "stage_changed", {
                    stageName,
                    activeAgents,
                    timestamp: new Date().toISOString()
                  });
                },
                onError: (error) => {
                  sendSSE(controller, "error", {
                    error,
                    timestamp: new Date().toISOString()
                  });
                }
              }
            );

            // Quality gate check
            if (result.qualityScore < 6.0) {
              await refundCredits(
                user.id,
                INVESTIGATION_COST,
                investigationId,
                "Quality gate failed: insufficient data"
              );

              sendSSE(controller, "complete", {
                success: false,
                creditRefunded: true,
                qualityScore: result.qualityScore,
                reason: "Insufficient public data to generate reliable investigation",
                timestamp: new Date().toISOString()
              });
            } else {
              sendSSE(controller, "complete", {
                success: true,
                investigationId,
                qualityScore: result.qualityScore,
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error("Investigation generation failed:", error);

            // Refund on error
            await refundCredits(
              user.id,
              INVESTIGATION_COST,
              investigationId,
              "Generation failed due to error"
            );

            sendSSE(controller, "error", {
              success: false,
              creditRefunded: true,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          } finally {
            controller.close();
          }
        }
      });

      return createSSEResponse(stream);

    } catch (error) {
      console.error("Request processing failed:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
```

#### Fetch Investigation Endpoint
Create `/app/api/accountability/[id]/route.ts`

**Method:** GET
**Middleware:** `withAuth`

**Implementation:**
```typescript
export const GET = withAuth(async (req, { user, params }) => {
  try {
    const investigationId = params.id;

    const investigation = await getInvestigation(investigationId);

    if (!investigation) {
      return Response.json(
        { error: "Investigation not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (investigation.user_id !== user.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch sources
    const sources = await getInvestigationSources(investigationId);

    return Response.json({
      investigation: {
        ...investigation,
        sources
      }
    });

  } catch (error) {
    console.error("Failed to fetch investigation:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
```

#### Export/PDF Endpoint
Create `/app/api/accountability/[id]/export/route.ts`

**Method:** GET
**Middleware:** `withAuth`

**Implementation:**
```typescript
export const GET = withAuth(async (req, { user, params }) => {
  try {
    const investigationId = params.id;

    const investigation = await getInvestigation(investigationId);

    if (!investigation) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (investigation.user_id !== user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Redirect to print-optimized page
    // User can then print to PDF via browser (Cmd+P / Ctrl+P)
    return Response.redirect(
      new URL(`/accountability/${investigationId}/print`, req.url)
    );

  } catch (error) {
    console.error("Export failed:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
```

#### List User Investigations Endpoint
Create `/app/api/accountability/route.ts`

**Method:** GET
**Middleware:** `withAuth`

**Implementation:**
```typescript
export const GET = withAuth(async (req, { user }) => {
  try {
    const investigations = await listUserInvestigations(user.id, 50);

    return Response.json({ investigations });

  } catch (error) {
    console.error("Failed to list investigations:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
```

### Files to Create
1. `/app/api/accountability/generate/route.ts` (main generation endpoint)
2. `/app/api/accountability/[id]/route.ts` (fetch investigation)
3. `/app/api/accountability/[id]/export/route.ts` (PDF export redirect)
4. `/app/api/accountability/route.ts` (list user investigations)

### Acceptance Criteria
- [ ] POST /api/accountability/generate returns SSE stream
- [ ] SSE events emit in correct order (agent_started → agent_completed → complete)
- [ ] Credit deducted before generation starts
- [ ] Credit refunded if quality score <6.0
- [ ] Credit refunded if generation errors
- [ ] Rate limiting blocks 4th request in 1 hour
- [ ] GET /api/accountability/[id] returns investigation data
- [ ] Authorization enforced (users can't access others' investigations)
- [ ] Export endpoint redirects to print page
- [ ] List endpoint returns user's investigations only

### Testing Requirements
**Unit Tests:**
- Mock orchestrator, test SSE event generation
- Test credit deduction/refund logic
- Test authorization checks (cross-user access blocked)
- Test rate limiting (4th request blocked)

**Integration Tests:**
- Full generation flow end-to-end
- Test with real user, verify credit transaction logged
- Test quality gate failure (verify refund)
- Test generation error (verify refund)
- Fetch investigation, verify all fields returned
- Test export redirect

**Load Tests:**
- Simulate 10 concurrent generation requests
- Verify rate limiting works correctly
- Check for race conditions in credit system

### Definition of Done
- [ ] All API routes created and tested
- [ ] SSE streaming works in browser (test with curl or Postman)
- [ ] Credit integration tested (deduction + refund scenarios)
- [ ] Rate limiting tested (4th request blocked)
- [ ] Authorization tested (cross-user access blocked)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] API documented (README or API.md)
- [ ] Code reviewed and approved

---

## PRD 5: Frontend - UI Components & Pages

**Goal:** Build the user-facing UI for the Accountability Tracker feature.

**Dependencies:** PRD 4 (API endpoints)

**Estimated Effort:** 1 week

### User Stories
- As a user, I want to enter a target entity name and start an investigation
- As a user, I must acknowledge ethical principles before proceeding
- As a user, I want to see real-time progress during investigation generation
- As a user, I want to view completed investigation results
- As a user, I want to export investigations to PDF
- As a user, I want to see my investigation history

### Technical Specifications

#### Landing Page
Create `/app/accountability/page.tsx`

**Components:**
- Hero section with feature explanation
- Ethics notice banner (yellow warning)
- Entity input field
- "Start Investigation (£9.99)" button
- Shows ethics modal on submit

**Implementation:**
```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountabilityEthicsModal } from "@/components/accountability/ethics-modal";

export default function AccountabilityLandingPage() {
  const router = useRouter();
  const [showEthicsModal, setShowEthicsModal] = useState(false);
  const [targetEntity, setTargetEntity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEntity.trim()) return;
    setShowEthicsModal(true);
  };

  const handleConfirm = () => {
    router.push(`/accountability/generate?entity=${encodeURIComponent(targetEntity)}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-heading text-ink-800 mb-4">
        Accountability Tracker
      </h1>

      <p className="text-lg text-ink-600 mb-8">
        Systematically investigate potential corruption using UK public records.
        Evidence-based. Transparent. Ethical.
      </p>

      <div className="bg-warning-light border-2 border-warning rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-warning-dark mb-2">
          Ethics Notice
        </h2>
        <p className="text-sm text-ink-700">
          This tool is for investigative journalism only. Remember:
          <strong> innocent until proven guilty</strong>.
          Correlation does not equal causation. All findings must be independently verified.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter name or organization to investigate..."
          value={targetEntity}
          onChange={(e) => setTargetEntity(e.target.value)}
          className="w-full px-4 py-4 rounded-xl border-2 border-ivory-600 focus:border-sage-500 transition-colors"
          required
        />

        <button
          type="submit"
          className="w-full px-6 py-4 rounded-xl bg-sage-500 text-ivory-100 font-semibold hover:bg-sage-600 transition-colors"
        >
          Start Investigation (£9.99)
        </button>
      </form>

      <AccountabilityEthicsModal
        isOpen={showEthicsModal}
        onClose={() => setShowEthicsModal(false)}
        targetEntity={targetEntity}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
```

#### Ethics Modal Component
Create `/components/accountability/ethics-modal.tsx`

**Pattern:** Radix Dialog with backdrop blur, large modal (max-w-2xl)

**Content:**
- Target entity name
- Ethical principles (bullet list)
- Checkbox acknowledgment
- Cancel/Proceed buttons

**Implementation:**
```typescript
"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetEntity: string;
  onConfirm: () => void;
}

export function AccountabilityEthicsModal({
  isOpen,
  onClose,
  targetEntity,
  onConfirm
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink-900/80 backdrop-blur-sm z-50 animate-in fade-in duration-150" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby="ethics-modal-title"
          aria-describedby="ethics-modal-description"
          className={cn(
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
            "w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto",
            "rounded-2xl bg-ivory-100 shadow-xl border border-ivory-600",
            "p-6 sm:p-8",
            "animate-in fade-in duration-150"
          )}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-ivory-200 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-ink-600" />
          </button>

          <Dialog.Title id="ethics-modal-title" className="text-2xl font-heading text-ink-800 mb-4">
            Ethics Acknowledgment Required
          </Dialog.Title>

          <Dialog.Description id="ethics-modal-description" className="sr-only">
            Please acknowledge ethical principles before proceeding with the investigation
          </Dialog.Description>

          <div className="space-y-4">
            <p className="font-semibold text-ink-800">
              You are about to investigate: <strong>{targetEntity}</strong>
            </p>

            <div className="bg-warning-light p-4 rounded-lg">
              <h3 className="font-semibold text-warning-dark mb-2">
                Important Principles:
              </h3>
              <ul className="list-disc ml-6 space-y-2 text-ink-700">
                <li><strong>Innocent until proven guilty</strong></li>
                <li>Correlation does <strong>not</strong> equal causation</li>
                <li>This tool maps theoretical possibilities, NOT confirmed wrongdoing</li>
                <li>All findings must be verified through traditional investigative methods</li>
                <li>Use responsibly and ethically for legitimate journalism only</li>
              </ul>
            </div>

            <p className="text-sm text-ink-600">
              This investigation will analyze public records to identify potential conflicts
              of interest and incentive structures that could <em>theoretically</em> enable corruption.
              It does not prove corruption occurred.
            </p>

            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg hover:bg-ivory-200 transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-ink-700">
                I understand these principles and will use this tool ethically for
                legitimate investigative journalism purposes only.
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-ivory-600 text-ink-700 font-semibold hover:bg-ivory-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!acknowledged}
              className={cn(
                "flex-1 px-6 py-3 rounded-lg font-semibold transition-colors",
                acknowledged
                  ? "bg-sage-500 text-ivory-100 hover:bg-sage-600"
                  : "bg-ivory-400 text-ink-400 cursor-not-allowed"
              )}
            >
              Proceed with Investigation
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

#### Generation Progress Page
Create `/app/accountability/generate/page.tsx`

**Shows real-time progress using SSE**

**Implementation:** Reuse brief generation progress pattern with custom stages:
- Entity Classification
- UK Profile Research
- Corruption Analysis
- Action List Generation
- Quality Check

#### Results Page
Create `/app/accountability/[id]/page.tsx`

**Layout:**
- Header with target name, date, "Export PDF" button
- Ethics reminder banner (always visible)
- Profile section (expandable cards)
- Scenarios section (risk-level badges)
- Action items section (priority grouping)
- Sources footer

#### Print Layout Page
Create `/app/accountability/[id]/print/page.tsx`

**Features:**
- Clean print CSS
- Page breaks between sections
- Title page with disclaimer
- Footer watermark: "RESEARCH HYPOTHESIS ONLY"

#### Display Components

**Create these reusable components:**
1. `/components/accountability/profile-section.tsx` - Display UK profile data
2. `/components/accountability/scenarios-section.tsx` - Display corruption scenarios
3. `/components/accountability/action-items-section.tsx` - Display prioritized actions
4. `/components/accountability/investigation-progress.tsx` - SSE progress tracking

### Files to Create
1. `/app/accountability/page.tsx` (landing page)
2. `/app/accountability/generate/page.tsx` (progress page)
3. `/app/accountability/[id]/page.tsx` (results page)
4. `/app/accountability/[id]/print/page.tsx` (print layout)
5. `/components/accountability/ethics-modal.tsx`
6. `/components/accountability/profile-section.tsx`
7. `/components/accountability/scenarios-section.tsx`
8. `/components/accountability/action-items-section.tsx`
9. `/components/accountability/investigation-progress.tsx`
10. `/lib/hooks/useInvestigationGeneration.ts` (SSE hook)

### Acceptance Criteria
- [ ] Landing page renders correctly
- [ ] Ethics modal blocks investigation until acknowledged
- [ ] Progress page shows real-time SSE updates
- [ ] Results page displays all investigation data
- [ ] Print layout formatted correctly for PDF export
- [ ] All components match design system (Sage/Ivory/Ink colors)
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Accessibility: proper ARIA labels, keyboard navigation
- [ ] Ethics warnings visible on every page

### Testing Requirements
**Component Tests (Vitest + Testing Library):**
- Test ethics modal (checkbox required to proceed)
- Test progress component (stages update correctly)
- Test results sections (data displays correctly)
- Test print layout (page breaks work)

**E2E Tests (Playwright/Cypress):**
- Full user flow: landing → ethics → progress → results → export
- Test with insufficient credits (error message shown)
- Test rate limiting (4th request blocked with message)
- Test quality gate failure (refund message shown)

### Definition of Done
- [ ] All pages and components created
- [ ] Component tests written and passing
- [ ] E2E tests written and passing
- [ ] Accessibility tested (keyboard nav, screen readers)
- [ ] Design review approved (matches State of Clarity style)
- [ ] Responsive design tested on multiple devices
- [ ] Code reviewed and approved

---

## PRD 6: Integration & Polish

**Goal:** Integrate the feature into the main app, add navigation, testing, and documentation.

**Dependencies:** PRD 1-5 (all previous PRDs)

**Estimated Effort:** Overlaps with Week 4-5 of PRD 5

### User Stories
- As a user, I want to access Accountability Tracker from the main navigation
- As a user, I want to see investigations mentioned on the credits page
- As a developer, I want comprehensive tests to ensure feature quality
- As a developer, I want documentation for future maintenance

### Technical Specifications

#### Navigation Integration
Modify `/app/components/Header.tsx`

**Add navigation link:**
```typescript
<nav>
  <Link href="/">Home</Link>
  <Link href="/explore">Explore</Link>
  <Link href="/accountability">Accountability</Link> {/* NEW */}
  <Link href="/credits">Credits</Link>
</nav>
```

#### Credits Page Update
Modify `/app/credits/page.tsx`

**Update copy to mention investigations:**
```typescript
<p>
  Use credits to generate policy briefs or conduct accountability investigations.
  Each brief or investigation costs 1 credit (£9.99).
</p>
```

#### End-to-End Tests
Create `/tests/e2e/accountability-tracker.spec.ts`

**Test scenarios:**
1. Full happy path (Boris Johnson investigation)
2. Quality gate failure (non-existent entity)
3. Insufficient credits error
4. Rate limiting (4 requests in 1 hour)
5. PDF export

#### Documentation
Create `/docs/ACCOUNTABILITY_TRACKER.md`

**Contents:**
- Feature overview
- Architecture diagram
- API endpoints documentation
- Database schema
- Agent prompts documentation
- Testing guide
- Troubleshooting

### Files to Create/Modify
1. `/app/components/Header.tsx` (modify - add nav link)
2. `/app/credits/page.tsx` (modify - update copy)
3. `/tests/e2e/accountability-tracker.spec.ts` (create)
4. `/docs/ACCOUNTABILITY_TRACKER.md` (create)

### Acceptance Criteria
- [ ] "Accountability" link visible in navigation
- [ ] Credits page mentions investigations
- [ ] E2E tests cover all major user flows
- [ ] All tests passing (unit + integration + E2E)
- [ ] Documentation complete and accurate
- [ ] Feature works in staging environment
- [ ] No regressions in existing features (briefs still work)

### Testing Requirements
**Regression Tests:**
- Verify brief generation still works
- Verify credit system works for briefs
- Verify all existing pages render correctly

**Performance Tests:**
- Measure investigation generation time (target: <2 minutes)
- Verify no memory leaks (long-running investigations)
- Check database query performance

**User Acceptance Testing:**
- Run 5+ investigations with real journalists (if possible)
- Collect feedback on UI/UX
- Verify ethical framing is clear

### Definition of Done
- [ ] Navigation updated and deployed
- [ ] Credits page updated
- [ ] All E2E tests written and passing
- [ ] Documentation complete
- [ ] Feature deployed to staging
- [ ] Regression tests passing
- [ ] User acceptance testing complete
- [ ] Product owner approval

---

## Summary: PRD Dependencies & Timeline

```
Week 1: PRD 1 (Foundation)
  ↓
Week 2: PRD 2 (Data Integration) [depends on PRD 1]
  ↓
Week 3: PRD 3 (AI Agents) [depends on PRD 1, PRD 2]
  ↓
Week 4: PRD 4 (API Layer) [depends on PRD 1, PRD 3]
  ↓
Week 5: PRD 5 (Frontend) [depends on PRD 4]
  ↓ (overlapping)
Week 5: PRD 6 (Integration & Polish) [depends on all]
```

**Total Estimated Timeline:** 5 weeks

**Critical Path:** PRD 1 → PRD 2 → PRD 3 → PRD 4 → PRD 5 → PRD 6

**Deliverable:** Fully functional Accountability Tracker feature ready for production launch.
