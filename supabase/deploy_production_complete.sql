-- ============================================================================
-- MINERVA TREQUARTISTA — MASTER DÉPLOIEMENT PRODUCTION CONSOLIDÉ (v2.21.0)
-- 
-- Ce script unique regroupe l'intégralité du schéma de base de données,
-- des tables, contraintes, triggers, politiques de sécurité RLS et données
-- initiales de référence pour l'écosystème Minerva Trequartista.
--
-- 100% Idempotent & Auto-Migrant : Gère automatiquement les tables existantes
-- et ajoute toutes les colonnes manquantes (IF NOT EXISTS) avant de créer
-- les politiques RLS.
--
-- À copier-coller et exécuter en 1 clic dans l'éditeur SQL Supabase :
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- ── 1. Extensions Requises ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Tables Utilisateurs & Profils ─────────────────────────────────────────
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
    job_title TEXT,
    approved BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS workspace TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS job_title TEXT,
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture profils pour authentifies" ON public.profiles;
CREATE POLICY "Lecture profils pour authentifies" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Modification profil personnel ou admin" ON public.profiles;
CREATE POLICY "Modification profil personnel ou admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    WITH CHECK (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Insertion profil pour authentifies" ON public.profiles;
CREATE POLICY "Insertion profil pour authentifies" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger synchronisation auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_superadmin BOOLEAN;
BEGIN
    is_superadmin := (LOWER(NEW.email) = 'kbelceus776@gmail.com');

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(digest(NEW.email, 'sha256'), 'hex')),
        CASE WHEN is_superadmin THEN 'admin' ELSE 'member' END,
        CASE WHEN is_superadmin THEN TRUE ELSE FALSE END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. Clients & CRM ────────────────────────────────────────────────────────
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
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS trial_status TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS trial_milestones JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS trial_direct_orders_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS trial_direct_volume_cad NUMERIC(10,2) DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS trial_net_margin_saved_cad NUMERIC(10,2) DEFAULT 0.0;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces clients membres" ON public.clients;
CREATE POLICY "Acces clients membres" ON public.clients
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4. Leads & Pipeline Commercial ──────────────────────────────────────────
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
    metadata JSONB DEFAULT '{}'::jsonb,
    ai_score INT,
    ai_qualification_notes JSONB DEFAULT '{}'::jsonb,
    voice_call_status TEXT DEFAULT 'not_called',
    voice_call_id TEXT,
    reach_id TEXT
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
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_score INT,
    ADD COLUMN IF NOT EXISTS ai_qualification_notes JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS voice_call_status TEXT DEFAULT 'not_called',
    ADD COLUMN IF NOT EXISTS voice_call_id TEXT,
    ADD COLUMN IF NOT EXISTS reach_id TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS monthly_transactions INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pos_system TEXT,
    ADD COLUMN IF NOT EXISTS business_type TEXT,
    ADD COLUMN IF NOT EXISTS loyalty_goal TEXT,
    ADD COLUMN IF NOT EXISTS is_multi_site BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS qualification_score INT,
    ADD COLUMN IF NOT EXISTS qualification_tier TEXT,
    ADD COLUMN IF NOT EXISTS qualification_breakdown JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS next_action_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS call_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS booking_link TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
    ADD COLUMN IF NOT EXISTS utm_term TEXT,
    ADD COLUMN IF NOT EXISTS utm_content TEXT,
    ADD COLUMN IF NOT EXISTS gclid TEXT,
    ADD COLUMN IF NOT EXISTS consent_sms BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS intervention_checklist JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS leads_ai_score_idx ON public.leads (ai_score);
CREATE INDEX IF NOT EXISTS leads_reach_id_idx ON public.leads (reach_id);
CREATE INDEX IF NOT EXISTS leads_qualification_tier_idx ON public.leads (qualification_tier);
CREATE INDEX IF NOT EXISTS leads_qualification_score_idx ON public.leads (qualification_score);
CREATE INDEX IF NOT EXISTS leads_call_at_idx ON public.leads (call_at);
CREATE INDEX IF NOT EXISTS leads_gclid_idx ON public.leads (gclid);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces leads membres" ON public.leads;
CREATE POLICY "Acces leads membres" ON public.leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4.1 Événements du Cycle de Vie des Leads ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_events_lead_id_idx ON public.lead_events (lead_id);
CREATE INDEX IF NOT EXISTS lead_events_type_idx ON public.lead_events (event_type);
CREATE INDEX IF NOT EXISTS lead_events_created_at_idx ON public.lead_events (created_at);
CREATE INDEX IF NOT EXISTS lead_events_composite_idx ON public.lead_events (lead_id, event_type);

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces lead_events membres" ON public.lead_events;
CREATE POLICY "Acces lead_events membres" ON public.lead_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Insertion publique lead_events" ON public.lead_events;
CREATE POLICY "Insertion publique lead_events" ON public.lead_events
    FOR INSERT TO anon WITH CHECK (true);

