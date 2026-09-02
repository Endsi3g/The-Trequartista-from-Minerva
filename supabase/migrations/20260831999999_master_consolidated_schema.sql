-- Master Consolidated Production Migration (v2.17.1)
-- See deploy_production_complete.sql for full comments and details.
-- The "v2.20 append" section near the end of this file folds in every
-- dated migration from 20260817000010 through 20260831000006 -- this is a
-- reference-only consolidation (per an explicit "just clean up visually,
-- no risk" product decision): the individual dated migration files below
-- are never edited or deleted (Supabase CLI tracks applied migrations by
-- filename, not content hash, so an edit to an already-applied file would
-- silently never re-run). Every statement in that section is idempotent
-- (IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE) so re-running it against
-- a database that already has these tables/columns is a safe no-op.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email TEXT UNIQUE,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'guest')),
    workspace TEXT CHECK (workspace IN ('prospection', 'managing', 'tech')),
    phone TEXT,
    job_title TEXT
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS workspace TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS job_title TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lecture profils pour authentifies" ON public.profiles;
CREATE POLICY "Lecture profils pour authentifies" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modification profil personnel ou admin" ON public.profiles;
CREATE POLICY "Modification profil personnel ou admin" ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Insertion profil pour authentifies" ON public.profiles;
CREATE POLICY "Insertion profil pour authentifies" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Onboarding', 'Paused', 'Churned')),
    industry TEXT,
    mrr NUMERIC DEFAULT 0,
    portal_access_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
    ADD COLUMN IF NOT EXISTS industry TEXT,
    ADD COLUMN IF NOT EXISTS mrr NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS portal_access_token TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces clients membres" ON public.clients;
CREATE POLICY "Acces clients membres" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Nouveau' CHECK (status IN ('Nouveau', 'Contacté', 'Qualifié', 'Proposition', 'Négociation', 'Gagné', 'Perdu')),
    stage TEXT NOT NULL DEFAULT 'nouveau',
    mrr_value NUMERIC DEFAULT 0,
    one_time_value NUMERIC DEFAULT 0,
    source TEXT DEFAULT 'prospection',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Nouveau',
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'nouveau',
    ADD COLUMN IF NOT EXISTS mrr_value NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS one_time_value NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'prospection',
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces leads membres" ON public.leads;
CREATE POLICY "Acces leads membres" ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT NOT NULL,
    role TEXT,
    company TEXT,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Montréal',
    circle TEXT DEFAULT 'Partenaire',
    linkedin_url TEXT,
    bio TEXT,
    avatar_url TEXT
);

ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Montréal',
    ADD COLUMN IF NOT EXISTS circle TEXT DEFAULT 'Partenaire',
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces contacts membres" ON public.contacts;
CREATE POLICY "Acces contacts membres" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT,
    name TEXT NOT NULL,
    current_stage TEXT NOT NULL DEFAULT 'Cadrage & Onboarding',
    health TEXT NOT NULL DEFAULT 'On Track' CHECK (health IN ('On Track', 'Needs Review', 'At Risk')),
    progress_pct INT DEFAULT 0,
    due_date DATE,
    budget_cad NUMERIC DEFAULT 0,
    client_visible BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS client_name TEXT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS current_stage TEXT DEFAULT 'Cadrage & Onboarding',
    ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'On Track',
    ADD COLUMN IF NOT EXISTS progress_pct INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS budget_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS client_visible BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces projets membres" ON public.projects;
CREATE POLICY "Acces projets membres" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_name TEXT,
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignee_name TEXT,
    due_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS client_name TEXT,
    ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assignee_name TEXT,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces taches membres" ON public.tasks;
