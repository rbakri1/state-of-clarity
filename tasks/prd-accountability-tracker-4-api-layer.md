# PRD 4: API Layer - REST Endpoints & SSE Streaming

## Introduction

Build the REST API layer that exposes Accountability Tracker functionality to the frontend. This includes:
- **Generation Endpoint**: SSE streaming for real-time progress updates during investigation generation
- **Fetch Endpoint**: Retrieve completed investigation results
- **Export Endpoint**: Redirect to print-optimized page for PDF generation
- **List Endpoint**: Get user's investigation history
- **Credit Integration**: Deduct 1 credit per investigation, refund if quality fails
- **Rate Limiting**: Enforce 3 investigations per hour per user

This is the bridge between the frontend (PRD 5) and the AI agents (PRD 3).

**Dependencies:** PRD 1 (Service Layer, Credit System), PRD 3 (AI Orchestrator)

**Estimated Effort:** 5 working days

---

## Goals

- Create 4 REST API endpoints for investigation management
- Implement SSE (Server-Sent Events) streaming for real-time progress
- Integrate with existing credit system (deduct/refund)
- Enforce rate limiting (3 investigations per hour)
- Validate ethics acknowledgment before processing
- Handle quality gate failures with automatic refunds
- Provide authorization (users can only access their own investigations)
- Support browser-based PDF export via print page redirect

---

## User Stories

### US-001: Create investigation generation endpoint with SSE
**Description:** As a frontend, I need an endpoint to generate investigations with SSE progress updates so that users see real-time progress.

**Acceptance Criteria:**
- [ ] Create `/app/api/accountability/generate/route.ts`
- [ ] POST method with `withAuth` + `withRateLimit` middleware (3 per hour)
- [ ] Request body: `{ targetEntity: string, ethicsAcknowledged: boolean }`
- [ ] Validate `ethicsAcknowledged` is true (400 error if false)
- [ ] Check user has ≥1 credit via `hasCredits()` (402 error if insufficient)
- [ ] Create investigation record via `createInvestigation()`
- [ ] Deduct 1 credit via `deductCredits()`
- [ ] Call `generateAccountabilityReport()` with callbacks
- [ ] Stream SSE events: `agent_started`, `agent_completed`, `stage_changed`, `complete`, `error`
- [ ] Check quality score: refund if < 6.0
- [ ] Refund credit if any error occurs
- [ ] Return SSE stream with proper headers (`Content-Type: text/event-stream`)
- [ ] Max duration: 300 seconds (5 minutes)
- [ ] Typecheck passes
- [ ] Test with curl: `curl -N -H "Authorization: Bearer TOKEN" -X POST -d '{"targetEntity":"Boris Johnson","ethicsAcknowledged":true}' http://localhost:3000/api/accountability/generate`

---

### US-002: Create fetch investigation endpoint
**Description:** As a frontend, I need an endpoint to fetch completed investigation results so that users can view their investigations.

**Acceptance Criteria:**
- [ ] Create `/app/api/accountability/[id]/route.ts`
- [ ] GET method with `withAuth` middleware
- [ ] Fetch investigation via `getInvestigation(id)`
- [ ] Return 404 if investigation not found
- [ ] Verify `investigation.user_id === user.id` (403 if not)
- [ ] Fetch sources via `getInvestigationSources(id)`
- [ ] Return JSON: `{ investigation: { ...investigation, sources } }`
- [ ] Typecheck passes
- [ ] Test: User A cannot access User B's investigation (403)
- [ ] Test: Non-existent ID returns 404

---

### US-003: Create export endpoint
**Description:** As a frontend, I need an endpoint to export investigations to PDF so that users can download their results.

**Acceptance Criteria:**
- [ ] Create `/app/api/accountability/[id]/export/route.ts`
- [ ] GET method with `withAuth` middleware
- [ ] Fetch investigation via `getInvestigation(id)`
- [ ] Return 404 if investigation not found
- [ ] Verify `investigation.user_id === user.id` (403 if not)
- [ ] Redirect to `/accountability/[id]/print` page (302 status)
- [ ] Typecheck passes
- [ ] Test: Redirect URL is correct
- [ ] Test: User A cannot export User B's investigation (403)

---

### US-004: Create list investigations endpoint
**Description:** As a frontend, I need an endpoint to list user's investigations so that users can see their history.

**Acceptance Criteria:**
- [ ] Create `/app/api/accountability/route.ts`
- [ ] GET method with `withAuth` middleware
- [ ] Fetch investigations via `listUserInvestigations(user.id, 50)`
- [ ] Return JSON: `{ investigations: [...] }`
- [ ] Investigations ordered by `created_at DESC`
- [ ] Limit to 50 most recent
- [ ] Typecheck passes
- [ ] Test: Returns only current user's investigations