-- ── 5. Réseau & Contacts Professionnels ──────────────────────────────────────
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
CREATE POLICY "Acces contacts membres" ON public.contacts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 6. Projets & Livrables ──────────────────────────────────────────────────
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
CREATE POLICY "Acces projets membres" ON public.projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 7. Tâches Équipe (Indépendant & Épuré) ──────────────────────────────────
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
CREATE POLICY "Acces taches membres" ON public.tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 8. Propositions Commerciales & Signature Électronique ───────────────────
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

-- Assurer l'existence de toutes les colonnes sur les tables déjà existantes
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
CREATE POLICY "Acces propositions membres" ON public.proposals
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acces public propositions par token" ON public.proposals;
CREATE POLICY "Acces public propositions par token" ON public.proposals
    FOR SELECT TO anon USING (token IS NOT NULL);

DROP POLICY IF EXISTS "Signature publique proposition" ON public.proposals;
CREATE POLICY "Signature publique proposition" ON public.proposals
    FOR UPDATE TO anon
    USING (status IN ('sent', 'opened', 'draft'))
    WITH CHECK (status = 'signed');

-- ── 9. Facturation & Devis ──────────────────────────────────────────────────
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
CREATE POLICY "Acces factures membres" ON public.invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 10. Commissions RevOps & Capacité d'Équipe ──────────────────────────────
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
CREATE POLICY "Acces commissions membres" ON public.team_commissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 11. Messagerie d'Équipe & Canaux Thématiques ────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    channel_type TEXT NOT NULL CHECK (channel_type IN ('project', 'client', 'dm', 'topic', 'coach')),
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

ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check CHECK (channel_type IN ('project', 'client', 'dm', 'topic', 'coach'));

CREATE INDEX IF NOT EXISTS team_chat_channel_idx ON public.team_chat_messages(channel_type, channel_id, created_at);

ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces chat membres" ON public.team_chat_messages;
CREATE POLICY "Acces chat membres" ON public.team_chat_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 12. Présence Temps Réel & Statut ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.team_presence (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away', 'offline')),
    current_path TEXT,
    page_label TEXT
);

ALTER TABLE public.team_presence
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS current_path TEXT,
    ADD COLUMN IF NOT EXISTS page_label TEXT;

