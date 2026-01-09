# PRD: User Accounts & Personalization

## Introduction

Implement a full user account system that supports multiple authentication methods, stores personalization data for learning about users, and enforces a soft paywall for content access. Users can post and comment anonymously while still being trackable for payment purposes. Accounts use soft delete with 30-day recovery.

This is a critical prerequisite for the monetization system (Theme 6).

## Goals

- Support multiple auth methods: email/password, magic link, Google, X/Twitter, Apple
- Store full personalization data: reading level preference, topics, history
- Allow anonymous posting/commenting while tracking user identity
- Implement soft paywall: 20% preview, 3 free briefs, then account required
- Soft delete accounts with 30-day recovery window
- GDPR-compliant data handling

## User Stories

### US-001: Configure Supabase auth providers
**Description:** As a developer, I need to configure all authentication providers in Supabase.

**Acceptance Criteria:**
- [ ] Enable email/password authentication in Supabase dashboard
- [ ] Enable magic link (passwordless) authentication
- [ ] Configure Google OAuth provider with credentials
- [ ] Configure Apple OAuth provider with credentials
- [ ] Configure X/Twitter OAuth provider with credentials
- [ ] Document provider setup in SETUP.md
- [ ] Typecheck passes

### US-002: Create auth UI components
**Description:** As a user, I want a clean login/signup interface with multiple auth options.

**Acceptance Criteria:**
- [ ] Create /app/components/auth/AuthModal.tsx
- [ ] Display email input with "Continue with email" button
- [ ] Show social login buttons: Google, Apple, X
- [ ] Toggle between sign up and sign in modes
- [ ] Handle loading and error states
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Implement email/password authentication
**Description:** As a user, I want to sign up and log in with email and password.

**Acceptance Criteria:**
- [ ] Create /app/components/auth/EmailPasswordForm.tsx
- [ ] Validate email format and password strength (min 8 chars)
- [ ] Handle sign up flow with email confirmation
- [ ] Handle sign in flow with error messages
- [ ] Show "Forgot password" link
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Implement magic link authentication
**Description:** As a user, I want to log in without a password using a magic link.

**Acceptance Criteria:**
- [ ] Add "Send magic link" option after email entry
- [ ] Send magic link email via Supabase
- [ ] Handle magic link callback and session creation
- [ ] Show "Check your email" confirmation message
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Implement social login flows
**Description:** As a user, I want to log in with Google, Apple, or X.

**Acceptance Criteria:**
- [ ] Create /app/components/auth/SocialLoginButtons.tsx
- [ ] Implement Google OAuth flow
- [ ] Implement Apple OAuth flow
- [ ] Implement X/Twitter OAuth flow
- [ ] Handle OAuth callbacks and session creation
- [ ] Create or update user profile on first social login
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Extend user profiles table
**Description:** As a developer, I need to store full personalization data for users.

**Acceptance Criteria:**
- [ ] Add columns to profiles table: display_name, avatar_url, preferred_reading_level, topics_of_interest (JSONB), notification_preferences (JSONB), anonymous_posting (boolean), created_at, updated_at
- [ ] Add reading_history table: id, user_id, brief_id, reading_level_viewed, read_at, time_spent_seconds
- [ ] Add question_history table: id, user_id, question, brief_id, asked_at
- [ ] Create migration /lib/supabase/migrations/007_extend_user_profiles.sql
- [ ] Update Database interface in client.ts
- [ ] Typecheck passes

### US-007: Create user profile settings page
**Description:** As a user, I want to manage my profile and preferences.

**Acceptance Criteria:**
- [ ] Create /app/settings/page.tsx
- [ ] Display and edit: display name, avatar
- [ ] Select preferred reading level (child/teen/undergrad/postdoc)
- [ ] Select topics of interest (multi-select from domains)
- [ ] Toggle anonymous posting preference
- [ ] Toggle notification preferences
- [ ] Save changes to database
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Implement anonymous posting mode
**Description:** As a user, I want to post comments/feedback anonymously while still being tracked for payment.

**Acceptance Criteria:**
- [ ] Add anonymous_posting boolean to user preferences
- [ ] When enabled, display "Anonymous User" instead of name on public posts
- [ ] Still store user_id in database for tracking
- [ ] Show toggle in profile settings
- [ ] Apply to feedback submissions and future comments
- [ ] Typecheck passes

### US-009: Implement brief preview for anonymous users
**Description:** As an anonymous visitor, I want to preview the first 20% of a brief before signing up.

**Acceptance Criteria:**
- [ ] Create /app/components/BriefPreview.tsx
- [ ] Show first 20% of narrative content
- [ ] Blur/fade remaining content with gradient overlay
- [ ] Show "Sign up to read full brief" call-to-action
- [ ] Track preview views in localStorage
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Implement soft paywall after 3 briefs
**Description:** As a system, I need to enforce account creation after 3 brief previews.

