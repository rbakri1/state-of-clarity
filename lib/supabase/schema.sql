-- State of Clarity Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension (for future semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

---
--- TABLES
---

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 280)
);

-- Briefs table
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  -- User who created (null for system-generated showcase briefs)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Content (JSONB for flexibility)
  summaries JSONB NOT NULL,
  structured_data JSONB NOT NULL,
  narrative TEXT NOT NULL,

  -- Optional sections (for foundational topics)
  posit JSONB,
  historical_summary JSONB,
  foundational_principles JSONB,

  -- Quality metrics
  clarity_score NUMERIC(3, 1),
  clarity_critique JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Versioning (for tracking edits)
  fork_of UUID REFERENCES public.briefs(id) ON DELETE SET NULL,

  -- Full-text search (for future use)
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(question, '') || ' ' || coalesce(narrative, ''))
  ) STORED
);

-- Sources table
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Source details
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  publication_date DATE,

  -- Classification
  source_type TEXT CHECK (source_type IN ('primary', 'secondary', 'tertiary')),
  political_lean TEXT CHECK (political_lean IN ('left', 'center-left', 'center', 'center-right', 'right', 'unknown')),
  credibility_score NUMERIC(3, 1) CHECK (credibility_score >= 0 AND credibility_score <= 10),

  -- Content
  excerpt TEXT,
  full_content TEXT, -- Cached from Tavily

  -- Timestamps
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brief-Source junction table (many-to-many)
CREATE TABLE public.brief_sources (
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,

  -- Order in which source appears in brief
  display_order INTEGER,

  -- How this source was used in the brief
  usage_note TEXT,

  PRIMARY KEY (brief_id, source_id)
);

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,

  -- User who submitted (null for anonymous feedback)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Feedback type
  type TEXT NOT NULL CHECK (type IN ('upvote', 'downvote', 'suggest_source', 'spot_error', 'edit_proposal')),

  -- Content (for suggestions/errors)
  content TEXT,
  section TEXT, -- Which section of the brief

  -- Status (for moderation)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved briefs (user bookmarks)
CREATE TABLE public.saved_briefs (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, brief_id)
);

-- Reading history (track what users have read)
CREATE TABLE public.reading_history (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,

  -- Time spent reading (seconds)
  time_spent INTEGER,

  -- Completion percentage
  scroll_depth NUMERIC(3, 2), -- 0.00 to 1.00

  -- Timestamps
  first_viewed_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, brief_id)
);

-- Question templates (curated example questions for autocomplete)
CREATE TABLE public.question_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  question_text TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brief generation jobs (for tracking async generation)
CREATE TABLE public.brief_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Input
  question TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'structuring', 'writing', 'scoring', 'completed', 'failed')),
  current_stage TEXT,
  progress NUMERIC(3, 2) DEFAULT 0, -- 0.00 to 1.00

  -- Output
  brief_id UUID REFERENCES public.briefs(id) ON DELETE SET NULL,

  -- Error tracking
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Cost tracking
  api_cost_gbp NUMERIC(6, 4) -- Track actual cost per brief
);

---
--- INDEXES
---

-- Briefs
CREATE INDEX idx_briefs_created_at ON public.briefs(created_at DESC);
CREATE INDEX idx_briefs_clarity_score ON public.briefs(clarity_score DESC);
CREATE INDEX idx_briefs_user_id ON public.briefs(user_id);
CREATE INDEX idx_briefs_search_vector ON public.briefs USING GIN(search_vector);

-- Sources
CREATE INDEX idx_sources_political_lean ON public.sources(political_lean);
CREATE INDEX idx_sources_credibility_score ON public.sources(credibility_score DESC);
CREATE INDEX idx_sources_publication_date ON public.sources(publication_date DESC);

-- Feedback
CREATE INDEX idx_feedback_brief_id ON public.feedback(brief_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);

-- Prevent duplicate votes (partial unique index)
CREATE UNIQUE INDEX idx_unique_vote_per_user ON public.feedback(brief_id, user_id, type)
  WHERE type IN ('upvote', 'downvote');

