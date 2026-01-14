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
