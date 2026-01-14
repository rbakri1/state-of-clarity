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
