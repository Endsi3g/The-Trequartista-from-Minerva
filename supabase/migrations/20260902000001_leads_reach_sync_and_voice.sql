-- ============================================================================
-- Migration : 20260902000001_leads_reach_sync_and_voice.sql
-- Description : Extension de la table leads pour le scoring IA,
--               le suivi des appels vocaux ElevenLabs et la synchronisation
--               avec Minerva Reach.
-- Version : v2.20.0
-- ============================================================================

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS ai_score INT,
    ADD COLUMN IF NOT EXISTS ai_qualification_notes JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS voice_call_status TEXT DEFAULT 'not_called',
    ADD COLUMN IF NOT EXISTS voice_call_id TEXT,
    ADD COLUMN IF NOT EXISTS reach_id TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_ai_score_check'
    ) THEN
        ALTER TABLE public.leads
            ADD CONSTRAINT leads_ai_score_check CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'leads_voice_call_status_check'
    ) THEN
        ALTER TABLE public.leads
            ADD CONSTRAINT leads_voice_call_status_check CHECK (voice_call_status IN ('not_called', 'calling', 'completed', 'failed'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_ai_score_idx ON public.leads (ai_score);
CREATE INDEX IF NOT EXISTS leads_reach_id_idx ON public.leads (reach_id);
