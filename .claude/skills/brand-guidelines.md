# Brand Guidelines Skill

You are implementing the **State of Clarity** brand identity. Every UI element must reflect these guidelines precisely.

---

## Brand Identity

### Mission
> "See politics clearly. Decide wisely."

State of Clarity exists to raise the quality of political debate by delivering evidence-rich, transparent policy analysis that adapts to any reader's level.

### Brand Personality
- **Trustworthy** - Neutral, factual, never sensational
- **Intelligent** - Sophisticated but accessible
- **Transparent** - Shows its work, cites sources, admits uncertainty
- **Empowering** - Helps users think, doesn't tell them what to think

### Voice & Tone
- Clear, direct language
- Avoid jargon unless defining it
- Never partisan or inflammatory
- Academic rigor with accessible delivery
- Confident but humble ("evidence suggests" not "this proves")

---

## Visual Identity

### Color System

#### Primary Palette
```css
/* Clarity Gradient - Primary brand element */
--clarity-gradient: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%);
/* Purple → Violet - represents clarity through complexity */

/* Primary Actions */
--primary: 262 83% 58%;           /* #7c3aed - Violet 600 */
--primary-foreground: 0 0% 100%;  /* White */

/* Secondary */
--secondary: 220 14% 96%;         /* Soft gray */
--secondary-foreground: 222 47% 11%; /* Near black */
```

#### Semantic Colors
```css
/* Political Lean Indicators - CRITICAL for source tagging */
--lean-left: 217 91% 60%;         /* #3b82f6 - Blue */
--lean-center: 215 16% 47%;       /* #64748b - Slate */
--lean-right: 0 84% 60%;          /* #ef4444 - Red */

/* Clarity Score Indicators */
--score-high: 142 76% 36%;        /* #16a34a - Green (8-10) */
--score-medium: 45 93% 47%;       /* #eab308 - Yellow (5-7) */
--score-low: 0 84% 60%;           /* #ef4444 - Red (0-4) */

/* Feedback */
--success: 142 76% 36%;
--warning: 45 93% 47%;
--error: 0 84% 60%;
--info: 217 91% 60%;
```

#### Background & Surface
```css
/* Light Mode */
--background: 0 0% 100%;          /* Pure white */
--foreground: 222 47% 11%;        /* Near black */
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;
--muted: 220 14% 96%;             /* Light gray */
--muted-foreground: 215 16% 47%;  /* Medium gray */
--border: 220 13% 91%;            /* Subtle border */

/* Dark Mode */
--background: 222 47% 11%;        /* Deep navy-black */
--foreground: 210 40% 98%;        /* Off-white */
--card: 222 47% 13%;
--muted: 217 33% 17%;
--border: 217 33% 20%;
```

### Typography

#### Font Stack
```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", monospace;
```

#### Type Scale
```css
/* Headings - Inter Medium/Semibold */
.h1 { font-size: 2.25rem; line-height: 2.5rem; font-weight: 600; }  /* 36px - Page titles */
.h2 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 600; } /* 30px - Section headers */
.h3 { font-size: 1.5rem; line-height: 2rem; font-weight: 500; }      /* 24px - Card titles */
.h4 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 500; }  /* 20px - Subsections */

/* Body - Inter Regular */
.body-lg { font-size: 1.125rem; line-height: 1.75rem; }  /* 18px - Lead paragraphs */
.body { font-size: 1rem; line-height: 1.5rem; }          /* 16px - Default body */
.body-sm { font-size: 0.875rem; line-height: 1.25rem; }  /* 14px - Captions, meta */

/* Labels */
.label { font-size: 0.875rem; font-weight: 500; }
.caption { font-size: 0.75rem; color: var(--muted-foreground); }
```

#### Text Colors
- **Primary text**: `text-foreground` - Main content
- **Secondary text**: `text-muted-foreground` - Supporting info, timestamps
- **Links**: `text-primary hover:underline` - Actions, navigation
- **Inverted**: `text-primary-foreground` - On colored backgrounds

---

## Component Styling

### Buttons

```tsx
// Primary - Main CTAs
<Button className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white shadow-lg shadow-violet-500/25">
  Generate Brief
</Button>

// Secondary - Supporting actions
<Button variant="outline" className="border-border hover:bg-muted">
  View Sources
</Button>

// Ghost - Tertiary actions
<Button variant="ghost" className="text-muted-foreground hover:text-foreground">
  Learn More
</Button>
```

### Cards

```tsx
// Brief Card
<Card className="group relative overflow-hidden border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-200">
  {/* Subtle gradient on hover */}
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

  <CardHeader>
    <div className="flex items-center justify-between">
      <Badge variant="outline">{topic}</Badge>
      <ClarityScoreBadge score={score} />
    </div>
    <CardTitle className="text-xl">{title}</CardTitle>
  </CardHeader>

  <CardContent>
    <p className="text-muted-foreground line-clamp-3">{summary}</p>
  </CardContent>
</Card>
```

### Clarity Score Display

