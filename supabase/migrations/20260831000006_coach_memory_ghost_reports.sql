-- Coach Minerva follow-ups: a personal memory per member so the bot's
-- daily/weekly questions can reference recent context instead of starting
-- cold every time, a weekly admin report (response rate + AI trend summary
-- + ghost flag), and a daily-updated anti-ghost tracker that drives both
-- the admin-visible flag and an automatic member nudge.

CREATE TABLE IF NOT EXISTS public.coach_member_memory (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coach_member_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_member_memory_select" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_select" ON public.coach_member_memory FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());

DROP POLICY IF EXISTS "coach_member_memory_insert" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_insert" ON public.coach_member_memory FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "coach_member_memory_update" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_update" ON public.coach_member_memory FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- One row per member per ISO week, computed by the Friday cron: how many
-- of that week's daily standups they actually answered, an AI-generated
-- trend/mood summary from the verbatim answers, and whether they were
-- flagged as ghosting that week (copied from coach_ghost_status below).
CREATE TABLE IF NOT EXISTS public.coach_weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    standups_answered INT NOT NULL DEFAULT 0,
    standups_total INT NOT NULL DEFAULT 0,
    response_rate_pct INT NOT NULL DEFAULT 0,
    trend_summary TEXT,
    is_ghosting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coach_weekly_reports_user_week_unique UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS coach_weekly_reports_week_idx ON public.coach_weekly_reports (week_start);

ALTER TABLE public.coach_weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_weekly_reports_select" ON public.coach_weekly_reports;
CREATE POLICY "coach_weekly_reports_select" ON public.coach_weekly_reports FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload'));

-- Only the service-role daily cron writes this table (ghost detection),
-- so no INSERT/UPDATE policy for regular authenticated users is needed.
CREATE TABLE IF NOT EXISTS public.coach_ghost_status (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    consecutive_missed_checkins INT NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    is_ghosting BOOLEAN NOT NULL DEFAULT FALSE,
    last_nudged_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coach_ghost_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_ghost_status_select" ON public.coach_ghost_status;
CREATE POLICY "coach_ghost_status_select" ON public.coach_ghost_status FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());
