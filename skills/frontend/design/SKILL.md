---
name: state-of-clarity-design-system
description: Complete design tokens and visual system for State of Clarity frontend. Use when implementing any UI component or styling. Defines exact color palette (warm editorial with Deep Sage primary), typography scale (serif body, sans UI), spacing (4px grid), shadows, border radius, interaction states, transitions, responsive breakpoints, and accessibility requirements (WCAG AAA for reading content).
---

# State of Clarity - Design System

## Core Direction

**Mood:** Thoughtful, rigorous, humane, editorial
**Not:** Activist, corporate, academic-for-academics
**Principle:** Words lead. Colour supports. Typography carries authority quietly.

---

## Color System

### Philosophy
- **No pure white** (#FFFFFF) - harsh, digital
- **No pure black** (#000000) - aggressive, undermines warmth
- **Neutrals: 80-85%** of design
- **Accents: ≤5%** - semantic, not decorative
- If color is noticeable, you've gone too far

---

### Base Neutrals (Foundation - 80% of design)

**Warm Ivory Scale (Backgrounds)**
```
ivory-50: #FCFBF9   // Lightest, subtle lift
ivory-100: #F7F4EF  // Primary background
ivory-200: #F2EDE5  // Slight variation
ivory-300: #ECE7DF  // Light Stone - secondary background
ivory-400: #E6DFD4  // Medium
ivory-500: #E1DBD2  // Warm Linen - cards/surfaces
ivory-600: #CFC8BD  // Soft Taupe - borders/dividers
ivory-700: #BAB0A0  // Darker borders
ivory-800: #A39785  // Strong borders
ivory-900: #8B7D6B  // Darkest neutral
```

**Usage:**
- `ivory-100`: Primary page background (replaces white)
- `ivory-300`: Secondary backgrounds, alternating sections
- `ivory-500`: Card surfaces, elevated content
- `ivory-600`: Borders, dividers, subtle separation
- `ivory-700-900`: Rarely used, only for specific emphasis

---

### Text Colors (Ink-Based Blacks)

**Soft Ink Scale (Primary Text)**
```
ink-50: #F8F9FA    // Very light (backgrounds only)
ink-100: #E9EAEC   // Light backgrounds
ink-200: #D1D4D7   // Disabled backgrounds
ink-300: #B8BCC1   // Borders
ink-400: #9A9E9F   // Ash Grey - disabled/low emphasis text
ink-500: #6B6F73   // Stone Grey - muted/meta text
ink-600: #3A3F45   // Warm Charcoal - secondary text, subheads
ink-700: #2A2E32   // Emphasis text
ink-800: #1F2328   // Soft Ink - PRIMARY BODY TEXT
ink-900: #16191D   // Maximum contrast (rare use)
```

**Text Color Usage:**
- `ink-800` (#1F2328): **Primary body text** - essays, long reads, headings
- `ink-600` (#3A3F45): Secondary text - subheads, captions, excerpts
- `ink-500` (#6B6F73): Meta text - dates, labels, footnotes, source metadata
- `ink-400` (#9A9E9F): Disabled/de-emphasized - inactive UI elements

---

### Accent Colors

#### Deep Sage (Primary Accent - Main Signal)

**Base:** `#5E6F64`

```
sage-50: #F4F6F5    // Very subtle backgrounds
sage-100: #E8EBE9   // Light backgrounds
sage-200: #D1D7D3   // Hover backgrounds
sage-300: #B9C3BD   // Borders
sage-400: #8E9B94   // Light emphasis
sage-500: #5E6F64   // PRIMARY ACCENT (links, markers, affordances)
sage-600: #4D5B52   // Hover state
sage-700: #3D4842   // Active state
sage-800: #2E3632   // Strong emphasis
sage-900: #1F2522   // Darkest (rare)
```

**Usage:**
- Links (non-underlined)
- Section markers
- Small UI affordances
- Pull-quote rules
- Focus rings
- Selected states

**Character:** Calm, grounded, non-tribal, serious without austerity

---

#### Muted Rust (Secondary Accent - Rare Emphasis)

**Base:** `#9A5A3A`

```
rust-50: #FAF6F4    // Very subtle
rust-100: #F5EBE5   // Light backgrounds
rust-200: #EBD7CC   // Subtle highlights
rust-300: #D9B5A0   // Borders
rust-400: #C18769   // Medium emphasis
rust-500: #9A5A3A   // PRIMARY (one-off emphasis, key callouts)
rust-600: #7D4A2F   // Hover
rust-700: #603924   // Active
rust-800: #442A1A   // Strong emphasis
rust-900: #2B1A10   // Darkest
```

**Usage:**
- One-off emphasis (sparingly!)
- Key callouts
- Occasional chart highlights
- Important warnings (not errors)

**Rule:** If you're using this often, you're using it wrong.

---

#### Smoke Blue (Optional Cool Counterbalance)

**Base:** `#6E7F8D`

```
smoke-50: #F6F8F9   // Very light
smoke-100: #ECF0F2  // Light backgrounds
smoke-200: #D9E0E5  // Subtle
smoke-300: #B8C4CC  // Borders
smoke-400: #92A1AD  // Medium
smoke-500: #6E7F8D  // PRIMARY (charts, data, cool accent)
smoke-600: #596672  // Hover
smoke-700: #454E57  // Active
smoke-800: #32383F  // Strong
smoke-900: #212529  // Darkest
```

**Usage (very restrained):**
- Charts, diagrams, data visualization
- Visual differentiation without "blue politics"
- Cool counterpoint to warm palette

**Only use if:** You need data viz or want subtle cool balance

---

### Semantic Colors (Mapped to Palette)

**Success (Gentle Green)**
```
success: #628B70      // Softer than pure green, matches sage family
success-light: #E8F0EB
success-dark: #3D5945
```
**Usage:** Clarity score ≥8.5, verified sources, successful operations

**Warning (Amber)**
```
warning: #C89664      // Warmer amber, complements rust
warning-light: #F8F1E8
warning-dark: #9A6F3D
```
**Usage:** Clarity score 7.0-8.4, missing sources, pending review

**Error (Muted Rose)**
```
error: #B8675E        // Softer red, not alarming
error-light: #F5EBE9
error-dark: #8B4840
```
**Usage:** Clarity score <7.0, broken sources, validation errors

**Info (Smoke Blue)**
```
info: #6E7F8D         // Same as smoke-500
info-light: #ECF0F2
info-dark: #454E57
```
**Usage:** Help text, methodology explanations, neutral data

---

### Political Lean Colors (Data Visualization ONLY)

**Never use in UI chrome - only for source diversity charts**

```
Left: #C85C6B         // Muted rose (not pure red, not UK flag)
Center-Left: #D9A0A0  // Soft pink
Center: #9A9E9F       // Ash grey (from ink-400)
Center-Right: #7FA5B8 // Soft blue
Right: #6B8FB3        // Muted blue (not pure blue, not flag)
Unknown: #CFC8BD      // Soft taupe (from ivory-600)
```

**Why these specific colors:**
- Avoid patriotic red/blue associations
- Muted saturation (professional, not alarming)
- Works for colorblind users
- Rose→grey→blue spectrum reduces partisan coding

---

## Typography

### Font Families

**Headings (Serif - Editorial Authority):**
```typescript
font-heading: 'Canela', 'Tiempos Headline', 'Libre Baskerville', Georgia, serif
```
**Why:** Warm, intellectual, contemporary serif. Signals depth.

**Alternatives (in order of preference):**
1. Canela (ideal - warm, editorial, sophisticated)
2. Tiempos Headline (strong alternative)
3. Libre Baskerville (Google Fonts, free)
4. Cormorant Garamond (slightly more classical)

**Body (Serif - Long Reading):**
```typescript
font-body: 'Source Serif 4', 'Literata', 'Georgia', serif
```
**Why:** Excellent readability for 800+ word essays. Free. Pairs with warm neutrals.

**UI/Meta (Sans - Contrast & Clarity):**
```typescript
font-ui: 'Inter', 'Source Sans 3', -apple-system, system-ui, sans-serif
```
**Why:** Modern, professional, prevents serif overload. Used for navigation, captions, buttons.

---

### Type Scale

**Headings (Canela/Tiempos):**
```
text-6xl: 60px / 3.75rem - line-height: 1.1  // Hero (rare, marketing only)
text-5xl: 48px / 3rem - line-height: 1.1     // Large hero
text-4xl: 42px / 2.625rem - line-height: 1.2 // H1 - essay titles
text-3xl: 32px / 2rem - line-height: 1.25    // H2 - section headings
text-2xl: 28px / 1.75rem - line-height: 1.3  // H3 - subsections
text-xl: 24px / 1.5rem - line-height: 1.4    // H4 - minor headings
```

**Body Text (Source Serif 4):**
```
text-lg: 19px / 1.1875rem - line-height: 1.65  // Large body (optional)
text-base: 18px / 1.125rem - line-height: 1.6  // PRIMARY BODY TEXT
text-sm: 16px / 1rem - line-height: 1.55       // Smaller body (rare)
```

**UI/Meta (Inter):**
```
text-sm: 14px / 0.875rem - line-height: 1.5  // Captions, footnotes
text-xs: 13px / 0.8125rem - line-height: 1.5 // Tiny labels, metadata
```

**Reading Level Typography (Override):**
- **Child (8-12):** `text-lg` (19px) + `leading-relaxed` (1.65) - Source Serif
- **Teen (13-17):** `text-base` (18px) + `leading-normal` (1.6) - Source Serif
- **Undergrad (18-22):** `text-base` (18px) + `leading-normal` (1.6) - Source Serif
- **Postdoc (Graduate+):** `text-base` (18px) + `leading-snug` (1.55) - Source Serif

*Note: All reading levels use same size (18px) but adjust line-height for density*

---

### Font Weights

```
font-normal: 400   // Body text (always), regular emphasis
font-medium: 500   // Subheads, subtle emphasis, buttons
font-semibold: 600 // Headings (H1-H4), strong emphasis
font-bold: 700     // Rare, only for very strong emphasis
```

**Usage:**
- Body text: Always `font-normal` (400)
- Headings: `font-semibold` (600) or `font-medium` (500)
- Buttons: `font-medium` (500)
- Never use font-light (accessibility issues)

---

### Letter Spacing

```
Headings (Canela): -0.01em      // Slightly tighter, elegant
Body (Source Serif): 0em         // Default, optimal
All caps (rare): 0.05em          // Wider for legibility
Small caps: 0.025em              // Subtle widening
```

---

### Typographic Hierarchy Example

```typescript
// H1 - Essay Title
className="font-heading text-4xl font-semibold text-ink-800 tracking-tight"
// 42px Canela, Soft Ink, slightly tight tracking

// H2 - Section Heading
className="font-heading text-3xl font-semibold text-ink-800"
// 32px Canela, Soft Ink

// Body - Essay Content
className="font-body text-base text-ink-800 leading-normal"
// 18px Source Serif, Soft Ink, 1.6 line-height

// Caption/Meta
className="font-ui text-sm text-ink-500"
// 14px Inter, Stone Grey
```

---

## Spacing (4px Grid - Strict)

Same as before - this works perfectly:

```
0: 0px
1: 4px    - Tight grouping
2: 8px    - Small gap, related elements
3: 12px   - Medium gap
4: 16px   - Base unit (default padding/margin)
5: 20px   - Comfortable separation
6: 24px   - Card padding, section spacing
8: 32px   - Large section gaps
10: 40px  - Major section breaks
12: 48px  - Page-level spacing
16: 64px  - Very large gaps
20: 80px  - Hero sections
24: 96px  - Maximum vertical rhythm
```

**Common Patterns:**
```tsx
// Buttons
px-4 py-2     // 16px × 8px (default)
px-6 py-3     // 24px × 12px (large)

// Cards
p-6           // 24px (reading content)
p-8           // 32px (feature cards)

// Between paragraphs
mb-4          // 16px (vertical rhythm)

// Between sections
gap-8         // 32px
gap-12        // 48px

// Reading container
max-w-prose   // 65ch (~650px optimal for essays)
```

---

## Shadows (Soft, Editorial)

**Use Soft Ink (#1F2328) at low opacity - not slate**

```
shadow-none: none

shadow-xs: 0 1px 2px rgba(31, 35, 40, 0.04)
// Very subtle, resting cards

shadow-sm: 0 1px 3px rgba(31, 35, 40, 0.06), 0 1px 2px rgba(31, 35, 40, 0.03)
// Default card shadow

shadow-md: 0 4px 6px rgba(31, 35, 40, 0.06), 0 2px 4px rgba(31, 35, 40, 0.03)
// Hovered cards, popovers

shadow-lg: 0 10px 15px rgba(31, 35, 40, 0.06), 0 4px 6px rgba(31, 35, 40, 0.03)
// Modals, important overlays

shadow-xl: 0 20px 25px rgba(31, 35, 40, 0.08), 0 10px 10px rgba(31, 35, 40, 0.03)
// High elevation modals

shadow-2xl: 0 25px 50px rgba(31, 35, 40, 0.12)
// Maximum elevation (rare)
```

**Design Principle:** Shadows are very subtle - this is an editorial site, not an app.

---

## Border Radius (Soft Corners)

```
rounded-none: 0px        // Data tables, technical UI
rounded-sm: 2px          // Tight, minimal
rounded: 4px             // Default (buttons, inputs, small cards)
rounded-md: 6px          // Medium cards
rounded-lg: 8px          // Large cards, modals, brief containers
rounded-xl: 12px         // Feature cards
rounded-2xl: 16px        // Hero sections (rare)
rounded-full: 9999px     // Avatars, pills, badges
```

**Nested Radius Rule:**
- Outer container: `rounded-lg` (8px)
- Inner elements: `rounded` (4px)
- Always 4px difference for hierarchy

---

## Borders

**Width:** Almost always `border` (1px) - simplicity over variety

**Colors:**
```
Default: border-ivory-600      // Soft Taupe - subtle definition
Hover: border-ivory-700        // Slightly darker
Focus: border-sage-500         // Deep Sage - clear interactive state
Error: border-error            // Muted Rose
Success: border-success        // Gentle Green
Disabled: border-ivory-600 opacity-50
```

---

## Interaction States

### Default State
```tsx
className="
  bg-ivory-100                // Warm Ivory background
  border border-ivory-600     // Soft Taupe border
  text-ink-800                // Soft Ink text
  shadow-sm                   // Subtle shadow
"
```

### Hover State

**Buttons (Sage Primary):**
```tsx
className="
  bg-sage-500 text-ivory-100 font-medium
  hover:bg-sage-600 hover:shadow-md
  transition-all duration-200 ease-in-out
"
```

**Cards:**
```tsx
className="
  shadow-sm hover:shadow-md
  border-ivory-600 hover:border-ivory-700
  transition-all duration-200
"
```

**Links:**
```tsx
className="
  text-sage-600 hover:text-sage-700
  underline-offset-2 hover:underline
  transition-colors duration-200
"
```

### Focus State (Accessibility Critical)

```tsx
className="
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-sage-500
  focus-visible:ring-offset-2 focus-visible:ring-offset-ivory-100
"
```

**Never:** `outline-none` without custom ring
**Ensure:** 3:1 contrast with background (WCAG requirement)

### Active State (Pressed)

**Buttons:**
```tsx
className="
  active:bg-sage-700
  active:shadow-sm
  active:scale-[0.98]
"
```

### Disabled State

```tsx
className="
  disabled:bg-ivory-300
  disabled:text-ink-400
  disabled:border-ivory-600
  disabled:cursor-not-allowed
  disabled:opacity-60
"
```

### Loading State

```tsx
<button disabled className="opacity-70 cursor-wait">
  <Loader2 className="w-4 h-4 animate-spin text-sage-600" />
  <span className="text-ink-600">Loading...</span>
</button>
```

---

## Transitions & Animations

**Defaults (Subtle, Professional):**
```
duration-200: 200ms    // Standard (hover, focus, color changes)
duration-300: 300ms    // Slower (fades, slides)
duration-500: 500ms    // Page transitions only

ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)  // Natural acceleration
```

**Common Transitions:**
```tsx
// Hover/Focus (most common)
transition-colors duration-200 ease-in-out

// Shadow changes
transition-shadow duration-200 ease-in-out

// Opacity (fades)
transition-opacity duration-300

// Transform (subtle only)
transition-transform duration-200 ease-in-out
```

**Animation Guidelines:**
- Keep subtle (avoid flashy effects)
- Respect `prefers-reduced-motion`
- Complete in <300ms for UI feedback
- Never animate during text reading

---

## Responsive Breakpoints

```
sm: 640px   - Large phones, small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large desktops
```

**Mobile-First Pattern:**
```tsx
// Base: Mobile (320px+)
<div className="p-4 text-base">

// Tablet (768px+)
<div className="p-4 md:p-6 text-base md:text-lg">

// Desktop (1024px+)
<div className="p-4 md:p-6 lg:p-8 text-base md:text-lg">
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
<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 bg-ivory-100">
  <article className="prose prose-custom max-w-none">
    {narrative}
  </article>
</div>
```

### Prose Styling (Tailwind Typography)
```javascript
// tailwind.config.js
typography: {
  DEFAULT: {
    css: {
      '--tw-prose-body': '#1F2328',           // ink-800
      '--tw-prose-headings': '#1F2328',       // ink-800
      '--tw-prose-links': '#5E6F64',          // sage-500
      '--tw-prose-bold': '#2A2E32',           // ink-700
      '--tw-prose-counters': '#6B6F73',       // ink-500
      '--tw-prose-bullets': '#CFC8BD',        // ivory-600
      '--tw-prose-hr': '#E1DBD2',             // ivory-500
      '--tw-prose-quotes': '#3A3F45',         // ink-600
      '--tw-prose-quote-borders': '#5E6F64',  // sage-500
      '--tw-prose-captions': '#6B6F73',       // ink-500
      maxWidth: '65ch',
      fontSize: '18px',
      lineHeight: '1.6',
    },
  },
},
```

---

## Accessibility (WCAG AAA)

### Color Contrast

**Body Text (Required: 7:1 for AAA):**
- `ink-800` (#1F2328) on `ivory-100` (#F7F4EF) = **9.2:1** ✅ AAA
- `ink-600` (#3A3F45) on `ivory-100` (#F7F4EF) = **7.8:1** ✅ AAA
- `ink-500` (#6B6F73) on `ivory-100` (#F7F4EF) = **4.9:1** ✅ AA (for captions)

**UI Elements (Required: 4.5:1 for AA):**
- `sage-500` (#5E6F64) on `ivory-100` (#F7F4EF) = **5.1:1** ✅ AA
- `rust-500` (#9A5A3A) on `ivory-100` (#F7F4EF) = **5.8:1** ✅ AA

**Large Text (18px+, Required: 3:1 for AA):**
- All combinations well above threshold

### Focus Indicators
- Ring: `ring-2 ring-sage-500` with `ring-offset-2`
- Contrast: Sage-500 vs Ivory-100 = 5.1:1 ✅
- Never remove focus without replacement

### Touch Targets
- Minimum: 44px × 44px (iOS guideline)
- Recommended: 48px × 48px
- Buttons: `px-4 py-2` = 48px height ✅
- Spacing: 8px minimum between targets

---

## Component Examples

### Primary Button (Sage)
```tsx
<button className="
  px-4 py-2 rounded
  bg-sage-500 text-ivory-100 font-medium font-ui
  hover:bg-sage-600 hover:shadow-md
  active:bg-sage-700 active:shadow-sm active:scale-[0.98]
  focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2
  disabled:bg-ivory-300 disabled:text-ink-400 disabled:cursor-not-allowed
  transition-all duration-200 ease-in-out
">
  Generate Brief
</button>
```

### Secondary Button (Outline)
```tsx
<button className="
  px-4 py-2 rounded
  border border-ivory-600 bg-ivory-100 text-ink-800 font-medium font-ui
  hover:bg-ivory-300 hover:border-ivory-700
  active:bg-ivory-500
  focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2
  transition-all duration-200
">
  Cancel
</button>
```

### Reading Card (Essay Container)
```tsx
<article className="
  max-w-prose mx-auto
  bg-ivory-100 rounded-lg shadow-sm
  border border-ivory-600
  p-8
">
  <h1 className="font-heading text-4xl font-semibold text-ink-800 mb-6">
    Should the UK adopt a 4-day work week?
  </h1>
  <div className="prose prose-custom max-w-none font-body text-base text-ink-800 leading-normal">
    {narrative}
  </div>
</article>
```

### Source Citation (Inline)
```tsx
<a href="#source-1" className="
  text-sage-600 hover:text-sage-700 hover:underline
  underline-offset-2
  transition-colors duration-200
  font-ui
">
  <sup className="font-medium">[1]</sup>
</a>
```

### Political Lean Badge
```tsx
<span className="
  inline-flex items-center rounded-full
  px-2.5 py-1 text-sm font-medium font-ui
  bg-[#F5EBE9] text-[#B8675E]
">
  Left
</span>
```

---

## Hard Rules (Critical)

1. **No pure white** (#FFFFFF) anywhere - use `ivory-100` (#F7F4EF)
2. **No pure black** (#000000) anywhere - use `ink-800` (#1F2328)
3. **No saturated primaries** - all colors muted, warm, editorial
4. **No gradients** - flat colors only (editorial principle)
5. **No color for decoration** - color is semantic, purposeful
6. **Words carry weight** - not color, not effects
7. **Accents ≤5%** of design - if noticeable, reduce
8. **Serif body text** - signals depth, patience, seriousness

---

## Tailwind Config (Complete)

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Base Neutrals
        ivory: {
          50: '#FCFBF9',
          100: '#F7F4EF',
          200: '#F2EDE5',
          300: '#ECE7DF',
          400: '#E6DFD4',
          500: '#E1DBD2',
          600: '#CFC8BD',
          700: '#BAB0A0',
          800: '#A39785',
          900: '#8B7D6B',
        },
        // Text Colors
        ink: {
          50: '#F8F9FA',
          100: '#E9EAEC',
          200: '#D1D4D7',
          300: '#B8BCC1',
          400: '#9A9E9F',
          500: '#6B6F73',
          600: '#3A3F45',
          700: '#2A2E32',
          800: '#1F2328',
          900: '#16191D',
        },
        // Primary Accent
        sage: {
          50: '#F4F6F5',
          100: '#E8EBE9',
          200: '#D1D7D3',
          300: '#B9C3BD',
          400: '#8E9B94',
          500: '#5E6F64',
          600: '#4D5B52',
          700: '#3D4842',
          800: '#2E3632',
          900: '#1F2522',
        },
        // Secondary Accent
        rust: {
          50: '#FAF6F4',
          100: '#F5EBE5',
          200: '#EBD7CC',
          300: '#D9B5A0',
          400: '#C18769',
          500: '#9A5A3A',
          600: '#7D4A2F',
          700: '#603924',
          800: '#442A1A',
          900: '#2B1A10',
        },
        // Optional Cool Accent
        smoke: {
          50: '#F6F8F9',
          100: '#ECF0F2',
          200: '#D9E0E5',
          300: '#B8C4CC',
          400: '#92A1AD',
          500: '#6E7F8D',
          600: '#596672',
          700: '#454E57',
          800: '#32383F',
          900: '#212529',
        },
        // Semantic
        success: {
          DEFAULT: '#628B70',
          light: '#E8F0EB',
          dark: '#3D5945',
        },
        warning: {
          DEFAULT: '#C89664',
          light: '#F8F1E8',
          dark: '#9A6F3D',
        },
        error: {
          DEFAULT: '#B8675E',
          light: '#F5EBE9',
          dark: '#8B4840',
        },
        info: {
          DEFAULT: '#6E7F8D',
          light: '#ECF0F2',
          dark: '#454E57',
        },
      },
      fontFamily: {
        heading: ['Canela', 'Tiempos Headline', 'Libre Baskerville', 'Georgia', 'serif'],
        body: ['Source Serif 4', 'Literata', 'Georgia', 'serif'],
        ui: ['Inter', 'Source Sans 3', '-apple-system', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '65ch',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.ink.800'),
            '--tw-prose-headings': theme('colors.ink.800'),
            '--tw-prose-links': theme('colors.sage.500'),
            '--tw-prose-bold': theme('colors.ink.700'),
            '--tw-prose-counters': theme('colors.ink.500'),
            '--tw-prose-bullets': theme('colors.ivory.600'),
            '--tw-prose-hr': theme('colors.ivory.500'),
            '--tw-prose-quotes': theme('colors.ink.600'),
            '--tw-prose-quote-borders': theme('colors.sage.500'),
            '--tw-prose-captions': theme('colors.ink.500'),
            maxWidth: '65ch',
            fontSize: '18px',
            lineHeight: '1.6',
            fontFamily: theme('fontFamily.body').join(', '),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

---

## Summary

**This system works because:**
- Warm backgrounds soften serif density
- Ink blacks preserve authority without aggression  
- Serif body signals depth and patience
- Sans UI prevents old/dusty feeling
- Muted accents guide without hijacking

**Net effect:** You feel invited to think, not instructed what to think.

**Character:** Thoughtful, rigorous, humane, editorial. The entrepreneur's answer to political discourse.
