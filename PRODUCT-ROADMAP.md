# State of Clarity: Agentic Swarming Product Roadmap

## Executive Summary

**Objective:** Build a MECE product roadmap for State of Clarity that integrates Ralph Wiggins' Agentic Swarming framework into the existing LangGraph multi-agent architecture, then create granular PRDs for each epic.

**Current Status:**
- Week 1 of 12-week MVP complete
- Database, auth, and research agent working
- Two sample briefs generated (8.4 and 8.7/10 clarity scores)
- Budget: £2,862 for MVP launch

**Strategic Approach:**
- Enhance (not replace) existing LangGraph 6-agent pipeline with swarm patterns
- Enable parallel execution, specialist agents, consensus scoring, and adaptive refinement
- Maintain 12-week timeline and £2,862 budget
- Cost impact: +£0.03 per brief (acceptable)

---

## MECE Roadmap: 5 Strategic Themes

### THEME 1: Agent Intelligence & Coordination
**Focus:** How agents think, collaborate, and improve outputs

**Epics:**
1. **Epic 1.1: Parallel Agent Execution** - Enable concurrent agent work (60s → 36s generation time)
2. **Epic 1.2: Specialized Agent Roles** - 10 domain specialists (economics, healthcare, climate, etc.)
3. **Epic 1.3: Consensus-Based Clarity Scoring** - 3-agent evaluation panel replaces single judge
4. **Epic 1.4: Adaptive Refinement Swarms** - Deploy targeted fixers (logic, sources, clarity)
5. **Epic 1.5: Agent Observability & Learning** - Track performance, optimize prompts iteratively

**Key Innovation:** Swarm intelligence emerges from agent collaboration, not single-agent perfection.

---

### THEME 2: Content Generation Pipeline
**Focus:** What agents create (research, structure, narrative, scoring)

**Epics:**
1. **Epic 2.1: Question Understanding & Classification** - Analyze question type, domain, controversy level
2. **Epic 2.2: Research Agent Enhancement** - Multi-strategy swarm search (academic, government, opposing views)
3. **Epic 2.3: Structure & Narrative Parallel Generation** - Generate both simultaneously, reconcile for consistency
4. **Epic 2.4: Multi-Level Summary Generation** - 4 parallel agents for child/teen/undergrad/postdoc levels
5. **Epic 2.5: Iterative Quality Gate** - 3-attempt refinement loop, then human review queue

**Key Innovation:** Parallel generation + targeted refinement reduces time and cost while improving quality.

---

### THEME 3: User Experience & Interaction
**Focus:** How users interact with the system and consume briefs

**Epics:**
1. **Epic 3.1: Progressive Brief Generation UI** - Real-time progress with agent status visibility
2. **Epic 3.2: Multi-Layer Brief Reading Interface** - Seamless navigation between summaries, structure, narrative
3. **Epic 3.3: Smart Question Suggestions** - Autocomplete, refinement, templates
4. **Epic 3.4: Community Feedback System** - Vote, suggest sources, spot errors, propose edits
5. **Epic 3.5: Citation Graph Visualization** - Interactive network showing source-claim relationships (post-MVP)

**Key Innovation:** Transparency builds trust; show the swarm at work, not just the final output.

---

### THEME 4: Platform Infrastructure & Operations
**Focus:** Technical foundations, performance, reliability

**Epics:**
1. **Epic 4.1: Robust Error Handling** - Graceful degradation for API failures, timeouts
2. **Epic 4.2: Real-Time Status Updates** - Server-Sent Events for live progress streaming
3. **Epic 4.3: Brief Caching & Performance** - Redis caching, query optimization, CDN
4. **Epic 4.4: Observability & Monitoring** - Sentry, PostHog, custom dashboards
5. **Epic 4.5: Security Hardening & GDPR** - Rate limiting, encryption, compliance

**Key Innovation:** Production-ready infrastructure supports high-volume swarm coordination.

