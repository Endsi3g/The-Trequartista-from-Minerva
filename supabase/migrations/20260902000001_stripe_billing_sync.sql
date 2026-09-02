-- Real Stripe billing: syncing invoices, creating/sending real Stripe
-- invoices, and auto-tracking MRR from live subscriptions. Builds on top
-- of the existing client_payment_links (one-off Payment Links) feature --
-- this is a separate, invoices-table-based flow for recurring billing.

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS stripe_hosted_invoice_url TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id ON public.clients(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