CREATE POLICY "Acces taches membres" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    title TEXT NOT NULL DEFAULT 'Proposition Commerciale',
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL DEFAULT '',
    client_email TEXT,
    client_company TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'opened', 'signed', 'rejected')),
    setup_price_cad NUMERIC NOT NULL DEFAULT 0,
    mrr_cad NUMERIC NOT NULL DEFAULT 0,
    deposit_pct INT NOT NULL DEFAULT 50,
    deposit_amount_cad NUMERIC NOT NULL DEFAULT 0,
    tax_tps_cad NUMERIC NOT NULL DEFAULT 0,
    tax_tvq_cad NUMERIC NOT NULL DEFAULT 0,
    total_due_now_cad NUMERIC NOT NULL DEFAULT 0,
    deliverables JSONB DEFAULT '[]'::jsonb,
    signed_at TIMESTAMPTZ,
    signer_name TEXT,
    signer_ip TEXT,
    signature_svg TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals
    ADD COLUMN IF NOT EXISTS token TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Proposition Commerciale',
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS client_email TEXT,
    ADD COLUMN IF NOT EXISTS client_company TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS setup_price_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS mrr_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deposit_pct INT DEFAULT 50,
    ADD COLUMN IF NOT EXISTS deposit_amount_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_tps_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_tvq_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_due_now_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS signer_name TEXT,
    ADD COLUMN IF NOT EXISTS signer_ip TEXT,
    ADD COLUMN IF NOT EXISTS signature_svg TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS proposals_token_unique_idx ON public.proposals(token) WHERE token IS NOT NULL;

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces propositions membres" ON public.proposals;
CREATE POLICY "Acces propositions membres" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acces public propositions par token" ON public.proposals;
CREATE POLICY "Acces public propositions par token" ON public.proposals FOR SELECT TO anon USING (token IS NOT NULL);

DROP POLICY IF EXISTS "Signature publique proposition" ON public.proposals;
CREATE POLICY "Signature publique proposition" ON public.proposals FOR UPDATE TO anon USING (status IN ('sent', 'opened', 'draft')) WITH CHECK (status = 'signed');

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    subtotal_cad NUMERIC NOT NULL DEFAULT 0,
    tax_tps_cad NUMERIC NOT NULL DEFAULT 0,
    tax_tvq_cad NUMERIC NOT NULL DEFAULT 0,
    total_cad NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    line_items JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS invoice_number TEXT,
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    ADD COLUMN IF NOT EXISTS subtotal_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_tps_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax_tvq_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS line_items JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces factures membres" ON public.invoices;
CREATE POLICY "Acces factures membres" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL DEFAULT '',
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL DEFAULT '',
    commission_type TEXT NOT NULL CHECK (commission_type IN ('setup_direct', 'mrr_recurring', 'bonus_quota')),
    base_deal_amount_cad NUMERIC NOT NULL DEFAULT 0,
    commission_rate_pct NUMERIC NOT NULL DEFAULT 0,
    multiplier NUMERIC NOT NULL DEFAULT 1.0,
    amount_cad NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    notes TEXT
);

ALTER TABLE public.team_commissions
    ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS member_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS client_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS commission_type TEXT,
    ADD COLUMN IF NOT EXISTS base_deal_amount_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_rate_pct NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS multiplier NUMERIC DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS amount_cad NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces commissions membres" ON public.team_commissions;
CREATE POLICY "Acces commissions membres" ON public.team_commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    channel_type TEXT NOT NULL CHECK (channel_type IN ('project', 'client', 'dm', 'topic')),
    channel_id TEXT NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT,
    attachment_url TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'audio', 'file', 'gif', NULL)),
    attachment_name TEXT,
    parent_message_id UUID REFERENCES public.team_chat_messages(id) ON DELETE CASCADE
);

ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS channel_type TEXT,
    ADD COLUMN IF NOT EXISTS channel_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_type TEXT,
    ADD COLUMN IF NOT EXISTS attachment_name TEXT,
    ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.team_chat_messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS team_chat_channel_idx ON public.team_chat_messages(channel_type, channel_id, created_at);

ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces chat membres" ON public.team_chat_messages;
CREATE POLICY "Acces chat membres" ON public.team_chat_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.tech_qa_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    project_name TEXT NOT NULL DEFAULT 'Minerva — Release',
    target_url TEXT NOT NULL DEFAULT 'https://app.minerva.agency',
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'preview')),
    passed_points INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 20,
    score_percentage INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'warning', 'pending')),
    auditor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    auditor_name TEXT NOT NULL DEFAULT 'Lead Tech',
    notes TEXT,
    checklist_data JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.tech_qa_audits
    ADD COLUMN IF NOT EXISTS project_name TEXT DEFAULT 'Minerva — Release',
    ADD COLUMN IF NOT EXISTS target_url TEXT DEFAULT 'https://app.minerva.agency',
    ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS passed_points INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_points INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS score_percentage INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS auditor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS auditor_name TEXT DEFAULT 'Lead Tech',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.tech_qa_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces audits QA membres" ON public.tech_qa_audits;
