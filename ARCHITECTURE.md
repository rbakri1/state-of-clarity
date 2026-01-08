# State of Clarity – Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Ask Anything │  │ Brief Viewer │  │ Community    │          │
│  │   Interface  │  │   (Layers)   │  │   Features   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────────┐
│         ▼                  ▼                  ▼                  │
│                    API GATEWAY (Next.js)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   /api/ask   │  │ /api/brief   │  │ /api/feedback│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
┌─────────┴──────────────────┴──────────────────┴─────────────────┐
│                    CORE ORCHESTRATION LAYER                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Brief Generator (LangGraph)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │ │
│  │  │ Research │→│ Structure│→│ Narrative│→│ Clarity  │     │ │
│  │  │  Agent   │ │  Agent   │ │  Agent   │ │  Scorer  │     │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │ │
│  └───────┼────────────┼────────────┼────────────┼───────────┘ │
└──────────┼────────────┼────────────┼────────────┼─────────────┘
           │            │            │            │
┌──────────┴────────────┴────────────┴────────────┴─────────────┐
│                      DATA & AI LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Claude     │  │   Perplexity │  │   Embedding  │         │
│  │   (Sonnet)   │  │   (Research) │  │   (Voyage)   │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│  ┌──────┴──────────────────┴──────────────────┴───────┐        │
│  │            Supabase (Postgres + pgvector)           │        │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │        │
│  │  │ Briefs │ │Sources │ │Feedback│ │ Users  │      │        │
│  │  └────────┘ └────────┘ └────────┘ └────────┘      │        │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + TanStack Query
- **Visualizations**: Recharts (charts), React Flow (citation graphs)
- **Markdown Rendering**: react-markdown + remark/rehype plugins

### Backend
- **Runtime**: Node.js (Next.js API routes)
- **Orchestration**: LangGraph (multi-agent workflow)
- **LLMs**:
  - Primary: Claude 3.5 Sonnet (reasoning, writing)
  - Research: Perplexity API (web search + citations)
  - Embeddings: Voyage AI (semantic search)
- **Database**: Supabase (Postgres + pgvector + auth + storage)
- **Caching**: Redis (optional for v1.1)

### Infrastructure
- **Hosting**: Vercel (web app + API)
- **Database**: Supabase Cloud
- **Analytics**: PostHog (privacy-focused)
- **Monitoring**: Sentry (error tracking)

---

## Core Data Models

### Brief Schema
```typescript
interface Brief {
  id: string;
  question: string;
  version: number;
  created_at: timestamp;
  updated_at: timestamp;
  clarity_score: number; // 0-10

  // Content layers
  summaries: {
    child: string;       // Reading age 8-12
    teen: string;        // Reading age 13-17
    undergrad: string;   // Reading age 18-22
    postdoc: string;     // Graduate level
  };

  structured_data: {
    definitions: Array<{term: string; definition: string}>;
    factors: Array<{name: string; impact: string; evidence: string[]}>;
    policies: Array<{name: string; pros: string[]; cons: string[]; evidence: string[]}>;
    consequences: Array<{action: string; first_order: string; second_order: string}>;
  };

  narrative: string; // 800-1200 word analysis

  sources: Source[];

  metadata: {
    user_id: string | null;
    fork_of: string | null;
    view_count: number;
    citation_count: number;
  };
}
```

### Source Schema
```typescript
interface Source {
  id: string;
  url: string;
  title: string;
  author: string;
  publication_date: date;
  publisher: string;

  // Trust signals
  source_type: 'primary' | 'secondary' | 'tertiary';
  political_lean: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  credibility_score: number; // 0-10, based on domain reputation

  // Usage
  cited_in_briefs: string[]; // Brief IDs
  excerpt: string; // Relevant quote
  accessed_at: timestamp;
}
```

### Feedback Schema
```typescript
interface Feedback {
  id: string;
  brief_id: string;
  user_id: string | null; // Null for anonymous
  type: 'upvote' | 'downvote' | 'suggest_source' | 'spot_error' | 'edit_proposal';

  // For suggestions
  content?: string;
  section?: string; // Which part of the brief

  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  reviewer_notes?: string;

  created_at: timestamp;
}
```

---

## LangGraph Agent Workflow

```python
# Brief generation pipeline (pseudocode)

StateGraph:
  nodes:
    - research_agent:
        task: "Use Perplexity to find 15-20 diverse sources"
        output: List[Source]

    - structure_agent:
        task: "Extract structured data (definitions, factors, policies)"
        input: sources + user_question
        output: structured_data

    - summary_agent:
        task: "Generate 4 reading-level summaries"
        input: structured_data + sources
        output: summaries (child, teen, undergrad, postdoc)

    - narrative_agent:
        task: "Write 800-1200 word cohesive argument"
        input: structured_data + sources
        output: narrative

    - clarity_scorer:
        task: "Evaluate output quality"
        input: full_brief
        output: clarity_score + critique

    - refinement_agent (conditional):
        task: "Fix issues if clarity_score < 7"
        input: critique + full_brief
        output: revised_brief

  edges:
    research_agent → structure_agent → (summary_agent + narrative_agent) → clarity_scorer
    clarity_scorer → refinement_agent (if score < 7) → clarity_scorer
    clarity_scorer → END (if score >= 7)
```

