# State of Clarity - MVP Delivery Plan

## Executive Summary

**Objective:** Launch public beta of State of Clarity with 3 showcase briefs, full brief generation capability, and community feedback system.

**Target:** Q3 2025 (12 weeks from now)

**Success Criteria:**
- 3 high-quality showcase briefs live (Clarity Score ≥8/10)
- Users can generate new briefs via "Ask Anything" interface
- Average brief generation time <60 seconds
- Clarity Score calculation automated
- Community can upvote/downvote and suggest sources
- 5,000 waitlist users onboarded successfully

---

## Phase 1: Core Infrastructure (Weeks 1-3)

### Week 1: Database & Authentication

**Deliverables:**
- [ ] Supabase project configured (database, auth, storage)
- [ ] Database schema deployed (briefs, sources, feedback tables)
- [ ] Row-level security policies implemented
- [ ] User authentication flow (email/password + magic link)
- [ ] Protected API routes with JWT verification

**Non-Functional Requirements:**
- Database migrations versioned and reversible
- Auth tokens expire after 7 days
- Rate limiting: 10 requests/minute per IP (unauthenticated)
- GDPR compliance: User data deletion endpoint

**Success Metrics:**
- Auth flow completes in <2 seconds
- Database queries return in <100ms (p95)

**Files to Create/Modify:**
- `/lib/supabase/client.ts` - Supabase client config
- `/lib/supabase/schema.sql` - Database schema
- `/lib/auth/middleware.ts` - Auth middleware for API routes
- `/app/api/auth/[...nextauth]/route.ts` - Auth endpoints

---

### Week 2: Brief Generation Pipeline (Part 1 - Research Agent)

**Deliverables:**
- [ ] Tavily AI API integration (research agent)
- [ ] Source discovery algorithm (15-20 diverse sources)
- [ ] Political lean classification (left/center/right)
- [ ] Credibility scoring (trust score 0-10)
- [ ] Source deduplication logic

**Technical Approach:**
```typescript
// Research Agent Flow using Tavily AI
async function researchAgent(question: string): Promise<Source[]> {
  // 1. Execute search via Tavily (returns comprehensive results with content)
  const tavilyResults = await tavily.search({
    query: question,
    search_depth: "advanced", // More thorough research
    max_results: 20,
    include_answer: true,
    include_raw_content: true,
  });

  // 2. Extract and structure sources
  const structuredSources = tavilyResults.results.map(result => ({
    url: result.url,
    title: result.title,
    content: result.content, // Tavily provides cleaned content!
    score: result.score, // Relevance score 0-1
  }));

  // 3. Classify political lean (using Claude)
  const classifiedSources = await classifyPoliticalLean(structuredSources);

  // 4. Score credibility (domain reputation + publication type)
  const scoredSources = await scoreCredibility(classifiedSources);

  // 5. Ensure diversity (≥40% opposing perspectives)
  const balancedSources = ensureDiversity(scoredSources);

  return balancedSources.slice(0, 20);
}
```

**Why Tavily AI?**
- **Built for AI agents:** Returns structured, cleaned content (no need for scraping)
- **Cost effective:** $0.02/search (~£0.015) vs Perplexity $0.10/search
- **Comprehensive:** "Advanced" mode searches 10+ sources per query
- **Fast:** Typically <5 seconds for 20 high-quality sources
- **Savings:** £75 → £15 for 1,000 briefs (80% reduction)

**Non-Functional Requirements:**
- Research phase completes in <15 seconds (Tavily is faster than Perplexity)
- At least 40% of sources must be from opposing political perspectives
- Primary source ratio ≥40%
- Graceful degradation if Tavily API fails (fallback to Google Custom Search)

**Success Metrics:**
- Source diversity score ≥0.7
- Primary source ratio ≥0.4
- No duplicate URLs

**Files to Create:**
- `/lib/agents/research-agent.ts`
- `/lib/sources/political-classifier.ts`
- `/lib/sources/credibility-scorer.ts`
- `/lib/sources/diversity-checker.ts`

---

### Week 3: Brief Generation Pipeline (Part 2 - Structure & Content Agents)

**Deliverables:**
- [ ] LangGraph workflow implementation
- [ ] Structure agent (extract definitions, factors, policies)
- [ ] Summary agent (4 reading levels)
- [ ] Narrative agent (800-1,200 word essay)
- [ ] Agent state management

