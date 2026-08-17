-- "Produits Minerva" (nouveau, 2026-08-17) -- une exploration complète du
-- workspace Notion de l'agence via Composio a révélé plusieurs bases
-- opérationnelles pour les PRODUITS PROPRES de Minerva (Reach, Flow, OS,
-- et de nouveaux : Ascend, Forge, Atlas) qui vivaient entièrement hors de
-- l'app. La base "Roadmap" contenait 10 vraies entrées ; "Développement
-- d'applications", "Bugs" et "Feature Backlog" étaient vides au moment de
-- cette migration -- seule la Roadmap est modélisée pour l'instant.
CREATE TABLE IF NOT EXISTS public.minerva_roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  product TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'Milestone' CHECK (item_type IN ('Milestone', 'Launch', 'Experiment')),
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Done')),
  impact TEXT NOT NULL DEFAULT 'Medium' CHECK (impact IN ('Low', 'Medium', 'High')),
  start_date DATE,
  end_date DATE,
  owner_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS minerva_roadmap_items_product_idx ON public.minerva_roadmap_items(product);

ALTER TABLE public.minerva_roadmap_items ENABLE ROW LEVEL SECURITY;

-- Admin-only end to end, same shape as the Acquisition/Audits IA gate --
-- this is Minerva's own product strategy, not client-facing agency work.
DROP POLICY IF EXISTS "minerva_roadmap_items_admin_all" ON public.minerva_roadmap_items;
CREATE POLICY "minerva_roadmap_items_admin_all" ON public.minerva_roadmap_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
