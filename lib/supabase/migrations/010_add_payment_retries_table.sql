-- Payment retries table for auto-retry of failed payments
-- US-007: Implement payment retry logic

CREATE TABLE IF NOT EXISTS payment_retries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_payment_intent_id TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'succeeded', 'failed')),
  package_id UUID REFERENCES credit_packages(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for finding pending retries
CREATE INDEX IF NOT EXISTS idx_payment_retries_next_retry ON payment_retries(next_retry_at) WHERE status IN ('pending', 'retrying');

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_payment_retries_user_id ON payment_retries(user_id);

-- Index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_payment_retries_payment_intent ON payment_retries(stripe_payment_intent_id);

-- RLS policies
ALTER TABLE payment_retries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own payment retries
CREATE POLICY "Users can view own payment retries" ON payment_retries
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all payment retries
CREATE POLICY "Service role can manage all payment retries" ON payment_retries
  FOR ALL USING (auth.role() = 'service_role');
