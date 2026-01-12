# Brief Generation Failure Investigation Summary

**Date**: 2026-01-12
**Investigator**: Initial diagnostic agent
**Status**: Requires browser testing to complete diagnosis

---

## User Request

User reports that brief generation at https://stateofclarity.org/ask is failing when they try to generate a brief using the web interface. They want us to:
1. Go to the website
2. Try to generate a brief using one of the example questions
3. Diagnose why it's failing

---

## What I've Discovered

### Critical Finding: Empty Summaries Issue

**From codebase documentation (`READING-LEVEL-BUG-FIX.md`):**
- All 23 briefs in the production database have `summaries: {}`
- This means the summary generation step is consistently failing
- Sample briefs work because they're hardcoded in the code (not from database)

### Brief Generation Pipeline

The system uses LangGraph orchestrator with these stages:

```
1. Research Agent → Find sources (Tavily API)
2. Classification Agent → Classify question domain
3. Structure Agent (parallel) → Extract structured data
4. Narrative Agent (parallel) → Generate narrative analysis
5. Reconciliation Agent → Merge structure + narrative
6. 4x Summary Agents (parallel) → Generate 4 reading levels ⚠️ FAILING HERE
   - Child (ages 8-12)
   - Teen (ages 13-17)
   - Undergrad (university)
   - Postdoc (experts)
7. Clarity Scoring Agent → Score the brief
8. Save to Database
```

**The failure is at step 6** - the 4 parallel summary generation agents.

### Environment Configuration

✅ **Verified:**
- `.env.local` exists
- `ANTHROPIC_API_KEY` is set
- `TAVILY_API_KEY` is set
- Environment configuration looks correct

### Relevant Code Locations

**Main Files:**
1. `/app/api/briefs/generate/route.ts` - API endpoint that handles brief generation
2. `/lib/agents/langgraph-orchestrator.ts` - Main orchestration logic
3. `/lib/services/brief-service.ts` - Database save operations
4. `/app/ask/page.tsx` - Frontend form that submits requests

**Summary Generation Functions:**
- Lines 280-374 in `langgraph-orchestrator.ts` - Four summary node functions
- Lines 530-563 in `langgraph-orchestrator.ts` - `generateSummary()` function (uses Haiku model)

**Key Logic:**
```typescript
// Each summary node returns:
return {
  summaries: { child: summary },  // or teen, undergrad, postdoc
  completedSteps: ['summary-child'],
};

// State reducer merges them:
summaries: Annotation<Partial<SummaryOutputs>>({
  reducer: (prev, next) => ({ ...prev, ...next }),
  default: () => ({}),
}),
```

### Debug Logging Already Added

The codebase has extensive debug logging added (see `DEBUG-LOGGING-ADDED.md`):
- ✓ Summary node execution logs
- ✓ API call logs with character counts
- ✓ State accumulation logs
- ✓ Database save logs

**Expected success logs:**
```
[generateSummary] 🎯 Called for level: child
[generateSummary] ✅ API response received: 487 chars
[Orchestrator] ✓ Generated child summary: 487 chars
[Orchestrator] 📊 Final state summaries: child, teen, undergrad, postdoc
[BriefService] 📊 Summaries to save: child, teen, undergrad, postdoc
```

---

## Possible Root Causes

### 1. API Rate Limiting (Most Likely)
- Anthropic API rate limits exceeded
- 4 parallel calls to Haiku model might hit rate limits
- Error caught by retry wrapper but not properly surfaced

### 2. Network/Timeout Issues
- Summary generation takes too long
- Vercel serverless function timeout (10 seconds default)
- 4 parallel API calls timing out

### 3. LangGraph State Issue
- State reducer not properly accumulating summaries
- Parallel execution not waiting for all nodes
- State being reset somewhere

### 4. Silent Error Handling
- Errors caught in `withRetry()` wrapper
- `completeBriefGeneration()` uses `.catch()` which swallows errors
- Line 684 in orchestrator: `.catch((err) => { console.error(...) })`

### 5. Model/API Changes
- Haiku model name changed or deprecated
- API format changed
- Authentication issues

---

## What I've Created

### 1. Test Script (`/test-brief-generation.ts`)
Direct test of the orchestrator without going through the API:

```bash
npx tsx test-brief-generation.ts
```

