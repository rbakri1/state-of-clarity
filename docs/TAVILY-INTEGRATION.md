# Tavily AI Integration Guide

## Why Tavily AI?

**Cost Comparison:**
| Service | Cost per Search | Cost for 1,000 Briefs | Notes |
|---------|----------------|---------------------|-------|
| **Tavily AI** | £0.015 | **£15** | Built for AI agents, structured output |
| Perplexity | £0.10 | £100 | Good but expensive |
| Google Custom Search | £0 | £0 | Free tier limits, manual scraping needed |

**Tavily Advantages:**
- ✅ **Built for AI agents** (no scraping, structured JSON)
- ✅ **Cleaned content** (removes ads, navigation, boilerplate)
- ✅ **Relevance scoring** (0-1 score per result)
- ✅ **Fast** (<5 seconds for 20 sources)
- ✅ **97% cheaper** than Perplexity (£15 vs £800 for 1,000 briefs)

---

## Setup

### 1. Sign Up for Tavily AI

```bash
# Visit https://tavily.com
# Create account
# Get API key from dashboard
```

### 2. Add API Key to Environment

```bash
# .env.local
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

### 3. Install Dependencies

```bash
npm install @anthropic-ai/sdk
# Tavily has no official SDK - we use fetch directly
```

---

## Usage Example

### Basic Search

```typescript
import { researchAgent } from "@/lib/agents/research-agent";

const sources = await researchAgent(
  "What are the economic impacts of a 4-day work week in the UK?"
);

console.log(sources);
// Returns 15-20 high-quality sources with:
// - URL, title, content excerpt
// - Political lean classification
// - Credibility score (0-10)
// - Source type (primary/secondary/tertiary)
```

### Advanced Options

```typescript
// Direct Tavily API call with custom parameters
const response = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`,
  },
  body: JSON.stringify({
    api_key: process.env.TAVILY_API_KEY,
    query: "UK Net Zero 2050 feasibility",
    search_depth: "advanced", // "basic" or "advanced"
    max_results: 20,
    include_raw_content: true, // Get full page content
    include_domains: ["gov.uk", "ac.uk"], // Optional: prioritize domains
    exclude_domains: ["example.com"], // Optional: block domains
  }),
});

const data = await response.json();
```

---

## API Response Format

```json
{
  "query": "What are the economic impacts of a 4-day work week?",
  "results": [
    {
      "url": "https://autonomy.work/portfolio/uk4dwt/",
      "title": "The results of the world's largest four-day week trial",
      "content": "92% of companies continuing with the four-day week...Revenue stayed broadly the same...",
      "score": 0.95,
      "published_date": "2023-02-21"
    },
    {
      "url": "https://www.oecd.org/employment/working-time.htm",
      "title": "Working Time and Work Organisation",
      "content": "Analysis of working time trends across OECD countries...",
      "score": 0.89,
      "published_date": "2024-01-10"
    }
  ]
}
```

---

## Cost Breakdown

### Pricing Tiers

| Tier | Cost | Searches/Month | Use Case |
|------|------|----------------|----------|
| **Free** | $0 | 1,000 | Testing, personal projects |
| **Basic** | $50/mo | 5,000 | Small-scale MVP |
| **Pro** | $200/mo | 50,000 | Production (post-launch) |

### State of Clarity MVP Estimate

**Assumptions:**
- 1,000 briefs generated during 12-week MVP
- 1 search per brief
- Free tier covers first 1,000 searches

**Cost:** **£0 during MVP** (free tier sufficient!)

**Post-Launch (5,000 briefs/month):**
- 5,000 searches/month = Basic tier ($50/mo = £40/mo)
- Still 80% cheaper than Perplexity (£40 vs £500)

---

## Comparison with Alternatives

### Tavily vs Perplexity