**LangGraph Workflow:**
```python
# Pseudocode (implement in TypeScript using LangGraph.js)
StateGraph:
  nodes:
    - research_agent (Week 2 deliverable)
    - structure_agent:
        prompt: "Extract definitions, factors, policies, consequences from sources"
        output: structured_data object
    - summary_agent:
        prompt: "Write 4 summaries (child, teen, undergrad, postdoc)"
        output: summaries object
    - narrative_agent:
        prompt: "Write 800-1200 word cohesive analysis"
        output: narrative string

  edges:
    research_agent → structure_agent → (summary_agent || narrative_agent)
```

**Technical Approach:**
- Use Claude 3.5 Sonnet for all agents (temperature=0.3 for consistency)
- Parallel execution where possible (summaries + narrative run concurrently)
- Streaming responses to show progress to user

**Non-Functional Requirements:**
- Structure agent: <15 seconds
- Summary agent: <20 seconds
- Narrative agent: <25 seconds
- Total pipeline (research → narrative): <60 seconds

**Success Metrics:**
- Structured data contains ≥3 definitions, ≥5 factors, ≥3 policies
- All 4 reading levels generated
- Narrative length 800-1,200 words

**Files to Create:**
- `/lib/agents/langgraph-workflow.ts`
- `/lib/agents/structure-agent.ts`
- `/lib/agents/summary-agent.ts`
- `/lib/agents/narrative-agent.ts`
- `/lib/agents/agent-state.ts`

---

## Phase 2: Clarity Scoring & Refinement (Weeks 4-5)

### Week 4: Clarity Score Implementation

**Deliverables:**
- [ ] First-principles coherence evaluator (LLM-as-judge)
- [ ] Source diversity calculator
- [ ] Recency calculator
- [ ] Primary source ratio calculator
- [ ] Logical completeness evaluator
- [ ] Readability scorer (Flesch-Kincaid)
- [ ] Overall clarity score aggregator

**Clarity Score Formula:**
```typescript
clarity_score = (
  first_principles_coherence × 0.25 +
  source_diversity × 0.20 +
  primary_source_ratio × 0.15 +
  logical_completeness × 0.15 +
  readability × 0.10 +
  recency × 0.10 +
  user_feedback × 0.05
) × 10
```

**First-Principles Coherence Evaluator:**
```typescript
async function evaluateFirstPrinciplesCoherence(brief: Brief): Promise<{
  score: number;
  foundation_score: number;
  chain_score: number;
  consistency_score: number;
  transparency_score: number;
  reasoning: string;
}> {
  const prompt = `
    You are evaluating reasoning quality from FIRST PRINCIPLES.

    Score 0-1 on these criteria:
    1. FOUNDATION CLARITY (0.3 weight): Are core assumptions identified?
    2. LOGICAL CHAIN INTEGRITY (0.3 weight): Do claims build from foundations?
    3. INTERNAL CONSISTENCY (0.2 weight): Are sections contradictory?
    4. ASSUMPTION TRANSPARENCY (0.2 weight): Are hidden assumptions explicit?

    Return JSON: {score, foundation_score, chain_score, consistency_score, transparency_score, reasoning}
  `;

  const result = await claude.complete(prompt + JSON.stringify(brief));
  return result;
}
```

**Non-Functional Requirements:**
- Clarity scoring completes in <10 seconds
- Scores deterministic (same input → same output)
- Breakdown provided for transparency

**Success Metrics:**
- All briefs score ≥7/10 before publication
- Component scores correlate with overall quality

**Files to Create:**
- `/lib/scoring/clarity-scorer.ts`
- `/lib/scoring/first-principles-evaluator.ts`
- `/lib/scoring/source-diversity.ts`
- `/lib/scoring/readability.ts`

---

### Week 5: Refinement Agent & Quality Gate

**Deliverables:**
- [ ] Refinement agent (fixes issues if score <7)
- [ ] Critique generator (identifies gaps/weaknesses)
- [ ] Quality gate (blocks publication if unfixable)
- [ ] Human review queue (edge cases)

**Refinement Loop:**
```typescript
async function generateBriefWithQualityGate(question: string): Promise<Brief> {
  let brief = await initialGeneration(question);
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (attempts < MAX_ATTEMPTS) {
    const clarityScore = await evaluateClarityScore(brief);

    if (clarityScore.score >= 7.0) {
      return brief; // Quality gate passed
    }

    // Generate critique
    const critique = await generateCritique(brief, clarityScore);

    // Attempt refinement
    brief = await refinementAgent(brief, critique);
    attempts++;
  }

  // Failed quality gate - queue for human review
  await queueForHumanReview(brief, "Failed to achieve clarity score ≥7");
  throw new Error("Brief quality insufficient - queued for review");
}
```

