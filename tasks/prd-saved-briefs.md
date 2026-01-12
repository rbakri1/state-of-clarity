# PRD: Saved Briefs (Fix & Brand Update)

## Introduction

The Saved Briefs feature allows users to bookmark briefs for later reading. The BookmarkButton component exists and calls the API, but the save action doesn't persist. Additionally, the `/profile/saved` page uses outdated styling that doesn't match the warm editorial brand (ivory/sage/ink palette).

This PRD covers:
1. Debugging and fixing the save functionality
2. Updating the UI to match the State of Clarity brand guidelines

## Goals

- Fix the bookmark save action so briefs actually persist to `saved_briefs` table
- Update `/profile/saved` UI to use warm editorial palette (ivory backgrounds, sage accents, ink text)
- Match the visual style of homepage showcase briefs (grid layout with clarity scores, tags)
- Ensure WCAG AAA accessibility compliance

## User Stories

### US-001: Debug and fix bookmark save action
**Description:** As a developer, I need to identify why the BookmarkButton API call doesn't persist data so users can save briefs.

**Acceptance Criteria:**
- [ ] Identify root cause (check browser console, network tab, Supabase logs)
- [ ] Verify `saved_briefs` table has correct RLS policies for INSERT
- [ ] Verify API `/api/briefs/[id]/save` receives the request and returns success
- [ ] Confirm data appears in `saved_briefs` table after clicking bookmark
- [ ] Typecheck passes (`pnpm run build`)

### US-002: Verify saved brief appears on /profile/saved
**Description:** As a user, I want to see my saved briefs on the saved page after bookmarking them.

**Acceptance Criteria:**
- [ ] After saving a brief, navigate to `/profile/saved`
- [ ] The saved brief appears in the list
- [ ] Removing the bookmark removes it from the list
- [ ] Typecheck passes

### US-003: Update /profile/saved page to brand palette
**Description:** As a user, I want the saved briefs page to match the warm editorial design of the rest of the site.

**Acceptance Criteria:**
- [ ] Page background uses `bg-ivory-100` (not white/gray)
- [ ] Cards use `bg-ivory-50` with `border-ivory-600`
- [ ] Text uses `text-ink-800` (primary) and `text-ink-500` (meta)
- [ ] No pure white (#FFFFFF) or pure black (#000000)
- [ ] Hover states use `hover:border-sage-400`
- [ ] Focus rings use `focus-visible:ring-sage-500`
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Convert saved briefs to grid layout
**Description:** As a user, I want saved briefs displayed in a grid like the homepage showcase so I can scan them quickly.

**Acceptance Criteria:**
- [ ] Grid layout: 1 column mobile, 2 columns tablet, 3 columns desktop
- [ ] Each card shows: question (title), clarity score badge, tags (max 2), saved date
- [ ] Clarity score uses semantic colors (success ≥8.5, warning ≥7.0, error <7.0)
- [ ] Cards link to `/brief/[id]`
- [ ] Empty state matches brand (ivory background, sage CTA button)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Add remove button with brand styling
**Description:** As a user, I want to remove saved briefs with a button that matches the brand.

**Acceptance Criteria:**
- [ ] Remove button uses `text-ink-400 hover:text-error`
- [ ] Confirmation happens inline (no modal needed for MVP)
- [ ] Optimistic UI: card disappears immediately, reverts on error
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: BookmarkButton POST to `/api/briefs/[id]/save` must insert row into `saved_briefs` table
- FR-2: BookmarkButton DELETE to `/api/briefs/[id]/save` must remove row from `saved_briefs` table
- FR-3: `/profile/saved` page must query `saved_briefs` joined with `briefs` for current user
- FR-4: Page must use responsive grid layout (1/2/3 columns)
- FR-5: All colors must use design system tokens (ivory/sage/ink), no raw hex values
- FR-6: Empty state shows helpful message with CTA to browse briefs

## Non-Goals

- No bulk delete/select functionality
- No sorting/filtering options (MVP simplicity)
- No sharing saved collections
- No offline support

## Design Considerations

- Reference: `/app/page.tsx` showcase briefs grid for card layout pattern
- Use existing Tailwind classes from `tailwind.config.ts` (ivory, sage, ink, etc.)
- Typography: `font-heading` for titles, `font-ui` for meta, `font-body` for content
- Match the Reading Card component pattern from skills/frontend/components/SKILL.md

## Technical Considerations

- Check Supabase RLS policies on `saved_briefs` table
- Verify authentication flow in BookmarkButton matches server expectations
- Use `createBrowserClient` for client-side Supabase calls
- Handle loading states with skeleton that matches brand

## Success Metrics

- Users can save briefs with one click
- Saved briefs persist across sessions
- Page visually matches homepage style (brand audit passes)
- No accessibility violations (axe audit)

## Open Questions

- Should we add a toast notification when saving/removing? (Nice to have)
- Should bookmark state be visible across the site (header badge with count)?