| Feature | Tavily AI | Perplexity |
|---------|-----------|------------|
| **Cost** | £0.015/search | £0.10/search |
| **Speed** | <5s | ~10s |
| **Content** | Cleaned, structured | Raw snippets |
| **Citations** | Always included | Sometimes missing |
| **API Quality** | Excellent (built for agents) | Good (built for humans) |

**Verdict:** Tavily is better for programmatic use cases (like State of Clarity).

### Tavily vs Google Custom Search

| Feature | Tavily AI | Google Custom Search |
|---------|-----------|---------------------|
| **Cost** | £0.015/search | Free (100/day limit) |
| **Content** | Cleaned, ready to use | URLs only (must scrape) |
| **Setup** | Simple (one API key) | Complex (Custom Search Engine setup) |
| **Quality** | High (AI-curated) | Variable (SEO-dependent) |

**Verdict:** Tavily is worth £0.015 to avoid scraping hassle.

---

## Integration Checklist

- [x] Sign up for Tavily AI account
- [x] Add `TAVILY_API_KEY` to `.env.local`
- [x] Test basic search with sample query
- [x] Implement `researchAgent()` function
- [x] Add political lean classification (Claude Haiku)
- [x] Add credibility scoring (domain reputation)
- [x] Test diversity algorithm (≥40% opposing perspectives)
- [ ] Monitor API usage (stay within free tier during MVP)
- [ ] Upgrade to Basic tier when exceeding 1,000 searches

---

## Monitoring & Optimization

### Track API Usage

```typescript
// Add to research-agent.ts
let searchCount = 0;

export async function researchAgent(question: string) {
  searchCount++;
  console.log(`[Tavily] Search count: ${searchCount}/1000 (free tier)`);

  if (searchCount > 900) {
    console.warn("[Tavily] Approaching free tier limit! Consider upgrading.");
  }

  // ... rest of function
}
```

### Cost Optimization Tips

1. **Cache popular topics:** If same question asked twice, reuse sources
2. **Batch political lean classification:** One API call for all sources (already implemented)
3. **Use "basic" search depth:** For less critical topics (saves 50% on API quotas)
4. **Fallback to Google:** If Tavily quota exceeded, fall back to Google Custom Search

---

## Troubleshooting

### Error: "Invalid API Key"

```bash
# Check .env.local has correct key
echo $TAVILY_API_KEY

# Restart dev server to reload env vars
npm run dev
```

### Error: "Rate Limit Exceeded"

```typescript
// Implement exponential backoff
async function tavilySearchWithRetry(params: TavilySearchParams, retries = 3) {
  try {
    return await tavilySearch(params);
  } catch (error) {
    if (error.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return tavilySearchWithRetry(params, retries - 1);
    }
    throw error;
  }
}
```

### Error: "No Results Found"

```typescript
// Fallback to Google Custom Search
if (tavilyResults.results.length < 5) {
  console.warn("[Tavily] Insufficient results, falling back to Google");
  const googleResults = await googleCustomSearch(question);
  // Merge results
}
```

---

## Next Steps

1. **Test with Real Questions:**
   ```bash
   npm run dev
   # Navigate to http://localhost:3000
   # Try: "What is the economic impact of Brexit?"
   ```

2. **Validate Source Quality:**
   - Check political lean distribution (≥40% opposing)
   - Verify credibility scores (avg ≥7)
   - Confirm primary source ratio (≥40%)

3. **Monitor Costs:**
   - Track searches/day
   - Estimate monthly spend
   - Plan upgrade timing

4. **Optimize Prompts:**
   - Refine political lean classification prompt
   - Test different search depths (basic vs advanced)

---

## Resources

- **Tavily Docs:** https://docs.tavily.com
- **API Reference:** https://docs.tavily.com/api-reference
- **Pricing:** https://tavily.com/pricing
- **Support:** support@tavily.com

---

**Ready to implement!** The `research-agent.ts` file is already set up. Just add your Tavily API key and test it. 🚀
