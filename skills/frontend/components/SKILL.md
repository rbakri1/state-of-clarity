---
name: state-of-clarity-components
description: Component architecture and implementation patterns for State of Clarity. Use when building any React component. Defines file organization, TypeScript conventions, key component patterns (ReadingLevelSelector, SummaryCard, SourceCitation, BriefGenerationProgress, ClarityScoreVisualizer), composition patterns, state management, accessibility requirements (WCAG AAA, keyboard nav, ARIA), and testing standards.
---

# State of Clarity - Component Standards

## Core Philosophy

**Progressive Disclosure:** Start simple (child level), reveal depth on demand
**Source Transparency:** Every claim linked, metadata always visible
**Accessibility:** Serve 8-year-olds and PhD researchers equally (WCAG AAA)
**Evidence Over Opinion:** Data viz clear, uncertainty explicit

---

## File Organization

```
components/
├── ui/              # shadcn/ui base components
├── brief/           # Reading interface components
│   ├── brief-viewer.tsx
│   ├── reading-level-selector.tsx
│   ├── summary-card.tsx
│   └── narrative-viewer.tsx
├── sources/         # Citation transparency
│   ├── source-citation.tsx
│   ├── source-card.tsx
│   ├── political-lean-badge.tsx
│   └── credibility-badge.tsx
├── generation/      # Brief generation UI
│   ├── generation-progress.tsx
│   └── agent-status-display.tsx
└── feedback/        # Community features
    ├── upvote-downvote.tsx
    └── suggest-source-modal.tsx
```

---

## TypeScript Conventions

### Core Types

```typescript
// lib/types/brief.ts

export type ReadingLevel = 'child' | 'teen' | 'undergrad' | 'postdoc';

export type PoliticalLean = 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';

export interface Source {
  id: string;
  url: string;
  title: string;
  political_lean: PoliticalLean;
  credibility_score: number; // 0-10
  source_type: 'primary' | 'secondary' | 'tertiary';
  is_paywalled: boolean;
}

export interface ReadingLevelSummary {
  level: ReadingLevel;
  content: string;
  word_count: number;
  reading_time_minutes: number;
}

export interface Brief {
  id: string;
  question: string;
  summaries: ReadingLevelSummary[];
  narrative: string;
  clarity_score: ClarityScore;
  sources: Source[];
}
```

### Props Interfaces

```typescript
interface BriefViewerProps {
  /** The brief to display */
  brief: Brief;
  /** Initial reading level */
  initialLevel?: ReadingLevel;
  /** Show source sidebar */
  showSources?: boolean;
  /** Callback on level change */
  onLevelChange?: (level: ReadingLevel) => void;
  className?: string;
}
```

**Rules:**
- Always explicit types
- Use unions (`'child' | 'teen'` not `string`)
- Document complex props with JSDoc
- Prefer interfaces over types for props

---

## Key Component Patterns

### 1. Reading Level Selector

**Purpose:** Switch between 4 reading levels

```typescript
import { cn } from '@/lib/utils';
import type { ReadingLevel } from '@/lib/types/brief';

interface ReadingLevelSelectorProps {
  currentLevel: ReadingLevel;
  onLevelChange: (level: ReadingLevel) => void;
  className?: string;
}

const LEVELS = [
  { value: 'child', label: 'Child', audience: '8-12 years' },
  { value: 'teen', label: 'Teen', audience: '13-17 years' },
  { value: 'undergrad', label: 'Undergrad', audience: '18-22 years' },
  { value: 'postdoc', label: 'Postdoc', audience: 'Graduate+' },
] as const;

export function ReadingLevelSelector({
  currentLevel,
  onLevelChange,
  className,
}: ReadingLevelSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Reading level selector"
      className={cn(
        'sticky top-4 z-20',
        'flex flex-col gap-2 sm:flex-row sm:gap-1',
        'bg-white rounded-lg shadow-sm border border-slate-200 p-2',
        className
      )}
    >
      {LEVELS.map((level) => (
        <button
          key={level.value}
          role="tab"
          aria-selected={currentLevel === level.value}
          onClick={() => onLevelChange(level.value as ReadingLevel)}
          className={cn(
            'px-4 py-3 rounded-md transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-clarity-500',
            currentLevel === level.value
              ? 'bg-clarity-500 text-white font-semibold shadow-md'
              : 'bg-transparent text-slate-600 hover:bg-slate-50 font-medium'
          )}
        >
          <div className="flex flex-col">
            <span className="text-sm uppercase">{level.label}</span>
            <span className="text-xs opacity-90">{level.audience}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
```

