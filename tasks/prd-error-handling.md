# PRD: Error Handling (Epic 4.1)

## Introduction

Robust error handling ensures users have a graceful experience when things go wrong, and developers have visibility into issues. This epic covers frontend errors (React crashes), backend errors (API failures), and infrastructure errors (third-party services down).

**Problem:** Errors currently show raw messages or crash the app. No retry logic, no monitoring, no graceful degradation. Users get confused, developers are blind to production issues.

**Solution:** Implement Sentry for error tracking, friendly error messages with technical details toggle, auto-retry with manual fallback, and graceful degradation with skeleton states.

## Goals

- Capture and track all errors in Sentry for developer visibility
- Show friendly, specific error messages to users
- Provide technical details toggle for debugging
- Auto-retry failed requests with exponential backoff
- Show manual retry option when auto-retry exhausted
- Gracefully degrade with skeleton states and feature disabling
- Handle infrastructure failures (Supabase, Stripe, AI APIs)

## User Stories

### US-001: Install and configure Sentry

**Description:** As a developer, I need Sentry configured to track errors.

**Acceptance Criteria:**
- [ ] Install @sentry/nextjs package
- [ ] Run Sentry wizard to create config files (sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts)
- [ ] Add SENTRY_DSN to .env.example
- [ ] Configure source maps upload for production builds
- [ ] Add Sentry to next.config.mjs via withSentryConfig
- [ ] Document Sentry setup in SETUP.md
- [ ] Typecheck passes

---

### US-002: Create error boundary wrapper component

**Description:** As a developer, I need a reusable error boundary for React components.

**Acceptance Criteria:**
- [ ] Create /app/components/ErrorBoundary.tsx
- [ ] Wrap children and catch React errors
- [ ] Report errors to Sentry with Sentry.captureException
- [ ] Display fallback UI with friendly message
- [ ] Include "Try again" button that resets error state
- [ ] Include "Show details" toggle for technical info
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Wrap main layout with error boundary

**Description:** As a user, I want the app to recover gracefully from crashes.

**Acceptance Criteria:**
- [ ] Wrap app/layout.tsx children with ErrorBoundary
- [ ] Ensure global-error.tsx is configured for root errors
- [ ] Test by throwing error in a component
- [ ] Verify error shows friendly UI, not white screen
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Create standardized API error response format

**Description:** As a developer, I need consistent error responses from all APIs.

**Acceptance Criteria:**
- [ ] Create /lib/errors/api-error.ts with ApiError class
- [ ] ApiError has: statusCode, message, code, details (optional)
- [ ] Create helper: formatErrorResponse(error) returns { error: { message, code, details } }
- [ ] Create common error codes: UNAUTHORIZED, NOT_FOUND, VALIDATION_ERROR, RATE_LIMITED, SERVICE_UNAVAILABLE
- [ ] Typecheck passes

---

### US-005: Create API error handling middleware

**Description:** As a developer, I need centralized error handling for API routes.

**Acceptance Criteria:**
- [ ] Create /lib/errors/with-error-handling.ts
- [ ] Higher-order function that wraps API route handlers
- [ ] Catch errors and return formatted response
- [ ] Log errors to Sentry with context (user ID, route, request body)
- [ ] Return appropriate HTTP status codes
- [ ] Typecheck passes

---

### US-006: Apply error handling to existing API routes

**Description:** As a developer, I need all API routes to use consistent error handling.

**Acceptance Criteria:**
- [ ] Update /app/api/briefs/[id]/vote/route.ts to use withErrorHandling
- [ ] Update /app/api/profile/route.ts to use withErrorHandling
- [ ] Update /app/api/questions/suggest/route.ts to use withErrorHandling
- [ ] Verify errors return formatted JSON, not stack traces
- [ ] Typecheck passes

---

### US-007: Create retry utility with exponential backoff

**Description:** As a developer, I need a utility for retrying failed requests.

