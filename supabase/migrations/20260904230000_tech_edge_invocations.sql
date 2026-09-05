-- ============================================================================
-- Migration: 20260904230000_tech_edge_invocations.sql
-- Description: Audit and historical logs for Supabase Edge Functions invocations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tech_edge_invocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    http_status INT NOT NULL,
    latency_ms INT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    response JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'preview')),
    triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    triggered_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for quick retrieval on Tech Hub
CREATE INDEX IF NOT EXISTS idx_tech_edge_invocations_created_at ON public.tech_edge_invocations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tech_edge_invocations_function_name ON public.tech_edge_invocations(function_name);

-- Row Level Security
ALTER TABLE public.tech_edge_invocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read tech_edge_invocations" ON public.tech_edge_invocations;
CREATE POLICY "Authenticated users can read tech_edge_invocations"
    ON public.tech_edge_invocations
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tech_edge_invocations" ON public.tech_edge_invocations;
CREATE POLICY "Authenticated users can insert tech_edge_invocations"
    ON public.tech_edge_invocations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow service_role full access
DROP POLICY IF EXISTS "Service role full access on tech_edge_invocations" ON public.tech_edge_invocations;
CREATE POLICY "Service role full access on tech_edge_invocations"
    ON public.tech_edge_invocations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