CREATE POLICY "Acces audits QA membres" ON public.tech_qa_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- v2.20 APPEND: consolidates 20260817000010 through 20260831000006.
-- Reference-only -- represents the final state each incrementally-widened
-- object (e.g. team_chat_messages.channel_type) ended up at, not a replay
-- of every intermediate step. See individual dated files for full history.
-- ============================================================================

-- SOURCE: 20260817000010_feature_requests_and_minerva_flow.sql
CREATE TABLE IF NOT EXISTS public.feature_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'feature',
    repo TEXT NOT NULL DEFAULT 'Minerva-Flow',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'under_review',
    estimated_delivery DATE,
    admin_notes TEXT,
    author_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feature_requests_client ON public.feature_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON public.feature_requests(status);
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_requests_select" ON public.feature_requests;
CREATE POLICY "feature_requests_select" ON public.feature_requests FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.role IN ('admin', 'member') OR p.client_id = feature_requests.client_id)) OR user_id = auth.uid() OR client_id IS NULL);
DROP POLICY IF EXISTS "feature_requests_insert" ON public.feature_requests;
CREATE POLICY "feature_requests_insert" ON public.feature_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "feature_requests_update" ON public.feature_requests;
CREATE POLICY "feature_requests_update" ON public.feature_requests FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND (p.role IN ('admin', 'member') OR p.client_id = feature_requests.client_id)) OR user_id = auth.uid());
DROP POLICY IF EXISTS "feature_requests_delete" ON public.feature_requests;
CREATE POLICY "feature_requests_delete" ON public.feature_requests FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') OR user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.minerva_flow_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    period TEXT NOT NULL DEFAULT '30d',
    orders_count INT NOT NULL DEFAULT 0,
    gross_volume NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    direct_savings NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    avg_order_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    avg_prep_time_minutes INT NOT NULL DEFAULT 18,
    growth_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    popular_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    daily_stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    recent_tickets JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_minerva_flow_metrics_client ON public.minerva_flow_metrics(client_id);
ALTER TABLE public.minerva_flow_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "minerva_flow_metrics_select" ON public.minerva_flow_metrics;
CREATE POLICY "minerva_flow_metrics_select" ON public.minerva_flow_metrics FOR SELECT TO authenticated USING (true);

-- SOURCE: full current public.contacts shape -- most columns (follow_up_date,
-- follow_up_note, sector, role_title, met_at_*, instagram/twitter/facebook/
-- website_url, converted_to_lead_id, created_by) were already added by
-- 20260822000000_consolidated_schema.sql; only avatar_url/how_can_i_help/
-- biggest_problem/open_to_collaborate/preferred_contact_method/status/source
-- come from 20260822000001_contacts_networking.sql and bio from
-- 20260823000000_contacts_bio.sql. Listed together here since this section
-- represents the table's current end state, not each migration in isolation.
ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS how_can_i_help TEXT,
    ADD COLUMN IF NOT EXISTS biggest_problem TEXT,
    ADD COLUMN IF NOT EXISTS open_to_collaborate BOOLEAN,
    ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'a_contacter',
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS follow_up_date DATE,
    ADD COLUMN IF NOT EXISTS follow_up_note TEXT,
    ADD COLUMN IF NOT EXISTS sector TEXT,
    ADD COLUMN IF NOT EXISTS role_title TEXT,
    ADD COLUMN IF NOT EXISTS met_at_event TEXT,
    ADD COLUMN IF NOT EXISTS met_at_location TEXT,
    ADD COLUMN IF NOT EXISTS met_at_date DATE,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT,
    ADD COLUMN IF NOT EXISTS twitter_url TEXT,
    ADD COLUMN IF NOT EXISTS facebook_url TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS converted_to_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- SOURCE: 20260827000000_plane_integration.sql
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS plane_issue_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_sequence_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_state_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_last_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS plane_sync_status TEXT DEFAULT 'synced';
CREATE INDEX IF NOT EXISTS idx_tasks_plane_issue_id ON public.tasks(plane_issue_id) WHERE plane_issue_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.plane_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('push_task', 'pull_webhook', 'manual_sync', 'mcp_tool_call')),
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    plane_issue_id TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plane_sync_logs_created_at ON public.plane_sync_logs(created_at DESC);
ALTER TABLE public.plane_sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read plane_sync_logs" ON public.plane_sync_logs;
CREATE POLICY "Authenticated users can read plane_sync_logs" ON public.plane_sync_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert plane_sync_logs" ON public.plane_sync_logs;
CREATE POLICY "Authenticated users can insert plane_sync_logs" ON public.plane_sync_logs FOR INSERT TO authenticated WITH CHECK (true);

