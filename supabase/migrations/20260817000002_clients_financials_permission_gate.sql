-- Found during a full-app audit (2026-08-17): the Permissions settings page
-- (/settings/permissions) tells admins that "edit_client_financials" is
-- "appliqué à la fois dans l'interface et côté base de données (RLS)" --
-- but `clients_write_team` (20260812000004_harden_rls_policies.sql) was
-- still `FOR ALL TO authenticated USING (true) WITH CHECK (true)`. The
-- "Modifier la fiche" button on /clients/[id] was UI-gated by
-- can('edit_client_financials'), but any authenticated user (any team
-- member without the permission, or even a client-portal account) could
-- still write to any clients row via a direct REST/JS call. This closes
-- that gap so the RLS side actually matches the documented claim, the
-- same way leads_delete_scoped and academy_sops_write_scoped already do
-- for their own permissions.
--
-- updateClientFocus() in lib/services/supabase-data.ts is dead code (no
-- callers anywhere in app/ or components/) so folding it under this gate
-- breaks nothing currently live.
DROP POLICY IF EXISTS "clients_write_team" ON public.clients;

CREATE POLICY "clients_insert_team" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "clients_update_scoped" ON public.clients
  FOR UPDATE TO authenticated
  USING (public.member_can('edit_client_financials'))
  WITH CHECK (public.member_can('edit_client_financials'));

CREATE POLICY "clients_delete_scoped" ON public.clients
  FOR DELETE TO authenticated
  USING (public.member_can('edit_client_financials'));
