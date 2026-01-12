# PRD: Explore Page (Article Discovery)

## Introduction

Create an **Explore** page where users can discover all briefs on the platform. This page enables content discovery, drives engagement with existing briefs, and showcases community contributions. All briefs are public by default (users can opt to make them private). The page provides powerful filtering, search, and sorting to help users find relevant content.

## Goals

- Enable discovery of all public briefs on the platform
- Provide intuitive search and filtering by tags, date, author, and clarity score
- Increase engagement with existing content
- Showcase the breadth of topics covered by State of Clarity
- Create a browsable library that demonstrates platform value

## User Stories

### US-001: Create Explore page route and layout
**Description:** As a user, I want to access an Explore page from the main navigation so I can browse all available briefs.

**Acceptance Criteria:**
- [ ] `/explore` route exists and renders the Explore page
- [ ] Page has consistent header/footer with rest of site
- [ ] Hero section with title "Explore Briefs" and subtitle explaining the page
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Display brief cards in a grid
**Description:** As a user, I want to see briefs displayed as cards so I can quickly scan available content.

**Acceptance Criteria:**
- [ ] Responsive grid layout (1 col mobile, 2 cols tablet, 3-4 cols desktop)
- [ ] Each card shows: question (title), clarity score badge, tags (clickable), read time, brief excerpt (truncated)
- [ ] Cards link to `/brief/[id]`
- [ ] Hover state with subtle elevation/border change
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Add search functionality
**Description:** As a user, I want to search briefs by keyword so I can find topics I'm interested in.

**Acceptance Criteria:**
- [ ] Search input at top of page with search icon
- [ ] Searches across question text and tags
- [ ] Results update as user types (debounced, 300ms)
- [ ] Empty state when no results match
- [ ] Search term persisted in URL params (`?q=`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Filter by tags
**Description:** As a user, I want to filter briefs by tags so I can explore specific topics.

**Acceptance Criteria:**
- [ ] Tag filter section (sidebar on desktop, collapsible on mobile)
- [ ] Display all available tags with count of briefs per tag
- [ ] Multi-select: can filter by multiple tags (OR logic)
- [ ] Clicking a tag on a brief card adds it to the filter
- [ ] Active filters shown as removable chips
- [ ] Tags persisted in URL params (`?tags=Climate,Healthcare`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Filter by clarity score range
**Description:** As a user, I want to filter by clarity score so I can find high-quality briefs.

**Acceptance Criteria:**
- [ ] Score range filter (e.g., slider or dropdown: 7+, 8+, 9+, or "All")
- [ ] Filter updates results in real-time
- [ ] Persisted in URL params (`?minScore=8`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Sort briefs
**Description:** As a user, I want to sort briefs so I can find the newest or highest-rated content.

**Acceptance Criteria:**
- [ ] Sort dropdown with options: Newest, Oldest, Highest Score, Most Read (if available)
- [ ] Default sort: Newest
- [ ] Sort persisted in URL params (`?sort=score`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Filter by date range
**Description:** As a user, I want to filter by date so I can find recent or historical briefs.

**Acceptance Criteria:**
- [ ] Date filter options: All Time, Past Week, Past Month, Past Year
- [ ] Dropdown or button group UI
- [ ] Persisted in URL params (`?date=month`)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-008: Pagination or infinite scroll
**Description:** As a user, I want to load more briefs without performance issues.

**Acceptance Criteria:**
- [ ] Initial load shows first 12-20 briefs
- [ ] "Load More" button or infinite scroll to fetch additional briefs
- [ ] Loading state while fetching
- [ ] Total count displayed (e.g., "Showing 12 of 156 briefs")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add Explore link to main navigation
**Description:** As a user, I want to access the Explore page from the navbar.

**Acceptance Criteria:**
- [ ] "Explore" link added to main navbar (between Home and other links)
- [ ] Active state when on /explore route
- [ ] Works on mobile menu as well
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-010: Add "See All" button to homepage showcase section
**Description:** As a user, I want to see more briefs from the homepage showcase section.

**Acceptance Criteria:**
- [ ] "See All Briefs →" button below the showcase grid on homepage
- [ ] Button links to `/explore`
- [ ] Styled consistently with other CTAs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-011: Create API endpoint for fetching briefs
**Description:** As a developer, I need an API to fetch briefs with filtering, sorting, and pagination.

**Acceptance Criteria:**
- [ ] `GET /api/briefs` endpoint
- [ ] Query params: `q` (search), `tags` (comma-separated), `minScore`, `sort`, `date`, `limit`, `offset`
- [ ] Returns: `{ briefs: Brief[], total: number, hasMore: boolean }`
- [ ] Only returns public briefs (respects user privacy setting)
- [ ] Typecheck passes

### US-012: Add privacy field to briefs
**Description:** As a user, I want to make my briefs private so they don't appear in Explore.

**Acceptance Criteria:**
- [ ] `is_public` boolean field on briefs table (default: true)
- [ ] Private briefs excluded from Explore page API results
- [ ] Private briefs still accessible via direct link to owner
- [ ] Migration created and applied
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Create `/explore` route with responsive page layout
- FR-2: Display briefs as cards in responsive grid (1/2/3-4 columns)
- FR-3: Each brief card shows: question, clarity score, tags, read time, excerpt
- FR-4: Implement full-text search across question and tags
- FR-5: Implement multi-select tag filtering with OR logic
- FR-6: Implement clarity score minimum filter (7+, 8+, 9+, All)
- FR-7: Implement sort options (Newest, Oldest, Highest Score)
- FR-8: Implement date range filter (All Time, Week, Month, Year)
- FR-9: Implement pagination with "Load More" (12-20 per page)
- FR-10: Persist all filters/sort in URL params for shareable links
- FR-11: Add "Explore" to main navigation
- FR-12: Add "See All Briefs" CTA to homepage showcase section
- FR-13: Create `/api/briefs` endpoint with filtering and pagination
- FR-14: Add `is_public` field to briefs, default true
- FR-15: Only show public briefs in Explore; private briefs accessible only by owner

## Non-Goals

- No editorial vs. community distinction (all briefs treated equally)
- No user profiles or author pages (future feature)
- No "trending" algorithm (would require analytics, future feature)
- No saved filters or bookmarks
- No social features (comments, likes, shares)

## Design Considerations

- Follow existing design system (sage/ivory/ink colors, font-heading, font-body)
- Reuse existing brief card pattern from homepage
- Tag chips should match existing tag styling
- Search input should match existing form input styles
- Consider sidebar for filters on desktop, drawer/modal on mobile
- Empty states should be helpful ("No briefs match your filters. Try removing some filters.")

## Technical Considerations

- Use Supabase for querying briefs with filters
- Full-text search via Supabase `ilike` or `textSearch` on question column
- URL params managed via Next.js `useSearchParams` and `useRouter`
- Consider debouncing search input to reduce API calls
- Brief excerpts can be generated from first 150 chars of the executive summary

## Success Metrics

- Users can find briefs on topics of interest within 3 clicks
- Filter combinations produce relevant results
- Page loads in under 2 seconds with 100+ briefs
- All filters are shareable via URL

## Decisions

- **Most Read**: Yes, include "Most Read" sort option. Requires adding `view_count` to briefs table.
- **Briefs per page**: 12 initial load, with "Load More" for additional batches.
- **Tag categorization**: Keep simple for now (no categories).
