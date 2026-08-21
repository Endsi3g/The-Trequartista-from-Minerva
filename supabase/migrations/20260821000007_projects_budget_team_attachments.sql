-- ============================================================================
-- PROJECTS: BUDGET, TEAM ASSIGNMENT, CLIENT VISIBILITY, ATTACHMENTS
-- `assignees` is read everywhere (fetchProjects/addProject in
-- lib/services/supabase-data.ts) but never actually written by any UI --
-- ADD COLUMN IF NOT EXISTS guarantees it's real either way. budget_cad and
-- client_visible are genuinely new. Policies use is_admin() / a direct
-- role='member' check -- NOT member_can(), which is confirmed not to exist
-- live (see 20260821000001/000005).
-- ============================================================================

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS budget_cad NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS assignees UUID[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_type TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_attachments_team" ON public.project_attachments;
CREATE POLICY "project_attachments_team" ON public.project_attachments FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));
