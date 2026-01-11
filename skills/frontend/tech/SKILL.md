---
name: state-of-clarity-tech-stack
description: Complete tech stack, tools, and implementation patterns for State of Clarity. Use when setting up project, choosing libraries, or implementing features. Specifies Next.js 14 (App Router, Server Components), Tailwind CSS, shadcn/ui, Supabase (database + auth), Claude API (Haiku/Sonnet/Opus selection), Tavily AI (research), Zustand (global state), TanStack Query (server state), React Hook Form + Zod, Lucide icons, and deployment (Vercel). Budget: £2,862 MVP, £55/mo infrastructure.
---

# State of Clarity - Tech Stack & Tools

## Philosophy: Ship Fast, Stay Lean

**Build in-house:** Brief generation, clarity scoring, reading interface
**Buy/Use services:** Database, AI APIs, hosting (cheaper than building)
**Budget:** £2,862 MVP, £55/mo infrastructure

---

## Core Stack

### Next.js 14 (App Router)
```javascript
// next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com', 'cdn.stateofclarity.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: true,
  },
};
```

**Why:**
- Server Components: Reduce client bundle (briefs are read-heavy)
- Streaming: Progressive rendering during generation
- File-based routing: `/brief/[id]` automatic
- API routes: Backend in same repo
- Edge runtime: Low latency globally

**Routing:**
```
app/
├── (marketing)/
│   ├── page.tsx           # Homepage
│   └── about/
├── brief/[id]/
│   ├── page.tsx           # Brief viewer (Server Component)
│   └── loading.tsx
├── dashboard/
│   ├── saved/
│   └── history/
└── api/
    ├── ask/route.ts       # Generate brief
    └── feedback/route.ts
```

**Server vs Client:**
- **Server (default):** Brief viewer, source list, public pages
- **Client (`'use client'`):** Reading level selector, progress UI, forms, modals

---

### Tailwind CSS 3.4

```javascript
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      clarity: {
        500: '#0F52BA', // Primary
        600: '#0C429E', // Hover
        700: '#093182', // Active
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

**Best Practices:**
```tsx
// GOOD: Semantic utilities
<button className="px-4 py-2 rounded bg-clarity-500 text-white hover:bg-clarity-600">

// GOOD: Use cn() for conditionals
<div className={cn(
  'p-4 rounded',
  isActive && 'bg-clarity-100',
  className
)} />

// AVOID: Inline styles (lose consistency)
<button style={{ padding: '8px 16px' }}>
```

---

### shadcn/ui (Copy Components)

```bash
# Installation
npx shadcn-ui@latest init

# Core components
npx shadcn-ui@latest add button card input dialog tabs
npx shadcn-ui@latest add form dropdown-menu select toast
npx shadcn-ui@latest add table progress skeleton
```

**Why:**
- Copy code (full control)
- Built on Radix UI (accessible)
- Tailwind styled (matches design system)
- TypeScript first
- No runtime dependency

**Customization:**
```tsx
// components/ui/button.tsx - Already customized with clarity colors
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded font-medium transition-all',
  {
    variants: {
      variant: {
        default: 'bg-clarity-500 text-white hover:bg-clarity-600',
        outline: 'border border-slate-300 hover:bg-slate-50',
      },
    },
  }
);
```

---

## State Management

### Zustand (Global State)

```bash
npm install zustand
```

```typescript
// lib/store/app-store.ts
import { create } from 'zustand';

interface AppState {
  user: User | null;
  readingLevel: ReadingLevel;
  setReadingLevel: (level: ReadingLevel) => void;
  isGenerating: boolean;
  generationProgress: number;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  readingLevel: 'undergrad', // Default
  isGenerating: false,
  generationProgress: 0,
  
  setReadingLevel: (level) => set({ readingLevel: level }),
}));

// Usage in components
function ReadingSelector() {
  const { readingLevel, setReadingLevel } = useAppStore();
  // ...
}
```

**Why:** Minimal boilerplate, simple API, 1.2KB gzipped

---

### TanStack Query (Server State)

```bash
npm install @tanstack/react-query
```

```typescript
// hooks/use-brief.ts
import { useQuery } from '@tanstack/react-query';