---

### THEME 5: Community & Ecosystem
**Focus:** User engagement, feedback loops, governance

**Epics:**
1. **Epic 5.1: User Accounts & Personalization** - Save briefs, track history, set preferences
2. **Epic 5.2: Reputation & Gamification** - Points, badges, privileges for quality contributions
3. **Epic 5.3: Brief Versioning & Forking** - Living documents evolve through community edits
4. **Epic 5.4: Showcase Briefs** - 3 high-quality examples (≥8.5 clarity) for marketing
5. **Epic 5.5: Beta Launch** - Phased rollout to 5,000 waitlist users

**Key Innovation:** Community-driven quality enhancement creates network effects.

---

### THEME 6: Monetization & Sustainability
**Focus:** Revenue generation, cost recovery, sustainable unit economics

**Epics:**
1. **Epic 6.1: Credit System Infrastructure** - Purchase, track, and consume credits for brief generation
2. **Epic 6.2: Cost Tracking & Pricing Engine** - Real-time cost calculation per brief with 20% margin
3. **Epic 6.3: Payment Integration** - Stripe integration for credit purchases
4. **Epic 6.4: Usage Dashboard** - User-facing credit balance, usage history, cost breakdown
5. **Epic 6.5: Free Tier & Onboarding Credits** - New user credits, rate limiting for free tier

**Key Innovation:** Credits-based model ensures every brief is profitable from day one. Cost + 20% margin = sustainable growth.

**Pricing Model:**
- Brief generation cost: ~£0.50 (API calls + infrastructure)
- Credit price: £0.60 per brief (20% margin)
- 1 credit = 1 brief generation
- Bulk discounts: 10 credits = £6.00, 50 credits = £28.00, 100 credits = £52.00

**MVP Requirement:** This theme is **critical path** - must be complete before beta launch (Epic 5.5).

---

### THEME 7: Grift Hunter (Civic Investigation Tool)
**Focus:** Empowering citizen journalism through structured corruption investigation

**Epics:**
1. **Epic 7.1: Entity Research & Profiling** - Background research on person/entity (position, affiliates, financial disclosures)
2. **Epic 7.2: Corruption Pattern Analysis** - "If they were corrupt, how might they do it?" based on position and known patterns
3. **Epic 7.3: Investigation Strategy Generator** - Actionable investigation steps for citizen journalists
4. **Epic 7.4: Desktop Research Agent** - Deep research mode (premium credits) for comprehensive investigation
5. **Epic 7.5: Disclaimer & Responsible Use Framework** - Legal disclaimers, ethical guidelines, anti-defamation safeguards

**Key Innovation:** Democratize investigative journalism. Sunlight is the best disinfectant - give citizens tools to investigate their representatives.

**Critical Safeguards:**
- Clear disclaimer: "This is not an accusation. This is a research aid for responsible citizen journalism."
- No definitive claims - only hypothetical scenarios and investigation suggestions
- User accepts responsibility terms before using
- Rate limiting to prevent harassment campaigns
- Audit log of all investigations for accountability

**Pricing Model:**
- Entity profile: 2 credits
- Investigation strategy: 3 credits  
- Desktop research investigation: 10-20 credits (intensive agentic chain)

**Timeline:** Post-MVP (Q1 2026) - after core platform stabilizes

---

## Critical Path & Timeline (12 Weeks)

### Phase 1: Foundation - Parallel Execution (Weeks 2-5)
- ✅ Week 1: Database + Auth + Research Agent (COMPLETE)
- **Week 2:** Epic 2.1 (Question Classification)
- **Week 3:** Epic 1.1 (Parallel Execution) + Epic 2.2 (Enhanced Research) + Epic 2.3 (Structure/Narrative) + Epic 2.4 (Summaries)
- **Week 4-5:** Epic 1.2 (Specialist Agents) + Epic 2.5 (Quality Gate)
- **Continuous:** Epic 4.1 (Error Handling)

