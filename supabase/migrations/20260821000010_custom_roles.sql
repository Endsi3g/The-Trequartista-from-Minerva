-- ============================================================================
-- CUSTOM ROLES (module x action permission grid)
-- member_can() is confirmed NOT to exist live (this session, repeatedly).
-- Creating it fresh here is purely additive -- nothing currently live can
-- reference a function that doesn't exist, so this cannot break anything
-- already working. Matches the definition originally intended in the
-- consolidated migration. Only NEW/updated policies (below, and this
-- session's own tables) start using it; pre-existing tables (leads,
-- clients, projects, academy_sops, ...) are deliberately left untouched --
-- their actual live RLS is unknown and too risky to guess at further.
--
-- profiles.role (admin/member/client) is NOT touched or replaced -- custom
-- roles are additive on top, never a path to real admin DB access. is_admin()
-- and every existing policy that depends on it are unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.member_can(user_id UUID, perm TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.app_permissions
        WHERE profile_id = user_id AND permission = perm AND enabled = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete')),
    UNIQUE(role_id, module, action)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_team" ON public.roles;
CREATE POLICY "roles_select_team" ON public.roles FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "roles_admin_write" ON public.roles;
CREATE POLICY "roles_admin_write" ON public.roles FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "role_permissions_select_team" ON public.role_permissions;
CREATE POLICY "role_permissions_select_team" ON public.role_permissions FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Now that member_can() actually exists, upgrade this session's own new
-- tables from admin-only to real member-permission gating, so a custom
-- role granting these modules actually does something immediately.
DROP POLICY IF EXISTS "client_mrr_history_select" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_select" ON public.client_mrr_history FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients'));

DROP POLICY IF EXISTS "client_mrr_history_insert" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_insert" ON public.client_mrr_history FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'edit_client_financials'));

DROP POLICY IF EXISTS "voice_agent_config_select_team" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_select_team" ON public.voice_agent_config FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));

DROP POLICY IF EXISTS "voice_calls_select_team" ON public.voice_calls;
CREATE POLICY "voice_calls_select_team" ON public.voice_calls FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));