**Acceptance Criteria:**
- [ ] Create /lib/utils/retry.ts
- [ ] Function: retryWithBackoff(fn, options): Promise<T>
- [ ] Options: maxRetries (default 3), initialDelay (default 1000ms), maxDelay (default 10000ms)
- [ ] Exponential backoff: delay doubles each retry
- [ ] Add jitter to prevent thundering herd
- [ ] Return result on success, throw after all retries exhausted
- [ ] Typecheck passes

---

### US-008: Create fetch wrapper with auto-retry

**Description:** As a developer, I need a fetch wrapper that handles retries automatically.

**Acceptance Criteria:**
- [ ] Create /lib/utils/fetcher.ts
- [ ] Function: fetchWithRetry(url, options): Promise<Response>
- [ ] Auto-retry on network errors and 5xx responses
- [ ] Don't retry on 4xx responses (client errors)
- [ ] Configurable retry count via options
- [ ] Log retry attempts to console
- [ ] Typecheck passes

---

### US-009: Create user-friendly error message component

**Description:** As a user, I want to see helpful error messages, not technical jargon.

**Acceptance Criteria:**
- [ ] Create /app/components/ErrorMessage.tsx
- [ ] Props: title, message, details (optional), onRetry (optional)
- [ ] Display friendly icon (warning/error)
- [ ] Show title and message prominently
- [ ] "Show technical details" collapsible if details provided
- [ ] "Try again" button if onRetry provided
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Create error message mapping

**Description:** As a developer, I need to map error codes to friendly messages.

**Acceptance Criteria:**
- [ ] Create /lib/errors/error-messages.ts
- [ ] Map error codes to { title, message } objects
- [ ] UNAUTHORIZED: "Sign in required" / "Please sign in to continue"
- [ ] NOT_FOUND: "Not found" / "The page or resource doesn't exist"
- [ ] RATE_LIMITED: "Slow down" / "Too many requests. Please wait a moment."
- [ ] SERVICE_UNAVAILABLE: "Service temporarily unavailable" / "We're having trouble. Please try again."
- [ ] NETWORK_ERROR: "Connection problem" / "Check your internet connection"
- [ ] Default fallback for unknown errors
- [ ] Typecheck passes

---

### US-011: Create loading skeleton components

**Description:** As a user, I want to see placeholders while content loads.

**Acceptance Criteria:**
- [ ] Create /app/components/Skeleton.tsx with variants
- [ ] Variants: text (single line), paragraph (multiple lines), card, avatar, button
- [ ] Animate with subtle pulse effect
- [ ] Accept className for custom sizing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Add skeleton states to brief page

**Description:** As a user, I want to see loading placeholders on the brief page.

**Acceptance Criteria:**
- [ ] Create /app/brief/[id]/loading.tsx with skeleton layout
- [ ] Skeleton for: header, summary, structured data sections, narrative
- [ ] Match actual layout structure
- [ ] Shows while brief data is fetching
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Add skeleton states to homepage

**Description:** As a user, I want to see loading placeholders on the homepage.

**Acceptance Criteria:**
- [ ] Create /app/loading.tsx with skeleton layout
- [ ] Skeleton for: topic grid, featured briefs
- [ ] Match actual layout structure
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Handle Supabase connection errors

**Description:** As a user, I want graceful handling when database is unavailable.

