# PRD: Parallel Agent Execution

## Introduction

Transform the brief generation pipeline from sequential to parallel execution, reducing generation time from ~60 seconds to ~36 seconds (40% faster). Structure and Narrative agents run concurrently, followed by 4 Summary agents running in parallel. A reconciliation step ensures consistency between parallel outputs.

This is the core infrastructure for swarm intelligence—enabling agents to work simultaneously rather than waiting for each other.

## Goals

- Reduce brief generation time from 60s to <40s (p95)
- Run Structure and Narrative agents in parallel (Phase 1)
- Run 4 Summary agents in parallel after Structure completes (Phase 2)
- Add reconciliation agent to ensure consistency between parallel outputs
- Maintain reliability with retry logic and graceful error handling
- Show animated swarm visualization in UI (agents working simultaneously)

## User Stories

### US-001: Refactor pipeline to support parallel execution
**Description:** As a developer, I need the LangGraph orchestrator to support parallel node execution so multiple agents can run simultaneously.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/langgraph-orchestrator.ts` (or refactor existing)
- [ ] Use LangGraph's parallel branch feature for concurrent execution
- [ ] Pipeline structure: Research → Classification → [Structure || Narrative] → Reconciliation → [4x Summary] → Clarity Scoring
- [ ] Parallel branches merge before next sequential step
- [ ] Typecheck passes

### US-002: Implement parallel Structure and Narrative execution
**Description:** As a developer, I need Structure and Narrative agents to run concurrently so we save ~15 seconds of generation time.

**Acceptance Criteria:**
- [ ] Structure agent and Narrative agent start simultaneously after Research completes
- [ ] Both agents receive same research sources as input
- [ ] Both agents complete independently (no dependency on each other)
- [ ] Execution time for both is ~25s (previously 15s + 25s = 40s sequential)
- [ ] Measure and log parallel execution time
- [ ] Typecheck passes

### US-003: Create reconciliation agent
**Description:** As a developer, I need a reconciliation agent that compares Structure and Narrative outputs to identify and fix inconsistencies.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/reconciliation-agent.ts`
- [ ] Agent receives Structure output + Narrative output
- [ ] Checks: Do all factors in Narrative appear in Structure table? Do all policies mentioned align?
- [ ] If inconsistencies found: Agent suggests minimal fixes to Narrative (Structure is source of truth)
- [ ] Returns reconciled Narrative + list of changes made
- [ ] Completes in <10 seconds
- [ ] Typecheck passes

### US-004: Implement parallel Summary agent execution
**Description:** As a developer, I need 4 Summary agents (child/teen/undergrad/postdoc) to run concurrently so we save ~30 seconds.

**Acceptance Criteria:**
- [ ] Create 4 parallel Summary agent instances
- [ ] All 4 start simultaneously after Structure is complete
- [ ] Each agent receives Structure output + specialist persona
- [ ] Each agent generates summary for its reading level
- [ ] All 4 complete in ~15 seconds total (previously 4 × 10s = 40s sequential)
- [ ] Results collected into single `summaries` object
- [ ] Typecheck passes

