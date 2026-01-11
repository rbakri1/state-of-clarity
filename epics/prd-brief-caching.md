# PRD: Brief Caching & Performance (Epic 4.3)

## Introduction

Implement a multi-layer caching strategy to reduce database load and improve page load times before beta launch. Currently, every brief page request hits Supabase directly. With 5,000 beta users, this creates unnecessary latency and costs.

The solution uses Vercel KV (serverless Redis) for server-side caching, HTTP cache headers for CDN/browser caching, and SWR for client-side data fetching with stale-while-revalidate patterns.

## Goals

- Reduce brief page load time by 50%+ for cached content
- Reduce Supabase query volume by 70%+ for popular briefs
- Enable instant page loads with stale-while-revalidate
- Gracefully degrade when cache is unavailable
- Keep infrastructure simple using Vercel's built-in services

## User Stories

### US-001: Install and configure Vercel KV
**Description:** As a developer, I need Vercel KV configured so we have a caching backend.

**Acceptance Criteria:**
- [ ] Install @vercel/kv package
- [ ] Add KV_REST_API_URL and KV_REST_API_TOKEN to .env.example
- [ ] Create /lib/cache/kv-client.ts that exports kv client
- [ ] Add fallback for local development (in-memory Map)
- [ ] Document KV setup in SETUP.md
- [ ] Typecheck passes

### US-002: Create cache wrapper utility
**Description:** As a developer, I need a reusable wrapper to cache any async function result.

**Acceptance Criteria:**
- [ ] Create /lib/cache/with-cache.ts
- [ ] Function signature: withCache<T>(key: string, fn: () => Promise<T>, ttlSeconds: number)
- [ ] Check cache first, return cached value if exists
- [ ] If miss, execute fn, store result, return it
- [ ] Log cache hits/misses with key name
- [ ] Handle cache errors gracefully (fall back to direct fetch)
- [ ] Typecheck passes

### US-003: Create cache invalidation utility
**Description:** As a developer, I need to invalidate cached data when briefs are updated.

**Acceptance Criteria:**
- [ ] Create /lib/cache/invalidate.ts
- [ ] Function invalidateCache(key: string) deletes single key
- [ ] Function invalidatePattern(pattern: string) deletes matching keys (e.g., "brief:*")
- [ ] Log invalidation events
- [ ] Typecheck passes

### US-004: Cache brief fetches in brief-service
**Description:** As a user, I want brief pages to load instantly from cache.

**Acceptance Criteria:**
- [ ] Update getBriefById in /lib/services/brief-service.ts to use withCache
- [ ] Cache key format: "brief:{id}"
- [ ] TTL: 300 seconds (5 minutes)
- [ ] Typecheck passes

### US-005: Invalidate brief cache on updates
**Description:** As a user, I want to see fresh content after a brief is updated.

**Acceptance Criteria:**
- [ ] Call invalidateCache("brief:{id}") in updateBriefFromState
- [ ] Call invalidateCache("brief:{id}") in updateBriefClassification
- [ ] Call invalidateCache("briefs:popular") when any brief is updated
- [ ] Typecheck passes

### US-006: Create brief API endpoint with HTTP caching
**Description:** As a user, I want my browser and CDN to cache brief data.

**Acceptance Criteria:**
- [ ] Create /app/api/briefs/[id]/route.ts GET endpoint
- [ ] Fetch brief using getBriefById (uses server cache)
- [ ] Return 404 if brief not found
- [ ] Set header: Cache-Control: public, s-maxage=60, stale-while-revalidate=300
- [ ] Set header: ETag based on brief.updated_at timestamp
- [ ] Return 304 Not Modified if request ETag matches
- [ ] Typecheck passes

### US-007: Create popular briefs endpoint with aggressive caching
**Description:** As a user, I want the homepage to load quickly with popular briefs.

**Acceptance Criteria:**
- [ ] Create /lib/services/brief-service.ts function getPopularBriefs(limit: number)
- [ ] Query briefs ordered by view_count or upvotes, limit 10
- [ ] Cache key: "briefs:popular", TTL: 600 seconds (10 minutes)
- [ ] Create /app/api/briefs/popular/route.ts
- [ ] Set Cache-Control: public, s-maxage=300, stale-while-revalidate=600
- [ ] Typecheck passes

### US-008: Install and configure SWR
**Description:** As a developer, I need SWR for client-side data fetching with caching.

**Acceptance Criteria:**
- [ ] Install swr package
- [ ] Create /lib/swr/fetcher.ts with default fetcher function
- [ ] Create /lib/swr/config.ts with global SWR config (revalidateOnFocus: false, dedupingInterval: 60000)
- [ ] Wrap app in SWRConfig provider in layout.tsx
- [ ] Typecheck passes

### US-009: Update brief page to use SWR
**Description:** As a user, I want brief pages to use client-side caching for instant navigation.

