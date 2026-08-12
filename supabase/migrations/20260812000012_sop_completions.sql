-- Migration: Track which SOPs a user has completed (backs the "Terminer les
-- SOPs" onboarding checklist step, and can later scope to per-role/per-task
-- required SOPs once chantier équipe defines task delegation).
CREATE TABLE IF NOT EXISTS public.sop_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sop_id UUID NOT NULL REFERENCES public.academy_sops(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sop_id)
);

CREATE INDEX IF NOT EXISTS sop_completions_user_id_idx ON public.sop_completions(user_id);

ALTER TABLE public.sop_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sop_completions_select_own" ON public.sop_completions;
CREATE POLICY "sop_completions_select_own" ON public.sop_completions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "sop_completions_insert_own" ON public.sop_completions;
CREATE POLICY "sop_completions_insert_own" ON public.sop_completions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "sop_completions_delete_own" ON public.sop_completions;
CREATE POLICY "sop_completions_delete_own" ON public.sop_completions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