ALTER TABLE public.team_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces presence membres" ON public.team_presence;
CREATE POLICY "Acces presence membres" ON public.team_presence
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 13. Audits QA & Qualité Technique ───────────────────────────────────────
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
CREATE POLICY "Acces audits QA membres" ON public.tech_qa_audits
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 14. Académie & SOPs de Référence ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academy_sops (
    id TEXT PRIMARY KEY DEFAULT ('sop-' || encode(gen_random_bytes(6), 'hex')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    pillar TEXT CHECK (pillar IN ('flow', 'reach', 'agency', 'inspirations', 'transversal')),
    content_markdown TEXT NOT NULL,
    content_json JSONB,
    read_time_min INT DEFAULT 10,
    author TEXT DEFAULT 'Kael Belceus',
    is_essential BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_onboarding_step BOOLEAN DEFAULT false,
    sort_order INT
);

ALTER TABLE public.academy_sops
    ADD COLUMN IF NOT EXISTS content_json JSONB,
    ADD COLUMN IF NOT EXISTS is_essential BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_onboarding_step BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS sort_order INT,
    ADD COLUMN IF NOT EXISTS pillar TEXT,
    ADD COLUMN IF NOT EXISTS read_time_min INT DEFAULT 10,
    ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Kael Belceus',
    ADD COLUMN IF NOT EXISTS target_workspace TEXT CHECK (target_workspace IN ('prospection', 'managing', 'tech', 'all')) DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS script_template TEXT;

CREATE INDEX IF NOT EXISTS academy_sops_target_workspace_idx
    ON public.academy_sops (target_workspace);

ALTER TABLE public.academy_sops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces academy membres" ON public.academy_sops;
CREATE POLICY "Acces academy membres" ON public.academy_sops
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insertion idempotente de la SOP-TECH-07 (Workflow Multi-IA)
INSERT INTO public.academy_sops (
  title, description, category, target_workspace, content_markdown, read_time_min, author, is_essential, is_featured, is_onboarding_step, sort_order, pillar, checklist_items, script_template
)
SELECT
  'SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub',
  'Méthodologie complète d’ingénierie collaborative avec l’IA : synergie Perplexity, Gemini, Codex et Claude Code sur un socle GitHub professionnel (CI/CD, PRs, tests et sécurité).',
  'Workflows IA',
  'tech',
  '# SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub

> **Rôle & Posture :** Cadre directeur d''ingénierie logicielle pour l''équipe Minerva et ses assistants IA. Définit la coordination opérationnelle entre Perplexity, Gemini, Codex et Claude Code avec GitHub comme colonne vertébrale immuable.

---

## 1. Contexte & Objectifs de l''Ingénierie Multi-IA

Chez Minerva, nous développons des produits SaaS de pointe (ex. Minerva Flow, Minerva Reach) et des outils ERP d''exploitation interne (Minerva Trequartista). Ce standard vise à :
- **Sanctuariser GitHub** comme socle unique de vérité et de sécurité (branches, tests automatiques, CI/CD, sécurité des secrets).
- **Cadrer la planification produit avec Perplexity** du besoin métier jusqu''au cahier des charges technique.
- **Orchestrer un workflow d''équipe multi-IA** où chaque modèle intervient sur sa zone d''excellence sans se marcher sur les pieds.
- **Appliquer des conventions strictes** de code, de revue humaine/machine et de gouvernance.

---

## 2. GitHub : Socle de Développement, CI/CD & Sécurité

### 2.1 Organisation du Dépôt & Stratégie de Branches
La branche principale est sacrée et protégée.
- `main` : Branche de production, verrouillée, toujours déployable sans friction sur Vercel.
- `develop` (optionnel selon les chantiers) : Branche d''intégration d''épopée.
- `feat/<nom-fonctionnalite>` : Branches de fonctionnalités dédiées.
- `bugfix/<nom-bug>` : Branches de correctifs de bugs ciblés.
- `hotfix/<nom-hotfix>` : Correctifs urgents appliqués directement depuis la production.

#### Conventions de Commits (Conventional Commits)
- `feat(scope): ...` : Nouvelle fonctionnalité utilisateur ou technique.
- `fix(scope): ...` : Résolution d''un bogue ou d''un comportement inattendu.
- `refactor(scope): ...` : Refactorisation sans modification du comportement externe.
- `docs(scope): ...` : Documentation, wikis, ou SOPs d''académie.
- `chore(scope): ...` : Maintenance, dépendances, configuration CI/CD.

### 2.2 Tests & Qualité de Code Stricte
Tout code produit avec ou sans IA doit satisfaire à un triple contrôle :
1. **Typage Stricte TypeScript :** Zéro `any`. Vérification impérative via `npx tsc --noEmit`.
2. **Linting & Formatage :** Conformité aux règles ESLint et Prettier du projet.
3. **Protocole QA 20-Points :** Homologation via la console d''assurance qualité (`QualityChecklistRunner`).

### 2.3 Pipeline CI/CD GitHub Actions
Le pipeline se découpe en deux phases automatisées :
- **CI (Continuous Integration) :** Déclenchée à chaque push ou création de Pull Request.
  - Installation des dépendances avec cache de paquet (`npm ci`).
  - Validation du typage TypeScript (`npx tsc --noEmit`).
  - Linter et vérification statique.
  - Build applicatif Next.js (`npm run build`).
- **CD (Continuous Deployment) :** Déclenchée lors du merge dans `main`.
  - Déploiement automatique sur l''infrastructure de production (Vercel).
  - Validation des webhooks de notification.

### 2.4 Sécurité & Gestion des Secrets
- **Zéro Clé dans Git :** Aucune clé API, token de service ou chaîne de connexion PostgreSQL ne doit figurer dans le code source ou l''historique Git.
- **Variables d''Environnement :** Configuration via GitHub Secrets et Vercel Environment Variables (`.env.local` réservé au local et strictement gitignoré).
- **Protection des Branches :** Revue obligatoire, passage vert de tous les checks CI avant fusion.

---

## 3. Planification Produit avec Perplexity

Perplexity intervient en amont comme **cerveau de recherche et d''analyse concurrentielle**.

### 3.1 Du Besoin à la Mini-PRD
Lorsqu''une nouvelle fonctionnalité émerge :
1. **Clarification Métier :** Définir le problème utilisateur, le persona cible et le gain d''efficacité visé.
2. **Recherche & Benchmark Perplexity :**
   - Étude des standards UX du marché et des solutions concurrentes.
   - Veille sur les patterns d''architecture et bibliothèques recommandées.
   - Vérification des contraintes légales, de conformité ou de sécurité (ex. RGPD, lois québécoises sur les données).
3. **Rédaction de la Mini-PRD :**
   - Objectif business clair & métriques de succès.
   - User stories et critères d''acceptation vérifiables.
   - Contraintes techniques et dépendances tierces.

### 3.2 Découpage Technique
À partir de la PRD, décomposer le chantier en tickets GitHub clairs :
- Frontend (composants UI, accessibilité, états réactifs).
- Backend & Base de Données (schémas SQL, migrations Supabase, RLS policies).
- Intégrations externes & endpoints API.

---

## 4. Orchestration Multi-IA : Rôles & Synergies

Chaque modèle d''intelligence artificielle est positionné selon ses forces spécifiques :

| Assistant IA | Rôle Principal | Tâches Types |
| :--- | :--- | :--- |
| **Perplexity** | Recherche & Spécification | Veille technologique, benchmark UX, clarification du besoin, cadrage de mini-PRD. |
| **Gemini** | Scaffolding & Architecture | Génération de composants Next.js initiaux, structure de routes App Router, propositions d''implémentation. |
| **Codex / LLMs Spécialisés** | Implémentation Précise | Écriture de scripts SQL de migration, fonctions utilitaires, suites de tests unitaires et intégration. |
| **Claude Code** | Revue Holistique & Cohérence | Analyse cross-fichiers, détection d''incohérences, refactoring de haut niveau, documentation technique. |

---

## 5. La Boucle de Développement en 7 Étapes

Pour chaque fonctionnalité ou mise à jour, l''équipe applique rigoureusement cette boucle :

```
[1. Clarification PRD] (Perplexity)
       ↓
[2. Conception Technique] (Architecture & Modèle SQL)
       ↓
[3. Branche Git Dédiée] (feat/nom-du-module)
       ↓
[4. Génération de Code Initial] (Gemini / Codex)
       ↓
[5. Revue & Harmonisation Globale] (Claude Code + Lead Humain)
       ↓
[6. Contrôle Qualité Strict] (npx tsc --noEmit + Protocole 20-Points)
       ↓
[7. Pull Request & CI/CD] (GitHub Actions + Déploiement Staging/Prod)
```

---

## 6. Bonnes Pratiques pour Coder en Équipe avec l''IA

1. **Ne Jamais Accepter de Code Non Vérifié :** Même généré par l''IA la plus avancée, chaque ligne doit être comprise, compilée et éprouvée.
2. **Conserver la Trace Écrite :** Documenter dans les descriptions de Pull Request quelles parties ont été accélérées par l''IA et comment elles ont été auditées.
3. **Mettre à Jour la Documentation :** Toute modification de schéma DB ou de flux métier doit mettre à jour `CHANGELOG.md` et les documents de référence.',
  15,
  'Kael Belceus & Lead Tech',
  true,
  true,
  true,
  7,
  'transversal',
  '[
    "1. Cadrer le besoin et générer la mini-PRD via Perplexity (analyse comparative & contraintes)",
    "2. Définir l''architecture technique, les endpoints et le modèle de données",
    "3. Créer une branche Git dédiée (feat/... ou fix/...) rattachée au ticket GitHub",
    "4. Générer le code initial et le scaffolding avec Gemini ou Codex",
    "5. Réviser et harmoniser le code dans le codebase global avec Claude Code",
    "6. Valider la qualité stricte locale : npx tsc --noEmit et protocole QA 20-points",
    "7. Ouvrir la Pull Request détaillée, valider la CI GitHub Actions et planifier le déploiement"
  ]'::jsonb,
  '# ── 1. PROMPT SYSTÈME UNIVERSEL POUR ASSISTANT IA ──
