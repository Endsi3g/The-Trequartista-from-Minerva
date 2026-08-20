-- ============================================================================
-- INTAKE_LEADS QUALIFICATION SCHEMA DRIFT FIX
-- The consolidated migration's intake_leads.status CHECK constraint
-- ('captured','sms_sent','audit_in_progress','proposal_sent','call_booked',
-- 'converted','disqualified') never matched what the application actually
-- reads/writes -- app/api/leads/step-1/route.ts, step-2/route.ts, and
-- sms-followup-callback/route.ts (plus the IntakeLead type in
-- lib/types/index.ts) all use 'step1_abandoned' | 'qualified' | 'converted'
-- | 'discarded', and four columns they depend on (qualification_data,
-- sms_follow_up_status, sms_follow_up_sent_at, qualified_at) were never
-- created. Every step-1/step-2 write has been failing against the CHECK
-- constraint. Idempotent -- safe to run on both fresh and existing databases.
-- ============================================================================

ALTER TABLE public.intake_leads
    ADD COLUMN IF NOT EXISTS qualification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sms_follow_up_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS sms_follow_up_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Conservatively remap any rows written under the old (never-actually-valid)
-- status vocabulary before tightening the CHECK constraint to match reality.
UPDATE public.intake_leads SET status = 'step1_abandoned' WHERE status = 'captured';
UPDATE public.intake_leads SET status = 'discarded' WHERE status = 'disqualified';
UPDATE public.intake_leads SET status = 'qualified' WHERE status IN ('sms_sent', 'audit_in_progress', 'proposal_sent', 'call_booked');

ALTER TABLE public.intake_leads ALTER COLUMN status SET DEFAULT 'step1_abandoned';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_status_check') THEN
        ALTER TABLE public.intake_leads DROP CONSTRAINT intake_leads_status_check;
    END IF;
    ALTER TABLE public.intake_leads
        ADD CONSTRAINT intake_leads_status_check CHECK (status IN ('step1_abandoned', 'qualified', 'converted', 'discarded'));

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_sms_follow_up_status_check') THEN
        ALTER TABLE public.intake_leads
            ADD CONSTRAINT intake_leads_sms_follow_up_status_check
            CHECK (sms_follow_up_status IN ('pending', 'sent', 'failed', 'skipped_qualified', 'skipped_no_config'));
    END IF;
END $$;

-- Phase 3 (Voice AI): same shape as sms_follow_up_status, for the new
-- outbound-call auto-trigger on qualified leads.
ALTER TABLE public.intake_leads
    ADD COLUMN IF NOT EXISTS voice_follow_up_status TEXT NOT NULL DEFAULT 'pending';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_voice_follow_up_status_check') THEN
        ALTER TABLE public.intake_leads
            ADD CONSTRAINT intake_leads_voice_follow_up_status_check
            CHECK (voice_follow_up_status IN ('pending', 'sent', 'failed', 'skipped_converted', 'skipped_no_config', 'skipped_disabled'));
    END IF;
END $$;

-- voice_agent_config: single-row, agency-wide configuration for the
-- ElevenLabs voice agent (persisted Save button + auto-trigger toggle).
CREATE TABLE IF NOT EXISTS public.voice_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id TEXT,
    system_prompt TEXT,
    auto_trigger_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_trigger_delay_seconds INT NOT NULL DEFAULT 300,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "voice_agent_config_select_team" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_select_team" ON public.voice_agent_config FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));

DROP POLICY IF EXISTS "voice_agent_config_admin_write" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_admin_write" ON public.voice_agent_config FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.voice_agent_config ENABLE ROW LEVEL SECURITY;

-- voice_calls has been RLS-enabled (blanket ENABLE ROW LEVEL SECURITY loop
-- in the consolidated migration) but never had a policy defined -- with RLS
-- on and zero policies, every authenticated read silently returns nothing.
-- Only the service-role webhook needs to write here (bypasses RLS already).
DROP POLICY IF EXISTS "voice_calls_select_team" ON public.voice_calls;
CREATE POLICY "voice_calls_select_team" ON public.voice_calls FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));
