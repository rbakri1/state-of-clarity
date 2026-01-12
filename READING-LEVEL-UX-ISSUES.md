# Reading Level Selector - UX Issues & Recommendations

**Date**: 2026-01-12
**Issue**: Reading level selector is confusing and unclear about what it controls

## Current State Analysis

### What Reading Levels Actually Control

**✅ DOES Change:**
- Only the **summary text** in the "Choose Your Reading Level" section
- One summary card is shown at a time (hidden/shown based on selection)
- Reading time estimate updates based on summary length

**❌ DOES NOT Change:**
- POSIT section (stays the same)
- Historical Summary (stays the same)
- Foundational Principles (stays the same)
- **Narrative Analysis** (stays the same)
- **Structured Analysis** (stays the same)
- Sources sidebar (stays the same)

### Current UX Problems

#### 1. **Poor Placement** 🎯
- Selector is buried mid-page
- Appears AFTER: POSIT, Historical Summary, Foundational Principles
- Users might miss it entirely or not understand its purpose

#### 2. **Unclear Scope** 📊
- Section title "Choose Your Reading Level" doesn't explain what changes
- Users expect the entire brief to adapt to their level
- No indication that it only affects the summary

#### 3. **Subtle Visual Feedback** 👁️
- Only uses `hidden` attribute to show/hide cards
- Fade-in animation is subtle
- If summaries are similar lengths or empty, looks like nothing happened

#### 4. **Confusing Information Architecture** 🏗️
**Current page structure:**
```
1. Brief Header
2. POSIT (if present)
3. Historical Summary (if present)
4. Foundational Principles (if present)
5. 👉 Progressive Summaries (Reading Level Selector HERE)
6. Narrative Analysis
7. Structured Analysis (Definitions, Factors, Policies, Consequences)
8. Feedback Section
```

**User mental model:**
- "Reading level should control how I read THE ENTIRE BRIEF"
- "Child mode = simple language everywhere"
- "Postdoc mode = technical language everywhere"

**Reality:**
- Reading level ONLY controls section #5 (the summary)
- Everything else stays the same

---

## Recommended Solutions

### Option 1: Move Selector to Top + Clarify Scope ⭐ **RECOMMENDED**

**Changes:**
1. Move reading level selector to the very top of the page (after header, before POSIT)
2. Rename section to: **"Executive Summary"** or **"Quick Overview"**
3. Add subtitle: **"Choose your preferred complexity level"**
4. Add visual indicator showing which content changes

**Benefits:**
- Clear that this is THE summary, not the entire brief
- Prominent placement ensures users see it
- Sets expectations immediately

**Implementation:**
```tsx
{/* Executive Summary - NEW TOP SECTION */}
<section className="bg-ivory-200 rounded-xl border border-ivory-600 p-6 mb-8">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h2 className="text-2xl font-bold font-heading text-ink-800 mb-1">
        Executive Summary
      </h2>
      <p className="text-sm text-ink-600 font-body">
        Choose your preferred complexity level for this overview
      </p>
    </div>
    <Badge variant="outline" className="text-xs">
      Adapts below ↓
    </Badge>
  </div>

  <ReadingLevelSelector
    currentLevel={activeLevel}
    onLevelChange={setActiveLevel}
    className="mb-6"
  />

  <div className="max-w-prose">
    {(["child", "teen", "undergrad", "postdoc"] as const).map((level) => (
      <SummaryCard
        key={level}
        level={level}
        content={brief.summaries[level] || ""}
        isActive={activeLevel === level}
      />
    ))}
  </div>
</section>
```

---

### Option 2: Make Reading Level Global (Bigger Change) 🔄

**Concept:**
- Reading level affects ALL sections, not just summary
- Generate multiple versions of:
  - Narrative Analysis (simple vs. technical)
  - Structured Data descriptions (simple vs. technical)
  - Even source annotations

**Pros:**
- Matches user mental model
- Truly adaptive experience
- More valuable feature

**Cons:**
- Requires regenerating all sections at multiple levels
- 4x the token cost for generation
- Much more complex implementation
- Database schema changes needed

**Not recommended for MVP** - too complex

---

### Option 3: Improve Current Design (Minimal Change) 🎨

Keep selector where it is, but make changes clearer:

**Changes:**
1. Rename section: **"Summary at Your Level"** → **"Adaptive Summary"**
2. Add explanation text:
   ```
   "This summary adapts to your reading level. The detailed analysis below
   remains consistent for all readers."
   ```
3. Add visual transition when switching:
   - Slide animation instead of fade
   - Brief highlight/flash when content changes
4. Show level indicator IN the summary card:
   ```
   [Child Level: Ages 8-12] 📖
   ```

---

## Specific UX Improvements to Implement

