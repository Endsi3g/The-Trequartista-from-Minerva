-- ============================================================================
-- Migration : 20260903000001_leads_inbound_scoring_and_events.sql
-- Description : Extension de public.leads pour le scoring inbound,
--               la prise de RDV d'installation, la conformité SMS et les UTMs,
--               ainsi que la création de la table public.lead_events.
-- Version : v2.23.0
-- ============================================================================

-- 1. Extension de la table public.leads
ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS monthly_transactions INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pos_system TEXT,
    ADD COLUMN IF NOT EXISTS business_type TEXT,
    ADD COLUMN IF NOT EXISTS loyalty_goal TEXT,
    ADD COLUMN IF NOT EXISTS is_multi_site BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS qualification_score INT,
    ADD COLUMN IF NOT EXISTS qualification_tier TEXT,
    ADD COLUMN IF NOT EXISTS qualification_breakdown JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS next_action_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS call_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS booking_link TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
    ADD COLUMN IF NOT EXISTS utm_term TEXT,
    ADD COLUMN IF NOT EXISTS utm_content TEXT,
    ADD COLUMN IF NOT EXISTS gclid TEXT,
    ADD COLUMN IF NOT EXISTS consent_sms BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS intervention_checklist JSONB DEFAULT '[]'::jsonb;

-- Contraintes de validation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_qualification_score_check'
    ) THEN
        ALTER TABLE public.leads
            ADD CONSTRAINT leads_qualification_score_check CHECK (
                qualification_score IS NULL OR (qualification_score >= 0 AND qualification_score <= 100)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_qualification_tier_check'
    ) THEN
        ALTER TABLE public.leads
            ADD CONSTRAINT leads_qualification_tier_check CHECK (
                qualification_tier IS NULL OR qualification_tier IN ('A', 'B', 'C')
            );
    END IF;
END $$;

-- Index de recherche et performance
CREATE INDEX IF NOT EXISTS leads_qualification_tier_idx ON public.leads (qualification_tier);
CREATE INDEX IF NOT EXISTS leads_qualification_score_idx ON public.leads (qualification_score);
CREATE INDEX IF NOT EXISTS leads_call_at_idx ON public.leads (call_at);
CREATE INDEX IF NOT EXISTS leads_gclid_idx ON public.leads (gclid);

-- 2. Création de la table public.lead_events
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_events_lead_id_idx ON public.lead_events (lead_id);
CREATE INDEX IF NOT EXISTS lead_events_type_idx ON public.lead_events (event_type);
CREATE INDEX IF NOT EXISTS lead_events_created_at_idx ON public.lead_events (created_at);
CREATE INDEX IF NOT EXISTS lead_events_composite_idx ON public.lead_events (lead_id, event_type);

-- Sécurité RLS
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces lead_events membres" ON public.lead_events;
CREATE POLICY "Acces lead_events membres" ON public.lead_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permettre l'insertion par le service role (ou public anonyme pour l'ingestion API)
DROP POLICY IF EXISTS "Insertion publique lead_events" ON public.lead_events;
CREATE POLICY "Insertion publique lead_events" ON public.lead_events
    FOR INSERT TO anon WITH CHECK (true);

-- Publication Realtime
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_events;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