**Milestone:** End-to-end brief generation in <40s with specialist agents

### Phase 2: Enhancement - Swarm Intelligence (Weeks 6-8)
- **Week 6:** Epic 1.3 (Consensus Scoring) + Epic 1.4 (Adaptive Refinement) + Epic 4.2 (Real-Time Status) + Epic 3.1 (Progress UI)
- **Week 7:** Epic 3.2 (Reading Interface) + Epic 3.3 (Question Suggestions) + Epic 3.4 (Feedback System)
- **Week 8:** Epic 5.1 (User Accounts) + Epic 5.2 (Reputation System)

**Milestone:** Full UX with swarm-enhanced quality and community engagement

### Phase 3: Polish - Production Readiness (Weeks 9-12)
- **Week 9:** Epic 4.3 (Caching) + Epic 4.4 (Monitoring) + Epic 1.5 (Agent Learning)
- **Week 10-11:** Epic 4.5 (Security) + Epic 5.3 (Versioning) + Epic 5.4 (Showcase Briefs)
- **Week 11-12:** Epic 5.5 (Alpha → Beta Launch)

**Milestone:** Production launch to 5,000 waitlist users

---

## Agentic Swarming Integration

### How Swarms Enhance LangGraph

**Current Architecture:** Sequential 6-agent pipeline
```
Research → Structure → Summary → Narrative → Clarity Scoring → Refinement
```

**Enhanced Architecture:** Parallel swarm coordination
```
                    ┌→ Structure Agent (15s) ┐
Research Agent → ├→ Summary Swarm (4 parallel, 10s) ├→ Reconciliation → Consensus Panel (3 evaluators) → Adaptive Refiners
                    └→ Narrative Agent (25s) ┘
```

**Key Changes:**
1. **Parallel Execution:** Structure + Summary + Narrative run concurrently (40% faster)
2. **Specialization:** 10 domain-specific agent personas route based on question classification
3. **Consensus:** 3-agent scoring panel with discussion rounds (more reliable than single judge)
4. **Adaptive Refinement:** Deploy targeted fixers (logic, sources, clarity) not wholesale rewrite
5. **Emergent Quality:** Collaboration yields better outcomes than any single agent

**Architecture Decision:** Keep LangGraph for orchestration, add swarm patterns within nodes = best of both worlds

---

## Critical Files to Modify

### 1. Research Agent (Foundation for Swarm Sourcing)
**Path:** `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State of Clarity _ Claude/lib/agents/research-agent.ts`
- **Current:** Single Tavily search
- **Target:** 5 parallel search strategies (academic, government, opposing views, primary sources)
- **Epic:** 2.2 (Research Enhancement)

### 2. Architecture Documentation
**Path:** `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State of Clarity _ Claude/ARCHITECTURE.md`
- **Current:** Documents sequential 6-agent pipeline
- **Target:** Update with parallel execution, specialist routing, consensus mechanisms
- **Epic:** Foundation for all changes

### 3. MVP Delivery Plan
**Path:** `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State of Clarity _ Claude/MVP-DELIVERY-PLAN.md`
- **Current:** Week-by-week sequential plan
- **Target:** Incorporate MECE roadmap, epic sequencing, swarm milestones
- **Epic:** Project management source of truth

### 4. Database Schema
**Path:** `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State of Clarity _ Claude/lib/supabase/schema.sql`
- **Current:** 8-table schema with brief_jobs, versioning, reputation
- **Target:** Add `agent_execution_logs` table for observability (Epic 1.5)
- **Epic:** 1.5 (Agent Learning)

### 5. LangGraph Orchestrator (NEW FILE)
**Path:** `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State of Clarity _ Claude/lib/agents/langgraph-orchestrator.ts`
- **Status:** To be created
- **Purpose:** Core parallel execution logic, specialist routing, consensus coordination
- **Epic:** 1.1, 1.2, 1.3, 1.4 (all coordination logic)

