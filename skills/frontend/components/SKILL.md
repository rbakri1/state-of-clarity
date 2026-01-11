---
name: state-of-clarity-components
description: Component architecture and implementation patterns for State of Clarity. Use when building any React component. Defines file organization, TypeScript conventions, key component patterns with warm editorial palette (Deep Sage, Muted Rust, Soft Ink on Warm Ivory), composition patterns, state management, accessibility requirements (WCAG AAA, keyboard nav, ARIA), and testing standards.
---

# State of Clarity - Component Standards

## Core Philosophy

**Progressive Disclosure:** Start simple (child level), reveal depth on demand
**Source Transparency:** Every claim linked, metadata always visible
**Accessibility:** Serve 8-year-olds and PhD researchers equally (WCAG AAA)
**Evidence Over Opinion:** Data viz clear, uncertainty explicit
**Editorial Authority:** Warm neutrals, serif body, quiet professionalism

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
  published_at?: string;
}

export interface ReadingLevelSummary {
  level: ReadingLevel;
  content: string;
  word_count: number;
  reading_time_minutes: number;
}

export interface ClarityScore {
  overall: number; // 0-10
  dimensions: {
    first_principles: number;
    internal_consistency: number;
    evidence_quality: number;
    accessibility: number;
    objectivity: number;
  };
  critique: string;
}

