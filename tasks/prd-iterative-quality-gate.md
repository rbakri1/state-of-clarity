# PRD: Iterative Quality Gate

## Introduction

Implement a quality gate that orchestrates the full refinement cycle and determines publishing outcomes based on final clarity scores. The gate enforces a tiered publishing policy: briefs scoring ≥8.0 publish normally, 6.0-7.9 publish with warning badge, and <6.0 don't publish (credits refunded). Failed briefs are queued for automated re-run with different parameters.

This ensures users only receive quality content while providing transparency about brief quality levels.

## Goals

- Orchestrate the complete quality assurance cycle (score → refine → re-score → decision)
- Enforce tiered publishing policy based on final clarity score
- Show "Improving quality..." only when refinement takes longer than expected
- Queue failed briefs (<6.0) for automated re-run with different parameters
- Refund credits when briefs fail to meet minimum threshold
- Track quality gate metrics for system optimization

## Publishing Policy

| Final Score | Outcome | User Experience |
|-------------|---------|-----------------|
| ≥8.0 | Publish normally | Brief displayed, no warnings |
| 6.0-7.9 | Publish with warning | Brief displayed with "Quality: X/10" badge |
| <6.0 | Don't publish | "Unable to generate quality brief" + credit refund |

## User Stories

### US-001: Define quality gate types and interfaces
**Description:** As a developer, I need TypeScript types for the quality gate system.

**Acceptance Criteria:**
- [ ] Create `/lib/types/quality-gate.ts`
- [ ] Define QualityTier enum: 'high' (≥8.0), 'acceptable' (6.0-7.9), 'failed' (<6.0)
- [ ] Define QualityGateResult interface: tier, finalScore, attempts, publishable, warningBadge, refundRequired
- [ ] Define RetryQueueItem interface: briefId, originalQuestion, failureReason, retryParams, scheduledAt
- [ ] Export all types
- [ ] Typecheck passes

### US-002: Create quality gate orchestrator
**Description:** As a developer, I need an orchestrator that runs the full quality assurance cycle.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/quality-gate.ts`
- [ ] Function: runQualityGate(brief, sources): Promise<QualityGateResult>
- [ ] Orchestrates: consensus scoring → check threshold → refinement loop (if needed) → final decision
- [ ] Returns tier classification and publishing decision
- [ ] Integrates with existing consensus-scorer and refinement-loop
- [ ] Typecheck passes

### US-003: Implement tiered publishing logic
**Description:** As a developer, I need the quality gate to make publishing decisions based on score tiers.

**Acceptance Criteria:**
- [ ] Score ≥8.0: return {tier: 'high', publishable: true, warningBadge: false}
- [ ] Score 6.0-7.9: return {tier: 'acceptable', publishable: true, warningBadge: true}
- [ ] Score <6.0: return {tier: 'failed', publishable: false, refundRequired: true}
- [ ] Log decision with reasoning
- [ ] Typecheck passes

### US-004: Add retry queue table to database
**Description:** As a developer, I need a table to store briefs queued for automated retry.

**Acceptance Criteria:**
- [ ] Add `retry_queue` table with columns: id, brief_id, original_question, classification, failure_reason, retry_params (JSONB), scheduled_at, attempts, status, created_at
- [ ] Status enum: 'pending', 'processing', 'completed', 'abandoned'
- [ ] Create migration /lib/supabase/migrations/005_add_retry_queue_table.sql
- [ ] Update Database interface in client.ts
- [ ] Typecheck passes

### US-005: Implement retry queue service
**Description:** As a developer, I need a service that manages the retry queue for failed briefs.

**Acceptance Criteria:**
- [ ] Create `/lib/services/retry-queue-service.ts`
- [ ] Function: addToRetryQueue(briefId, question, failureReason, retryParams): Promise<void>
- [ ] Function: getNextRetryItem(): Promise<RetryQueueItem | null>
- [ ] Function: markRetryComplete(id, success): Promise<void>
- [ ] Retry params include: different specialist persona, adjusted prompts, increased source diversity
- [ ] Schedule retry for 1 hour after failure
- [ ] Typecheck passes

### US-006: Implement automated retry with different parameters
**Description:** As a developer, I need failed briefs to be automatically retried with adjusted parameters.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/retry-executor.ts`
- [ ] Picks items from retry queue where scheduled_at <= now
- [ ] Adjusts parameters based on failure reason: low evidence → more sources, low objectivity → force opposing views
- [ ] Runs full brief generation with new parameters
- [ ] Max 2 retry attempts before marking as 'abandoned'
- [ ] Typecheck passes

### US-007: Add credit refund capability
**Description:** As a developer, I need to refund credits when briefs fail the quality gate.

**Acceptance Criteria:**
- [ ] Create `/lib/services/credit-service.ts` (placeholder for Theme 6)
- [ ] Function: refundCredits(userId, amount, reason): Promise<void>
- [ ] For now, just log refund action (actual credits implemented in Theme 6)
- [ ] Store refund record in database for reconciliation
- [ ] Add `credit_refunds` table with: id, user_id, amount, reason, brief_id, created_at
- [ ] Create migration for credit_refunds table
- [ ] Typecheck passes

