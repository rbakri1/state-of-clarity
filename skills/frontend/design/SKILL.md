---
name: state-of-clarity-design-system
description: Complete design tokens and visual system for State of Clarity frontend. Use when implementing any UI component or styling. Defines exact color palette (Clarity Blue #0F52BA, political lean colors), typography scale (Inter font, 4 reading level sizes), spacing (4px grid), shadows, border radius, interaction states (hover/focus/active/disabled/loading), transitions, responsive breakpoints, and accessibility requirements (WCAG AAA for reading content).
---

# State of Clarity - Design System

## Color Tokens

### Primary - Clarity Blue
```
clarity-500: #0F52BA (Primary - CTAs, headers)
clarity-600: #0C429E (Hover states)
clarity-700: #093182 (Active states)
```

### Neutrals - Slate
```
slate-50: #F8FAFC (Page background)
slate-600: #475569 (Body text - WCAG AAA 8.7:1 ratio)
slate-800: #1E293B (Headings)
```

### Accent - Purple
```
purple-700: #7C3AED (Interactive elements, balance)
```

### Political Lean Colors (Data Viz Only - Non-Partisan)
```
Left: #E11D48 (Rose, not pure red)
Center-Left: #F472B6 (Pink)
Center: #94A3B8 (Slate)
Center-Right: #60A5FA (Blue)
Right: #3B82F6 (Blue, not flag blue)
```

---

## Typography

### Font Families
```typescript
font-sans: Inter // All UI text
font-mono: JetBrains Mono // Code, data
```

### Type Scale by Reading Level

**Child (8-12 years):**
```
text-lg (18px) + leading-relaxed (1.75)
```

**Teen/Undergrad (13-22 years):**
```
text-base (16px) + leading-normal (1.5)
```

**Postdoc (Graduate+):**
```
text-sm (14px) + leading-normal (1.5)
```

### General Scale
```
text-xs: 12px - Captions, metadata
text-sm: 14px - Postdoc level
text-base: 16px - Default body
text-lg: 18px - Child level
text-xl: 20px - Subheadings
text-2xl: 24px - Section headings
text-3xl: 30px - Page headings
text-4xl: 36px - Hero text
```

### Weights
```
font-normal: 400 - Body text (always)
font-medium: 500 - Buttons, emphasis
font-semibold: 600 - Headings
font-bold: 700 - Rare, strong emphasis only
```

---

## Spacing (4px Grid - Strict)

```
1: 4px - Tight grouping
2: 8px - Small gap
3: 12px - Medium gap
4: 16px - Base unit (default padding)
6: 24px - Card padding
8: 32px - Section spacing
12: 48px - Page-level spacing
```

**Common Patterns:**
```tsx
// Buttons
px-4 py-2 // 16px × 8px

// Cards (reading content)
p-6 // 24px all sides

// Between paragraphs
mb-4 // 16px vertical rhythm

// Reading container
max-w-prose mx-auto // 65ch optimal reading width
```

---

## Shadows (Subtle, Professional)

```
shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04) - Resting cards
shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08) - Default
shadow-md: 0 4px 6px rgba(15, 23, 42, 0.08) - Hover cards
shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.08) - Modals
```

**Usage:**
- Resting cards: `shadow-sm`
- Hovered cards: `shadow-md` (gentle lift)
- Modals: `shadow-lg`
- Use slate-900 (#0F172A) at low opacity for consistency

---

## Border Radius

```
rounded: 4px - Default (buttons, inputs, small cards)
rounded-lg: 8px - Large cards, modals, brief containers
rounded-full: 9999px - Avatars, pills, badges
```

**Nested Radius Rule:**
- Outer: `rounded-lg` (8px)
- Inner: `rounded` (4px)
- Always 4px difference for hierarchy

---

## Interaction States

### Hover (Buttons)
```tsx
className="
  bg-clarity-500 hover:bg-clarity-600
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-in-out
"
```

### Focus (Accessibility Critical)
```tsx
className="
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-clarity-500
  focus-visible:ring-offset-2
"
```
**Never:** `outline-none` without custom ring

### Active (Pressed)
```tsx
className="
  active:bg-clarity-700
  active:shadow-sm
  active:scale-[0.98]
"
```

### Disabled
```tsx
className="
  disabled:bg-slate-100
  disabled:text-slate-400
  disabled:cursor-not-allowed
  disabled:opacity-60
"
```

### Loading
```tsx
<button disabled className="opacity-70 cursor-wait">
  <Loader2 className="w-4 h-4 animate-spin" />
  Loading...
</button>
```

---

## Responsive Breakpoints

```
sm: 640px - Large phones, small tablets
md: 768px - Tablets
lg: 1024px - Laptops
xl: 1280px - Desktops
2xl: 1536px - Large desktops
```

**Mobile-First Pattern:**
```tsx
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
    {title}
  </h1>
</div>
```

---

## Reading Layouts

### Optimal Reading Width
```tsx
<article className="max-w-prose mx-auto">
  {/* 65ch = ~650px = optimal for 800-1200 word essays */}
</article>
```

### Brief Viewer Layout
```tsx
<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
  <article className="prose prose-slate max-w-none">
    {narrative}
  </article>
</div>
```

---

## Accessibility (WCAG AAA)

### Color Contrast
```
Body text: slate-600 on slate-50 = 8.7:1 ✅ AAA
Headings: slate-800 on slate-50 = 13.3:1 ✅ AAA
UI elements: Minimum 4.5:1 ✅ AA
```

### Touch Targets
```
Minimum: 44px × 44px (iOS)
Recommended: 48px × 48px
Buttons: px-4 py-2 = 48px height ✅
```

### Focus Indicators
- All interactive elements: Visible ring
- Contrast: 3:1 minimum with background
- Never remove without replacement

---

## Component Examples

### Primary Button
```tsx
<button className="
  px-4 py-2 rounded
  bg-clarity-500 text-white font-medium
  hover:bg-clarity-600 hover:shadow-md
  active:bg-clarity-700 active:shadow-sm
  focus-visible:ring-2 focus-visible:ring-clarity-500 focus-visible:ring-offset-2
  disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
  transition-all duration-200 ease-in-out
">
  Generate Brief
</button>
```

### Reading Card
```tsx
<article className="
  max-w-prose mx-auto
  bg-white rounded-lg shadow-sm
  border border-slate-200
  p-8
">
  <div className="prose prose-slate max-w-none">
    {content}
  </div>
</article>
```

### Source Citation
```tsx
<a href="#source-1" className="
  text-clarity-600 hover:text-clarity-700 hover:underline
  transition-colors duration-200
">
  <sup className="font-medium">[1]</sup>
</a>
```

---

## Critical Design Principles

1. **Clarity:** Generous whitespace, strong hierarchy, readable text
2. **Accessibility:** AAA contrast for reading, keyboard navigation, ARIA
3. **Professionalism:** Subtle animations, no flashy effects
4. **Non-partisanship:** Avoid red/blue flags in UI chrome
5. **Reading-optimized:** max-w-prose (65ch), proper line height, vertical rhythm

**Every design decision asks:**
- Does this help users understand complex policy?
- Is this accessible to 8-year-olds AND PhD researchers?
- Does this build trust through transparency?

---

## Tailwind Config Reference

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      clarity: {
        500: '#0F52BA',
        600: '#0C429E',
        700: '#093182',
      },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    maxWidth: {
      prose: '65ch', // Optimal reading width
    },
  },
},
plugins: [
  require('@tailwindcss/typography'),
  require('@tailwindcss/forms'),
],
```
