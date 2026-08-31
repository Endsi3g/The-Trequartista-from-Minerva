-- Coach Minerva: an AI team-coach bot (chantier 5), delivered as a
-- dedicated 'coach' channel_type in the existing team chat rather than a
-- new page or a fake DM profile -- profiles.id is a hard FK to
-- auth.users(id), so a bot persona can't get a real profile row without a
-- real Supabase Auth user (needs live Admin API access this environment
-- doesn't have). Each member's coach channel is private to them:
-- channel_id = that member's own profile id, sender_id = NULL for
-- bot-authored messages (the app special-cases a NULL sender in a 'coach'
-- channel to render as "Coach Minerva").

ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check
    CHECK (channel_type IN ('project', 'client', 'dm', 'topic', 'coach'));

-- Daily standup: one row per member per day, task_snapshot is what the
-- bot saw when it posted the prompt (so the admin view reflects reality
-- at prompt time, not whatever the tasks look like later), open_answer
-- filled in once the member replies in their coach channel.
CREATE TABLE IF NOT EXISTS public.standup_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT standup_responses_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS standup_responses_date_idx ON public.standup_responses (date);

ALTER TABLE public.standup_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "standup_responses_select" ON public.standup_responses;
CREATE POLICY "standup_responses_select" ON public.standup_responses FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());

DROP POLICY IF EXISTS "standup_responses_insert" ON public.standup_responses;
CREATE POLICY "standup_responses_insert" ON public.standup_responses FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "standup_responses_update" ON public.standup_responses;
CREATE POLICY "standup_responses_update" ON public.standup_responses FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Weekly check-in: same shape, one row per member per ISO week (week_start
-- = the Monday of that week).
CREATE TABLE IF NOT EXISTS public.checkin_weekly_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    task_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT checkin_weekly_responses_user_week_unique UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS checkin_weekly_responses_week_idx ON public.checkin_weekly_responses (week_start);

ALTER TABLE public.checkin_weekly_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "checkin_weekly_responses_select" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_select" ON public.checkin_weekly_responses FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());

DROP POLICY IF EXISTS "checkin_weekly_responses_insert" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_insert" ON public.checkin_weekly_responses FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "checkin_weekly_responses_update" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_update" ON public.checkin_weekly_responses FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Call scheduling = an in-app availability poll, never a real calendar
-- integration (explicit product decision). created_by is nullable because
-- the weekly poll is created by the cron job (service role), not a human.
CREATE TABLE IF NOT EXISTS public.availability_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    proposed_slots JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.availability_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_polls_select" ON public.availability_polls;
CREATE POLICY "availability_polls_select" ON public.availability_polls FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "availability_polls_insert" ON public.availability_polls;
CREATE POLICY "availability_polls_insert" ON public.availability_polls FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.availability_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.availability_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT availability_votes_unique UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS availability_votes_poll_idx ON public.availability_votes (poll_id);

ALTER TABLE public.availability_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availability_votes_select" ON public.availability_votes;
CREATE POLICY "availability_votes_select" ON public.availability_votes FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "availability_votes_insert" ON public.availability_votes;
CREATE POLICY "availability_votes_insert" ON public.availability_votes FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "availability_votes_update" ON public.availability_votes;
CREATE POLICY "availability_votes_update" ON public.availability_votes FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- A weekly coach message links to the poll it announces, so the chat UI
-- can render inline vote buttons instead of a separate page.
ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES public.availability_polls(id) ON DELETE SET NULL;
