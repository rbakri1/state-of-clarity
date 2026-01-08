# Week 1 Setup Guide - Database & Authentication

## ✅ What's Been Built

**Files Created:**
1. `lib/supabase/schema.sql` - Complete database schema
2. `lib/supabase/client.ts` - Supabase client utilities
3. `lib/auth/middleware.ts` - Authentication middleware for API routes
4. `.env.example` - Updated with all required environment variables

---

## 🚀 Step-by-Step Setup (30 minutes)

### Step 1: Create Supabase Project (5 mins)

1. Go to https://supabase.com
2. Click "Start your project"
3. Create new project:
   - **Name:** state-of-clarity
   - **Database Password:** (generate strong password, save it!)
   - **Region:** Choose closest to UK (e.g., London)
4. Wait ~2 minutes for project to provision

---

### Step 2: Deploy Database Schema (5 mins)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy entire contents of `lib/supabase/schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (green play button)
6. Verify success: Should see "Success. No rows returned"

**What this creates:**
- ✅ 8 tables (profiles, briefs, sources, feedback, etc.)
- ✅ Indexes for fast queries
- ✅ Row-level security policies
- ✅ Triggers for auto-updating timestamps
- ✅ Functions for reputation calculation

---

### Step 3: Get API Keys (2 mins)

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY (⚠️ Keep secret!)

---

### Step 4: Sign Up for Tavily AI (3 mins)

1. Go to https://tavily.com
2. Click "Get Started" or "Sign Up"
3. Create account (email + password)
4. Go to **Dashboard → API Keys**
5. Copy API key → `TAVILY_API_KEY`

**Note:** Free tier gives 1,000 searches/month (covers entire MVP!)

---

### Step 5: Sign Up for Anthropic Claude (3 mins)

1. Go to https://console.anthropic.com/
2. Create account
3. Add payment method (required even for free tier)
4. Go to **API Keys**
5. Click "Create Key"
6. Copy key → `ANTHROPIC_API_KEY`

**Note:** Start with $5 credit, should cover initial testing

---

### Step 6: Configure Environment Variables (2 mins)

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```bash
   # Replace these with your actual values
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
   TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Never commit `.env.local` to Git!** (Already in `.gitignore`)

---

### Step 7: Install Dependencies (2 mins)

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### Step 8: Test Database Connection (5 mins)

Create a test script:

```bash
# Create test file
touch test-db-connection.ts
```

**`test-db-connection.ts`:**
```typescript
import { createBrowserClient } from "./lib/supabase/client";

async function testConnection() {
  const supabase = createBrowserClient();

  // Test: Fetch briefs table (should be empty)
  const { data, error } = await supabase.from("briefs").select("*").limit(1);

  if (error) {
    console.error("❌ Database connection failed:", error.message);
  } else {
    console.log("✅ Database connected successfully!");
    console.log("Briefs count:", data.length);
  }

  // Test: Check if tables exist
  const tables = ["briefs", "sources", "feedback", "profiles"];
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.error(`❌ Table "${table}" not found`);
    } else {
      console.log(`✅ Table "${table}" exists`);
    }
  }
}

testConnection();
```

Run it:
```bash
npx tsx test-db-connection.ts
```

**Expected output:**
```
✅ Database connected successfully!
Briefs count: 0
✅ Table "briefs" exists
✅ Table "sources" exists
✅ Table "feedback" exists
✅ Table "profiles" exists
```

---

### Step 9: Test Research Agent (5 mins)

Create test for Tavily integration:

```bash
touch test-research-agent.ts
```

**`test-research-agent.ts`:**
```typescript
import { researchAgent } from "./lib/agents/research-agent";

