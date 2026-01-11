# PRD: Consensus-Based Clarity Scoring

## Introduction

Replace the single-judge clarity scoring system with a 3-agent consensus panel that evaluates briefs from different perspectives. Each evaluator (Skeptic, Advocate, Generalist) scores the brief on 7 dimensions, then participates in a discussion round to surface disagreements and reach consensus. When evaluators strongly disagree (>2 point spread), a 4th tiebreaker evaluator is invoked and the brief is flagged for human review.

This approach catches more issues than a single evaluator, reduces bias in political content, and provides richer feedback for the refinement system.

## Goals

- Replace single-judge scoring with 3-agent consensus panel
- Evaluate briefs on 7 dimensions (expanded from 5)
- Implement discussion round for agents to reconcile disagreements
- Deploy 4th tiebreaker evaluator when spread exceeds 2 points
- Flag high-disagreement briefs for human review
- Maintain scoring latency <15 seconds
- Provide actionable critique for refinement agent

## User Stories

### US-001: Define clarity scoring dimensions and types
**Description:** As a developer, I need TypeScript types defining all 7 scoring dimensions so the scoring system is type-safe.

**Acceptance Criteria:**
- [ ] Create `/lib/types/clarity-scoring.ts`
- [ ] Define 7 dimensions: firstPrinciplesCoherence, internalConsistency, evidenceQuality, accessibility, objectivity, factualAccuracy, biasDetection
- [ ] Each dimension has: name, weight (0-1, sum to 1), description, scoringGuidelines
- [ ] Define ClarityScore interface with dimension scores, overall score, critique, and confidence
- [ ] Define EvaluatorVerdict interface for individual evaluator output
- [ ] Export all types
- [ ] Typecheck passes

### US-002: Define evaluator persona types and prompts
**Description:** As a developer, I need the 3 evaluator personas defined with distinct perspectives for political content evaluation.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/clarity-evaluator-personas.ts`
- [ ] Define Skeptic persona: challenges claims, flags unsupported assertions, asks "what's the evidence?"
- [ ] Define Advocate persona: ensures strongest version of each position, catches strawmanning, checks balance
- [ ] Define Generalist persona: represents average reader, checks accessibility, flags jargon
- [ ] Each persona includes: name, role, systemPrompt, focusDimensions (which dimensions they weight more heavily)
- [ ] Export `getEvaluatorPersona(role)` and `getAllEvaluatorPersonas()` functions
- [ ] Typecheck passes

### US-003: Create individual evaluator agent
**Description:** As a developer, I need an agent that scores a brief from a single evaluator's perspective.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/clarity-evaluator-agent.ts`
- [ ] Function signature: `evaluateBrief(brief: Brief, persona: EvaluatorPersona): Promise<EvaluatorVerdict>`
- [ ] Returns scores for all 7 dimensions (0-10 scale)
- [ ] Returns written critique explaining scores
- [ ] Returns list of specific issues found
- [ ] Uses Claude Haiku for cost efficiency
- [ ] Completes in <5 seconds per evaluator
- [ ] Typecheck passes

### US-004: Implement parallel evaluator execution
**Description:** As a developer, I need all 3 evaluators to run in parallel so scoring stays fast.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/consensus-scorer.ts`
- [ ] Run Skeptic, Advocate, and Generalist evaluators concurrently
- [ ] Use existing retry wrapper for each evaluator
- [ ] Log execution time for each evaluator
- [ ] All 3 complete in <8 seconds total (parallel)
- [ ] Collect all 3 verdicts into ConsensusInput object
- [ ] Typecheck passes

### US-005: Implement disagreement detection
**Description:** As a developer, I need to detect when evaluators strongly disagree so I can trigger tiebreaker logic.

**Acceptance Criteria:**
- [ ] Add function `detectDisagreement(verdicts: EvaluatorVerdict[]): DisagreementResult`
- [ ] Calculate spread for each dimension (max score - min score)
- [ ] Calculate overall score spread across evaluators
- [ ] Flag disagreement if any dimension spread >2 OR overall spread >2
- [ ] Return: hasDisagreement, disagreeingDimensions[], maxSpread, evaluatorPositions
- [ ] Typecheck passes

### US-006: Create discussion round agent
**Description:** As a developer, I need a discussion round where evaluators see each other's scores and can revise their assessments.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/discussion-round-agent.ts`
- [ ] Agent receives all 3 verdicts as input
- [ ] Prompt asks: "Given the other evaluators' perspectives, would you revise any scores? Explain your reasoning."
- [ ] Each evaluator can revise scores or maintain position with justification
- [ ] Returns revised verdicts and discussion summary
- [ ] Discussion round completes in <5 seconds
- [ ] Typecheck passes

### US-007: Implement tiebreaker evaluator
**Description:** As a developer, I need a 4th evaluator that only runs when there's strong disagreement.

**Acceptance Criteria:**
- [ ] Create tiebreaker persona: "Arbiter" - focuses on resolving specific disputed dimensions
- [ ] Arbiter receives: original brief, all 3 verdicts, disagreeing dimensions, discussion summary
- [ ] Arbiter provides definitive score for disputed dimensions with detailed reasoning
- [ ] Arbiter's scores are weighted 1.5x for disputed dimensions in final calculation
- [ ] Completes in <5 seconds
- [ ] Typecheck passes

### US-008: Implement human review flagging
**Description:** As a developer, I need briefs with high disagreement to be flagged for human review.

