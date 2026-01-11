-- Migration: Add quality_gate_metadata column to briefs table
-- US-012: Quality gate metrics logging

-- Add quality_gate_metadata JSONB column to briefs table
-- This stores detailed quality gate metrics for analysis
ALTER TABLE IF EXISTS briefs
ADD COLUMN IF NOT EXISTS quality_gate_metadata JSONB DEFAULT NULL;

-- Add comment describing the column
COMMENT ON COLUMN briefs.quality_gate_metadata IS 'Stores quality gate metrics: initial_score, final_score, attempts, tier, decision, refund, evaluator_scores, refinement_history';

-- Create agent_execution_logs table if it doesn't exist
-- This logs all agent pipeline steps for observability
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('research', 'generation', 'quality_gate', 'refinement', 'save', 'refund', 'retry_queue', 'error')),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quality_gate_decisions table to track all quality gate decisions
-- This enables analysis of pass rate, average attempts, refund rate
CREATE TABLE IF NOT EXISTS quality_gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  execution_id UUID NOT NULL,
  question TEXT NOT NULL,
  initial_score DECIMAL(3,1),
  final_score DECIMAL(3,1) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('high', 'acceptable', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 1,
  publishable BOOLEAN NOT NULL,
  refund_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  retry_scheduled BOOLEAN NOT NULL DEFAULT FALSE,
  evaluator_scores JSONB,
  refinement_history JSONB,
  decision_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_execution_id ON agent_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_brief_id ON agent_execution_logs(brief_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_step_type ON agent_execution_logs(step_type);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_created_at ON agent_execution_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_quality_gate_decisions_tier ON quality_gate_decisions(tier);
CREATE INDEX IF NOT EXISTS idx_quality_gate_decisions_created_at ON quality_gate_decisions(created_at);
CREATE INDEX IF NOT EXISTS idx_quality_gate_decisions_publishable ON quality_gate_decisions(publishable);

-- RLS policies (assuming public access for now, update as needed)
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_gate_decisions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read logs
CREATE POLICY IF NOT EXISTS "Allow authenticated read access to agent_execution_logs"
ON agent_execution_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated read access to quality_gate_decisions"
ON quality_gate_decisions FOR SELECT
TO authenticated
USING (true);

-- Allow service role to insert/update
CREATE POLICY IF NOT EXISTS "Allow service role full access to agent_execution_logs"
ON agent_execution_logs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow service role full access to quality_gate_decisions"
ON quality_gate_decisions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
