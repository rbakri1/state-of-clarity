# PRD: Security Hardening & GDPR Compliance (Epic 4.5)

## Introduction

Prepare State of Clarity for MVP launch with essential security hardening and GDPR compliance. This epic focuses on legal requirements (cookie consent, privacy policy), security best practices (headers, input validation), and verifying existing data rights features work correctly.

## Goals

- Provide legally-required cookie consent and privacy documentation
- Add security headers to prevent common web attacks
- Validate all API inputs with Zod schemas
- Verify existing GDPR features (data export, account deletion) work completely
- Ensure no secrets are exposed in codebase
- Document compliance approach for future reference

## User Stories

### US-001: Create privacy policy page
**Description:** As a user, I want to read the privacy policy so I understand how my data is handled.

**Acceptance Criteria:**
- [ ] Create /app/privacy/page.tsx
- [ ] Include sections: What data we collect, How we use it, Third parties (Supabase, Stripe, Vercel), User rights (export, delete), Contact info
- [ ] Use simple, readable language (not legalese)
- [ ] Link to privacy policy from footer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Create terms of service page
**Description:** As a user, I want to read the terms of service so I understand the rules of using the platform.

**Acceptance Criteria:**
- [ ] Create /app/terms/page.tsx
- [ ] Include sections: Acceptance of terms, User responsibilities, Intellectual property, Limitation of liability, Termination
- [ ] Use simple, readable language
- [ ] Link to terms from footer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Create cookie consent banner component
**Description:** As a user, I want to consent to cookies so the site complies with GDPR/ePrivacy.

**Acceptance Criteria:**
- [ ] Create /components/cookie-consent-banner.tsx
- [ ] Banner appears at bottom of screen for new visitors
- [ ] Shows message explaining cookies used (analytics, functionality)
- [ ] Accept and Decline buttons
- [ ] Link to privacy policy from banner
- [ ] Banner does not block page content
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Persist cookie consent preference
**Description:** As a user, I want my cookie preference saved so I don't see the banner repeatedly.

**Acceptance Criteria:**
- [ ] Store consent in localStorage key 'cookie-consent' with value 'accepted' | 'declined'
- [ ] If consent exists, do not show banner
- [ ] If declined, do not load analytics scripts (if any)
- [ ] Consent persists across sessions
- [ ] Add consent timestamp for audit trail
- [ ] Typecheck passes

---

### US-005: Audit user data export functionality
**Description:** As a developer, I need to verify user data export works completely and includes all user data.

**Acceptance Criteria:**
- [ ] Review existing export endpoint/functionality from Epic 5.1
- [ ] Verify export includes: profile data, briefs created, preferences, activity history
- [ ] Test export with a real user account
- [ ] Export format is JSON (machine-readable)
- [ ] Document what data is included in /docs/GDPR.md
- [ ] Typecheck passes

---

### US-006: Audit account deletion functionality
**Description:** As a developer, I need to verify account deletion completely removes user data.

**Acceptance Criteria:**
- [ ] Review existing delete endpoint/functionality from Epic 5.1
- [ ] Verify deletion removes: auth record, profile, preferences, activity
- [ ] Briefs should be ANONYMIZED (not deleted) - set user_id to null, keep content
- [ ] Verify deletion cascades properly in database
- [ ] Test deletion with a test user account
- [ ] Add confirmation step before deletion if not present
- [ ] Document deletion process in /docs/GDPR.md
- [ ] Typecheck passes

---

### US-007: Add security headers
**Description:** As a developer, I need security headers to prevent common web attacks.

**Acceptance Criteria:**
- [ ] Update next.config.mjs to add security headers
- [ ] Add X-Frame-Options: DENY (prevent clickjacking)
- [ ] Add X-Content-Type-Options: nosniff (prevent MIME sniffing)
- [ ] Add X-XSS-Protection: 1; mode=block
- [ ] Add Referrer-Policy: strict-origin-when-cross-origin
- [ ] Add Permissions-Policy to disable unused features (camera, microphone, geolocation)
- [ ] Verify headers appear in browser DevTools Network tab
- [ ] Typecheck passes

---

### US-008: Create Zod schemas for brief API
**Description:** As a developer, I need input validation schemas to prevent bad data.

