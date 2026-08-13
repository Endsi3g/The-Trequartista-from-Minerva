-- Migration: subtask checklist per task, and letting an admin revoke a
-- team invite before its 14-day auto-expiry (today the only way to
-- invalidate one was waiting it out).
CREATE TABLE IF NOT EXISTS public.task_subitems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_subitems_task_id_idx ON public.task_subitems(task_id);

ALTER TABLE public.task_subitems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_subitems_team_all" ON public.task_subitems;
CREATE POLICY "task_subitems_team_all" ON public.task_subitems
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

-- Admin revocation: set expires_at to now() to invalidate an unused
-- invite immediately. Separate from team_invites_update_redeem (which
-- only lets an invitee mark their own invite used).
DROP POLICY IF EXISTS "team_invites_update_admin" ON public.team_invites;
CREATE POLICY "team_invites_update_admin" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
