-- ============================================================================
-- MINERVA TREQUARTISTA — REVOPS & TEAM COMMISSIONS MIGRATION
-- Migration: 20260828000004_revops_and_team_commissions.sql
-- ============================================================================

-- Table: team_commissions
CREATE TABLE IF NOT EXISTS public.team_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    deal_title TEXT NOT NULL,
    base_amount_cad NUMERIC(10,2) NOT NULL,
    commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    commission_amount_cad NUMERIC(10,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'setup' CHECK (type IN ('setup', 'mrr_recurring', 'bonus_quota')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: team_capacity_profiles
CREATE TABLE IF NOT EXISTS public.team_capacity_profiles (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'generalist' CHECK (specialty IN ('video_production', 'web_framer', 'ads_acquisition', 'pos_operations', 'generalist')),
    weekly_hours_capacity INTEGER NOT NULL DEFAULT 35,
    monthly_quota_cad NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_commissions_profile_id ON public.team_commissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_commissions_status ON public.team_commissions(status);
CREATE INDEX IF NOT EXISTS idx_team_commissions_proposal_id ON public.team_commissions(proposal_id);

ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_capacity_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_commissions' AND policyname = 'team_commissions_auth_all'
    ) THEN
        CREATE POLICY "team_commissions_auth_all" ON public.team_commissions
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_capacity_profiles' AND policyname = 'team_capacity_auth_all'
    ) THEN
        CREATE POLICY "team_capacity_auth_all" ON public.team_capacity_profiles
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
