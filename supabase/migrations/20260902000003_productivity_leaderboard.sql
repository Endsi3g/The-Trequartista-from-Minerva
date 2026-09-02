-- Accountability & healthy-competition leaderboard ("Classement").
--
-- Score is a weighted mix of a universal signal every role produces (real
-- task completion, from public.tasks) plus a role-specific bonus computed
-- only where a genuinely attributable real-data signal exists:
--   - Prospection: leads.assigned_to closed to stage='won'
--   - Tech: tech_qa_audits.audited_by with status in ('passed','warning')
--   - Managing / unassigned workspace: no fabricated bonus metric --
--     universal tasks signal only, same baseline as everyone else.
-- Scores are stored per calendar month (period_month, always the 1st of
-- the month) rather than only computed live, so a month can be "closed"
-- (reset) without losing history, and so rank-change/personal-best
-- detection has a real previous value to compare against.

CREATE TABLE IF NOT EXISTS public.productivity_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    tasks_points INT NOT NULL DEFAULT 0,
    role_bonus_points INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 0,
    current_rank INT,
    previous_rank INT,
    breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT productivity_scores_unique UNIQUE (user_id, period_month)
);

CREATE INDEX IF NOT EXISTS productivity_scores_period_rank_idx
    ON public.productivity_scores (period_month, total_points DESC);

ALTER TABLE public.productivity_scores ENABLE ROW LEVEL SECURITY;

-- Full public ranking (per explicit product decision: healthy competition
-- means everyone sees everyone's real rank, not just their own).
DROP POLICY IF EXISTS "productivity_scores_select" ON public.productivity_scores;
CREATE POLICY "productivity_scores_select" ON public.productivity_scores FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'member')));

DROP POLICY IF EXISTS "productivity_scores_admin_write" ON public.productivity_scores;
CREATE POLICY "productivity_scores_admin_write" ON public.productivity_scores FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- One-time achievement events (rank #1 reached, entered the top 3, beat
-- one's own personal-best total) -- logged with a uniqueness constraint so
-- the same milestone in the same period is never notified twice.
CREATE TABLE IF NOT EXISTS public.productivity_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone_key TEXT NOT NULL,
    period_month DATE NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT productivity_milestones_unique UNIQUE (user_id, milestone_key, period_month)
);

ALTER TABLE public.productivity_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productivity_milestones_select" ON public.productivity_milestones;
CREATE POLICY "productivity_milestones_select" ON public.productivity_milestones FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'member')));

DROP POLICY IF EXISTS "productivity_milestones_admin_write" ON public.productivity_milestones;
CREATE POLICY "productivity_milestones_admin_write" ON public.productivity_milestones FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
