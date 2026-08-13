-- Migration: Real internal task delegation. Nothing existed for this
-- before -- Project.assignees was a free-text string array with a
-- hardcoded fake-name fallback when empty, never actually rendered
-- anywhere. This is the real thing: assignable to a specific team member,
-- optionally linked to a project and/or client.
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  -- References profiles (not auth.users directly) so PostgREST can embed
  -- assignee:profiles(full_name) in a single query.
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);

CREATE OR REPLACE FUNCTION public.touch_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_touch_updated_at ON public.tasks;
CREATE TRIGGER tasks_touch_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_tasks_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Internal team only, full visibility (same transparency model as leads/
-- clients/projects) -- clients never see tasks at all.
DROP POLICY IF EXISTS "tasks_team_all" ON public.tasks;
CREATE POLICY "tasks_team_all" ON public.tasks
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
