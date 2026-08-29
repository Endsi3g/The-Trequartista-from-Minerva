-- ============================================================================
-- MINERVA TREQUARTISTA — INVOICING & CLIENT PORTAL MIGRATION
-- Date: 2026-08-28
-- Adds Invoices, Invoice Line Items, Client Deliverables, and Portal Messages
-- Idempotent and safe to run multiple times
-- ============================================================================

-- 1. Table: invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'quote', 'retainer')),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    paid_at TIMESTAMPTZ,
    subtotal_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_tps_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_tvq_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stripe_payment_link_url TEXT,
    notes TEXT,
    terms TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'invoice',
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD',
    ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS subtotal_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tps_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tvq_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS stripe_payment_link_url TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS terms TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Table: invoice_items
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    unit_price_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invoice_items
    ADD COLUMN IF NOT EXISTS invoice_id UUID,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1.00,
    ADD COLUMN IF NOT EXISTS unit_price_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS amount_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Table: client_deliverables
CREATE TABLE IF NOT EXISTS public.client_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    asset_url TEXT,
    preview_image_url TEXT,
    type TEXT DEFAULT 'design' CHECK (type IN ('design', 'website', 'video', 'document', 'campaign', 'other')),
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'approved', 'revision_requested')),
    feedback_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_deliverables
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS asset_url TEXT,
    ADD COLUMN IF NOT EXISTS preview_image_url TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'design',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_review',
    ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Table: client_portal_messages
CREATE TABLE IF NOT EXISTS public.client_portal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_portal_messages
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS author_email TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_deliverables_client_id ON public.client_deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_client_deliverables_status ON public.client_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_client_portal_messages_client_id ON public.client_portal_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON public.clients(portal_token) WHERE portal_token IS NOT NULL;

-- 6. Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_messages ENABLE ROW LEVEL SECURITY;

-- Invoices RLS
DROP POLICY IF EXISTS "Admins and members can view invoices" ON public.invoices;
CREATE POLICY "Admins and members can view invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR
        client_id = public.client_id_for(auth.uid())
    );

DROP POLICY IF EXISTS "Admins and members can manage invoices" ON public.invoices;
CREATE POLICY "Admins and members can manage invoices"
    ON public.invoices FOR ALL
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    );

-- Invoice items RLS
DROP POLICY IF EXISTS "Admins and members can view invoice items" ON public.invoice_items;
CREATE POLICY "Admins and members can view invoice items"
    ON public.invoice_items FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR
        EXISTS (
            SELECT 1 FROM public.invoices inv
            WHERE inv.id = invoice_items.invoice_id
            AND inv.client_id = public.client_id_for(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Admins and members can manage invoice items" ON public.invoice_items;
CREATE POLICY "Admins and members can manage invoice items"
    ON public.invoice_items FOR ALL
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    );

-- Deliverables RLS
DROP POLICY IF EXISTS "Admins and members can view deliverables" ON public.client_deliverables;
CREATE POLICY "Admins and members can view deliverables"
    ON public.client_deliverables FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR
        client_id = public.client_id_for(auth.uid())
    );

DROP POLICY IF EXISTS "Admins and members can manage deliverables" ON public.client_deliverables;
CREATE POLICY "Admins and members can manage deliverables"
    ON public.client_deliverables FOR ALL
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    );

-- Portal messages RLS
DROP POLICY IF EXISTS "Admins and members can view portal messages" ON public.client_portal_messages;
CREATE POLICY "Admins and members can view portal messages"
    ON public.client_portal_messages FOR SELECT
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR
        client_id = public.client_id_for(auth.uid())
    );

DROP POLICY IF EXISTS "Admins and members can manage portal messages" ON public.client_portal_messages;
CREATE POLICY "Admins and Seigneur can manage portal messages" ON public.client_portal_messages;
CREATE POLICY "Admins and members can manage portal messages"
    ON public.client_portal_messages FOR ALL
    TO authenticated
    USING (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    )
    WITH CHECK (
        public.is_admin(auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member')
    );