**Acceptance Criteria:**
- [ ] Update /app/brief/[id]/page.tsx to fetch from /api/briefs/[id] using useSWR
- [ ] Show skeleton loading state while fetching
- [ ] Handle 404 with notFound() redirect
- [ ] Handle errors with ErrorMessage component
- [ ] Stale data shown immediately while revalidating in background
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Add cache warming after brief generation
**Description:** As a user, I want my newly generated brief to load instantly.

**Acceptance Criteria:**
- [ ] After brief generation completes in generation pipeline, call getBriefById to warm cache
- [ ] Log cache warming event
- [ ] Typecheck passes

### US-011: Create cache flush admin endpoint
**Description:** As an admin, I need to manually clear cache if stale data is stuck.

**Acceptance Criteria:**
- [ ] Create /app/api/admin/cache-flush/route.ts POST endpoint
- [ ] Accept body: { pattern?: string } - if pattern provided, flush matching keys; else flush all
- [ ] Require admin authentication (check user role or admin email list)
- [ ] Return { flushed: true, pattern: string | "all" }
- [ ] Log flush event with admin user info
- [ ] Typecheck passes

### US-012: Optimize Supabase client instantiation
**Description:** As a developer, I need efficient database connections without creating new clients per request.

**Acceptance Criteria:**
- [ ] Review getSupabaseClient() in brief-service.ts
- [ ] Ensure client is cached/reused across requests (singleton pattern)
- [ ] Add connection error handling with retry
- [ ] Typecheck passes

### US-013: Add slow query logging
**Description:** As a developer, I need visibility into slow database queries.

**Acceptance Criteria:**
- [ ] Update safeQuery in /lib/supabase/safe-query.ts to track query duration
- [ ] Log queries taking >1000ms to console with query name
- [ ] Report queries taking >2000ms to Sentry as performance issue
- [ ] Typecheck passes

### US-014: Configure static asset caching
**Description:** As a user, I want static assets to load instantly from CDN cache.

**Acceptance Criteria:**
- [ ] Update next.config.mjs with headers() config
- [ ] Set immutable, max-age=31536000 for /_next/static/*
- [ ] Set public, max-age=86400 for /images/*
- [ ] Typecheck passes

### US-015: Implement graceful cache degradation
**Description:** As a user, I want the app to work even if the cache service is down.

**Acceptance Criteria:**
- [ ] Update withCache to catch KV connection errors
- [ ] On cache error, log to Sentry and proceed with direct fetch
- [ ] Never crash the app due to cache failure
- [ ] Add isHealthy() check to /lib/cache/kv-client.ts
- [ ] Typecheck passes

### US-016: Document caching architecture
**Description:** As a developer, I need documentation to understand and extend the caching system.

**Acceptance Criteria:**
- [ ] Create /docs/CACHING.md
- [ ] Document cache layers: Browser → CDN (Vercel Edge) → Vercel KV → Supabase
- [ ] Document TTL values for each cached resource
- [ ] Document cache key naming convention: "{resource}:{id}" or "{resource}:{filter}"
- [ ] Document how to add caching to a new endpoint
- [ ] Document cache invalidation strategy
- [ ] Typecheck passes

## Functional Requirements

- FR-1: All brief fetches must check Vercel KV cache before hitting Supabase
- FR-2: Brief cache entries expire after 5 minutes (300s)
- FR-3: Popular briefs cache expires after 10 minutes (600s)
- FR-4: All brief API responses must include Cache-Control headers for CDN caching
- FR-5: Cache must be invalidated when a brief is created, updated, or deleted
- FR-6: Client-side fetching must use SWR with stale-while-revalidate
- FR-7: Cache failures must not crash the application
- FR-8: Admin users can flush cache via API endpoint

## Non-Goals

- No cache analytics dashboard (beyond basic logging)
- No per-user cache personalization
- No cache pre-warming on deploy (just warm on first access)
- No distributed cache invalidation across regions (Vercel KV handles this)
- No caching of user-specific data (sessions, credits) - only public brief data

## Technical Considerations

- **Vercel KV** is Redis-compatible, uses Upstash under the hood
- **SWR** chosen over React Query for simplicity and Next.js alignment
- **Cache key convention**: `{resource}:{identifier}` e.g., `brief:abc123`, `briefs:popular`
- **TTL strategy**: Popular content cached longer (10min), individual briefs shorter (5min)
- **Stale-while-revalidate**: Users see cached content immediately while fresh data loads in background

## Success Metrics

- Brief page P95 load time < 500ms for cached content
- Cache hit rate > 70% for brief fetches after warm-up period
- Zero downtime due to cache failures (graceful degradation works)
- Supabase query volume reduced by 50%+ compared to pre-caching baseline

## Open Questions

- Should we add cache status to the health check endpoint?
- Do we need cache warming on deployment (pre-populate popular briefs)?
