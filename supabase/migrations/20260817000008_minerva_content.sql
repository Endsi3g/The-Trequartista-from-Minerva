-- "Contenu Minerva" -- the agency's OWN social content, as opposed to
-- content_posts (client deliverables). Two kinds share one table:
--   'inspiration' -- an external link (Instagram/TikTok/YouTube) + a note
--                     on why it's worth referencing, no scheduling.
--   'own_video'   -- one of our own files, stored in team-documents under
--                     minerva-content/, optionally scheduled to post.
-- A single table (rather than two) keeps the "banque" (library) view a
-- single query while the CHECK constraint below still keeps each kind's
-- fields mutually exclusive and required.

CREATE TABLE IF NOT EXISTS public.minerva_content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.minerva_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('inspiration', 'own_video')),
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.minerva_content_categories(id) ON DELETE SET NULL,
  external_url TEXT,
  note TEXT,
  file_url TEXT,
  scheduled_date DATE,
  posted BOOLEAN NOT NULL DEFAULT false,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT minerva_content_items_kind_fields CHECK (
    (kind = 'inspiration' AND external_url IS NOT NULL AND file_url IS NULL AND scheduled_date IS NULL)
    OR
    (kind = 'own_video' AND file_url IS NOT NULL AND external_url IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS minerva_content_items_kind_idx ON public.minerva_content_items(kind);
CREATE INDEX IF NOT EXISTS minerva_content_items_scheduled_idx ON public.minerva_content_items(scheduled_date);

ALTER TABLE public.minerva_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minerva_content_items ENABLE ROW LEVEL SECURITY;

-- Internal only -- same admin/member gate as team_chat_messages and the
-- Academy. Minerva's own content strategy isn't something a client-portal
-- account has any reason to see.
CREATE POLICY "minerva_content_categories_team" ON public.minerva_content_categories
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));

CREATE POLICY "minerva_content_items_team" ON public.minerva_content_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));

-- Starter categories -- editable/extendable from the UI afterward
-- ("catégories fixes administrables"), not a hardcoded enum, so this is
-- just a seed, not a closed list.
INSERT INTO public.minerva_content_categories (name) VALUES
  ('Éducatif'), ('Coulisses'), ('Témoignages'), ('Promotionnel')
ON CONFLICT (name) DO NOTHING;
