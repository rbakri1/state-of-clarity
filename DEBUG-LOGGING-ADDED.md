# Debug Logging Added for Summary Generation

**Date**: 2026-01-12
**Purpose**: Trace why summaries aren't being generated/saved to database

## Logging Added

### 1. Summary Node Functions (`lib/agents/langgraph-orchestrator.ts`)

Added comprehensive logging to all 4 summary nodes:
- `summaryChildNode` (lines 296-298)
- `summaryTeenNode` (lines 322-324)
- `summaryUndergradNode` (lines 348-350)
- `summaryPostdocNode` (lines 374-376)

**What's logged:**
- ✓ Confirmation that summary was generated
- ✓ Character count of generated summary
- ✓ Preview of first 80 characters

**Example output:**
```
[Orchestrator] Summary Agent (Child) completed in 1234ms (parallel execution)
[Orchestrator] ✓ Generated child summary: 487 chars
[Orchestrator] ✓ Preview: "Imagine if your parents only worked Monday to Thursday and had every Friday, Satu..."
```

---

### 2. generateSummary Function (`lib/agents/langgraph-orchestrator.ts:538-587`)

Added detailed logging to trace the LLM API call:

**What's logged:**
- 🎯 Which reading level is being generated
- 📊 Question being summarized
- ✓ Whether structure/narrative exist in state
- 📊 Target audience and word count
- 📤 When API call starts
- ✅ API response received with character count
- 📄 Preview of generated text
- ❌ Any errors that occur

**Example output:**
```
[generateSummary] 🎯 Called for level: child
[generateSummary] Question: "Should the UK adopt a 4-day work week?"
[generateSummary] Has structure: true
[generateSummary] Has narrative: true
[generateSummary] Target audience: Children aged 8-12, word count: 100-150
[generateSummary] 📤 Calling Anthropic API (Haiku)...
[generateSummary] ✅ API response received: 487 chars
[generateSummary] Preview: "Imagine if your parents only worked Monday to Thursday..."
```

---

### 3. updateBriefFromState Function (`lib/services/brief-service.ts:145-153`)

Added logging to track what summaries are being saved:

**What's logged:**
- 📊 Which summary keys are present
- 📏 Length of each summary (in characters)
- ⚠️  Warning if NO summaries exist

**Example output:**
```
[BriefService] 📊 Summaries to save: child, teen, undergrad, postdoc
[BriefService] Summary lengths: { child: 487, teen: 623, undergrad: 891, postdoc: 1023 }
```

**If summaries are missing:**
```
[BriefService] ⚠️  NO SUMMARIES to save! state.summaries: {}
```

---

### 4. completeBriefGeneration Function (`lib/services/brief-service.ts:358-369`)

Added logging when the orchestrator finishes and saves to database:

**What's logged:**
- 🎬 Function is called
- ✓ Whether state has summaries
- 📊 Summary keys present
- ⏱️  Generation time
- ✅ Success/failure of update

**Example output:**
```
[BriefService] 🎬 Completing brief generation for abc123...
[BriefService] State has summaries: true
[BriefService] Summaries keys: child, teen, undergrad, postdoc
[BriefService] Generation time: 12345ms
[BriefService] ✅ Successfully updated brief abc123
```

---

### 5. Main generateBrief Function (`lib/agents/langgraph-orchestrator.ts:675-680`)

Added final state logging before returning:

**What's logged:**
- 📊 Final state summary keys
- 📏 Length of each summary in final state

**Example output:**
```
[Orchestrator] Brief generation completed in 12345ms
[Orchestrator] Completed steps: research, classification, structure, narrative, reconcile, summary-child, summary-teen, summary-undergrad, summary-postdoc, clarity
[Orchestrator] 📊 Final state summaries: child, teen, undergrad, postdoc
[Orchestrator] Summary lengths: { child: 487, teen: 623, undergrad: 891, postdoc: 1023 }
```

---

## How to Use This Logging

### 1. Generate a Test Brief

```bash
# Via UI: Go to /ask and generate a brief
# Monitor server logs in terminal
```

### 2. Watch the Logs

Look for these key indicators in order:

#### ✅ **Success Path** (what should happen):
```
1. [generateSummary] 🎯 Called for level: child
2. [generateSummary] ✅ API response received: 487 chars
3. [Orchestrator] ✓ Generated child summary: 487 chars
4. [Orchestrator] 📊 Final state summaries: child, teen, undergrad, postdoc
5. [BriefService] 📊 Summaries to save: child, teen, undergrad, postdoc
6. [BriefService] ✅ Successfully updated brief
```

#### ❌ **Failure Patterns** (what's probably happening):

**Pattern 1: generateSummary never called**
```
[Orchestrator] Starting Summary Child node
❌ NO [generateSummary] logs appear
```
→ **Issue**: Summary nodes aren't executing

**Pattern 2: API call fails**
```
[generateSummary] 🎯 Called for level: child
[generateSummary] 📤 Calling Anthropic API (Haiku)...
[generateSummary] ❌ ERROR for child: <error message>
```
→ **Issue**: Anthropic API error (rate limit, invalid key, etc.)

**Pattern 3: Empty response**
```
[generateSummary] ✅ API response received: 0 chars
[Orchestrator] ✓ Generated child summary: 0 chars
```
→ **Issue**: API returned empty string

**Pattern 4: State not accumulating**
```
[Orchestrator] ✓ Generated child summary: 487 chars
[Orchestrator] 📊 Final state summaries:
```
→ **Issue**: LangGraph state reducer not working

**Pattern 5: Database save skipped**
```
[Orchestrator] 📊 Final state summaries: child, teen, undergrad, postdoc
[BriefService] ⚠️  NO SUMMARIES to save! state.summaries: {}
```
→ **Issue**: State passed to completeBriefGeneration is missing summaries

---

## Quick Diagnostic

After generating a test brief, search logs for:

```bash
# Check if summaries were generated
grep "Generated.*summary:" logs.txt

# Check if summaries were saved
grep "Summaries to save:" logs.txt

# Check for errors
grep "ERROR\|⚠️" logs.txt
```

---

## Files Modified

1. `lib/agents/langgraph-orchestrator.ts`
   - Lines 296-298, 322-324, 348-350, 374-376 (summary nodes)
   - Lines 538-587 (generateSummary function)
   - Lines 675-680 (main generateBrief function)

2. `lib/services/brief-service.ts`
   - Lines 145-153 (updateBriefFromState)
   - Lines 358-369 (completeBriefGeneration)

3. `sample-briefs/uk-four-day-week.json` ✅ **FIXED**
   - Updated keys: child, teen, undergrad, postdoc

4. `sample-briefs/what-is-a-state.json` ✅ **FIXED**
   - Updated keys: child, teen, undergrad, postdoc

---

## Next Steps

1. **Test the sample briefs** (should work now):
   - http://localhost:3000/brief/uk-four-day-week
   - http://localhost:3000/brief/what-is-a-state

2. **Generate a new brief** and monitor logs:
   - Look for the patterns above
   - Identify exactly where the failure occurs

3. **Clean up database**:
   ```sql
   DELETE FROM briefs WHERE summaries = '{}'::jsonb;
   ```

---

## Emoji Legend

- 🎯 Function entry/start
- 📊 Data inspection
- 📤 External API call
- ✅ Success
- ❌ Error
- ⚠️  Warning
- 📏 Size/length info
- 🎬 Major operation start
- ✓ Completion confirmation
