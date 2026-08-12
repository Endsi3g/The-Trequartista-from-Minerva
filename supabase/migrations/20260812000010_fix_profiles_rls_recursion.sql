-- Migration: Fix infinite RLS recursion on public.profiles
--
-- "profiles_select_admin" and "profiles_update_admin" (from
-- 20260812000001_profiles_and_roles.sql) check admin status with
-- `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`
-- INSIDE a policy defined ON public.profiles. Every SELECT on profiles has to
-- evaluate every SELECT policy (they're OR'd together), so evaluating this one
-- re-triggers RLS on profiles again, which re-evaluates the same policy —
-- infinite recursion. Postgres aborts with "infinite recursion detected in
-- policy for relation \"profiles\"", which PostgREST surfaces as a bare 500.
-- This has been silently breaking every profiles read for non-"own row" cases
-- since that migration; every caller happens to catch the error and fall back
-- to an empty/default profile, so it was never visibly reported.
--
-- Fix: move the admin check into a SECURITY DEFINER function. Definer
-- functions run with the privileges of their owner and bypass RLS on the
-- table they query internally, so the check no longer re-enters the policy
-- it's being evaluated for.

CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));
