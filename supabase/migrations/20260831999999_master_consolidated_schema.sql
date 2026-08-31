-- Master Consolidated Production Migration (v2.13.0)
-- See deploy_production_complete.sql for comments and full details.

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

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces taches membres" ON public.tasks;
CREATE POLICY "Acces taches membres" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    title TEXT NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
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
    client_name TEXT NOT NULL,
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

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces factures membres" ON public.invoices;
CREATE POLICY "Acces factures membres" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.team_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('setup_direct', 'mrr_recurring', 'bonus_quota')),
    base_deal_amount_cad NUMERIC NOT NULL,
    commission_rate_pct NUMERIC NOT NULL,
    multiplier NUMERIC NOT NULL DEFAULT 1.0,
    amount_cad NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    notes TEXT
);

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

ALTER TABLE public.tech_qa_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acces audits QA membres" ON public.tech_qa_audits;
CREATE POLICY "Acces audits QA membres" ON public.tech_qa_audits FOR ALL TO authenticated USING (true) WITH CHECK (true);
