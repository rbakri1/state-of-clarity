# PRD: Credit System & Payments

## Introduction

Implement a credits-based monetization system where users purchase credits to generate briefs. Each brief costs 1 credit, priced at cost + 20% margin. Bulk discounts are available but maintain profitability at all tiers. Credits expire after 12 months. Payment is handled via Stripe with Apple Pay and Google Pay support.

This is critical for sustainable operations - every brief must be profitable from day one.

## Goals

- Implement credit purchase, storage, and consumption
- Integrate Stripe for payments with Apple Pay/Google Pay
- Price credits at cost + 20% margin minimum
- Offer bulk discounts while maintaining profitability
- Expire unused credits after 12 months
- Handle failed payments with auto-retry
- Real-time credit balance updates

## Pricing Model

**Base Cost Per Brief:** ~£0.50 (API + infrastructure)
**Target Margin:** 20% minimum

| Package | Credits | Price | Per Credit | Margin |
|---------|---------|-------|------------|--------|
| Single | 1 | £0.60 | £0.60 | 20% |
| Starter | 10 | £5.50 | £0.55 | 10% |
| Standard | 50 | £25.00 | £0.50 | 0%* |
| Pro | 100 | £45.00 | £0.45 | -10%* |

*Note: Bulk tiers may have lower margin but drive volume and retention. Revisit pricing based on actual costs.

**Alternative pricing (ensuring 20% margin on all tiers):**

| Package | Credits | Price | Per Credit | Margin |
|---------|---------|-------|------------|--------|
| Single | 1 | £0.65 | £0.65 | 30% |
| Starter | 10 | £6.00 | £0.60 | 20% |
| Standard | 50 | £28.00 | £0.56 | 12% |
| Pro | 100 | £52.00 | £0.52 | 4% |

*Final pricing TBD based on actual cost analysis.*

## User Stories

### US-001: Create credits database schema
**Description:** As a developer, I need database tables to track credit balances and transactions.

**Acceptance Criteria:**
- [ ] Create `user_credits` table: id, user_id, balance, created_at, updated_at
- [ ] Create `credit_transactions` table: id, user_id, amount (positive=purchase, negative=usage), transaction_type (purchase/usage/refund/expiry), description, brief_id (nullable), stripe_payment_id (nullable), created_at
- [ ] Create `credit_packages` table: id, name, credits, price_gbp, stripe_price_id, active, created_at
- [ ] Add expires_at column logic: credits expire 12 months after purchase
- [ ] Create migration /lib/supabase/migrations/008_add_credits_tables.sql
- [ ] Update Database interface in client.ts
- [ ] Typecheck passes

### US-002: Create credit service
**Description:** As a developer, I need a service to manage credit operations.

**Acceptance Criteria:**
- [ ] Create /lib/services/credit-service.ts
- [ ] Function: getBalance(userId): Promise<number>
- [ ] Function: hasCredits(userId, amount): Promise<boolean>
- [ ] Function: deductCredits(userId, amount, briefId, description): Promise<boolean>
- [ ] Function: addCredits(userId, amount, transactionType, stripePaymentId): Promise<void>
- [ ] Function: refundCredits(userId, amount, briefId, reason): Promise<void>
- [ ] All operations create transaction records
- [ ] Typecheck passes

### US-003: Implement credit expiry logic
**Description:** As a developer, I need credits to expire 12 months after purchase.

**Acceptance Criteria:**
- [ ] Track purchase date for each credit batch in credit_transactions
- [ ] Add `credit_batches` table: id, user_id, credits_remaining, purchased_at, expires_at
- [ ] Deduct from oldest batches first (FIFO)
- [ ] Create function to check and expire old credits
- [ ] Log expiry transactions with type 'expiry'
- [ ] Notify users 30 days before credits expire (placeholder for notifications)
- [ ] Typecheck passes

### US-004: Configure Stripe integration
**Description:** As a developer, I need Stripe configured for payment processing.

**Acceptance Criteria:**
- [ ] Add Stripe SDK: npm install stripe @stripe/stripe-js
- [ ] Create /lib/stripe/client.ts with server-side Stripe client
- [ ] Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY to .env.example
- [ ] Create Stripe products and prices for each credit package
- [ ] Store stripe_price_id in credit_packages table
- [ ] Document Stripe setup in SETUP.md
- [ ] Typecheck passes

### US-005: Create Stripe checkout session endpoint
**Description:** As a developer, I need an API to create Stripe checkout sessions.

**Acceptance Criteria:**
- [ ] Create /app/api/payments/create-checkout/route.ts
- [ ] Accept package_id in request body
- [ ] Create Stripe checkout session with correct price
- [ ] Enable Apple Pay and Google Pay in payment methods
- [ ] Set success_url and cancel_url
- [ ] Include user_id in metadata for webhook processing
- [ ] Return session URL for redirect
- [ ] Typecheck passes

### US-006: Create Stripe webhook handler
**Description:** As a developer, I need to handle Stripe webhooks for successful payments.

**Acceptance Criteria:**
- [ ] Create /app/api/webhooks/stripe/route.ts
- [ ] Verify webhook signature using STRIPE_WEBHOOK_SECRET
- [ ] Handle checkout.session.completed event
- [ ] Extract user_id and package from metadata
- [ ] Add credits to user account via credit-service
- [ ] Create credit_batches record with 12-month expiry
- [ ] Handle payment_intent.payment_failed for retry logic
- [ ] Typecheck passes

### US-007: Implement payment retry logic
**Description:** As a developer, I need failed payments to auto-retry before notifying user.

