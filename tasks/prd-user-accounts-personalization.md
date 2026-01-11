# PRD: User Accounts & Personalization (Epic 5.1)

## Introduction

User Accounts & Personalization enables users to create accounts, manage their profiles, set preferences, and receive a personalized experience. This epic builds on existing database schema (profiles, saved_briefs, reading_history) to add auth flows, profile management, settings, and personalization features.

**Problem:** Users can't create accounts, persist preferences, or get personalized content. Components reference `/auth/signin` but no auth pages exist.

**Solution:** Implement magic link + social login (Google/Apple), profile management, settings with GDPR compliance, and personalization based on reading level and topic interests.

## Goals

- Enable user registration via magic link email or Google/Apple OAuth
- Provide profile page with avatar, bio, and preferences
- Create settings page with account management and GDPR data export
- Persist preferred reading level across sessions and devices
- Allow users to set topic interests for personalized suggestions
- Support notification preferences for email digests

## User Stories

### US-001: Update profiles schema with preferences

**Description:** As a developer, I need to extend the profiles table with preference fields.

**Acceptance Criteria:**
- [ ] Add columns to profiles table in schema.sql:
  - preferred_reading_level TEXT ('simple' | 'standard' | 'advanced') DEFAULT 'standard'
  - topic_interests TEXT[] (array of category strings)
  - location TEXT
  - notification_email_digest BOOLEAN DEFAULT false
  - notification_new_features BOOLEAN DEFAULT true
- [ ] Add TypeScript types to Database interface
- [ ] Typecheck passes

---

### US-002: Create sign-in page with magic link

**Description:** As a visitor, I want to sign in with my email via magic link.

**Acceptance Criteria:**
- [ ] Create /app/auth/signin/page.tsx
- [ ] Email input field with validation
- [ ] "Send magic link" button
- [ ] Call Supabase auth.signInWithOtp({ email })
- [ ] Show success message: "Check your email for the login link"
- [ ] Show error message if email invalid or rate limited
- [ ] Link to sign up if new user
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Create sign-up page

**Description:** As a visitor, I want to create an account.

**Acceptance Criteria:**
- [ ] Create /app/auth/signup/page.tsx
- [ ] Fields: Email (required), Full Name (optional)
- [ ] "Create account" button sends magic link
- [ ] Call Supabase auth.signInWithOtp({ email, options: { data: { full_name } } })
- [ ] Show success message: "Check your email to confirm your account"
- [ ] Link to sign in if existing user
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Add Google OAuth sign-in

**Description:** As a visitor, I want to sign in with my Google account.

**Acceptance Criteria:**
- [ ] Add "Continue with Google" button to sign-in page
- [ ] Call Supabase auth.signInWithOAuth({ provider: 'google' })
- [ ] Configure redirect URL to /auth/callback
- [ ] Document Google OAuth setup in SETUP.md (client ID, secret)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Add Apple OAuth sign-in

**Description:** As a visitor, I want to sign in with my Apple account.

**Acceptance Criteria:**
- [ ] Add "Continue with Apple" button to sign-in page
- [ ] Call Supabase auth.signInWithOAuth({ provider: 'apple' })
- [ ] Configure redirect URL to /auth/callback
- [ ] Document Apple OAuth setup in SETUP.md
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Create auth callback handler

**Description:** As a developer, I need to handle OAuth and magic link callbacks.

**Acceptance Criteria:**
- [ ] Create /app/auth/callback/route.ts
- [ ] Exchange auth code for session using Supabase
- [ ] Create profile record if new user (on first login)
- [ ] Redirect to homepage on success
- [ ] Redirect to /auth/error on failure
- [ ] Typecheck passes

---

### US-007: Create auth error page

**Description:** As a user, I want to see a clear error if authentication fails.

**Acceptance Criteria:**
- [ ] Create /app/auth/error/page.tsx
- [ ] Display friendly error message
- [ ] Show "Try again" button linking to sign-in
- [ ] Show "Contact support" link
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Add sign-out functionality

**Description:** As a user, I want to sign out of my account.

**Acceptance Criteria:**
- [ ] Create /app/api/auth/signout/route.ts
- [ ] Call Supabase auth.signOut()
- [ ] Clear any client-side auth state
- [ ] Redirect to homepage
- [ ] Typecheck passes

---

### US-009: Create user menu component

**Description:** As a user, I want to access my account from the header.