**Non-Functional Requirements:**
- Refinement attempts capped at 3 (avoid infinite loops)
- Human review queue has admin dashboard
- Users notified if brief queued ("Generating... this is taking longer than expected")

**Success Metrics:**
- 80% of briefs pass quality gate on first attempt
- <5% require human review
- Refinement improves score by ≥0.5 on average

**Files to Create:**
- `/lib/agents/refinement-agent.ts`
- `/lib/scoring/critique-generator.ts`
- `/lib/admin/review-queue.ts`

---

## Phase 3: User-Facing Features (Weeks 6-8)

### Week 6: Brief Generation UI & Real-Time Status

**Deliverables:**
- [ ] `/api/ask` endpoint (POST request with question)
- [ ] Real-time status updates via WebSockets or Server-Sent Events
- [ ] Progress bar with stage indicators
- [ ] Error handling and user-friendly messages
- [ ] Brief storage in Supabase

**User Flow:**
1. User submits question via "Ask Anything" input
2. Frontend calls `POST /api/ask` → receives `brief_id` + status "processing"
3. User sees progress: "Researching sources... 25%" → "Analyzing factors... 50%" → "Writing narrative... 75%"
4. After 30-60 seconds: Redirect to `/brief/[brief_id]`
5. Brief viewer displays completed brief

**Real-Time Status Updates:**
```typescript
// Using Server-Sent Events (simpler than WebSockets for one-way communication)
// Client
const eventSource = new EventSource(`/api/brief/${briefId}/status`);
eventSource.onmessage = (event) => {
  const { stage, progress } = JSON.parse(event.data);
  updateProgressBar(stage, progress);
};

// Server
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send status updates as brief generates
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({stage: "research", progress: 20})}\n\n`));
      // ... more updates
    }
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}
```

**Non-Functional Requirements:**
- API responds within 200ms (returns brief_id immediately)
- Status updates every 5 seconds
- Timeout after 120 seconds (notify user, queue for async completion)
- Graceful error messages ("Unable to find sufficient sources - try rephrasing?")

**Success Metrics:**
- <3% of requests fail
- Average generation time <60 seconds
- Users stay on progress page (>80% completion rate)

**Files to Create:**
- `/app/api/ask/route.ts`
- `/app/api/brief/[id]/status/route.ts`
- `/components/brief-generation-progress.tsx`

---

### Week 7: Community Feedback System

**Deliverables:**
- [ ] Upvote/downvote buttons (functional)
- [ ] "Suggest Source" modal with form
- [ ] "Spot Error" modal with section selector
- [ ] Feedback storage in Supabase
- [ ] Admin dashboard to review feedback

**Feedback Types:**
1. **Upvote/Downvote** - Simple thumbs up/down on brief quality
2. **Suggest Source** - URL + explanation of why it's relevant
3. **Spot Error** - Section dropdown + description of issue
4. **Edit Proposal** (Phase 4 - not MVP)

**Suggest Source Modal:**
```tsx
<Modal title="Suggest a Source">
  <Input label="URL" placeholder="https://..." required />
  <Textarea label="Why is this source relevant?" required />
  <Select label="Political Lean" options={["Left", "Center", "Right", "Unknown"]} />
  <Button>Submit Suggestion</Button>
</Modal>
```

**Non-Functional Requirements:**
- Anonymous feedback allowed (optional login)
- Rate limiting: 10 feedback submissions per hour per IP
- Spam detection (flag if same URL suggested >3 times by different IPs)
- Admin can accept/reject suggestions (updates brief version)

**Success Metrics:**
- 10% of viewers leave feedback
- <1% spam rate
- 50% of accepted suggestions incorporated within 48 hours

**Files to Create:**
- `/app/api/feedback/route.ts`
- `/components/feedback-modal.tsx`
- `/app/admin/feedback/page.tsx` (admin dashboard)

---

### Week 8: User Accounts & Personalization

**Deliverables:**
- [ ] User registration flow
- [ ] Profile page (username, avatar, bio)
- [ ] Saved briefs (bookmark feature)
- [ ] Reading history
- [ ] Email notifications (optional, for saved briefs updates)

**User Profile Features:**
- Username (unique, 3-20 chars)
- Avatar (upload or Gravatar)
- Bio (optional, 280 chars)
- Public profile page showing their feedback contributions
- Reputation score (based on accepted suggestions)

**Reputation System:**
```typescript
// Earn "clarity points" for contributions
const reputationRules = {
  upvote_received: 1,
  suggestion_accepted: 10,
  error_spotted_verified: 5,
  brief_created_score_8plus: 20,
};