---

### US-005: Implement SSE helper functions
**Description:** As a developer, I need SSE helper functions so that streaming is consistent across endpoints.

**Acceptance Criteria:**
- [ ] Create `createSSEResponse(stream)` helper in generation route
- [ ] Returns Response with headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- [ ] Create `sendSSE(controller, event, data)` helper
- [ ] Formats message as: `event: {event}\ndata: {JSON.stringify(data)}\n\n`
- [ ] Encodes message as UTF-8 via TextEncoder
- [ ] Typecheck passes
- [ ] Test: SSE messages parse correctly in browser EventSource

---

### US-006: Integrate credit system
**Description:** As a system, I need to integrate with the credit system so that users are charged correctly for investigations.

**Acceptance Criteria:**
- [ ] Check credits before generation: `hasCredits(user.id, 1)`
- [ ] Deduct 1 credit before generation: `deductCredits(user.id, 1, investigationId, description)`
- [ ] Refund if quality gate fails: `refundCredits(user.id, 1, investigationId, "Quality gate failed")`
- [ ] Refund if generation errors: `refundCredits(user.id, 1, investigationId, "Generation failed")`
- [ ] All transactions logged in `credit_transactions` table
- [ ] Typecheck passes
- [ ] Test: Credit balance decreases by 1 after successful generation
- [ ] Test: Credit refunded if quality score < 6.0
- [ ] Test: Credit refunded if Anthropic API throws error

---

### US-007: Implement rate limiting
**Description:** As a system, I need to enforce rate limiting so that users can't abuse the system.

**Acceptance Criteria:**
- [ ] Apply `withRateLimit({ requests: 3, window: 3600 })` to generation endpoint
- [ ] 3 requests per hour per user (window: 3600 seconds)
- [ ] 4th request returns 429 status with `Retry-After` header
- [ ] Error message: `{ error: "Rate limit exceeded", retryAfter: 3600 }`
- [ ] Rate limit tracked per user ID (not IP)
- [ ] Typecheck passes
- [ ] Test: 3 requests succeed, 4th returns 429
- [ ] Test: After 1 hour, can make 3 more requests

---

### US-008: Handle error cases gracefully
**Description:** As a system, I need to handle all error cases so that users get helpful error messages.

**Acceptance Criteria:**
- [ ] Ethics not acknowledged: 400 with message "Ethics acknowledgment required"
- [ ] Insufficient credits: 402 with message + link to `/credits`
- [ ] Rate limit exceeded: 429 with `Retry-After` header
- [ ] Investigation not found: 404 with message "Investigation not found"
- [ ] Unauthorized access: 403 with message "Unauthorized"
- [ ] Generation error: 500 with message, credit refunded, SSE `error` event
- [ ] All errors logged to console with context
- [ ] Typecheck passes
- [ ] Test each error case manually

---

## Functional Requirements

- **FR-1:** POST `/api/accountability/generate` endpoint with SSE streaming
- **FR-2:** GET `/api/accountability/[id]` endpoint to fetch investigation
- **FR-3:** GET `/api/accountability/[id]/export` endpoint to redirect to print page
- **FR-4:** GET `/api/accountability` endpoint to list user's investigations
- **FR-5:** All endpoints use `withAuth` middleware (require authentication)
- **FR-6:** Generation endpoint uses `withRateLimit` (3 requests per hour)
- **FR-7:** Generation endpoint validates `ethicsAcknowledged` is true
- **FR-8:** Generation endpoint checks credit balance before processing
- **FR-9:** Generation endpoint deducts 1 credit before starting
- **FR-10:** Generation endpoint refunds credit if quality score < 6.0
- **FR-11:** Generation endpoint refunds credit if generation errors
- **FR-12:** SSE events include: `agent_started`, `agent_completed`, `stage_changed`, `complete`, `error`
- **FR-13:** SSE events include timestamps (ISO 8601 format)
- **FR-14:** Fetch endpoint verifies user owns investigation (403 if not)
- **FR-15:** Fetch endpoint includes sources from junction table
- **FR-16:** Export endpoint redirects to `/accountability/[id]/print`
- **FR-17:** List endpoint returns max 50 most recent investigations
- **FR-18:** List endpoint orders by `created_at DESC`
- **FR-19:** All endpoints return JSON (except SSE stream)
- **FR-20:** All endpoints have try-catch error handling

---

## Non-Goals

- No WebSocket implementation (SSE is sufficient for one-way streaming)
- No pagination for list endpoint (50 item limit is sufficient for MVP)
- No filtering/sorting options for list endpoint
- No server-side PDF generation (browser print is sufficient)
- No investigation sharing (all investigations private)
- No bulk operations (delete multiple, export multiple)
- No investigation editing (immutable once created)
- No partial refunds (full credit refund or none)
- No custom rate limits per user tier (all users get 3/hour)
- No investigation comments or notes

