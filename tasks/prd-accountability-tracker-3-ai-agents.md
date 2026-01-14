# PRD 3: AI Agents - LangGraph Orchestration & Agent Implementation

## Introduction

Build the LangGraph workflow and all AI agents that power the Accountability Tracker. This includes:
- **Entity Classification Agent**: Determines if target is individual or organization
- **UK Profile Research Agent (Block 1)**: Synthesizes raw UK data into structured profile
- **Corruption Analysis Agent (Block 2)**: Maps theoretical corruption scenarios
- **Action List Generation Agent (Block 5)**: Generates prioritized investigation steps
- **Quality Check Agent**: Validates output quality and triggers refunds

This is the intelligence layer that transforms raw UK public data into actionable investigative insights.

**Dependencies:** PRD 1 (Types, Service Layer), PRD 2 (UK Public Data Service)

**Estimated Effort:** 5 working days

---

## Goals

- Implement 5-node LangGraph sequential pipeline (entity classification → profile research → corruption analysis → action list → quality check)
- Create ethical system prompts that emphasize "innocent until proven guilty"
- Use Claude Opus for complex reasoning (Blocks 1, 2, 5)
- Use Claude Haiku for simple tasks (classification, quality check)
- Ensure all corruption scenarios include innocent alternative explanations
- Validate output against TypeScript interfaces
- Calculate quality scores (0-10) and trigger credit refunds if score < 6.0
- Provide real-time progress callbacks for SSE streaming

---

## User Stories

### US-001: Implement LangGraph state machine
**Description:** As a developer, I need a LangGraph state machine so that the agent pipeline executes in the correct order with shared state.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/accountability-tracker-orchestrator.ts`
- [ ] Define `AccountabilityStateAnnotation` with Annotation.Root
- [ ] State includes: targetEntity, investigationId, entityType, profileData, corruptionScenarios, actionItems, qualityScore, qualityNotes, error, completedSteps
- [ ] State reducers handle merging (e.g., completedSteps array concatenation)
- [ ] Create `createAccountabilityGraph()` function
- [ ] Graph has 5 nodes: entity_classification, uk_profile_research, corruption_analysis, action_list_generation, quality_check
- [ ] Nodes connected sequentially: START → classification → profile → corruption → action → quality → END
- [ ] Graph compiles without errors
- [ ] Typecheck passes

---

### US-002: Implement entity classification agent
**Description:** As a system, I need to classify entities as individual or organization so that subsequent agents can tailor their analysis.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/entity-classification-agent.ts`
- [ ] `entityClassificationNode()` accepts `AccountabilityState`
- [ ] Uses Claude Haiku (cheap model for simple task)
- [ ] System prompt: "Determine if entity is individual or organization"
- [ ] Returns JSON: `{ entityType: 'individual' | 'organization', confidence: 'high' | 'medium' | 'low', reasoning: string }`
- [ ] Updates state with `entityType` and adds 'entity_classification' to `completedSteps`
- [ ] Handles "Ltd", "Limited", "plc", "PLC" as organization indicators
- [ ] Defaults to "individual" if unsure
- [ ] Test with "Boris Johnson" returns `entityType: 'individual'`
- [ ] Test with "Serco Ltd" returns `entityType: 'organization'`
- [ ] Typecheck passes

---

### US-003: Implement UK profile research agent (Block 1)
**Description:** As a system, I need to analyze UK profile data and generate a structured report so that journalists have a factual foundation for investigation.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/uk-profile-research-agent.ts`
- [ ] `ukProfileResearchNode()` calls `fetchUKPublicData()` from PRD 2
- [ ] Passes raw data to Claude Opus for synthesis
- [ ] System prompt emphasizes: ONLY verified public records, NO speculation, clinical tone
- [ ] Prompt includes: target entity, entity type, raw data JSON
- [ ] Claude returns structured JSON matching `UKProfileData` interface
- [ ] Stores all sources in DB via `addInvestigationSource()`
- [ ] Updates state with `profileData` and adds 'uk_profile_research' to `completedSteps`
- [ ] Test with "Boris Johnson" returns profile with 4+ data sources
- [ ] Test with non-existent entity returns sparse profile (not error)
- [ ] Typecheck passes

---

### US-004: Implement corruption analysis agent (Block 2)
**Description:** As a system, I need to map theoretical corruption scenarios based on positions so that journalists understand potential conflicts of interest.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/corruption-analysis-agent.ts`
- [ ] `corruptionAnalysisNode()` uses Claude Opus (complex reasoning)
- [ ] System prompt emphasizes: THEORETICAL analysis, NOT proof of wrongdoing, analyze ROLE not PERSON
- [ ] Prompt includes profile data JSON
- [ ] Each scenario MUST include:
  - Theoretical mechanism
  - Enabling positions
  - Incentives (financial, political, career)
  - Red flags
  - **Innocent alternative explanations** (mandatory)
  - Risk level (low/medium/high)
  - Historical precedents (real cases)