// High-rep users (≥100 points) can fast-track edits
```

**Non-Functional Requirements:**
- Profile creation <5 seconds
- Avatar images resized to 200x200px, <100KB
- GDPR: Users can delete account + all data
- Email notifications opt-in only (GDPR compliant)

**Success Metrics:**
- 40% of users create accounts (vs. anonymous use)
- 20% of registered users save ≥1 brief
- Average reputation score increases over time (engagement indicator)

**Files to Create:**
- `/app/profile/page.tsx`
- `/app/profile/[username]/page.tsx` (public profile)
- `/lib/reputation/calculator.ts`
- `/app/api/user/saved/route.ts`

---

## Phase 4: Polish & Performance (Weeks 9-10)

### Week 9: Performance Optimization

**Deliverables:**
- [ ] Brief caching (Redis or Supabase edge functions)
- [ ] Image optimization (source favicons, user avatars)
- [ ] Database query optimization (indexes on common queries)
- [ ] CDN setup for static assets
- [ ] Lazy loading for brief sections

**Performance Targets:**
| Metric | Target | Current (Estimate) |
|--------|--------|-------------------|
| Homepage load (FCP) | <1.5s | ~2.5s |
| Brief viewer load (FCP) | <2.0s | ~3.5s |
| Brief generation | <60s | ~60s |
| API response (p95) | <200ms | ~500ms |
| Lighthouse score | ≥90 | ~70 |

**Optimization Strategies:**

1. **Brief Caching:**
```typescript
// Cache completed briefs for 24 hours
async function getBrief(id: string): Promise<Brief> {
  const cached = await redis.get(`brief:${id}`);
  if (cached) return JSON.parse(cached);

  const brief = await supabase.from('briefs').select('*').eq('id', id).single();
  await redis.setex(`brief:${id}`, 86400, JSON.stringify(brief));
  return brief;
}
```

2. **Database Indexes:**
```sql
-- Optimize common queries
CREATE INDEX idx_briefs_created_at ON briefs(created_at DESC);
CREATE INDEX idx_briefs_clarity_score ON briefs(clarity_score DESC);
CREATE INDEX idx_feedback_brief_id ON feedback(brief_id);
CREATE INDEX idx_sources_political_lean ON sources(political_lean);
```

3. **Image Optimization:**
- Use Next.js Image component (automatic optimization)
- Serve favicons from `/public/favicons` (cached)
- User avatars uploaded to Supabase Storage (CDN)

**Non-Functional Requirements:**
- All images served as WebP (fallback to PNG)
- Brief viewer uses Intersection Observer for lazy loading
- API routes return 304 Not Modified when appropriate
- Gzip compression enabled

**Success Metrics:**
- Lighthouse Performance ≥90
- Time to Interactive (TTI) <3.5s
- API p95 latency <200ms

**Files to Modify:**
- `/lib/cache/redis-client.ts` (new)
- `/lib/supabase/schema.sql` (add indexes)
- `/next.config.mjs` (image optimization)

---

### Week 10: Error Handling & Monitoring

**Deliverables:**
- [ ] Sentry integration (error tracking)
- [ ] PostHog integration (analytics)
- [ ] Comprehensive error boundaries
- [ ] Fallback UIs for failed states
- [ ] Admin alerting (critical errors)

**Error Handling Strategy:**

1. **User-Facing Errors:**
```tsx
// Example: Brief generation fails
<ErrorState
  title="Unable to generate brief"
  message="We couldn't find enough high-quality sources for this topic. Try rephrasing your question or choosing a different topic."
  action={<Button onClick={retry}>Try Again</Button>}
/>
```

2. **Internal Errors (Logged to Sentry):**
- API failures (Perplexity, Claude)
- Database connection issues
- Timeout errors
- Clarity score calculation failures

3. **Monitoring Dashboards:**
- Real-time error rate (alert if >5%)
- Brief generation success rate (alert if <95%)
- API latency (alert if p95 >500ms)
- Database query performance

**Alerting Rules:**
```yaml
alerts:
  - name: High error rate
    condition: error_rate > 5%
    notify: email + Slack
  - name: Brief generation failures
    condition: success_rate < 95%
    notify: email
  - name: Database slow queries
    condition: query_time_p95 > 1000ms
    notify: Slack
