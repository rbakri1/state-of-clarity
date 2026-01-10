# PRD: Smart Question Suggestions (Epic 3.3)

## Introduction

Smart Question Suggestions helps users formulate better policy questions through autocomplete, refinement suggestions, and curated templates. The feature reduces friction in the "Ask Anything" experience by guiding users toward well-formed questions that generate high-quality briefs.

**Problem:** Users often struggle to phrase policy questions effectively. Vague or overly broad questions produce lower-quality briefs. Users don't know what topics are available or what makes a good question.

**Solution:** Google-style autocomplete dropdown as users type, combining database history, curated templates, and AI-generated suggestions. Homepage shows topic categories and example questions for inspiration.

## Goals

- Reduce question submission friction with real-time autocomplete
- Guide users toward well-formed, specific policy questions
- Showcase available topics via category grid and example questions
- Improve brief quality by encouraging better question formulation
- Full keyboard accessibility for power users

## User Stories

### US-001: Topic Categories Grid on Homepage

**Description:** As a visitor, I want to see popular policy topics so that I can explore what's available.

**Acceptance Criteria:**
- [ ] Display grid of 8-10 topic category cards on homepage below hero
- [ ] Categories: Economy, Healthcare, Climate, Education, Defense, Immigration, Housing, Justice, Technology, Governance
- [ ] Each card has icon, label, and brief description (1 line)
- [ ] Clicking a category shows example questions for that topic
- [ ] Grid is responsive (4 cols desktop, 2 cols tablet, 1 col mobile)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-002: Example Questions Display

**Description:** As a visitor, I want to see example questions so that I can get ideas or click to prefill.

**Acceptance Criteria:**
- [ ] When topic category is clicked, show 4-6 example questions for that topic
- [ ] Example questions appear in a modal or expandable section below the grid
- [ ] Each question is clickable and prefills the Ask Anything input
- [ ] Questions are curated and stored in database (question_templates table)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-003: Create question templates database table

**Description:** As a developer, I need a database table to store curated question templates.

**Acceptance Criteria:**
- [ ] Create migration for question_templates table: id, category, question_text, is_featured, display_order, created_at
- [ ] Seed with 5-6 example questions per category (50-60 total)
- [ ] Add TypeScript types to Database interface
- [ ] Typecheck passes

---

### US-004: Autocomplete Input Component

**Description:** As a user, I want suggestions to appear as I type so that I can find or refine my question quickly.

**Acceptance Criteria:**
- [ ] Create /app/components/QuestionInput.tsx with autocomplete dropdown
- [ ] Dropdown appears after 2+ characters typed
- [ ] Dropdown shows max 6 suggestions
- [ ] Suggestions update as user types (debounced 150ms)
- [ ] Dropdown dismisses on blur or Escape key
- [ ] Input has placeholder showing example question
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-005: Full Keyboard Navigation

**Description:** As a power user, I want to navigate suggestions with keyboard so that I can work efficiently.

**Acceptance Criteria:**
- [ ] Arrow Down/Up navigates through suggestions
- [ ] Enter selects highlighted suggestion
- [ ] Tab moves to submit button (closes dropdown)
- [ ] Escape closes dropdown without selecting
- [ ] First item highlighted by default when dropdown opens
- [ ] Visual highlight on currently selected item
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-006: Autocomplete API Endpoint

**Description:** As a developer, I need an API to fetch autocomplete suggestions.

**Acceptance Criteria:**
- [ ] Create /app/api/questions/suggest/route.ts
- [ ] Accept query param: q (partial question text)
- [ ] Return array of suggestion objects: { text, source, category }
- [ ] Source types: 'template', 'history', 'ai'
- [ ] Combine results from templates + history + AI (prioritize exact matches)
- [ ] Limit to 6 results total
- [ ] Typecheck passes

---

### US-007: Template-Based Suggestions

**Description:** As a user, I want to see curated question templates that match my input.

**Acceptance Criteria:**
- [ ] Query question_templates table with ILIKE pattern match
- [ ] Return matching templates with source: 'template'
- [ ] Templates appear first in suggestion list (highest priority)
- [ ] Match on partial words (e.g., "4 day" matches "4-day work week")
- [ ] Typecheck passes

---

### US-008: History-Based Suggestions

**Description:** As a user, I want to see previously asked questions that match my input.

**Acceptance Criteria:**
- [ ] Query briefs table for questions matching user input
- [ ] Only include published briefs (status = 'published')
- [ ] Return with source: 'history'
- [ ] History suggestions appear after templates in list
- [ ] Deduplicate if same question exists as template
- [ ] Typecheck passes

---

### US-009: AI-Generated Suggestions

**Description:** As a user, I want AI to suggest refined or related questions based on my input.

**Acceptance Criteria:**
- [ ] If template + history < 4 results, call AI for additional suggestions
- [ ] Use Claude Haiku for cost efficiency
- [ ] Prompt: "Given partial question '[input]', suggest 2-3 well-formed policy questions"
- [ ] AI suggestions marked with source: 'ai'
- [ ] AI suggestions appear last in list
- [ ] Cache AI responses for identical inputs (5 min TTL)
- [ ] Typecheck passes