### US-008: Update UI to show extended generation status
**Description:** As a user, I want to see "Improving quality..." when refinement is taking longer than expected.

**Acceptance Criteria:**
- [ ] Update SwarmVisualization.tsx to accept extendedMode prop
- [ ] If generation exceeds 45 seconds, show "Improving quality..." message
- [ ] Show subtle progress indicator (not specific attempt counts)
- [ ] Return to normal display once complete
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Update brief display with warning badge
**Description:** As a user, I want to see a quality warning badge on briefs that scored 6.0-7.9.

**Acceptance Criteria:**
- [ ] Create `/app/components/QualityBadge.tsx`
- [ ] Display "Quality: X/10" badge for briefs with quality_warning=true
- [ ] Badge color: amber/yellow for warning, green for high quality
- [ ] Tooltip explains what the score means
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Create failed generation user feedback
**Description:** As a user, I want to understand why my brief couldn't be generated and know my credits were refunded.

**Acceptance Criteria:**
- [ ] Create `/app/components/GenerationFailed.tsx`
- [ ] Display friendly error message: "We couldn't generate a high-quality brief for this question"
- [ ] Show that credits have been refunded
- [ ] Suggest: rephrasing question, trying a related topic, or waiting for auto-retry
- [ ] Include "Try Again" button to resubmit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Integrate quality gate into pipeline
**Description:** As a developer, I need the quality gate integrated as the final step in brief generation.

**Acceptance Criteria:**
- [ ] Update langgraph-orchestrator.ts to call quality gate after refinement
- [ ] Quality gate returns final publishing decision
- [ ] If publishable: save brief with appropriate flags
- [ ] If not publishable: add to retry queue, trigger refund, don't save brief
- [ ] Log complete quality gate flow
- [ ] Typecheck passes

### US-012: Add quality gate metrics logging
**Description:** As a developer, I need quality gate metrics for analysis and optimization.

**Acceptance Criteria:**
- [ ] Log quality gate decisions to agent_execution_logs
- [ ] Track: initial score, final score, attempts, tier, decision, refund
- [ ] Add quality_gate_metadata JSONB to briefs table
- [ ] Calculate and log: pass rate, average attempts, refund rate
- [ ] Typecheck passes

### US-013: Test quality gate with various scenarios
**Description:** As a developer, I need to validate the quality gate handles all scenarios correctly.

**Acceptance Criteria:**
- [ ] Create test-quality-gate.ts script
- [ ] Test scenario 1: Brief scores 8.5 → publishes normally
- [ ] Test scenario 2: Brief scores 7.2 after refinement → publishes with warning
- [ ] Test scenario 3: Brief scores 5.5 after refinement → doesn't publish, queues retry, refunds
- [ ] Test retry queue adds and retrieves items correctly
- [ ] Print test results to console
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Quality gate must classify briefs into 3 tiers based on final clarity score
- FR-2: Briefs scoring <6.0 must not be published
- FR-3: Briefs scoring 6.0-7.9 must display warning badge
- FR-4: Failed briefs must be queued for automated retry with different parameters
- FR-5: Credits must be refunded when briefs fail to meet minimum threshold
- FR-6: UI must show "Improving quality..." only when generation exceeds 45 seconds
- FR-7: All quality gate decisions must be logged for analysis

## Non-Goals

- No manual retry trigger by users (automated only for MVP)
- No quality tier selection by users
- No partial publishing (draft mode)
- No real-time retry status updates to users
- No human review queue (automated retry only)

## Technical Considerations

- Quality gate runs after refinement loop completes
- Retry queue processed by background job (can be cron or edge function)
- Credit refund is logged but actual credit deduction/refund handled in Theme 6
- Retry parameters vary based on failure analysis from consensus scoring
- Consider rate limiting retries to avoid API cost spikes

## Retry Parameter Adjustments

| Failure Reason | Adjusted Parameters |
|----------------|---------------------|
| Low evidence quality | Increase source count to 25, prioritize academic sources |
| Low objectivity | Force 50% opposing sources, use balance-focused persona |
| Low accessibility | Use simplified language prompts, reduce technical depth |
| Low factual accuracy | Add fact-checking step, require primary sources only |
| Low coherence | Use more structured outline, reduce narrative creativity |

## Success Metrics

- Quality gate pass rate (≥8.0): ≥70% of briefs
- Acceptable tier rate (6.0-7.9): ≤25% of briefs
- Failure rate (<6.0): ≤5% of briefs
- Retry success rate: ≥50% of retried briefs reach ≥6.0
- User satisfaction: <2% complaints about quality warnings

## Open Questions

- Should we notify users when their retried brief succeeds?
- Should warning badges be dismissible by users?
- How long should we keep failed briefs in retry queue before abandoning?
