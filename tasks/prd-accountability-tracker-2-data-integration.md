# PRD 2: Data Integration - UK Public Records Service

## Introduction

Build the data integration layer that fetches information from UK public sources (Companies House, Charity Commission, Register of Members' Interests, Electoral Commission, and Contracts Finder). This service layer will power the AI agents in PRD 3 by providing factual, verified data from official UK registries.

**Dependencies:** PRD 1 (Database Schema & Core Types)

**Estimated Effort:** 5 working days

---

## Goals

- Fetch company and directorship data from Companies House API
- Scrape charity trustee data from Charity Commission via Tavily
- Extract MPs' financial interests from Register of Members' Interests
- Query political donations from Electoral Commission
- Find government contracts awarded to organizations
- Implement aggressive caching (24-hour TTL) to minimize API costs
- Handle API failures gracefully (partial data acceptable)
- Log all data sources for transparency and verification

---

## User Stories

### US-001: Set up Companies House API integration
**Description:** As a developer, I need to integrate with the Companies House API so that the system can fetch verified company and director data.

**Acceptance Criteria:**
- [ ] Register for free Companies House API key
- [ ] Add `COMPANIES_HOUSE_API_KEY` to environment variables
- [ ] Implement Basic Auth header creation (base64 encoding)
- [ ] Create `/lib/services/companies-house-api.ts` with fetch functions
- [ ] Test officer search endpoint returns results for "Boris Johnson"
- [ ] Test appointments endpoint returns directorships
- [ ] Typecheck passes
- [ ] Rate limiting respected (600 requests per 5 minutes)

---

### US-002: Fetch Companies House profile data
**Description:** As an AI agent, I need to fetch Companies House data for any UK entity so that I can build a factual profile of business relationships.

**Acceptance Criteria:**
- [ ] `fetchCompaniesHouseProfile()` function accepts entity name
- [ ] Returns array of `CompanyRecord` objects with company number, name, role, dates
- [ ] Returns array of `InvestigationSource` objects with URLs and timestamps
- [ ] Handles "not found" gracefully (empty array, not error)
- [ ] Handles API errors with retry logic (3 attempts, exponential backoff)
- [ ] Typecheck passes
- [ ] Test with "Boris Johnson" returns 3+ directorships
- [ ] Test with "Asdfghjkl Zxcvbnm" returns empty array

---

### US-003: Scrape Charity Commission data via Tavily
**Description:** As an AI agent, I need to fetch Charity Commission trustee data so that I can identify charity governance roles.

**Acceptance Criteria:**
- [ ] Create `/lib/parsers/charity-commission-parser.ts`
- [ ] `fetchCharityCommissionData()` uses Tavily with domain restriction
- [ ] Search query: `"[name]" trustee site:register-of-charities.charitycommission.gov.uk`
- [ ] Parses charity number from URLs (`/charity/(\d+)/`)
- [ ] Returns array of `CharityRecord` objects
- [ ] Returns array of `InvestigationSource` objects with `verificationStatus: 'unverified'`
- [ ] Typecheck passes
- [ ] Test with "Boris Johnson" returns charity trusteeships

---

### US-004: Extract Register of Members' Interests data
**Description:** As an AI agent, I need to search Register of Members' Interests so that I can understand MPs' declared financial interests.

**Acceptance Criteria:**
- [ ] Create `/lib/parsers/parliament-parser.ts`
- [ ] `fetchRegisterOfInterests()` uses Tavily with parliament.uk domain
- [ ] Search query: `"[name]" "register of interests" site:parliament.uk`
- [ ] Parses interest categories (Employment, Donations, Land, Shareholdings, etc.)
- [ ] Returns array of `InterestDeclaration` objects
- [ ] Handles "not an MP" gracefully (throws error with message)
- [ ] Typecheck passes
- [ ] Test with "Boris Johnson" returns interest declarations

---

### US-005: Query Electoral Commission donations
**Description:** As an AI agent, I need to query Electoral Commission data so that I can map political funding networks.

**Acceptance Criteria:**
- [ ] Create `/lib/parsers/electoral-commission-parser.ts`
- [ ] `fetchElectoralCommissionData()` uses Tavily with Electoral Commission domain
- [ ] Search query: `"[name]" donations site:search.electoralcommission.org.uk`
- [ ] Extracts donation amounts from content (regex for £ symbols)
- [ ] Returns array of `Donation` objects
- [ ] Typecheck passes
- [ ] Test with "Boris Johnson" returns donation records

---

### US-006: Find government contracts
**Description:** As an AI agent, I need to find government contracts awarded to organizations so that I can understand procurement relationships.

**Acceptance Criteria:**
- [ ] Create `/lib/parsers/contracts-finder-parser.ts`
- [ ] `fetchGovernmentContracts()` uses Tavily with Contracts Finder domain
- [ ] Search query: `"[name]" site:contractsfinder.service.gov.uk`
- [ ] Extracts contract values from content
- [ ] Returns array of `Contract` objects
- [ ] Only runs for `entityType === 'organization'`
- [ ] Typecheck passes
- [ ] Test with "Serco Ltd" returns government contracts

---

### US-007: Implement main orchestrator with caching
**Description:** As a system, I need to orchestrate all data sources and cache results so that I minimize API costs and respect rate limits.

**Acceptance Criteria:**
- [ ] Create `/lib/services/uk-public-data-service.ts` with main orchestrator
- [ ] `fetchUKPublicData()` accepts `targetEntity` and `entityType`
- [ ] Calls all 5 data sources in parallel using `Promise.allSettled`
- [ ] Each source wrapped in try-catch (graceful degradation)
- [ ] All sources wrapped in `fetchWithCache()` with appropriate TTLs:
  - Companies House: 24 hours (86400 seconds)
  - Charity Commission: 24 hours
  - Register of Interests: 12 hours (43200 seconds)
  - Electoral Commission: 12 hours
  - Contracts Finder: 24 hours
- [ ] Cache keys format: `uk_data:{source}:{normalized_entity_name}`
- [ ] Returns partial `UKProfileData`, `sources` array, `errors` array
- [ ] Errors include `source`, `error message`, `recoverable` boolean
- [ ] All errors logged to Sentry with tags (component, source, entity)
- [ ] Typecheck passes
- [ ] Test with "Boris Johnson" completes in < 15 seconds
- [ ] Test with cache hit completes in < 500ms

---

### US-008: Test graceful degradation
**Description:** As a system, I need to handle API failures gracefully so that partial data doesn't crash investigations.

**Acceptance Criteria:**
- [ ] If Companies House fails, other sources continue
- [ ] If all sources fail, returns empty arrays (not null) and errors array
- [ ] Transient errors (timeout, 500) trigger retry with exponential backoff
- [ ] Permanent errors (404, 401) don't trigger retry
- [ ] Recoverable errors marked as `recoverable: true` in errors array
- [ ] Non-recoverable errors marked as `recoverable: false`
- [ ] All errors logged to Sentry (not just thrown)
- [ ] Test: Mock Companies House 500 error, verify other sources work
- [ ] Test: Mock all sources failing, verify system doesn't crash
- [ ] Typecheck passes

---

## Functional Requirements

- **FR-1:** Integrate with Companies House API using Basic Auth
- **FR-2:** Search for officers by name and fetch their appointments
- **FR-3:** Parse company records into `CompanyRecord` TypeScript type
- **FR-4:** Use Tavily for sources without official APIs (Charity Commission, Parliament, Electoral Commission, Contracts Finder)
- **FR-5:** Apply domain restrictions to Tavily searches (e.g., `site:register-of-charities.charitycommission.gov.uk`)
- **FR-6:** Cache all API responses with source-specific TTLs (12-24 hours)
- **FR-7:** Implement retry logic with exponential backoff for transient errors
- **FR-8:** Execute all 5 data sources in parallel using `Promise.allSettled`
- **FR-9:** Return partial results if some sources fail (graceful degradation)
- **FR-10:** Track all data sources in `InvestigationSource` objects with URLs and timestamps
- **FR-11:** Log all API errors to Sentry with contextual tags
- **FR-12:** Normalize entity names to lowercase before cache key generation
- **FR-13:** Respect rate limits: Companies House (600/5min), Tavily (per plan limits)
- **FR-14:** Mark Tavily-sourced data as `verificationStatus: 'unverified'`
- **FR-15:** Mark Companies House data as `verificationStatus: 'verified'`

---

## Non-Goals

- No real-time data synchronization (cache TTL is sufficient for MVP)
- No Companies House company search by company number (only officer search by name)
- No detailed financial statement parsing from Companies House
- No automated data verification pipeline (manual verification post-generation)
- No internationalization (UK sources only for MVP)
- No background job to refresh stale cache entries (TTL expiry is sufficient)
- No Companies House PSC (People with Significant Control) data in MVP
- No rate limiting queue system (rely on existing retry logic)

---

## Design Considerations

Not applicable - this PRD is backend/data integration only.

---

## Technical Considerations

### Dependencies
- **Existing integrations:** Tavily API (`@/lib/services/tavily-service`), Vercel KV cache (`withCache`), Sentry error tracking
- **New external API:** Companies House API (requires free registration)
- **Retry infrastructure:** `withRetry` from PRD 1

### API Rate Limits
- **Companies House:** 600 requests per 5 minutes (10 requests/second)
- **Tavily:** Depends on plan (free tier: 1000 searches/month)

### Caching Strategy
- Use existing Vercel KV cache with `withCache()` wrapper
- Cache keys must include normalized entity name to avoid collisions
- TTLs: 12 hours for frequently-updated sources (Parliament, Electoral), 24 hours for static sources (Companies House, Charity)

### Error Handling
- Distinguish transient errors (retry) from permanent errors (don't retry)
- Transient: timeout, 500, 503, ECONNRESET, "overloaded"
- Permanent: 404, 401, 403, "invalid api key"
- All errors logged to Sentry with tags: `component: 'uk-public-data'`, `source: '[source_name]'`, `entity: '[normalized_name]'`

### Performance
- All sources fetched in parallel (not sequential) using `Promise.allSettled`
- Target: < 15 seconds for full data fetch (all sources)
- Target: < 500ms for cache hit

### Cost Management
- Tavily searches cost ~£0.015 each
- Budget: < £0.10 per investigation (max 5-7 searches)
- Cache aggressively to minimize API costs

---

## Success Metrics

- [ ] Companies House API returns data for 95%+ of UK entities with directorships
- [ ] At least 3 out of 5 data sources return results for 80%+ of UK entities
- [ ] Total fetch time < 15 seconds for uncached requests
- [ ] Cache hit rate > 60% after first 100 investigations
- [ ] API error rate < 5% (transient failures handled by retry)
- [ ] Zero rate limit violations (429 errors) from Companies House
- [ ] Tavily API costs < £0.10 per investigation
- [ ] All errors logged to Sentry with proper context (100% coverage)

---

## Open Questions

1. **Q:** Should we implement a fallback if Companies House API is down?
   - **Proposed:** Return cached data if available, else return error with disclaimer in `errors` array

2. **Q:** How do we handle ambiguous entity names (e.g., "John Smith" with 100 matches)?
   - **Proposed:** Return top 5 matches from Companies House, let AI agent disambiguate in PRD 3

3. **Q:** Should we rate limit our own API calls to avoid overwhelming UK sources?
   - **Proposed:** Yes, implement queue with max 10 concurrent requests per source (prevent accidental DoS)

4. **Q:** Do we need a background job to refresh stale cache entries?
   - **Proposed:** Not for MVP, cache TTL expiry is sufficient

5. **Q:** Should we store raw API responses for debugging?
   - **Proposed:** Yes, store in `data_extracted` field of `accountability_investigation_sources` table

6. **Q:** What happens if Tavily returns no results for a search?
   - **Proposed:** Return empty array and add to `errors` array with `recoverable: true`

7. **Q:** Should we implement Companies House company search (in addition to officer search)?
   - **Proposed:** Not for MVP, officer search is sufficient to identify business relationships

---

## Files to Create

1. `/lib/services/uk-public-data-service.ts` - Main orchestrator (~200 lines)
2. `/lib/services/companies-house-api.ts` - Companies House integration (~250 lines)
3. `/lib/parsers/charity-commission-parser.ts` - Charity Commission scraping (~120 lines)
4. `/lib/parsers/parliament-parser.ts` - Register of Interests scraping (~130 lines)
5. `/lib/parsers/electoral-commission-parser.ts` - Electoral Commission scraping (~110 lines)
6. `/lib/parsers/contracts-finder-parser.ts` - Contracts Finder scraping (~110 lines)

**Total LOC Estimate:** ~920 lines

---

## Testing Strategy

### Unit Tests (`/tests/unit/uk-public-data-service.test.ts`)
- Mock Companies House API responses, test parsing logic
- Test cache hit/miss behavior (first request misses, second hits)
- Test error handling (404 returns empty array, 500 triggers retry)
- Test retry logic (transient errors retry 3 times with backoff)
- Test graceful degradation (one source fails, others continue)
- Test Tavily integration (mock Tavily responses, verify parsing)

### Integration Tests (`/tests/integration/uk-public-data.integration.test.ts`)
- Fetch real data for "Boris Johnson" (4+ sources should return data)
- Fetch real data for "Serco Ltd" (Companies House + Contracts Finder)
- Test with non-existent entity ("Asdfghjkl Zxcvbnm") returns empty arrays
- Verify cache populated after first request
- Test concurrent requests (10 parallel) - no race conditions
- Simulate Companies House down (mock 500) - verify other sources work

### Manual Testing Checklist
- [ ] Register for Companies House API key
- [ ] Test API key with curl: `curl -u API_KEY: https://api.company-information.service.gov.uk/search/officers?q=Boris+Johnson`
- [ ] Run integration tests with real APIs
- [ ] Verify rate limiting respected (check Companies House dashboard for usage)
- [ ] Check Sentry logs for any errors during tests
- [ ] Verify cache populated in Vercel KV dashboard
- [ ] Test with 5+ different UK entities (mix of individuals and organizations)
- [ ] Verify all source URLs are accessible in browser

---

## Timeline

**Day 1:** Companies House API integration
- Register for API key
- Implement authentication
- Test officer search and appointments endpoints

**Day 2:** Main orchestrator + caching
- Implement `fetchUKPublicData()` orchestrator
- Add caching layer with `withCache()`
- Implement graceful degradation

**Day 3:** Tavily-based parsers
- Implement all 4 parsers (Charity, Parliament, Electoral, Contracts)
- Test each independently
- Unit tests for parsers

**Day 4:** Integration testing + error handling
- Integration tests with real APIs
- Error handling refinement
- Sentry logging verification
- Performance optimization

**Day 5:** Code review + deployment
- Code review fixes
- Documentation
- Manual testing with 10+ entities
- Deploy to staging environment

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Companies House API rate limits exceeded | High | Medium | Implement request queue, cache aggressively (24h TTL), monitor usage in dashboard |
| Tavily costs exceed budget (>£0.10/investigation) | Medium | Medium | Limit to 5 searches per investigation, cache results, monitor spending |
| Web scraping breaks due to site redesign | High | Medium | Abstract parsers into separate files, add version checks, implement fallback sources |
| No data found for entity (false negatives) | Medium | High | Return partial results with errors array, log to Sentry for investigation, improve search queries |
| Inconsistent data formats from Tavily | Medium | Medium | Normalize data in parsers, validate against TypeScript types, unit test edge cases |
| API downtime (Companies House or Tavily) | High | Low | Graceful degradation, return cached data if available, retry with exponential backoff |

---

## Dependencies

**Upstream (must be complete):**
- ✅ PRD 1 - Database Schema & Core Types (need: `UKProfileData`, `InvestigationSource`, all supporting types, `withCache`, `withRetry`)

**Existing Infrastructure:**
- Tavily API integration (existing)
- Vercel KV cache (existing)
- Sentry error tracking (existing)

**Downstream (depends on this):**
- PRD 3: AI Agents (needs `fetchUKPublicData()` function)

---

## Definition of Done

- [ ] All 6 files created and committed to feature branch
- [ ] Companies House API key registered and added to `.env.local`
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing (real API calls)
- [ ] Successfully fetched data for 5+ test entities (individuals and organizations)
- [ ] Caching verified working (duplicate requests don't hit APIs - check logs)
- [ ] Error handling tested (simulate API failures, verify graceful degradation)
- [ ] All errors logged to Sentry with proper context (component, source, entity tags)
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Documentation updated (README with API setup instructions)
- [ ] Deployed to staging environment and smoke tested
- [ ] Performance benchmarks recorded (baseline for future comparison)

---

**Document Version:** 2.0 (Enhanced with PRD Skill Structure)
**Last Updated:** 2026-01-14
**Author:** Implementation Team
