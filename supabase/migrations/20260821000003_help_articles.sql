-- ============================================================================
-- HELP_ARTICLES
-- Backs the /help FAQ accordion, which previously read from a hardcoded
-- array (app/(dashboard)/help/page.tsx) in violation of the "real data
-- only" project convention. Brand-new table, no drift risk.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "help_articles_select_all" ON public.help_articles;
CREATE POLICY "help_articles_select_all" ON public.help_articles FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "help_articles_admin_write" ON public.help_articles;
CREATE POLICY "help_articles_admin_write" ON public.help_articles FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
