-- Migration: Add is_public column to briefs table
-- For US-002: Track brief visibility for privacy on Explore page

-- Add is_public boolean column (default true)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Index for filtering public briefs on Explore page
CREATE INDEX IF NOT EXISTS idx_briefs_is_public 
ON public.briefs(is_public) WHERE is_public = true;

-- Comment for documentation
COMMENT ON COLUMN public.briefs.is_public IS 'Whether the brief is visible on the public Explore page';
