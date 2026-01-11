-- Migration: Add human review columns to briefs table
-- For US-008: Flag briefs with high scoring disagreement for human review
-- Run after 001_xxx and 002_xxx migrations (if they exist)

-- Add needs_human_review boolean column (default false)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS needs_human_review BOOLEAN DEFAULT FALSE;

-- Add review_reason text column (nullable)
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS review_reason TEXT;

-- Add scoring_metadata JSONB column for dimension breakdown
ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS scoring_metadata JSONB;

-- Index for finding briefs needing review
CREATE INDEX IF NOT EXISTS idx_briefs_needs_human_review 
ON public.briefs(needs_human_review) 
WHERE needs_human_review = TRUE;

-- Comments for documentation
COMMENT ON COLUMN public.briefs.needs_human_review IS 'Flag for briefs with high evaluator disagreement requiring human review';
COMMENT ON COLUMN public.briefs.review_reason IS 'Reason why human review is needed (e.g., tiebreaker invoked, high dimension spread)';
COMMENT ON COLUMN public.briefs.scoring_metadata IS 'JSONB storing dimension scores breakdown, evaluator verdicts, and consensus details';
