# PRD: Investigation Free Tier → Credits Purchase Flow

## Introduction

Fix the bug where users who exhaust their free tier (3 investigations/hour) see a dead-end "Rate limit exceeded" error instead of being directed to purchase credits.

**Current behaviour:** After 3 investigations in an hour, users see "Generation Failed - Rate limit exceeded" with "Your credit has been refunded" and only a "Try Another Entity" button.

**Expected behaviour:** After exhausting free tier, users should see a message explaining they've used their free allowance and be directed to purchase credits to continue.

---

## Root Cause Analysis

The current implementation has a fundamental ordering problem:

1. `withRateLimit` middleware runs **before** `withAuth`
2. Rate limit is keyed by **IP address**, not user ID
3. When rate limit is hit, returns **429** immediately (never reaches credit check)
4. The hook incorrectly shows "credit refunded" for 429 errors

This means:
- Multiple users on same network can rate-limit each other
- Paid users with credits are still blocked by rate limit
- The error message is confusing (no credit was deducted, so nothing was "refunded")

---

## Goals

- Distinguish between "free tier exhausted" and "insufficient credits"
- Free-tier limit should be **per-user** (not per-IP)
- Users with purchase history bypass free-tier limit entirely
- Provide clear path to purchase credits when free tier is exhausted
- Keep a separate high-threshold abuse limiter (429) for protection

---

## User Stories

### US-001: Add hasPurchaseHistory helper to credit service
**Description:** As a developer, I need to check if a user has ever purchased credits.

**Acceptance Criteria:**
- [ ] Add `hasPurchaseHistory(userId): Promise<boolean>` to credit-service.ts
- [ ] Returns true if user has any `credit_transactions` with `transaction_type = 'purchase'`
- [ ] Returns false if no purchase transactions found
- [ ] Handles errors gracefully (returns false on error)
- [ ] Typecheck passes

---

### US-002: Implement per-user free-tier limiter inside authenticated handler
**Description:** As a developer, I need to move tier limiting inside the handler where we have user context.

**Acceptance Criteria:**
- [ ] Remove `withRateLimit` wrapper from accountability generate route (or keep at high threshold for abuse only)
- [ ] Add per-user rate limiting logic inside the `withAuth` handler
- [ ] Free-tier limit keyed by `user.id` (not IP)
- [ ] Limit: 3 requests per hour for users without purchase history
- [ ] Users with purchase history bypass free-tier limit entirely
- [ ] When free tier exhausted: return 402 with `{ error: "Free tier limit reached", redirectTo: "/credits", freeLimit: true }`
- [ ] When insufficient credits (paid user, 0 balance): return 402 with `{ error: "Insufficient credits", redirectTo: "/credits" }`
- [ ] No SSE stream starts for 402 responses
- [ ] Typecheck passes

---

### US-003: Update hook to parse freeLimit from error response
**Description:** As a developer, I need the hook to correctly identify free tier exhaustion and not claim credits were refunded.

**Acceptance Criteria:**
- [ ] Add `isFreeLimit: boolean` to GenerationState
- [ ] Parse `freeLimit` from 402 response body
- [ ] Set `isFreeLimit: true` when 402 response contains `freeLimit: true`
- [ ] Fix `creditRefunded` logic: only true when error response explicitly contains `creditRefunded: true`
- [ ] 402 and 429 errors should NOT show "credit refunded" (no credit was deducted)
- [ ] Typecheck passes

---

### US-004: Show free tier exhaustion UI with Buy Credits CTA
**Description:** As a user who exhausted my free tier, I want to see a clear message with option to buy credits.

**Acceptance Criteria:**
- [ ] When `isFreeLimit: true`, show distinct error panel
- [ ] Heading: "Free Tier Limit Reached"
- [ ] Message: "You've used your 3 free investigations this hour."
- [ ] Subtext: "Purchase credits to continue investigating without limits."
- [ ] Primary CTA: "Buy Credits" button linking to `/credits`
- [ ] Secondary CTA: "Try Again Later" linking to `/accountability`
- [ ] Do NOT show "Your credit has been refunded" message
- [ ] Panel uses warning styling (yellow/amber), not error styling (red)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: `hasPurchaseHistory(userId)` function returns true if user has purchase transactions
- FR-2: Free-tier limit is enforced per `user.id`, not per IP
- FR-3: Users with purchase history bypass free-tier limit (proceed directly to credit check)
- FR-4: Free tier exhaustion returns HTTP 402 with `freeLimit: true` (not 429)
- FR-5: Insufficient credits returns HTTP 402 without `freeLimit`
- FR-6: Hook exposes `isFreeLimit` boolean in state
- FR-7: Hook sets `creditRefunded: false` for 402/429 preflight failures
- FR-8: Generation page shows distinct UI for free tier exhaustion
- FR-9: "Buy Credits" button links to `/credits`
- FR-10: No "credit refunded" message when no credit was deducted

