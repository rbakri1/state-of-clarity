# PRD: Question Understanding & Classification

## Introduction

Add an intelligent question classification system that analyzes user questions before brief generation begins. The classifier determines the question's domain, controversy level, question type, and temporal scope. These classifications route questions to specialist agent personas and adjust research strategies for optimal output quality.

This is the foundation for the swarm intelligence system—without understanding what kind of question we're dealing with, we can't deploy the right specialists or search strategies.

## Goals

- Classify every incoming question across 4 dimensions before generation starts
- Enable routing to 1 of 10 specialist agent personas based on domain
- Adjust research strategy based on controversy level (more opposing sources for divisive topics)
- Complete classification in <2 seconds (not a bottleneck)
- Use LLM-based classification for flexibility (no hardcoded domain list)

## User Stories

### US-001: Create question classifier service
**Description:** As a developer, I need a service that takes a question string and returns structured classification data so that downstream agents can make informed decisions.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/question-classifier.ts`
- [ ] Function signature: `classifyQuestion(question: string): Promise<QuestionClassification>`
- [ ] Returns object with: `domain`, `controversyLevel`, `questionType`, `temporalScope`
- [ ] Uses Claude Haiku for cost efficiency (~£0.001 per classification)
- [ ] Includes TypeScript types for all classification values
- [ ] Typecheck passes

### US-002: Define classification taxonomy types
**Description:** As a developer, I need clear TypeScript types defining all possible classification values so the codebase is type-safe.

**Acceptance Criteria:**
- [ ] Create `/lib/types/classification.ts`
- [ ] Define `Domain` type: 'economics' | 'healthcare' | 'climate' | 'education' | 'defense' | 'immigration' | 'housing' | 'justice' | 'technology' | 'governance' | 'other'
- [ ] Define `ControversyLevel` type: 'low' | 'medium' | 'high'
- [ ] Define `QuestionType` type: 'factual' | 'analytical' | 'opinion' | 'comparative'
- [ ] Define `TemporalScope` type: 'historical' | 'current' | 'future' | 'timeless'
- [ ] Define `QuestionClassification` interface combining all above
- [ ] Export all types
- [ ] Typecheck passes

### US-003: Implement domain classification prompt
**Description:** As a developer, I need a well-engineered prompt that accurately classifies question domain so specialist routing works correctly.

**Acceptance Criteria:**
- [ ] Prompt instructs Claude to analyze the question and return JSON
- [ ] Prompt includes examples for each domain category
- [ ] Prompt handles edge cases (questions spanning multiple domains → pick primary)
- [ ] Prompt returns structured JSON matching `QuestionClassification` type
- [ ] Test with 5 sample questions covering different domains
- [ ] Typecheck passes

### US-004: Implement controversy level detection
**Description:** As a developer, I need the classifier to detect how controversial a question is so research strategy can be adjusted.

**Acceptance Criteria:**
- [ ] Controversy detection integrated into classification prompt
- [ ] 'high' controversy triggers flag for enhanced source diversity (≥50% opposing views)
- [ ] 'low' controversy uses standard diversity threshold (≥40% opposing views)
- [ ] Test with: "Should UK adopt 4-day week?" (medium) vs "Should UK rejoin EU?" (high) vs "What is GDP?" (low)
- [ ] Typecheck passes

### US-005: Implement question type detection
**Description:** As a developer, I need the classifier to identify question type so agents can adjust their response style.

**Acceptance Criteria:**
- [ ] Detect 'factual' (has definitive answer), 'analytical' (requires reasoning), 'opinion' (normative/should questions), 'comparative' (X vs Y)
- [ ] Question type stored in classification result
- [ ] Test with: "What is inflation?" (factual) vs "Why did inflation rise?" (analytical) vs "Should we raise interest rates?" (opinion)
- [ ] Typecheck passes

### US-006: Implement temporal scope detection
**Description:** As a developer, I need the classifier to identify time context so research can prioritize appropriate sources.

**Acceptance Criteria:**
- [ ] Detect 'historical' (past events), 'current' (present situation), 'future' (predictions), 'timeless' (conceptual)
- [ ] Temporal scope stored in classification result
- [ ] 'historical' questions prioritize archival/academic sources
- [ ] 'current' questions prioritize recent news and reports
- [ ] Test with: "What caused 2008 crisis?" (historical) vs "What is current inflation rate?" (current) vs "Will AI replace jobs?" (future)
- [ ] Typecheck passes

### US-007: Integrate classifier into brief generation pipeline
**Description:** As a developer, I need the classifier to run as the first step in brief generation so all downstream agents have access to classification data.

**Acceptance Criteria:**
- [ ] Classification runs before research agent in pipeline
- [ ] Classification result stored in agent state and passed to all subsequent agents
- [ ] Classification adds <2 seconds to total generation time
- [ ] Classification result logged for observability
- [ ] Typecheck passes

### US-008: Add classification to brief database record
**Description:** As a developer, I need classification data persisted with the brief so we can analyze patterns and improve the system.

**Acceptance Criteria:**
- [ ] Add `classification` JSONB column to `briefs` table (nullable for existing briefs)
- [ ] Generate and run migration successfully
- [ ] Classification data saved when brief is created
- [ ] Typecheck passes

### US-009: Create specialist agent persona mapping
**Description:** As a developer, I need a mapping from domain classification to specialist agent personas so routing works.

**Acceptance Criteria:**
- [ ] Create `/lib/agents/specialist-personas.ts`
- [ ] Define 10 specialist personas with domain-specific system prompts
- [ ] Each persona includes: name, domain expertise, key considerations, authoritative sources to prefer
- [ ] Export `getSpecialistPersona(domain: Domain): SpecialistPersona` function
- [ ] Typecheck passes

### US-010: Route to specialist persona based on classification
**Description:** As a developer, I need downstream agents to use the specialist persona matching the question's domain.

**Acceptance Criteria:**
- [ ] Structure agent uses specialist persona's system prompt
- [ ] Narrative agent uses specialist persona's system prompt
- [ ] Persona influences tone and expertise level of output
- [ ] Test by generating briefs for economics vs healthcare questions and comparing output style
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The system must classify every question before brief generation begins
- FR-2: Classification must complete in <2 seconds (use Claude Haiku)
- FR-3: Classification must return structured data with domain, controversy, type, and temporal scope
- FR-4: The system must route questions to specialist agent personas based on domain
- FR-5: The system must adjust research diversity thresholds based on controversy level
- FR-6: Classification data must be persisted with the brief for analytics
- FR-7: Classification must handle ambiguous questions gracefully (default to 'other' domain, 'medium' controversy)

## Non-Goals

- No user-facing classification UI (classification is invisible to user)
- No user override of classification (can add post-MVP)
- No multi-domain classification (pick primary domain only)
- No fine-tuning or custom model training
- No caching of classification results (questions are unique)

## Technical Considerations

- Use Claude 3.5 Haiku for classification (~£0.001 per call, fast)
- Single LLM call returns all 4 classification dimensions (not 4 separate calls)
- Classification prompt uses JSON mode for reliable parsing
- Specialist personas are static config, not database-driven
- Migration must be backwards-compatible (nullable column)

## Success Metrics

- Classification accuracy: ≥90% agreement with human labeling (test with 50 sample questions)
- Classification latency: <2 seconds (p95)
- Specialist routing improves brief quality (A/B test post-launch)
- Zero classification failures blocking brief generation (graceful fallback to defaults)

## Open Questions

- Should we log classification confidence scores for future model improvement?
- Should 'other' domain questions route to a generalist or refuse generation?
- How do we handle questions in languages other than English?
