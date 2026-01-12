# PRD: Reading History (Enable Tracking & Brand Update)

## Introduction

The Reading History feature should automatically track when users view briefs, allowing them to revisit previously read content. The `reading_history` table exists in the database and the `/profile/history` page exists to display it, but **nothing currently writes to the table** – reading is never recorded.

This PRD covers:
1. Implementing the reading history tracking when brief pages load
2. Updating the `/profile/history` UI to match the warm editorial brand

## Goals

- Record reading history entry when a user views a brief page
- Update `/profile/history` UI to use warm editorial palette (ivory/sage/ink)
- Match the visual style of homepage showcase briefs (grid layout)
- Track basic reading metadata (reading level viewed, timestamp)

## User Stories

### US-001: Create reading history tracking hook
**Description:** As a developer, I need a hook that records reading history when a brief page loads.

**Acceptance Criteria:**
- [ ] Create `useTrackReading` hook in `/lib/reading-history/`
- [ ] Hook accepts `briefId` and optional `readingLevel`
- [ ] Hook calls API to record history on mount (once per session per brief)
- [ ] Uses session storage to prevent duplicate tracking within same session
- [ ] Only tracks for authenticated users (silent no-op for guests)
- [ ] Typecheck passes (`pnpm run build`)

### US-002: Create reading history API endpoint
**Description:** As a developer, I need an API endpoint that inserts reading history records.

**Acceptance Criteria:**
- [ ] Create POST `/api/reading-history` or POST `/api/briefs/[id]/read`
- [ ] Inserts record into `reading_history` table with: user_id, brief_id, read_at, reading_level_viewed
- [ ] Returns 401 for unauthenticated users (silent failure client-side)
- [ ] Upserts on (user_id, brief_id) to update `read_at` for re-reads
- [ ] Typecheck passes

### US-003: Integrate tracking into brief page
**Description:** As a user, I want my reading to be automatically tracked when I view a brief.

**Acceptance Criteria:**
- [ ] `BriefPageClient.tsx` calls `useTrackReading(briefId, activeLevel)` on mount
- [ ] Reading level changes also update the tracking (debounced)
- [ ] No visible UI for tracking (silent background operation)
- [ ] Verify in Supabase that `reading_history` row is created
- [ ] Typecheck passes

### US-004: Update /profile/history page to brand palette
**Description:** As a user, I want the reading history page to match the warm editorial design.

**Acceptance Criteria:**
- [ ] Page background uses `bg-ivory-100`
- [ ] Cards use `bg-ivory-50` with `border-ivory-600`
- [ ] Text uses `text-ink-800` (primary) and `text-ink-500` (meta)
- [ ] No pure white (#FFFFFF) or pure black (#000000)
- [ ] Hover states use `hover:border-sage-400`
- [ ] Focus rings use `focus-visible:ring-sage-500`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Convert reading history to grid layout
**Description:** As a user, I want my reading history displayed in a grid like the homepage showcase.

**Acceptance Criteria:**
- [ ] Grid layout: 1 column mobile, 2 columns tablet, 3 columns desktop
- [ ] Each card shows: question (title), clarity score badge, reading level viewed, read date
- [ ] Clarity score uses semantic colors (success/warning/error)
- [ ] Cards link to `/brief/[id]`
- [ ] Most recent reads appear first
- [ ] Empty state matches brand
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Add relative time formatting
**Description:** As a user, I want to see when I read something in human-friendly format.

**Acceptance Criteria:**
- [ ] Display "Today", "Yesterday", "3 days ago", "Jan 5" etc.
- [ ] Use `date-fns` for formatting (already installed)
- [ ] Meta text uses `text-ink-500` and `font-ui`
- [ ] Typecheck passes

## Functional Requirements

- FR-1: When authenticated user loads `/brief/[id]`, insert/upsert row in `reading_history`
- FR-2: Track `brief_id`, `user_id`, `read_at` (timestamp), `reading_level_viewed`
- FR-3: `/profile/history` queries `reading_history` joined with `briefs` for current user
- FR-4: Order by `read_at` descending (most recent first)
- FR-5: All colors must use design system tokens (ivory/sage/ink)
- FR-6: Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Non-Goals

- No time-spent tracking (requires complex interval tracking)
- No scroll depth tracking (requires scroll listeners)
- No clear history option (out of scope for MVP)
- No reading streak/gamification

## Design Considerations

- Reference: `/app/page.tsx` showcase briefs grid for card layout
- Use existing Tailwind classes from design system
- Reading level badge should use `bg-sage-100 text-sage-700` styling
- Match the card hover effect: `hover:border-sage-400 hover:shadow-md`

## Technical Considerations

- Use `createBrowserClient` for client-side Supabase calls
- Check RLS policies on `reading_history` table allow INSERT for authenticated users
- Debounce reading level changes to avoid excessive API calls
- Session storage key: `reading_tracked_${briefId}` to prevent duplicates

## Success Metrics

- Reading history records created on brief page load
- Users can see their reading history on `/profile/history`
- Page visually matches homepage style
- No performance impact on brief page load

## Open Questions

- Should we track time spent on page? (Deferred - requires more complex implementation)
- Should history show reading progress (scroll depth)? (Deferred)
