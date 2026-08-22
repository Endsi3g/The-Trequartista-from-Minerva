-- ============================================================================
-- CLIENT_ACTIVITY_LOG
-- Backs the "Journal des actions en direct" feed on /portal/tasks. The
-- ClientActivityLog TS type already existed but NO table did --
-- fetchClientActivityLogs() unconditionally returned a hardcoded fake
-- array (DEFAULT_CLIENT_ACTIVITY_LOGS) for every client, every time, next
-- to a UI badge claiming "Synchronisation temps réel active". This table
-- makes that real. Real events (task status changes on client-linked
-- tasks, client approvals/revision requests) now write here instead.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('task_started', 'deliverable_submitted', 'task_completed', 'revision_requested', 'milestone_achieved')),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_id ON public.client_activity_log(client_id, created_at DESC);

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

-- Team (admin/member) can read and write every client's log.
DROP POLICY IF EXISTS "client_activity_log_team" ON public.client_activity_log;
CREATE POLICY "client_activity_log_team" ON public.client_activity_log FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

-- Client-role users only ever see their own client's log, and can only
-- insert rows tied to their own client_id (their approve/revision actions).
DROP POLICY IF EXISTS "client_activity_log_client_read" ON public.client_activity_log;
CREATE POLICY "client_activity_log_client_read" ON public.client_activity_log FOR SELECT TO authenticated
    USING (client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "client_activity_log_client_insert" ON public.client_activity_log;
CREATE POLICY "client_activity_log_client_insert" ON public.client_activity_log FOR INSERT TO authenticated
    WITH CHECK (client_id = public.client_id_for(auth.uid()));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'client_activity_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.client_activity_log;
    END IF;
END $$;
