-- Migration: Add view_count column to briefs table
-- For US-001: Track brief views for 'Most Read' sorting on Explore page

-- Add view_count integer column (default 0)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Index for sorting by most read
CREATE INDEX IF NOT EXISTS idx_briefs_view_count 
ON public.briefs(view_count DESC);

-- Comment for documentation
COMMENT ON COLUMN public.briefs.view_count IS 'Number of times this brief has been viewed';
