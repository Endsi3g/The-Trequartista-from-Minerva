-- Migration: Facturation (MRR breakdown + Stripe payment link generation)
-- was readable/writable by any team member, not just admins -- the RLS on
-- client_payment_links only checked "not a client", same as the fully-
-- public-to-team tables (leads/clients/tasks). Billing is more sensitive:
-- restrict it to admins, the first real per-role permission split in the
-- app (previously role only changed a label, never what you could do).
DROP POLICY IF EXISTS "client_payment_links_select_team" ON public.client_payment_links;
CREATE POLICY "client_payment_links_select_admin" ON public.client_payment_links
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "client_payment_links_insert_team" ON public.client_payment_links;
CREATE POLICY "client_payment_links_insert_admin" ON public.client_payment_links
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
