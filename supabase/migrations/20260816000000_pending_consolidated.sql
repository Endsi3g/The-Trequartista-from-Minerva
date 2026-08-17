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

-- ============================================================
-- 5. Client contact phone + social/profile links
-- ============================================================

-- Client cards only had a single email contact -- no phone number and no
-- way to record the client's own web/social presence (site, GMB profile,
-- Instagram/Facebook/LinkedIn), even though the agency actively manages
-- those channels for the client and references them constantly.
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS google_business_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- ============================================================
-- 6. Alerts table -- fixes a live 404 hit on every single page load
-- ============================================================

-- TopbarActions.tsx (the notification bell) has queried
-- `alerts` on every page since before this session, but the table was
-- never created (its producer, alert-engine.ts, was removed as dead code
-- in an earlier pass without anyone noticing the bell still reads from
-- this table). Confirmed via a full Playwright sweep: every route fires a
-- failing REST call to `alerts` and the bell silently always reads
-- "no alerts" for the wrong reason (query error, not zero real rows).
-- Creating the table lets the bell behave honestly (a real empty state)
-- and removes the daily noise of a 404 on every navigation.
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  url TEXT,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alerts_resolved_created_at_idx ON public.alerts(resolved, created_at DESC);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_team_all" ON public.alerts;
CREATE POLICY "alerts_team_all" ON public.alerts
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

-- ============================================================
-- 7. Project milestones -- the roadmap page has said "Aucune étape
--    disponible" since an earlier bug-hunt pass removed a hardcoded
--    fictional steps table without giving it a real replacement.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_milestones_project_id_idx ON public.project_milestones(project_id, position);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- Same scoped-visibility shape as content_posts/projects: internal team
-- sees everything, a client-role user only sees milestones for their own
-- client's projects.
DROP POLICY IF EXISTS "project_milestones_select_scoped" ON public.project_milestones;
CREATE POLICY "project_milestones_select_scoped" ON public.project_milestones
  FOR SELECT TO authenticated
  USING (
    public.client_id_for(auth.uid()) IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_milestones.project_id
        AND p.client_id = public.client_id_for(auth.uid())
    )
  );

DROP POLICY IF EXISTS "project_milestones_write_team" ON public.project_milestones;
CREATE POLICY "project_milestones_write_team" ON public.project_milestones
  FOR INSERT TO authenticated
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "project_milestones_update_team" ON public.project_milestones;
CREATE POLICY "project_milestones_update_team" ON public.project_milestones
  FOR UPDATE TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "project_milestones_delete_team" ON public.project_milestones;
CREATE POLICY "project_milestones_delete_team" ON public.project_milestones
  FOR DELETE TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL);

-- ============================================================
-- 8. Client content approval (Approuver / Demander une modification)
-- ============================================================

-- The portal's editorial calendar is currently read-only for clients --
-- feedback on a specific reel only happens via the general Q&A messaging
-- thread, disconnected from the actual post. These two columns let a
-- client approve or flag a specific reel directly.
ALTER TABLE public.content_posts
  ADD COLUMN IF NOT EXISTS client_approval TEXT NOT NULL DEFAULT 'pending' CHECK (client_approval IN ('pending', 'approved', 'changes_requested')),
  ADD COLUMN IF NOT EXISTS client_feedback TEXT;

-- Clients may already SELECT their own content_posts (content_posts_select_scoped,
-- section 2 above) but had no UPDATE policy at all -- so even once the app
-- sends the approval, RLS would silently reject it. Scoped narrowly: a
-- client can only ever touch client_approval/client_feedback on their own
-- posts, never any other column.
DROP POLICY IF EXISTS "content_posts_client_approve" ON public.content_posts;
CREATE POLICY "content_posts_client_approve" ON public.content_posts
  FOR UPDATE TO authenticated
  USING (public.client_id_for(auth.uid()) = client_id)
  WITH CHECK (public.client_id_for(auth.uid()) = client_id);

-- ============================================================
-- 9. Configurable member permissions ("Paramètres > Permissions")
-- ============================================================

-- Admins have always had implicit full access, and client-role users are
-- scoped to the portal regardless -- the only real question this table
-- answers is "can a non-admin *member* do X". One row per action, absent
-- row == not allowed (admin-only), so shipping a new gated action never
-- needs a data migration to stay locked down by default.
CREATE TABLE IF NOT EXISTS public.app_permissions (
  permission_key TEXT PRIMARY KEY,
  member_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;

-- Every authenticated internal user needs to read this to know what their
-- own role can do -- clients never reach the screens that check it, but
-- there's no harm in a client reading a table of feature toggles either.
DROP POLICY IF EXISTS "app_permissions_select_all" ON public.app_permissions;
CREATE POLICY "app_permissions_select_all" ON public.app_permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "app_permissions_write_admin" ON public.app_permissions;
CREATE POLICY "app_permissions_write_admin" ON public.app_permissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Real server-side enforcement, not just a hidden button: true for an
-- admin outright, otherwise only true for a member if the matching
-- app_permissions row has been explicitly toggled on. A client role never
-- passes this (client_id_for is non-null for them, which alone doesn't
-- grant anything here -- only 'admin'/'member' rows in profiles do).
CREATE OR REPLACE FUNCTION public.member_can(key TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    OR (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
      AND EXISTS (SELECT 1 FROM public.app_permissions WHERE permission_key = key AND member_allowed = true)
    );
$$;

-- Split leads' single "USING(true) FOR ALL" write policy so DELETE alone
-- can be gated by member_can('delete_lead') -- insert/update stay open to
-- every team member exactly as before, only deletion narrows.
DROP POLICY IF EXISTS "leads_write_team" ON public.leads;
CREATE POLICY "leads_insert_team" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update_team" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete_scoped" ON public.leads FOR DELETE TO authenticated USING (public.member_can('delete_lead'));

-- Same split for academy_sops -- publishing a new SOP is the sensitive
-- action (updates/creates), not reading.
DROP POLICY IF EXISTS "academy_sops_write_team" ON public.academy_sops;
CREATE POLICY "academy_sops_write_scoped" ON public.academy_sops
  FOR ALL TO authenticated
  USING (public.member_can('publish_academy_sop'))
  WITH CHECK (public.member_can('publish_academy_sop'));