-- SOURCE: 20260828000000_invoicing_and_client_portal.sql
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE,
    type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'quote', 'retainer')),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_deliverables_client_id ON public.client_deliverables(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_messages_client_id ON public.client_portal_messages(client_id);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_portal_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins and members can view invoices" ON public.invoices;
CREATE POLICY "Admins and members can view invoices" ON public.invoices FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR client_id = public.client_id_for(auth.uid()));
DROP POLICY IF EXISTS "Admins and members can manage invoices" ON public.invoices;
CREATE POLICY "Admins and members can manage invoices" ON public.invoices FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));
DROP POLICY IF EXISTS "Admins and members can view invoice items" ON public.invoice_items;
CREATE POLICY "Admins and members can view invoice items" ON public.invoice_items FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR EXISTS (SELECT 1 FROM public.invoices inv WHERE inv.id = invoice_items.invoice_id AND inv.client_id = public.client_id_for(auth.uid())));
DROP POLICY IF EXISTS "Admins and members can manage invoice items" ON public.invoice_items;
CREATE POLICY "Admins and members can manage invoice items" ON public.invoice_items FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));
DROP POLICY IF EXISTS "Admins and members can view deliverables" ON public.client_deliverables;
CREATE POLICY "Admins and members can view deliverables" ON public.client_deliverables FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR client_id = public.client_id_for(auth.uid()));
DROP POLICY IF EXISTS "Admins and members can manage deliverables" ON public.client_deliverables;
CREATE POLICY "Admins and members can manage deliverables" ON public.client_deliverables FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));
DROP POLICY IF EXISTS "Admins and members can view portal messages" ON public.client_portal_messages;
CREATE POLICY "Admins and members can view portal messages" ON public.client_portal_messages FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member') OR client_id = public.client_id_for(auth.uid()));
-- The original migration accidentally left a stray, unscoped
-- `CREATE POLICY "Admins and Seigneur can manage portal messages" ON
-- public.client_portal_messages;` statement in place (valid SQL -- a
-- policy with no USING/WITH CHECK defaults to `true` for PUBLIC -- but a
-- live RLS hole granting anyone unrestricted access). It was never dropped
-- by name anywhere, so it survives on any DB that already ran that
-- migration. Drop it explicitly here rather than reproducing it.
DROP POLICY IF EXISTS "Admins and Seigneur can manage portal messages" ON public.client_portal_messages;
DROP POLICY IF EXISTS "Admins and members can manage portal messages" ON public.client_portal_messages;
CREATE POLICY "Admins and members can manage portal messages" ON public.client_portal_messages FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

