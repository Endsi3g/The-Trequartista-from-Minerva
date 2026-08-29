-- ============================================================================
-- MINERVA TREQUARTISTA — PROPOSALS & E-SIGNATURE ENGINE MIGRATION
-- Migration: 20260828000003_proposals_and_esignature.sql
-- ============================================================================

-- Enrichissement de la table public.proposals
ALTER TABLE IF EXISTS public.proposals
    ADD COLUMN IF NOT EXISTS proposal_number TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Proposition Commerciale Minerva',
    ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'Client',
    ADD COLUMN IF NOT EXISTS client_email TEXT,
    ADD COLUMN IF NOT EXISTS client_company TEXT,
    ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS scope_phases JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS deliverables JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS subtotal_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tps_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tvq_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_monthly_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS deposit_pct NUMERIC(5,2) DEFAULT 50.00,
    ADD COLUMN IF NOT EXISTS deposit_amount_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_stripe_payment_link TEXT,
    ADD COLUMN IF NOT EXISTS signature_svg_or_base64 TEXT,
    ADD COLUMN IF NOT EXISTS signer_name TEXT,
    ADD COLUMN IF NOT EXISTS signer_ip TEXT,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_proposals_token ON public.proposals(token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_auth_all'
    ) THEN
        CREATE POLICY "proposals_auth_all" ON public.proposals
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_anon_read_token'
    ) THEN
        CREATE POLICY "proposals_anon_read_token" ON public.proposals
            FOR SELECT TO anon USING (token IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_anon_update_sign'
    ) THEN
        CREATE POLICY "proposals_anon_update_sign" ON public.proposals
            FOR UPDATE TO anon USING (token IS NOT NULL) WITH CHECK (token IS NOT NULL);
    END IF;
END $$;
