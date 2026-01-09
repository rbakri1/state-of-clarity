-- Migration: Add classification column to briefs table
-- Date: 2026-01-09
-- Description: Adds JSONB classification column to store question classification data
--              (domain, controversyLevel, questionType, temporalScope)

ALTER TABLE public.briefs
ADD COLUMN IF NOT EXISTS classification JSONB;

COMMENT ON COLUMN public.briefs.classification IS 'Question classification data for specialist agent routing (domain, controversyLevel, questionType, temporalScope)';
