# State of Clarity - Setup Guide

This guide will help you get State of Clarity running locally in under 10 minutes.

---

## Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- An **Anthropic API key** ([get one here](https://console.anthropic.com/))
- A **Supabase account** ([create one here](https://supabase.com/))

---

## Step 1: Install Dependencies

```bash
cd "State of Clarity _ Claude"
npm install
```

This will install all required packages including Next.js, React, Tailwind CSS, and the Anthropic SDK.

---

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your API keys:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

**Note**: For the MVP, you only need the Anthropic API key. Supabase and other services can be added later.

---

## Step 3: Run the Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000).

You should see:
- ✅ Homepage with "Ask Anything" interface
- ✅ Three showcase briefs
- ✅ Feature cards and footer

---

## Step 4: View Sample Brief

Click on any showcase brief (e.g., "UK 4-Day Work Week") to see the full brief viewer with:
- Progressive summaries (4 reading levels)
- Narrative analysis
- Structured data tables
- Citation sidebar
- Clarity score breakdown

---

## Step 5: Configure OAuth Providers (Optional)

### Google OAuth Setup

To enable "Continue with Google" sign-in:

1. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Select **Web application** as the application type
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://your-domain.com/auth/callback`
     - Supabase callback: `https://your-project.supabase.co/auth/v1/callback`

2. **Configure Supabase**:
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Navigate to **Authentication > Providers**
   - Enable **Google**
   - Enter your **Client ID** and **Client Secret** from Google Cloud Console
   - Save the configuration

3. **Update Authorized Domains** (if needed):
   - In Google Cloud Console, go to **OAuth consent screen**
   - Add your production domain to **Authorized domains**

**Note**: Google OAuth requires HTTPS in production. It works on `localhost` for development.

### Apple OAuth Setup

To enable "Continue with Apple" sign-in:

1. **Apple Developer Account Requirements**:
   - You need an [Apple Developer Program](https://developer.apple.com/programs/) membership ($99/year)
   - Apple Sign In is not available on free developer accounts

2. **Create an App ID**:
   - Go to [Apple Developer Portal](https://developer.apple.com/account/)
   - Navigate to **Certificates, Identifiers & Profiles > Identifiers**
   - Click **+** to create a new identifier
   - Select **App IDs** and click **Continue**
   - Select **App** as the type
   - Enter a description and Bundle ID (e.g., `com.stateofclarity.app`)
   - Under **Capabilities**, enable **Sign in with Apple**
   - Click **Register**

3. **Create a Services ID**:
   - Go to **Identifiers** and click **+**
   - Select **Services IDs** and click **Continue**
   - Enter a description (e.g., "State of Clarity Web")
   - Enter an identifier (e.g., `com.stateofclarity.web`)
   - Click **Register**
   - Click on the newly created Services ID to edit it
   - Enable **Sign in with Apple** and click **Configure**
   - Set the Primary App ID to the App ID created above
   - Add domains:
     - Domain: `your-project.supabase.co` (your Supabase project domain)
     - Return URL: `https://your-project.supabase.co/auth/v1/callback`
   - For development, also add:
     - Domain: `localhost`
     - Return URL: `http://localhost:3000/auth/callback`
   - Click **Save**

4. **Create a Private Key**:
   - Go to **Keys** and click **+**
   - Enter a name (e.g., "State of Clarity Auth Key")
   - Enable **Sign in with Apple** and click **Configure**
   - Select the Primary App ID created above
   - Click **Register** and then **Download** the key file
   - **Important**: Save this key securely – you can only download it once
   - Note the **Key ID** displayed on the page

5. **Configure Supabase**:
   - Go to your [Supabase Dashboard](https://app.supabase.com/)
   - Navigate to **Authentication > Providers**
   - Enable **Apple**
   - Enter the following:
     - **Services ID**: The Services ID identifier (e.g., `com.stateofclarity.web`)
     - **Secret Key**: The contents of the downloaded `.p8` key file
     - **Key ID**: The Key ID from the Apple Developer Portal
     - **Team ID**: Found in the top-right of Apple Developer Portal (10-character code)
   - Save the configuration

**Note**: Apple Sign In requires HTTPS for redirect URLs in production. It may work with `localhost` during development, but some features may be limited.

---

## Step 6: Set Up Supabase (Optional - for full functionality)

### Create Database Tables

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **SQL Editor**
3. Run this schema:

```sql
-- Briefs table
CREATE TABLE briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  clarity_score NUMERIC(3, 1),
  summaries JSONB NOT NULL,
  structured_data JSONB NOT NULL,
  narrative TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id)
);

-- Sources table
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  publication_date DATE,
  publisher TEXT,
  source_type TEXT CHECK (source_type IN ('primary', 'secondary', 'tertiary')),
  political_lean TEXT,
  credibility_score NUMERIC(3, 1),
  excerpt TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brief-Source junction table
CREATE TABLE brief_sources (
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
  PRIMARY KEY (brief_id, source_id)
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('upvote', 'downvote', 'suggest_source', 'spot_error', 'edit_proposal')),
  content TEXT,
  section TEXT,
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_briefs_created_at ON briefs(created_at DESC);
CREATE INDEX idx_briefs_clarity_score ON briefs(clarity_score DESC);
CREATE INDEX idx_feedback_brief_id ON feedback(brief_id);

-- Enable Row Level Security
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for briefs and sources
CREATE POLICY "Public read access" ON briefs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON sources FOR SELECT USING (true);

-- Authenticated users can create feedback
CREATE POLICY "Authenticated users can create feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

4. Enable the **pgvector** extension (for future semantic search):
   - Go to **Database > Extensions**
   - Search for "vector"
   - Enable it

---

## Step 7: Test the Sample Brief

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Click on "UK 4-Day Work Week" showcase brief
3. Try switching between reading levels (Child, Teen, Undergrad, Post-doc)
4. Expand/collapse structured data sections
5. Hover over sources to see details
6. Check the Clarity Score breakdown in the sidebar

---

## Common Issues & Fixes

### Issue: "Module not found" errors

**Fix**: Delete `node_modules` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Fix**: Run on a different port:
```bash
npm run dev -- -p 3001
```

### Issue: Sample brief not loading

**Fix**: Check that `sample-briefs/uk-four-day-week.json` exists. The brief viewer currently imports this file directly.

### Issue: Tailwind styles not applying

**Fix**: Restart the dev server:
```bash
# Stop with Ctrl+C, then:
npm run dev
```

---

## Next Steps

### For Development:

1. **Implement API Routes**:
   - Create `/api/ask` endpoint to generate new briefs
   - Create `/api/brief/[id]` to fetch briefs from Supabase
   - Create `/api/feedback` to handle user submissions

2. **Add LangGraph Workflow**:
   - Set up multi-agent orchestration
   - Integrate Perplexity for research
   - Implement Clarity Score calculation

3. **Build Additional Features**:
   - User authentication (Supabase Auth)
   - Brief versioning & history
   - Community editing & feedback
   - Policy Sandbox (interactive parameter tuning)

### For Production:

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables** in Vercel dashboard

3. **Connect Supabase** production database

4. **Set Up Custom Domain** (optional)

---

## File Structure Overview

```
State of Clarity _ Claude/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── brief/[id]/page.tsx         # Brief viewer
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── sample-briefs/
│   └── uk-four-day-week.json       # Example brief
├── ARCHITECTURE.md                  # Technical design
├── README.md                        # Project overview
├── SETUP.md                         # This file
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

---

## Getting Help

- **Notion Page Issue**: The Notion page you shared requires authentication. Please export it as Markdown or make it publicly accessible to integrate your existing content.

- **Questions**: Feel free to ask! I can help with:
  - Implementing specific features
  - Debugging issues
  - Architectural decisions
  - API integrations

---

## What's Been Built So Far

✅ **Architecture Document** (`ARCHITECTURE.md`)
- Complete system design
- LangGraph agent workflow
- Enhanced Clarity Score algorithm with first-principles coherence (25% weight)
- Data schemas
- API specifications

✅ **Sample Brief** (`sample-briefs/uk-four-day-week.json`)
- Full UK 4-Day Work Week analysis
- All 4 reading levels
- 15 diverse sources (left/center/right)
- Structured tables (definitions, factors, policies, consequences)
- 1,200-word narrative
- Clarity critique with strengths/gaps

✅ **MVP Prototype**
- Homepage with "Ask Anything" interface
- Showcase brief cards
- Full brief viewer with:
  - Progressive summary tabs
  - Expandable structured data sections
  - Citation sidebar with political lean tags
  - Clarity score breakdown
  - Feedback buttons
- Responsive design (mobile + desktop)
- Dark mode support

---

## Ready to Launch? 🚀

Once you've completed the setup, you can:
1. Share the local preview with stakeholders
2. Start collecting feedback on the UX
3. Begin implementing the API layer
4. Prepare for public beta (Q3 2025 target)

**Remember**: The goal is "per-question clarity created" — focus on output quality above all else.
