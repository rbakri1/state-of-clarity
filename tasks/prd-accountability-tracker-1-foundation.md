# PRD 1: Foundation - Database Schema & Core Types (Enhanced)

**Goal:** Establish the data foundation for the Accountability Tracker feature.

**Dependencies:** None (can start immediately)

**Estimated Effort:** 1 week (5 working days)

**Priority:** P0 (Blocking for all other PRDs)

---

## Context

This PRD lays the foundation for the Accountability Tracker by creating:
1. Database schema to persist investigation data
2. TypeScript types for type safety across the codebase
3. Service layer for all database operations

This is the critical path item - all other PRDs depend on this being complete.

---

## User Stories

- As a **developer**, I need database tables to store investigation data **so that** I can persist user investigations and retrieve them later
- As a **system administrator**, I need RLS policies **so that** users can only access their own investigations for privacy compliance
- As a **backend engineer**, I need type-safe service functions **so that** I can avoid runtime errors when accessing investigation data
- As a **QA engineer**, I need comprehensive test coverage **so that** I can verify data integrity and security

---

## Technical Specifications

### Database Tables

Create migration: `/lib/supabase/migrations/013_add_accountability_tracker_tables.sql`

#### Table: `accountability_investigations`
Primary table for investigation reports.

```sql
CREATE TABLE IF NOT EXISTS accountability_investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Input
  target_entity TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'organization')),
  ethics_acknowledged_at TIMESTAMPTZ NOT NULL,

  -- Output Data (JSONB for flexibility)
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  corruption_scenarios JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Quality Metrics
  quality_score NUMERIC(3, 1) CHECK (quality_score >= 0 AND quality_score <= 10),
  quality_notes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  generation_time_ms INTEGER CHECK (generation_time_ms >= 0),
  data_sources_count INTEGER DEFAULT 0 CHECK (data_sources_count >= 0),

  -- Privacy (NOT public by default - sensitive investigations)
  is_public BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accountability_investigations_updated_at
  BEFORE UPDATE ON accountability_investigations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Table: `accountability_investigation_sources`
Audit trail of all data sources used.

```sql
CREATE TABLE IF NOT EXISTS accountability_investigation_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES accountability_investigations(id) ON DELETE CASCADE,

  -- Source Details
  source_type TEXT NOT NULL CHECK (source_type IN (
    'companies_house',
    'charity_commission',
    'register_of_interests',
    'electoral_commission',
    'contracts_finder',
    'web_search',
    'gov_uk',
    'other'
  )),
  url TEXT NOT NULL,
  title TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  data_extracted JSONB,

  -- Reliability Tracking
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'disputed')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_investigations_user_id ON accountability_investigations(user_id);
CREATE INDEX idx_investigations_created_at ON accountability_investigations(created_at DESC);
CREATE INDEX idx_investigations_target ON accountability_investigations(target_entity);
CREATE INDEX idx_investigations_quality_score ON accountability_investigations(quality_score) WHERE quality_score IS NOT NULL;

CREATE INDEX idx_investigation_sources_investigation_id ON accountability_investigation_sources(investigation_id);
CREATE INDEX idx_investigation_sources_source_type ON accountability_investigation_sources(source_type);

-- JSONB indexes (if needed for performance)
-- Uncomment if queries on JSONB fields become slow
-- CREATE INDEX idx_investigations_profile_data_gin ON accountability_investigations USING GIN (profile_data);
```

#### RLS Policies

```sql
-- Enable RLS
ALTER TABLE accountability_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_investigation_sources ENABLE ROW LEVEL SECURITY;

-- Policies for accountability_investigations
CREATE POLICY "Users can view own investigations" ON accountability_investigations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create investigations" ON accountability_investigations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own investigations" ON accountability_investigations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage investigations" ON accountability_investigations
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for accountability_investigation_sources
CREATE POLICY "Users can view sources for own investigations" ON accountability_investigation_sources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accountability_investigations
      WHERE id = investigation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage investigation sources" ON accountability_investigation_sources
  FOR ALL USING (auth.role() = 'service_role');