---

## Design Considerations

Not applicable - this PRD is backend API only.

---

## Technical Considerations

### SSE vs WebSocket
- **Choice**: SSE (Server-Sent Events)
- **Rationale**: One-way streaming (server → client) is sufficient, simpler than WebSocket, native browser support

### Credit System Integration
- Leverage existing `credit-service.ts` from State of Clarity
- No changes needed to credit system
- Investigation costs same as briefs: 1 credit

### Rate Limiting Strategy
- Use existing `withRateLimit` middleware
- Per-user tracking (not IP-based) to prevent multi-account abuse
- 3 investigations per hour is strict but reasonable for investigative journalism use case

### Authorization
- All endpoints verify `investigation.user_id === user.id`
- No public investigations in MVP (all private)
- Service role can access all (for admin tools)

### Error Handling
- All Anthropic API errors caught and trigger refund
- Quality gate failures logged but not treated as errors (expected behavior)
- Network errors during SSE close stream gracefully

### Middleware Composition
- Use existing `compose()` helper to chain middleware
- Order: `withRateLimit` → `withAuth` → handler
- Rate limit first to reject early (before auth DB query)

---

## Success Metrics

- [ ] SSE streaming works in all modern browsers (Chrome, Firefox, Safari, Edge)
- [ ] Generation endpoint completes in < 2 minutes for 90% of requests
- [ ] Zero credit deduction errors (100% transaction logging)
- [ ] Rate limiting effective: 0 users exceed 3/hour limit
- [ ] Authorization effective: 0 cross-user access incidents
- [ ] Quality gate refunds work: 10-15% refund rate (as expected)
- [ ] SSE events arrive in correct order (100% of streams)
- [ ] API error rate < 1% (excluding expected 402/429/403/404)

---

## Open Questions

1. **Q:** Should we implement request deduplication (prevent accidental double-submit)?
   - **Proposed:** Not for MVP, rate limiting is sufficient

2. **Q:** How long should we keep investigation records in DB?
   - **Proposed:** Indefinitely (no auto-deletion), user can manually delete if needed

3. **Q:** Should we log all API requests for analytics?
   - **Proposed:** Yes, log to console with: user_id, endpoint, duration, status

4. **Q:** What happens if SSE connection drops mid-generation?
   - **Proposed:** Generation continues, credit not refunded, user can fetch result from `/api/accountability/[id]`

5. **Q:** Should we implement webhook for generation completion?
   - **Proposed:** Not for MVP, SSE is sufficient

6. **Q:** How do we handle concurrent generations by same user?
   - **Proposed:** Allowed (not blocked), rate limit prevents abuse

7. **Q:** Should export endpoint support other formats (JSON, CSV)?
   - **Proposed:** Not for MVP, PDF only (via browser print)

---

## Files to Create

1. `/app/api/accountability/generate/route.ts` - Generation endpoint with SSE (~250 lines)
2. `/app/api/accountability/[id]/route.ts` - Fetch endpoint (~80 lines)
3. `/app/api/accountability/[id]/export/route.ts` - Export redirect (~60 lines)
4. `/app/api/accountability/route.ts` - List endpoint (~50 lines)

**Total LOC Estimate:** ~440 lines

---

## Testing Strategy

### Unit Tests (`/tests/unit/accountability-api.test.ts`)

**Mock all dependencies**

- **Generation Endpoint:**
  - Mock `hasCredits()` to return false → verify 402 error
  - Mock `deductCredits()` → verify called with correct args
  - Mock `generateAccountabilityReport()` → verify callbacks invoked
  - Mock quality score < 6.0 → verify refund called
  - Mock generation error → verify refund called
  - Test `ethicsAcknowledged: false` → verify 400 error
  - Test SSE event formatting

- **Fetch Endpoint:**
  - Mock `getInvestigation()` → verify 404 if null
  - Mock different user ID → verify 403 error
  - Mock successful fetch → verify sources included

- **Export Endpoint:**
  - Mock `getInvestigation()` → verify redirect URL correct
  - Mock different user ID → verify 403 error

- **List Endpoint:**
  - Mock `listUserInvestigations()` → verify only current user's

- **Rate Limiting:**
  - Simulate 3 requests → all succeed
  - Simulate 4th request → verify 429 error

### Integration Tests (`/tests/integration/accountability-api.test.ts`)

**Use real database + real Anthropic API (or mocked)**

- **Full Generation Flow:**
  - Authenticate as user
  - Check initial credit balance
  - POST to `/api/accountability/generate` with valid data
  - Parse SSE stream
  - Verify events: `agent_started`, `agent_completed`, `complete`
  - Verify credit balance decreased by 1
  - Verify investigation stored in DB
  - Verify sources stored in junction table

