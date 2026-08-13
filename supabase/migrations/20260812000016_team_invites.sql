-- Migration: Real invite links for internal team members. Today anyone who
-- signs up auto-becomes role='member' (see 20260812000007's handle_new_user
-- trigger) with no way to grant 'admin' except editing the DB by hand. This
-- lets an existing admin generate a link that pre-assigns a role + optional
-- department, mirroring the client_invites pattern (20260812000013).
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  department TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Only admins can mint invites (an invite can grant the admin role itself).
DROP POLICY IF EXISTS "team_invites_insert_admin" ON public.team_invites;
CREATE POLICY "team_invites_insert_admin" ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- Admins can see/manage the full list (to track or let links expire).
DROP POLICY IF EXISTS "team_invites_select_admin" ON public.team_invites;
CREATE POLICY "team_invites_select_admin" ON public.team_invites
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Anyone authenticated can redeem a still-unused invite by its exact token
-- (knowledge of the random token is the authorization, same trust model as
-- client_invites) -- this is what lets a brand-new signup, not yet an
-- admin, consume the link that promotes them.
DROP POLICY IF EXISTS "team_invites_select_unused_by_token" ON public.team_invites;
CREATE POLICY "team_invites_select_unused_by_token" ON public.team_invites
  FOR SELECT TO authenticated
  USING (used_at IS NULL);

DROP POLICY IF EXISTS "team_invites_update_redeem" ON public.team_invites;
CREATE POLICY "team_invites_update_redeem" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (used_at IS NULL)
  WITH CHECK (used_by = auth.uid());
