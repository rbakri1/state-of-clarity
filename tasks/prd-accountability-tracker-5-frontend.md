# PRD 5: Frontend - UI Components & Pages

## Introduction

Build the complete user-facing UI for the Accountability Tracker feature. This includes:
- **Landing Page**: Entity input + ethics notice
- **Ethics Modal**: Mandatory acknowledgment before proceeding
- **Generation Progress Page**: Real-time SSE updates with stage indicators
- **Results Page**: Display profile, scenarios, action items, and sources
- **Print Layout**: Print-optimized page for PDF export via browser
- **Reusable Components**: Profile section, scenarios section, action items section, progress indicator

This is the user interface layer that makes the Accountability Tracker accessible to investigative journalists.

**Dependencies:** PRD 4 (API Endpoints)

**Estimated Effort:** 5 working days

---

## Goals

- Create intuitive UI for starting investigations (single input field + button)
- Implement mandatory ethics modal that blocks access until acknowledged
- Display real-time generation progress with 5 stages (classification → profile → corruption → action → quality)
- Present investigation results in clear, scannable format
- Enable PDF export via browser print (Cmd+P / Ctrl+P)
- Maintain State of Clarity design system (Sage/Ivory/Ink colors)
- Ensure accessibility (ARIA labels, keyboard navigation, screen readers)
- Support responsive design (mobile, tablet, desktop)
- Display ethics warnings on every page (constant reminder)

---

## User Stories

### US-001: Create landing page with entity input
**Description:** As a user, I want to enter a target entity name and start an investigation so that I can begin researching potential corruption.

