-- ============================================================================
-- MINERVA TREQUARTISTA — MASTER DÉPLOIEMENT PRODUCTION CONSOLIDÉ (v2.17.0)
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
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(digest(NEW.email, 'sha256'), 'hex')),
        CASE WHEN NEW.email = 'kbelceus776@gmail.com' THEN 'admin' ELSE 'member' END
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
    ADD COLUMN IF NOT EXISTS portal_access_token TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

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
CREATE POLICY "Acces leads membres" ON public.leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
    ADD COLUMN IF NOT EXISTS author TEXT DEFAULT 'Kael Belceus';

ALTER TABLE public.academy_sops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acces academy membres" ON public.academy_sops;
CREATE POLICY "Acces academy membres" ON public.academy_sops
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