### US-005: Define summary agent reading level prompts
**Description:** As a developer, I need distinct prompts for each reading level so summaries are appropriately targeted.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/summary-prompts.ts`
- [ ] Child prompt: 100-150 words, simple vocabulary, analogies, no jargon
- [ ] Teen prompt: 200-250 words, accessible but more detail, define key terms
- [ ] Undergrad prompt: 350-400 words, academic vocabulary OK, cite key sources
- [ ] Postdoc prompt: 450-500 words, technical depth, assume domain knowledge, nuanced trade-offs
- [ ] Each prompt includes example output for reference
- [ ] Typecheck passes

### US-006: Add retry logic for failed agents
**Description:** As a developer, I need agents to retry on failure so transient API errors don't break generation.

**Acceptance Criteria:**
- [ ] Wrap each agent execution in retry logic
- [ ] Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- [ ] Log each retry attempt with error details
- [ ] After 3 failures, throw error and fail brief generation
- [ ] Retry logic applies to all agents (Research, Classification, Structure, Narrative, Summary, Reconciliation)
- [ ] Typecheck passes

### US-007: Add agent execution logging for observability
**Description:** As a developer, I need to log agent execution times and status so we can monitor performance.

**Acceptance Criteria:**
- [ ] Log start time, end time, and duration for each agent
- [ ] Log agent name, input size (token count estimate), output size
- [ ] Log whether execution was parallel or sequential
- [ ] Store logs in `agent_execution_logs` table
- [ ] Typecheck passes

### US-008: Add agent_execution_logs table to database
**Description:** As a developer, I need a database table to store agent execution logs for observability and optimization.

**Acceptance Criteria:**
- [ ] Add `agent_execution_logs` table with columns: id, brief_id, agent_name, started_at, completed_at, duration_ms, status, error_message, metadata (JSONB)
- [ ] Foreign key to briefs table
- [ ] Index on brief_id and started_at
- [ ] Generate and run migration successfully
- [ ] Typecheck passes

### US-009: Create swarm visualization component
**Description:** As a user, I want to see an animated visualization of agents working simultaneously so I understand what's happening during generation.

**Acceptance Criteria:**
- [ ] Create `/app/components/SwarmVisualization.tsx`
- [ ] Show 6 agent avatars/icons in a swarm arrangement
- [ ] Agents pulse/animate when active, dim when waiting
- [ ] Show which agents are running in parallel (e.g., Structure and Narrative both active)
- [ ] Display current step name: "Researching...", "Generating structure and narrative...", "Writing summaries..."
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Integrate swarm visualization into generation UI
**Description:** As a user, I want to see the swarm visualization while my brief is being generated.

**Acceptance Criteria:**
- [ ] Swarm visualization appears after user submits question
- [ ] Receives real-time status updates (which agents are active)
- [ ] Transitions smoothly between pipeline stages
- [ ] Disappears when brief is ready, replaced by brief content
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Connect UI to real-time agent status via SSE
**Description:** As a developer, I need to stream agent status updates to the UI so the swarm visualization reflects actual progress.

**Acceptance Criteria:**
- [ ] Create `/app/api/briefs/generate/route.ts` with Server-Sent Events
- [ ] Stream events: `agent_started`, `agent_completed`, `stage_changed`, `brief_ready`
- [ ] Each event includes: agent_name, timestamp, stage_name
- [ ] Frontend subscribes to SSE and updates SwarmVisualization state
- [ ] Connection closes when brief is complete
- [ ] Typecheck passes

### US-012: Measure and validate performance improvement
**Description:** As a developer, I need to validate that parallel execution actually reduces generation time.

**Acceptance Criteria:**
- [ ] Run 10 test briefs with parallel execution
- [ ] Run 10 test briefs with sequential execution (feature flag)
- [ ] Compare p50 and p95 generation times
- [ ] Target: ≥30% reduction in p95 generation time
- [ ] Document results in performance report
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Structure and Narrative agents must execute in parallel after Research completes
- FR-2: 4 Summary agents must execute in parallel after Structure completes
- FR-3: Reconciliation agent must run between parallel phase 1 and parallel phase 2
- FR-4: All agents must retry up to 3 times on failure before failing the brief
- FR-5: Agent execution times must be logged to database for observability
- FR-6: UI must show animated swarm visualization during generation
- FR-7: UI must receive real-time status updates via Server-Sent Events
- FR-8: Total generation time must be <40 seconds (p95)

## Non-Goals

- No dynamic agent spawning (fixed set of agents)
- No load balancing across multiple API keys
- No queue system for concurrent brief generation requests (single user focus for MVP)
- No agent-to-agent communication during execution (only via shared state)
- No cancellation of in-progress generation

## Design Considerations

### Swarm Visualization Mockup
```
    ┌─────────────────────────────────────────┐
    │     Generating your brief...            │
    │                                         │
    │         🔍        📊        📝          │
    │       Research   Structure  Narrative   │
    │         ✓         ●●●        ●●●        │
    │                                         │
    │      👶   🧑   🎓   🎓                  │
    │     Child Teen Ugrad Postdoc           │
    │       ○     ○     ○     ○              │
    │                                         │
    │     [━━━━━━━━━━━━━━░░░░░░] 65%          │
    └─────────────────────────────────────────┘

Legend:
  ✓ = completed
  ●●● = in progress (pulsing animation)
  ○ = waiting
```

### Pipeline Architecture
```
Research (15s)
    ↓
Classification (2s)
    ↓
┌───────────────────────┐
│   PARALLEL PHASE 1    │
│  Structure ║ Narrative │ (25s)
│    (15s)   ║  (25s)    │
└───────────────────────┘
    ↓
Reconciliation (5s)
    ↓
┌───────────────────────────────────┐
│        PARALLEL PHASE 2           │
│ Child ║ Teen ║ Undergrad ║ Postdoc │ (15s)
│ (10s) ║ (10s)║   (10s)   ║  (10s)  │
└───────────────────────────────────┘
    ↓
Clarity Scoring (10s)
    ↓
(Optional) Refinement

TOTAL: ~72s sequential → ~47s parallel (35% faster)
```

## Technical Considerations

- Use LangGraph.js parallel branches (not Promise.all) for proper state management
- SSE endpoint must handle client disconnection gracefully
- Agent execution logs should not block the pipeline (async insert)
- Reconciliation agent uses Claude Haiku for speed (~5s, £0.01)
- Feature flag to toggle parallel vs sequential for A/B testing

## Success Metrics

- Generation time reduction: ≥30% faster (p95)
- Parallel execution success rate: ≥99% (no race conditions or state corruption)
- Reconciliation catches inconsistencies: Track % of briefs with reconciliation changes
- UI responsiveness: SSE updates arrive within 500ms of agent status change
- User satisfaction: "Generation felt fast" in post-generation survey

## Open Questions

- Should we show estimated time remaining in the UI?
- If reconciliation finds major inconsistencies, should we regenerate or flag for review?
- Should Summary agents also receive Narrative output (after reconciliation) for better coherence?