**Acceptance Criteria:**
- [ ] Create `/app/accountability/page.tsx`
- [ ] Hero heading: "Accountability Tracker" (text-4xl, font-heading, text-ink-800)
- [ ] Subheading: "Systematically investigate potential corruption using UK public records. Evidence-based. Transparent. Ethical."
- [ ] Yellow ethics notice banner with text: "This tool is for investigative journalism only. Remember: innocent until proven guilty."
- [ ] Input field: placeholder "Enter name or organization to investigate..." (w-full, px-4, py-4, rounded-xl)
- [ ] Submit button: "Start Investigation (£9.99)" (bg-sage-500, w-full)
- [ ] Form validation: input required (browser native)
- [ ] On submit: show ethics modal (don't navigate yet)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Create ethics acknowledgment modal
**Description:** As a user, I must acknowledge ethical principles before proceeding so that I understand the tool's limitations.

**Acceptance Criteria:**
- [ ] Create `/components/accountability/ethics-modal.tsx`
- [ ] Use Radix Dialog component (max-w-2xl, centered, backdrop blur)
- [ ] Display target entity name: "You are about to investigate: [NAME]"
- [ ] List 5 ethical principles (bullet points):
  - Innocent until proven guilty
  - Correlation does not equal causation
  - This tool maps theoretical possibilities, NOT confirmed wrongdoing
  - All findings must be verified through traditional investigative methods
  - Use responsibly and ethically for legitimate journalism only
- [ ] Checkbox with label: "I understand these principles and will use this tool ethically..."
- [ ] "Cancel" button (border-2 border-ivory-600)
- [ ] "Proceed with Investigation" button (bg-sage-500, disabled until checkbox checked)
- [ ] Clicking "Proceed" navigates to `/accountability/generate?entity=[NAME]`
- [ ] Proper ARIA labels: aria-modal, aria-labelledby, aria-describedby
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (test checkbox enable/disable)

---

### US-003: Create generation progress page with SSE
**Description:** As a user, I want to see real-time progress during investigation generation so that I know the system is working.

**Acceptance Criteria:**
- [ ] Create `/app/accountability/generate/page.tsx`
- [ ] Read `entity` from URL search params
- [ ] Display entity name: "Investigating: [NAME]"
- [ ] Show 5 progress stages with icons:
  - Entity Classification (User icon)
  - UK Profile Research (Search icon)
  - Corruption Analysis (ListTree icon)
  - Action List Generation (PenLine icon)
  - Quality Check (CheckCircle icon)
- [ ] Current stage shows spinning Loader2 icon
- [ ] Completed stages show green CheckCircle2 icon
- [ ] Pending stages show gray stage icon
- [ ] Progress bar with asymptotic curve (0-95%, never 100% until complete)
- [ ] SSE connection to `/api/accountability/generate` with POST body
- [ ] Listen for SSE events: `agent_started`, `agent_completed`, `stage_changed`, `complete`, `error`
- [ ] On `complete` event: navigate to `/accountability/[id]` (if success)
- [ ] On `error` event: show error message + refund notice
- [ ] On quality gate failure: show "Insufficient data" message + refund notice
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (test real generation)

---

### US-004: Create SSE hook for generation
**Description:** As a developer, I need an SSE hook so that progress tracking is reusable and testable.

**Acceptance Criteria:**
- [ ] Create `/lib/hooks/useInvestigationGeneration.ts`
- [ ] Hook accepts: `targetEntity` (string), `ethicsAcknowledged` (boolean)
- [ ] Hook returns: `status`, `progress`, `currentStage`, `error`, `investigationId`, `agentStatuses`
- [ ] Hook connects to EventSource: `/api/accountability/generate`
- [ ] Hook updates state on each SSE event
- [ ] Hook handles connection errors (retry 3 times)
- [ ] Hook cleans up EventSource on unmount
- [ ] `agentStatuses` tracks: agent name, status (pending/running/completed), duration
- [ ] Typecheck passes
- [ ] Unit test with mocked EventSource

---

### US-005: Create results page
**Description:** As a user, I want to view completed investigation results so that I can review the findings.

**Acceptance Criteria:**
- [ ] Create `/app/accountability/[id]/page.tsx`
- [ ] Fetch investigation via `/api/accountability/[id]`
- [ ] Display 404 if investigation not found
- [ ] Header section:
  - Target entity name (text-3xl, font-heading)
  - Completion date (text-ink-500)
  - "Export PDF" button (top-right, opens `/accountability/[id]/print` in new tab)
- [ ] Ethics reminder banner (yellow, always visible): "Remember: This report maps theoretical corruption possibilities based on structural analysis. Innocent until proven guilty."
- [ ] Profile section (expandable cards for each data source)
- [ ] Scenarios section (cards with risk-level badges: red=high, yellow=medium, gray=low)
- [ ] Action items section (grouped by priority, checklist style)
- [ ] Sources footer (list of URLs with access dates)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Create profile display component
**Description:** As a user, I want to see UK profile data in a clear format so that I can understand the entity's public record.

**Acceptance Criteria:**
- [ ] Create `/components/accountability/profile-section.tsx`
- [ ] Props: `profileData` (UKProfileData)
- [ ] Section heading: "UK Public Records Profile"
- [ ] Display data completeness indicators (green check or red X for each source)
- [ ] Expandable cards for each data type:
  - Companies House (directorships, company names, roles, dates)
  - Charity Commission (trusteeships, charity names, income)
  - Register of Interests (categories, descriptions, values)
  - Electoral Commission (donations, amounts, dates)
  - Contracts Finder (contract titles, values, award dates)
- [ ] Each card shows source URL as link
- [ ] Empty state: "No data found for this source"
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (test expand/collapse)

---

### US-007: Create scenarios display component
**Description:** As a user, I want to see corruption scenarios in a scannable format so that I can identify key risks.

**Acceptance Criteria:**
- [ ] Create `/components/accountability/scenarios-section.tsx`
- [ ] Props: `scenarios` (CorruptionScenario[])
- [ ] Section heading: "Theoretical Corruption Scenarios"
- [ ] Ethics reminder: "These are hypothetical scenarios based on structural analysis, NOT evidence of wrongdoing."
- [ ] Each scenario card shows:
  - Title (font-semibold)
  - Risk level badge (red=high, yellow=medium, gray=low)
  - Description
  - Enabling positions (bullet list)
  - Incentives (financial, political, career) (3 columns)
  - Red flags (bullet list)
  - **Innocent explanations** (highlighted in blue box)
  - Historical precedents (if any)
- [ ] Expandable "Show Details" for full scenario
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Create action items display component
**Description:** As a user, I want to see prioritized action items so that I have a clear investigation roadmap.

**Acceptance Criteria:**
- [ ] Create `/components/accountability/action-items-section.tsx`
- [ ] Props: `actionItems` (ActionItem[])
- [ ] Section heading: "Investigation Action Items"
- [ ] Group by priority:
  - Priority 1 (High): Red badge, "🔴 High Priority"
  - Priority 2 (Medium): Yellow badge, "🟡 Medium Priority"
  - Priority 3 (Low): Gray badge, "⚪ Low Priority"
- [ ] Each item shows:
  - Action (what to do)
  - Rationale (why it matters)
  - Data source (where to look)
  - Expected evidence (what you'd find)
  - Estimated time (if provided)
  - Legal considerations (if any) (warning icon)
- [ ] Checkbox for tracking (local state only, not persisted)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (test checkboxes)

---

### US-009: Create print layout page
**Description:** As a user, I want to export investigations to PDF so that I can download and share results.

**Acceptance Criteria:**
- [ ] Create `/app/accountability/[id]/print/page.tsx`
- [ ] Fetch investigation via `/api/accountability/[id]`
- [ ] Use print-optimized layout (no nav, no interactive elements)
- [ ] Print CSS: `@media print { @page { margin: 2cm; } .no-print { display: none; } .page-break { page-break-after: always; } }`
- [ ] Title page:
  - Large heading: "Accountability Investigation: [TARGET NAME]"
  - Generated date
  - Large disclaimer: "⚠️ IMPORTANT: This report is for investigative guidance only. Innocent until proven guilty."
- [ ] Each section on separate page (page breaks):
  - Profile Data
  - Each Corruption Scenario (one per page)
  - Action Items
  - Sources
- [ ] Footer on each page: "RESEARCH HYPOTHESIS ONLY – Generated [DATE]"
- [ ] No Sage/Ivory colors (use grayscale for print)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill (use browser print preview)

---

## Functional Requirements

- **FR-1:** Landing page at `/app/accountability/page.tsx` with entity input
- **FR-2:** Ethics modal at `/components/accountability/ethics-modal.tsx` using Radix Dialog
- **FR-3:** Generation progress page at `/app/accountability/generate/page.tsx` with SSE
- **FR-4:** SSE hook at `/lib/hooks/useInvestigationGeneration.ts`
- **FR-5:** Results page at `/app/accountability/[id]/page.tsx`
- **FR-6:** Print layout at `/app/accountability/[id]/print/page.tsx`
- **FR-7:** Profile section component at `/components/accountability/profile-section.tsx`
- **FR-8:** Scenarios section component at `/components/accountability/scenarios-section.tsx`
- **FR-9:** Action items section component at `/components/accountability/action-items-section.tsx`
- **FR-10:** All pages use State of Clarity design system (Sage primary, Ivory backgrounds, Ink text)
- **FR-11:** Ethics modal blocks investigation until checkbox acknowledged
- **FR-12:** Progress page shows 5 stages with real-time updates
- **FR-13:** Results page displays ethics reminder banner (always visible)
- **FR-14:** All components are responsive (mobile: single column, desktop: multi-column)
- **FR-15:** All interactive elements have proper ARIA labels
- **FR-16:** Keyboard navigation works (Tab, Enter, Escape)
- **FR-17:** Print layout uses page breaks between sections
- **FR-18:** Export button opens print page in new tab
- **FR-19:** All timestamps displayed in user's local timezone
- **FR-20:** Empty states for missing data (e.g., "No Companies House data found")

---

## Non-Goals

- No real-time collaboration (multiple users viewing same investigation)
- No investigation comments or annotations
- No social sharing features (no "Share on Twitter" button)
- No dark mode (State of Clarity doesn't have dark mode)
- No investigation templates or saved searches
- No advanced filtering/sorting on results page
- No inline editing of investigation results
- No custom PDF styling (browser default is sufficient)
- No mobile app (responsive web only)
- No offline support (requires live API connection)

---

## Design Considerations

### Color Palette (State of Clarity Design System)
- **Sage** (Primary): `#5E6F64` for buttons, active states
- **Ivory** (Background): `#F7F4EF` for page backgrounds
- **Ink** (Text): `#1F2328` for main text, `#6B6F73` for secondary
- **Warning**: Yellow for ethics notices and cautions

### Typography
- **Heading Font**: Canela, Tiempos Headline, Libre Baskerville, Georgia
- **Body Font**: Source Serif 4, Literata, Georgia
- **UI Font**: Inter, Source Sans 3, system-ui

### Component Patterns (Existing)
- **Buttons**: `px-6 py-3 rounded-lg bg-sage-500 text-ivory-100 hover:bg-sage-600`
- **Cards**: `p-6 rounded-xl bg-ivory-50 border border-ivory-600 hover:border-sage-400`
- **Inputs**: `w-full px-4 py-4 rounded-xl border-2 border-ivory-600 focus:border-sage-500`
- **Modals**: Radix Dialog with `bg-ink-900/80 backdrop-blur-sm`

### Accessibility Requirements
- All interactive elements have visible focus states
- Color is not the only indicator (use icons + text)
- Minimum touch target size: 44x44px (mobile)
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for all icons (or aria-hidden if decorative)

---

## Technical Considerations

### SSE (Server-Sent Events)
- Use native browser `EventSource` API
- Automatic reconnection on connection drop
- Manual close on component unmount
- Handle CORS if needed (should work same-origin)

### State Management
- Use React hooks (useState, useEffect) for local state
- No Redux or Zustand needed (component-level state sufficient)
- URL search params for entity name
- Navigation via Next.js router

### Performance
- Use React.memo for expensive components (scenario cards)
- Lazy load print layout (only when needed)
- Optimize images (if any) with Next.js Image component
- Debounce input validation (if real-time validation added)

### Browser Compatibility
- Target: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- EventSource supported in all modern browsers
- CSS Grid and Flexbox (widely supported)
- Print CSS supported in all browsers

### Responsive Breakpoints (Tailwind defaults)
- sm: 640px (tablet portrait)
- md: 768px (tablet landscape)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)

---

## Success Metrics

- [ ] Landing page loads in < 1 second
- [ ] Ethics modal appears within 100ms of button click
- [ ] SSE connection establishes within 500ms
- [ ] Progress updates appear within 1 second of backend event
- [ ] Results page loads in < 2 seconds
- [ ] Print layout renders correctly in all browsers (Chrome, Firefox, Safari)
- [ ] Accessibility score >90 (Lighthouse accessibility audit)
- [ ] Mobile usability score >90 (Google Mobile-Friendly Test)
- [ ] Zero layout shift (CLS score <0.1)
- [ ] Zero console errors on any page

---

## Open Questions

1. **Q:** Should we add a "Save for later" feature for in-progress investigations?
   - **Proposed:** Not for MVP, users can bookmark URL

2. **Q:** How do we handle very large investigation results (50+ scenarios, 100+ action items)?
   - **Proposed:** Pagination or "Show More" button (implement if needed)

3. **Q:** Should we add a tutorial/walkthrough for first-time users?
   - **Proposed:** Not for MVP, link to docs instead

4. **Q:** What happens if user closes browser during generation?
   - **Proposed:** Generation continues server-side, user can fetch result later from history

5. **Q:** Should we persist checkbox state for action items?
   - **Proposed:** Not for MVP, local state only (resets on refresh)

6. **Q:** Should export button download PDF automatically or just open print page?
   - **Proposed:** Open print page (user has control over print settings)

7. **Q:** How do we display very long scenario descriptions (500+ words)?
   - **Proposed:** "Show More" button with truncation at 200 words

---

## Files to Create

1. `/app/accountability/page.tsx` - Landing page (~150 lines)
2. `/app/accountability/generate/page.tsx` - Progress page (~200 lines)
3. `/app/accountability/[id]/page.tsx` - Results page (~250 lines)
4. `/app/accountability/[id]/print/page.tsx` - Print layout (~200 lines)
5. `/components/accountability/ethics-modal.tsx` - Ethics modal (~150 lines)
6. `/components/accountability/profile-section.tsx` - Profile display (~200 lines)
7. `/components/accountability/scenarios-section.tsx` - Scenarios display (~250 lines)
8. `/components/accountability/action-items-section.tsx` - Action items display (~200 lines)
9. `/components/accountability/investigation-progress.tsx` - Progress indicator (~150 lines)
10. `/lib/hooks/useInvestigationGeneration.ts` - SSE hook (~150 lines)

**Total LOC Estimate:** ~1,900 lines

---

## Testing Strategy

### Component Tests (`/tests/components/accountability/*.test.tsx`)

**Use Vitest + React Testing Library**

- **Ethics Modal:**
  - Test modal opens/closes correctly
  - Test checkbox enables "Proceed" button
  - Test "Cancel" button closes modal
  - Test "Proceed" button calls onConfirm callback
  - Test keyboard navigation (Tab, Enter, Escape)

- **Profile Section:**
  - Test displays all data correctly
  - Test empty state for missing data
  - Test expandable cards expand/collapse
  - Test source links are clickable

- **Scenarios Section:**
  - Test displays all scenarios
  - Test risk level badges show correct color
  - Test innocent explanations are visible
  - Test "Show Details" expands full scenario

- **Action Items Section:**
  - Test groups by priority correctly
  - Test checkboxes toggle state
  - Test legal considerations show warning icon

- **Progress Component:**
  - Test stages update based on SSE events
  - Test progress bar animates correctly
  - Test completed stages show check icon

### Integration Tests (`/tests/integration/accountability-frontend.test.tsx`)

**Use Vitest + MSW (Mock Service Worker)**

- **Full User Flow:**
  - Visit landing page
  - Enter entity name
  - Submit form → modal opens
  - Check checkbox → button enabled
  - Click "Proceed" → navigate to progress page
  - Mock SSE events → stages update
  - Navigate to results page → data displays

- **Error Handling:**
  - Mock insufficient credits → show 402 error message
  - Mock rate limiting → show 429 error message
  - Mock generation error → show refund notice
  - Mock quality gate failure → show "Insufficient data" message

### E2E Tests (`/tests/e2e/accountability-tracker.spec.ts`)

**Use Playwright**

- **Happy Path:**
  - Full investigation for "Boris Johnson"
  - Verify all stages complete
  - Verify results page shows data
  - Verify export opens print page
  - Verify print page renders correctly

- **Edge Cases:**
  - Test with non-existent entity (quality gate failure)
  - Test with 0 credits (insufficient credits error)
  - Test 4 investigations in 1 hour (rate limiting)

### Manual Testing Checklist

- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on mobile (iPhone Safari, Android Chrome)
- [ ] Test keyboard navigation (Tab through all interactive elements)
- [ ] Test screen reader (VoiceOver on Mac, NVDA on Windows)
- [ ] Test print preview (Cmd+P) on print layout page
- [ ] Test responsive design at 375px, 768px, 1024px, 1440px
- [ ] Run Lighthouse accessibility audit (target >90 score)
- [ ] Verify ethics warnings visible on every page

---

## Timeline

**Day 1:** Landing page + Ethics modal
- Create landing page with input form
- Create ethics modal component
- Wire up navigation flow
- Component tests

**Day 2:** Generation progress page + SSE hook
- Create SSE hook (useInvestigationGeneration)
- Create progress page with 5 stages
- Test SSE connection with real API
- Integration tests

**Day 3:** Results page components
- Create profile section component
- Create scenarios section component
- Create action items section component
- Component tests

**Day 4:** Results page + Print layout
- Create results page (wire up all components)
- Create print layout page
- Test print preview in all browsers
- Integration tests

**Day 5:** Polish + E2E testing
- Responsive design refinement
- Accessibility fixes
- E2E tests with Playwright
- Code review + deployment

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SSE doesn't work in Safari (known issues) | High | Low | Test early, use polyfill if needed (EventSource is widely supported) |
| Print CSS renders differently across browsers | Medium | Medium | Test in all browsers, use standardized print CSS, avoid fancy layouts |
| Large investigation results (100+ scenarios) crash browser | Medium | Low | Implement virtualization or pagination if needed, test with large datasets |
| Accessibility score < 90 (fails audit) | Medium | Low | Follow ARIA best practices from start, run audits early, fix incrementally |
| Mobile layout breaks on small screens (<375px) | Low | Low | Test on iPhone SE (smallest common device), use min-width constraints |
| Ethics modal dismissed accidentally (user confusion) | Medium | Medium | Make checkbox large and clear, require explicit acknowledgment |

---

## Dependencies

**Upstream (must be complete):**
- ✅ PRD 4 - API Layer (need: all 4 API endpoints, SSE streaming working)

**Existing Infrastructure:**
- Radix UI (existing)
- Lucide React icons (existing)
- Tailwind CSS with State of Clarity theme (existing)
- Next.js 14 with App Router (existing)

**Downstream (depends on this):**
- PRD 6: Integration & Polish (needs frontend complete for E2E testing)

---

## Definition of Done

- [ ] All 10 files created and committed to feature branch
- [ ] Landing page renders correctly
- [ ] Ethics modal blocks investigation until acknowledged (tested)
- [ ] Progress page shows real-time SSE updates (tested with real API)
- [ ] Results page displays all investigation data correctly
- [ ] Print layout formatted correctly for PDF export (tested in 3 browsers)
- [ ] All components match State of Clarity design system (design review approved)
- [ ] Responsive design works on mobile/tablet/desktop (tested at 4 breakpoints)
- [ ] Accessibility: proper ARIA labels, keyboard navigation works (Lighthouse >90)
- [ ] Ethics warnings visible on every page (verified manually)
- [ ] Component tests written and passing (>80% coverage)
- [ ] Integration tests written and passing (with MSW)
- [ ] E2E tests written and passing (with Playwright)
- [ ] Zero console errors on any page
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Deployed to staging and smoke tested
- [ ] Performance benchmarks recorded (load times, CLS, FCP)

---

**Document Version:** 2.0 (Enhanced with PRD Skill Structure)
**Last Updated:** 2026-01-14
**Author:** Implementation Team