**Key Features:**
- ARIA roles (tablist, tab, aria-selected)
- Sticky positioning (stays visible while reading)
- Responsive (vertical on mobile, horizontal on desktop)
- Clear active state

---

### 2. Summary Card (Reading Levels)

**Purpose:** Display summary with proper typography per level

```typescript
const LEVEL_STYLES: Record<ReadingLevel, { text: string; lineHeight: string }> = {
  child: { text: 'text-lg', lineHeight: 'leading-relaxed' },
  teen: { text: 'text-base', lineHeight: 'leading-relaxed' },
  undergrad: { text: 'text-base', lineHeight: 'leading-normal' },
  postdoc: { text: 'text-sm', lineHeight: 'leading-normal' },
};

export function SummaryCard({ 
  summary, 
  isActive 
}: { 
  summary: ReadingLevelSummary; 
  isActive: boolean 
}) {
  const styles = LEVEL_STYLES[summary.level];

  return (
    <div
      id={`panel-${summary.level}`}
      role="tabpanel"
      hidden={!isActive}
      className="prose prose-slate max-w-prose mx-auto animate-in fade-in duration-300"
    >
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Clock className="w-4 h-4" />
        <span>{summary.reading_time_minutes} min read</span>
      </div>

      <div
        className={cn(styles.text, styles.lineHeight, 'text-slate-600')}
        dangerouslySetInnerHTML={{ __html: summary.content }}
      />
    </div>
  );
}
```

---

### 3. Source Citation (Inline)

**Purpose:** Link claims to sources in narrative

```typescript
const LEAN_COLORS: Record<PoliticalLean, string> = {
  left: 'text-rose-600',
  'center-left': 'text-pink-500',
  center: 'text-slate-500',
  'center-right': 'text-blue-500',
  right: 'text-blue-600',
  unknown: 'text-slate-400',
};

export function SourceCitation({ 
  source, 
  citationNumber 
}: { 
  source: Source; 
  citationNumber: number 
}) {
  return (
    <a
      href={`#source-${source.id}`}
      className={cn(
        'inline-flex items-baseline no-underline hover:underline',
        'transition-colors duration-200',
        LEAN_COLORS[source.political_lean]
      )}
      aria-label={`Source ${citationNumber}: ${source.title}`}
    >
      <sup className="font-medium">[{citationNumber}]</sup>
    </a>
  );
}
```

**Design:**
- Superscript number
- Color-coded by political lean (subtle)
- Hover shows underline
- Jumps to source details on click

---

### 4. Political Lean Badge

```typescript
const LEAN_CONFIG: Record<PoliticalLean, { 
  label: string; 
  color: string; 
  bg: string 
}> = {
  left: { label: 'Left', color: 'text-rose-700', bg: 'bg-rose-100' },
  'center-left': { label: 'Center-Left', color: 'text-pink-700', bg: 'bg-pink-100' },
  center: { label: 'Center', color: 'text-slate-700', bg: 'bg-slate-100' },
  'center-right': { label: 'Center-Right', color: 'text-blue-700', bg: 'bg-blue-100' },
  right: { label: 'Right', color: 'text-blue-800', bg: 'bg-blue-100' },
  unknown: { label: 'Unknown', color: 'text-slate-600', bg: 'bg-slate-50' },
};