```

### Type Definitions

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
  mechanism: string;
  incentiveStructure: {
    financialIncentives: string[];
    politicalIncentives: string[];
    careerIncentives: string[];
  };
  enablingPositions: string[];
  potentialConflicts: ConflictOfInterest[];
  redFlags: string[];
  innocentExplanations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  detectionDifficulty: 'easy' | 'moderate' | 'difficult';
  historicalPrecedents: HistoricalCase[];
}

// Action Item (Block 5 output)
export interface ActionItem {
  actionId: string;
  priority: 1 | 2 | 3;
  action: string;
  rationale: string;
  dataSource: string;
  expectedEvidence: string;
  estimatedTime?: string;
  legalConsiderations?: string[];
  relatedScenarios: string[];
}

// Supporting types
export interface CompanyRecord {
  companyNumber: string;
  companyName: string;
  role: string;
  appointedOn?: string;
  resignedOn?: string;
  companyStatus: string;
  sourceUrl: string;
}

export interface InterestDeclaration {
  category: string;
  description: string;
  value?: string;
  dateRegistered: string;
  sourceUrl: string;
}

export interface CharityRecord {
  charityNumber: string;
  charityName: string;
  role: string;
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
  type: string;
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

### Service Layer

Create `/lib/services/accountability-service.ts`

**Functions:**
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/client';
import type {
  AccountabilityInvestigation,
  AccountabilityInvestigationSource,
  EntityType,
  UKProfileData,
  CorruptionScenario,
  ActionItem,
  SourceType,
} from '@/lib/types/accountability';

/**
 * Creates a new investigation record in the database.
 *
 * @param targetEntity - Name of person or organization to investigate
 * @param userId - ID of the user creating the investigation
 * @param entityType - Whether target is 'individual' or 'organization'
 * @param ethicsAcknowledgedAt - Timestamp when user acknowledged ethics
 * @returns Investigation ID
 */
export async function createInvestigation(
  targetEntity: string,
  userId: string,
  entityType: EntityType,
  ethicsAcknowledgedAt: Date
): Promise<{ id: string }> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('accountability_investigations')
    .insert({
      target_entity: targetEntity,
      user_id: userId,
      entity_type: entityType,
      ethics_acknowledged_at: ethicsAcknowledgedAt.toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create investigation: ${error.message}`);
  }

  return { id: data.id };
}

/**
 * Retrieves an investigation by ID.
 *
 * @param investigationId - UUID of the investigation
 * @returns Investigation data or null if not found
 */
export async function getInvestigation(
  investigationId: string
): Promise<AccountabilityInvestigation | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('accountability_investigations')
    .select('*')
    .eq('id', investigationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch investigation: ${error.message}`);
  }

  return data as AccountabilityInvestigation;
}

/**
 * Updates investigation results after agent processing.
 *
 * @param investigationId - UUID of the investigation
 * @param data - Partial update data
 */
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
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (data.profileData) updateData.profile_data = data.profileData;
  if (data.corruptionScenarios) updateData.corruption_scenarios = data.corruptionScenarios;
  if (data.actionItems) updateData.action_items = data.actionItems;
  if (data.qualityScore !== undefined) updateData.quality_score = data.qualityScore;
  if (data.qualityNotes) updateData.quality_notes = data.qualityNotes;
  if (data.generationTimeMs) updateData.generation_time_ms = data.generationTimeMs;
  if (data.dataSourcesCount !== undefined) updateData.data_sources_count = data.dataSourcesCount;

  const { error } = await supabase
    .from('accountability_investigations')
    .update(updateData)
    .eq('id', investigationId);

  if (error) {
    throw new Error(`Failed to update investigation: ${error.message}`);
  }
}

/**
 * Lists all investigations for a user.
 *
 * @param userId - User ID
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of investigations
 */
export async function listUserInvestigations(
  userId: string,
  limit: number = 50
): Promise<AccountabilityInvestigation[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('accountability_investigations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list investigations: ${error.message}`);
  }

  return data as AccountabilityInvestigation[];
}