**Acceptance Criteria:**
- [ ] Add `needs_human_review` boolean column to briefs table
- [ ] Add `review_reason` text column to briefs table
- [ ] Create migration for new columns
- [ ] Flag brief when tiebreaker is invoked
- [ ] Store disagreement details in review_reason (which dimensions, evaluator positions)
- [ ] Typecheck passes

### US-009: Implement final score calculation
**Description:** As a developer, I need to calculate the final clarity score from the consensus panel output.

**Acceptance Criteria:**
- [ ] Calculate weighted average across all dimensions using dimension weights
- [ ] If no disagreement: use median of 3 evaluator scores per dimension
- [ ] If disagreement resolved by discussion: use post-discussion scores
- [ ] If tiebreaker invoked: weight Arbiter 1.5x for disputed dimensions
- [ ] Final score is 0-10 scale with one decimal place
- [ ] Return overall score, dimension breakdown, and consolidated critique
- [ ] Typecheck passes

### US-010: Aggregate critiques for refinement
**Description:** As a developer, I need a consolidated critique that the refinement agent can act on.

**Acceptance Criteria:**
- [ ] Merge issues from all evaluators, deduplicate similar issues
- [ ] Prioritize issues by: agreement (all 3 flagged it), severity (score impact), actionability
- [ ] Format critique as structured list: dimension, issue, suggested fix, priority
- [ ] Limit to top 5 issues to keep refinement focused
- [ ] Include specific quotes/sections that need attention
- [ ] Typecheck passes

### US-011: Integrate consensus scorer into pipeline
**Description:** As a developer, I need the consensus scorer to replace the single-judge scorer in the brief generation pipeline.

**Acceptance Criteria:**
- [ ] Update langgraph-orchestrator.ts to use consensus scorer
- [ ] Consensus scoring runs after reconciliation, before refinement decision
- [ ] Pass consensus result to refinement agent if score <8.0
- [ ] Log all evaluator verdicts and final score to agent_execution_logs
- [ ] Store final clarity score and dimension breakdown in brief record
- [ ] Typecheck passes

### US-012: Add scoring metrics to execution logs
**Description:** As a developer, I need detailed scoring metrics logged for analysis and prompt optimization.

**Acceptance Criteria:**
- [ ] Log each evaluator's individual verdict (scores, critique, duration)
- [ ] Log disagreement detection results
- [ ] Log discussion round output if run
- [ ] Log tiebreaker verdict if invoked
- [ ] Log final consensus score and calculation method used
- [ ] Add `scoring_metadata` JSONB column to briefs table for dimension breakdown
- [ ] Typecheck passes

### US-013: Test consensus scoring with sample briefs
**Description:** As a developer, I need to validate the consensus scoring system works correctly.

**Acceptance Criteria:**
- [ ] Test with existing sample brief (UK 4-day work week)
- [ ] Verify all 3 evaluators produce valid verdicts
- [ ] Verify dimension scores are within expected ranges
- [ ] Test disagreement detection with artificially divergent scores
- [ ] Test tiebreaker invocation
- [ ] Verify final score calculation is correct
- [ ] Document test results
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The system must evaluate briefs using 3 parallel evaluator agents with distinct personas
- FR-2: Each evaluator must score the brief on 7 dimensions (0-10 scale)
- FR-3: Evaluators must participate in a discussion round to reconcile differences
- FR-4: When disagreement exceeds 2 points on any dimension, invoke 4th tiebreaker evaluator
- FR-5: Briefs requiring tiebreaker must be flagged for human review
- FR-6: Final score must be calculated using appropriate weighting based on consensus method used
- FR-7: Scoring must complete in <15 seconds total (including discussion round)
- FR-8: Scoring output must include actionable critique for refinement agent

## Non-Goals

- No user-facing scoring breakdown UI (backend only for now)
- No manual score override by users
- No historical score comparison (can add later)
- No A/B testing of evaluator personas (can add later)
- No caching of scoring results (briefs are unique)

## Technical Considerations

- Use Claude Haiku for evaluators (~£0.01 per evaluator, £0.04 total for 3+discussion)
- Run evaluators in parallel using Promise.all with retry wrapper
- Discussion round is single LLM call with all 3 verdicts as context
- Tiebreaker adds ~£0.01 and ~5s when invoked (expected <20% of briefs)
- Store full scoring metadata for prompt optimization analysis
- Consider rate limiting if 4+ concurrent LLM calls cause issues

## Scoring Dimensions (7 Total)

| Dimension | Weight | Description |
|-----------|--------|-------------|
| First-Principles Coherence | 20% | Reasoning builds from clear foundations |
| Internal Consistency | 15% | No contradictions between sections |
| Evidence Quality | 15% | Sources are credible, relevant, properly cited |
| Accessibility | 15% | Clear language, appropriate for reading level |
| Objectivity | 15% | Balanced perspectives, no obvious bias |
| Factual Accuracy | 10% | Claims are verifiable and correctly stated |
| Bias Detection | 10% | Subtle framing bias, selective emphasis identified |

## Success Metrics

- Consensus scoring reduces false positives (briefs that pass but shouldn't) by 30%
- Inter-evaluator agreement: >70% of briefs have <1 point spread
- Tiebreaker invocation rate: <20% of briefs
- Scoring latency: <15 seconds (p95)
- Human review queue: <50 briefs/week at launch volume

## Open Questions

- Should evaluator personas rotate or stay fixed?
- Should we weight the Skeptic higher for controversial topics?
- How do we measure if the consensus approach is actually better than single-judge?
- Should discussion round be optional (skip if all 3 agree within 1 point)?