-- SOURCE: 20260828000001_leads_columns_sync.sql
ALTER TABLE IF EXISTS public.leads
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS service_requested TEXT,
    ADD COLUMN IF NOT EXISTS estimated_value_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS probability_pct INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS score_grade TEXT DEFAULT 'A',
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- SOURCE: 20260828000002_minerva_flow_and_studio.sql
CREATE TABLE IF NOT EXISTS public.minerva_flow_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'restaurant' CHECK (type IN ('restaurant', 'cafe', 'bistro', 'bar', 'boulangerie', 'fast_casual')),
    address TEXT,
    city TEXT DEFAULT 'Montréal',
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    owner_phone TEXT,
    mrr_plan_cad NUMERIC(10,2) NOT NULL DEFAULT 149.00,
    orders_count_30d INT NOT NULL DEFAULT 0,
    revenue_volume_30d NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    commission_saved_30d NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    health_score INT NOT NULL DEFAULT 95 CHECK (health_score BETWEEN 0 AND 100),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'churn_risk', 'churned')),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    pos_connected BOOLEAN DEFAULT TRUE,
    qr_menu_active BOOLEAN DEFAULT TRUE,
    has_studio_upsell BOOLEAN DEFAULT FALSE,
    studio_upsell_notes TEXT,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.studio_service_packages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('production_video', 'web_framer', 'acquisition_ads', 'operations_pos', 'branding')),
    description TEXT NOT NULL,
    price_cad NUMERIC(10,2) NOT NULL,
    recurring BOOLEAN DEFAULT FALSE,
    deliverable_days INT NOT NULL DEFAULT 7,
    features_list JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN DEFAULT FALSE,
    icon_name TEXT DEFAULT 'Sparkles',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.studio_service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    package_id TEXT NOT NULL REFERENCES public.studio_service_packages(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_production', 'delivered', 'cancelled')),
    total_cad NUMERIC(10,2) NOT NULL,
    stripe_payment_link_url TEXT,
    notes TEXT,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.restaurant_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    monthly_ubereats_volume_cad NUMERIC(10,2) NOT NULL DEFAULT 15000.00,
    commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 28.00,
    annual_loss_cad NUMERIC(10,2) NOT NULL DEFAULT 50400.00,
    projected_flow_savings_cad NUMERIC(10,2) NOT NULL DEFAULT 42000.00,
    gmb_rating NUMERIC(3,1) DEFAULT 4.2,
    website_url TEXT,
    audit_token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'contacted', 'converted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flow_restaurants_status ON public.minerva_flow_restaurants(status);
CREATE INDEX IF NOT EXISTS idx_studio_orders_client_id ON public.studio_service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_audits_token ON public.restaurant_audits(audit_token);
ALTER TABLE public.minerva_flow_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flow_restaurants_auth_all" ON public.minerva_flow_restaurants;
CREATE POLICY "flow_restaurants_auth_all" ON public.minerva_flow_restaurants FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "studio_packages_read_all" ON public.studio_service_packages;
CREATE POLICY "studio_packages_read_all" ON public.studio_service_packages FOR SELECT TO authenticated, anon USING (true);
DROP POLICY IF EXISTS "studio_orders_auth_all" ON public.studio_service_orders;
CREATE POLICY "studio_orders_auth_all" ON public.studio_service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "restaurant_audits_all" ON public.restaurant_audits;
CREATE POLICY "restaurant_audits_all" ON public.restaurant_audits FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- SOURCE: 20260828000003_proposals_and_esignature.sql
ALTER TABLE IF EXISTS public.proposals
    ADD COLUMN IF NOT EXISTS proposal_number TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS token TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS scope_phases JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS deliverables JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS subtotal_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tps_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_tvq_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_monthly_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS deposit_pct NUMERIC(5,2) DEFAULT 50.00,
    ADD COLUMN IF NOT EXISTS deposit_amount_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deposit_stripe_payment_link TEXT,
    ADD COLUMN IF NOT EXISTS signature_svg_or_base64 TEXT,
    ADD COLUMN IF NOT EXISTS signer_name TEXT,
    ADD COLUMN IF NOT EXISTS signer_ip TEXT,
    ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
CREATE INDEX IF NOT EXISTS idx_proposals_token ON public.proposals(token);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_auth_all" ON public.proposals;
CREATE POLICY "proposals_auth_all" ON public.proposals FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "proposals_anon_read_token" ON public.proposals;
CREATE POLICY "proposals_anon_read_token" ON public.proposals FOR SELECT TO anon USING (token IS NOT NULL);
DROP POLICY IF EXISTS "proposals_anon_update_sign" ON public.proposals;
CREATE POLICY "proposals_anon_update_sign" ON public.proposals FOR UPDATE TO anon USING (token IS NOT NULL) WITH CHECK (token IS NOT NULL);

-- SOURCE: 20260828000004_revops_and_team_commissions.sql
CREATE TABLE IF NOT EXISTS public.team_capacity_profiles (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'generalist' CHECK (specialty IN ('video_production', 'web_framer', 'ads_acquisition', 'pos_operations', 'generalist')),
    weekly_hours_capacity INTEGER NOT NULL DEFAULT 35,
    monthly_quota_cad NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.team_capacity_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_capacity_auth_all" ON public.team_capacity_profiles;
CREATE POLICY "team_capacity_auth_all" ON public.team_capacity_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SOURCE: 20260829000000_tech_workspace.sql (workspace CHECK widening on
-- tables not otherwise defined in this file)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_invites_workspace_check') THEN
        ALTER TABLE public.team_invites DROP CONSTRAINT team_invites_workspace_check;
    END IF;
    ALTER TABLE public.team_invites ADD CONSTRAINT team_invites_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing', 'tech'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_workspace_check') THEN
        ALTER TABLE public.documents DROP CONSTRAINT documents_workspace_check;
    END IF;
    ALTER TABLE public.documents ADD CONSTRAINT documents_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing', 'tech'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- SOURCE: 20260829000001_cleanup_and_rls.sql
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'team_invites') THEN
        DROP POLICY IF EXISTS "Authenticated users can delete team_invites" ON public.team_invites;
        CREATE POLICY "Authenticated users can delete team_invites" ON public.team_invites FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- SOURCE: 20260831000000_academy_rebuild.sql (DDL only -- seed inserts live
-- solely in the dated file, not replayed here)
ALTER TABLE public.academy_sops
    ADD COLUMN IF NOT EXISTS content_json JSONB,
    ADD COLUMN IF NOT EXISTS is_essential BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_onboarding_step BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sort_order INT,
    ADD COLUMN IF NOT EXISTS pillar TEXT,
    ADD COLUMN IF NOT EXISTS read_time_min INT DEFAULT 15,
    ADD COLUMN IF NOT EXISTS author TEXT;