**Acceptance Criteria:**
- [ ] Create /lib/validation/brief-schemas.ts
- [ ] Schema for brief creation request body
- [ ] Schema for brief update request body
- [ ] Schema for brief query params (id validation)
- [ ] Export typed inferred types from schemas
- [ ] Typecheck passes

---

### US-009: Apply Zod validation to brief API endpoints
**Description:** As a developer, I need API endpoints to validate input and return clear errors.

**Acceptance Criteria:**
- [ ] Update /app/api/briefs/[id]/route.ts to validate id param
- [ ] Update any POST/PUT brief endpoints to validate request body
- [ ] Return 400 Bad Request with clear error message on validation failure
- [ ] Use Zod's safeParse for non-throwing validation
- [ ] Typecheck passes

---

### US-010: Apply Zod validation to admin endpoints
**Description:** As a developer, I need admin endpoints to validate input strictly.

**Acceptance Criteria:**
- [ ] Create /lib/validation/admin-schemas.ts
- [ ] Add schema for cache-flush endpoint body
- [ ] Update /app/api/admin/cache-flush/route.ts to validate body
- [ ] Return 400 with error details on validation failure
- [ ] Typecheck passes

---

### US-011: Audit secrets and environment variables
**Description:** As a developer, I need to ensure no secrets are exposed in code.

**Acceptance Criteria:**
- [ ] Search codebase for hardcoded API keys, tokens, passwords
- [ ] Verify all secrets are in .env and not committed
- [ ] Verify .env is in .gitignore
- [ ] Update .env.example with all required env vars (no actual values)
- [ ] Document required environment variables in README or SETUP.md
- [ ] Typecheck passes

---

### US-012: Create GDPR documentation
**Description:** As a developer, I need documentation explaining our GDPR compliance approach.

**Acceptance Criteria:**
- [ ] Create /docs/GDPR.md
- [ ] Document what personal data we collect and why
- [ ] Document data retention policy
- [ ] Document how to handle data export requests
- [ ] Document how to handle deletion requests
- [ ] Document third-party data processors (Supabase, Stripe, Vercel)
- [ ] Typecheck passes

---

## Functional Requirements

- FR-1: Privacy policy page accessible at /privacy with footer link
- FR-2: Terms of service page accessible at /terms with footer link
- FR-3: Cookie consent banner displayed to users without stored preference
- FR-4: Cookie preference persisted in localStorage with timestamp
- FR-5: User data export includes all personal data in JSON format
- FR-6: Account deletion removes or anonymizes all user data
- FR-7: Security headers applied to all responses via Next.js config
- FR-8: All API endpoints validate input using Zod schemas
- FR-9: Invalid API input returns 400 with descriptive error message
- FR-10: All secrets stored in environment variables, not in code

## Non-Goals

- Rate limiting improvements (current in-memory solution sufficient for MVP)
- Content Security Policy (CSP) implementation
- Encryption of data at rest (Supabase handles this)
- Full GDPR compliance audit (processing records, DPO appointment)
- Cookie preference granularity (accept all / reject all is sufficient)
- CCPA/other privacy regulation compliance

## Technical Considerations

- Zod is already likely installed; if not, add it
- Security headers configured in next.config.mjs `headers()` function
- Cookie consent state in localStorage (no backend needed)
- Existing GDPR features from Epic 5.1 may need fixes if incomplete
- Third-party processors: Supabase (database/auth), Stripe (payments), Vercel (hosting), Sentry (errors)

## Success Metrics

- Privacy policy and terms pages load correctly
- Cookie banner appears for new users, not for returning users with preference
- All API endpoints return 400 for malformed input (not 500)
- Security headers visible in browser DevTools
- Data export contains all expected user data
- Account deletion removes user from database completely
- No secrets found in git history or codebase

### US-013: Add age verification to signup
**Description:** As a platform, I need to verify users are 13+ to comply with COPPA/GDPR-K.

**Acceptance Criteria:**
- [ ] Add checkbox to signup form: 'I confirm I am 13 years of age or older'
- [ ] Checkbox must be checked to proceed with signup
- [ ] Store age_verified: true in user profile/metadata
- [ ] Block signup if checkbox not checked with clear error message
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Open Questions

None — all resolved:
- ✅ Briefs anonymized (not deleted) on account deletion
- ✅ Age verification (13+) added to signup
- ✅ "Manage cookies" link skipped (not legally required)