/**
 * Adds a data source record for an investigation.
 *
 * @param investigationId - Investigation UUID
 * @param source - Source details
 */
export async function addInvestigationSource(
  investigationId: string,
  source: {
    sourceType: SourceType;
    url: string;
    title?: string;
    dataExtracted?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('accountability_investigation_sources')
    .insert({
      investigation_id: investigationId,
      source_type: source.sourceType,
      url: source.url,
      title: source.title || null,
      data_extracted: source.dataExtracted || null,
    });

  if (error) {
    throw new Error(`Failed to add investigation source: ${error.message}`);
  }
}

/**
 * Retrieves all sources for an investigation.
 *
 * @param investigationId - Investigation UUID
 * @returns Array of source records
 */
export async function getInvestigationSources(
  investigationId: string
): Promise<AccountabilityInvestigationSource[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('accountability_investigation_sources')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('accessed_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch investigation sources: ${error.message}`);
  }

  return data as AccountabilityInvestigationSource[];
}

/**
 * Calculates quality score for an investigation.
 * Score range: 0-10, refund triggered if < 6.0
 *
 * Scoring breakdown:
 * - Data sources (5 points): 0-3 sources = 0, 4-6 = 2.5, 7+ = 5
 * - Scenarios (5 points): <3 = 0, 3-5 = 2.5, 6+ = 5
 * - Action items (not scored, informational)
 * - Profile completeness (not scored, informational)
 *
 * @param profileData - UK profile data
 * @param scenarios - Corruption scenarios
 * @param actionItems - Action items
 * @returns Quality score and notes
 */
export async function calculateQualityScore(
  profileData: UKProfileData,
  scenarios: CorruptionScenario[],
  actionItems: ActionItem[]
): Promise<{ score: number; notes: string[] }> {
  const notes: string[] = [];
  let score = 0;

  // Count data sources
  const sourceCount = profileData.sources?.length || 0;
  let sourceScore = 0;
  if (sourceCount >= 7) {
    sourceScore = 5;
    notes.push(`Excellent data coverage (${sourceCount} sources)`);
  } else if (sourceCount >= 4) {
    sourceScore = 2.5;
    notes.push(`Adequate data coverage (${sourceCount} sources)`);
  } else {
    sourceScore = 0;
    notes.push(`Insufficient data sources (${sourceCount}/4 minimum)`);
  }
  score += sourceScore;

  // Count scenarios
  const scenarioCount = scenarios?.length || 0;
  let scenarioScore = 0;
  if (scenarioCount >= 6) {
    scenarioScore = 5;
    notes.push(`Comprehensive scenario analysis (${scenarioCount} scenarios)`);
  } else if (scenarioCount >= 3) {
    scenarioScore = 2.5;
    notes.push(`Basic scenario coverage (${scenarioCount} scenarios)`);
  } else {
    scenarioScore = 0;
    notes.push(`Insufficient scenarios (${scenarioCount}/3 minimum)`);
  }
  score += scenarioScore;

  // Action items count (informational only)
  const actionCount = actionItems?.length || 0;
  if (actionCount < 5) {
    notes.push(`Limited action items (${actionCount})`);
  } else {
    notes.push(`${actionCount} actionable investigation steps provided`);
  }

  // Profile completeness check (informational only)
  const filledFields = Object.values(profileData).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined
  ).length;

  if (filledFields < 5) {
    notes.push(`Sparse profile data (${filledFields} fields populated)`);
  }

  // Overall quality assessment
  if (score < 6.0) {
    notes.unshift('QUALITY GATE FAILED: Investigation will be refunded');
  } else {
    notes.unshift('Quality gate passed');
  }

  return { score: Math.round(score * 10) / 10, notes };
}
```

---

## Success Metrics

- [ ] Database migration completes in < 10 seconds
- [ ] All TypeScript types compile with zero errors
- [ ] Service layer functions have < 500ms response time for CRUD operations
- [ ] RLS policies tested with 100% coverage (admin, user, cross-user scenarios)
- [ ] Quality score calculation accurate and deterministic
- [ ] Zero SQL injection vulnerabilities (parameterized queries only)

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration breaks existing tables | High | Low | Test on dev DB first, backup before migration, no FK to existing tables |
| JSONB performance issues with large profiles | Medium | Medium | Add GIN indexes on JSONB if queries slow, monitor query plans |
| Quality score logic disputed by users | Medium | Medium | Document scoring rubric clearly, allow admin manual override |
| RLS policies too permissive/restrictive | High | Low | Thorough testing with multiple user roles, security audit |
| Service functions have runtime errors | Medium | Low | Comprehensive error handling, unit test edge cases |

---

## Non-Functional Requirements

- **Performance**: All service functions must complete within 500ms for typical workloads
- **Security**: RLS policies must prevent 100% of unauthorized cross-user data access
- **Data Integrity**: Foreign key constraints enforced, no orphaned records
- **Scalability**: Schema must support 100,000+ investigations without performance degradation
- **Maintainability**: All exported functions have JSDoc comments, self-documenting code
- **Observability**: All errors logged to Sentry with context

---

## Assumptions

- Supabase database is already configured and accessible
- Service role credentials are available for server-side operations
- TypeScript 5.x is in use with strict mode enabled
- Existing credit system tables (`user_credits`, `credit_transactions`) are compatible
- `auth.users` table exists and is accessible for FK constraints
- Developers have access to development database for testing

---

## Open Questions

- [ ] **Q**: Should we add soft delete (`deleted_at`) to investigations table for audit trail?
  - **Decision**: [To be decided by team]
- [ ] **Q**: Do we need audit logging for investigation updates (who changed what when)?
  - **Decision**: [To be decided by team]
- [ ] **Q**: Should quality_score be nullable (for in-progress investigations) or default to 0?
  - **Decision**: Nullable (NULL = not yet scored)
- [ ] **Q**: Do we need JSONB GIN indexes immediately or wait for performance issues?
  - **Decision**: Wait for performance metrics, add if needed
- [ ] **Q**: Should we limit target_entity length (TEXT is unlimited)?
  - **Decision**: Add CHECK constraint: `LENGTH(target_entity) <= 500`

---

## Files to Create

1. `/lib/supabase/migrations/013_add_accountability_tracker_tables.sql` - Database schema
2. `/lib/types/accountability.ts` - TypeScript type definitions
3. `/lib/services/accountability-service.ts` - CRUD service layer

**Total LOC Estimate:** ~800 lines

---

## Acceptance Criteria

- [ ] Database migration runs successfully without errors on dev database
- [ ] All tables created with correct columns, constraints, and indexes
- [ ] RLS policies prevent users from accessing other users' investigations (tested)
- [ ] Service role can perform all CRUD operations (tested)
- [ ] TypeScript types compile without errors in strict mode
- [ ] All service functions have proper error handling for edge cases
- [ ] Quality score calculation returns scores in 0-10 range (tested with various inputs)
- [ ] Unit tests pass for service functions (>80% code coverage)
- [ ] Integration tests pass (real Supabase database)
- [ ] No SQL injection vulnerabilities (verified with static analysis)

---

## Testing Requirements

### Unit Tests
Create `/tests/unit/accountability-service.test.ts`

**Test Cases:**
- `calculateQualityScore()` with various inputs:
  - 0 sources, 0 scenarios → score = 0
  - 5 sources, 4 scenarios → score = 5.0
  - 10 sources, 7 scenarios → score = 10.0
  - Edge case: null/undefined inputs
- CRUD operations with mocked Supabase client:
  - `createInvestigation()` success and error cases
  - `getInvestigation()` found, not found, error cases
  - `updateInvestigationResults()` with partial updates
  - `listUserInvestigations()` with pagination
  - `addInvestigationSource()` and `getInvestigationSources()`

### Integration Tests
Create `/tests/integration/accountability-database.test.ts`

**Test Scenarios:**
1. Create investigation → verify stored in DB
2. Fetch investigation → verify all fields returned correctly
3. Update investigation results → verify changes persisted
4. Add sources → verify junction table populated
5. RLS policy test: User A cannot access User B's investigation
6. RLS policy test: Service role can access all investigations
7. Cascade delete: Delete investigation → sources also deleted

### Manual Testing Checklist
- [ ] Run migration on local dev database
- [ ] Create test investigation via Supabase UI
- [ ] Verify RLS by querying as different users
- [ ] Test quality score with edge cases
- [ ] Verify indexes exist (`EXPLAIN ANALYZE` queries)

---

## Code Review Checklist

Reviewers must verify:
- [ ] Migration SQL syntax is correct (linted with `pg_format` or similar)
- [ ] All indexes are necessary and properly defined (no redundant indexes)
- [ ] RLS policies tested with edge cases (admin, regular user, unauthenticated, cross-user)
- [ ] TypeScript types match database schema exactly (use Supabase codegen)
- [ ] Service functions have error handling for ALL edge cases
- [ ] JSDoc comments on all exported functions (with @param, @returns, @throws)
- [ ] No hardcoded values (use constants or environment variables)
- [ ] SQL injection prevention (parameterized queries only, no string concatenation)
- [ ] No N+1 query issues (use `.select()` appropriately)
- [ ] Foreign key constraints have ON DELETE CASCADE where appropriate

---

## Rollback Plan

If this PRD causes critical issues in production:

1. **Revert database migration:**
   ```sql
   -- Down migration (create in same file as up migration)
   DROP TABLE IF EXISTS accountability_investigation_sources CASCADE;
   DROP TABLE IF EXISTS accountability_investigations CASCADE;
   DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
   ```

2. **Remove service functions:**
   - Delete `/lib/services/accountability-service.ts`
   - Remove imports from other files (none yet, isolated feature)

3. **Remove TypeScript types:**
   - Delete `/lib/types/accountability.ts`

4. **Verify no impact on existing features:**
   - No dependencies on accountability tables
   - Isolated feature, safe to remove

**Rollback Time Estimate:** < 5 minutes

**Rollback Risk:** Low (no dependencies on this feature yet)

---

## Data Migration Strategy

This is a **new feature** with no existing data:
- Start with empty tables
- No data migration needed
- No backward compatibility concerns

**Future Consideration:** If beta users have test data in different schema, create separate migration plan.

---

## Definition of Done

- [ ] All files created and code committed to feature branch
- [ ] Migration applied to development database successfully
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Documentation updated (README.md with schema diagram)
- [ ] Security review completed (RLS policies audited)
- [ ] Migration tested on staging environment
- [ ] Performance benchmarks recorded (baseline for future comparison)
- [ ] Merged to main branch and deployed

---

## Timeline Breakdown

**Day 1-2:** Database schema design and migration creation
**Day 2-3:** TypeScript type definitions
**Day 3-4:** Service layer implementation
**Day 4:** Unit tests
**Day 5:** Integration tests, code review, documentation

**Total:** 5 working days

---

## Dependencies (Upstream)

None - this is the first PRD in the sequence.

## Dependencies (Downstream)

The following PRDs depend on this being complete:
- **PRD 2**: Data Integration (needs types)
- **PRD 3**: AI Agents (needs types and service layer)
- **PRD 4**: API Layer (needs service layer)
- **PRD 5**: Frontend (needs types for props)

---

## Stakeholder Sign-off

- [ ] Engineering Lead: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______
- [ ] Security Reviewer: _________________ Date: _______

---

**Document Version:** 2.0 (Enhanced)
**Last Updated:** 2026-01-14
**Author:** Implementation Team