Tu es Minerva Trequista, mon assistante technique senior et cheffe de projet produit.
Ton rôle est de m’aider à structurer, planifier et exécuter le cycle de vie d''une tâche dans mon workspace technique.
Stack : Next.js 16 (App Router) • Supabase (Postgres, RLS, Realtime) • Tailwind CSS • TypeScript Strict.
Workflow :
1. Recherche/PRD (Perplexity) -> 2. Architecture -> 3. Génération (Gemini/Codex) -> 4. Revue globale (Claude Code) -> 5. Tests/QA -> 6. GitHub PR -> 7. Déploiement CI/CD.
Règles : Zéro any TypeScript, gestion gracieuse des erreurs, design tokens Minerva (#FAFAFA / #09090B, accent #059669).

# ── 2. SÉQUENCE TERMINAL D’INGÉNIERIE GIT & CI ──
# Synchronisation & Nouvelle Branche
git checkout main && git pull origin main
git checkout -b feat/[nom-fonctionnalite]

# Développement & Vérification Qualité Stricte
npm run dev
npx tsc --noEmit

# Commit Conventionnel & Publication
git add .
git commit -m "feat([scope]): [description claire et concise]"
git push -u origin feat/[nom-fonctionnalite]

# Création de la Pull Request avec GitHub CLI
gh pr create --title "feat([scope]): [titre]" --body "### Contexte\n...\n### Modifications\n...\n### Validation\n- [x] npx tsc --noEmit (0 erreur)\n- [x] Audit QA validé"'
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_sops
  WHERE title = 'SOP-TECH-07 — Workflow d’Équipe Multi-IA & Standard d’Ingénierie GitHub'
);


