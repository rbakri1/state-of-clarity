-- Migration: Add agent_execution_logs table for observability and optimization
-- Date: 2026-01-09
-- Story: US-006

-- Create agent_execution_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,

  -- Agent details
  agent_name TEXT NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,

  -- Metadata (input/output sizes, parallel execution info, etc.)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_brief_id ON public.agent_execution_logs(brief_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_started_at ON public.agent_execution_logs(started_at DESC);

-- Enable RLS
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access for observability dashboards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_execution_logs' 
    AND policyname = 'Agent execution logs are viewable by everyone'
  ) THEN
    CREATE POLICY "Agent execution logs are viewable by everyone" ON public.agent_execution_logs
      FOR SELECT USING (true);
  END IF;
END $$;

-- Allow system to manage execution logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_execution_logs' 
    AND policyname = 'System can manage agent execution logs'
  ) THEN
    CREATE POLICY "System can manage agent execution logs" ON public.agent_execution_logs
      FOR ALL USING (true);
  END IF;
END $$;

-- Add table comment
COMMENT ON TABLE public.agent_execution_logs IS 'Logs agent execution times and status for observability and optimization';