**Acceptance Criteria:**
- [ ] Wrap Supabase queries in try-catch
- [ ] On connection error, show "Database temporarily unavailable"
- [ ] Log error to Sentry with query context
- [ ] Return empty data with error flag (don't crash)
- [ ] Apply to brief fetching and profile fetching
- [ ] Typecheck passes

---

### US-015: Handle AI API errors (Claude/Anthropic)

**Description:** As a user, I want graceful handling when AI service fails.

**Acceptance Criteria:**
- [ ] Wrap AI calls in retry logic (3 attempts)
- [ ] On persistent failure, show "AI service temporarily unavailable"
- [ ] Log error to Sentry with prompt context (sanitized)
- [ ] For question suggestions: fall back to template-only results
- [ ] For brief generation: show error with "Try again" button
- [ ] Typecheck passes

---

### US-016: Handle Stripe API errors

**Description:** As a user, I want graceful handling when payment service fails.

**Acceptance Criteria:**
- [ ] Wrap Stripe calls in try-catch
- [ ] On Stripe down: show "Payment service temporarily unavailable"
- [ ] Disable "Buy credits" buttons when Stripe unreachable
- [ ] Log error to Sentry
- [ ] Don't expose Stripe error messages to users (security)
- [ ] Typecheck passes

---

### US-017: Create service health check endpoint

**Description:** As a developer, I need to check if services are healthy.

**Acceptance Criteria:**
- [ ] Create /app/api/health/route.ts
- [ ] Check Supabase connection
- [ ] Check AI API reachability (lightweight ping)
- [ ] Return { status: 'healthy' | 'degraded' | 'unhealthy', services: {...} }
- [ ] Cache result for 30 seconds to prevent hammering
- [ ] Typecheck passes

---

### US-018: Add error tracking context

**Description:** As a developer, I need user context in Sentry errors.

**Acceptance Criteria:**
- [ ] On user login, call Sentry.setUser({ id, email })
- [ ] On logout, call Sentry.setUser(null)
- [ ] Add custom tags: environment, version
- [ ] Add breadcrumbs for key user actions (page views, button clicks)
- [ ] Typecheck passes

---

### US-019: Create 404 not found page

**Description:** As a user, I want a friendly 404 page.

**Acceptance Criteria:**
- [ ] Create /app/not-found.tsx
- [ ] Display friendly message: "Page not found"
- [ ] Suggest: "The page you're looking for doesn't exist or was moved"
- [ ] Include "Go home" button
- [ ] Include search input to find briefs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-020: Create offline detection

**Description:** As a user, I want to know when I'm offline.

**Acceptance Criteria:**
- [ ] Create /app/components/OfflineBanner.tsx
- [ ] Use navigator.onLine and online/offline events
- [ ] Show banner at top of screen when offline
- [ ] Message: "You're offline. Some features may be unavailable."
- [ ] Auto-hide when back online
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: All errors logged to Sentry with context
- FR-2: React errors caught by error boundary, show fallback UI
- FR-3: API errors return consistent JSON format
- FR-4: Network requests auto-retry with exponential backoff
- FR-5: Users see friendly error messages, not technical errors
- FR-6: Loading states show skeleton placeholders
- FR-7: Third-party service failures handled gracefully
- FR-8: Offline state detected and communicated to user

## Non-Goals

- Offline mode with full functionality (just detection for MVP)
- Caching layer for stale-while-revalidate (post-MVP)
- Circuit breaker pattern (post-MVP)
- Error rate alerting/PagerDuty integration (post-MVP)
- User error reporting ("Report this issue" form)

## Design Considerations

**Error Messages:**
- Use warm, human language (not "Error 500")
- Provide actionable next steps
- Don't blame the user

**Skeleton States:**
- Match actual content layout
- Subtle pulse animation (not distracting)
- Gray/muted colors

**Technical Details:**
- Collapsed by default
- Monospace font for stack traces
- Copy button for easy bug reporting

## Technical Considerations

**Sentry Setup:**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Retry Backoff Formula:**
```typescript
delay = min(initialDelay * 2^attempt + jitter, maxDelay)
```

**Error Boundary Pattern:**
```tsx
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }
}
```

## Success Metrics

- Zero unhandled exceptions visible to users (white screens)
- <5% error rate on API calls
- Mean time to detect errors <1 minute (Sentry alerts)
- User-reported errors decrease by 50%
- All errors have sufficient context for debugging

## Open Questions

1. Should we add a "Report this issue" button for users to provide additional context?
2. Do we need rate limiting on the health check endpoint?
3. Should we show a global banner when services are degraded?
