-- Migration: 008_add_credits_tables.sql
-- Description: Add tables for credits-based monetization system
-- Date: 2026-01-10

-- Create credit_packages table (defines purchasable credit bundles)
CREATE TABLE IF NOT EXISTS credit_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL CHECK (credits > 0),
    price_gbp DECIMAL(10, 2) NOT NULL CHECK (price_gbp >= 0),
    stripe_price_id VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_credits table (tracks current balance per user)
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_batches table (tracks individual credit purchases with expiry)
CREATE TABLE IF NOT EXISTS credit_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0),
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create credit_transactions table (audit log of all credit movements)
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = purchase/refund, negative = usage/expiry
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'expiry', 'bonus', 'onboarding')),
    description TEXT,
    brief_id UUID REFERENCES briefs(id) ON DELETE SET NULL,
    stripe_payment_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_batches_user_id ON credit_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_batches_expires_at ON credit_batches(expires_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_brief_id ON credit_transactions(brief_id);

-- Create trigger to auto-update updated_at on user_credits
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits_updated_at();

-- Enable RLS on all new tables
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_packages (read-only for all, write via service role only)
CREATE POLICY "Anyone can view active packages" ON credit_packages
    FOR SELECT USING (active = true);

-- RLS Policies for user_credits (users can only see their own)
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all user_credits" ON user_credits
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for credit_batches (users can only see their own)
CREATE POLICY "Users can view own batches" ON credit_batches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit_batches" ON credit_batches
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for credit_transactions (users can only see their own)
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all credit_transactions" ON credit_transactions
    FOR ALL USING (auth.role() = 'service_role');
