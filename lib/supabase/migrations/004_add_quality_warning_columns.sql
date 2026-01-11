-- Migration: Add quality warning columns for refinement tracking
-- Purpose: Track briefs that fail to meet quality threshold after refinement attempts

-- Add quality_warning boolean column (default false)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS quality_warning BOOLEAN DEFAULT FALSE;

-- Add quality_warning_reason text column (nullable)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS quality_warning_reason TEXT;

-- Add refinement_metadata JSONB column for storing attempt details
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS refinement_metadata JSONB;

-- Index on quality_warning for filtering briefs that need attention
CREATE INDEX IF NOT EXISTS idx_briefs_quality_warning ON public.briefs(quality_warning)
WHERE quality_warning = TRUE;

COMMENT ON COLUMN public.briefs.quality_warning IS 'True if brief failed to meet quality threshold after refinement attempts';
COMMENT ON COLUMN public.briefs.quality_warning_reason IS 'Reason why the brief has a quality warning (e.g., "Score 6.8 after 3 refinement attempts")';
COMMENT ON COLUMN public.briefs.refinement_metadata IS 'JSONB storing refinement attempt details: attempts, fixers deployed, edits made, score progression';