---

## Success Metrics (MVP Launch - Week 12)

| Metric | Target | Stretch |
|--------|--------|---------|
| **Users Activated** | 2,500 / 5,000 (50%) | 4,000 (80%) |
| **Briefs Generated** | 500 | 1,000 |
| **Avg Clarity Score** | ≥8.0 | ≥8.5 |
| **Generation Time (p95)** | <40 seconds | <30 seconds |
| **Quality Gate Pass Rate** | ≥85% | ≥90% |
| **User Retention (7-day)** | ≥30% | ≥50% |
| **Error Rate** | <3% | <1% |
| **Cost Per Brief** | <£0.50 | <£0.40 |

---

## Budget Analysis

### Cost Per Brief (With Swarm Enhancement)

| Component | Current | With Swarming | Change |
|-----------|---------|---------------|--------|
| Research | £0.015 | £0.045 (3x strategies) | +£0.030 |
| Summaries | £0.020 | £0.020 (4x parallel) | £0 |
| Structure | £0.100 | £0.100 | £0 |
| Narrative | £0.100 | £0.100 | £0 |
| Clarity Scoring | £0.015 | £0.045 (3x consensus) | +£0.030 |
| Refinement | £0.200 | £0.120 (targeted) | -£0.080 |
| **TOTAL** | **£0.450** | **£0.480** | **+£0.030** |

**Impact:** £30 additional at 1,000 briefs = 1% of £2,862 budget (acceptable)

**Budget Status:** ✅ Maintained within £2,862 MVP allocation

---

## Verification Plan (End-to-End Testing)

### Test Scenario 1: Simple Brief Generation
**Question:** "Should the UK adopt a 4-day work week?"
**Expected Behavior:**
1. Question classified as "Economics" domain → routes to Economics Agent persona
2. Research swarm finds 20+ diverse sources (40% opposing perspectives)
3. Structure + Summary + Narrative agents run in parallel (<35s total)
4. 4 reading levels generated (child: 150w, teen: 250w, undergrad: 400w, postdoc: 500w)
5. Consensus panel scores clarity (3 agents reach agreement)
6. If score ≥8: Brief published | If score <8: Deploy adaptive refiners
7. User sees real-time progress in UI (SSE updates)

**Success Criteria:**
- Generation time: <40 seconds (p95)
- Clarity score: ≥8.0
- Source diversity: ≥0.7
- No errors in console or logs

### Test Scenario 2: Controversial Question (High Refinement Likelihood)
**Question:** "Should the UK rejoin the EU?"
**Expected Behavior:**
1. Classified as "Foreign Policy" + "High Controversy"
2. Research swarm explicitly searches for pro-EU and anti-EU sources
3. Initial generation produces brief with clarity score 7.2 (below threshold)
4. Consensus panel identifies issues: Logic coherence low, source balance insufficient
5. Adaptive refiners deploy: Source Balancer adds 3 opposing sources, Logic Surgeon fixes argument gap
6. Re-score: 8.1 clarity → Brief published

**Success Criteria:**
- Refinement triggered correctly
- Targeted fixers deployed (not full rewrite)
- Final clarity score: ≥8.0 after refinement
- Refinement cost: <£0.12

### Test Scenario 3: Parallel Agent Stress Test
**Question:** "What caused the 2008 financial crisis?"
**Expected Behavior:**
1. Classified as "Economics" + "Historical"
2. All agents (Structure, 4x Summary, Narrative) execute simultaneously
3. Monitor agent_execution_logs table for parallel execution timestamps
4. Reconciliation agent checks narrative ↔ structure alignment
5. No race conditions or state conflicts

**Success Criteria:**
- Parallel execution reduces time by 30-40% vs. sequential
- No state corruption (logs show correct sequencing)
- Reconciliation detects and fixes any inconsistencies