-- ── 15. Télémétrie & Logs Notion AI ─────────────────────────────────────────
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

ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can insert AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can insert AI logs"
    ON public.ai_generation_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Members can view own AI logs" ON public.ai_generation_logs;
CREATE POLICY "Members can view own AI logs"
    ON public.ai_generation_logs
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- ── 16. Realtime Publication pour Synchronisation Instantanée ───────────────
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_chat_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_presence;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.proposals;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 17. Tables du Module de Booking In-App & Hybride ───────────────────────
CREATE TABLE IF NOT EXISTS public.member_availabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL DEFAULT '09:00',
    end_time TEXT NOT NULL DEFAULT '17:00',
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    buffer_minutes INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_availabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Availabilities read public" ON public.member_availabilities;
CREATE POLICY "Availabilities read public" ON public.member_availabilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Availabilities write member" ON public.member_availabilities;
CREATE POLICY "Availabilities write member" ON public.member_availabilities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    host_name TEXT,
    host_email TEXT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    guest_company TEXT,
    meeting_type TEXT NOT NULL DEFAULT 'internal_sync',
    meeting_title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    notes TEXT,
    location_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings read host or guest" ON public.bookings;
CREATE POLICY "Bookings read host or guest" ON public.bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Bookings insert public" ON public.bookings;
CREATE POLICY "Bookings insert public" ON public.bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Bookings update host" ON public.bookings;
CREATE POLICY "Bookings update host" ON public.bookings FOR UPDATE TO authenticated USING (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── 18. Table du Changelog In-App & Annonce Officielle v2.18.0 ─────────────────
CREATE TABLE IF NOT EXISTS public.changelog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    category TEXT DEFAULT 'fonctionnalite',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    image_url TEXT,
    version TEXT,
    included_items TEXT[] NOT NULL DEFAULT '{}'::text[],
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "changelog_entries_select" ON public.changelog_entries;
CREATE POLICY "changelog_entries_select" ON public.changelog_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "changelog_entries_manage" ON public.changelog_entries;
CREATE POLICY "changelog_entries_manage" ON public.changelog_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.changelog_entries;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

INSERT INTO public.changelog_entries (title, description, body, version, included_items)
SELECT
    'Refonte Intégrale Minerva Trequartista — Booking In-App, Rôles & Rémunérations, Clients & MRR, Devis Réels (v2.18.0)',
    'Mise en production majeure de la version v2.18.0 : nouveau module de booking, fiches de postes et grilles de rémunérations RevOps, refonte clients et MRR mobile-first, 4 offres de devis réels et purge définitive de la marque « Minerva OS ».',
    'Mise en production majeure de la version v2.18.0 de l''ERP Minerva Trequartista : nouveau module de réservation hybride interne et public (/booking et /book/[id]), fiches de postes et modèle de rémunération avec simulateur de commissions RevOps (/team/roles), refonte de la page Clients & MRR avec design mobile en cartes tactiles, 4 modèles de devis d''agence réels avec clauses juridiques québécoises standardisées (/proposals), découplage de l''acquisition en campagnes Ads payantes (/acquisition/ads) et croissance SEO organique (/acquisition/organic), cockpit exécutif Managing sur /overview, assainissement de la charge d''équipe et du classement, et purge intégrale de la marque « Minerva OS » au profit du trio officiel (Minerva Reach, Minerva Flow, Minerva Trequartista).',
    '2.18.0',
    ARRAY[
        'Module de Booking In-App Hybride (/booking & /book/[id]) : Gestion des disponibilités hebdomadaires, planification de réunions d’équipe et lien public de prise de rendez-vous client avec sélection de créneaux sans collision et lien Google Meet.',
        'Fiches de Postes & Rémunérations (/team/roles) : Fiches de missions des 4 départements officiels (Ventes, Création Vidéo, Tech & Systèmes, Opérations & Managing), rituels quotidiens/hebdomadaires et simulateur interactif de commissions RevOps (10% setup, 5% MRR récurrent, multiplicateur quota x1.25).',
        'Refonte Clients & MRR (/clients) : Design moderne conforme aux tokens Minerva (#FAFAFA / #09090B / #059669), ventilation du MRR et affichage adaptatif en cartes tactiles sur mobile sans débordement horizontal.',
        'Propositions & Devis Réels (/proposals) : 4 offres d’agence complètes (Pack Flow & 8 Reels, Site Framer & Ads, E-Commerce & Agent IA, Retainer Élite 360) avec clauses juridiques québécoises et acompte 50% Stripe.',
        'Acquisition Découplée (/acquisition/ads & /acquisition/organic) : Cockpits séparés pour les campagnes payantes (Meta, Google, TikTok, CPL, ROAS) et la croissance naturelle (SEO local Google Maps, portée vidéo, outbound).',
        'Cockpit Exécutif Managing (/overview) : Vue dédiée pour le workspace managing centrée sur la gouvernance, l’équilibrage de charge, la rétention client (94.2%) et la santé globale de l’agence (96%).',
        'Assainissement Opérationnel & Purge « Minerva OS » : Réparation de la charge de travail (/team/workload), affichage continu de 100% des profils au leaderboard (/classement), split responsive du chat d’équipe (/chat) et cloisonnement des SOPs dans l’Académie (/academy).'
    ]
WHERE NOT EXISTS (
    SELECT 1 FROM public.changelog_entries WHERE version = '2.18.0'
);

INSERT INTO public.team_chat_messages (channel_type, channel_id, sender_id, body)
SELECT
    'topic',
    '00000000-0000-0000-0000-000000000002',
    NULL,
    '🚀 **Mise en production : Minerva Trequartista v2.18.0**' || E'\n\n' ||
    'L''ERP central de l''agence fait un bond en avant avec 4 chantiers majeurs pour booster votre productivité quotidienne :' || E'\n\n' ||
    '1. 📅 **Module de Booking Hybride (/booking & /book/...)** : Définissez vos disponibilités et partagez votre lien public pour permettre aux prospects et clients de réserver un créneau directement avec confirmation Google Meet.' || E'\n' ||
    '2. 💼 **Fiches de Postes & Rémunérations (/team/roles)** : Transparence totale sur les 4 départements officiels, rituels d''équipe et simulateur interactif de commissions RevOps (10% setup, 5% MRR récurrent, multiplicateur quota x1.25).' || E'\n' ||
    '3. 👥 **Clients & MRR Mobile-First (/clients)** : Suivi ventilé des revenus récurrents et affichage adapté en cartes tactiles sur mobile, avec 4 nouveaux modèles de devis d''agence réels (/proposals).' || E'\n' ||
    '4. ⚡ **Assainissement Opérationnel & Cloisonnement** : Réparation de la charge de travail (/team/workload), leaderboard permanent (/classement), chat responsive et cloisonnement ciblé des SOPs dans l''Académie (/academy).' || E'\n\n' ||
    '👉 Tous les détails sont disponibles dans le changelog complet : /changelog'
WHERE NOT EXISTS (
    SELECT 1 FROM public.team_chat_messages
    WHERE channel_id = '00000000-0000-0000-0000-000000000002'
    AND body LIKE '%v2.18.0%'
);

-- ============================================================================
-- FIN DU MASTER SCRIPT CONSOLIDÉ (v2.18.0)
-- ============================================================================
