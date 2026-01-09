-- Migration 005: Add agent_execution_logs table for refinement metrics
-- This table stores execution logs for agent operations, particularly refinement attempts

-- Create agent_execution_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Link to brief (optional, may be null for standalone operations)
  brief_id UUID REFERENCES public.briefs(id) ON DELETE CASCADE,
  
  -- Agent identification
  agent_name TEXT NOT NULL,
  agent_type TEXT NOT NULL, -- 'fixer', 'orchestrator', 'reconciliation', 'refinement_loop'
  
  -- Execution timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed', 'skipped')),
  
  -- Error tracking
  error_message TEXT,
  
  -- Metrics and details (JSONB for flexibility)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_brief_id ON public.agent_execution_logs(brief_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agent_type ON public.agent_execution_logs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_status ON public.agent_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON public.agent_execution_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agent execution logs are viewable by everyone" ON public.agent_execution_logs
  FOR SELECT USING (true);

CREATE POLICY "System can manage agent execution logs" ON public.agent_execution_logs
  FOR ALL USING (true);

COMMENT ON TABLE public.agent_execution_logs IS 'Stores execution logs for agent operations including refinement attempts and fixer agent runs';
COMMENT ON COLUMN public.agent_execution_logs.agent_type IS 'Type of agent: fixer, orchestrator, reconciliation, refinement_loop';
COMMENT ON COLUMN public.agent_execution_logs.metadata IS 'JSONB containing agent-specific metrics like edits count, scores, cost estimates';
