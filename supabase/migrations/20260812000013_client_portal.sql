-- Migration: Client portal — client-role accounts scoped to a single
-- client record, invite links to create them, a Q&A thread, and a short
-- free-text status field the internal team sets for that client to see.

-- 1. Extend profiles to support a client-scoped role -----------------------
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'member', 'client'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Helper (SECURITY DEFINER — same reasoning as public.is_admin in
-- 20260812000010: reading profiles from within a profiles/clients RLS
-- policy would otherwise recurse).
CREATE OR REPLACE FUNCTION public.client_id_for(uid UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = uid AND role = 'client';
$$;

-- 2. A short status line the internal team sets per client, shown in the
--    client's portal ("what is Minerva doing for my company").
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS current_focus TEXT;

-- 3. Invite links ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_invites_team_all" ON public.client_invites;
CREATE POLICY "client_invites_team_all" ON public.client_invites
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

-- 4. Client <-> Minerva Q&A thread ------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'team')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_messages_client_id_idx ON public.client_messages(client_id);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_messages_select" ON public.client_messages;
CREATE POLICY "client_messages_select" ON public.client_messages
  FOR SELECT TO authenticated
  USING (
    public.client_id_for(auth.uid()) = client_id
    OR public.client_id_for(auth.uid()) IS NULL
  );

DROP POLICY IF EXISTS "client_messages_insert" ON public.client_messages;
CREATE POLICY "client_messages_insert" ON public.client_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (public.client_id_for(auth.uid()) = client_id AND sender_role = 'client')
      OR (public.client_id_for(auth.uid()) IS NULL AND sender_role = 'team')
    )
  );

-- 5. Scope existing team-shared tables so a client role only sees its own row
DROP POLICY IF EXISTS "clients_select_team" ON public.clients;
DROP POLICY IF EXISTS "Allow team read clients" ON public.clients;
CREATE POLICY "clients_select_scoped" ON public.clients
  FOR SELECT TO authenticated
  USING (
    public.client_id_for(auth.uid()) IS NULL
    OR public.client_id_for(auth.uid()) = id
  );

DROP POLICY IF EXISTS "content_posts_select_team" ON public.content_posts;
CREATE POLICY "content_posts_select_scoped" ON public.content_posts
  FOR SELECT TO authenticated
  USING (
    public.client_id_for(auth.uid()) IS NULL
    OR public.client_id_for(auth.uid()) = client_id
  );

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_roi_metrics') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow team read client_roi_metrics" ON public.client_roi_metrics';
    EXECUTE 'DROP POLICY IF EXISTS "client_roi_metrics_select_team" ON public.client_roi_metrics';
    EXECUTE 'CREATE POLICY "client_roi_metrics_select_scoped" ON public.client_roi_metrics
      FOR SELECT TO authenticated
      USING (public.client_id_for(auth.uid()) IS NULL OR public.client_id_for(auth.uid()) = client_id)';
  END IF;
END $$;