**Acceptance Criteria:**
- [ ] Create /app/components/UserMenu.tsx
- [ ] Show "Sign in" button if not authenticated
- [ ] Show avatar + dropdown if authenticated
- [ ] Dropdown options: Profile, Settings, Sign out
- [ ] Use Supabase auth state listener for real-time updates
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Integrate UserMenu into layout

**Description:** As a user, I want to see the user menu on all pages.

**Acceptance Criteria:**
- [ ] Add UserMenu to app/layout.tsx header
- [ ] Position in top-right corner
- [ ] Responsive: icon-only on mobile, avatar+name on desktop
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Create profile page

**Description:** As a user, I want to view and edit my profile.

**Acceptance Criteria:**
- [ ] Create /app/profile/page.tsx (protected route)
- [ ] Display: avatar, full name, username, bio, location, member since
- [ ] Display stats: briefs generated, briefs saved, feedback submitted
- [ ] Show "Edit profile" button
- [ ] Link to reading history and saved briefs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Create profile edit modal/page

**Description:** As a user, I want to update my profile information.

**Acceptance Criteria:**
- [ ] Create /app/profile/edit/page.tsx or modal component
- [ ] Editable fields: Full name, Username, Bio (280 char limit), Location
- [ ] Avatar upload with preview (store in Supabase Storage)
- [ ] Save button calls profile update API
- [ ] Show success toast on save
- [ ] Validate username uniqueness
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Create profile update API

**Description:** As a developer, I need an API to update user profiles.

**Acceptance Criteria:**
- [ ] Create /app/api/profile/route.ts
- [ ] GET: Return current user's profile
- [ ] PATCH: Update profile fields
- [ ] Validate username format (3-20 chars, alphanumeric + underscore)
- [ ] Check username uniqueness before update
- [ ] Handle avatar URL update
- [ ] Typecheck passes

---

### US-014: Create avatar upload API

**Description:** As a developer, I need an API to handle avatar uploads.

**Acceptance Criteria:**
- [ ] Create /app/api/profile/avatar/route.ts
- [ ] POST: Accept image file upload
- [ ] Validate file type (jpg, png, gif, webp) and size (<2MB)
- [ ] Upload to Supabase Storage bucket 'avatars'
- [ ] Return public URL
- [ ] Delete old avatar if exists
- [ ] Typecheck passes

---

### US-015: Create settings page

**Description:** As a user, I want to manage my account settings.

**Acceptance Criteria:**
- [ ] Create /app/settings/page.tsx (protected route)
- [ ] Sections: Preferences, Notifications, Connected Accounts, Data & Privacy
- [ ] Each section collapsible or tabbed
- [ ] Link to delete account page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-016: Add reading preferences section

**Description:** As a user, I want to set my default reading level.

**Acceptance Criteria:**
- [ ] Add to settings page: Preferred Reading Level dropdown
- [ ] Options: Simple, Standard, Advanced
- [ ] Save immediately on change (auto-save)
- [ ] This preference used as default on brief pages
- [ ] Show success indicator on save
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-017: Add topic interests section

**Description:** As a user, I want to select topics I'm interested in.

**Acceptance Criteria:**
- [ ] Add to settings page: Topic Interests multi-select
- [ ] Show all 10 categories as toggleable chips/checkboxes
- [ ] Save on change (debounced)
- [ ] Interests stored in profiles.topic_interests array
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-018: Add notification preferences section

**Description:** As a user, I want to control email notifications.

**Acceptance Criteria:**
- [ ] Add to settings page: Notification toggles
- [ ] Options: Weekly digest of new briefs, New feature announcements
- [ ] Save on toggle change
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-019: Add connected accounts section

**Description:** As a user, I want to see which accounts are connected.

**Acceptance Criteria:**
- [ ] Add to settings page: Connected Accounts section
- [ ] Show connected providers (Google, Apple) with "Connected" badge
- [ ] Show "Connect" button for unconnected providers
- [ ] Note: Disconnect functionality is complex, show "Contact support to disconnect" for MVP
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-020: Create GDPR data export

**Description:** As a user, I want to download all my data.

**Acceptance Criteria:**
- [ ] Add "Export my data" button to settings Data & Privacy section
- [ ] Create /app/api/profile/export/route.ts
- [ ] Compile: profile, saved briefs, reading history, feedback, generated briefs
- [ ] Return as JSON file download
- [ ] Show loading state during compilation
- [ ] Typecheck passes

---

