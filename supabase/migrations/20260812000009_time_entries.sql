-- Migration: Real per-project time tracking (replaces the fake "Track Time" alert() button)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_project_id_idx ON public.time_entries(project_id);

-- Only one open (ended_at IS NULL) timer per user at a time
CREATE UNIQUE INDEX IF NOT EXISTS time_entries_one_open_per_user
  ON public.time_entries(user_id)
  WHERE ended_at IS NULL;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "time_entries_select_own" ON public.time_entries;
CREATE POLICY "time_entries_select_own" ON public.time_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "time_entries_insert_own" ON public.time_entries;
CREATE POLICY "time_entries_insert_own" ON public.time_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "time_entries_update_own" ON public.time_entries;
CREATE POLICY "time_entries_update_own" ON public.time_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "time_entries_delete_own" ON public.time_entries;
CREATE POLICY "time_entries_delete_own" ON public.time_entries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
