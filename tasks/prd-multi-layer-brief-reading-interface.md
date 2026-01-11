# PRD: Multi-Layer Brief Reading Interface (Epic 3.2)

## Introduction

The Brief Reading Interface is the primary way users consume State of Clarity policy briefs. This epic delivers a reading experience that adapts to different expertise levels, presents structured research data intelligently, makes sources transparent and verifiable, and enables comprehensive social sharing.

**Problem:** Users range from curious teenagers to policy experts—a single presentation style fails everyone. Additionally, information-dense briefs need smart progressive disclosure to avoid overwhelming readers while maintaining depth for those who want it.

**Solution:** A 3-tier reading level system (Simple, Standard, Advanced), smart structured data presentation with context-aware expansion, inline citations with hover verification, and full-featured social sharing.

## Goals

- Enable users to read briefs at their appropriate comprehension level (Simple, Standard, Advanced)
- Display structured data tables with intelligent default states (most relevant expanded, rest collapsed)
- Present sources with inline citations, hover tooltips, and a comprehensive sources section
- Show clarity score as overall badge with clickable modal for dimension breakdown
- Provide comprehensive social/sharing features (copy link, social platforms, embed, quote sharing)
- Achieve Core Web Vitals targets (LCP <2.5s, FID <100ms, CLS <0.1)

## User Stories

### US-001: Three-Tier Reading Level Selector

**Description:** As a reader, I want to choose between Simple, Standard, and Advanced reading levels so that I can engage with content at my comfort level.

**Acceptance Criteria:**
- [ ] Reading level selector displays 3 options: Simple, Standard, Advanced
- [ ] Simple level targets ages 12-16 (Flesch-Kincaid Grade 6-8)
- [ ] Standard level targets general adult audience (Flesch-Kincaid Grade 10-12)
- [ ] Advanced level targets experts/academics (Flesch-Kincaid Grade 14+)
- [ ] Default selection is "Standard"
- [ ] Selected level persists in URL query param (?level=simple|standard|advanced)
- [ ] Level selection persists in localStorage for return visits
- [ ] Switching levels updates the summary section with smooth transition animation
- [ ] All three summaries are pre-generated and stored in the brief data
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Smart Structured Data Sections

**Description:** As a reader, I want structured data sections to show me the most relevant information upfront so that I can dive deeper only when interested.

**Acceptance Criteria:**
- [ ] Each brief displays these collapsible structured data sections:
  - Definitions Table
  - Historical Summary  
  - Factors Table
  - Policy Suggestions Table
  - Second/Third-Order Consequences Table
- [ ] Default expansion state is context-aware:
  - Definitions: Expanded by default (always important)
  - Historical Summary: Collapsed by default
  - Factors: Expanded by default (core analysis)
  - Policy Suggestions: Collapsed by default
  - Consequences: Collapsed by default
- [ ] Each section header shows item count (e.g., "Factors (12)")
- [ ] Expand/collapse uses smooth 200ms animation
- [ ] Expand/collapse state is not persisted (resets on page reload)
- [ ] Tables are responsive (horizontal scroll on mobile, or card layout)
- [ ] Tables support sorting by clicking column headers (where applicable)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Narrative Article Display

**Description:** As a reader, I want to read a well-formatted narrative article that synthesizes the research so that I understand the topic holistically.

**Acceptance Criteria:**
- [ ] Narrative section displays 800-1,200 word article with proper typography
- [ ] Article uses appropriate heading hierarchy (h2, h3)
- [ ] Paragraphs have comfortable reading width (max 65ch)
- [ ] Pull quotes are styled distinctively (if present)
- [ ] Article includes inline citations as superscript numbers (e.g., "decreased by 71%[1]")
- [ ] Long articles show estimated reading time
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Inline Citation Tooltips

**Description:** As a reader, I want to hover over citations to see source details so that I can verify claims without losing my reading position.

**Acceptance Criteria:**
- [ ] Inline citations render as superscript numbers with subtle styling
- [ ] Hovering a citation shows tooltip within 100ms containing:
  - Source title
  - Publisher name
  - Publication date
  - Political lean badge (Left/Center-Left/Center/Center-Right/Right)
  - Credibility score (x/10)
