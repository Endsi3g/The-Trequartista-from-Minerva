-- Migration: In-app changelog (Chantier 8) -- CHANGELOG.md at the repo
-- root is the technical record, but nobody on the team sees it without
-- opening GitHub. This makes shipped changes visible inside the app
-- itself, with an optional screenshot per entry.
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Every internal team member can read; clients never see this (it's about
-- the tool itself, not their account). Only admins can publish.
DROP POLICY IF EXISTS "changelog_entries_select_team" ON public.changelog_entries;
CREATE POLICY "changelog_entries_select_team" ON public.changelog_entries
  FOR SELECT TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "changelog_entries_insert_admin" ON public.changelog_entries;
CREATE POLICY "changelog_entries_insert_admin" ON public.changelog_entries
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "changelog_entries_delete_admin" ON public.changelog_entries;
CREATE POLICY "changelog_entries_delete_admin" ON public.changelog_entries
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
