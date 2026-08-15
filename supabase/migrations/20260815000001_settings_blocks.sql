-- Migration: data model for the new Settings/Onboarding/Help/Changelog UI
-- blocks (Profile 5, Members 2, Notifications 3, Changelog 8) -- extends
-- profiles with the extra fields Profile 5's editor/preview needs,
-- structures changelog_entries with a version + included-items list, and
-- adds a real notification_preferences table (Notifications 3 has nothing
-- to read/write against otherwise).

-- 1. Extended profile fields (Settings Profile 5)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS twitter TEXT,
  ADD COLUMN IF NOT EXISTS linkedin TEXT,
  ADD COLUMN IF NOT EXISTS github TEXT;

-- 2. Structured changelog (Changelog 8) -- version tag + a short list of
-- bullet items shipped in that entry, shown as a checklist under the body.
ALTER TABLE public.changelog_entries
  ADD COLUMN IF NOT EXISTS version TEXT,
  ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}';

-- 3. Notification preferences (Settings Notifications 3) -- one row per
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

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