### Test Scenario 4: User Experience Flow
**Question:** Any policy question
**Expected Behavior:**
1. User lands on homepage → Sees "Ask a question" input
2. Types "4 day w" → Autocomplete suggests "4-day work week UK policy trade-offs"
3. Submits question → Progress UI shows animated swarm (6 agent avatars)
4. Real-time updates: "Found 18 sources", "Generated summaries", etc.
5. Brief loads → Default to user's preferred reading level (e.g., "Undergrad")
6. User toggles to "Child" level → Seamless transition
7. User clicks "Suggest a source" → Feedback form opens
8. User saves brief → Appears in "My Briefs" (requires auth)

**Success Criteria:**
- <2s page load (First Contentful Paint)
- Progress UI updates in real-time (<100ms latency)
- Reading level toggle works instantly
- Feedback submission records in database

### Test Scenario 5: Community Feedback Loop
**Question:** Pre-existing brief (e.g., "UK 4-Day Work Week")
**Expected Behavior:**
1. User views brief, clicks "Suggest Source"
2. Submits: URL = "https://autonomy.work/4-day-week-uk-pilot", Political Lean = "Left"
3. Suggestion appears in admin moderation queue
4. Admin reviews → Accepts suggestion
5. Research agent re-analyzes brief with new source
6. Brief version increments (V1 → V2)
7. User earns +10 Clarity Points
8. Brief shows "Updated 1 day ago" badge

**Success Criteria:**
- Suggestion recorded in database (feedback_submissions table)
- Admin can accept/reject in <1 minute
- Versioning system tracks changes
- Reputation system awards points correctly

### MCP Tools Check (If Available)
- Test any MCP-provided tools for web fetching or data access
- Ensure integration with brief generation pipeline
- Verify no conflicts with existing Tavily/Claude API calls

---

## Next Steps After Plan Approval

1. **Create Detailed PRDs:** For each of the 25 epics, write a granular Product Requirements Document including:
   - User stories
   - Acceptance criteria
   - Technical specifications
   - Mockups/wireframes (where applicable)
   - Dependencies
   - Test cases

2. **Prioritize Quick Wins:** Start with Epic 1.1 (Parallel Execution) and Epic 2.1 (Question Classification) in Week 2 for immediate ROI

3. **Set Up Observability Early:** Implement Epic 4.4 (Monitoring) instrumentation from Day 1 to track baseline performance before swarm enhancements

4. **Weekly Review Cycle:** Every Friday, review completed epics against success metrics and adjust roadmap if needed

---

## Risk Mitigation

### Technical Risks
1. **Parallel Execution Complexity** → Mitigation: Extensive logging, error handling (Epic 4.1), start simple
2. **Consensus Scoring Latency** → Mitigation: Cache results, run only for final validation
3. **LangGraph Learning Curve** → Mitigation: Start sequential, then parallelize; community support

### Business Risks
1. **User Willingness to Pay** → Mitigation: Generous free tier (3 briefs/month), showcase quality
2. **Generation Speed Expectations** → Mitigation: Progress UI makes wait feel shorter, educate on quality trade-off
3. **Content Moderation** → Mitigation: Question filter, human review queue, clear content policy

---

## Conclusion

This MECE roadmap integrates agentic swarming into State of Clarity through:
- **7 mutually exclusive themes** (Intelligence, Content, UX, Infrastructure, Community, Monetization, Grift Hunter)
- **35 collectively exhaustive epics** covering all aspects from parallel execution to civic investigation tools
- **12-week timeline** maintaining original MVP schedule
- **£2,862 budget** with only +1% cost increase for swarm enhancements

**Key Principle:** Enhance, don't replace. LangGraph provides orchestration; swarm patterns provide intelligence.

**Strategic Focus:** Ship fast, stay lean, validate with real users. This is the entrepreneur's answer to political discourse.

Ready to build 25 granular PRDs, one epic at a time.
