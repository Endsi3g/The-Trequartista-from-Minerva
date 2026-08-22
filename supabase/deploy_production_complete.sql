-- ============================================================================
-- MINERVA TREQUARTISTA — SCRIPT DE CONSOLIDATION PRODUCTION SUPABASE
-- À copier-coller et exécuter dans l'éditeur SQL de votre tableau de bord Supabase :
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- 1. PROMOTION ADMIN DU COMPTE PRINCIPAL
UPDATE public.profiles
SET role = 'admin', approved = TRUE
WHERE email = 'kbelceus776@gmail.com';

-- 2. FONCTIONS DE SÉCURITÉ DE BASE
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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

-- 3. ESPACES DE TRAVAIL (PROSPECTION / MANAGING)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS workspace TEXT CHECK (workspace IN ('prospection', 'managing'));
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS workspace TEXT CHECK (workspace IN ('prospection', 'managing'));

-- 4. DÉPARTEMENTS D'AGENCE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT 'Operations',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select_all" ON public.departments;
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "departments_admin_write" ON public.departments;
CREATE POLICY "departments_admin_write" ON public.departments FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Insérer les départements de base s'ils n'existent pas encore
INSERT INTO public.departments (name, color)
VALUES
    ('Operations', 'Operations'),
    ('Tech & IA', 'Tech & IA'),
    ('Ventes', 'Ventes'),
    ('Marketing', 'Marketing'),
    ('Finance', 'Finance')
ON CONFLICT (name) DO NOTHING;

-- 5. RÔLES PERSONNALISÉS (POSTES & RÔLES)
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

-- Insérer les 4 rôles types d'agence Minerva
INSERT INTO public.roles (name, description, is_system)
VALUES
    ('Directeur Technique / Lead IA', 'Supervision des architectures IA, webhooks et infrastructure technique.', TRUE),
    ('Chef de Projet & Delivery', 'Pilotage des livrables clients, jalons, tâches et wiki interne.', TRUE),
    ('Closer / Business Developer', 'Gestion du pipeline de prospection, des diagnostics et des propositions.', TRUE),
    ('Opérateur Automatisation', 'Exécution des flux quotidiens, intégrations et support opérationnel.', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 6. PERMISSIONS DE BASE POUR LES RÔLES CRÉÉS
DO $$
DECLARE
    r_tech UUID;
    r_pm UUID;
    r_sales UUID;
    r_ops UUID;
BEGIN
    SELECT id INTO r_tech FROM public.roles WHERE name = 'Directeur Technique / Lead IA' LIMIT 1;
    SELECT id INTO r_pm FROM public.roles WHERE name = 'Chef de Projet & Delivery' LIMIT 1;
    SELECT id INTO r_sales FROM public.roles WHERE name = 'Closer / Business Developer' LIMIT 1;
    SELECT id INTO r_ops FROM public.roles WHERE name = 'Opérateur Automatisation' LIMIT 1;

    -- Tech Lead : Tout accès
    IF r_tech IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module, action) VALUES
            (r_tech, 'clients', 'view'), (r_tech, 'clients', 'create'), (r_tech, 'clients', 'edit'),
            (r_tech, 'leads', 'view'), (r_tech, 'leads', 'create'), (r_tech, 'leads', 'edit'),
            (r_tech, 'projects', 'view'), (r_tech, 'projects', 'create'), (r_tech, 'projects', 'edit'),
            (r_tech, 'tasks', 'view'), (r_tech, 'tasks', 'create'), (r_tech, 'tasks', 'edit'),
            (r_tech, 'documents', 'view'), (r_tech, 'documents', 'create'), (r_tech, 'documents', 'edit'),
            (r_tech, 'voice_agent', 'view'), (r_tech, 'voice_agent', 'edit'),
            (r_tech, 'financials', 'view')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Chef de Projet : Delivery, Tâches, Projets, Documents, Clients
    IF r_pm IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module, action) VALUES
            (r_pm, 'clients', 'view'), (r_pm, 'clients', 'edit'),
            (r_pm, 'projects', 'view'), (r_pm, 'projects', 'create'), (r_pm, 'projects', 'edit'),
            (r_pm, 'tasks', 'view'), (r_pm, 'tasks', 'create'), (r_pm, 'tasks', 'edit'),
            (r_pm, 'documents', 'view'), (r_pm, 'documents', 'create'), (r_pm, 'documents', 'edit')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Closer : Leads, Clients, Diagnostics & Voice Agent
    IF r_sales IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, module, action) VALUES
            (r_sales, 'leads', 'view'), (r_sales, 'leads', 'create'), (r_sales, 'leads', 'edit'),
            (r_sales, 'clients', 'view'),
            (r_sales, 'voice_agent', 'view'), (r_sales, 'voice_agent', 'edit'),
            (r_sales, 'documents', 'view')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 7. DOCUMENTS & WIKI COLLABORATIF TEMPS RÉEL
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_json JSONB;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS is_shared_with_client BOOLEAN DEFAULT FALSE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS workspace TEXT DEFAULT 'general';

CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    content_json JSONB NOT NULL,
    content_text TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_name TEXT,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id, created_at DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_versions_select" ON public.document_versions;
CREATE POLICY "document_versions_select" ON public.document_versions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.documents d
            WHERE d.id = document_versions.document_id
            AND (
                public.is_admin(auth.uid())
                OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
                OR (d.is_shared_with_client = TRUE AND d.client_id = public.client_id_for(auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "document_versions_insert" ON public.document_versions;
CREATE POLICY "document_versions_insert" ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    );

-- 8. CONFIRMATION DU STATUT ADMIN
SELECT id, email, full_name, role, approved FROM public.profiles WHERE email = 'kbelceus776@gmail.com';
