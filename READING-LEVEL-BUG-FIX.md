# Reading Level Bug Investigation & Fix

**Date**: 2026-01-12
**Issue**: Reading level selector makes no visible changes when switching between levels

## Root Cause Analysis

### Issue #1: Sample Briefs Used Outdated Keys ✅ FIXED

**Problem:**
- Sample briefs (`uk-four-day-week.json`, `what-is-a-state.json`) used old keys:
  - `"simple"` → should be `"child"`
  - `"standard"` → should be `"undergrad"`
  - `"advanced"` → should be `"postdoc"`
  - Missing: `"teen"` level

**Frontend Expected Keys:**
```typescript
type ReadingLevel = "child" | "teen" | "undergrad" | "postdoc";
```

**Fix Applied:**
- ✅ Updated `sample-briefs/uk-four-day-week.json` with correct keys
- ✅ Updated `sample-briefs/what-is-a-state.json` with correct keys
- ✅ Generated missing "teen" level content for both briefs

**Files Modified:**
- `/sample-briefs/uk-four-day-week.json`
- `/sample-briefs/what-is-a-state.json`

---

### Issue #2: All Database Briefs Have Empty Summaries ⚠️ CRITICAL

**Problem:**
- Ran diagnostic script `scripts/check-brief-summaries.ts`
- **Result**: All 23 briefs in database have `summaries: {}`
- This means the agentic system is NOT generating or saving summaries

**Evidence:**
```
📊 Found 23 briefs in database.
⚠️  Found 23 briefs with incorrect structure:

Brief ID: 4c11dc19-c901-44d4-a114-736317fb03bd
Current keys:
❌ Missing keys: child, teen, undergrad, postdoc
```

**Affected Briefs:**
- All user-generated briefs (23 total)
- Sample briefs were hardcoded in code, so they worked

---

## Architecture Analysis

### Summary Generation Flow

1. **Orchestrator** (`lib/agents/langgraph-orchestrator.ts`):
   - ✅ Graph structure is correct
   - ✅ 4 parallel summary nodes: `summary_child`, `summary_teen`, `summary_undergrad`, `summary_postdoc`
   - ✅ Each calls `generateSummary()` function with appropriate reading level
   - ✅ Summaries stored in state via reducer: `summaries: { ...prev, ...next }`

2. **Database Saving** (`lib/services/brief-service.ts:145-147`):
   ```typescript
   if (state.summaries && Object.keys(state.summaries).length > 0) {
     updateData.summaries = state.summaries;
   }
   ```
   - This code looks correct
   - Likely issue: `state.summaries` is empty or has errors

3. **Potential Root Causes:**
   - LLM API errors during summary generation (Haiku model)
   - Errors caught silently in retry wrappers
   - State accumulation issue in LangGraph
   - `completeBriefGeneration()` fails silently (uses `.catch()`)

---

## Testing Status

### ✅ What's Fixed
1. Sample briefs now have correct reading level keys
2. Diagnostic scripts created to identify issues
3. Frontend code is correct and will work once summaries exist

### ⚠️ What Needs Action

**Immediate:**
1. **Clean up database** - Delete 23 incomplete briefs:
   ```sql
   -- Run in Supabase SQL editor
   DELETE FROM briefs WHERE summaries = '{}'::jsonb;
   ```

2. **Test new brief generation**:
   - Generate a new brief via `/ask`
   - Check if all 4 reading levels populate
   - If not, add debug logging to orchestrator

**Debug Steps (if still broken):**
1. Add console.log in `summaryChildNode`, `summaryTeenNode`, etc. to see if they execute
2. Check if `generateSummary()` is throwing errors
3. Verify Anthropic API key is set and has credits
4. Check if `updateBriefFromState()` is being called with populated summaries

---

## Files Created for Diagnostics

1. **`scripts/check-brief-summaries.ts`**
   - Scans database for briefs with incorrect summary structure
   - Usage: `npx tsx scripts/check-brief-summaries.ts`

2. **`scripts/check-agent-logs.ts`**
   - Checks agent execution logs (table doesn't exist yet)
   - Will be useful once agent_execution_logs table is created

---

## Next Steps

### For Testing:
1. Visit sample briefs to verify fix:
   - http://localhost:3000/brief/uk-four-day-week
   - http://localhost:3000/brief/what-is-a-state
   - Switch between reading levels and confirm content changes

2. Generate a new brief:
   - Go to `/ask`
   - Generate a brief on any topic
   - Check if reading level selector works

### For Deployment:
1. Clean up 23 incomplete briefs from production database
2. Monitor new brief generations to ensure summaries populate
3. Consider adding validation in API route to reject briefs without summaries

---

## Technical Details

### Reading Level Configuration

**From `lib/agents/summary-prompts.ts`:**

| Level | Target Audience | Word Count | Model |
|-------|----------------|------------|-------|
| child | Ages 8-12 | 100-150 | Haiku |
| teen | Ages 13-17 | 200-250 | Haiku |
| undergrad | University students | 350-400 | Haiku |
| postdoc | Experts/researchers | 450-500 | Haiku |

**UI Component:** `components/brief/reading-level-selector.tsx`
- Renders tabs for each level
- Controlled by `activeLevel` state
- Shows/hides corresponding `SummaryCard` component

---

## Conclusion

The frontend reading level selector was working correctly. The issue was:
1. **Sample briefs** had outdated keys (now fixed ✅)
2. **Database briefs** never had summaries generated (needs investigation ⚠️)

The sample briefs should now work perfectly. Database briefs need to be regenerated or deleted.