- [ ] Returns 3-5 scenarios (array of `CorruptionScenario` objects)
- [ ] All scenarios use conditional language ("could enable", "might create")
- [ ] Updates state with `corruptionScenarios` and adds 'corruption_analysis' to `completedSteps`
- [ ] Test: Validate no direct accusations in output (manual review)
- [ ] Test: Verify all scenarios include innocent explanations
- [ ] Test with "Boris Johnson" returns 3-5 scenarios
- [ ] Typecheck passes

---

### US-005: Implement action list generation agent (Block 5)
**Description:** As a system, I need to generate prioritized investigation action items so that journalists have a clear roadmap.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/action-list-agent.ts`
- [ ] `actionListGenerationNode()` uses Claude Opus
- [ ] System prompt emphasizes: legal/ethical methods only, prioritize by accessibility
- [ ] Prompt includes profile data and corruption scenarios JSON
- [ ] Each action item includes:
  - What to do (specific)
  - Why it matters (rationale)
  - Where to look (exact source)
  - What you'd find (expected evidence)
  - Priority (1=high, 2=medium, 3=low)
  - Estimated time (e.g., "2 weeks for FOI")
  - Legal considerations (defamation, GDPR, FOI)
- [ ] Returns 8-15 action items (array of `ActionItem` objects)
- [ ] Balanced across priorities (not all priority 1)
- [ ] Updates state with `actionItems` and adds 'action_list_generation' to `completedSteps`
- [ ] Test: Verify no illegal methods suggested (hacking, bribery, harassment)
- [ ] Test with "Boris Johnson" returns 8-15 action items
- [ ] Typecheck passes

---

### US-006: Implement quality check agent
**Description:** As a system, I need to check quality and trigger refunds if insufficient data so that users aren't charged for low-quality investigations.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/quality-check-agent.ts`
- [ ] `qualityCheckNode()` calls `calculateQualityScore()` from PRD 1
- [ ] Quality gate logic:
  - Data sources: 0-3 = 0 points, 4-6 = 2.5 points, 7+ = 5 points
  - Scenarios: <3 = 0 points, 3-5 = 2.5 points, 6+ = 5 points
  - Total score 0-10 (sum of criteria)
  - Pass threshold: ≥6.0
- [ ] Updates investigation in DB via `updateInvestigationResults()`
- [ ] Updates state with `qualityScore`, `qualityNotes` and adds 'quality_check' to `completedSteps`
- [ ] Test: Score 10.0 for high-quality data (7+ sources, 6+ scenarios)
- [ ] Test: Score 0.0 for no data (0 sources, 0 scenarios)
- [ ] Test: Score 5.0 fails quality gate (< 6.0)
- [ ] Typecheck passes

---

