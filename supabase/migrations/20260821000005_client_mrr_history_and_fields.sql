-- ============================================================================
-- CLIENT MRR HISTORY + NEW /clients/new FIELDS
-- clients.mrr has always been a single overwritable number with no record
-- of how it got there. This adds a real time-series (client_mrr_history)
-- logged on every change, plus three new fields for the creation form:
-- business address, contract start date + service package, and an
-- assigned account manager.
-- ============================================================================

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS contract_start_date DATE,
    ADD COLUMN IF NOT EXISTS service_package TEXT,
    ADD COLUMN IF NOT EXISTS account_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.client_mrr_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    mrr NUMERIC(10,2) NOT NULL,
    note TEXT,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_mrr_history ENABLE ROW LEVEL SECURITY;

-- Same gating as clients_select/edit_client_financials -- financial history
-- is agency-internal, not exposed to the client portal (no client_id_for()
-- clause, unlike clients_select itself).
DROP POLICY IF EXISTS "client_mrr_history_select" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_select" ON public.client_mrr_history FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients'));

DROP POLICY IF EXISTS "client_mrr_history_insert" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_insert" ON public.client_mrr_history FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'edit_client_financials'));
