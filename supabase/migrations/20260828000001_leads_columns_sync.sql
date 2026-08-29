-- Minerva Trequartista - Leads Table Comprehensive Synchronization
-- Ensures compatibility with both legacy schema and enriched CRM fields

ALTER TABLE IF EXISTS public.leads
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS service_requested TEXT,
    ADD COLUMN IF NOT EXISTS estimated_value_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS probability_pct INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS score_grade TEXT DEFAULT 'A',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon reads/inserts if policies not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow select on leads for authenticated'
    ) THEN
        CREATE POLICY "Allow select on leads for authenticated" ON public.leads
            FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow insert on leads for authenticated'
    ) THEN
        CREATE POLICY "Allow insert on leads for authenticated" ON public.leads
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow update on leads for authenticated'
    ) THEN
        CREATE POLICY "Allow update on leads for authenticated" ON public.leads
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
