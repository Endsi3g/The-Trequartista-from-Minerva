-- Fix RLS policies and constraints for `public.documents` and `public.yjs_documents`
-- Ensures any authenticated team member can create, read, update, and delete documents
-- without being rejected by strict profile checks or null created_by.

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Document sans titre',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.yjs_documents (
  room TEXT PRIMARY KEY,
  state TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_team" ON public.documents;
DROP POLICY IF EXISTS "documents_team_all" ON public.documents;
CREATE POLICY "documents_team_all" ON public.documents
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "yjs_documents_team" ON public.yjs_documents;
DROP POLICY IF EXISTS "yjs_documents_team_all" ON public.yjs_documents;
CREATE POLICY "yjs_documents_team_all" ON public.yjs_documents
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