-- Brief jobs
CREATE INDEX idx_brief_jobs_status ON public.brief_jobs(status);
CREATE INDEX idx_brief_jobs_user_id ON public.brief_jobs(user_id);
CREATE INDEX idx_brief_jobs_created_at ON public.brief_jobs(created_at DESC);

---
--- FUNCTIONS
---

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate user reputation score
CREATE OR REPLACE FUNCTION calculate_user_reputation(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  reputation INTEGER := 0;
BEGIN
  -- Upvotes received on feedback
  SELECT reputation + COUNT(*) INTO reputation
  FROM public.feedback
  WHERE user_id = user_uuid AND type = 'upvote';

  -- Accepted suggestions (10 points each)
  SELECT reputation + (COUNT(*) * 10) INTO reputation
  FROM public.feedback
  WHERE user_id = user_uuid AND status = 'accepted' AND type = 'suggest_source';

  -- Accepted error spots (5 points each)
  SELECT reputation + (COUNT(*) * 5) INTO reputation
  FROM public.feedback
  WHERE user_id = user_uuid AND status = 'accepted' AND type = 'spot_error';

  -- High-quality briefs (20 points for each brief with score ≥8)
  SELECT reputation + (COUNT(*) * 20) INTO reputation
  FROM public.briefs
  WHERE user_id = user_uuid AND clarity_score >= 8.0;

  RETURN reputation;
END;
$$ LANGUAGE plpgsql;

---
--- ROW LEVEL SECURITY (RLS)
---

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Briefs: Public read, authenticated users can create
CREATE POLICY "Briefs are viewable by everyone" ON public.briefs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create briefs" ON public.briefs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own briefs" ON public.briefs
  FOR UPDATE USING (auth.uid() = user_id);

-- Sources: Public read, system can insert
CREATE POLICY "Sources are viewable by everyone" ON public.sources
  FOR SELECT USING (true);

CREATE POLICY "System can insert sources" ON public.sources
  FOR INSERT WITH CHECK (true);

-- Brief-sources: Public read, system can manage
CREATE POLICY "Brief-sources are viewable by everyone" ON public.brief_sources
  FOR SELECT USING (true);

CREATE POLICY "System can manage brief-sources" ON public.brief_sources
  FOR ALL USING (true);

-- Feedback: Public read for accepted feedback, authenticated users can submit
CREATE POLICY "Accepted feedback is viewable by everyone" ON public.feedback
  FOR SELECT USING (status = 'accepted' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can submit feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR user_id IS NULL);

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Saved briefs: Users can manage their own
CREATE POLICY "Users can view own saved briefs" ON public.saved_briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save briefs" ON public.saved_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave briefs" ON public.saved_briefs
  FOR DELETE USING (auth.uid() = user_id);

-- Reading history: Users can manage their own
CREATE POLICY "Users can view own reading history" ON public.reading_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track their reading" ON public.reading_history
  FOR ALL USING (auth.uid() = user_id);

-- Brief jobs: Users can view own jobs
CREATE POLICY "Users can view own brief jobs" ON public.brief_jobs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can manage brief jobs" ON public.brief_jobs
  FOR ALL USING (true);

-- Question templates: Public read, service_role write
CREATE POLICY "Question templates are viewable by everyone" ON public.question_templates
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage question templates" ON public.question_templates
  FOR ALL USING (auth.role() = 'service_role');

---
--- SEED DATA (Optional - for testing)
---

-- Insert showcase briefs (from sample-briefs/*.json)
-- These will be inserted via migration script after schema is deployed

COMMENT ON TABLE public.briefs IS 'Stores generated policy briefs with all content layers';
COMMENT ON TABLE public.sources IS 'Stores sources used in briefs with classification metadata';
COMMENT ON TABLE public.feedback IS 'User feedback on briefs (votes, suggestions, error reports)';
COMMENT ON TABLE public.brief_jobs IS 'Tracks async brief generation jobs for status updates';
COMMENT ON COLUMN public.briefs.clarity_score IS 'Overall quality score 0-10 from automated scoring algorithm';
COMMENT ON COLUMN public.sources.political_lean IS 'Political bias classification for source diversity tracking';