export interface Brief {
  id: string;
  question: string;
  summaries: ReadingLevelSummary[];
  narrative: string;
  structured_data: StructuredData;
  clarity_score: ClarityScore;
  sources: Source[];
  created_at: string;
  updated_at: string;
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
- Prefer interfaces over types for component props

---

## Key Component Patterns

### 1. Reading Level Selector

**Purpose:** Switch between 4 reading levels with sticky navigation

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
        'bg-ivory-100 rounded-lg shadow-sm border border-ivory-600 p-2',
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
            'px-4 py-3 rounded-md font-ui transition-all duration-200',
            'focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
            currentLevel === level.value
              ? 'bg-sage-500 text-ivory-100 font-semibold shadow-md'
              : 'bg-transparent text-ink-600 hover:bg-ivory-300 font-medium'
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
- Clear active state with Deep Sage background
- Warm Ivory base, Soft Ink text

---

### 2. Summary Card (Reading Levels)

**Purpose:** Display summary with proper typography per level

```typescript
import { Clock } from 'lucide-react';
import type { ReadingLevel, ReadingLevelSummary } from '@/lib/types/brief';

const LEVEL_STYLES: Record<ReadingLevel, { text: string; lineHeight: string }> = {
  child: { text: 'text-lg', lineHeight: 'leading-relaxed' },      // 19px, 1.65
  teen: { text: 'text-base', lineHeight: 'leading-normal' },      // 18px, 1.6
  undergrad: { text: 'text-base', lineHeight: 'leading-normal' }, // 18px, 1.6
  postdoc: { text: 'text-base', lineHeight: 'leading-snug' },     // 18px, 1.55
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
      className="prose prose-custom max-w-prose mx-auto animate-in fade-in duration-300"
    >
      <div className="flex items-center gap-2 text-sm text-ink-500 font-ui mb-4">
        <Clock className="w-4 h-4" />
        <span>{summary.reading_time_minutes} min read</span>
      </div>

      <div
        className={cn(
          styles.text,
          styles.lineHeight,
          'text-ink-800 font-body'
        )}
        dangerouslySetInnerHTML={{ __html: summary.content }}
      />
    </div>
  );
}
```

**Design Notes:**
- Typography scales per level (child gets more line-height)
- Soft Ink text on Warm Ivory background
- Meta text uses Stone Grey (ink-500)
- Source Serif 4 font for body readability

---

### 3. Source Citation (Inline)

**Purpose:** Link claims to sources in narrative with political lean color coding

```typescript
import type { Source, PoliticalLean } from '@/lib/types/brief';

const LEAN_COLORS: Record<PoliticalLean, string> = {
  left: 'text-[#C85C6B]',          // Muted rose
  'center-left': 'text-[#D9A0A0]', // Soft pink
  center: 'text-ink-400',          // Ash grey
  'center-right': 'text-[#7FA5B8]',// Soft blue
  right: 'text-[#6B8FB3]',         // Muted blue
  unknown: 'text-ivory-600',       // Soft taupe
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
        'underline-offset-2',
        'transition-colors duration-200',
        'font-ui',
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
- Color-coded by political lean (very subtle, non-partisan)
- Hover shows underline
- Jumps to source details on click
- Uses muted rose→grey→blue spectrum (not flag red/blue)

---

### 4. Source Card (Full Details)

**Purpose:** Display complete source metadata with credibility and lean

```typescript
import { ExternalLink, Lock } from 'lucide-react';
import type { Source } from '@/lib/types/brief';
import { PoliticalLeanBadge } from './political-lean-badge';
import { CredibilityBadge } from './credibility-badge';

export function SourceCard({ 
  source, 
  citationNumber 
}: { 
  source: Source; 
  citationNumber: number 
}) {
  return (
    <div
      id={`source-${source.id}`}
      className="bg-ivory-100 border border-ivory-600 rounded-lg p-6 shadow-sm"
    >
      {/* Citation number badge */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage-500 text-ivory-100 font-ui font-semibold text-sm">
            {citationNumber}
          </span>
          {source.is_paywalled && (
            <Lock className="w-4 h-4 text-ink-400" aria-label="Paywalled content" />
          )}
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sage-600 hover:text-sage-700 transition-colors"
          aria-label={`Open ${source.title} in new tab`}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>

      {/* Title */}
      <h3 className="font-heading text-xl font-semibold text-ink-800 mb-2">
        {source.title}
      </h3>

      {/* Metadata badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <PoliticalLeanBadge lean={source.political_lean} />
        <CredibilityBadge score={source.credibility_score} />
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium font-ui bg-ivory-300 text-ink-600">
          {source.source_type}
        </span>
      </div>

      {/* Publication date */}
      {source.published_at && (
        <p className="text-sm text-ink-500 font-ui">
          Published {new Date(source.published_at).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      )}
    </div>
  );
}
```

---

### 5. Political Lean Badge

```typescript
import type { PoliticalLean } from '@/lib/types/brief';
import { cn } from '@/lib/utils';

const LEAN_CONFIG: Record<PoliticalLean, { 
  label: string; 
  color: string; 
  bg: string 
}> = {
  left: { 
    label: 'Left', 
    color: 'text-[#8B4840]',      // Darker muted rose
    bg: 'bg-[#F5EBE9]'            // Light rose
  },
  'center-left': { 
    label: 'Center-Left', 
    color: 'text-[#9A6F6F]', 
    bg: 'bg-[#F5ECEC]' 
  },
  center: { 
    label: 'Center', 
    color: 'text-ink-600',        // Warm Charcoal
    bg: 'bg-ivory-200' 
  },
  'center-right': { 
    label: 'Center-Right', 
    color: 'text-[#4D6672]', 
    bg: 'bg-[#EBF1F4]' 
  },
  right: { 
    label: 'Right', 
    color: 'text-[#3D5C72]',      // Darker muted blue
    bg: 'bg-[#E8F0F4]'            // Light blue
  },
  unknown: { 
    label: 'Unknown', 
    color: 'text-ink-500',        // Stone Grey
    bg: 'bg-ivory-300' 
  },
};

export function PoliticalLeanBadge({ 
  lean,
  size = 'md' 
}: { 
  lean: PoliticalLean;
  size?: 'sm' | 'md';
}) {
  const config = LEAN_CONFIG[lean];
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium font-ui',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title={`Political lean: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
```

**Design Notes:**
- Uses muted rose→grey→blue spectrum (non-partisan)
- Avoids UK flag red/blue associations
- Subtle background colors for readability
- Size variants for different contexts

---

### 6. Credibility Badge

```typescript
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

function getCredibilityConfig(score: number) {
  if (score >= 8) return {
    icon: ShieldCheck,
    label: 'Highly Credible',
    color: 'text-success-dark',
    bg: 'bg-success-light',
  };
  if (score >= 5) return {
    icon: Shield,
    label: 'Moderately Credible',
    color: 'text-warning-dark',
    bg: 'bg-warning-light',
  };
  return {
    icon: ShieldAlert,
    label: 'Lower Credibility',
    color: 'text-error-dark',
    bg: 'bg-error-light',
  };
}

export function CredibilityBadge({ 
  score,
  size = 'md'
}: { 
  score: number;
  size?: 'sm' | 'md';
}) {
  const config = getCredibilityConfig(score);
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium font-ui',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
      title={`${config.label}: ${score}/10`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{score}/10</span>
    </span>
  );
}
```

---

### 7. Brief Generation Progress

**Purpose:** Show real-time progress (30-60s generation)

```typescript
import { Search, ListTree, BookOpen, PenLine, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="max-w-md mx-auto p-6 bg-ivory-100 rounded-lg shadow-lg border border-ivory-600">
      <h3 className="font-heading text-lg font-semibold text-ink-800 text-center mb-2">
        Generating Your Brief
      </h3>
      <p className="text-sm text-ink-500 font-ui text-center mb-6">
        ~{estimatedSecondsRemaining}s remaining
      </p>

      {/* Progress bar */}
      <div className="h-2 bg-ivory-300 rounded-full mb-6">
        <div
          className="h-full bg-sage-500 transition-all duration-500 rounded-full"
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
                isActive && 'bg-sage-50 border border-sage-200'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                isActive && 'bg-sage-500 text-ivory-100',
                isComplete && 'bg-success text-ivory-100',
                !isActive && !isComplete && 'bg-ivory-300 text-ink-500'
              )}>
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <p className={cn(
                'text-sm font-medium font-ui',
                isActive && 'text-sage-700',
                isComplete && 'text-ink-600',
                !isActive && !isComplete && 'text-ink-500'
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
- Smooth animations with warm editorial colors
- Clear error states

---

### 8. Clarity Score Visualizer

**Purpose:** Show overall clarity score with 5-dimension breakdown

```typescript
import { Target } from 'lucide-react';
import type { ClarityScore } from '@/lib/types/brief';
import { cn } from '@/lib/utils';

function getScoreColor(score: number) {
  if (score >= 8.5) return 'text-success-dark';
  if (score >= 7.0) return 'text-warning-dark';
  return 'text-error-dark';
}

function getScoreBg(score: number) {
  if (score >= 8.5) return 'bg-success-light';
  if (score >= 7.0) return 'bg-warning-light';
  return 'bg-error-light';
}

export function ClarityScoreVisualizer({ 
  score 
}: { 
  score: ClarityScore 
}) {
  const dimensions = [
    { key: 'first_principles', label: 'First-Principles Coherence' },
    { key: 'internal_consistency', label: 'Internal Consistency' },
    { key: 'evidence_quality', label: 'Evidence Quality' },
    { key: 'accessibility', label: 'Accessibility' },
    { key: 'objectivity', label: 'Objectivity' },
  ] as const;

  return (
    <div className="bg-ivory-100 border border-ivory-600 rounded-lg p-6">
      {/* Overall score */}
      <div className="flex items-center gap-4 mb-6">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center',
          getScoreBg(score.overall)
        )}>
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold font-heading',
              getScoreColor(score.overall)
            )}>
              {score.overall.toFixed(1)}
            </div>
            <div className="text-xs text-ink-500 font-ui">/ 10</div>
          </div>
        </div>
        <div>
          <h3 className="font-heading text-xl font-semibold text-ink-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-sage-600" />
            Clarity Score
          </h3>
          <p className="text-sm text-ink-500 font-ui">
            {score.overall >= 8.5 && 'Excellent clarity'}
            {score.overall >= 7.0 && score.overall < 8.5 && 'Good clarity'}
            {score.overall < 7.0 && 'Needs improvement'}
          </p>
        </div>
      </div>

      {/* Dimension breakdown */}
      <div className="space-y-3">
        {dimensions.map(({ key, label }) => {
          const value = score.dimensions[key];
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium font-ui text-ink-700">{label}</span>
                <span className="text-sm font-ui text-ink-600">{value.toFixed(1)}/10</span>
              </div>
              <div className="h-2 bg-ivory-300 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    value >= 8.5 && 'bg-success',
                    value >= 7.0 && value < 8.5 && 'bg-warning',
                    value < 7.0 && 'bg-error'
                  )}
                  style={{ width: `${(value / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI critique */}
      {score.critique && (
        <div className="mt-6 pt-6 border-t border-ivory-600">
          <h4 className="font-ui font-semibold text-sm text-ink-700 mb-2">
            Analysis
          </h4>
          <p className="text-sm text-ink-600 font-ui leading-relaxed">
            {score.critique}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### 9. Upvote/Downvote Component

```typescript
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpvoteDownvote({ 
  briefId,
  upvotes,
  downvotes,
  userVote,
  onVote
}: { 
  briefId: string;
  upvotes: number;
  downvotes: number;
  userVote: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onVote('up')}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-ui text-sm font-medium transition-all',
          'focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
          userVote === 'up'
            ? 'bg-success-light text-success-dark'
            : 'bg-ivory-200 text-ink-600 hover:bg-ivory-300'
        )}
        aria-label={`Upvote (${upvotes})`}
      >
        <ThumbsUp className="w-4 h-4" />
        <span>{upvotes}</span>
      </button>

      <button
        onClick={() => onVote('down')}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-ui text-sm font-medium transition-all',
          'focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
          userVote === 'down'
            ? 'bg-error-light text-error-dark'
            : 'bg-ivory-200 text-ink-600 hover:bg-ivory-300'
        )}
        aria-label={`Downvote (${downvotes})`}
      >
        <ThumbsDown className="w-4 h-4" />
        <span>{downvotes}</span>
      </button>
    </div>
  );
}
```

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
- Body text (ink-800 on ivory-100): **9.2:1** ✅ AAA
- Headings (ink-800 on ivory-100): **9.2:1** ✅ AAA
- Secondary text (ink-600 on ivory-100): **7.8:1** ✅ AAA
- Links (sage-500 on ivory-100): **5.1:1** ✅ AA
- Never use color alone (add icons + text)

### Touch Targets
- Minimum: 44px × 44px (iOS guideline)
- Recommended: 48px × 48px
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

  it('highlights active level with sage background', () => {
    render(<ReadingLevelSelector currentLevel="undergrad" onLevelChange={() => {}} />);
    const button = screen.getByRole('tab', { name: /undergrad/i });
    expect(button).toHaveClass('bg-sage-500');
  });

  it('uses warm ivory base', () => {
    const { container } = render(<ReadingLevelSelector currentLevel="child" onLevelChange={() => {}} />);
    const selector = container.firstChild;
    expect(selector).toHaveClass('bg-ivory-100');
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
- [ ] Colors: Uses warm editorial palette (sage/rust/ivory/ink)
- [ ] Typography: Canela headings, Source Serif body, Inter UI
- [ ] States: hover, focus, active, disabled, loading implemented
- [ ] Responsive: Mobile, tablet, desktop tested
- [ ] Testing: Unit + accessibility tests
- [ ] Design tokens: No magic values, uses Tailwind classes
- [ ] Source transparency: Citations visible and linked

---

## Anti-Patterns

❌ **Don't:**
- Use pure white (#FFFFFF) or pure black (#000000)
- Hide sources or citations
- Use political party colors (red/blue) as UI chrome
- Skip reading levels
- Over-simplify child level
- Use color alone for state (add icons + text)
- `outline-none` without replacement
- Use saturated primaries
- Make color "decorative" (color is semantic)

✅ **Do:**
- Use Warm Ivory (#F7F4EF) background
- Use Soft Ink (#1F2328) for primary text
- Show all sources with metadata
- Use non-partisan palette (sage, rust, muted rose→grey→blue for data)
- Support all 4 levels equally
- Respect young readers (genuine, not condescending)
- Icons + text + color together
- Custom focus rings always (sage-500)
- Keep accents ≤5% of design
- Let words lead, color supports

---

## Summary

**Component Philosophy:**
- Editorial authority through warm typography and colors
- Progressive disclosure (start simple, reveal depth)
- Source transparency (always visible, never hidden)
- Accessibility without compromise (WCAG AAA)
- Thoughtful, rigorous, humane design

**Every component asks:**
- Does this help users understand complex policy?
- Is this accessible to 8-year-olds AND PhD researchers?
- Does this build trust through transparency?
- Does the warm editorial palette feel inviting and authoritative?
- Are sources visible and properly attributed?

State of Clarity components don't shout. They invite thinking.