**Acceptance Criteria:**
- [ ] Create `payment_retries` table: id, user_id, stripe_payment_intent_id, attempts, last_attempt_at, status, created_at
- [ ] On payment failure, schedule retry: 1 hour, 6 hours, 24 hours
- [ ] After 3 failures, mark as 'failed' and trigger user notification
- [ ] Create /lib/services/payment-retry-service.ts
- [ ] Placeholder for notification (email implementation later)
- [ ] Typecheck passes

### US-008: Create buy credits UI
**Description:** As a user, I want to purchase credits through a simple interface.

**Acceptance Criteria:**
- [ ] Create /app/credits/page.tsx
- [ ] Display all active credit packages with prices
- [ ] Show current balance prominently
- [ ] Highlight best value / most popular package
- [ ] "Buy" button redirects to Stripe checkout
- [ ] Handle success/cancel redirects
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Create credit balance display component
**Description:** As a user, I want to see my credit balance in the UI.

**Acceptance Criteria:**
- [ ] Create /app/components/CreditBalance.tsx
- [ ] Fetch and display current balance
- [ ] Show in user menu dropdown
- [ ] Link to buy more credits when low
- [ ] Show warning when balance is 0
- [ ] Update in real-time after purchase or usage
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Integrate credit check into brief generation
**Description:** As a system, I need to verify credits before generating a brief.

**Acceptance Criteria:**
- [ ] Check credit balance before starting generation in langgraph-orchestrator
- [ ] If insufficient credits, return error with "Buy credits" link
- [ ] Deduct 1 credit when generation starts
- [ ] If generation fails (quality gate < 6.0), refund credit via credit-service
- [ ] Log all deductions and refunds
- [ ] Typecheck passes

### US-011: Create purchase success page
**Description:** As a user, I want confirmation when my credit purchase succeeds.

**Acceptance Criteria:**
- [ ] Create /app/credits/success/page.tsx
- [ ] Show "Thank you for your purchase" message
- [ ] Display credits added and new balance
- [ ] Show expiry date (12 months from now)
- [ ] "Generate a brief" call-to-action button
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Create transaction history page
**Description:** As a user, I want to see my credit transaction history.

**Acceptance Criteria:**
- [ ] Create /app/credits/history/page.tsx
- [ ] List all transactions: purchases, usage, refunds, expiries
- [ ] Show date, type, amount, description
- [ ] Link usage transactions to generated briefs
- [ ] Paginate if more than 20 transactions
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Add low balance warning
**Description:** As a user, I want to be warned when my credits are running low.

**Acceptance Criteria:**
- [ ] Show warning banner when balance <= 2 credits
- [ ] Warning appears on brief generation page
- [ ] "Top up now" button links to credits page
- [ ] Warning dismissible for current session
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-014: Handle Stripe Apple Pay / Google Pay
**Description:** As a user, I want to pay quickly with Apple Pay or Google Pay.

**Acceptance Criteria:**
- [ ] Enable Apple Pay in Stripe checkout session config
- [ ] Enable Google Pay in Stripe checkout session config
- [ ] Test on mobile browsers for proper display
- [ ] Fallback to card entry if wallet not available
- [ ] Document wallet testing in test checklist
- [ ] Typecheck passes

### US-015: Create admin pricing configuration
**Description:** As an admin, I need to update credit package prices without code changes.

**Acceptance Criteria:**
- [ ] Credit packages stored in database, not hardcoded
- [ ] Active flag to enable/disable packages
- [ ] Sync prices with Stripe via API or manual update
- [ ] Document process for updating prices
- [ ] Typecheck passes

### US-016: Test payment flows
**Description:** As a developer, I need to validate all payment flows work correctly.

**Acceptance Criteria:**
- [ ] Create test-payments.ts with manual testing checklist
- [ ] Test successful purchase flow with Stripe test mode
- [ ] Test failed payment and retry logic
- [ ] Test credit deduction on brief generation
- [ ] Test credit refund on failed brief
- [ ] Test credit expiry logic
- [ ] Document test card numbers for Stripe testing
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Users must purchase credits to generate briefs
- FR-2: Credits must be priced at cost + margin (target 20%)
- FR-3: Bulk discount packages must be available
- FR-4: Credits must expire 12 months after purchase (FIFO deduction)
- FR-5: Payment must be processed via Stripe with Apple Pay/Google Pay
- FR-6: Failed payments must auto-retry 3 times over 24 hours
- FR-7: Credit balance must be visible throughout the app
- FR-8: Refunds must be issued for failed brief generation

## Non-Goals

- No subscription model (credits only for MVP)
- No PayPal integration
- No crypto payments
- No manual invoicing
- No partial refunds (full credit refund only)
- No gifting credits to other users

## Technical Considerations

- Use Stripe Checkout for payment flow (not Elements)
- Webhook signature verification required for security
- Store Stripe customer_id in user profile for future purchases
- Credit operations must be atomic (use database transactions)
- Consider rate limiting on purchase API to prevent abuse
- Test mode vs live mode switching via environment variable

## Security Considerations

- Never log or expose Stripe secret key
- Verify webhook signatures to prevent fake events
- Validate package_id server-side before creating checkout
- Rate limit purchase attempts per user
- Audit log all credit transactions

## Success Metrics

- Payment success rate: ≥95%
- Average credits per user: ≥5
- Credit usage rate: ≥80% of purchased credits used before expiry
- Retry recovery rate: ≥50% of failed payments recovered

## Open Questions

- Should we offer a first-time discount (e.g., first 3 credits free)?
- Should we show credit cost breakdown per brief?
- Should enterprise users get invoicing option?