CREATE INDEX IF NOT EXISTS academy_sops_onboarding_idx ON public.academy_sops (is_onboarding_step, sort_order) WHERE is_onboarding_step = true;

-- SOURCE: 20260831000001_chat_slack_features.sql, 20260831000004_coach_bot.sql
-- (channel_type CHECK shown at its final widened state, not each increment)
ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check
    CHECK (channel_type IN ('project', 'client', 'dm', 'topic', 'coach'));
ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.team_chat_messages(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS team_chat_messages_parent_idx ON public.team_chat_messages (parent_message_id);

CREATE TABLE IF NOT EXISTS public.team_chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT team_chat_reactions_unique UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS team_chat_reactions_message_idx ON public.team_chat_reactions (message_id);
ALTER TABLE public.team_chat_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_chat_reactions_select" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_select" ON public.team_chat_reactions FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_chat') OR user_id = auth.uid());
DROP POLICY IF EXISTS "team_chat_reactions_insert" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_insert" ON public.team_chat_reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "team_chat_reactions_delete" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_delete" ON public.team_chat_reactions FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.team_chat_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS team_chat_mentions_user_idx ON public.team_chat_mentions (mentioned_user_id, read_at);
ALTER TABLE public.team_chat_mentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_chat_mentions_select" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_select" ON public.team_chat_mentions FOR SELECT TO authenticated
    USING (mentioned_user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "team_chat_mentions_insert" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_insert" ON public.team_chat_mentions FOR INSERT TO authenticated WITH CHECK (TRUE);
DROP POLICY IF EXISTS "team_chat_mentions_update" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_update" ON public.team_chat_mentions FOR UPDATE TO authenticated USING (mentioned_user_id = auth.uid());

-- SOURCE: 20260831000003_add_ai_generation_logs.sql
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    workspace TEXT DEFAULT 'general',
    action TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gemini-3.6-flash',
    prompt_preview TEXT,
    input_length INT DEFAULT 0,
    output_length INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user ON public.ai_generation_logs (user_id);
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can insert AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can insert AI logs" ON public.ai_generation_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Members can view own AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can view own AI logs" ON public.ai_generation_logs FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')));

-- SOURCE: 20260831000003_help_chatbot.sql
CREATE TABLE IF NOT EXISTS public.help_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS help_chat_messages_user_idx ON public.help_chat_messages (user_id, created_at);
ALTER TABLE public.help_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "help_chat_messages_select" ON public.help_chat_messages;
CREATE POLICY "help_chat_messages_select" ON public.help_chat_messages FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS "help_chat_messages_insert" ON public.help_chat_messages;
CREATE POLICY "help_chat_messages_insert" ON public.help_chat_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SOURCE: 20260831000004_coach_bot.sql (channel_type CHECK already folded
-- into the chat_slack_features section above)
CREATE TABLE IF NOT EXISTS public.standup_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT standup_responses_user_date_unique UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS standup_responses_date_idx ON public.standup_responses (date);
ALTER TABLE public.standup_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "standup_responses_select" ON public.standup_responses;
CREATE POLICY "standup_responses_select" ON public.standup_responses FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());
DROP POLICY IF EXISTS "standup_responses_insert" ON public.standup_responses;
CREATE POLICY "standup_responses_insert" ON public.standup_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "standup_responses_update" ON public.standup_responses;
CREATE POLICY "standup_responses_update" ON public.standup_responses FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.checkin_weekly_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    task_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    open_answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT checkin_weekly_responses_user_week_unique UNIQUE (user_id, week_start)
);
CREATE INDEX IF NOT EXISTS checkin_weekly_responses_week_idx ON public.checkin_weekly_responses (week_start);
ALTER TABLE public.checkin_weekly_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_weekly_responses_select" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_select" ON public.checkin_weekly_responses FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());
DROP POLICY IF EXISTS "checkin_weekly_responses_insert" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_insert" ON public.checkin_weekly_responses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "checkin_weekly_responses_update" ON public.checkin_weekly_responses;
CREATE POLICY "checkin_weekly_responses_update" ON public.checkin_weekly_responses FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.availability_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    proposed_slots JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.availability_polls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_polls_select" ON public.availability_polls;
CREATE POLICY "availability_polls_select" ON public.availability_polls FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "availability_polls_insert" ON public.availability_polls;
CREATE POLICY "availability_polls_insert" ON public.availability_polls FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.availability_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.availability_polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT availability_votes_unique UNIQUE (poll_id, user_id)
);
CREATE INDEX IF NOT EXISTS availability_votes_poll_idx ON public.availability_votes (poll_id);
ALTER TABLE public.availability_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "availability_votes_select" ON public.availability_votes;
CREATE POLICY "availability_votes_select" ON public.availability_votes FOR SELECT TO authenticated USING (TRUE);
DROP POLICY IF EXISTS "availability_votes_insert" ON public.availability_votes;
CREATE POLICY "availability_votes_insert" ON public.availability_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "availability_votes_update" ON public.availability_votes;
CREATE POLICY "availability_votes_update" ON public.availability_votes FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- poll_id added here (not alongside parent_message_id above) because it
-- references availability_polls, which doesn't exist until this point.
ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS poll_id UUID REFERENCES public.availability_polls(id) ON DELETE SET NULL;