- [ ] Tooltip remains visible while mouse is over it
- [ ] Tooltip has smart positioning (doesn't overflow viewport)
- [ ] Clicking citation scrolls to corresponding entry in sources section
- [ ] Clicked source entry briefly highlights (2s pulse animation)
- [ ] On mobile: tap shows tooltip, tap again scrolls to source
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Sources Section Display

**Description:** As a reader, I want a comprehensive sources section at the bottom so that I can explore the evidence base in detail.

**Acceptance Criteria:**
- [ ] Sources section displays after narrative content
- [ ] Each source entry shows:
  - Citation number (matching inline references)
  - Title (clickable, opens original URL in new tab)
  - Publisher
  - Publication date
  - Type badge (Primary Research/Report/News/Opinion/etc.)
  - Political lean badge with color coding
  - Credibility score with visual bar
  - Excerpt (first 200 chars with "Show more" expansion)
- [ ] Sources are numbered to match inline citations
- [ ] Political lean color coding: Left (blue), Center-Left (light blue), Center (gray), Center-Right (light red), Right (red)
- [ ] Filter dropdown to show: All / By Lean / By Type
- [ ] Source count displayed in section header (e.g., "Sources (24)")
- [ ] External link icon indicates opening in new tab
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Clarity Score Display with Modal Breakdown

**Description:** As a reader, I want to see the overall clarity score and click to understand how it was calculated so that I can trust the quality assessment.

**Acceptance Criteria:**
- [ ] Clarity score badge displays in brief header (e.g., "8.4/10")
- [ ] Badge uses color coding: Green (≥8), Yellow (6-7.9), Red (<6)
- [ ] Clicking badge opens modal with dimension breakdown
- [ ] Modal displays each scoring dimension:
  | Dimension | Description | Weight | Score | Contribution |
  |-----------|-------------|--------|-------|--------------|
  | First-Principles Reasoning | Logical coherence | 25% | x/10 | calculated |
  | Source Diversity | Political balance | 20% | x/10 | calculated |
  | Primary Source Ratio | Original research | 15% | x/10 | calculated |
  | Logical Completeness | Coverage | 15% | x/10 | calculated |
  | Readability | Appropriate level | 10% | x/10 | calculated |
  | Recency | Current sources | 10% | x/10 | calculated |
  | User Feedback | Community rating | 5% | x/10 | calculated |
- [ ] Modal includes horizontal bar chart visualization
- [ ] "Strengths" callout highlights top 2 dimensions
- [ ] "Opportunities" callout highlights bottom 2 dimensions
- [ ] Modal closes on backdrop click, X button, or Escape key
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Copy Link Sharing

**Description:** As a reader, I want to easily copy a link to the brief so that I can share it via any channel.

**Acceptance Criteria:**
- [ ] Share button visible in brief header
- [ ] Clicking share button opens share menu/popover
- [ ] "Copy Link" option copies URL to clipboard
- [ ] Copied URL includes current reading level param (e.g., ?level=advanced)
- [ ] Success toast notification: "Link copied to clipboard"
- [ ] Copy works on all browsers (uses Clipboard API with fallback)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Social Platform Sharing

**Description:** As a reader, I want to share briefs directly to social platforms so that I can start conversations about policy topics.

**Acceptance Criteria:**
- [ ] Share menu includes platform buttons: X/Twitter, LinkedIn, Facebook, Reddit, Email
- [ ] X/Twitter: Opens tweet composer with brief title, short excerpt, and URL
- [ ] LinkedIn: Opens LinkedIn share dialog with title and URL
- [ ] Facebook: Opens Facebook share dialog with URL (uses OG meta)
- [ ] Reddit: Opens Reddit submit link with suggested title
- [ ] Email: Opens mailto with subject line and body containing brief summary and link
- [ ] All share links open in new window/tab
- [ ] Share URLs use proper UTM parameters for tracking (utm_source, utm_medium)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Quote Sharing

**Description:** As a reader, I want to share specific quotes from the brief so that I can highlight key insights.

**Acceptance Criteria:**
- [ ] Text selection in narrative/summary sections triggers share popover
- [ ] Share popover appears near selection with share options
- [ ] Shared quote includes attribution: "— State of Clarity"
- [ ] Quote sharing available for X/Twitter and Copy
- [ ] X/Twitter formats as: "[selected text]" — from "Brief Title" [URL]
- [ ] Quote limited to 200 characters (truncated with ellipsis if longer)
- [ ] Popover dismisses on click elsewhere or Escape key
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Embed Brief Widget

**Description:** As a content creator, I want to embed briefs on my website so that I can share State of Clarity analysis with my audience.

**Acceptance Criteria:**
- [ ] "Embed" option in share menu opens embed modal
- [ ] Modal displays iframe embed code
- [ ] Embed code is copyable with one click
- [ ] Embed widget shows: Question, Clarity score, Summaries at selected level, "Read full brief" link
- [ ] Embed has responsive sizing (width: 100%, min-height: 400px)
- [ ] Embed route exists: /embed/[brief-id]?level=standard
- [ ] Embed has minimal styling (clean, brandable)
- [ ] Embed includes "Powered by State of Clarity" footer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Open Graph & Twitter Card Meta Tags

**Description:** As a reader sharing a link, I want social platforms to show rich previews so that my shared links look professional.

**Acceptance Criteria:**
- [ ] Each brief page includes complete Open Graph tags:
  - og:title (Brief question)
  - og:description (Standard summary, first 155 chars)
  - og:image (Generated social card image)
  - og:url (Canonical URL)
  - og:type (article)
  - og:site_name (State of Clarity)
- [ ] Twitter Card meta tags:
  - twitter:card (summary_large_image)
  - twitter:title
  - twitter:description
  - twitter:image
- [ ] Social card image auto-generated with:
  - Brief question as headline
  - Clarity score badge
  - State of Clarity branding
- [ ] Social images are 1200x630px (optimal for most platforms)
- [ ] Typecheck passes

---

### US-012: Save/Bookmark Brief

**Description:** As a logged-in user, I want to save briefs to my collection so that I can read them later.

**Acceptance Criteria:**
- [ ] Save button (bookmark icon) visible in brief header
- [ ] Button shows filled state if already saved
- [ ] Clicking toggles save state with optimistic UI update
- [ ] Save persists to database (saved_briefs table)
- [ ] Unauthenticated users clicking save see sign-in prompt
- [ ] Saved briefs accessible from user profile/dashboard
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Reading Progress Indicator

**Description:** As a reader, I want to see my reading progress so that I know how much of the brief remains.

**Acceptance Criteria:**
- [ ] Thin progress bar at top of viewport (sticky)
- [ ] Progress bar fills based on scroll position through content
- [ ] Progress bar uses brand accent color
- [ ] Bar is subtle (2-3px height)
- [ ] Progress calculation excludes header and footer
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Print-Friendly Styling

**Description:** As a reader, I want to print briefs for offline reading so that I can review them without a screen.

**Acceptance Criteria:**
- [ ] Print styles (@media print) are defined
- [ ] Print version includes: Question, selected summary, all tables, narrative, sources
- [ ] Print version excludes: Navigation, share buttons, interactive elements
- [ ] Tables fit within page margins (avoid horizontal overflow)
- [ ] Sources section prints with full URLs visible
- [ ] Page breaks avoid splitting tables mid-row
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Display reading level selector with three options (Simple, Standard, Advanced)
- FR-2: Persist reading level preference in URL and localStorage
- FR-3: Render structured data sections with context-aware default expansion states
- FR-4: Display narrative article with inline superscript citations
- FR-5: Show citation tooltip on hover with source metadata
- FR-6: Render sources section with full source details and filtering
- FR-7: Display clarity score badge with clickable modal breakdown
- FR-8: Provide copy-to-clipboard functionality for brief URL
- FR-9: Enable sharing to X/Twitter, LinkedIn, Facebook, Reddit, Email
- FR-10: Support quote selection sharing to social platforms
- FR-11: Provide embeddable widget with iframe code
- FR-12: Generate Open Graph and Twitter Card meta tags for each brief
- FR-13: Allow authenticated users to save/bookmark briefs
- FR-14: Display reading progress indicator during scroll
- FR-15: Apply print-friendly CSS for physical/PDF output

## Non-Goals

- Real-time collaborative annotations (post-MVP)
- Audio/video playback within briefs (post-MVP)
- Text-to-speech reading mode (post-MVP)
- Inline commenting on paragraphs (post-MVP)
- Version comparison view (post-MVP)
- Custom embed theming/branding (post-MVP)
- Native mobile share sheet integration (web sharing API only for MVP)

## Design Considerations

**Layout:**
- Maximum content width: 768px (comfortable reading)
- Generous whitespace between sections
- Sticky header with brief title and share actions
- Floating reading level selector (or sticky sub-header)

**Typography:**
- Serif font for narrative content (improved readability)
- Sans-serif for UI elements, tables, metadata
- Line height: 1.6-1.8 for body text
- Code/data tables use monospace where appropriate

**Components to Reuse:**
- shadcn/ui: Card, Badge, Button, Dialog (modal), Tooltip, Popover, Table
- Existing color system for political lean indicators

**Mobile Considerations:**
- Reading level selector: Horizontal pill buttons (scrollable if needed)
- Tables: Card layout or horizontal scroll
- Share menu: Bottom sheet on mobile
- Tooltips: Tap-to-show behavior

## Technical Considerations

**Data Structure:**
```typescript
interface BriefWithSources {
  id: string;
  question: string;
  summaries: {
    simple: string;
    standard: string;
    advanced: string;
  };
  structured_data: {
    definitions: Definition[];
    historical_summary: string;
    factors: Factor[];
    policies: Policy[];
    consequences: Consequence[];
  };
  narrative: string; // Contains inline citation markers [1], [2], etc.
  clarity_score: number;
  clarity_breakdown: ClarityBreakdown;
  sources: Source[];
  created_at: string;
  updated_at: string;
}
```

**Citation Parsing:**
- Parse narrative text for `[n]` patterns
- Build source index mapping citation numbers to source objects
- Render as superscript with attached tooltip data

**Social Card Generation:**
- Use Vercel OG or similar for dynamic image generation
- Cache generated images (brief content rarely changes)
- Route: /api/og/[brief-id]

**Performance:**
- Lazy load sources section (below fold)
- Use React.lazy for clarity modal (rarely opened)
- Preload reading level summaries (small payload)

## Success Metrics

- Users can switch reading levels in <500ms
- >60% of users interact with at least one structured data section
- Citation tooltips display within 100ms of hover
- >15% of readers use share functionality
- Clarity modal explains scoring to user satisfaction (qualitative)
- Lighthouse accessibility score ≥95
- Print output is readable and complete

## Open Questions

1. Should reading level preference sync across devices for authenticated users?
2. What is the ideal generated social card design (need design input)?
3. Should we track which structured sections users expand most (analytics)?
4. Do we need rate limiting on social card generation endpoint?
