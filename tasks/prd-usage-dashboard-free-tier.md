# PRD: Usage Dashboard & Free Tier

## Introduction

Complete the monetization system with a user-facing usage dashboard showing credit balance, transaction history, and usage analytics. Implement a free tier with onboarding credits for new users to try the platform before purchasing.

This enables users to understand their usage, plan credit purchases, and gives new users a frictionless onboarding experience.

## Goals

- Provide clear visibility into credit balance and usage
- Show transaction history with filtering
- Display usage analytics (briefs generated, topics covered)
- Grant onboarding credits to new users
- Implement free tier rate limiting
- Encourage conversion from free to paid

## User Stories

### US-001: Create usage dashboard page
**Description:** As a user, I want a dashboard showing my credit usage overview.

**Acceptance Criteria:**
- [ ] Create /app/dashboard/page.tsx as protected route
- [ ] Display current credit balance prominently
- [ ] Show credits expiring in next 30 days with warning
- [ ] Display total briefs generated (all time)
- [ ] Show briefs generated this month
- [ ] Quick link to buy more credits
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Create usage analytics section
**Description:** As a user, I want to see analytics about my brief generation patterns.

**Acceptance Criteria:**
- [ ] Add analytics section to dashboard
- [ ] Show briefs by domain (pie chart or list)
- [ ] Show briefs over time (last 30 days bar chart)
- [ ] Show average clarity score of generated briefs
- [ ] Show most common topics/questions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Create detailed transaction history view
**Description:** As a user, I want to filter and search my transaction history.

**Acceptance Criteria:**
- [ ] Enhance /app/credits/history/page.tsx
- [ ] Add filter by transaction type (purchase/usage/refund/expiry)
- [ ] Add date range filter
- [ ] Add search by description
- [ ] Show running balance after each transaction
- [ ] Export to CSV button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Create credit expiry warning system
**Description:** As a user, I want to be notified when my credits are about to expire.

**Acceptance Criteria:**
- [ ] Show banner on dashboard when credits expire within 30 days
- [ ] Display exact number of credits expiring and date
- [ ] Suggest using credits or that they'll be lost
- [ ] Add expiry info to credit balance component
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Implement onboarding credits for new users
**Description:** As a new user, I want free credits to try the platform.

**Acceptance Criteria:**
- [ ] Grant 3 free credits on email verification / first login
- [ ] Create credit_transactions record with type 'onboarding'
- [ ] Set expires_at to 30 days (shorter than normal 12 months)
- [ ] Only grant once per user (check existing transactions)
- [ ] Show welcome message explaining free credits
- [ ] Typecheck passes

### US-006: Create welcome modal for new users
**Description:** As a new user, I want to understand I have free credits and how to use them.

**Acceptance Criteria:**
- [ ] Create /app/components/WelcomeModal.tsx
- [ ] Show on first login after signup
- [ ] Explain: "You have 3 free credits to try State of Clarity"
- [ ] Brief explanation of what a credit does
- [ ] "Credits expire in 30 days - use them or lose them!"
- [ ] CTA: "Ask your first question"
- [ ] Set flag in localStorage to not show again
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Implement free tier rate limiting
**Description:** As a system, I need to rate limit free tier usage to prevent abuse.

**Acceptance Criteria:**
- [ ] Track if user is on free tier (only has onboarding credits, never purchased)
- [ ] Limit free tier to 1 brief per day
- [ ] Show message: "Free tier limit reached. Purchase credits for unlimited access."
- [ ] Rate limit resets at midnight UTC
- [ ] Paid users (any purchase history) have no daily limit
- [ ] Typecheck passes

### US-008: Create upgrade prompts for free users
**Description:** As a free tier user, I want clear prompts to upgrade when I hit limits.

**Acceptance Criteria:**
- [ ] Show upgrade prompt when daily limit reached
- [ ] Show upgrade prompt when free credits exhausted
- [ ] Display pricing comparison on prompt
- [ ] Highlight value: "Unlimited briefs, no daily limits"
- [ ] Track prompt impressions for analytics
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add credit usage to brief generation flow
**Description:** As a user, I want to see credit cost before generating a brief.

**Acceptance Criteria:**
- [ ] Show "This will use 1 credit" before generation
- [ ] Display current balance in generation UI
- [ ] If balance is 0, show "Buy credits to continue" instead of generate button
- [ ] After generation, show "1 credit used. X credits remaining"
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Create referral credit system (placeholder)
**Description:** As a user, I want to earn credits by referring friends.

**Acceptance Criteria:**
- [ ] Add referral_code column to profiles table (unique, auto-generated)
- [ ] Add referred_by column to profiles table
- [ ] Create /app/referral/page.tsx showing user's referral link
- [ ] Placeholder: "Referral rewards coming soon"
- [ ] Schema ready for future: grant X credits when referral signs up and uses 1 credit
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Add usage stats to admin (placeholder)
**Description:** As an admin, I need aggregate usage statistics.

**Acceptance Criteria:**
- [ ] Create /lib/services/usage-stats-service.ts
- [ ] Function: getTotalCreditsIssued(): Promise<number>
- [ ] Function: getTotalCreditsUsed(): Promise<number>
- [ ] Function: getActiveUsersCount(days: number): Promise<number>
- [ ] Function: getConversionRate(): Promise<number> (free to paid)
- [ ] Log stats for future admin dashboard
- [ ] Typecheck passes

### US-012: Test free tier and dashboard
**Description:** As a developer, I need to validate the free tier and dashboard work correctly.

**Acceptance Criteria:**
- [ ] Create test-free-tier.ts script
- [ ] Test new user receives 3 onboarding credits
- [ ] Test daily rate limit enforced for free tier
- [ ] Test paid users bypass rate limit
- [ ] Test credit expiry warning displays correctly
- [ ] Print test results to console
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Dashboard must display credit balance, usage stats, and expiry warnings
- FR-2: Transaction history must be filterable and exportable
- FR-3: New users must receive 3 free credits on signup
- FR-4: Free credits must expire in 30 days
- FR-5: Free tier users must be limited to 1 brief per day
- FR-6: Upgrade prompts must appear when limits are hit
- FR-7: Credit cost must be shown before brief generation

## Non-Goals

- No mobile app dashboard (web only)
- No real-time usage notifications (email)
- No team/organization accounts
- No referral rewards (placeholder only)
- No admin dashboard UI (stats service only)

## Technical Considerations

- Dashboard uses server components for initial data fetch
- Charts use Recharts (already in stack)
- Rate limiting stored in Redis or database
- Expiry warnings calculated on page load
- CSV export generated client-side from transaction data

## Success Metrics

- Dashboard engagement: ≥50% of users visit dashboard monthly
- Free tier conversion: ≥15% of free users purchase credits
- Credit utilization: ≥70% of free credits used before expiry
- Upgrade prompt CTR: ≥10%

## Open Questions

- Should we show competitor pricing comparison?
- Should free tier have lower quality threshold (accept 7.0+ briefs)?
- Should we offer credit bundles as "subscription-like" monthly recurring?