**What it does:**
- Tests brief generation directly
- Shows exactly which step fails
- Displays all summaries (or shows they're missing)
- Exits with clear success/failure status

### 2. This Investigation Summary
Complete documentation of the issue for handoff.

---

## What I CANNOT Do

I do **not** have access to a browser tool that can:
- Navigate to websites
- Click buttons
- Fill forms
- Execute JavaScript
- See browser console errors
- Capture network requests

My `WebFetch` tool can only fetch static HTML - it cannot interact with the site.

---

## What Needs To Be Done Next

### Option A: Browser Testing (Recommended)
**An agent with browser/dev tools needs to:**

1. **Navigate to**: https://stateofclarity.org/ask
2. **Open browser DevTools**: Console + Network tabs
3. **Try generating a brief**:
   - Use example: "Should the UK adopt a 4-day work week?"
   - Click "Get Brief"
4. **Capture:**
   - Browser console errors
   - Network requests (especially POST to `/api/briefs/generate`)
   - Response from the API
   - Any error messages shown to user
5. **Check the response:**
   - Does it return `success: false`?
   - Is there an error message?
   - Is `creditRefunded: true`?
   - What's the clarity score?

### Option B: Local Testing
If testing on production isn't revealing:

1. **Start local dev server**: `npm run dev`
2. **Visit**: http://localhost:3000/ask
3. **Monitor terminal logs** while generating a brief
4. **Look for the debug log patterns** mentioned above
5. **Check if summaries are being generated**

### Option C: Database Inspection
Check what's actually in the database:

```sql
-- In Supabase SQL editor
SELECT
  id,
  question,
  summaries,
  clarity_score,
  created_at
FROM briefs
ORDER BY created_at DESC
LIMIT 5;
```

Look for:
- Are summaries empty `{}`?
- Are briefs even being created?
- What's the clarity_score?

---

## Expected Findings

Based on the evidence, the browser test should reveal:

**Scenario 1: API Error (Most Likely)**
- Request completes but returns error
- Response: `{ success: false, creditRefunded: true, error: "..." }`
- Server logs show Anthropic API errors during summary generation

**Scenario 2: Timeout**
- Request takes 30+ seconds
- Gateway timeout or function timeout error
- Partial brief created in database with empty summaries

**Scenario 3: Quality Gate Failure**
- Brief generates but clarity score < 60
- Response: `{ success: false, clarityScore: X, creditRefunded: true }`
- But this seems unlikely if summaries aren't being generated

**Scenario 4: Credit Insufficient**
- Response: `{ success: false, error: "Insufficient credits", creditsLink: "/credits" }`
- This would mean user isn't authenticated or has no credits

---

## Quick Wins to Try

### If it's a rate limit issue:
Add delay between parallel summary calls or make them sequential.

### If it's a timeout issue:
```typescript
// In langgraph-orchestrator.ts, line 544
const message = await anthropic.messages.create({
  model: "claude-3-5-haiku-20241022",
  max_tokens: 1000,
  timeout: 30000, // Add this
  messages: [...]
});
```

### If errors are being swallowed:
```typescript
// In brief-service.ts, line 684
if (result.briefId && !result.error) {
  await completeBriefGeneration(result.briefId, result as BriefState, duration);
  // Change from .catch() to try/catch to see errors
}
```

---

## Files Modified/Created

1. ✅ `/test-brief-generation.ts` - Direct test script
2. ✅ `/INVESTIGATION-SUMMARY.md` - This document
3. ℹ️ Already exists: `DEBUG-LOGGING-ADDED.md` - Debug logging documentation
4. ℹ️ Already exists: `READING-LEVEL-BUG-FIX.md` - Previous investigation

---

## Contact Points

**User**: Rami
**Issue**: Brief generation failing at https://stateofclarity.org/ask
**Codebase**: `/Users/rami/Desktop/Filing/M/Mindlace/Projects/State_of_Clarity`
**Main Branch**: `main`

---

## Handoff to Browser-Enabled Agent

**Task**: Navigate to https://stateofclarity.org/ask, attempt to generate a brief, capture all errors/responses, and diagnose the exact failure point.

**Context**: This is a Next.js app with LangGraph orchestrator. Brief generation involves 7 steps, and we believe it's failing at step 6 (summary generation). Need to see actual error messages and API responses from production.

**Expected Time**: 5-10 minutes to test and diagnose

**Priority**: High - users cannot generate briefs (core functionality broken)