---

### US-010: Suggestion Source Indicators

**Description:** As a user, I want to see where suggestions come from so that I can trust the source.

**Acceptance Criteria:**
- [ ] Each suggestion shows subtle source badge: "Template", "Popular", "AI ✨"
- [ ] Template = curated by State of Clarity
- [ ] Popular = previously generated (from history)
- [ ] AI = generated suggestion
- [ ] Badges use muted styling (not distracting)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Question Refinement Suggestions

**Description:** As a user typing a vague question, I want suggestions to help me be more specific.

**Acceptance Criteria:**
- [ ] Detect vague patterns (e.g., "What about...", single words, <5 words)
- [ ] Show refinement prompt: "Be more specific: [refined options]"
- [ ] Refinements add context: geography, timeframe, specific policy
- [ ] Example: "climate" → "What are the UK's climate policy targets for 2030?"
- [ ] Refinements generated via AI prompt
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Prefill from URL Parameter

**Description:** As a user clicking a shared link, I want the question to prefill from the URL.

**Acceptance Criteria:**
- [ ] Support URL param: ?q=encoded+question+text
- [ ] Prefill QuestionInput with decoded value on page load
- [ ] Trigger autocomplete after prefill if text present
- [ ] Works on homepage Ask Anything input
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-013: Mobile-Optimized Input

**Description:** As a mobile user, I want the autocomplete to work well on touch devices.

**Acceptance Criteria:**
- [ ] Dropdown has adequate touch targets (min 44px height per item)
- [ ] Tapping suggestion selects it and closes dropdown
- [ ] Virtual keyboard doesn't obscure dropdown (position above if needed)
- [ ] Input uses inputmode="text" for optimal keyboard
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-014: Analytics Tracking

**Description:** As a product owner, I want to track suggestion usage so that I can improve the feature.

**Acceptance Criteria:**
- [ ] Track event: suggestion_shown (count, query length)
- [ ] Track event: suggestion_selected (source type, position in list)
- [ ] Track event: suggestion_ignored (user submitted without selecting)
- [ ] Use existing analytics pattern (PostHog or similar)
- [ ] Typecheck passes

---

### US-015: Integrate QuestionInput into Homepage

**Description:** As a user, I want the new smart input on the homepage.

**Acceptance Criteria:**
- [ ] Replace existing Ask Anything input with QuestionInput component
- [ ] Maintain existing submit behavior (calls /api/ask or generation flow)
- [ ] Topic grid appears below the input
- [ ] Clicking example question prefills input and focuses it
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Display topic category grid with 8-10 policy domains
- FR-2: Show clickable example questions per category
- FR-3: Store curated templates in question_templates database table
- FR-4: Provide autocomplete dropdown after 2+ characters with 150ms debounce
- FR-5: Support full keyboard navigation (arrows, enter, escape, tab)
- FR-6: Fetch suggestions from templates, history, and AI
- FR-7: Display source badges on each suggestion
- FR-8: Detect vague questions and offer refinement suggestions
- FR-9: Support URL parameter prefill (?q=)
- FR-10: Optimize for mobile touch interaction
- FR-11: Track suggestion usage analytics

## Non-Goals

- Voice input (post-MVP)
- Multi-language suggestions (English only)
- Personalized suggestions based on user history (post-MVP)
- Question validation/rejection before submit (handled by generation flow)
- Trending questions section (post-MVP)

## Design Considerations

**Autocomplete Dropdown:**
- Position directly below input, full width
- Max 6 items visible, no scroll
- Subtle shadow, rounded corners
- Hover and keyboard-selected states distinct

**Topic Grid:**
- Card style with icon + label
- Muted colors, accent on hover
- Categories should feel browsable, not overwhelming

**Source Badges:**
- Very subtle (text-xs, muted color)
- Right-aligned in each suggestion row
- Don't distract from the question text

**Mobile:**
- Dropdown may need to appear above keyboard on small screens
- Consider bottom sheet pattern if viewport too constrained

## Technical Considerations

**Database Schema:**
```sql
CREATE TABLE question_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Suggestion Priority:**
1. Exact template matches (highest)
2. Fuzzy template matches
3. History matches (published briefs)
4. AI-generated (lowest, fills gaps)

**AI Caching:**
- Cache key: normalized lowercase query
- TTL: 5 minutes
- Storage: in-memory or Redis if available

**Performance:**
- Debounce input: 150ms
- API response target: <200ms
- Lazy load AI suggestions (don't block initial results)

## Success Metrics

- 40% of users interact with autocomplete
- 25% of submissions use a suggestion (template, history, or AI)
- Average question length increases by 20% (more specific questions)
- Autocomplete API p95 latency <200ms
- Topic grid click-through rate >10%

## Open Questions

1. Should we show "Trending" or "Recently Asked" as a separate section?
2. How often should we refresh/update the curated templates?
3. Should authenticated users see their own question history first?