async function testResearch() {
  console.log("Testing Research Agent with Tavily AI...\n");

  const sources = await researchAgent(
    "What are the economic impacts of a 4-day work week?"
  );

  console.log(`✅ Found ${sources.length} sources\n`);

  // Show first 3 sources
  sources.slice(0, 3).forEach((source, i) => {
    console.log(`${i + 1}. ${source.title}`);
    console.log(`   URL: ${source.url}`);
    console.log(`   Political Lean: ${source.political_lean}`);
    console.log(`   Credibility: ${source.credibility_score}/10`);
    console.log(`   Type: ${source.source_type}\n`);
  });

  // Check diversity
  const leanCounts = sources.reduce((acc, s) => {
    acc[s.political_lean] = (acc[s.political_lean] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("Political diversity:", leanCounts);
}

testResearch().catch(console.error);
```

Run it:
```bash
npx tsx test-research-agent.ts
```

**Expected output:**
```
Testing Research Agent with Tavily AI...

✅ Found 18 sources

1. The results of the world's largest four-day week trial
   URL: https://autonomy.work/portfolio/uk4dwt/
   Political Lean: center-left
   Credibility: 8.5/10
   Type: primary

2. OECD Employment Data
   URL: https://www.oecd.org/employment/...
   Political Lean: center
   Credibility: 9.5/10
   Type: primary

3. Four-day week risks for competitiveness
   URL: https://www.cbi.org.uk/media-centre/...
   Political Lean: center-right
   Credibility: 7.5/10
   Type: secondary

Political diversity: { 'center-left': 7, 'center': 4, 'center-right': 5, 'right': 2 }
```

---

## ✅ Week 1 Complete Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (8 tables)
- [ ] Tavily AI account created (free tier)
- [ ] Anthropic Claude account created
- [ ] Environment variables configured (`.env.local`)
- [ ] Dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Database connection tested ✅
- [ ] Research agent tested ✅

---

## 🎯 What You've Unlocked

**Database:**
- Store briefs, sources, feedback
- User authentication ready
- Row-level security enforced
- Fast queries with indexes

**Research Agent:**
- Tavily AI integration working
- Political lean classification
- Credibility scoring
- Source diversity checking

**Cost Tracking:**
- Tavily: £0.015/search
- Claude (for classification): £0.02/search
- **Total research cost: £0.035 per brief**

---

## 🐛 Troubleshooting

### Error: "Invalid API key" (Supabase)

```bash
# Check .env.local has correct keys
cat .env.local | grep SUPABASE

# Restart dev server to reload env vars
npm run dev
```

### Error: "relation 'briefs' does not exist"

**Fix:** Schema not deployed. Go back to Step 2 and run SQL in Supabase dashboard.

### Error: "Tavily API key invalid"

```bash
# Check key starts with "tvly-"
cat .env.local | grep TAVILY

# Verify on Tavily dashboard: https://tavily.com/dashboard
```

### Error: "Anthropic API rate limit"

**Fix:** You're on free tier. Add payment method in Anthropic console or wait for rate limit reset.

---

## 📊 Cost Tracking (Week 1)

| Service | Usage | Cost |
|---------|-------|------|
| Supabase | Database setup | £0 (free tier) |
| Tavily | ~20 test searches | £0 (free tier) |
| Claude | ~10 classification calls | £0.20 |
| **Total** | | **£0.20** |

---

## 🚀 Next Steps (Week 2)

**Now that database + research agent are working:**

1. **Implement Structure Agent** (extract definitions, factors, policies)
2. **Implement Summary Agent** (4 reading levels)
3. **Implement Narrative Agent** (800-1,200 word essay)
4. **Wire up LangGraph** (orchestrate all agents)
5. **Test end-to-end** brief generation

**Estimated time:** Week 2 (3-5 days)
**Estimated cost:** £50-100 (testing with 100-200 briefs)

---

## 💡 Pro Tips

1. **Use Supabase Studio** (in dashboard) to browse data visually
2. **Monitor Tavily usage** on their dashboard (track quota)
3. **Set Anthropic spending limit** ($10/month initially)
4. **Git commit after each working feature** (easy rollback)
5. **Test with diverse questions** (politics, economics, science)

---

## 📚 Resources

- **Supabase Docs:** https://supabase.com/docs
- **Tavily Docs:** https://docs.tavily.com
- **Anthropic Docs:** https://docs.anthropic.com
- **Next.js Docs:** https://nextjs.org/docs

---

**Week 1 complete!** You now have a working database and research agent. Ready for Week 2? 🚀
