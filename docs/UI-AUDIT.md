# UI Audit - State of Clarity

**Audit Date:** January 12, 2026  
**Auditor:** Ralph Agent  
**Reference Skills:** 
- skills/frontend/design/SKILL.md
- skills/frontend/brand/SKILL.md
- skills/frontend/components/SKILL.md
- skills/frontend/tech/SKILL.md

---

## Executive Summary

This audit identifies **critical inconsistencies** between the current implementation and the design system defined in the skills. The current codebase uses a **blue/slate color palette** instead of the **warm editorial palette** (Sage/Ivory/Ink) specified in the design system.

**Priority:** HIGH - Nearly all pages need significant updates to match the brand.

---

## 1. Color System Inconsistencies

### Current Implementation vs Design System

| Element | Current | Should Be |
|---------|---------|-----------|
| Primary color | Blue (#667eea, #764ba2 gradient) | Deep Sage (#5E6F64) |
| Background | Pure white (#FFFFFF) / gray-50 | Warm Ivory (#F7F4EF) |
| Text color | slate/gray palette | Ink palette (#1F2328 primary) |
| Border color | gray-200/gray-800 | Ivory-600 (#CFC8BD) |
| Card background | white/gray-800 | Ivory-500 (#E1DBD2) |

### Specific Issues

#### globals.css
- ❌ Uses `--background: 0 0% 100%` (pure white) - should use Ivory-100 (#F7F4EF)
- ❌ Uses blue-based `--primary` values - should use Sage-500 (#5E6F64)
- ❌ `.clarity-gradient` uses purple/blue gradient - should use Sage-500 solid
- ❌ `.source-tag.left` uses blue (political) - should use Muted Rose (#C85C6B)
- ❌ `.source-tag.right` uses red (political) - should use Muted Blue (#6B8FB3)

#### tailwind.config.ts
- ❌ Missing entire color system (ivory, ink, sage, rust, smoke)
- ❌ Missing font families (font-heading: Canela, font-body: Source Serif 4, font-ui: Inter)
- ❌ Missing max-w-prose: 65ch
- ❌ Missing @tailwindcss/typography plugin
- ❌ Missing @tailwindcss/forms plugin
- ❌ Missing typography theme customization for prose

---

## 2. Typography Inconsistencies

### Current Implementation vs Design System

| Element | Current | Should Be |
|---------|---------|-----------|
| Heading font | Inter (sans) | Canela/Libre Baskerville (serif) |
| Body font | Inter (sans) | Source Serif 4 (serif) |
| UI font | Inter | Inter (correct) |
| Body text size | Various | 18px (text-base) |
| Line height | Default | 1.6 for body text |

### Specific Issues

- ❌ No serif fonts loaded (Canela, Source Serif 4, Libre Baskerville)
- ❌ All pages use sans-serif for body text
- ❌ Headings should use serif font (editorial authority)
- ❌ Brief viewer should use Source Serif 4 for narrative content

---

## 3. Spacing Inconsistencies

### 4px Grid Compliance

- ⚠️ Most spacing appears to follow Tailwind defaults (4px base)
- ❌ Some custom values may not align with 4px grid

---

## 4. Shadow & Border Radius

### Current vs Design System

| Element | Current | Should Be |
|---------|---------|-----------|
| Shadows | shadow-lg, shadow-md | shadow-sm (subtle editorial) |
| Border radius | rounded-xl, rounded-lg | rounded (8px default) |
| Card borders | border-gray-200 | border-ivory-600 |

---

## 5. Interaction States

### Missing or Incorrect States

- ❌ Focus states use `focus:ring-primary` - should use `focus-visible:ring-sage-500`
- ❌ No `ring-offset-2` on focus states
- ❌ Hover states use opacity changes - should use color variations (sage-600)
- ❌ Active states not consistently implemented
- ❌ Disabled states not using ivory-300/ink-400 colors

---

## 6. Component Audit

### Missing Components (from skills/frontend/components/SKILL.md)

| Component | Path | Status |
|-----------|------|--------|
| ReadingLevelSelector | /components/brief/reading-level-selector.tsx | ❌ Missing |
| SummaryCard | /components/brief/summary-card.tsx | ❌ Missing |
| SourceCitation | /components/sources/source-citation.tsx | ❌ Missing |
| PoliticalLeanBadge | /components/sources/political-lean-badge.tsx | ❌ Missing |
| CredibilityBadge | /components/sources/credibility-badge.tsx | ❌ Missing |
| BriefGenerationProgress | /components/generation/generation-progress.tsx | ❌ Missing |
| Header | /components/layout/header.tsx | ❌ Missing (inline in pages) |
| Footer | /components/layout/footer.tsx | ❌ Missing (inline in pages) |

### Existing Components

| Component | Path | Issues |
|-----------|------|--------|
| CookieConsentBanner | /components/cookie-consent-banner.tsx | Wrong colors, no focus ring on buttons |

---

## 7. Page-by-Page Audit

### Homepage (app/page.tsx)

**Color Issues:**
- ❌ `bg-gradient-to-b from-white to-gray-50` → should use `bg-ivory-100`
- ❌ `border-gray-200` → should use `border-ivory-600`
- ❌ `.clarity-gradient` used for logo → should use `bg-sage-500`
- ❌ `bg-primary` on buttons → should use `bg-sage-500`
- ❌ `text-muted-foreground` → should use `text-ink-500` or `text-ink-600`
- ❌ Card backgrounds use `bg-white` → should use `bg-ivory-500`
- ❌ Feature icons use blue/purple/green → should use sage/rust sparingly

**Typography Issues:**
- ❌ All text uses sans-serif → headings should use serif
- ❌ Missing prose styling for content areas

**Focus/Accessibility Issues:**
- ❌ Input uses `outline-none` without replacement focus ring
- ❌ Buttons missing `focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2`
- ❌ Links missing visible focus states

**Copy Issues:**
- ⚠️ "in seconds" claim may be misleading (30-60s generation)
- ⚠️ © 2025 should be © 2026

---

### Brief Viewer (app/brief/[id]/page.tsx)

**Color Issues:**
- ❌ Same issues as homepage (white backgrounds, gray borders, blue primary)
- ❌ Reading level selector uses inline styles, not design system colors
- ❌ Source tags use red/blue (political colors) → should use muted rose/blue

**Typography Issues:**
- ❌ No prose styling for narrative content
- ❌ Reading levels don't adjust typography per spec:
  - Child: text-lg, leading-relaxed (1.65)
  - Teen/Undergrad: text-base, leading-normal (1.6)
  - Postdoc: text-base, leading-snug (1.55)

**Component Issues:**
- ❌ Reading level selector not extracted to component
- ❌ No ARIA roles (tablist, tab, aria-selected)
- ❌ No sticky positioning on selector
- ❌ Source cards not using PoliticalLeanBadge/CredibilityBadge components

**Copy Issues:**
- ❌ Reading level labels incorrect: "Post-doc" → should be "Postdoc" with "(Graduate+)"

---

### Signup Page (app/auth/signup/page.tsx)

**Color Issues:**
- ❌ Same background/border issues
- ❌ `.clarity-gradient` on submit button → should use `bg-sage-500`

**Focus/Accessibility Issues:**
- ❌ Inputs use `outline-none` → need custom focus ring
- ❌ Checkbox styling may not match design system

---

### Privacy/Terms Pages

**Color Issues:**
- ❌ Same background/border issues as other pages
- ❌ prose-gray used → should use prose-custom with ink colors

**Copy Issues:**
- ❌ © 2025 → should be © 2026

---

## 8. Accessibility Issues

### WCAG AAA Contrast Concerns

- ⚠️ Need to verify text-muted-foreground contrast on white background
- ⚠️ Need to verify link colors meet AA/AAA requirements

### Focus Visibility

- ❌ Many elements use `outline-none` without replacement
- ❌ No consistent focus ring pattern across components
- ❌ Missing `focus-visible:` modifier (shows ring only on keyboard nav)

### Touch Targets

- ⚠️ Some buttons may be smaller than 44px minimum
- ⚠️ Reading level selector tabs need verification

### Screen Reader Support

- ❌ Reading level selector missing ARIA roles
- ❌ Summary panels missing role="tabpanel" and hidden attributes
- ❌ Missing aria-label on icon-only buttons

---

## 9. Priority Fixes

### P0 - Critical (Blocks brand consistency)

1. **Update tailwind.config.ts** with full design system colors, fonts, and plugins
2. **Update globals.css** CSS variables to use Ivory/Ink colors
3. **Remove pure white backgrounds** - use Ivory-100 everywhere

### P1 - High (Core components)

1. Create ReadingLevelSelector component with proper ARIA
2. Create PoliticalLeanBadge component with correct muted colors
3. Create CredibilityBadge component with shield icons
4. Extract Header/Footer to reusable components

### P2 - Medium (Page polish)

1. Update homepage colors and typography
2. Update brief viewer with prose styling
3. Add focus states to all interactive elements
4. Update all copy to brand voice

### P3 - Low (Final polish)

1. Verify WCAG AAA contrast on all text
2. Test all breakpoints (375px, 768px, 1440px)
3. Verify touch targets (44px minimum)

---

## 10. Technical Debt

- Header/Footer duplicated across all pages → extract to layout
- No UI component library (shadcn/ui mentioned but not installed)
- Reading level logic duplicated in brief page → extract to hook

---

## Appendix: Design System Quick Reference

### Colors to Use

```
Backgrounds: ivory-100 (#F7F4EF), ivory-300, ivory-500
Text: ink-800 (primary), ink-600 (secondary), ink-500 (meta)
Primary accent: sage-500 (#5E6F64)
Secondary accent: rust-500 (#9A5A3A) - VERY sparingly
Borders: ivory-600 (#CFC8BD)
```

### Political Lean Colors (Data Viz Only)

```
Left: #C85C6B (muted rose)
Center-Left: #D9A0A0 (soft pink)
Center: #9A9E9F (ash grey)
Center-Right: #7FA5B8 (soft blue)
Right: #6B8FB3 (muted blue)
```

### Fonts

```
Headings: Canela, Tiempos Headline, Libre Baskerville, Georgia, serif
Body: Source Serif 4, Literata, Georgia, serif
UI: Inter, Source Sans 3, system-ui, sans-serif
```