---

## Clarity Score Algorithm

### Formula
```
clarity_score = (
  source_diversity_score × 0.20 +
  recency_score × 0.10 +
  primary_source_ratio × 0.15 +
  first_principles_coherence × 0.25 +
  logical_completeness_score × 0.15 +
  readability_score × 0.10 +
  user_feedback_score × 0.05
) × 10
```

**Key change**: Added **First-Principles Coherence** (25% weight) to assess whether the brief:
1. Breaks down the question to fundamental truths
2. Builds arguments from those foundations
3. Maintains internal logical consistency
4. Avoids circular reasoning or assumption-stacking

### Component Calculations

#### 1. Source Diversity (0-1)
```typescript
function calculateSourceDiversity(sources: Source[]): number {
  const leanCounts = countBy(sources, 'political_lean');
  const hasLeft = leanCounts['left'] + leanCounts['center-left'] > 0;
  const hasCenter = leanCounts['center'] > 0;
  const hasRight = leanCounts['center-right'] + leanCounts['right'] > 0;

  const balanceScore = (hasLeft + hasCenter + hasRight) / 3;

  // Penalize if >60% from single lean
  const maxLeanRatio = Math.max(...Object.values(leanCounts)) / sources.length;
  const balancePenalty = maxLeanRatio > 0.6 ? 0.7 : 1.0;

  return balanceScore * balancePenalty;
}
```

#### 2. Recency (0-1)
```typescript
function calculateRecency(sources: Source[]): number {
  const now = Date.now();
  const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);

  const recentSources = sources.filter(s =>
    new Date(s.publication_date).getTime() > twoYearsAgo
  );

  return recentSources.length / sources.length;
}
```

#### 3. Primary Source Ratio (0-1)
```typescript
function calculatePrimaryRatio(sources: Source[]): number {
  const primaryCount = sources.filter(s => s.source_type === 'primary').length;
  return Math.min(primaryCount / sources.length, 0.5) * 2; // Cap at 50% for balance
}
```

#### 4. First-Principles Coherence (0-1) **[NEW - HIGHEST WEIGHT]**
```typescript
// LLM-as-judge evaluating fundamental reasoning quality
async function evaluateFirstPrinciplesCoherence(brief: Brief): Promise<number> {
  const prompt = `
    You are evaluating a policy brief's reasoning quality from FIRST PRINCIPLES.

    Score 0-1 on these criteria:

    1. FOUNDATION CLARITY (0.3 weight):
       - Does the brief identify the fundamental assumptions/axioms?
       - Are core concepts defined before being used?
       - Example: Before discussing "4-day week economics", does it establish
         what determines economic output (labor × productivity)?

    2. LOGICAL CHAIN INTEGRITY (0.3 weight):
       - Does each claim build from established foundations?
       - Are there logical leaps or unsupported inferences?
       - Example: Does "workers are happier" → "productivity rises" explain
         the causal mechanism, or just correlate?

    3. INTERNAL CONSISTENCY (0.2 weight):
       - Do different sections contradict each other?
       - Are edge cases handled consistently with the core logic?
       - Example: If the brief claims "hour-reduction works in knowledge work",
         does it explain why manufacturing differs using the same framework?

    4. ASSUMPTION TRANSPARENCY (0.2 weight):
       - Are hidden assumptions made explicit?
       - Does the brief acknowledge where evidence is thin?
       - Example: Does it note if trial results might not generalize due to
         selection bias or Hawthorne effects?

    Return JSON: {
      score: number,           // Overall 0-1 score
      foundation_score: number,
      chain_score: number,
      consistency_score: number,
      transparency_score: number,
      reasoning: string,       // 2-3 sentences explaining score
      example_strength: string,  // Quote showing strong reasoning
      example_weakness: string   // Quote showing gap (if any)
    }
  `;

  const result = await claude.complete(prompt + JSON.stringify({
    narrative: brief.narrative,
    structured_data: brief.structured_data,
    summaries: brief.summaries
  }));

  return result.score;
}
```

