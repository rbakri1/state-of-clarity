# PRD: Brand & UI/UX Sweep (Epic 4.6)

## Introduction

Comprehensive UI/UX sweep to ensure all user-facing pages match the design system, implement missing components from frontend skills, review all product copy for brand voice consistency, and polish the experience before beta launch.

## Goals

- Audit existing UI against design system (skills/frontend/design)
- Implement all missing components defined in skills/frontend/components
- Ensure brand voice consistency across all copy (skills/frontend/brand)
- Standardize navigation header and footer across all pages
- Polish all user-facing pages: homepage, brief viewer, ask anything, auth, profile
- Achieve WCAG AAA accessibility for reading content
- Responsive design verified at mobile, tablet, desktop breakpoints

## User Stories

### Phase 1: Audit & Foundation

#### US-001: Audit existing UI against design system
**Description:** As a developer, I need to identify all UI inconsistencies with the design system defined in skills/frontend/design.

**Acceptance Criteria:**
- [ ] Review all pages and components against design/SKILL.md
- [ ] Check color usage matches Clarity Blue (#0F52BA), Slate palette
- [ ] Check typography matches Inter font, correct sizes per reading level
- [ ] Check spacing follows 4px grid
- [ ] Check shadows, border-radius match spec
- [ ] Check interaction states (hover, focus, active, disabled) are implemented
- [ ] Document all inconsistencies in /docs/UI-AUDIT.md
- [ ] Typecheck passes

---

#### US-002: Audit existing components against component skill
**Description:** As a developer, I need to identify which components from skills/frontend/components are missing or incomplete.

**Acceptance Criteria:**
- [ ] Review components/SKILL.md for required components
- [ ] Check if ReadingLevelSelector exists and matches spec
- [ ] Check if SummaryCard exists with proper typography per level
- [ ] Check if SourceCitation exists with political lean colors
- [ ] Check if PoliticalLeanBadge exists
- [ ] Check if CredibilityBadge exists
- [ ] Check if BriefGenerationProgress exists
- [ ] Document missing/incomplete components in /docs/UI-AUDIT.md
- [ ] Typecheck passes

---

#### US-003: Configure Tailwind with design tokens
**Description:** As a developer, I need Tailwind config to match our design system exactly.

**Acceptance Criteria:**
- [ ] Update tailwind.config.ts with clarity color palette (500, 600, 700)
- [ ] Add Inter and JetBrains Mono font families
- [ ] Add max-w-prose: 65ch for optimal reading width
- [ ] Install @tailwindcss/typography and @tailwindcss/forms plugins
- [ ] Verify design tokens match skills/frontend/design/SKILL.md
- [ ] Typecheck passes

---

### Phase 2: Component Implementation

#### US-004: Implement or fix ReadingLevelSelector component
**Description:** As a user, I want to switch between reading levels with a clear, accessible selector.

**Acceptance Criteria:**
- [ ] Component exists at /components/brief/reading-level-selector.tsx
- [ ] Shows all 4 levels: Child (8-12), Teen (13-17), Undergrad (18-22), Postdoc (Graduate+)
- [ ] Uses ARIA roles (tablist, tab, aria-selected)
- [ ] Sticky positioning (stays visible while reading)
- [ ] Responsive: vertical on mobile, horizontal on desktop
- [ ] Active state uses bg-clarity-500 with white text
- [ ] Focus ring visible for keyboard navigation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-005: Implement or fix SummaryCard component
**Description:** As a user, I want summaries displayed with appropriate typography for my reading level.

**Acceptance Criteria:**
- [ ] Component exists at /components/brief/summary-card.tsx
- [ ] Child level: text-lg (18px), leading-relaxed (1.75)
- [ ] Teen/Undergrad level: text-base (16px), leading-normal (1.5)
- [ ] Postdoc level: text-sm (14px), leading-normal (1.5)
- [ ] Shows reading time with clock icon
- [ ] Uses prose prose-slate for narrative styling
- [ ] ARIA role=tabpanel with hidden attribute for inactive levels
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-006: Implement PoliticalLeanBadge component
**Description:** As a user, I want to see source political lean clearly indicated with non-partisan colors.

**Acceptance Criteria:**
- [ ] Component exists at /components/sources/political-lean-badge.tsx
- [ ] Uses correct colors: Left=#E11D48, Center-Left=#F472B6, Center=#94A3B8, Center-Right=#60A5FA, Right=#3B82F6
- [ ] Displays as pill badge with background color and text
- [ ] Accessible: includes title attribute with full label
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-007: Implement CredibilityBadge component
**Description:** As a user, I want to see source credibility scores with clear visual indicators.

**Acceptance Criteria:**
- [ ] Component exists at /components/sources/credibility-badge.tsx
- [ ] Score 8+: ShieldCheck icon, green, 'Highly Credible'
- [ ] Score 5-7: Shield icon, amber, 'Moderately Credible'
- [ ] Score <5: ShieldAlert icon, rose, 'Lower Credibility'
- [ ] Shows score as X/10
- [ ] Accessible: includes title attribute
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-008: Implement SourceCitation component
**Description:** As a user, I want inline citations colored by political lean for transparency.

**Acceptance Criteria:**
- [ ] Component exists at /components/sources/source-citation.tsx
- [ ] Renders as superscript link [1], [2], etc.
- [ ] Color matches political lean (rose for left, blue for right, etc.)
- [ ] Links to source section anchor
- [ ] Hover shows underline
- [ ] Accessible: aria-label with source title
- [ ] Typecheck passes

---

#### US-009: Implement or fix BriefGenerationProgress component
**Description:** As a user, I want to see clear progress while my brief generates (30-60s).

**Acceptance Criteria:**
- [ ] Component exists at /components/generation/generation-progress.tsx
- [ ] Shows 5 stages: Researching, Extracting, Summaries, Narrative, Scoring
- [ ] Progress bar fills as generation proceeds
- [ ] Current stage highlighted with spinner
- [ ] Completed stages show green checkmark
- [ ] Shows estimated time remaining
- [ ] Smooth animations using transition-all
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 3: Layout Standardization

#### US-010: Standardize navigation header
**Description:** As a user, I want consistent navigation across all pages.

**Acceptance Criteria:**
- [ ] Header component exists at /components/layout/header.tsx
- [ ] Logo links to homepage
- [ ] Navigation links: Ask Anything, About (if exists)
- [ ] Auth state: Show Sign In/Sign Up or user avatar with dropdown
- [ ] Mobile: hamburger menu with slide-out nav
- [ ] Uses sticky positioning
- [ ] Uses Clarity Blue for logo/brand
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-011: Create footer with legal links
**Description:** As a user, I want a footer with links to privacy policy, terms, and contact.

**Acceptance Criteria:**
- [ ] Footer component exists at /components/layout/footer.tsx
- [ ] Links: Privacy Policy (/privacy), Terms of Service (/terms), About (optional)
- [ ] Copyright: © 2026 State of Clarity
- [ ] Social links if applicable
- [ ] Uses slate background, subtle styling
- [ ] Footer appears on all pages via layout.tsx
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4: Page Polish

#### US-012: Polish homepage to match brand
**Description:** As a visitor, I want the homepage to clearly communicate what State of Clarity offers.

**Acceptance Criteria:**
- [ ] Hero section with headline: 'See politics clearly. Decide wisely.'
- [ ] Subheadline explains AI-powered policy briefs
- [ ] Primary CTA: 'Ask Anything' button using bg-clarity-500
- [ ] Showcase briefs section with 3 featured brief cards
- [ ] Brief cards show: question, clarity score badge, topics, read time
- [ ] Responsive layout (mobile-first)
- [ ] Uses design system colors, typography, spacing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-013: Polish brief viewer page
**Description:** As a reader, I want the brief viewer to be clean, readable, and match the design system.

**Acceptance Criteria:**
- [ ] Uses max-w-prose (65ch) for optimal reading width
- [ ] Reading level selector is sticky and accessible
- [ ] Summary adapts typography to selected level
- [ ] Sources section shows all sources with PoliticalLeanBadge and CredibilityBadge
- [ ] Inline citations link to sources section
- [ ] Clarity score badge with expandable breakdown
- [ ] Share and Save buttons visible
- [ ] Uses prose prose-slate for narrative
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-014: Polish Ask Anything page
**Description:** As a user, I want a clean, inviting interface to submit my question.

**Acceptance Criteria:**
- [ ] Clear headline explaining the feature
- [ ] Large text input for question
- [ ] Character count or hint about question length
- [ ] Submit button with loading state
- [ ] Shows generation progress after submission
- [ ] Error handling with clear messages
- [ ] Uses design system colors and spacing
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-015: Polish authentication pages
**Description:** As a user, I want clean, trustworthy sign in/sign up pages.

**Acceptance Criteria:**
- [ ] Sign in page with email/password or magic link option
- [ ] Sign up page with email, password, age verification checkbox
- [ ] Links between sign in and sign up
- [ ] Error states clearly shown
- [ ] Loading states on buttons
- [ ] Uses design system colors, centered layout
- [ ] Links to privacy policy and terms
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

#### US-016: Polish profile/settings page
**Description:** As a user, I want a clean settings page to manage my account.

**Acceptance Criteria:**
- [ ] Profile section: avatar, name, email
- [ ] Preferences: default reading level, notification settings
- [ ] Data section: Export my data button, Delete account button
- [ ] Clear section headings and spacing
- [ ] Uses design system cards and buttons
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Copy Review

#### US-017: Review and update homepage copy
**Description:** As a visitor, I want copy that sounds rigorous but approachable, matching brand voice.

**Acceptance Criteria:**
- [ ] Review all homepage text against brand/SKILL.md voice guidelines
- [ ] Headline uses active voice, leads with evidence
- [ ] Avoid partisan language or dog whistles
- [ ] Explain what we do clearly without jargon
- [ ] CTAs are action-oriented
- [ ] Update any copy that doesn't match brand voice
- [ ] Typecheck passes

---

#### US-018: Review and update brief viewer copy
**Description:** As a reader, I want UI copy that's clear and helpful without being patronizing.

**Acceptance Criteria:**
- [ ] Review all labels, headings, tooltips
- [ ] Reading level labels match spec (Ages 8-12, Ages 13-17, etc.)
- [ ] Source transparency copy is clear
- [ ] Clarity score explanation is understandable
- [ ] Avoid 'unbiased' - use 'transparent' instead
- [ ] Update any copy that doesn't match brand voice
- [ ] Typecheck passes

---

#### US-019: Review and update all other page copy
**Description:** As a user, I want consistent brand voice across all pages.

**Acceptance Criteria:**
- [ ] Review Ask Anything page copy
- [ ] Review auth pages copy
- [ ] Review settings/profile page copy
- [ ] Review error messages and empty states
- [ ] Review loading state messages
- [ ] All copy uses active voice, acknowledges uncertainty where appropriate
- [ ] Typecheck passes

---

### Phase 6: Accessibility & QA

#### US-020: Add focus states to all interactive elements
**Description:** As a keyboard user, I need visible focus indicators on all interactive elements.

**Acceptance Criteria:**
- [ ] All buttons have focus-visible:ring-2 focus-visible:ring-clarity-500
- [ ] All links have visible focus state
- [ ] All form inputs have focus ring
- [ ] No element uses outline-none without custom ring replacement
- [ ] Tab through all pages to verify focus visibility
- [ ] Typecheck passes

---

#### US-021: Verify WCAG AAA contrast on reading content
**Description:** As a user with visual impairments, I need text to have high contrast.

**Acceptance Criteria:**
- [ ] Body text: slate-600 on white/slate-50 (8.7:1 ratio)
- [ ] Headings: slate-800 on white/slate-50 (13.3:1 ratio)
- [ ] Run Lighthouse accessibility audit on brief viewer
- [ ] Fix any contrast issues found
- [ ] Typecheck passes

---

#### US-022: Final visual QA across all breakpoints
**Description:** As a user on any device, I want the UI to look polished and work correctly.

**Acceptance Criteria:**
- [ ] Test all pages at mobile (375px), tablet (768px), desktop (1440px)
- [ ] No horizontal scrolling on mobile
- [ ] Touch targets minimum 44px on mobile
- [ ] Text readable at all sizes
- [ ] Images/icons scale appropriately
- [ ] Fix any responsive issues found
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill at multiple widths

---

## Functional Requirements

- FR-1: All UI uses Clarity Blue (#0F52BA) as primary color
- FR-2: All text uses Inter font family
- FR-3: All spacing follows 4px grid
- FR-4: All reading content uses max-w-prose (65ch) width
- FR-5: Reading level selector supports 4 levels with distinct typography
- FR-6: Source citations show political lean with non-partisan colors
- FR-7: Header appears on all pages with consistent navigation
- FR-8: Footer appears on all pages with legal links
- FR-9: All interactive elements have visible focus states
- FR-10: All copy follows brand voice guidelines

## Non-Goals

- New features or functionality (this is polish only)
- Backend changes
- Performance optimization (separate epic)
- Animation library integration (Framer Motion is optional)
- Dark mode (post-MVP)

## Technical Considerations

- Reference skills/frontend/design/SKILL.md for design tokens
- Reference skills/frontend/components/SKILL.md for component patterns
- Reference skills/frontend/brand/SKILL.md for voice and copy guidelines
- Use shadcn/ui components as base, customize with design tokens
- Use Lucide icons consistently

## Success Metrics

- Lighthouse accessibility score ≥90 on all pages
- All pages pass WCAG AAA for reading content contrast
- All interactive elements keyboard navigable
- UI audit document shows 0 remaining inconsistencies
- All components from skills/frontend/components implemented
- Copy review shows all pages match brand voice

## Open Questions

None — scope defined.
