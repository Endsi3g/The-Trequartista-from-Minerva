-- Consolidated migration: everything pending/not-yet-applied as of
-- 2026-08-16, merged into one file so `npm run deploy:supabase` only needs
-- to apply a single migration instead of four. Content is unchanged from
-- the original files it replaces (20260815000001_settings_blocks.sql,
-- 20260815000002_academy_sops_notion_import.sql,
-- 20260815000003_profiles_default_view.sql,
-- 20260816000001_voice_calls.sql) -- just concatenated in order.

-- ============================================================
-- 1. Settings/Onboarding/Help/Changelog UI blocks
--    (was 20260815000001_settings_blocks.sql)
-- ============================================================

-- 1a. Extended profile fields (Settings Profile 5)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS github TEXT;

-- 1b. Structured changelog (Changelog 8) -- version tag + a short list of
-- bullet items shipped in that entry, shown as a checklist under the body.
ALTER TABLE public.changelog_entries
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}';

-- 1c. Notification preferences (Settings Notifications 3) -- one row per
-- user, one boolean per category. Categories match the three real
-- notification sources already wired in the app: push (Web Push,
-- chantier 7), task reminders (Vercel Cron overdue-task nudges, chantier
-- 5), and changelog announcements (new entries published, chantier 8).
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  task_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  changelog_announcements_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences_own" ON public.notification_preferences;
CREATE POLICY "notification_preferences_own" ON public.notification_preferences
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Academy SOPs <-> Notion import tracking
--    (was 20260815000002_academy_sops_notion_import.sql)
-- ============================================================

-- Tracks which academy_sops rows were imported from a Notion page, so a
-- re-import (clicking "Importer" again after editing the Notion source)
-- updates the existing SOP instead of creating a duplicate every time.
ALTER TABLE public.academy_sops
  ADD COLUMN IF NOT EXISTS notion_page_id TEXT UNIQUE;

-- ============================================================
-- 3. Profile default landing view
--    (was 20260815000003_profiles_default_view.sql)
-- ============================================================

-- Onboarding 1 (5-step wizard) lets a new member pick their default
-- landing view -- previously this choice was thrown away after a single
-- redirect (never persisted), so it had no effect on future logins.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_view TEXT;

-- ============================================================
-- 4. Voice call log (/voice-agent dashboard real data source)
--    (was 20260816000001_voice_calls.sql)
-- ============================================================

-- Real call-log persistence for the /voice-agent dashboard. Previously
-- that page showed a hardcoded fictional call history and volume chart
-- (RECENT_CALLS / CALL_VOLUME_DATA literals) with no real data source at
-- all -- this table gives the ElevenLabs post-call webhook somewhere real
-- to record every call, so the dashboard can show honest data (including
-- an honest empty state until real calls start coming in).
CREATE TABLE IF NOT EXISTS public.voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  elevenlabs_conversation_id TEXT UNIQUE,
  direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  caller_name TEXT,
  caller_phone TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'abandoned', 'failed')),
  transcript JSONB,
  outcome TEXT,
  intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS voice_calls_created_at_idx ON public.voice_calls(created_at DESC);

ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

-- Same access shape as the audits tables: any authenticated internal team
-- member (not a client-portal user) can read/write. The webhook itself
-- uses the service-role key and bypasses RLS entirely.
DROP POLICY IF EXISTS "voice_calls_team_all" ON public.voice_calls;
CREATE POLICY "voice_calls_team_all" ON public.voice_calls
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
