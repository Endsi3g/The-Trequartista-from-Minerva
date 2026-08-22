-- ============================================================================
-- DOCUMENTS & WIKI COLLABORATIF TEMPS RÉEL
-- Enrichit la table documents pour supporter l'éditeur en blocs (JSONB),
-- la recherche plein-texte, les catégories d'agence, les favoris épinglés,
-- la liaison client/projet, la visibilité portail client, et crée la table
-- document_versions pour l'historique de versions et la restauration.
-- ============================================================================

-- 1. Évolution de la table documents
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS content_json JSONB DEFAULT '{"blocks":[]}'::jsonb,
    ADD COLUMN IF NOT EXISTS content_text TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_shared_with_client BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS workspace TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_workspace_check') THEN
        ALTER TABLE public.documents
            ADD CONSTRAINT documents_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_client_id_idx ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS documents_project_id_idx ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS documents_category_idx ON public.documents(category);
CREATE INDEX IF NOT EXISTS documents_is_pinned_idx ON public.documents(is_pinned);
CREATE INDEX IF NOT EXISTS documents_workspace_idx ON public.documents(workspace);

-- 2. Table document_versions (Historique de versions)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    title TEXT NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
    content_text TEXT DEFAULT '',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON public.document_versions(document_id, created_at DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_versions_select" ON public.document_versions;
CREATE POLICY "document_versions_select" ON public.document_versions FOR SELECT TO authenticated
    USING (
        public.is_admin(auth.uid()) 
        OR public.member_can(auth.uid(), 'view_documents')
        OR EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_id 
            AND (
                d.created_by = auth.uid() 
                OR (d.is_shared_with_client AND d.client_id IS NOT NULL AND d.client_id = public.client_id_for(auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "document_versions_insert" ON public.document_versions;
CREATE POLICY "document_versions_insert" ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) 
        OR public.member_can(auth.uid(), 'manage_documents')
        OR EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_id 
            AND d.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_versions_delete" ON public.document_versions;
CREATE POLICY "document_versions_delete" ON public.document_versions FOR DELETE TO authenticated
    USING (public.is_admin(auth.uid()));