---

## Non-Goals (Out of Scope)

- No new Stripe products needed (existing credit packages work)
- No Redis/external rate limiting (in-memory is acceptable for now)
- No email notifications for free tier exhaustion
- No changes to credit purchase flow
- No changes to investigation generation logic
- No changes to brief generation (separate flow)

---

## Technical Considerations

### Files to Modify

| File | Changes |
|------|---------|
| `lib/services/credit-service.ts` | Add `hasPurchaseHistory(userId)` function |
| `app/api/accountability/generate/route.ts` | Move tier limiting inside handler, remove/adjust withRateLimit |
| `lib/hooks/useInvestigationGeneration.ts` | Add `isFreeLimit`, fix `creditRefunded` logic |
| `app/accountability/generate/page.tsx` | Add free tier exhaustion UI panel |

### Per-User Rate Limiting (In-Memory)

```typescript
// Simple in-memory per-user rate limiter
const userRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkFreeTierLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const limit = 3;
  
  let userLimit = userRateLimits.get(userId);
  if (!userLimit || now > userLimit.resetAt) {
    userLimit = { count: 0, resetAt: now + windowMs };
    userRateLimits.set(userId, userLimit);
  }
  
  if (userLimit.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetAt - now) / 1000) };
  }
  
  userLimit.count++;
  return { allowed: true };
}
```

### Handler Flow

```typescript
const handler = withAuth(async (req, { user }) => {
  // 1. Check if user has purchase history
  const hasHistory = await hasPurchaseHistory(user.id);
  
  // 2. If no purchase history, apply free-tier limit
  if (!hasHistory) {
    const { allowed, retryAfter } = checkFreeTierLimit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { 
          error: "Free tier limit reached", 
          redirectTo: "/credits", 
          freeLimit: true,
          retryAfter 
        },
        { status: 402 }
      );
    }
  }
  
  // 3. Check credit balance (applies to all users)
  const userHasCredits = await hasCredits(user.id, 1);
  if (!userHasCredits) {
    return NextResponse.json(
      { error: "Insufficient credits", redirectTo: "/credits" },
      { status: 402 }
    );
  }
  
  // 4. Proceed with generation...
});

// Optional: Keep abuse limiter at high threshold
export const POST = withRateLimit(handler, { requests: 30, window: 60 });
```

### Hook Fix

```typescript
// Current (wrong):
creditRefunded: response.status !== 402

// Fixed:
// Parse from response body, default to false
const errorData = await response.json();
setState((prev) => ({
  ...prev,
  status: "error",
  error: errorData.error || "Failed to start generation",
  creditRefunded: errorData.creditRefunded === true, // Only true if explicitly set
  isFreeLimit: errorData.freeLimit === true,
}));
```

---

## Edge Cases

### User with purchase history but 0 balance
- Bypasses free-tier limit ✓
- Fails credit check → 402 "Insufficient credits" ✓
- Directed to purchase more credits ✓

### User with non-purchase credits (admin grants, refunds)
- No purchase history → still subject to free-tier limit
- This is acceptable: they should still buy credits to unlock unlimited access
- Could revisit if product requirements change

### Multiple app instances (serverless)
- In-memory Map won't share state across instances
- Free-tier enforcement will be approximate (reset on cold start)
- Acceptable for MVP; add Redis later if needed

### 429 abuse limiter (if kept)
- Should not show "credit refunded" message
- Should show generic "Too many requests, try again in X seconds"
- Separate UI path from 402 errors

---

## Success Metrics

- Users who exhaust free tier see "Buy Credits" CTA (not dead-end error)
- Paid users can run unlimited investigations (subject to credit balance)
- No "credit refunded" message when no credit was deducted
- Clear distinction between free tier limit and insufficient credits

---

## Open Questions

1. Should we show remaining free investigations count in the UI before exhaustion?
2. Should the free-tier limit reset window be longer than 1 hour?
3. Do we need to persist free-tier usage counts to database for accuracy across deployments?

---

*Estimated effort: 2-3 hours. Stories are ordered by dependency.*