**Acceptance Criteria:**
- [ ] Track brief preview count in localStorage
- [ ] Allow 3 full brief reads for anonymous users
- [ ] On 4th brief, show only 20% preview with signup wall
- [ ] Clear preview count on successful signup
- [ ] Show remaining free briefs count to user
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Create saved briefs functionality
**Description:** As a user, I want to save briefs to read later.

**Acceptance Criteria:**
- [ ] Add save/bookmark button to brief view
- [ ] Store in saved_briefs table (already exists in schema)
- [ ] Create /app/saved/page.tsx to list saved briefs
- [ ] Show saved count in user menu
- [ ] Allow removing briefs from saved list
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-012: Track reading history
**Description:** As a system, I need to track what users read for personalization.

**Acceptance Criteria:**
- [ ] Log brief view to reading_history when user opens full brief
- [ ] Track which reading level they viewed
- [ ] Track time spent (approximate, via page visibility API)
- [ ] Create /app/history/page.tsx to show reading history
- [ ] Use history for future recommendations
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-013: Track question history
**Description:** As a system, I need to track questions users ask.

**Acceptance Criteria:**
- [ ] Log question to question_history when user generates a brief
- [ ] Link to resulting brief_id if generation succeeds
- [ ] Show recent questions on user dashboard
- [ ] Allow re-asking previous questions
- [ ] Typecheck passes

### US-014: Implement soft delete for accounts
**Description:** As a user, I want to delete my account with a 30-day recovery window.

**Acceptance Criteria:**
- [ ] Add deleted_at and deletion_scheduled_at columns to profiles
- [ ] Create /app/settings/delete-account/page.tsx
- [ ] Show warning about 30-day recovery period
- [ ] Set deletion_scheduled_at to now + 30 days on delete request
- [ ] Disable account access but keep data
- [ ] Allow recovery via "Restore account" if logging in within 30 days
- [ ] Background job to permanently delete after 30 days
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-015: Create account recovery flow
**Description:** As a user who deleted my account, I want to recover it within 30 days.

**Acceptance Criteria:**
- [ ] Detect deleted account on login attempt
- [ ] Show "Your account is scheduled for deletion" message
- [ ] Provide "Restore my account" button
- [ ] Clear deletion_scheduled_at on restore
- [ ] Re-enable full account access
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-016: Add user menu to navigation
**Description:** As a user, I want easy access to my account from the navigation.

**Acceptance Criteria:**
- [ ] Create /app/components/UserMenu.tsx
- [ ] Show avatar and name when logged in
- [ ] Dropdown with: Settings, Saved Briefs, History, Sign Out
- [ ] Show "Sign In" button when logged out
- [ ] Show credit balance (placeholder for Theme 6)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-017: Test authentication flows
**Description:** As a developer, I need to validate all auth flows work correctly.

**Acceptance Criteria:**
- [ ] Create test-auth.ts script for manual testing checklist
- [ ] Test email/password signup and login
- [ ] Test magic link flow
- [ ] Test social login flows (Google, Apple, X)
- [ ] Test profile update
- [ ] Test account deletion and recovery
- [ ] Document any issues found
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Users must be able to authenticate via email/password, magic link, or social OAuth
- FR-2: User profiles must store full personalization data
- FR-3: Users must be able to post anonymously while being tracked for payment
- FR-4: Anonymous users see 20% preview, get 3 free briefs, then require account
- FR-5: Account deletion must use soft delete with 30-day recovery
- FR-6: Reading and question history must be tracked for personalization
- FR-7: Users must be able to save briefs for later

## Non-Goals

- No two-factor authentication (can add later)
- No admin user management UI
- No account linking (multiple auth methods per account)
- No password requirements beyond minimum length
- No session management UI (revoke sessions)

## Technical Considerations

- Use Supabase Auth for all authentication
- OAuth credentials stored in Supabase dashboard (not in code)
- Reading history uses Page Visibility API for time tracking
- LocalStorage for anonymous preview count (cleared on signup)
- Soft delete uses scheduled background job for permanent deletion
- RLS policies ensure users only see their own data

## Success Metrics

- Sign-up conversion: ≥20% of users who hit soft wall sign up
- Auth success rate: ≥95% of auth attempts succeed
- Profile completion: ≥50% of users set reading level preference
- Account recovery: ≥30% of deleted accounts are recovered

## Open Questions

- Should we offer account data export (GDPR)?
- Should topics of interest be free-form or predefined list?
- Should we track brief generation history separately from reading history?
