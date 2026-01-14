-- Migration: Add Accountability Tracker tables
-- For investigative journalism corruption investigation feature

-- ============================================
-- Table: accountability_investigations
-- Main table for storing investigation data
-- ============================================

CREATE TABLE IF NOT EXISTS public.accountability_investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_entity TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'organization')),
    ethics_acknowledged_at TIMESTAMPTZ NOT NULL,
    profile_data JSONB DEFAULT '{}',
    corruption_scenarios JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 10),
    quality_notes TEXT[],
    generation_time_ms INTEGER,
    data_sources_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment for documentation
COMMENT ON TABLE public.accountability_investigations IS 'Stores accountability tracker investigations for corruption research';
COMMENT ON COLUMN public.accountability_investigations.entity_type IS 'Type of entity: individual or organization';
COMMENT ON COLUMN public.accountability_investigations.ethics_acknowledged_at IS 'When user acknowledged ethics guidelines';
COMMENT ON COLUMN public.accountability_investigations.profile_data IS 'JSON profile data collected from various sources';
COMMENT ON COLUMN public.accountability_investigations.corruption_scenarios IS 'AI-generated potential corruption scenarios';
COMMENT ON COLUMN public.accountability_investigations.action_items IS 'Recommended investigation action items';
COMMENT ON COLUMN public.accountability_investigations.quality_score IS 'Quality gate score (0-10)';

-- ============================================
-- Trigger: Auto-update updated_at on UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION public.update_accountability_investigations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_accountability_investigations_updated_at ON public.accountability_investigations;
CREATE TRIGGER trigger_update_accountability_investigations_updated_at
    BEFORE UPDATE ON public.accountability_investigations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_accountability_investigations_updated_at();

-- ============================================
-- Table: accountability_investigation_sources
-- Tracks data sources used in investigations
-- ============================================

CREATE TABLE IF NOT EXISTS public.accountability_investigation_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID NOT NULL REFERENCES public.accountability_investigations(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('companies_house', 'charity_commission', 'register_of_interests', 'electoral_commission', 'contracts_finder', 'web_search', 'gov_uk', 'other')),
    url TEXT NOT NULL,
    title TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    data_extracted JSONB,
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'disputed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments for documentation
COMMENT ON TABLE public.accountability_investigation_sources IS 'Tracks all data sources used in investigations for audit trail and transparency';
COMMENT ON COLUMN public.accountability_investigation_sources.source_type IS 'Type of data source: companies_house, charity_commission, etc.';
COMMENT ON COLUMN public.accountability_investigation_sources.verification_status IS 'Status: verified, unverified, or disputed';

-- ============================================
-- Indexes for accountability_investigations
-- ============================================

CREATE INDEX IF NOT EXISTS idx_investigations_user_id ON public.accountability_investigations(user_id);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON public.accountability_investigations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investigations_target ON public.accountability_investigations(target_entity);
CREATE INDEX IF NOT EXISTS idx_investigations_quality_score ON public.accountability_investigations(quality_score) WHERE quality_score IS NOT NULL;

-- ============================================
-- Indexes for accountability_investigation_sources
-- ============================================

CREATE INDEX IF NOT EXISTS idx_investigation_sources_investigation_id ON public.accountability_investigation_sources(investigation_id);
CREATE INDEX IF NOT EXISTS idx_investigation_sources_source_type ON public.accountability_investigation_sources(source_type);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on accountability_investigations
ALTER TABLE public.accountability_investigations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on accountability_investigation_sources
ALTER TABLE public.accountability_investigation_sources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for accountability_investigations
-- ============================================

-- Users can SELECT their own investigations
DROP POLICY IF EXISTS "Users can view own investigations" ON public.accountability_investigations;
CREATE POLICY "Users can view own investigations" ON public.accountability_investigations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can INSERT investigations (only for themselves)
DROP POLICY IF EXISTS "Users can create investigations" ON public.accountability_investigations;
CREATE POLICY "Users can create investigations" ON public.accountability_investigations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own investigations
DROP POLICY IF EXISTS "Users can update own investigations" ON public.accountability_investigations;
CREATE POLICY "Users can update own investigations" ON public.accountability_investigations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role has full access to investigations
DROP POLICY IF EXISTS "Service role has full access to investigations" ON public.accountability_investigations;
CREATE POLICY "Service role has full access to investigations" ON public.accountability_investigations
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- RLS Policies for accountability_investigation_sources
-- ============================================

-- Users can SELECT sources for their own investigations
DROP POLICY IF EXISTS "Users can view sources for own investigations" ON public.accountability_investigation_sources;
CREATE POLICY "Users can view sources for own investigations" ON public.accountability_investigation_sources
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.accountability_investigations
            WHERE id = investigation_id AND user_id = auth.uid()
        )
    );

-- Service role has full access to sources
DROP POLICY IF EXISTS "Service role has full access to sources" ON public.accountability_investigation_sources;
CREATE POLICY "Service role has full access to sources" ON public.accountability_investigation_sources
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');