-- SOURCE: 20260831000005_team_contact_info.sql
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- SOURCE: 20260831000006_coach_memory_ghost_reports.sql
CREATE TABLE IF NOT EXISTS public.coach_member_memory (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.coach_member_memory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_member_memory_select" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_select" ON public.coach_member_memory FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());
DROP POLICY IF EXISTS "coach_member_memory_insert" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_insert" ON public.coach_member_memory FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "coach_member_memory_update" ON public.coach_member_memory;
CREATE POLICY "coach_member_memory_update" ON public.coach_member_memory FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.coach_weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    standups_answered INT NOT NULL DEFAULT 0,
    standups_total INT NOT NULL DEFAULT 0,
    response_rate_pct INT NOT NULL DEFAULT 0,
    trend_summary TEXT,
    is_ghosting BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT coach_weekly_reports_user_week_unique UNIQUE (user_id, week_start)
);
CREATE INDEX IF NOT EXISTS coach_weekly_reports_week_idx ON public.coach_weekly_reports (week_start);
ALTER TABLE public.coach_weekly_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_weekly_reports_select" ON public.coach_weekly_reports;
CREATE POLICY "coach_weekly_reports_select" ON public.coach_weekly_reports FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload'));

CREATE TABLE IF NOT EXISTS public.coach_ghost_status (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    consecutive_missed_checkins INT NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    is_ghosting BOOLEAN NOT NULL DEFAULT FALSE,
    last_nudged_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.coach_ghost_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_ghost_status_select" ON public.coach_ghost_status;
CREATE POLICY "coach_ghost_status_select" ON public.coach_ghost_status FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_workload') OR user_id = auth.uid());