### Immediate (Quick Wins):

#### 1. **Add Visual Feedback**
```tsx
<SummaryCard
  key={level}
  level={level}
  content={brief.summaries[level] || ""}
  isActive={activeLevel === level}
  className={cn(
    "transition-all duration-300",
    isActive
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-4 absolute"
  )}
/>
```

#### 2. **Add Level Label in Card**
```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-2 text-sm text-ink-500 font-ui">
    <Clock className="w-4 h-4" />
    <span>{readingTime} min read</span>
  </div>
  <Badge variant="secondary" className="text-xs">
    {levelLabels[level]} Level
  </Badge>
</div>
```

#### 3. **Better Section Title**
```tsx
<h2 className="text-xl font-bold font-heading text-ink-800 mb-2">
  Adaptive Summary
</h2>
<p className="text-sm text-ink-600 font-body mb-4">
  Choose your preferred reading level. The detailed analysis below remains
  consistent for all readers.
</p>
```

#### 4. **Move Selector Higher (Easier than Option 1)**
Move the entire section to position #2 (right after the brief header, before POSIT)

---

### Medium-Term:

#### 5. **Add Empty State Handling**
```tsx
{brief.summaries[level] ? (
  <SummaryCard ... />
) : (
  <div className="p-8 text-center border-2 border-dashed border-ivory-600 rounded-lg">
    <p className="text-ink-500 mb-2">No summary available for this level yet.</p>
    <p className="text-sm text-ink-400">
      Check back soon or try another reading level.
    </p>
  </div>
)}
```

#### 6. **Add Animation Indicator**
```tsx
const [isTransitioning, setIsTransitioning] = useState(false);

const handleLevelChange = (newLevel: ReadingLevel) => {
  setIsTransitioning(true);
  setActiveLevel(newLevel);
  setTimeout(() => setIsTransitioning(false), 300);
};

// Show loading state during transition
{isTransitioning && (
  <div className="absolute inset-0 bg-ivory-100/50 flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-sage-600" />
  </div>
)}
```

---

## Why NHS Brief is 404

Ran diagnostic - the brief ID `uk-nhs-funding-crisis` does not exist in your database.

**Possible causes:**
1. Brief generation failed and wasn't saved
2. Brief was deleted
3. ID doesn't match what's in the database

**To find it:**
```bash
npx tsx scripts/check-brief-summaries.ts | grep -i "nhs\|health"
```

**To fix:**
- Regenerate the brief from the `/ask` page
- Or check if it has a different ID in the database

---

## Implementation Priority

### Phase 1: Clarify Current Design (1-2 hours)
✅ Move reading level section to position #2 (after header)
✅ Rename to "Adaptive Summary" with clear explanation
✅ Add level badge in summary card
✅ Improve transition animation

### Phase 2: Better Empty States (30 min)
✅ Handle missing summaries gracefully
✅ Show helpful message

### Phase 3: Consider Future Enhancements
⏳ Global reading level (affects all sections)
⏳ Persistent level preference (save to user profile)
⏳ Better mobile experience

---

## Mock-up: Recommended Layout

```
┌─────────────────────────────────────┐
│ [Header: State of Clarity]         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Brief Title                         │
│ "What is a state?"                  │
│ Version 1 • Updated Jan 2026        │
│ [Clarity Score: 8.7/10]             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐ 👈 NEW POSITION
│ Adaptive Summary                    │
│ "Choose your preferred reading      │
│  level for this overview"           │
│                                     │
│ [Child] [Teen] [Undergrad] [Postdoc]│
│                                     │
│ 📖 Child Level • 2 min read         │
│                                     │
│ A state is like a big grown-up...  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ POSIT                               │
│ (Always same content)               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Historical Summary                  │
│ (Always same content)               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Narrative Analysis                  │
│ (Always same content)               │
└─────────────────────────────────────┘

... etc
```

---

## Accessibility Improvements

Current implementation is good (uses proper ARIA):
- ✅ `role="tablist"` and `role="tab"`
- ✅ `aria-selected` state
- ✅ `aria-controls` and `aria-labelledby`
- ✅ Keyboard navigation

**Enhancements:**
- Add `aria-live="polite"` to summary content
- Announce reading time when level changes
- Add skip link: "Skip to detailed analysis"

---

## Summary

**The Problem:**
- Reading level selector only controls ONE section (the summary)
- Users expect it to control the entire brief
- Poor placement and unclear labeling compound confusion

**The Solution:**
- Move selector to the top
- Rename to "Adaptive Summary" to set expectations
- Add clear visual feedback when switching
- Consider making it truly global in the future

**Quick Fix (30 minutes):**
Just move the section to the top and rename it. This alone will solve 80% of the confusion.