```

**Non-Functional Requirements:**
- All errors logged with context (user_id, brief_id, timestamp)
- PII redacted from logs (email, IP addresses hashed)
- Error boundaries prevent full page crashes
- Graceful degradation (show cached data if API fails)

**Success Metrics:**
- <1% unhandled exceptions
- Mean time to detection (MTTD) <5 minutes
- Mean time to resolution (MTTR) <2 hours

**Files to Create:**
- `/lib/monitoring/sentry-init.ts`
- `/lib/analytics/posthog-init.ts`
- `/components/error-boundary.tsx`

---

## Phase 5: Content & Launch Prep (Weeks 11-12)

### Week 11: Third Showcase Brief & Content Polish

**Deliverables:**
- [ ] Third showcase brief created (e.g., "Can the UK achieve Net-Zero by 2050?")
- [ ] All briefs reviewed and polished
- [ ] About page written (vision, principles, team)
- [ ] FAQ page (common questions)
- [ ] Terms of Service & Privacy Policy

**Third Brief Options (Choose One):**
1. **"Can the UK achieve Net-Zero by 2050?"** (Climate + Economics)
2. **"What are the economic effects of immigration quotas?"** (Immigration + Economics)
3. **"Should the UK adopt proportional representation?"** (Electoral Reform)

**Content Deliverables:**
- `/app/about/page.tsx` - Your vision story (from `docs/VISION.md`)
- `/app/principles/page.tsx` - 8 core principles explained
- `/app/faq/page.tsx` - FAQs about State of Clarity
- `/app/terms/page.tsx` - Legal terms
- `/app/privacy/page.tsx` - GDPR-compliant privacy policy

**SEO Optimization:**
```tsx
// Add metadata to all pages
export const metadata: Metadata = {
  title: "State of Clarity | See politics clearly. Decide wisely.",
  description: "AI-powered policy briefs that deliver transparent, multi-layered answers to any political question.",
  openGraph: {
    title: "State of Clarity",
    description: "See politics clearly. Decide wisely.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "State of Clarity",
    description: "AI-powered policy briefs for better political discourse",
    images: ["/og-image.png"],
  },
};
```

**Non-Functional Requirements:**
- All showcase briefs ≥8.0 clarity score
- About page tells compelling story (<600 words)
- FAQ answers top 10 user questions
- Privacy policy GDPR compliant

**Success Metrics:**
- All 3 briefs live and functional
- About page bounce rate <50%
- Legal pages accessible and clear

---

### Week 12: Beta Testing & Launch

**Deliverables:**
- [ ] Invite 100 alpha testers (friends, family, trusted network)
- [ ] Collect feedback via surveys
- [ ] Fix critical bugs
- [ ] Load testing (1000 concurrent users)
- [ ] Soft launch to waitlist (5000 users)
- [ ] Press kit & launch announcement

**Alpha Testing Phase (Days 1-4):**
- Send invites to 100 trusted users
- Provide feedback form: "What worked? What didn't? What's confusing?"
- Monitor error rates and performance
- Fix P0/P1 bugs immediately

**Load Testing (Day 5):**
```bash
# Simulate 1000 concurrent users
artillery run load-test.yml

