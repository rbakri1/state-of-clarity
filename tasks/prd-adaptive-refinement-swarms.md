# PRD: Adaptive Refinement Swarms

## Introduction

Deploy targeted fixer agents based on consensus scoring results. Instead of wholesale brief rewriting, each of the 7 scoring dimensions has a dedicated fixer agent that suggests specific edits. A reconciliation agent merges all suggested fixes into a coherent revised brief. The system attempts up to 3 refinement cycles. If the brief still doesn't reach the target score, it publishes with a warning badge.

This approach reduces refinement cost (only fix what's broken), improves quality (specialized fixers), and maintains throughput (no human bottleneck).

## Goals

- Create 7 specialized fixer agents, one per scoring dimension
- Deploy only fixers for dimensions scoring <7.0
- Each fixer suggests targeted edits (not full rewrites)
- Reconciliation agent merges all fixes coherently
- Maximum 3 refinement attempts per brief
- Publish with warning badge if refinement fails to reach ≥8.0
- Reduce refinement cost from £0.20 to £0.12 per brief

## User Stories

### US-001: Define fixer agent types and interfaces
**Description:** As a developer, I need TypeScript types for fixer agents so the refinement system is type-safe.

**Acceptance Criteria:**
- [ ] Create `/lib/types/refinement.ts`
- [ ] Define FixerType enum matching 7 dimensions: firstPrinciplesCoherence, internalConsistency, evidenceQuality, accessibility, objectivity, factualAccuracy, biasDetection
- [ ] Define SuggestedEdit interface: section, originalText, suggestedText, rationale, priority
- [ ] Define FixerResult interface: fixerType, suggestedEdits[], confidence, processingTime
- [ ] Define RefinementAttempt interface: attemptNumber, fixersDeployed, editsMade, scoreBeforeAfter
- [ ] Export all types
- [ ] Typecheck passes

### US-002: Create fixer agent base class
**Description:** As a developer, I need a base fixer agent that all 7 specialized fixers extend.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/base-fixer.ts`
- [ ] Abstract class with method: suggestEdits(brief: Brief, dimensionScore: number, critique: string): Promise<SuggestedEdit[]>
- [ ] Includes common logic: prompt building, LLM call, response parsing
- [ ] Uses Claude Haiku for cost efficiency
- [ ] Includes retry wrapper integration
- [ ] Each fixer completes in <5 seconds
- [ ] Typecheck passes

### US-003: Create First-Principles Coherence fixer
**Description:** As a developer, I need a fixer that improves reasoning from foundations.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/first-principles-fixer.ts`
- [ ] Identifies gaps in logical chain from assumptions to conclusions
- [ ] Suggests additions to make reasoning explicit
- [ ] Flags unstated assumptions that should be made explicit
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-004: Create Internal Consistency fixer
**Description:** As a developer, I need a fixer that resolves contradictions between sections.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/consistency-fixer.ts`
- [ ] Identifies contradictions between narrative, structure, and summaries
- [ ] Suggests which version to keep based on source support
- [ ] Ensures terminology is consistent throughout
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-005: Create Evidence Quality fixer
**Description:** As a developer, I need a fixer that improves source usage and citations.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/evidence-fixer.ts`
- [ ] Identifies claims lacking citation
- [ ] Suggests stronger sources for weak citations
- [ ] Flags over-reliance on single source
- [ ] Recommends where to add primary source references
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-006: Create Accessibility fixer
**Description:** As a developer, I need a fixer that improves clarity and readability.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/accessibility-fixer.ts`
- [ ] Identifies jargon and suggests plain-language alternatives
- [ ] Flags overly complex sentences for simplification
- [ ] Ensures reading level matches target audience
- [ ] Suggests where to add explanatory context
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-007: Create Objectivity fixer
**Description:** As a developer, I need a fixer that improves balance and perspective representation.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/objectivity-fixer.ts`
- [ ] Identifies underrepresented perspectives
- [ ] Suggests where to add counterarguments
- [ ] Flags one-sided framing for revision
- [ ] Ensures all major positions are fairly represented
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-008: Create Factual Accuracy fixer
**Description:** As a developer, I need a fixer that verifies and corrects factual claims.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/factual-accuracy-fixer.ts`
- [ ] Identifies specific factual claims in the brief
- [ ] Cross-references claims against provided sources
- [ ] Flags claims not supported by sources
- [ ] Suggests corrections or hedging language for uncertain claims
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-009: Create Bias Detection fixer
**Description:** As a developer, I need a fixer that neutralizes subtle framing bias.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/bias-fixer.ts`
- [ ] Identifies loaded language and suggests neutral alternatives
- [ ] Flags selective emphasis (burying counterarguments)
- [ ] Detects framing that favors one position
- [ ] Suggests structural changes for balanced presentation
- [ ] Returns targeted edits with rationale
- [ ] Typecheck passes

### US-010: Create fixer orchestrator
**Description:** As a developer, I need an orchestrator that deploys the right fixers based on dimension scores.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/fixer-orchestrator.ts`
- [ ] Receives consensus scoring result with dimension breakdown
- [ ] Deploys fixers only for dimensions scoring <7.0
- [ ] Runs deployed fixers in parallel using Promise.all
- [ ] Collects all SuggestedEdit arrays from fixers
- [ ] Logs which fixers were deployed and their results
- [ ] Typecheck passes

### US-011: Create edit reconciliation agent
**Description:** As a developer, I need an agent that merges suggested edits into a coherent revised brief.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/fixers/edit-reconciliation-agent.ts`
- [ ] Receives original brief + all suggested edits from fixers
- [ ] Resolves conflicts when multiple fixers suggest edits to same section
- [ ] Prioritizes edits by: fixer agreement, severity, clarity score impact
- [ ] Applies edits while maintaining narrative coherence
- [ ] Returns revised brief + list of edits applied + list of edits skipped with reasons
- [ ] Typecheck passes

### US-012: Implement refinement loop
**Description:** As a developer, I need a loop that attempts refinement up to 3 times.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/refinement-loop.ts`
- [ ] Function: refineUntilPassing(brief: Brief, initialScore: ClarityScore, maxAttempts: number): Promise<RefinementResult>
- [ ] Each iteration: deploy fixers → reconcile edits → re-score with consensus panel
- [ ] Stop early if score ≥8.0
- [ ] Track all attempts with before/after scores
- [ ] Return final brief, final score, all attempts, and success boolean
- [ ] Typecheck passes

### US-013: Add warning badge support to briefs
**Description:** As a developer, I need briefs that fail refinement to be marked with a warning badge.

**Acceptance Criteria:**
- [ ] Add quality_warning boolean column to briefs table (default false)
- [ ] Add quality_warning_reason text column (nullable)
- [ ] Create migration /lib/supabase/migrations/004_add_quality_warning_columns.sql
- [ ] Update Database interface in client.ts
- [ ] Set quality_warning=true if final score <8.0 after 3 attempts
- [ ] Store warning reason: "Brief scored X/10 after 3 refinement attempts"
- [ ] Typecheck passes

### US-014: Integrate refinement loop into pipeline
**Description:** As a developer, I need the refinement loop integrated into the brief generation pipeline.

**Acceptance Criteria:**
- [ ] Update langgraph-orchestrator.ts to call refinement loop after consensus scoring
- [ ] Only trigger refinement if initial score <8.0
- [ ] Pass consensus critique to fixer orchestrator
- [ ] Store refinement attempts in agent_execution_logs
- [ ] Set quality_warning flag if refinement fails
- [ ] Final brief and score saved to database
- [ ] Typecheck passes

### US-015: Log refinement metrics
**Description:** As a developer, I need detailed refinement metrics for optimization.

**Acceptance Criteria:**
- [ ] Log each refinement attempt: fixers deployed, edits suggested, edits applied
- [ ] Log score progression across attempts
- [ ] Log total refinement time and cost estimate
- [ ] Log success/failure reason
- [ ] Store refinement_metadata JSONB in briefs table
- [ ] Typecheck passes

### US-016: Test refinement system
**Description:** As a developer, I need to validate the refinement system works correctly.

**Acceptance Criteria:**
- [ ] Create test-refinement.ts script
- [ ] Test with brief that has known low-scoring dimensions
- [ ] Verify correct fixers are deployed based on dimension scores
- [ ] Verify edits are suggested and applied
- [ ] Verify re-scoring happens after refinement
- [ ] Verify loop stops at 3 attempts max
- [ ] Print test results to console
- [ ] Typecheck passes

## Functional Requirements

- FR-1: System must have 7 specialized fixer agents, one per scoring dimension
- FR-2: Fixers must only be deployed for dimensions scoring <7.0
- FR-3: Each fixer must suggest specific edits, not rewrite entire sections
- FR-4: Reconciliation agent must merge edits while maintaining coherence
- FR-5: System must attempt up to 3 refinement cycles
- FR-6: If score remains <8.0 after 3 attempts, publish with warning badge
- FR-7: All refinement activity must be logged for analysis

## Non-Goals

- No user-facing refinement progress UI (backend only)
- No manual edit approval by users
- No partial publishing (all or nothing per brief)
- No fixer customization per topic
- No refinement queue prioritization

## Technical Considerations

- Each fixer uses Claude Haiku (~£0.01 per fixer)
- Average 3-4 fixers deployed per brief = £0.03-0.04 per refinement attempt
- 3 attempts max = £0.12 worst case (down from £0.20 wholesale rewrite)
- Run fixers in parallel for speed
- Reconciliation is single Claude Sonnet call for quality (~£0.05)
- Re-scoring after each attempt uses existing consensus scorer

## Fixer Mapping

| Dimension | Fixer | Focus |
|-----------|-------|-------|
| First-Principles Coherence | first-principles-fixer | Logical chain, assumptions |
| Internal Consistency | consistency-fixer | Contradictions, terminology |
| Evidence Quality | evidence-fixer | Citations, source strength |
| Accessibility | accessibility-fixer | Jargon, complexity |
| Objectivity | objectivity-fixer | Balance, counterarguments |
| Factual Accuracy | factual-accuracy-fixer | Claim verification |
| Bias Detection | bias-fixer | Framing, loaded language |

## Success Metrics

- Refinement success rate: ≥80% of briefs reach ≥8.0 within 3 attempts
- Average fixers deployed: 2-3 per brief (not all 7)
- Refinement cost: <£0.15 per brief average
- Refinement time: <30 seconds for 3 attempts
- Warning badge rate: <20% of published briefs

## Open Questions

- Should we show users which dimensions were improved during refinement?
- Should warning badges be removable after human review?
- Should we track which fixers are most effective for prompt optimization?