```tsx
// Score Badge - Colored by range
function ClarityScoreBadge({ score }: { score: number }) {
  const variant = score >= 8 ? "high" : score >= 5 ? "medium" : "low";

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
      variant === "high" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      variant === "medium" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      variant === "low" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    )}>
      <Sparkles className="h-3.5 w-3.5" />
      <span>{score.toFixed(1)}</span>
    </div>
  );
}
```

### Source Tags

```tsx
// Political Lean Indicator
function SourceTag({ lean }: { lean: "left" | "center" | "right" }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
      lean === "left" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      lean === "center" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      lean === "right" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    )}>
      {lean === "left" && "Left"}
      {lean === "center" && "Center"}
      {lean === "right" && "Right"}
    </span>
  );
}
```

### Reading Level Tabs

```tsx
// Progressive Summary Tabs
<Tabs defaultValue="teen" className="w-full">
  <TabsList className="grid w-full grid-cols-4 bg-muted">
    <TabsTrigger value="child" className="data-[state=active]:bg-background">
      <span className="hidden sm:inline">Simplified</span>
      <span className="sm:hidden">ELI5</span>
    </TabsTrigger>
    <TabsTrigger value="teen">Teen</TabsTrigger>
    <TabsTrigger value="undergrad">Undergrad</TabsTrigger>
    <TabsTrigger value="postdoc">Expert</TabsTrigger>
  </TabsList>

  <TabsContent value="child" className="prose prose-sm mt-4">
    {summaries.child}
  </TabsContent>
  {/* ... other levels */}
</Tabs>
```

---

## Layout Patterns

### Page Structure
```tsx
// Standard page layout
<main className="min-h-screen bg-background">
  {/* Hero with gradient */}
  <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background">
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Content */}
    </div>
  </section>

  {/* Content sections */}
  <section className="container mx-auto px-4 py-12">
    {/* Grid of cards */}
  </section>
</main>
```

### Container Widths
```css
/* Content containers */
.container { max-width: 1280px; margin: 0 auto; }
.prose { max-width: 65ch; }  /* Reading content */
.narrow { max-width: 640px; } /* Forms, focused content */
```

### Spacing System
```css
/* Use Tailwind spacing scale consistently */
/* Sections: py-12 md:py-16 lg:py-24 */
/* Cards: p-4 md:p-6 */
/* Component gaps: gap-4 or gap-6 */
/* Text spacing: space-y-4 for paragraphs */
```

---

## Iconography

Use **Lucide React** exclusively. Preferred icons for common actions:

| Concept | Icon | Usage |
|---------|------|-------|
| Search | `<Search />` | Query input |
| Clarity Score | `<Sparkles />` | Quality indicator |
| Sources | `<BookOpen />` | Citations |
| Expand | `<ChevronDown />` | Accordions |
| External Link | `<ExternalLink />` | Opens new tab |
| Info | `<Info />` | Tooltips, help |
| Check | `<Check />` | Success, valid |
| Warning | `<AlertTriangle />` | Caution |
| Error | `<AlertCircle />` | Problems |
| Loading | `<Loader2 className="animate-spin" />` | Async states |
| Left lean | `<ArrowLeft />` | Political indicator |
| Right lean | `<ArrowRight />` | Political indicator |
| Feedback | `<ThumbsUp />` / `<ThumbsDown />` | User reactions |

Icon sizing:
- Inline with text: `h-4 w-4`
- Buttons: `h-5 w-5`
- Hero/empty states: `h-12 w-12`

---

## Motion & Animation

### Transitions
```css
/* Default transition for interactive elements */
transition-all duration-200 ease-out

/* Slower for layout changes */
transition-all duration-300 ease-in-out
```

### Entrance Animations
```tsx
// Fade up on scroll/load
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
/>

// Stagger children
items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.05 }}
  />
))
```

### Loading States
```tsx
// Skeleton with pulse
<Skeleton className="h-4 w-full animate-pulse bg-muted" />

// Spinner
<Loader2 className="h-5 w-5 animate-spin text-primary" />
```

---

## Do's and Don'ts

### DO:
- Use the clarity gradient for primary CTAs and hero sections
- Show political lean clearly but neutrally (colors, not judgment)
- Display clarity scores prominently
- Maintain generous whitespace
- Use consistent border radius (`rounded-lg` for cards, `rounded-md` for buttons)

### DON'T:
- Use partisan language or framing
- Hide source political leanings
- Use harsh reds/greens that imply good/bad for political positions
- Clutter the interface - clarity means simplicity
- Use decorative elements that don't serve a purpose

---

## Brand Assets

### Logo Usage
- Primary: "State of Clarity" wordmark in Inter Semibold
- Icon: Stylized compass or lens (if created)
- Minimum clear space: 1x height of logo on all sides

### Gradient Applications
```css
/* Hero backgrounds */
.hero-gradient {
  background: linear-gradient(135deg,
    hsl(262 83% 95%) 0%,
    hsl(0 0% 100%) 100%
  );
}

/* Text gradient (sparingly) */
.text-gradient {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Button gradient */
.btn-gradient {
  background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%);
}
```

---

**Remember: State of Clarity is a tool for understanding, not persuasion. Every design decision should promote transparency, trust, and clarity.**