# Targets:
# - Homepage: 500 req/sec
# - Brief generation: 50 req/sec
# - API: 200 req/sec
```

**Beta Launch (Days 6-7):**
- Email waitlist (5000 users) in batches:
  - Day 6 AM: 1000 users
  - Day 6 PM: 2000 users
  - Day 7 AM: 2000 users
- Monitor signups, brief generations, errors
- Provide live support (Discord or chat)

**Launch Checklist:**
- [ ] All showcase briefs live
- [ ] Brief generation functional
- [ ] Feedback system working
- [ ] User accounts working
- [ ] Error monitoring active
- [ ] Performance targets met
- [ ] Legal pages published
- [ ] Press kit ready (screenshots, logos, quotes)

**Press Kit Contents:**
- One-pager (vision + features)
- Screenshots (homepage, brief viewer, progress UI)
- Founder story (your entrepreneurial journey into politics)
- Sample brief PDF (for journalists)
- Contact info for interviews

**Success Metrics:**
- 80% of alpha testers complete ≥1 brief generation
- <5% error rate during beta launch
- 50% of waitlist users sign up within 48 hours
- 20% of signups generate ≥1 brief

---

## Non-Functional Requirements (Cross-Cutting)

### Security

**Authentication & Authorization:**
- [ ] JWT tokens with 7-day expiry
- [ ] Rate limiting (10 req/min unauthenticated, 100 req/min authenticated)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user inputs)
- [ ] CSRF tokens for state-changing operations

**Data Protection:**
- [ ] HTTPS only (force redirect from HTTP)
- [ ] Passwords hashed with bcrypt (cost factor 12)
- [ ] API keys stored in environment variables (never committed)
- [ ] Database backups daily (retained 30 days)
- [ ] PII encrypted at rest (user emails, IP addresses)

**Compliance:**
- [ ] GDPR: Right to deletion, data export, consent management
- [ ] Cookie consent banner (analytics opt-in)
- [ ] Privacy policy clearly explains data usage
- [ ] User data retention policy (delete inactive accounts after 2 years)

---

### Reliability

**Availability:**
- Target: 99.5% uptime (3.6 hours downtime/month acceptable for MVP)
- Vercel's default infrastructure provides 99.9%+ for static assets
- Database: Supabase guarantees 99.9% uptime

**Resilience:**
- [ ] Graceful degradation (show cached briefs if generation fails)
- [ ] Retry logic for transient failures (3 attempts with exponential backoff)
- [ ] Circuit breaker for external APIs (Perplexity, Claude)
- [ ] Database connection pooling (prevent exhaustion)

**Disaster Recovery:**
- [ ] Database backups automated (daily, retained 30 days)
- [ ] Backup restoration tested monthly
- [ ] Runbook for common incidents (API outage, database failure)

---

### Scalability

**Current Scale (MVP):**
- 5,000 users
- 500 briefs generated/day
- 10,000 pageviews/day

**Architecture Scaling Strategy:**

| Component | MVP (5K users) | Scale (50K users) | Scale (500K users) |
|-----------|----------------|-------------------|-------------------|
| **Frontend** | Vercel (1 region) | Vercel (multi-region CDN) | Same |
| **API** | Vercel Functions | Dedicated Node.js cluster | Kubernetes cluster |
| **Database** | Supabase (shared) | Supabase (dedicated) | Postgres replica set |
| **Cache** | None | Redis (single instance) | Redis cluster |
| **LLM Calls** | Claude API (pay-per-use) | Claude API (rate limit 500 req/min) | Custom inference (vLLM) |

**Bottleneck Analysis:**
1. **Brief Generation (Claude API):**
   - Rate limit: 500 requests/minute (Tier 3)
   - If 500 briefs/day, well within limits
   - If 5000 briefs/day (~3.5/min), still comfortable
   - Monitor: Alert if approaching 400 req/min

2. **Database Writes:**
   - Supabase handles 10,000 writes/min (shared plan)
   - Each brief = ~5 writes (brief + sources + feedback)
   - 500 briefs/day = ~2 writes/min
   - Not a bottleneck

3. **Frontend (Vercel):**
   - Handles 100,000 req/day easily
   - 10,000 pageviews = ~15 req/min average
   - Not a bottleneck

**Conclusion:** MVP architecture scales to 50K users without changes.

---

### Observability

**Metrics to Track:**

1. **Business Metrics (PostHog):**
   - Briefs generated per day
   - Average clarity score
   - User signups per day
   - Conversion rate (visitor → signup → brief generation)
   - Retention (% users who return after 7 days)

2. **Technical Metrics (Sentry + Vercel Analytics):**
   - Error rate (%)
   - API latency (p50, p95, p99)
   - Brief generation time (average, p95)
   - Database query time
   - Cache hit rate

3. **Quality Metrics (Custom):**
   - % briefs passing quality gate (first attempt)
   - Source diversity score (average)
   - User feedback ratio (upvotes / total votes)

**Dashboards:**
- Real-time: Vercel dashboard (latency, errors, traffic)
- Daily: Custom dashboard (business metrics, quality metrics)
- Weekly: Email report to stakeholders

---

### Developer Experience

**Local Development:**
- [ ] One-command setup: `npm run dev`
- [ ] `.env.example` with all required variables
- [ ] Seed data for local testing (3 sample briefs)
- [ ] Hot reload for instant feedback

**Testing:**
- [ ] Unit tests for scoring algorithms (Jest)
- [ ] Integration tests for API endpoints (Supertest)
- [ ] E2E tests for critical flows (Playwright)
- [ ] Test coverage ≥70%

**Documentation:**
- [ ] README with setup instructions
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component documentation (Storybook)
- [ ] Contribution guidelines

**CI/CD:**
- [ ] GitHub Actions for automated testing
- [ ] Vercel preview deployments (for pull requests)
- [ ] Automated Lighthouse checks (block if score <80)
- [ ] Database migration checks (prevent breaking changes)

---

## Risk Management

### High-Risk Items

1. **Claude API Rate Limits**
   - **Risk:** Exceed rate limit during beta launch spike
   - **Mitigation:**
     - Request rate limit increase from Anthropic (2 weeks lead time)
     - Implement queue system (brief generation queued if API busy)
     - Communicate wait times to users ("~5 min queue")

2. **Clarity Score Quality**
   - **Risk:** Briefs consistently score <7, triggering quality gate
   - **Mitigation:**
     - Alpha test with diverse questions (identify edge cases)
     - Tune prompts based on test results
     - Fallback: Publish with disclaimer ("Preliminary - awaiting review")

3. **Source Discovery Failures**
   - **Risk:** Perplexity API can't find sufficient sources for niche topics
   - **Mitigation:**
     - Fallback to Google Custom Search API
     - Suggest related topics ("Try: 'UK housing crisis' instead of 'UK housing policy in Swindon'")
     - Manual source addition by admins

4. **Waitlist Activation Overload**
   - **Risk:** 5,000 users activate simultaneously, crash site
   - **Mitigation:**
     - Staggered email rollout (1K/2K/2K over 2 days)
     - Rate limiting (1 brief generation per user per hour initially)
     - Load testing before launch

5. **GDPR Compliance Gaps**
   - **Risk:** User data handling violates GDPR, legal liability
   - **Mitigation:**
     - Legal review of Privacy Policy (hire lawyer, ~£1K)
     - Implement data deletion endpoint
     - Cookie consent banner (third-party tool: Cookiebot)

---

### Dependencies & Blockers

**External Dependencies:**
| Dependency | Criticality | Lead Time | Backup Plan |
|------------|-------------|-----------|-------------|
| Anthropic Claude API | Critical | 1 week (sign up) | OpenAI GPT-4 |
| Perplexity API | High | 1 week (sign up) | Google Custom Search |
| Supabase | Critical | 1 day (sign up) | Self-hosted Postgres |
| Vercel | Medium | 1 day (sign up) | Netlify or Railway |

**Internal Blockers:**
- **Week 2-3:** LangGraph learning curve (mitigate: allocate 2 days for prototyping)
- **Week 4:** First-principles evaluator prompt tuning (mitigate: iterate with sample briefs)
- **Week 6:** Real-time status updates (mitigate: fallback to polling if SSE fails)

---

## Success Metrics (MVP Launch)

### Quantitative (Measured at 2 Weeks Post-Launch)

| Metric | Target | Stretch Goal |
|--------|--------|--------------|
| **Waitlist Activation** | 2,500 / 5,000 (50%) | 4,000 / 5,000 (80%) |
| **Briefs Generated** | 500 total | 1,000 total |
| **Average Clarity Score** | ≥8.0 | ≥8.5 |
| **Quality Gate Pass Rate** | ≥80% (first attempt) | ≥90% |
| **User Retention (7-day)** | ≥30% | ≥50% |
| **Feedback Submissions** | ≥100 | ≥250 |
| **Upvote Ratio** | ≥70% | ≥80% |
| **Error Rate** | <5% | <2% |
| **Brief Gen Time (p95)** | <75s | <60s |

### Qualitative

- [ ] 10 testimonials from users ("This helped me understand X")
- [ ] 1 media mention (blog, podcast, or publication)
- [ ] 5 GitHub stars (if open-sourced)
- [ ] Positive sentiment in user surveys (≥4/5 average rating)

---

## Budget Estimate (12 Weeks)

| Item | Cost (GBP) | Notes |
|------|-----------|-------|
| **Infrastructure** | | |
| Vercel Pro | £160 (£20/mo × 8 months to cover buffer) | Scales to 100K req/day |
| Supabase Pro | £200 (£25/mo × 8 months) | 8GB database, 100M reads |
| Redis (Upstash) | £80 (£10/mo × 8 months) | Optional, for caching |
| **APIs (Optimized)** | | |
| Anthropic Claude | £250 | 1,000 briefs, Haiku for summaries, Sonnet for reasoning (~£0.25/brief) |
| Tavily AI | £20 | 1,000 searches @ £0.015 each (80% cheaper than Perplexity) |
| Voyage AI (embeddings) | £50 | For future semantic search (optional in MVP) |
| **Tooling** | | |
| Sentry (error tracking) | £0 | Free tier (50K events/mo) |
| PostHog (analytics) | £0 | Free tier (1M events/mo) |
| GitHub Pro | £32 (£4/mo × 8 months) | Private repos |
| **Legal** | | |
| Privacy Policy review | £500 | One-time legal consultation |
| Terms of Service | £500 | One-time |
| **Marketing** | | |
| Domain (stateofclarity.com) | £30 | Annual |
| Email (Resend API) | £0 | Free tier (3K emails/mo) |
| Press kit design | £200 | Fiverr/Upwork designer |
| **Contingency (15%)** | £370 | Buffer for overages |
| **TOTAL** | **£2,862** | ~£3K for MVP (64% reduction from original £8K!) |

**Cost Breakdown Summary:**
- **Original estimate:** £7,922 (assumed 8,000 briefs)
- **Optimized estimate:** £2,862 (realistic 1,000 briefs + Tavily + Haiku)
- **Savings:** £5,060 (64% reduction)

**Key Optimizations:**
1. Realistic brief volume: 8,000 → 1,000 briefs
2. Switched to Tavily AI: £800 → £20 (97% savings on research)
3. Use Claude Haiku for summaries: 50% cost reduction
4. Token optimization: Reduced context windows

**Revenue Target (Break-Even):**
- £2,862 / £12/mo (Researcher tier) = **239 paying subscribers** (vs 661 before!)
- £2,862 / £49/mo (Professional tier) = **59 paying subscribers** (vs 162 before!)

---

## Timeline Summary

| Phase | Weeks | Key Deliverables | Success Criteria |
|-------|-------|-----------------|------------------|
| **Phase 1: Infrastructure** | 1-3 | Database, Auth, Research Agent, LangGraph | Brief generation pipeline functional end-to-end |
| **Phase 2: Clarity Scoring** | 4-5 | Scoring algorithm, Refinement agent, Quality gate | 80% briefs pass quality gate |
| **Phase 3: User Features** | 6-8 | Brief gen UI, Feedback, User accounts | Users can generate + interact with briefs |
| **Phase 4: Polish** | 9-10 | Performance, Error handling, Monitoring | Lighthouse ≥90, <5% error rate |
| **Phase 5: Launch** | 11-12 | Third brief, Alpha test, Beta launch | 2,500 waitlist activations, 500 briefs generated |

---

## Next Actions (This Week)

**Immediate (Days 1-2):**
1. [ ] Create Supabase project + deploy schema
2. [ ] Sign up for Anthropic Claude API (Tier 3)
3. [ ] Sign up for Tavily AI API (https://tavily.com)
4. [ ] Set up Vercel project + environment variables

**Short-Term (Days 3-7):**
5. [ ] Implement Research Agent (Tavily AI integration)
6. [ ] Build `/api/ask` endpoint (basic version, no LangGraph yet)
7. [ ] Test brief generation pipeline manually (validate feasibility)

**First Milestone (End of Week 1):**
- Database live with auth working
- Research Agent returning 15-20 diverse sources via Tavily
- Manual brief generation pipeline validated
- Cost per brief validated at ~£0.25 (Haiku + Tavily)

---

## Open Questions for Discussion

1. **Third Showcase Brief Topic:**
   - Net-Zero 2050 (climate focus)
   - Immigration Quotas (divisive but high-interest)
   - Proportional Representation (electoral reform)
   - **Your preference?**

2. **Monetization Timing:**
   - Launch with paid tiers immediately (Researcher £12/mo)?
   - Or free for all during beta (3 months), then paywall?
   - **Your preference?**

3. **Open-Source Strategy:**
   - Open-source from Day 1 (transparency, community contributions)?
   - Or proprietary initially (competitive advantage), open-source later?
   - **Your preference?**

4. **Community Governance:**
   - Wikipedia-style (edits live immediately, reviewed later)?
   - Or moderated (edits require approval before going live)?
   - **Your preference?**

5. **API Access (Professional Tier):**
   - Should newsrooms/think-tanks get white-label briefs (remove "State of Clarity" branding)?
   - Or always branded to drive awareness?
   - **Your preference?**

---

## Conclusion

This delivery plan outlines a **12-week path to MVP launch** with:
- ✅ Core brief generation pipeline (LangGraph + Clarity Scoring)
- ✅ User-facing features (generation UI, feedback, accounts)
- ✅ Non-functional excellence (performance, security, monitoring)
- ✅ 3 showcase briefs demonstrating quality
- ✅ Beta launch to 5,000 waitlist users

**Budget:** £3K (64% reduction through Tavily AI + Claude Haiku optimization)
**Timeline:** 12 weeks (Q3 2025 launch on track)
**Success Criteria:** 2,500 activations, 500 briefs generated, ≥8.0 avg clarity score
**Break-even:** 239 Researcher subscribers or 59 Professional subscribers

**You're building the entrepreneur's answer to political discourse.** Let's ship it. 🚀
