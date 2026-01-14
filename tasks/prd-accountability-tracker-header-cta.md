# PRD: Header Navigation & Profile Reorganisation for Briefs + Investigations

## Introduction

Reorganise the header navigation to expose both "Briefs" and "Investigations" as first-class features, and update the user profile page to show separate sections for each with relevant stats and quick actions. This makes the Accountability Tracker discoverable while maintaining Briefs as the primary experience.

Currently:
- Header shows "Browse Briefs" but no path to Investigations
- Profile page only tracks brief-related stats (generated, saved, feedback)
- No visibility into investigation history or counts

---

## Goals

- Make Investigations discoverable from the main header navigation
- Keep Briefs as the default/primary experience
- Show users their activity across both features on their profile
- Provide quick access to view briefs and investigations from profile
- Maintain clean, uncluttered navigation

---

## User Stories

### US-001: Update header navigation with Briefs & Investigations
**Description:** As a visitor, I want to see both Briefs and Investigations in the header so I can easily discover and access either feature.

**Acceptance Criteria:**
- [ ] Header nav shows "Briefs" linking to `/briefs` (replaces "Browse Briefs")
- [ ] Header nav shows "Investigations" linking to `/accountability`
- [ ] "Briefs" appears first (left of "Investigations") to maintain primacy
- [ ] Both links visible on desktop; collapsed into mobile menu on small screens
- [ ] Current page is visually highlighted (active state)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Add investigations stat to profile stats grid
**Description:** As a user, I want to see how many investigations I've run alongside my brief stats so I have a complete picture of my activity.

**Acceptance Criteria:**
- [ ] Stats grid shows 4 items: Briefs Generated, Briefs Saved, Investigations, Feedback Given
- [ ] Investigations count fetched from `accountability_investigations` table
- [ ] Uses `Scale` or `Search` icon for investigations stat
- [ ] Grid layout adjusts gracefully (2x2 on mobile, 4-col on desktop)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Add Briefs section to profile quick links
**Description:** As a user, I want a dedicated Briefs section on my profile that groups brief-related actions together.

**Acceptance Criteria:**
- [ ] Section titled "Briefs" with icon
- [ ] Contains 2 quick links:
  - "My Briefs" → `/profile/history` (briefs I've generated)
  - "Saved Briefs" → `/profile/saved` (briefs I've bookmarked)
- [ ] Shows count badges (e.g., "12 generated", "5 saved")
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-004: Add Investigations section to profile quick links
**Description:** As a user, I want a dedicated Investigations section on my profile so I can access my investigation history.

**Acceptance Criteria:**
- [ ] Section titled "Investigations" with `Scale` icon
- [ ] Contains quick link: "My Investigations" → `/accountability` (or new `/profile/investigations` page)
- [ ] Shows count badge (e.g., "3 investigations")
- [ ] If count is 0, shows "Start your first investigation →" CTA
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Create profile investigations list page (optional)
**Description:** As a user, I want to see a list of my past investigations from my profile.

**Acceptance Criteria:**
- [ ] New page at `/profile/investigations`
- [ ] Lists investigations with: target entity, date, quality score
- [ ] Each item links to `/accountability/[id]`
- [ ] Empty state with CTA to start first investigation
- [ ] Pagination if > 10 investigations
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

## Functional Requirements

- FR-1: Header (`app/components/Header.tsx`) must show "Briefs" and "Investigations" nav links
- FR-2: "Briefs" must link to `/briefs`, "Investigations" must link to `/accountability`
- FR-3: Profile page (`app/profile/page.tsx`) must fetch investigation count from `accountability_investigations` table
- FR-4: Profile stats grid must display 4 stats: briefs generated, briefs saved, investigations, feedback
- FR-5: Profile must have a "Briefs" section with links to generated and saved briefs
- FR-6: Profile must have an "Investigations" section with link to investigation history
- FR-7: Investigation count badge must show on the Investigations quick link
- FR-8: Empty state for investigations section must encourage first investigation

---

## Non-Goals (Out of Scope)

- No changes to the brief generation flow
- No changes to the investigation generation flow
- No changes to the accountability landing page messaging (defer to separate PRD)
- No mobile hamburger menu redesign (use existing patterns)
- No investigation sharing or public profiles

---

## Design Considerations

### Header Layout
```
Logo | State of Clarity          About  Briefs  Investigations  [UserMenu]
```

### Profile Stats Grid (Desktop)
```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  📄 12       │  🔖 5        │  ⚖️ 3        │  💬 8        │
│  Briefs      │  Saved       │ Investigations│  Feedback   │
│  generated   │  briefs      │              │  given       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Profile Quick Links Sections
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Briefs                                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ 📄 My Briefs           │ │ 🔖 Saved Briefs            │ │
│ │ View generated briefs  │ │ View bookmarked briefs     │ │
│ │                    12→ │ │                         5→ │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚖️ Investigations                                           │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐   │
│ │ ⚖️ My Investigations                                  │   │
│ │ View past accountability investigations              │   │
│ │                                                   3→ │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ Or: "Start your first investigation →" if count = 0        │
└─────────────────────────────────────────────────────────────┘
```

### Icons
- Briefs: `FileText`
- Saved: `Bookmark`
- Investigations: `Scale` (legal/accountability theme)
- Feedback: `MessageSquare`

---

## Technical Considerations

### Files to Modify

| File | Changes |
|------|---------|
| `app/components/Header.tsx` | Update nav links (~5 lines) |
| `app/profile/page.tsx` | Add investigation fetch, update stats grid, add sections (~60-80 lines) |

### New Files (Optional)

| File | Purpose |
|------|---------|
| `app/profile/investigations/page.tsx` | List user's investigations |

### Database Queries

Add to profile page:
```typescript
const { count: investigationsCount } = await supabase
  .from("accountability_investigations")
  .select("id", { count: "exact" })
  .eq("user_id", user.id);
```

### Dependencies
- None (uses existing tables and components)

---

## Success Metrics

- Users can discover Investigations from homepage in 1 click
- Profile clearly shows activity across both features
- No confusion about the difference between Briefs and Investigations
- Existing brief-related flows unaffected

---

## Open Questions

- Should "Investigations" link go to `/accountability` (landing) or `/profile/investigations` (user's list)?
- Should we add investigation count to the UserMenu dropdown as well?
- Should the header links have active states based on current route?

---

*Estimated effort: 2-3 hours. No dependencies on other work.*