export function useBrief(briefId: string) {
  return useQuery({
    queryKey: ['brief', briefId],
    queryFn: async () => {
      const res = await fetch(`/api/brief/${briefId}`);
      return res.json() as Promise<Brief>;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

// In component
function BriefViewer({ briefId }: { briefId: string }) {
  const { data: brief, isLoading } = useBrief(briefId);
  
  if (isLoading) return <BriefSkeleton />;
  return <BriefContent brief={brief} />;
}
```

**Why:** Automatic caching, optimistic updates, request deduplication

---

## Database & Auth

### Supabase Pro (£25/month)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Features:**
- PostgreSQL (8GB)
- Auth (email/password, magic links)
- Storage (user avatars)
- Row-Level Security

**Schema (Already Implemented):**
- `briefs` - Generated briefs (JSONB content)
- `sources` - Sources with political lean + credibility
- `feedback` - Votes, suggestions, errors
- `saved_briefs` - User bookmarks
- `profiles` - User profiles

---

## AI Services

### Anthropic Claude API

**Model Selection:**
```typescript
export const CLAUDE_MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',   // £0.02 - Summaries, classification
  SONNET: 'claude-3-5-sonnet-20241022', // £0.20 - Structure, narrative
  OPUS: 'claude-3-opus-20240229',        // £0.015 - Clarity scoring
};

function selectModel(task: 'summary' | 'narrative' | 'scoring') {
  switch (task) {
    case 'summary': return CLAUDE_MODELS.HAIKU;
    case 'narrative': return CLAUDE_MODELS.SONNET;
    case 'scoring': return CLAUDE_MODELS.OPUS;
  }
}
```

**API Wrapper:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateCompletion({
  model,
  messages,
  maxTokens = 4096,
  temperature = 0.3,
}: {
  model: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}) {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages,
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}
```

**Cost per Brief:** £0.25 total
- Tavily (research): £0.015
- Claude Haiku (summaries): £0.02
- Claude Sonnet (structure + narrative): £0.20
- Claude Opus (scoring): £0.015

---

### Tavily AI (Research)

```bash
npm install @tavily/core
```

```typescript
import { tavily } from '@tavily/core';

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function tavilySearch(query: string) {
  const results = await tavilyClient.search(query, {
    searchDepth: 'advanced', // Searches 10+ sources
    maxResults: 20,
    includeRawContent: true,
  });

  return results.results.map(result => ({
    url: result.url,
    title: result.title,
    content: result.content, // Pre-cleaned!
    score: result.score,
  }));
}
```

**Why:** 97% cheaper than Perplexity (£0.015 vs £0.10), returns structured JSON

---

## Forms & Validation

### React Hook Form + Zod

```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const suggestSourceSchema = z.object({
  url: z.string().url('Must be valid URL'),
  explanation: z.string().min(20, 'Explain why (20+ chars)'),
  political_lean: z.enum(['left', 'center', 'right', 'unknown']),
});

type SuggestSourceForm = z.infer<typeof suggestSourceSchema>;

export function SuggestSourceForm({ briefId }: { briefId: string }) {
  const form = useForm<SuggestSourceForm>({
    resolver: zodResolver(suggestSourceSchema),
    defaultValues: {
      url: '',
      explanation: '',
      political_lean: 'unknown',
    },
  });

  const onSubmit = async (data: SuggestSourceForm) => {
    await fetch('/api/feedback/suggest-source', {
      method: 'POST',
      body: JSON.stringify({ ...data, briefId }),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields... */}
      </form>
    </Form>
  );
}
```

**Why:** Performant (uncontrolled), great TypeScript support, 9KB gzipped

---

## Icons

### Lucide React

```bash
npm install lucide-react
```

```tsx
import {
  Search, ThumbsUp, ThumbsDown, ExternalLink,
  Shield, ShieldCheck, ShieldAlert,
  Loader2, Clock, Eye, Target,
} from 'lucide-react';

// Usage
<Search className="w-5 h-5 text-slate-600" />
<Loader2 className="w-4 h-4 animate-spin" />
```

**Why:** 1000+ icons, tree-shakeable, consistent outline style

---

## Utilities

### cn() Helper

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'base-class',
  isActive && 'active-class',
  className
)} />
```

### date-fns

```bash
npm install date-fns
```

```typescript
import { format, formatDistanceToNow } from 'date-fns';

format(new Date(brief.created_at), 'MMM dd, yyyy'); // "Jan 15, 2026"
formatDistanceToNow(new Date(brief.updated_at), { addSuffix: true }); // "2 hours ago"
```

---

## Deployment

### Vercel Pro (£20/month)

**Why:**
- Zero-config Next.js deploy
- Edge network (global CDN)
- Preview deployments (every PR)
- Automatic scaling

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
NEXTAUTH_URL=https://stateofclarity.com
NEXTAUTH_SECRET=xxx
```

---

## Observability

### Sentry (Free Tier - 5K events/month)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

### PostHog (Free Tier - 1M events/month)

```typescript
import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com',
});

// Track events
posthog.capture('brief_generated', {
  briefId,
  clarityScore: score,
});
```

---

## Budget Summary

### Monthly Infrastructure (£55)
- Supabase Pro: £25
- Vercel Pro: £20
- Upstash Redis (optional): £10

### AI Costs (Per 1,000 Briefs)
- Tavily AI: £15 (1,000 × £0.015)
- Claude API: £235 (1,000 × £0.235)
- **Total:** £250

### Total MVP Budget: £2,862 ✅
- Infrastructure (12 weeks): £440
- AI (1,000 briefs): £250
- Legal: £1,000
- Marketing: £230
- Contingency: £370

---

## Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## Decision Matrix

| Need | Tool | Cost | Why |
|------|------|------|-----|
| Framework | Next.js 14 | £0 | SSR, streaming, file routing |
| Styling | Tailwind CSS | £0 | Rapid, consistent |
| Components | shadcn/ui | £0 | Full control, accessible |
| Database | Supabase Pro | £25/mo | All-in-one |
| AI | Claude + Tavily | ~£250 | Best reasoning + cheap research |
| State | Zustand | £0 | Simple, small |
| Server State | TanStack Query | £0 | Caching, optimistic updates |
| Hosting | Vercel Pro | £20/mo | Zero-config, edge |

---

## Anti-Patterns

❌ **Don't:**
- Install heavy libraries (Material-UI) - Use shadcn/ui
- Use CSS-in-JS - Stick to Tailwind
- Store server state in Zustand - Use TanStack Query
- Self-host AI - Use APIs (cheaper for MVP)
- Ignore TypeScript errors - Enforce strict mode

✅ **Do:**
- Leverage Next.js Server Components
- Use Tailwind utilities directly
- Separate global vs server state
- Pay for AI APIs (cheaper than hosting)
- Maintain strict TypeScript
- Ship MVPs, iterate fast
