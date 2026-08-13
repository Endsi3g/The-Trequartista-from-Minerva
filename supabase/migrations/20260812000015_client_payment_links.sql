-- Migration: Persist Stripe Payment Links generated from the Facturation
-- page so the team can see what's been sent and whether it's been paid,
-- instead of generating a throwaway link with no record of it afterward.
CREATE TABLE IF NOT EXISTS public.client_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_payment_link_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  url TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS client_payment_links_client_id_idx ON public.client_payment_links(client_id);

ALTER TABLE public.client_payment_links ENABLE ROW LEVEL SECURITY;

-- Internal team only (no client-role access -- this is agency-side billing
-- ops, not something to surface in the client portal).
DROP POLICY IF EXISTS "client_payment_links_select_team" ON public.client_payment_links;
CREATE POLICY "client_payment_links_select_team" ON public.client_payment_links
  FOR SELECT TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL);

DROP POLICY IF EXISTS "client_payment_links_insert_team" ON public.client_payment_links;
CREATE POLICY "client_payment_links_insert_team" ON public.client_payment_links
  FOR INSERT TO authenticated
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

-- The Stripe webhook route updates status/paid_at using the service-role
-- key (bypasses RLS by design, never runs with a user JWT).
