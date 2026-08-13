-- Migration: Advanced task delegation -- link a task to a lead (not just a
-- project/client), and a real comment thread per task.
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tasks_lead_id_idx ON public.tasks(lead_id);

CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Same transparency model as tasks itself -- any team member (not a
-- client) can read and comment.
DROP POLICY IF EXISTS "task_comments_team_all" ON public.task_comments;
CREATE POLICY "task_comments_team_all" ON public.task_comments
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