### US-007: Create system prompts file
**Description:** As a developer, I need all system prompts in one file so that prompt engineering is centralized and maintainable.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/accountability-personas.ts`
- [ ] Export `ENTITY_CLASSIFICATION_PROMPT` (Haiku)
- [ ] Export `UK_PROFILE_RESEARCH_PROMPT` (Opus) - 400+ words with ethical guidelines
- [ ] Export `CORRUPTION_ANALYSIS_PROMPT` (Opus) - 300+ words with mandatory language rules
- [ ] Export `ACTION_LIST_GENERATION_PROMPT` (Opus) - 250+ words with legal boundaries
- [ ] Export `QUALITY_CHECK_PROMPT` (Haiku) - scoring rubric
- [ ] All prompts emphasize ethical framing
- [ ] Corruption prompt includes "⚠️ CRITICAL ETHICAL FRAMING" section
- [ ] Typecheck passes

---

### US-008: Implement main execution function
**Description:** As an API, I need a main execution function so that I can run the entire pipeline with callbacks for SSE streaming.

**Acceptance Criteria:**
- [ ] `generateAccountabilityReport()` function in orchestrator file
- [ ] Accepts: targetEntity (string), investigationId (string), callbacks (optional)
- [ ] Callbacks interface: onAgentStarted, onAgentCompleted, onStageChanged, onError
- [ ] Invokes compiled LangGraph with initial state
- [ ] Returns: profileData, corruptionScenarios, actionItems, qualityScore, qualityNotes
- [ ] Emits callbacks during execution (if provided)
- [ ] Test: Run without callbacks (no errors)
- [ ] Test: Run with callbacks (verify all emitted)
- [ ] Test: Run full pipeline for "Boris Johnson" (< 2 minutes)
- [ ] Typecheck passes

---

## Functional Requirements

- **FR-1:** Use LangGraph StateGraph for agent orchestration
- **FR-2:** Define state schema with Annotation.Root and reducers
- **FR-3:** Connect 5 agents sequentially: classification → profile → corruption → action → quality
- **FR-4:** Use Claude Haiku for entity classification (max_tokens: 500)
- **FR-5:** Use Claude Opus for profile research (max_tokens: 4000)
- **FR-6:** Use Claude Opus for corruption analysis (max_tokens: 4000)
- **FR-7:** Use Claude Opus for action list generation (max_tokens: 3000)
- **FR-8:** Use calculateQualityScore() for quality check (no LLM needed)
- **FR-9:** All agents must return Partial<AccountabilityState> for state updates
- **FR-10:** All agents must add their name to `completedSteps` array
- **FR-11:** UK Profile Research agent must call fetchUKPublicData() and store sources
- **FR-12:** Corruption Analysis agent must include innocent explanations for every scenario
- **FR-13:** Action List agent must validate no illegal methods suggested
- **FR-14:** Quality Check agent must update investigation in DB via updateInvestigationResults()
- **FR-15:** Main execution function must support optional callbacks for SSE streaming
- **FR-16:** All LLM outputs must be parsed as JSON and validated against TypeScript types
- **FR-17:** Handle JSON parsing errors gracefully (retry once, then fail)
- **FR-18:** Log all LLM calls to console with token usage
- **FR-19:** Wrap all Anthropic calls in try-catch with proper error messages
- **FR-20:** Pass investigationId through state for database operations

---

## Non-Goals

- No streaming LLM responses (use standard completion API)
- No multi-turn conversations with LLMs (single-shot prompts only)
- No user-provided system prompts (hard-coded prompts for consistency)
- No parallel agent execution (sequential pipeline for MVP)
- No agent memory or context retention across investigations
- No fine-tuning or custom models (use base Claude models)
- No prompt version tracking (hard-coded in code for MVP)
- No A/B testing of different prompts
- No dynamic prompt generation based on entity type
- No human-in-the-loop approval between agents

---

## Design Considerations

Not applicable - this PRD is backend AI logic only.

---

## Technical Considerations

### LangGraph Architecture
- Use `StateGraph` with `Annotation.Root` for type-safe state
- Reducers for array fields (e.g., completedSteps, qualityNotes)
- Replace reducers for object fields (e.g., profileData, corruptionScenarios)
- Sequential edges only (no conditional routing in MVP)
- Compile graph once at module load, reuse for all invocations

### Model Selection
- **Haiku** for simple tasks: classification, quality check (~£0.0003 per call)
- **Opus** for complex reasoning: profile, corruption, action list (~£0.09-£0.12 per call)
- **Total cost per investigation:** ~£0.33 (within budget)

### Prompt Engineering
- All prompts include explicit output format (JSON schema)
- Corruption prompt has 3-tier ethical framing (warning, language rules, focus)
- Action List prompt includes legal/ethical boundaries section
- Profile Research prompt emphasizes NO speculation

### Error Handling
- Wrap all Anthropic calls in try-catch
- Retry JSON parsing once if it fails
- Fail fast if Anthropic API is down (don't retry forever)
- Log all errors to Sentry with agent name context

### State Management
- State flows through graph immutably
- Each agent returns Partial<AccountabilityState>
- LangGraph merges partial updates with reducers
- Final state contains all outputs

### Callbacks
- Callbacks are optional (for SSE streaming)
- Emit before/after each agent execution
- Include agent name, stage name, duration
- Don't block agent execution (async callbacks)

---

## Success Metrics

- [ ] Entity classification accuracy >95% (manual validation on 20 test cases)
- [ ] Profile research returns 4+ data sources for 80% of UK entities
- [ ] Corruption analysis generates 3-5 scenarios for 100% of cases
- [ ] Action list generates 8-15 items for 100% of cases
- [ ] Quality gate passes for 85-90% of investigations (10-15% refund rate expected)
- [ ] No ethical violations in corruption scenarios (0 direct accusations)
- [ ] All corruption scenarios include innocent explanations (100% compliance)
- [ ] LLM costs < £0.35 per investigation (3 Opus + 2 Haiku calls)
- [ ] Pipeline executes in < 2 minutes for typical cases
- [ ] Zero JSON parsing errors (robust prompt engineering)

---

## Open Questions

1. **Q:** Should we implement retry logic for Anthropic API transient failures?
   - **Proposed:** Yes, use existing withRetry() with 3 attempts, exponential backoff

2. **Q:** How do we handle JSON parsing errors from LLMs?
   - **Proposed:** Retry once with "You must return valid JSON" appended to prompt, then fail

3. **Q:** Should corruption scenarios be ranked/sorted by risk level?
   - **Proposed:** Yes, prompt instructs to rank by plausibility + magnitude + detection difficulty

4. **Q:** What if profile research returns no data (empty arrays)?
   - **Proposed:** Corruption analysis should still generate 1-2 generic scenarios based on position types

5. **Q:** Should we log full LLM prompts and responses for debugging?
   - **Proposed:** Log token counts and first 200 chars of response, full logs only on error

6. **Q:** What happens if quality check fails but user disputes the score?
   - **Proposed:** Manual admin review, no automated appeal process for MVP

7. **Q:** Should action items link to specific corruption scenarios?
   - **Proposed:** Yes, include `relatedScenarios` field with scenario IDs

---

## Files to Create

1. `/lib/agents/accountability-tracker-orchestrator.ts` - State machine + graph (~300 lines)
2. `/lib/agents/accountability-personas.ts` - System prompts (~400 lines)
3. `/lib/agents/entity-classification-agent.ts` - Classification node (~80 lines)
4. `/lib/agents/uk-profile-research-agent.ts` - Profile research node (~120 lines)
5. `/lib/agents/corruption-analysis-agent.ts` - Corruption analysis node (~100 lines)
6. `/lib/agents/action-list-agent.ts` - Action list node (~100 lines)
7. `/lib/agents/quality-check-agent.ts` - Quality check node (~80 lines)

**Total LOC Estimate:** ~1,180 lines

---

## Testing Strategy

### Unit Tests (`/tests/unit/accountability-agents.test.ts`)

**Mock Anthropic API for all tests**

- **Entity Classification:**
  - Test "Boris Johnson" returns `entityType: 'individual'`
  - Test "Serco Ltd" returns `entityType: 'organization'`
  - Test "John Smith Ltd" returns `entityType: 'organization'` (catches "Ltd")
  - Test ambiguous name returns low confidence

- **UK Profile Research:**
  - Mock `fetchUKPublicData()` to return sample data
  - Mock Anthropic to return valid `UKProfileData` JSON
  - Test JSON parsing success
  - Test JSON parsing failure (retry logic)
  - Test sources stored in DB (mock `addInvestigationSource`)

- **Corruption Analysis:**
  - Mock Anthropic to return 3 scenarios
  - Verify all scenarios have innocent explanations
  - Verify conditional language ("could", "might")
  - Verify no direct accusations (regex check)
  - Test with empty profile data (generates generic scenarios)

- **Action List Generation:**
  - Mock Anthropic to return 10 action items
  - Verify balanced across priorities (not all priority 1)
  - Verify no illegal methods (regex check for "hack", "bribe", etc.)
  - Verify all items have `relatedScenarios` field

- **Quality Check:**
  - Test scoring logic with various inputs
  - Test 7+ sources + 6+ scenarios = 10.0 score
  - Test 0 sources + 0 scenarios = 0.0 score
  - Test 4 sources + 3 scenarios = 5.0 score (fails gate)

- **LangGraph State:**
  - Test state transitions
  - Test reducer functions (array concatenation, object replacement)
  - Test partial state updates

### Integration Tests (`/tests/integration/accountability-pipeline.test.ts`)

**Use real Anthropic API (mark as slow tests)**

- **Full Pipeline - Boris Johnson:**
  - Run `generateAccountabilityReport("Boris Johnson", ...)`
  - Verify returns valid `UKProfileData`
  - Verify 3-5 corruption scenarios
  - Verify 8-15 action items
  - Verify quality score ≥ 6.0
  - Verify completedSteps has all 5 agent names
  - Duration < 2 minutes

- **Full Pipeline - Serco Ltd:**
  - Run with organization entity
  - Verify different data sources (Contracts Finder included)
  - Verify organization-specific scenarios

- **Quality Gate Failure:**
  - Mock `fetchUKPublicData()` to return minimal data (1 source)
  - Run pipeline
  - Verify quality score < 6.0
  - Verify investigation updated in DB with low score

- **Error Handling:**
  - Mock Anthropic to throw error on corruption analysis
  - Verify pipeline fails gracefully
  - Verify error logged to Sentry
  - Verify investigation not updated (stays partial)

### Prompt Testing (Manual)

- **Ethical Framing Validation:**
  - Run 10 investigations with diverse entities
  - Manually review all corruption scenarios
  - Check: No direct accusations ("John Smith is corrupt" ❌)
  - Check: All scenarios have innocent explanations ✅
  - Check: Conditional language used ("could enable" ✅)

- **Action Item Validation:**
  - Review 10 investigations
  - Check: No illegal methods suggested ✅
  - Check: All methods are realistic/practical ✅
  - Check: Balanced across priorities ✅

- **Edge Cases:**
  - Test with entity with no data ("Asdfghjkl Zxcvbnm")
  - Test with highly controversial figure (e.g., "Donald Trump")
  - Verify neutral tone maintained

---

## Timeline

**Day 1:** LangGraph setup + Entity Classification
- Set up state schema with Annotation.Root
- Create graph structure with 5 nodes
- Implement entity classification agent
- Unit tests for classification

**Day 2:** Profile Research + Corruption Analysis
- Implement UK profile research agent
- Implement corruption analysis agent
- Create all system prompts
- Unit tests for both agents

**Day 3:** Action List + Quality Check
- Implement action list generation agent
- Implement quality check agent
- Wire up all agents in graph
- Unit tests for both agents

**Day 4:** Integration testing + Prompt refinement
- Integration tests with real Anthropic API
- Manual prompt testing (ethical framing)
- Refine prompts based on test results
- Performance optimization

**Day 5:** Code review + deployment
- Code review fixes
- Documentation (agent descriptions, prompt rationale)
- Deploy to staging
- Run full test suite in staging

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM outputs invalid JSON (parsing errors) | High | Medium | Explicit JSON schema in prompts, retry once with "must be valid JSON", unit test edge cases |
| Corruption scenarios too aggressive/accusatory | Critical | Low | Strong ethical framing in prompt, manual review of 20 test cases, conditional language validation |
| Quality gate too strict (high refund rate) | Medium | Medium | A/B test thresholds (6.0 vs 5.5 vs 6.5), monitor refund rate, adjust based on data |
| LLM costs exceed budget | Medium | Low | Use Haiku where possible, monitor token usage per agent, cache results aggressively |
| Anthropic API downtime | High | Low | Retry with exponential backoff, fail fast after 3 attempts, show user-friendly error |
| Action items suggest illegal methods | Critical | Very Low | Legal boundaries section in prompt, regex validation for banned keywords, manual review |

---

## Dependencies

**Upstream (must be complete):**
- ✅ PRD 1 - Database Schema & Core Types (need: all TypeScript types, calculateQualityScore, updateInvestigationResults, addInvestigationSource)
- ✅ PRD 2 - UK Public Data Service (need: fetchUKPublicData function)

**Existing Infrastructure:**
- Anthropic API (Claude Opus + Haiku)
- LangGraph (@langchain/langgraph)
- Sentry error tracking

**Downstream (depends on this):**
- PRD 4: API Layer (needs generateAccountabilityReport function)

---

## Definition of Done

- [ ] All 7 files created and committed to feature branch
- [ ] LangGraph graph compiles without errors
- [ ] All 5 agent nodes execute successfully
- [ ] Entity classification accuracy >95% on 20 test cases
- [ ] UK profile research synthesizes data from PRD 2 service
- [ ] Corruption analysis generates 3-5 scenarios with proper ethical framing (manual review)
- [ ] Action list generates 8-15 items across priority levels
- [ ] Quality check calculates scores correctly (0-10 range)
- [ ] All agent outputs match TypeScript interfaces (100% compliance)
- [ ] Ethical language validated: no accusations, conditional phrasing (manual review of 20 cases)
- [ ] Unit tests written and passing (>80% coverage, mocked Anthropic API)
- [ ] Integration tests written and passing (real Anthropic API, marked as slow)
- [ ] Successfully generated reports for 5+ test entities (individuals + organizations)
- [ ] Quality gate tested (both pass and fail scenarios)
- [ ] Prompt engineering validated (no ethical violations)
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Anthropic API usage costs measured: ~£0.33 per investigation
- [ ] Documentation complete (agent descriptions, prompt rationale, ethical guidelines)
- [ ] Deployed to staging and smoke tested

---

**Document Version:** 2.0 (Enhanced with PRD Skill Structure)
**Last Updated:** 2026-01-14
**Author:** Implementation Team