export function PoliticalLeanBadge({ lean }: { lean: PoliticalLean }) {
  const config = LEAN_CONFIG[lean];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium',
        config.bg,
        config.color
      )}
      title={`Political lean: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
```

---

### 5. Credibility Badge

```typescript
function getCredibilityConfig(score: number) {
  if (score >= 8) return {
    icon: ShieldCheck,
    label: 'Highly Credible',
    color: 'text-green-700',
    bg: 'bg-green-100',
  };
  if (score >= 5) return {
    icon: Shield,
    label: 'Moderately Credible',
    color: 'text-amber-700',
    bg: 'bg-amber-100',
  };
  return {
    icon: ShieldAlert,
    label: 'Lower Credibility',
    color: 'text-rose-700',
    bg: 'bg-rose-100',
  };
}

export function CredibilityBadge({ score }: { score: number }) {
  const config = getCredibilityConfig(score);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium',
        config.bg,
        config.color
      )}
      title={`${config.label}: ${score}/10`}
    >
      <Icon className="w-4 h-4" />
      <span>{score}/10</span>
    </span>
  );
}
```

---

### 6. Brief Generation Progress

**Purpose:** Show real-time progress (30-60s generation)

```typescript
const STAGES = [
  { name: 'research', icon: Search, label: 'Researching sources' },
  { name: 'structure', icon: ListTree, label: 'Extracting key factors' },
  { name: 'summary', icon: BookOpen, label: 'Generating summaries' },
  { name: 'narrative', icon: PenLine, label: 'Writing narrative' },
  { name: 'scoring', icon: Target, label: 'Calculating clarity score' },
];

export function BriefGenerationProgress({
  currentStage,
  progress,
  estimatedSecondsRemaining,
}: {
  currentStage: string;
  progress: number; // 0-100
  estimatedSecondsRemaining: number;
}) {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-center mb-2">
        Generating Your Brief
      </h3>
      <p className="text-sm text-slate-500 text-center mb-6">
        ~{estimatedSecondsRemaining}s remaining
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full mb-6">
        <div
          className="h-full bg-clarity-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage, index) => {
          const isActive = stage.name === currentStage;
          const isComplete = STAGES.findIndex(s => s.name === currentStage) > index;
          const Icon = stage.icon;

          return (
            <div
              key={stage.name}
              className={cn(
                'flex items-center gap-3 p-3 rounded-md transition-colors',
                isActive && 'bg-clarity-50 border border-clarity-200'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isActive && 'bg-clarity-500 text-white',
                isComplete && 'bg-green-500 text-white',
                !isActive && !isComplete && 'bg-slate-200 text-slate-500'
              )}>
                {isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
              </div>
              <p className={cn(
                'text-sm font-medium',
                isActive && 'text-clarity-700'
              )}>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Real-Time Updates:**
- Use Server-Sent Events or polling
- Update every 2-5 seconds
- Smooth animations
- Clear error states

---

## Accessibility Standards (Mandatory)

### Keyboard Navigation
- Tab through all interactive elements
- Arrow keys for tabs/selectors
- Enter/Space to activate
- Escape to close modals

### Screen Reader Support
```tsx
// Semantic HTML
<button onClick={handleClick}>Submit</button> // GOOD
<div role="button">Submit</div> // AVOID

// ARIA labels
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// Live regions
<div role="status" aria-live="polite">
  {currentStage}: {progress}%
</div>
```

### Color Contrast (WCAG AAA)
- Body text: 8.7:1 (slate-600 on slate-50) ✅
- Headings: 13.3:1 (slate-800 on slate-50) ✅
- Never use color alone (add icons + text)

### Touch Targets
- Minimum: 44px × 44px
- Buttons: `px-4 py-2` = 48px height ✅
- Spacing: 8px minimum between targets

---

## Testing Requirements

### Unit Tests (Vitest)

```typescript
import { render, screen } from '@testing-library/react';

describe('ReadingLevelSelector', () => {
  it('renders all 4 levels', () => {
    render(<ReadingLevelSelector currentLevel="child" onLevelChange={() => {}} />);
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('highlights active level', () => {
    render(<ReadingLevelSelector currentLevel="undergrad" onLevelChange={() => {}} />);
    const button = screen.getByRole('tab', { name: /undergrad/i });
    expect(button).toHaveClass('bg-clarity-500');
  });
});
```

### Accessibility Tests

```typescript
import { axe } from 'jest-axe';

it('has no a11y violations', async () => {
  const { container } = render(<BriefViewer brief={mockBrief} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Code Quality Checklist

Before committing:

- [ ] TypeScript: All props typed with interfaces
- [ ] Accessibility: WCAG AAA contrast, keyboard nav, ARIA
- [ ] States: hover, focus, active, disabled, loading implemented
- [ ] Responsive: Mobile, tablet, desktop tested
- [ ] Testing: Unit + accessibility tests
- [ ] Design tokens: Uses design system (no magic values)
- [ ] Source transparency: Citations visible and linked

---

## Anti-Patterns

❌ **Don't:**
- Hide sources or citations
- Use political colors in UI chrome
- Skip reading levels
- Over-simplify child level
- Use color alone for state
- `outline-none` without replacement

✅ **Do:**
- Show all sources with metadata
- Use non-partisan palette
- Support all 4 levels equally
- Respect young readers
- Icons + text + color
- Custom focus rings always