#### 5. Logical Completeness (0-1)
```typescript
// LLM-as-judge with structured prompt
async function evaluateLogicalCompleteness(brief: Brief): Promise<number> {
  const prompt = `
    Evaluate this policy brief on a 0-1 scale for:
    1. Steel-manning: Does it fairly represent opposing viewpoints?
    2. Second-order thinking: Are downstream consequences explored?
    3. Evidence-claim links: Are assertions backed by citations?
    4. Logical flow: Do conclusions follow from premises?

    Return JSON: { score: number, reasoning: string }
  `;

  const result = await claude.complete(prompt + brief.narrative);
  return result.score;
}
```

#### 6. Readability (0-1)
```typescript
function calculateReadability(summaries: Brief['summaries']): number {
  const targets = {
    child: { min: 60, max: 100 },      // Flesch score
    teen: { min: 50, max: 70 },
    undergrad: { min: 40, max: 60 },
    postdoc: { min: 20, max: 50 }
  };

  const scores = Object.entries(summaries).map(([level, text]) => {
    const flesch = calculateFleschScore(text);
    const target = targets[level];

    if (flesch >= target.min && flesch <= target.max) return 1;
    return Math.max(0, 1 - Math.abs(flesch - (target.min + target.max) / 2) / 50);
  });

  return average(scores);
}
```

#### 7. User Feedback (0-1)
```typescript
function calculateUserFeedback(brief: Brief, feedback: Feedback[]): number {
  const votes = feedback.filter(f =>
    f.brief_id === brief.id && ['upvote', 'downvote'].includes(f.type)
  );

  if (votes.length < 10) return 0.5; // Neutral until enough data

  const upvotes = votes.filter(v => v.type === 'upvote').length;
  return upvotes / votes.length;
}
```

---

## API Endpoints

### `POST /api/ask`
**Generate a new brief**

Request:
```json
{
  "question": "What are the economic impacts of a 4-day work week?",
  "user_id": "optional-uuid"
}
```

Response:
```json
{
  "brief_id": "uuid",
  "status": "processing",
  "estimated_time_seconds": 45
}
```

### `GET /api/brief/:id`
**Retrieve a brief**

Response: Full `Brief` object

### `POST /api/feedback`
**Submit feedback**

Request:
```json
{
  "brief_id": "uuid",
  "type": "suggest_source",
  "content": "Consider adding IMF 2024 report on productivity",
  "section": "structured_data.policies"
}
```

### `GET /api/briefs/trending`
**Discover popular briefs**

Query params: `?period=7d&limit=10`

---

## Security & Privacy

### Anonymous Tips (Whistleblowing)
1. **Submission**: Encrypted form at `/submit-tip`
2. **Storage**: Tips stored in separate `whistleblower_tips` table with no IP logging
3. **Verification**: Flagged as "unverified" until:
   - 2+ independent sources corroborate, OR
   - High-rep community member vouches + 3 upvotes from other high-rep users
4. **Protection**: Never store user metadata; use Tor-friendly submission process

### Rate Limiting
- Free tier: 10 briefs/month per IP
- Researcher: 1000 briefs/month per account
- Professional: Unlimited

### Content Moderation
- Block hate speech, conspiracy theories (use Perspective API for initial screening)
- Human review for flagged content (anything Perspective scores >0.8 toxicity)

---

## Deployment Strategy

### Phase 1: MVP (Weeks 1-4)
- Static 3 showcase briefs (pre-generated)
- Ask Anything interface (slow generation OK, ~60s)
- Basic feedback form
- Deploy to Vercel + Supabase

### Phase 2: Optimization (Weeks 5-8)
- Speed improvements (parallel agent execution)
- Caching layer (Redis for popular briefs)
- Real-time status updates (WebSockets)

### Phase 3: Community (Weeks 9-12)
- User accounts + reputation system
- Edit proposals + governance
- Citation tracking

---

## Open Questions for Discussion

1. **Should we watermark AI-generated content?** Transparency vs. stigma.
2. **How do we handle time-sensitive crises?** (e.g., "Should UK join war in X?") – Auto-archive after 30 days?
3. **Paywalling depth?** Should free tier get all 4 reading levels or just child+teen?
4. **Multi-language strategy?** Machine translate first, then human review, or human-first always?

---

## Cost Estimates (Monthly, assuming 10K active users)

| Service | Usage | Cost |
|---------|-------|------|
| Claude API | 10K briefs × $0.50 each | ~£4,000 |
| Perplexity API | 10K searches × $0.10 each | ~£800 |
| Supabase | 50GB storage + 100M reads | ~£20 |
| Vercel | Pro plan + bandwidth | ~£160 |
| **Total** | | **~£4,980** |

**Revenue target (break-even)**: 416 Researcher subs OR 102 Professional subs OR 5 Institutional deals.

---

## Next Steps

1. ✅ Architecture defined
2. ⏳ Build sample showcase brief
3. ⏳ Develop MVP prototype
4. ⏳ Test LangGraph workflow locally
5. ⏳ Deploy to staging environment