- **Quality Gate Failure:**
  - Mock `generateAccountabilityReport()` to return score 3.0
  - POST to generation endpoint
  - Verify credit refunded
  - Verify SSE `complete` event has `creditRefunded: true`

- **Generation Error:**
  - Mock Anthropic API to throw error
  - POST to generation endpoint
  - Verify credit refunded
  - Verify SSE `error` event emitted

- **Authorization:**
  - User A creates investigation
  - User B tries to fetch it → verify 403
  - User B tries to export it → verify 403

- **Rate Limiting:**
  - User makes 3 requests in 1 minute → all succeed
  - User makes 4th request → verify 429
  - Wait 1 hour, make request → succeeds

### Manual Testing Checklist

- [ ] Test SSE in browser with EventSource:
  ```javascript
  const es = new EventSource('/api/accountability/generate', {
    method: 'POST',
    body: JSON.stringify({...})
  });
  es.addEventListener('agent_started', (e) => console.log(e.data));
  ```
- [ ] Test with curl: `curl -N -H "Authorization: Bearer TOKEN" -X POST ...`
- [ ] Test rate limiting: make 4 requests rapidly
- [ ] Test insufficient credits: create user with 0 credits, try to generate
- [ ] Test quality gate failure: use entity with no public data
- [ ] Test cross-user access: try to fetch another user's investigation
- [ ] Test export redirect: verify print page loads correctly

---

## Timeline

**Day 1:** Generation endpoint core logic
- Implement POST handler
- Add middleware (auth + rate limit)
- Integrate credit system
- Basic error handling

**Day 2:** SSE streaming implementation
- Implement SSE helper functions
- Wire up callbacks to orchestrator
- Test SSE in browser
- Handle connection drops

**Day 3:** Fetch, export, list endpoints
- Implement GET `/api/accountability/[id]`
- Implement GET `/api/accountability/[id]/export`
- Implement GET `/api/accountability`
- Authorization checks

**Day 4:** Testing
- Unit tests (mocked dependencies)
- Integration tests (real DB + API)
- Rate limiting tests
- Error scenario tests

**Day 5:** Code review + deployment
- Code review fixes
- API documentation
- Deploy to staging
- Manual smoke tests

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SSE connection drops mid-generation | Medium | Medium | Generation continues in background, credit not refunded, user can fetch result later |
| Rate limiting too strict (user frustration) | Medium | Low | Monitor user feedback, adjust to 5/hour if needed, clear error message with time remaining |
| Credit deduction race condition (duplicate charge) | High | Very Low | Use DB transaction for deduction, test with concurrent requests |
| Quality gate refund fails (user charged unfairly) | High | Very Low | Wrap refund in try-catch, log to Sentry, manual admin review if fails |
| Anthropic API timeout during generation | Medium | Low | Set 300s max duration, fail gracefully, refund credit |
| Browser doesn't support EventSource (old browsers) | Low | Low | Show error message: "Please use a modern browser" |

---

## Dependencies

**Upstream (must be complete):**
- ✅ PRD 1 - Service Layer (need: createInvestigation, getInvestigation, updateInvestigationResults, listUserInvestigations, getInvestigationSources, credit service functions)
- ✅ PRD 3 - AI Orchestrator (need: generateAccountabilityReport function with callbacks)

**Existing Infrastructure:**
- withAuth middleware (existing)
- withRateLimit middleware (existing)
- Credit system (existing)
- Supabase database (existing)

**Downstream (depends on this):**
- PRD 5: Frontend (needs all 4 API endpoints)

---

## Definition of Done

- [ ] All 4 API route files created and committed to feature branch
- [ ] POST `/api/accountability/generate` returns SSE stream
- [ ] SSE events emit in correct order (`agent_started` → `agent_completed` → `complete`)
- [ ] Credit deducted before generation starts (verified in DB)
- [ ] Credit refunded if quality score < 6.0 (verified in DB)
- [ ] Credit refunded if generation errors (verified in DB)
- [ ] Rate limiting blocks 4th request in 1 hour (tested manually)
- [ ] GET `/api/accountability/[id]` returns investigation data with sources
- [ ] Authorization enforced: users can't access others' investigations (tested)
- [ ] Export endpoint redirects to print page (verified)
- [ ] List endpoint returns user's investigations only (tested)
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] SSE streaming works in browser (tested with Chrome, Firefox, Safari)
- [ ] All error cases handled gracefully (400, 402, 403, 404, 429, 500)
- [ ] API documented in README or API.md
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Deployed to staging and smoke tested
- [ ] Performance benchmarks recorded (generation time, SSE latency)

---

**Document Version:** 2.0 (Enhanced with PRD Skill Structure)
**Last Updated:** 2026-01-14
**Author:** Implementation Team
