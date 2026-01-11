-- Migration: Add credit_refunds table
-- Purpose: Track credit refunds when briefs fail the quality gate
-- Part of Theme 5: Iterative Quality Gate

CREATE TABLE IF NOT EXISTS credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX IF NOT EXISTS idx_credit_refunds_user_id ON credit_refunds(user_id);

-- Index for brief queries
CREATE INDEX IF NOT EXISTS idx_credit_refunds_brief_id ON credit_refunds(brief_id);

-- Row Level Security
ALTER TABLE credit_refunds ENABLE ROW LEVEL SECURITY;

-- Users can only view their own refunds
CREATE POLICY "Users can view own refunds"
  ON credit_refunds
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert refunds
CREATE POLICY "Service role can insert refunds"
  ON credit_refunds
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE credit_refunds IS 'Tracks credit refunds for failed brief generations';
COMMENT ON COLUMN credit_refunds.amount IS 'Number of credits refunded';
COMMENT ON COLUMN credit_refunds.reason IS 'Reason for the refund (e.g., quality gate failure)';
COMMENT ON COLUMN credit_refunds.brief_id IS 'Optional reference to the failed brief';
