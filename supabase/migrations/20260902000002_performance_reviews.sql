-- Real performance-review cycle for /team's "Évaluations de performance"
-- tab, which was previously a static placeholder with fabricated example
-- text ("Suivi des revues trimestrielles et 1-on-1 des collaborateurs")
-- and no actual data behind it.

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    period TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    strengths TEXT,
    improvements TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_member ON public.performance_reviews(member_id, created_at DESC);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "performance_reviews_select" ON public.performance_reviews;
CREATE POLICY "performance_reviews_select" ON public.performance_reviews FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR member_id = auth.uid());

DROP POLICY IF EXISTS "performance_reviews_admin_write" ON public.performance_reviews;
CREATE POLICY "performance_reviews_admin_write" ON public.performance_reviews FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
