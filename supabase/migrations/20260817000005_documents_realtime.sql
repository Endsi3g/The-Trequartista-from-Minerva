-- New "Documents" section: a team-wide, freeform wiki-style space where
-- any admin/member can co-edit a shared note in real time (briefs, meeting
-- notes) via Supabase Realtime + Yjs (components/realtime-monaco.tsx).
--
-- Two tables: `documents` is our own metadata (title, who created it, so
-- the list page has something to show) and `yjs_documents` is the table
-- @supabase-labs/y-supabase itself reads/writes for CRDT persistence --
-- its column names (room/state) and defaults are fixed by that library,
-- not something we get to choose. `documents.id` doubles as the Yjs room
-- name/channel so the two tables line up 1:1 without a separate FK column
-- that could drift out of sync.
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

-- Team-wide, not scoped to the creator -- these are shared docs by design
-- (the user chose "toute l'équipe, docs libres" over per-client/project
-- scoping). Client-portal accounts never reach these tables: only
-- admin/member roles have a UI path to /documents, and RLS backs that up
-- the same way leads/academy_sops already do.
DROP POLICY IF EXISTS "documents_team" ON public.documents;
CREATE POLICY "documents_team" ON public.documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));

DROP POLICY IF EXISTS "yjs_documents_team" ON public.yjs_documents;
CREATE POLICY "yjs_documents_team" ON public.yjs_documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));

DROP TRIGGER IF EXISTS documents_updated_at ON public.documents;
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