### US-021: Implement delete account flow

**Description:** As a user, I want to permanently delete my account.

**Acceptance Criteria:**
- [ ] Create /app/settings/delete-account/page.tsx
- [ ] Show warning about permanent deletion
- [ ] Require typing "DELETE" to confirm
- [ ] Create /app/api/profile/delete/route.ts
- [ ] Delete all user data (cascade via RLS)
- [ ] Sign out user after deletion
- [ ] Redirect to /auth/deleted-account confirmation page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-022: Apply preferred reading level to brief pages

**Description:** As a user, I want my preferred reading level applied automatically.

**Acceptance Criteria:**
- [ ] On brief page load, check user's preferred_reading_level from profile
- [ ] Use as default if no URL param specified
- [ ] Fall back to 'standard' if not authenticated
- [ ] localStorage still works as fallback for anonymous users
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-023: Show personalized topic suggestions on homepage

**Description:** As a user, I want to see topics I'm interested in highlighted.

**Acceptance Criteria:**
- [ ] On homepage, fetch user's topic_interests from profile
- [ ] Highlight interested topics in TopicCategoriesGrid (e.g., border accent)
- [ ] Show "Based on your interests" section with relevant example questions
- [ ] Fall back to featured questions for anonymous users
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-024: Create saved briefs page

**Description:** As a user, I want to view all briefs I've saved.

**Acceptance Criteria:**
- [ ] Create /app/profile/saved/page.tsx (protected route)
- [ ] Fetch from saved_briefs table joined with briefs
- [ ] Display as cards: question, clarity score, saved date
- [ ] Link each card to /brief/[id]
- [ ] Show empty state if no saved briefs
- [ ] Pagination if >20 items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-025: Create reading history page

**Description:** As a user, I want to see briefs I've read.

**Acceptance Criteria:**
- [ ] Create /app/profile/history/page.tsx (protected route)
- [ ] Fetch from reading_history table joined with briefs
- [ ] Display: question, clarity score, last viewed, scroll depth %
- [ ] Order by last_viewed_at DESC
- [ ] Link each item to /brief/[id]
- [ ] Pagination if >20 items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Support magic link email authentication
- FR-2: Support Google and Apple OAuth
- FR-3: Create profile on first login
- FR-4: Allow profile editing (name, bio, avatar, location)
- FR-5: Store and apply preferred reading level
- FR-6: Store topic interests for personalization
- FR-7: Provide GDPR-compliant data export
- FR-8: Support full account deletion
- FR-9: Show personalized content based on interests
- FR-10: Display user menu in header on all pages

## Non-Goals

- Password-based authentication (magic link only for MVP)
- Two-factor authentication (post-MVP)
- Account linking/unlinking OAuth providers (contact support for MVP)
- Email verification separate from magic link
- Profile privacy settings (all profiles public for MVP)
- Social features (following users, etc.)

## Design Considerations

**Auth Pages:**
- Clean, centered card layout
- Social buttons prominent (Google/Apple)
- Divider with "or continue with email"
- Magic link input below

**Profile Page:**
- Hero section with avatar, name, stats
- Tabs or sections for: Overview, Saved Briefs, History, Feedback

**Settings Page:**
- Left sidebar navigation on desktop
- Collapsible sections on mobile
- Auto-save with subtle confirmation

**UserMenu:**
- Avatar circle (32px)
- Dropdown with profile pic, name, links
- Smooth animations

## Technical Considerations

**Supabase Auth Setup:**
- Enable Email provider with magic link
- Enable Google OAuth (requires Google Cloud Console setup)
- Enable Apple OAuth (requires Apple Developer setup)
- Set redirect URLs in Supabase dashboard

**Avatar Storage:**
- Bucket: 'avatars'
- Path: `{user_id}/avatar.{ext}`
- Public access with cache headers

**Profile Creation Trigger:**
- Can use Supabase trigger on auth.users insert
- Or create profile in callback handler

**Session Handling:**
- Use Supabase auth helpers for Next.js
- Server-side session via cookies
- Client-side auth state listener

## Success Metrics

- 50% of visitors create an account
- 70% of registered users set a preferred reading level
- 30% of registered users set topic interests
- <1% account deletion rate
- Auth flow completion rate >90%

## Open Questions

1. Should we require email verification before allowing brief generation?
2. Should profile usernames be shown publicly or keep users semi-anonymous?
3. Do we need session management (view active sessions, log out everywhere)?
