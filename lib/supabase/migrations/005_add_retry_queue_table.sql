-- Migration: Add retry_queue table for quality gate retry system
-- Run after schema.sql is deployed

-- Retry queue table for failed briefs awaiting automated retry
CREATE TABLE IF NOT EXISTS public.retry_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference to the failed brief job
  brief_id UUID REFERENCES public.brief_jobs(id) ON DELETE CASCADE,
  
  -- Original question for regeneration
  original_question TEXT NOT NULL,
  
  -- Classification from research phase (JSONB)
  classification JSONB,
  
  -- Why the brief failed quality gate
  failure_reason TEXT NOT NULL,
  
  -- Parameters for retry attempt (different persona, adjusted prompts, etc.)
  retry_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- When to attempt retry
  scheduled_at TIMESTAMPTZ NOT NULL,
  
  -- Number of retry attempts made
  attempts INTEGER DEFAULT 0,
  
  -- Status of retry item
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'abandoned')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON public.retry_queue(status);
CREATE INDEX IF NOT EXISTS idx_retry_queue_scheduled_at ON public.retry_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_retry_queue_brief_id ON public.retry_queue(brief_id);

-- Composite index for queue polling: pending items ready for processing
CREATE INDEX IF NOT EXISTS idx_retry_queue_pending_scheduled 
  ON public.retry_queue(status, scheduled_at) 
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.retry_queue ENABLE ROW LEVEL SECURITY;

-- Policy: System can manage retry queue
CREATE POLICY "System can manage retry queue" ON public.retry_queue
  FOR ALL USING (true);

COMMENT ON TABLE public.retry_queue IS 'Queue for briefs that failed quality gate and need automated retry with adjusted parameters';
COMMENT ON COLUMN public.retry_queue.retry_params IS 'JSONB with retry-specific params: different_persona, adjusted_prompts, increased_source_diversity';
COMMENT ON COLUMN public.retry_queue.status IS 'pending=awaiting retry, processing=retry in progress, completed=retry succeeded, abandoned=max attempts exceeded';
