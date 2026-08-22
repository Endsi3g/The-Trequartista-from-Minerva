-- ============================================================================
-- SCHEMA DRIFT FIXES
-- Two pre-existing mismatches between application code and the live schema:
--   1. voice_calls is missing columns the ElevenLabs webhook and VoiceCall
--      type already read/write (insert has been silently failing).
--   2. app_permissions has no uniqueness guarantee, needed so the
--      Paramètres > Permissions page can upsert one row per member profile
--      per permission (the page's "toggle applies to all members" semantics
--      require fan-out writes, not a single global row).
-- Idempotent — safe to run on both fresh and existing databases.
-- ============================================================================

ALTER TABLE public.voice_calls
    ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT,
    ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound',
    ADD COLUMN IF NOT EXISTS caller_name TEXT,
    ADD COLUMN IF NOT EXISTS caller_phone TEXT,
    ADD COLUMN IF NOT EXISTS transcript JSONB,
    ADD COLUMN IF NOT EXISTS outcome TEXT,
    ADD COLUMN IF NOT EXISTS intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL;

-- Live app_permissions has been confirmed NOT to have a profile_id column
-- (2026-08-21 deploy error: "column \"profile_id\" named in key does not
-- exist") despite the consolidated schema file declaring one -- another
-- instance of that file not reliably reflecting live reality for
-- pre-existing tables. Guarded on column existence too, not just the
-- constraint name, so this silently no-ops instead of aborting the whole
-- deploy script until the real column name is confirmed and this is
-- corrected in a follow-up migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_permissions' AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'app_permissions_profile_permission_key'
    ) THEN
        ALTER TABLE public.app_permissions
            ADD CONSTRAINT app_permissions_profile_permission_key UNIQUE (profile_id, permission);
    END IF;
END $$;
