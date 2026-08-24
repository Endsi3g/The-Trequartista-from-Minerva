-- ============================================================================
-- MINERVA TREQUARTISTA — SCHÉMA CONSOLIDÉ (v2)
-- Généré le 2026-08-21 en fusionnant, dans l'ordre, le schéma de base
-- (20260820000000_consolidated_schema.sql, lui-même une fusion antérieure
-- de 55 migrations incrémentales) avec les 15 migrations ajoutées depuis
-- (20260821000000 à 20260821000015). Remplace tous les fichiers
-- individuels dans supabase/migrations/ -- un seul fichier, comme demandé.
--
-- Idempotent de bout en bout (IF NOT EXISTS / DROP POLICY IF EXISTS /
-- INSERT ... WHERE NOT EXISTS / vérifications information_schema) --
-- sûr à réexécuter même si tout ou partie a déjà été appliqué.
--
-- 20260821000011_grant_admin_kbelceus776.sql (la version défectueuse du
-- grant admin, qui matchait sur profiles.email) est omise -- remplacée
-- par la version robuste (jointure sur auth.users.id) incluse ici, à la
-- toute fin du fichier.
--
-- Ce fichier N'A PAS besoin d'être réexécuté si supabase/
-- deploy_production_complete.sql (qui couvre exactement le même contenu,
-- moins le schéma de base déjà confirmé live) a déjà été appliqué avec
-- succès -- toutes les sections sont des no-ops dans ce cas.
-- ============================================================================


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260820000000_consolidated_schema.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- MINERVA TREQUARTISTA - CONSOLIDATED IDEMPOTENT DATABASE MIGRATION
-- Single unified migration script replacing all prior migrations.
-- Safe to execute on both fresh and existing database environments.
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.client_id_for(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id FROM public.profiles
        WHERE id = user_id AND role = 'client'
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.member_can(user_id UUID, perm TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.app_permissions
        WHERE profile_id = user_id AND permission = perm AND enabled = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CORE TABLES & COLUMNS
-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'client')),
    department TEXT,
    client_id UUID,
    username TEXT UNIQUE,
    bio TEXT,
    location TEXT,
    website TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    skills TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS full_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS github_url TEXT,
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
    ADD COLUMN IF NOT EXISTS twitter_url TEXT,
    ADD COLUMN IF NOT EXISTS skills TEXT[],
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: app_permissions
CREATE TABLE IF NOT EXISTS public.app_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_permissions
    ADD COLUMN IF NOT EXISTS profile_id UUID,
    ADD COLUMN IF NOT EXISTS permission TEXT,
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: role_hourly_rates
CREATE TABLE IF NOT EXISTS public.role_hourly_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL UNIQUE,
    hourly_rate_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.role_hourly_rates
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS hourly_rate_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: allowed_emails
CREATE TABLE IF NOT EXISTS public.allowed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'client')),
    notes TEXT,
    auto_approve BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.allowed_emails
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: user_api_keys
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

ALTER TABLE public.user_api_keys
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS key_name TEXT,
    ADD COLUMN IF NOT EXISTS api_key_hash TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Table: notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    task_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    lead_activity_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    chat_mentions_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    new_leads_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    tips_tutorials_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_preferences
    ADD COLUMN IF NOT EXISTS profile_id UUID,
    ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS task_reminders_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS lead_activity_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS chat_mentions_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS new_leads_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tips_tutorials_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused', 'lead')),
    plan TEXT DEFAULT 'Standard',
    mrred_cad NUMERIC(10,2) DEFAULT 0.00,
    mrr_cad NUMERIC(10,2) DEFAULT 0.00,
    arr_cad NUMERIC(10,2) DEFAULT 0.00,
    health_score INT DEFAULT 100,
    notes TEXT,
    portal_token TEXT UNIQUE,
    portal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    logo_url TEXT,
    primary_contact_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Standard',
    ADD COLUMN IF NOT EXISTS mrred_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS mrr_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS arr_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS health_score INT DEFAULT 100,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS portal_token TEXT,
    ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: client_invites
CREATE TABLE IF NOT EXISTS public.client_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_invites
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS token TEXT,
    ADD COLUMN IF NOT EXISTS invited_by UUID,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: client_roi_metrics
CREATE TABLE IF NOT EXISTS public.client_roi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    revenue_generated_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ad_spend_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    leads_generated INT NOT NULL DEFAULT 0,
    conversions INT NOT NULL DEFAULT 0,
    roi_percentage NUMERIC(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_roi_metrics
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS month DATE,
    ADD COLUMN IF NOT EXISTS revenue_generated_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS ad_spend_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS leads_generated INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS conversions INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS roi_percentage NUMERIC(5,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: client_payment_links
CREATE TABLE IF NOT EXISTS public.client_payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    stripe_payment_link_id TEXT NOT NULL UNIQUE,
    stripe_price_id TEXT,
    url TEXT NOT NULL,
    amount_cad NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'CAD',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_payment_links
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
    ADD COLUMN IF NOT EXISTS url TEXT,
    ADD COLUMN IF NOT EXISTS amount_cad NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
    start_date DATE,
    target_end_date DATE,
    budget_cad NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS target_end_date DATE,
    ADD COLUMN IF NOT EXISTS budget_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: project_launch_checks
CREATE TABLE IF NOT EXISTS public.project_launch_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_launch_checks
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS completed_by UUID,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: project_milestones
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_milestones
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    service_requested TEXT,
    estimated_value_cad NUMERIC(10,2) DEFAULT 0.00,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
    status TEXT DEFAULT 'open',
    probability_pct INT DEFAULT 20,
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    converted_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS service_requested TEXT,
    ADD COLUMN IF NOT EXISTS estimated_value_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS probability_pct INT DEFAULT 20,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to UUID,
    ADD COLUMN IF NOT EXISTS converted_client_id UUID,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: intake_leads
CREATE TABLE IF NOT EXISTS public.intake_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    website TEXT,
    source TEXT DEFAULT 'framer_form',
    status TEXT NOT NULL DEFAULT 'captured' CHECK (status IN ('captured', 'sms_sent', 'audit_in_progress', 'proposal_sent', 'call_booked', 'converted', 'disqualified')),
    crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.intake_leads
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'framer_form',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'captured',
    ADD COLUMN IF NOT EXISTS crm_lead_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: audits
CREATE TABLE IF NOT EXISTS public.audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'archived')),
    share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    audio_url TEXT,
    transcript TEXT,
    summary TEXT,
    overall_health_score INT DEFAULT 0 CHECK (overall_health_score BETWEEN 0 AND 100),
    total_monthly_waste_cad NUMERIC(10,2) DEFAULT 0.00,
    total_annual_waste_cad NUMERIC(10,2) DEFAULT 0.00,
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audits
    ADD COLUMN IF NOT EXISTS intake_lead_id UUID,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS crm_lead_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS share_token TEXT,
    ADD COLUMN IF NOT EXISTS audio_url TEXT,
    ADD COLUMN IF NOT EXISTS transcript TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS overall_health_score INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_monthly_waste_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_annual_waste_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS audit_date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: audit_process_steps
CREATE TABLE IF NOT EXISTS public.audit_process_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    name TEXT NOT NULL,
    tool TEXT,
    time_spent TEXT,
    is_bottleneck BOOLEAN DEFAULT FALSE,
    description TEXT,
    sort_order INT DEFAULT 0
);

ALTER TABLE public.audit_process_steps
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS step_number INT,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS tool TEXT,
    ADD COLUMN IF NOT EXISTS time_spent TEXT,
    ADD COLUMN IF NOT EXISTS is_bottleneck BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Table: audit_cost_items
CREATE TABLE IF NOT EXISTS public.audit_cost_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_hidden BOOLEAN DEFAULT FALSE,
    explanation TEXT,
    sort_order INT DEFAULT 0
);

ALTER TABLE public.audit_cost_items
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS label TEXT,
    ADD COLUMN IF NOT EXISTS amount_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS explanation TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Table: audit_tool_findings
CREATE TABLE IF NOT EXISTS public.audit_tool_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('keep', 'replace', 'consolidate', 'remove')),
    monthly_cost_cad NUMERIC(10,2) DEFAULT 0.00,
    recommendation TEXT,
    sort_order INT DEFAULT 0
);

ALTER TABLE public.audit_tool_findings
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS tool_name TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS monthly_cost_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS recommendation TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Table: audit_initiatives
CREATE TABLE IF NOT EXISTS public.audit_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('Fondations', 'Croissance', 'Scale')),
    impact TEXT CHECK (impact IN ('Élevé', 'Moyen', 'Faible')),
    effort TEXT CHECK (effort IN ('Élevé', 'Moyen', 'Faible')),
    timeframe TEXT,
    monthly_impact_cad NUMERIC(10,2) DEFAULT 0.00,
    implementation_cost_cad NUMERIC(10,2) DEFAULT 0.00,
    description TEXT,
    is_recommended BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

ALTER TABLE public.audit_initiatives
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS tier TEXT,
    ADD COLUMN IF NOT EXISTS impact TEXT,
    ADD COLUMN IF NOT EXISTS effort TEXT,
    ADD COLUMN IF NOT EXISTS timeframe TEXT,
    ADD COLUMN IF NOT EXISTS monthly_impact_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS implementation_cost_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_recommended BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Table: audit_initiative_reactions
CREATE TABLE IF NOT EXISTS public.audit_initiative_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiative_id UUID NOT NULL REFERENCES public.audit_initiatives(id) ON DELETE CASCADE,
    visitor_name TEXT,
    reaction TEXT NOT NULL CHECK (reaction IN ('approve', 'question', 'reject')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_initiative_reactions
    ADD COLUMN IF NOT EXISTS initiative_id UUID,
    ADD COLUMN IF NOT EXISTS visitor_name TEXT,
    ADD COLUMN IF NOT EXISTS reaction TEXT,
    ADD COLUMN IF NOT EXISTS comment TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: audit_comments
CREATE TABLE IF NOT EXISTS public.audit_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_role TEXT DEFAULT 'client',
    content TEXT NOT NULL,
    section_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_comments
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS author_name TEXT,
    ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'client',
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS section_ref TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: proposals
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
    intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined')),
    sent_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    total_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    total_monthly_cad NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposals
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS intake_lead_id UUID,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS total_setup_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS total_monthly_cad NUMERIC(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: tool_compatibility_dictionary
CREATE TABLE IF NOT EXISTS public.tool_compatibility_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_name TEXT NOT NULL UNIQUE,
    category TEXT,
    native_flow_support BOOLEAN DEFAULT TRUE,
    tier TEXT CHECK (tier IN ('native', 'webhook', 'custom', 'unsupported')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tool_compatibility_dictionary
    ADD COLUMN IF NOT EXISTS tool_name TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS native_flow_support BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tier TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: voice_calls
CREATE TABLE IF NOT EXISTS public.voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
    twilio_call_sid TEXT UNIQUE,
    from_number TEXT,
    to_number TEXT,
    duration_seconds INT,
    recording_url TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voice_calls
    ADD COLUMN IF NOT EXISTS audit_id UUID,
    ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT,
    ADD COLUMN IF NOT EXISTS from_number TEXT,
    ADD COLUMN IF NOT EXISTS to_number TEXT,
    ADD COLUMN IF NOT EXISTS duration_seconds INT,
    ADD COLUMN IF NOT EXISTS recording_url TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: alerts
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    target_role TEXT CHECK (target_role IN ('admin', 'member', 'client', 'all')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alerts
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'info',
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS target_role TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE,
    estimated_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS lead_id UUID,
    ADD COLUMN IF NOT EXISTS assigned_to UUID,
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo',
    ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS due_date DATE,
    ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: task_comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.task_comments
    ADD COLUMN IF NOT EXISTS task_id UUID,
    ADD COLUMN IF NOT EXISTS author_id UUID,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: task_subitems
CREATE TABLE IF NOT EXISTS public.task_subitems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.task_subitems
    ADD COLUMN IF NOT EXISTS task_id UUID,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS done BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: time_entries
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    billable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.time_entries
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS task_id UUID,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
    ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: team_performance_reviews
CREATE TABLE IF NOT EXISTS public.team_performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    period TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    strengths TEXT,
    areas_for_growth TEXT,
    goals TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_performance_reviews
    ADD COLUMN IF NOT EXISTS profile_id UUID,
    ADD COLUMN IF NOT EXISTS reviewer_id UUID,
    ADD COLUMN IF NOT EXISTS period TEXT,
    ADD COLUMN IF NOT EXISTS rating INT,
    ADD COLUMN IF NOT EXISTS strengths TEXT,
    ADD COLUMN IF NOT EXISTS areas_for_growth TEXT,
    ADD COLUMN IF NOT EXISTS goals TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: academy_sops
CREATE TABLE IF NOT EXISTS public.academy_sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    video_url TEXT,
    pdf_url TEXT,
    notion_url TEXT,
    content_markdown TEXT,
    estimated_minutes INT DEFAULT 15,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.academy_sops
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS notion_url TEXT,
    ADD COLUMN IF NOT EXISTS content_markdown TEXT,
    ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 15,
    ADD COLUMN IF NOT EXISTS author_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: sop_completions
CREATE TABLE IF NOT EXISTS public.sop_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id UUID NOT NULL REFERENCES public.academy_sops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sop_completions
    ADD COLUMN IF NOT EXISTS sop_id UUID,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Table: content_posts
CREATE TABLE IF NOT EXISTS public.content_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    copy TEXT,
    caption TEXT,
    platform TEXT NOT NULL DEFAULT 'instagram',
    format TEXT DEFAULT 'reel',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'scheduled', 'published', 'archived', 'in_review', 'approved')),
    scheduled_for TIMESTAMPTZ,
    media_urls TEXT[],
    video_url TEXT,
    thumbnail_url TEXT,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.content_posts
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS copy TEXT,
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'instagram',
    ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'reel',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS media_urls TEXT[],
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS author_id UUID,
    ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: notion_config
CREATE TABLE IF NOT EXISTS public.notion_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id TEXT,
    workspace_name TEXT,
    access_token TEXT NOT NULL,
    bot_id TEXT,
    database_mappings JSONB DEFAULT '{}'::jsonb,
    is_connected BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notion_config
    ADD COLUMN IF NOT EXISTS workspace_id TEXT,
    ADD COLUMN IF NOT EXISTS workspace_name TEXT,
    ADD COLUMN IF NOT EXISTS access_token TEXT,
    ADD COLUMN IF NOT EXISTS bot_id TEXT,
    ADD COLUMN IF NOT EXISTS database_mappings JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: user_feedbacks
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'bug' CHECK (category IN ('bug', 'feature', 'improvement', 'other')),
    message TEXT NOT NULL,
    page_url TEXT,
    screen_resolution TEXT,
    browser_info TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_feedbacks
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'bug',
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS page_url TEXT,
    ADD COLUMN IF NOT EXISTS screen_resolution TEXT,
    ADD COLUMN IF NOT EXISTS browser_info TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS action TEXT,
    ADD COLUMN IF NOT EXISTS table_name TEXT,
    ADD COLUMN IF NOT EXISTS record_id UUID,
    ADD COLUMN IF NOT EXISTS old_data JSONB,
    ADD COLUMN IF NOT EXISTS new_data JSONB,
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: client_messages
CREATE TABLE IF NOT EXISTS public.client_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments TEXT[],
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.client_messages
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS sender_id UUID,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS attachments TEXT[],
    ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS endpoint TEXT,
    ADD COLUMN IF NOT EXISTS p256dh TEXT,
    ADD COLUMN IF NOT EXISTS auth TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: team_invites
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    department TEXT,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    max_uses INT NOT NULL DEFAULT 1,
    uses_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_invites
    ADD COLUMN IF NOT EXISTS token TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member',
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS invited_by UUID,
    ADD COLUMN IF NOT EXISTS max_uses INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS uses_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: changelog_entries
CREATE TABLE IF NOT EXISTS public.changelog_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.changelog_entries
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS author_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: minerva_roadmap_items
CREATE TABLE IF NOT EXISTS public.minerva_roadmap_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    product TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'Milestone' CHECK (item_type IN ('Milestone', 'Launch', 'Experiment', 'Enhancement')),
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'blocked')),
    target_quarter TEXT,
    description TEXT,
    notion_id TEXT UNIQUE,
    notion_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.minerva_roadmap_items
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS product TEXT,
    ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'Milestone',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned',
    ADD COLUMN IF NOT EXISTS target_quarter TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS notion_id TEXT,
    ADD COLUMN IF NOT EXISTS notion_url TEXT,
    ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: minerva_content_categories
CREATE TABLE IF NOT EXISTS public.minerva_content_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.minerva_content_categories
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: minerva_content_items
CREATE TABLE IF NOT EXISTS public.minerva_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category_id UUID REFERENCES public.minerva_content_categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Recording', 'Editing', 'Published', 'Archived')),
    video_url TEXT,
    notion_id TEXT UNIQUE,
    notion_url TEXT,
    platform TEXT,
    format TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.minerva_content_items
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS category_id UUID,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft',
    ADD COLUMN IF NOT EXISTS video_url TEXT,
    ADD COLUMN IF NOT EXISTS notion_id TEXT,
    ADD COLUMN IF NOT EXISTS notion_url TEXT,
    ADD COLUMN IF NOT EXISTS platform TEXT,
    ADD COLUMN IF NOT EXISTS format TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: opus_clip_jobs
CREATE TABLE IF NOT EXISTS public.opus_clip_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content_item_id UUID REFERENCES public.minerva_content_items(id) ON DELETE SET NULL,
    source_video_url TEXT NOT NULL,
    title TEXT NOT NULL,
    opus_job_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    clips_result JSONB DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.opus_clip_jobs
    ADD COLUMN IF NOT EXISTS source_content_item_id UUID,
    ADD COLUMN IF NOT EXISTS source_video_url TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS opus_job_id TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS clips_result JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'Document sans titre',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Document sans titre',
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS client_id UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: yjs_documents
CREATE TABLE IF NOT EXISTS public.yjs_documents (
    id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
    data BYTEA,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.yjs_documents
    ADD COLUMN IF NOT EXISTS data BYTEA,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Table: team_chat_messages
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_type TEXT,
    channel_id UUID,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT,
    content TEXT,
    attachment_url TEXT,
    attachment_type TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS channel_type TEXT,
    ADD COLUMN IF NOT EXISTS channel_id UUID,
    ADD COLUMN IF NOT EXISTS sender_id UUID,
    ADD COLUMN IF NOT EXISTS body TEXT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS attachment_url TEXT,
    ADD COLUMN IF NOT EXISTS attachment_type TEXT,
    ADD COLUMN IF NOT EXISTS attachment_name TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Table: team_chat_dm_channels
CREATE TABLE IF NOT EXISTS public.team_chat_dm_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.team_chat_dm_channels
    ADD COLUMN IF NOT EXISTS user_a UUID,
    ADD COLUMN IF NOT EXISTS user_b UUID,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- Special table tweaks
ALTER TABLE public.team_chat_messages ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check CHECK (channel_type IN ('project', 'client', 'dm'));

ALTER TABLE public.content_posts DROP CONSTRAINT IF EXISTS content_posts_format_check;
ALTER TABLE public.team_performance_reviews DROP CONSTRAINT IF EXISTS team_performance_reviews_profile_id_key;
ALTER TABLE public.team_performance_reviews ADD CONSTRAINT team_performance_reviews_profile_id_key UNIQUE (profile_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_client_id_fkey'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. ADDITIONAL FUNCTIONS & TRIGGERS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    email_domain TEXT;
    matched_role TEXT := 'member';
    is_auto_approved BOOLEAN := FALSE;
    matched_client_id UUID := NULL;
    invite_rec RECORD;
BEGIN
    email_domain := split_part(NEW.email, '@', 2);

    SELECT * INTO invite_rec FROM public.client_invites
    WHERE email = NEW.email AND used_at IS NULL AND expires_at > NOW()
    LIMIT 1;

    IF invite_rec.id IS NOT NULL THEN
        matched_role := 'client';
        matched_client_id := invite_rec.client_id;
        UPDATE public.client_invites SET used_at = NOW() WHERE id = invite_rec.id;
    ELSE
        SELECT role, auto_approve INTO matched_role, is_auto_approved
        FROM public.allowed_emails
        WHERE lower(email) = lower(NEW.email) OR (starts_with(email, '@') AND lower(email_domain) = lower(substring(email from 2)))
        LIMIT 1;

        IF matched_role IS NULL THEN
            IF email_domain IN ('minerva.agency', 'minervaflow.ca', 'flowbyminerva.ca', 'minerva.ca') THEN
                matched_role := 'member';
            ELSE
                matched_role := 'client';
            END IF;
        END IF;
    END IF;

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, client_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        matched_role,
        matched_client_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        client_id = COALESCE(public.profiles.client_id, EXCLUDED.client_id);

    INSERT INTO public.notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.convert_lead_to_client_on_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_client_id UUID;
    existing_client_id UUID;
BEGIN
    IF (NEW.stage = 'won' AND (OLD.stage IS NULL OR OLD.stage <> 'won')) THEN
        IF NEW.converted_client_id IS NOT NULL THEN
            RETURN NEW;
        END IF;

        IF NEW.email IS NOT NULL AND NEW.email <> '' THEN
            SELECT id INTO existing_client_id FROM public.clients WHERE lower(email) = lower(NEW.email) LIMIT 1;
        END IF;

        IF existing_client_id IS NULL THEN
            INSERT INTO public.clients (
                name, company, email, phone, status, mrr_cad, notes, created_at, updated_at
            ) VALUES (
                NEW.company_name,
                NEW.company_name,
                NULLIF(NEW.email, ''),
                NULLIF(NEW.phone, ''),
                'active',
                COALESCE(NEW.estimated_value_cad, 0.00),
                COALESCE(NEW.notes, '') || ' (Converti depuis le prospect CRM #' || NEW.id || ')',
                NOW(),
                NOW()
            ) RETURNING id INTO new_client_id;
        ELSE
            new_client_id := existing_client_id;
            UPDATE public.clients SET
                status = 'active',
                mrr_cad = GREATEST(mrr_cad, COALESCE(NEW.estimated_value_cad, 0.00)),
                updated_at = NOW()
            WHERE id = new_client_id;
        END IF;

        NEW.converted_client_id := new_client_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_won_convert_to_client ON public.leads;
CREATE TRIGGER trg_lead_won_convert_to_client
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.convert_lead_to_client_on_won();

CREATE OR REPLACE FUNCTION public.enforce_content_posts_client_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF public.client_id_for(auth.uid()) IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.client_id := public.client_id_for(auth.uid());
        NEW.author_id := auth.uid();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.client_id := OLD.client_id;
        IF OLD.status <> 'draft' AND NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'Les clients ne peuvent modifier le statut que sur leurs brouillons.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_content_posts_client_columns ON public.content_posts;
CREATE TRIGGER trg_enforce_content_posts_client_columns
    BEFORE INSERT OR UPDATE ON public.content_posts
    FOR EACH ROW EXECUTE FUNCTION public.enforce_content_posts_client_columns();

CREATE OR REPLACE FUNCTION public.track_content_post_status_history()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_entry JSONB;
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
        new_entry := jsonb_build_object(
            'status', NEW.status,
            'changed_at', NOW(),
            'changed_by', auth.uid()
        );
        NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) || new_entry;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_content_post_status_history ON public.content_posts;
CREATE TRIGGER trg_track_content_post_status_history
    BEFORE INSERT OR UPDATE ON public.content_posts
    FOR EACH ROW EXECUTE FUNCTION public.track_content_post_status_history();

CREATE OR REPLACE FUNCTION public.touch_tasks_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.tasks SET updated_at = NOW() WHERE id = NEW.task_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_tasks_updated_at_comments ON public.task_comments;
CREATE TRIGGER trg_touch_tasks_updated_at_comments
    AFTER INSERT OR UPDATE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION public.touch_tasks_updated_at();

DROP TRIGGER IF EXISTS trg_touch_tasks_updated_at_subitems ON public.task_subitems;
CREATE TRIGGER trg_touch_tasks_updated_at_subitems
    AFTER INSERT OR UPDATE ON public.task_subitems
    FOR EACH ROW EXECUTE FUNCTION public.touch_tasks_updated_at();

CREATE OR REPLACE FUNCTION public.bridge_intake_lead_to_crm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    new_crm_lead_id UUID;
    full_contact TEXT;
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('converted', 'proposal_sent', 'call_booked')) THEN
        IF NEW.crm_lead_id IS NOT NULL THEN
            RETURN NEW;
        END IF;

        full_contact := COALESCE(NEW.first_name, 'Prospect');
        INSERT INTO public.leads (
            company_name, contact_name, email, phone, service_requested, stage, notes
        ) VALUES (
            COALESCE(NULLIF(NEW.company, ''), full_contact),
            full_contact,
            NULLIF(NEW.email, ''),
            NEW.phone,
            'Minerva Flow',
            'new',
            'Converti depuis le formulaire marketing intake #' || NEW.id
        ) RETURNING id INTO new_crm_lead_id;

        NEW.crm_lead_id := new_crm_lead_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bridge_intake_lead_to_crm ON public.intake_leads;
CREATE TRIGGER trg_bridge_intake_lead_to_crm
    BEFORE INSERT OR UPDATE ON public.intake_leads
    FOR EACH ROW EXECUTE FUNCTION public.bridge_intake_lead_to_crm();

CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NEW;
END;
$$;

-- Standard updated_at triggers
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'profiles', 'app_permissions', 'role_hourly_rates', 'notification_preferences',
        'clients', 'client_roi_metrics', 'client_payment_links', 'projects', 'project_milestones',
        'leads', 'intake_leads', 'audits', 'proposals', 'tasks', 'time_entries',
        'team_performance_reviews', 'academy_sops', 'content_posts', 'notion_config',
        'push_subscriptions', 'changelog_entries', 'minerva_roadmap_items',
        'minerva_content_items', 'opus_clip_jobs', 'documents', 'team_chat_dm_channels'
    ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t, t);
    END LOOP;
END $$;

-- 5. ENABLE ROW LEVEL SECURITY
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 6. RLS POLICIES

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR id = auth.uid() OR role IN ('admin', 'member') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
    USING (public.is_admin(auth.uid()) OR id = auth.uid())
    WITH CHECK (public.is_admin(auth.uid()) OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()) OR id = auth.uid());

-- App Permissions
DROP POLICY IF EXISTS "app_permissions_select_admin" ON public.app_permissions;
CREATE POLICY "app_permissions_select_admin" ON public.app_permissions FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR profile_id = auth.uid());

DROP POLICY IF EXISTS "app_permissions_all_admin" ON public.app_permissions;
CREATE POLICY "app_permissions_all_admin" ON public.app_permissions FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Role Hourly Rates
DROP POLICY IF EXISTS "role_hourly_rates_admin" ON public.role_hourly_rates;
CREATE POLICY "role_hourly_rates_admin" ON public.role_hourly_rates FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Allowed Emails
DROP POLICY IF EXISTS "allowed_emails_admin" ON public.allowed_emails;
CREATE POLICY "allowed_emails_admin" ON public.allowed_emails FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- User API Keys
DROP POLICY IF EXISTS "user_api_keys_owner" ON public.user_api_keys;
CREATE POLICY "user_api_keys_owner" ON public.user_api_keys FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notification Preferences
DROP POLICY IF EXISTS "notification_preferences_owner" ON public.notification_preferences;
CREATE POLICY "notification_preferences_owner" ON public.notification_preferences FOR ALL TO authenticated
    USING (profile_id = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (profile_id = auth.uid() OR public.is_admin(auth.uid()));

-- Clients
DROP POLICY IF EXISTS "clients_select" ON public.clients;
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients') OR id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "clients_insert_team" ON public.clients;
CREATE POLICY "clients_insert_team" ON public.clients FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'));

DROP POLICY IF EXISTS "clients_update_scoped" ON public.clients;
CREATE POLICY "clients_update_scoped" ON public.clients FOR UPDATE TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'));

DROP POLICY IF EXISTS "clients_delete_admin" ON public.clients;
CREATE POLICY "clients_delete_admin" ON public.clients FOR DELETE TO authenticated
    USING (public.is_admin(auth.uid()));

-- Client Invites
DROP POLICY IF EXISTS "client_invites_admin" ON public.client_invites;
CREATE POLICY "client_invites_admin" ON public.client_invites FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'));

-- Client ROI Metrics
DROP POLICY IF EXISTS "client_roi_metrics_select" ON public.client_roi_metrics;
CREATE POLICY "client_roi_metrics_select" ON public.client_roi_metrics FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_financials') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "client_roi_metrics_manage" ON public.client_roi_metrics;
CREATE POLICY "client_roi_metrics_manage" ON public.client_roi_metrics FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_financials'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_financials'));

-- Client Payment Links
DROP POLICY IF EXISTS "client_payment_links_select_admin" ON public.client_payment_links;
CREATE POLICY "client_payment_links_select_admin" ON public.client_payment_links FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_financials') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "client_payment_links_manage_admin" ON public.client_payment_links;
CREATE POLICY "client_payment_links_manage_admin" ON public.client_payment_links FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_financials'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_financials'));

-- Projects
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_projects') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "projects_manage" ON public.projects;
CREATE POLICY "projects_manage" ON public.projects FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects'));

-- Project Launch Checks & Milestones
DROP POLICY IF EXISTS "project_checks_team" ON public.project_launch_checks;
CREATE POLICY "project_checks_team" ON public.project_launch_checks FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects'));

DROP POLICY IF EXISTS "project_milestones_team" ON public.project_milestones;
CREATE POLICY "project_milestones_team" ON public.project_milestones FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects') OR project_id IN (SELECT id FROM public.projects WHERE client_id = public.client_id_for(auth.uid())))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_projects'));

-- Leads
DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_leads'));

DROP POLICY IF EXISTS "leads_manage" ON public.leads;
CREATE POLICY "leads_manage" ON public.leads FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_leads'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_leads'));

-- Intake Leads & Audits & Proposals
DROP POLICY IF EXISTS "intake_leads_team" ON public.intake_leads;
CREATE POLICY "intake_leads_team" ON public.intake_leads FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_leads'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_leads'));

DROP POLICY IF EXISTS "audits_team" ON public.audits;
CREATE POLICY "audits_team" ON public.audits FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_clients'));

DROP POLICY IF EXISTS "proposals_team" ON public.proposals;
CREATE POLICY "proposals_team" ON public.proposals FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_financials'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_financials'));

-- Tasks & Task Comments & Subitems
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_tasks') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "tasks_manage" ON public.tasks;
CREATE POLICY "tasks_manage" ON public.tasks FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_tasks'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_tasks'));

DROP POLICY IF EXISTS "task_comments_team" ON public.task_comments;
CREATE POLICY "task_comments_team" ON public.task_comments FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_tasks'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_tasks'));

DROP POLICY IF EXISTS "task_subitems_team" ON public.task_subitems;
CREATE POLICY "task_subitems_team" ON public.task_subitems FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_tasks'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_tasks'));

-- Time Entries
DROP POLICY IF EXISTS "time_entries_select" ON public.time_entries;
CREATE POLICY "time_entries_select" ON public.time_entries FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR user_id = auth.uid() OR public.member_can(auth.uid(), 'view_workload'));

DROP POLICY IF EXISTS "time_entries_manage" ON public.time_entries;
CREATE POLICY "time_entries_manage" ON public.time_entries FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR user_id = auth.uid())
    WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

-- Team Performance Reviews
DROP POLICY IF EXISTS "team_reviews_admin" ON public.team_performance_reviews;
CREATE POLICY "team_reviews_admin" ON public.team_performance_reviews FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR profile_id = auth.uid())
    WITH CHECK (public.is_admin(auth.uid()));

-- Academy SOPs & Completions
DROP POLICY IF EXISTS "academy_sops_select" ON public.academy_sops;
CREATE POLICY "academy_sops_select" ON public.academy_sops FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "academy_sops_manage" ON public.academy_sops;
CREATE POLICY "academy_sops_manage" ON public.academy_sops FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_academy'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_academy'));

DROP POLICY IF EXISTS "sop_completions_user" ON public.sop_completions;
CREATE POLICY "sop_completions_user" ON public.sop_completions FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Content Posts
DROP POLICY IF EXISTS "content_posts_select" ON public.content_posts;
CREATE POLICY "content_posts_select" ON public.content_posts FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_content') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "content_posts_manage" ON public.content_posts;
CREATE POLICY "content_posts_manage" ON public.content_posts FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_content') OR client_id = public.client_id_for(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_content') OR client_id = public.client_id_for(auth.uid()));

-- Documents & Yjs Documents
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_documents') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "documents_manage" ON public.documents;
CREATE POLICY "documents_manage" ON public.documents FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_documents') OR created_by = auth.uid())
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_documents') OR created_by = auth.uid());

DROP POLICY IF EXISTS "yjs_documents_all" ON public.yjs_documents;
CREATE POLICY "yjs_documents_all" ON public.yjs_documents FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

-- Team Chat Messages & DM Channels
DROP POLICY IF EXISTS "team_chat_select" ON public.team_chat_messages;
CREATE POLICY "team_chat_select" ON public.team_chat_messages FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_chat') OR sender_id = auth.uid());

DROP POLICY IF EXISTS "team_chat_insert" ON public.team_chat_messages;
CREATE POLICY "team_chat_insert" ON public.team_chat_messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "team_chat_dm_channels_all" ON public.team_chat_dm_channels;
CREATE POLICY "team_chat_dm_channels_all" ON public.team_chat_dm_channels FOR ALL TO authenticated
    USING (user_a = auth.uid() OR user_b = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (user_a = auth.uid() OR user_b = auth.uid() OR public.is_admin(auth.uid()));

-- Minerva Roadmap & Content Items
DROP POLICY IF EXISTS "minerva_roadmap_team" ON public.minerva_roadmap_items;
CREATE POLICY "minerva_roadmap_team" ON public.minerva_roadmap_items FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_products'))
    WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "minerva_content_team" ON public.minerva_content_items;
CREATE POLICY "minerva_content_team" ON public.minerva_content_items FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_content'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_content'));

DROP POLICY IF EXISTS "minerva_content_categories_team" ON public.minerva_content_categories;
CREATE POLICY "minerva_content_categories_team" ON public.minerva_content_categories FOR ALL TO authenticated
    USING (TRUE) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "opus_clip_jobs_team" ON public.opus_clip_jobs;
CREATE POLICY "opus_clip_jobs_team" ON public.opus_clip_jobs FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_content'))
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'manage_content'));

-- Client Messages
DROP POLICY IF EXISTS "client_messages_select" ON public.client_messages;
CREATE POLICY "client_messages_select" ON public.client_messages FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients') OR client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "client_messages_insert" ON public.client_messages;
CREATE POLICY "client_messages_insert" ON public.client_messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Push Subscriptions
DROP POLICY IF EXISTS "push_subscriptions_owner" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON public.push_subscriptions FOR ALL TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Team Invites
DROP POLICY IF EXISTS "team_invites_admin" ON public.team_invites;
CREATE POLICY "team_invites_admin" ON public.team_invites FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Changelog Entries
DROP POLICY IF EXISTS "changelog_entries_select" ON public.changelog_entries;
CREATE POLICY "changelog_entries_select" ON public.changelog_entries FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "changelog_entries_manage" ON public.changelog_entries;
CREATE POLICY "changelog_entries_manage" ON public.changelog_entries FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- User Feedbacks & Audit Logs & Notion Config
DROP POLICY IF EXISTS "user_feedbacks_user" ON public.user_feedbacks;
CREATE POLICY "user_feedbacks_user" ON public.user_feedbacks FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_admin" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "notion_config_admin" ON public.notion_config;
CREATE POLICY "notion_config_admin" ON public.notion_config FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 7. STORAGE BUCKETS & STORAGE POLICIES
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('client-assets', 'client-assets', true),
    ('team-documents', 'team-documents', true),
    ('academy-media', 'academy-media', true),
    ('proposals', 'proposals', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "public_read_client_assets" ON storage.objects;
CREATE POLICY "public_read_client_assets" ON storage.objects FOR SELECT USING (bucket_id = 'client-assets');

DROP POLICY IF EXISTS "public_read_team_documents" ON storage.objects;
CREATE POLICY "public_read_team_documents" ON storage.objects FOR SELECT USING (bucket_id = 'team-documents');

DROP POLICY IF EXISTS "public_read_academy_media" ON storage.objects;
CREATE POLICY "public_read_academy_media" ON storage.objects FOR SELECT USING (bucket_id = 'academy-media');

DROP POLICY IF EXISTS "team_upload_client_assets" ON storage.objects;
CREATE POLICY "team_upload_client_assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-assets');

DROP POLICY IF EXISTS "team_upload_team_documents" ON storage.objects;
CREATE POLICY "team_upload_team_documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-documents');

DROP POLICY IF EXISTS "team_upload_academy_media" ON storage.objects;
CREATE POLICY "team_upload_academy_media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'academy-media');

DROP POLICY IF EXISTS "team_upload_proposals" ON storage.objects;
CREATE POLICY "team_upload_proposals" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proposals');

DROP POLICY IF EXISTS "team_read_proposals" ON storage.objects;
CREATE POLICY "team_read_proposals" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'proposals');

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_client_id_idx ON public.profiles(client_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON public.clients(status);
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON public.projects(status);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_client_id_idx ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS tasks_lead_id_idx ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS content_posts_client_id_idx ON public.content_posts(client_id);
CREATE INDEX IF NOT EXISTS content_posts_status_idx ON public.content_posts(status);
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON public.time_entries(date);
CREATE INDEX IF NOT EXISTS audits_share_token_idx ON public.audits(share_token);
CREATE INDEX IF NOT EXISTS audits_status_idx ON public.audits(status);
CREATE INDEX IF NOT EXISTS documents_project_id_idx ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS documents_client_id_idx ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS team_chat_messages_channel_idx ON public.team_chat_messages(channel_type, channel_id);

-- 9. SEED DATA & DEFAULTS
INSERT INTO public.allowed_emails (email, role, notes, auto_approve)
VALUES 
    ('kbelceus776@gmail.com', 'admin', 'Compte administrateur fondateur', true),
    ('theminervabrand@gmail.com', 'admin', 'Compte administrateur Minerva', true),
    ('@minerva.agency', 'member', 'Domaine interne Minerva', true),
    ('@minervaflow.ca', 'member', 'Domaine Minerva Flow', true),
    ('@flowbyminerva.ca', 'member', 'Domaine Flow par Minerva', true),
    ('@minerva.ca', 'member', 'Domaine principal Minerva', true)
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, auto_approve = EXCLUDED.auto_approve;

UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) IN ('kbelceus776@gmail.com', 'theminervabrand@gmail.com')
   OR id IN (SELECT id FROM auth.users WHERE lower(email) IN ('kbelceus776@gmail.com', 'theminervabrand@gmail.com'));

-- Seed Minerva Flow Roadmap Items
INSERT INTO public.minerva_roadmap_items (id, title, product, item_type, status, target_quarter, description, sort_order)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Pilote 90 jours : Tests terrain restos & cafés, feedback réel et ajustements', 'Minerva Flow', 'Milestone', 'in_progress', 'Q3 2026', 'Phase d embarquement 3 à 5 restaurants pilotes avec offre 0$ 90 jours', 1),
    ('a0000000-0000-0000-0000-000000000002', 'Consolidation : Stabilisation du produit, fonctions clés & valeur commerciale', 'Minerva Flow', 'Launch', 'planned', 'Q4 2026', 'Stabilisation de l expérience et renforcement des fonctions à haute valeur', 2),
    ('a0000000-0000-0000-0000-000000000003', 'Référence Niche : Expansion produit viral autonome & solution stratégique', 'Minerva Flow', 'Experiment', 'planned', 'Q3 2027', 'Positionnement comme produit référence avec bouche-à-oreille et preuve sociale', 3)
ON CONFLICT (id) DO NOTHING;

-- Seed Minerva Flow Document
INSERT INTO public.documents (id, title)
VALUES ('b0000000-0000-0000-0000-000000000001', 'Minerva Flow — Dossier Produit, Vision & Offre Pilote')
ON CONFLICT (id) DO NOTHING;

-- 10. REALTIME PUBLICATION SETUP
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'profiles', 'client_messages', 'team_chat_messages', 'documents', 'audit_logs', 'tasks', 'content_posts'
    ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = t
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
        END IF;
    END LOOP;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000000_schema_drift_fixes.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- SCHEMA DRIFT FIXES
-- Two pre-existing mismatches between application code and the live schema:
--   1. voice_calls is missing columns the ElevenLabs webhook and VoiceCall
--      type already read/write (insert has been silently failing).
--   2. app_permissions has no uniqueness guarantee, needed so the
--      Paramètres > Permissions page can upsert one row per member profile
--      per permission (the page's "toggle applies to all members" semantics
--      require fan-out writes, not a single global row).
-- Idempotent — safe to run on both fresh and existing databases.
-- ============================================================================

ALTER TABLE public.voice_calls
    ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT,
    ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'inbound',
    ADD COLUMN IF NOT EXISTS caller_name TEXT,
    ADD COLUMN IF NOT EXISTS caller_phone TEXT,
    ADD COLUMN IF NOT EXISTS transcript JSONB,
    ADD COLUMN IF NOT EXISTS outcome TEXT,
    ADD COLUMN IF NOT EXISTS intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL;

-- Live app_permissions has been confirmed NOT to have a profile_id column
-- (2026-08-21 deploy error: "column \"profile_id\" named in key does not
-- exist") despite the consolidated schema file declaring one -- another
-- instance of that file not reliably reflecting live reality for
-- pre-existing tables. Guarded on column existence too, not just the
-- constraint name, so this silently no-ops instead of aborting the whole
-- deploy script until the real column name is confirmed and this is
-- corrected in a follow-up migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'app_permissions' AND column_name = 'profile_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'app_permissions_profile_permission_key'
    ) THEN
        ALTER TABLE public.app_permissions
            ADD CONSTRAINT app_permissions_profile_permission_key UNIQUE (profile_id, permission);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000001_intake_leads_qualification_columns.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- INTAKE_LEADS QUALIFICATION SCHEMA DRIFT FIX
-- The consolidated migration's intake_leads.status CHECK constraint
-- ('captured','sms_sent','audit_in_progress','proposal_sent','call_booked',
-- 'converted','disqualified') never matched what the application actually
-- reads/writes -- app/api/leads/step-1/route.ts, step-2/route.ts, and
-- sms-followup-callback/route.ts (plus the IntakeLead type in
-- lib/types/index.ts) all use 'step1_abandoned' | 'qualified' | 'converted'
-- | 'discarded', and four columns they depend on (qualification_data,
-- sms_follow_up_status, sms_follow_up_sent_at, qualified_at) were never
-- created. Every step-1/step-2 write has been failing against the CHECK
-- constraint. Idempotent -- safe to run on both fresh and existing databases.
-- ============================================================================

ALTER TABLE public.intake_leads
    ADD COLUMN IF NOT EXISTS qualification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS sms_follow_up_status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS sms_follow_up_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS qualified_at TIMESTAMPTZ;

-- Conservatively remap any rows written under the old (never-actually-valid)
-- status vocabulary before tightening the CHECK constraint to match reality.
UPDATE public.intake_leads SET status = 'step1_abandoned' WHERE status = 'captured';
UPDATE public.intake_leads SET status = 'discarded' WHERE status = 'disqualified';
UPDATE public.intake_leads SET status = 'qualified' WHERE status IN ('sms_sent', 'audit_in_progress', 'proposal_sent', 'call_booked');

ALTER TABLE public.intake_leads ALTER COLUMN status SET DEFAULT 'step1_abandoned';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_status_check') THEN
        ALTER TABLE public.intake_leads DROP CONSTRAINT intake_leads_status_check;
    END IF;
    ALTER TABLE public.intake_leads
        ADD CONSTRAINT intake_leads_status_check CHECK (status IN ('step1_abandoned', 'qualified', 'converted', 'discarded'));

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_sms_follow_up_status_check') THEN
        ALTER TABLE public.intake_leads
            ADD CONSTRAINT intake_leads_sms_follow_up_status_check
            CHECK (sms_follow_up_status IN ('pending', 'sent', 'failed', 'skipped_qualified', 'skipped_no_config'));
    END IF;
END $$;

-- Phase 3 (Voice AI): same shape as sms_follow_up_status, for the new
-- outbound-call auto-trigger on qualified leads.
ALTER TABLE public.intake_leads
    ADD COLUMN IF NOT EXISTS voice_follow_up_status TEXT NOT NULL DEFAULT 'pending';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'intake_leads_voice_follow_up_status_check') THEN
        ALTER TABLE public.intake_leads
            ADD CONSTRAINT intake_leads_voice_follow_up_status_check
            CHECK (voice_follow_up_status IN ('pending', 'sent', 'failed', 'skipped_converted', 'skipped_no_config', 'skipped_disabled'));
    END IF;
END $$;

-- voice_agent_config: single-row, agency-wide configuration for the
-- ElevenLabs voice agent (persisted Save button + auto-trigger toggle).
CREATE TABLE IF NOT EXISTS public.voice_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_id TEXT,
    system_prompt TEXT,
    auto_trigger_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_trigger_delay_seconds INT NOT NULL DEFAULT 300,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- member_can() is confirmed NOT to exist live (deploy error while testing
-- the client_mrr_history migration) -- admin-only until the custom
-- roles/permissions system actually lands, same call as client_mrr_history.
DROP POLICY IF EXISTS "voice_agent_config_select_team" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_select_team" ON public.voice_agent_config FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "voice_agent_config_admin_write" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_admin_write" ON public.voice_agent_config FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.voice_agent_config ENABLE ROW LEVEL SECURITY;

-- voice_calls has been RLS-enabled (blanket ENABLE ROW LEVEL SECURITY loop
-- in the consolidated migration) but never had a policy defined -- with RLS
-- on and zero policies, every authenticated read silently returns nothing.
-- Only the service-role webhook needs to write here (bypasses RLS already).
DROP POLICY IF EXISTS "voice_calls_select_team" ON public.voice_calls;
CREATE POLICY "voice_calls_select_team" ON public.voice_calls FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000002_changelog_entries_columns_and_seed.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- CHANGELOG_ENTRIES SCHEMA DRIFT FIX + v2.5.0 SEED
-- The "confirmed live via information_schema.columns (2026-08-20)" claim
-- this comment used to make about `description`/`category`/`created_by`
-- turned out to be wrong for at least `description` (2026-08-21 deploy
-- error: "column \"description\" of relation \"changelog_entries\" does
-- not exist") -- yet another instance of an earlier "confirmed live" check
-- not holding up, so every column the app's addChangelogEntry() writes to
-- is now defensively ensured here via ADD COLUMN IF NOT EXISTS rather than
-- assumed. Idempotent -- safe to run on both fresh and existing databases.
-- ============================================================================

ALTER TABLE public.changelog_entries
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'fonctionnalite',
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS version TEXT,
    ADD COLUMN IF NOT EXISTS included_items TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: any pre-existing rows written before `description` existed
-- would otherwise sit with an empty description forever.
UPDATE public.changelog_entries SET description = body WHERE (description IS NULL OR description = '') AND body IS NOT NULL AND body <> '';

-- Seed the v2.5.0 entry (Voice AI de-fake + schema-drift fixes) directly --
-- no live Supabase CLI/MCP access from this environment to publish it
-- through the admin UI, and this UI was itself broken until the ALTER
-- above landed.
INSERT INTO public.changelog_entries (title, description, body, version, included_items)
SELECT
    'Agent Vocal IA de-faké & branché, corrections de dérive de schéma',
    'L''Agent Vocal IA (ElevenLabs) affiche maintenant un état réel au lieu de statistiques fabriquées, sa configuration est persistée, et un appel de qualification automatique optionnel se déclenche à la conversion d''un lead.',
    'L''Agent Vocal IA (ElevenLabs) affiche maintenant un état réel au lieu de statistiques fabriquées, et sa console de test utilise le vrai widget de conversation. Sa configuration (voix, prompt, déclenchement automatique) est désormais persistée, avec un nouvel appel de qualification automatique optionnel à la conversion d''un lead et un onglet de génération vocale pour le contenu. Plusieurs bugs de dérive de schéma préexistants (écritures silencieusement en échec sur voice_calls, intake_leads et app_permissions) ont aussi été corrigés au passage.',
    '2.5.0',
    ARRAY[
        'Suppression de toutes les données factices sur /voice-agent (badge en ligne, capacité, latence, console de test animée)',
        'Configuration de l''agent (voix, prompt, déclenchement automatique) persistée en base',
        'Appel de qualification automatique optionnel à la conversion d''un lead, désactivé par défaut',
        'Nouvel onglet Génération vocale (texte vers audio)',
        'Correction de bugs de dérive de schéma sur voice_calls, intake_leads et app_permissions',
        'Correction du chevauchement visuel entre le point "Nouveau" et l''étoile favori dans la sidebar',
        'Nouvelle bibliothèque de skeletons de chargement (formes réelles, shimmer réservé au texte)'
    ]
WHERE NOT EXISTS (
    SELECT 1 FROM public.changelog_entries WHERE version = '2.5.0'
);


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000003_help_articles.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- HELP_ARTICLES
-- Backs the /help FAQ accordion, which previously read from a hardcoded
-- array (app/(dashboard)/help/page.tsx) in violation of the "real data
-- only" project convention. Brand-new table, no drift risk.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP POLICY IF EXISTS "help_articles_select_all" ON public.help_articles;
CREATE POLICY "help_articles_select_all" ON public.help_articles FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "help_articles_admin_write" ON public.help_articles;
CREATE POLICY "help_articles_admin_write" ON public.help_articles FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000004_contacts.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- CONTACTS
-- A team-wide professional rolodex, distinct from the sales-pipeline `leads`
-- table -- people met at events/networking, with a note/SMS/email history
-- and an explicit "convert to lead" path once real interest is confirmed.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    company TEXT,
    role_title TEXT,
    sector TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    met_at_event TEXT,
    met_at_location TEXT,
    met_at_date DATE,
    follow_up_date DATE,
    follow_up_note TEXT,
    converted_to_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contact_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'note' CHECK (channel IN ('note', 'sms', 'email')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_contacts_updated_at ON public.contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Team-wide (admin + member), no client access -- matches the "toute
-- l'équipe pour l'instant" decision. Not gated by member_can() the way
-- leads_select/leads_manage are, since there's deliberately no permission
-- toggle for this yet.
DROP POLICY IF EXISTS "contacts_team" ON public.contacts;
CREATE POLICY "contacts_team" ON public.contacts FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "contact_notes_team" ON public.contact_notes;
CREATE POLICY "contact_notes_team" ON public.contact_notes FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000005_client_mrr_history_and_fields.sql
-- ═══════════════════════════════════════════════════════════════════════
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

-- member_can() (used by the equivalent clients_select/edit_client_financials
-- gating in the consolidated migration) is confirmed NOT to exist live --
-- only is_admin() does (contacts_team/help_articles_admin_write deployed
-- fine using it). Admin-only for now rather than guessing at a
-- member-permission path that doesn't function; revisit once the custom
-- roles/permissions system (chantier in progress) actually lands.
DROP POLICY IF EXISTS "client_mrr_history_select" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_select" ON public.client_mrr_history FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "client_mrr_history_insert" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_insert" ON public.client_mrr_history FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000006_project_milestones_columns.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- PROJECT_MILESTONES SCHEMA DRIFT FIX
-- fetchProjectMilestones/addProjectMilestone/toggleProjectMilestone/
-- updateProjectMilestone (lib/services/supabase-data.ts) -- backing the
-- already-shipped /projects/[id]/roadmap/[milestoneId] pages -- read and
-- write description, status, assignee_id, and position. Confirmed live
-- (2026-08-21) that `completed` does NOT exist on this table either, so the
-- live shape doesn't match this repo's consolidated migration at all here
-- -- no backfill attempted, just adding what the app actually needs.
-- ============================================================================

ALTER TABLE public.project_milestones
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'project_milestones_status_check') THEN
        ALTER TABLE public.project_milestones
            ADD CONSTRAINT project_milestones_status_check CHECK (status IN ('pending', 'done'));
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000007_projects_budget_team_attachments.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- PROJECTS: BUDGET, TEAM ASSIGNMENT, CLIENT VISIBILITY, ATTACHMENTS
-- `assignees` is read everywhere (fetchProjects/addProject in
-- lib/services/supabase-data.ts) but never actually written by any UI --
-- ADD COLUMN IF NOT EXISTS guarantees it's real either way. budget_cad and
-- client_visible are genuinely new. Policies use is_admin() / a direct
-- role='member' check -- NOT member_can(), which is confirmed not to exist
-- live (see 20260821000001/000005).
-- ============================================================================

ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS budget_cad NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS assignees UUID[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS client_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS public.project_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_type TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_attachments_team" ON public.project_attachments;
CREATE POLICY "project_attachments_team" ON public.project_attachments FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000008_departments.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- DEPARTMENTS
-- Backs the Team page's "Départements" tab, currently a toast-only stub.
-- Brand-new table -- no drift risk with anything pre-existing. profiles.department
-- stays a plain free-text column (not a FK) to avoid touching that table;
-- this is just the agency's managed reference list + color coding.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT 'Operations',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "departments_select_all" ON public.departments;
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "departments_admin_write" ON public.departments;
CREATE POLICY "departments_admin_write" ON public.departments FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000009_profiles_workspace.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- PROFILES.WORKSPACE
-- Powers the sidebar's workspace switcher: a nav/dashboard *view filter*
-- for Prospection vs Managing, orthogonal to role (which still governs
-- actual permissions). Admins always see the full, unfiltered nav
-- regardless of this value -- enforced client-side in app-sidebar.tsx, not
-- via RLS, since this never restricts data access, only which nav items
-- render. NULL (unassigned) falls back to showing everything, same as an
-- admin, rather than a broken empty state.
-- ============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS workspace TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_workspace_check') THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing'));
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000010_custom_roles.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- CUSTOM ROLES (module x action permission grid)
-- member_can() is confirmed NOT to exist live (this session, repeatedly).
-- Creating it fresh here is purely additive -- nothing currently live can
-- reference a function that doesn't exist, so this cannot break anything
-- already working. Matches the definition originally intended in the
-- consolidated migration. Only NEW/updated policies (below, and this
-- session's own tables) start using it; pre-existing tables (leads,
-- clients, projects, academy_sops, ...) are deliberately left untouched --
-- their actual live RLS is unknown and too risky to guess at further.
--
-- profiles.role (admin/member/client) is NOT touched or replaced -- custom
-- roles are additive on top, never a path to real admin DB access. is_admin()
-- and every existing policy that depends on it are unchanged.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.member_can(user_id UUID, perm TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.app_permissions
        WHERE profile_id = user_id AND permission = perm AND enabled = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    module TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'create', 'edit', 'delete')),
    UNIQUE(role_id, module, action)
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;
ALTER TABLE public.team_invites ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_team" ON public.roles;
CREATE POLICY "roles_select_team" ON public.roles FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "roles_admin_write" ON public.roles;
CREATE POLICY "roles_admin_write" ON public.roles FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "role_permissions_select_team" ON public.role_permissions;
CREATE POLICY "role_permissions_select_team" ON public.role_permissions FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions FOR ALL TO authenticated
    USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Now that member_can() actually exists, upgrade this session's own new
-- tables from admin-only to real member-permission gating, so a custom
-- role granting these modules actually does something immediately.
DROP POLICY IF EXISTS "client_mrr_history_select" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_select" ON public.client_mrr_history FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_clients'));

DROP POLICY IF EXISTS "client_mrr_history_insert" ON public.client_mrr_history;
CREATE POLICY "client_mrr_history_insert" ON public.client_mrr_history FOR INSERT TO authenticated
    WITH CHECK (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'edit_client_financials'));

DROP POLICY IF EXISTS "voice_agent_config_select_team" ON public.voice_agent_config;
CREATE POLICY "voice_agent_config_select_team" ON public.voice_agent_config FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));

DROP POLICY IF EXISTS "voice_calls_select_team" ON public.voice_calls;
CREATE POLICY "voice_calls_select_team" ON public.voice_calls FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_voice_agent'));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000012_team_invites_workspace.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- TEAM_INVITES.WORKSPACE
-- Phase 6: lets an admin pre-assign the Prospection/Managing workspace
-- filter (see 20260821000009_profiles_workspace.sql) on the invite itself,
-- so a redeemed invite lands the new teammate straight on their workspace
-- dashboard instead of the generic onboarding wizard. Same nullable,
-- view-filter-only semantics as profiles.workspace -- never a permission
-- boundary, NULL means "sees everything" same as admin.
-- ============================================================================

ALTER TABLE public.team_invites
    ADD COLUMN IF NOT EXISTS workspace TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_invites_workspace_check') THEN
        ALTER TABLE public.team_invites
            ADD CONSTRAINT team_invites_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing'));
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000013_documents_wiki_rich_editor.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- DOCUMENTS & WIKI COLLABORATIF TEMPS RÉEL
-- Enrichit la table documents pour supporter l'éditeur en blocs (JSONB),
-- la recherche plein-texte, les catégories d'agence, les favoris épinglés,
-- la liaison client/projet, la visibilité portail client, et crée la table
-- document_versions pour l'historique de versions et la restauration.
-- ============================================================================

-- 1. Évolution de la table documents
ALTER TABLE public.documents
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS content_json JSONB DEFAULT '{"blocks":[]}'::jsonb,
    ADD COLUMN IF NOT EXISTS content_text TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_shared_with_client BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS workspace TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_workspace_check') THEN
        ALTER TABLE public.documents
            ADD CONSTRAINT documents_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_client_id_idx ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS documents_project_id_idx ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS documents_category_idx ON public.documents(category);
CREATE INDEX IF NOT EXISTS documents_is_pinned_idx ON public.documents(is_pinned);
CREATE INDEX IF NOT EXISTS documents_workspace_idx ON public.documents(workspace);

-- 2. Table document_versions (Historique de versions)
CREATE TABLE IF NOT EXISTS public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    title TEXT NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
    content_text TEXT DEFAULT '',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_versions_document_id_idx ON public.document_versions(document_id, created_at DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_versions_select" ON public.document_versions;
CREATE POLICY "document_versions_select" ON public.document_versions FOR SELECT TO authenticated
    USING (
        public.is_admin(auth.uid()) 
        OR public.member_can(auth.uid(), 'view_documents')
        OR EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_id 
            AND (
                d.created_by = auth.uid() 
                OR (d.is_shared_with_client AND d.client_id IS NOT NULL AND d.client_id = public.client_id_for(auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "document_versions_insert" ON public.document_versions;
CREATE POLICY "document_versions_insert" ON public.document_versions FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin(auth.uid()) 
        OR public.member_can(auth.uid(), 'manage_documents')
        OR EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.id = document_id 
            AND d.created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS "document_versions_delete" ON public.document_versions;
CREATE POLICY "document_versions_delete" ON public.document_versions FOR DELETE TO authenticated
    USING (public.is_admin(auth.uid()));


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000014_client_activity_log.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- CLIENT_ACTIVITY_LOG
-- Backs the "Journal des actions en direct" feed on /portal/tasks. The
-- ClientActivityLog TS type already existed but NO table did --
-- fetchClientActivityLogs() unconditionally returned a hardcoded fake
-- array (DEFAULT_CLIENT_ACTIVITY_LOGS) for every client, every time, next
-- to a UI badge claiming "Synchronisation temps réel active". This table
-- makes that real. Real events (task status changes on client-linked
-- tasks, client approvals/revision requests) now write here instead.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('task_started', 'deliverable_submitted', 'task_completed', 'revision_requested', 'milestone_achieved')),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_activity_log_client_id ON public.client_activity_log(client_id, created_at DESC);

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;

-- Team (admin/member) can read and write every client's log.
DROP POLICY IF EXISTS "client_activity_log_team" ON public.client_activity_log;
CREATE POLICY "client_activity_log_team" ON public.client_activity_log FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'))
    WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'member'));

-- Client-role users only ever see their own client's log, and can only
-- insert rows tied to their own client_id (their approve/revision actions).
DROP POLICY IF EXISTS "client_activity_log_client_read" ON public.client_activity_log;
CREATE POLICY "client_activity_log_client_read" ON public.client_activity_log FOR SELECT TO authenticated
    USING (client_id = public.client_id_for(auth.uid()));

DROP POLICY IF EXISTS "client_activity_log_client_insert" ON public.client_activity_log;
CREATE POLICY "client_activity_log_client_insert" ON public.client_activity_log FOR INSERT TO authenticated
    WITH CHECK (client_id = public.client_id_for(auth.uid()));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'client_activity_log'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.client_activity_log;
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260821000015_fix_admin_grant_kbelceus776.sql
-- ═══════════════════════════════════════════════════════════════════════
-- ============================================================================
-- FIX: GRANT ADMIN — kbelceus776@gmail.com (retry)
-- 20260821000011 matched on profiles.email, which silently updates 0 rows
-- if that column is blank/stale/differently-cased for this account (a
-- no-op UPDATE returns success with no error, which is why nothing visibly
-- changed). This version joins through auth.users.id instead -- the
-- canonical source for the login email -- with a case-insensitive match,
-- so it works even if profiles.email never got backfilled correctly.
-- Idempotent -- safe to re-run.
-- ============================================================================

-- Run this first and check the output before the UPDATE below:
--   - If it returns 0 rows: no auth.users account exists with this email
--     in this Supabase project at all (wrong project, or the account was
--     created under a different email).
--   - If it returns 1 row with profile_role/profile_approved as NULL:
--     the auth account exists but has no matching profiles row yet
--     (onboarding never completed) -- the UPDATE below will then also
--     affect 0 rows, and a profiles row needs to be created first.
--   - If it returns 1 row with profile_role already 'admin': the DB is
--     already correct and the issue is client-side (stale session --
--     sign out and back in).
SELECT
    au.id,
    au.email AS auth_email,
    p.email AS profile_email,
    p.role AS profile_role,
    p.approved AS profile_approved
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE lower(au.email) = lower('kbelceus776@gmail.com');

UPDATE public.profiles
SET role = 'admin', approved = TRUE
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('kbelceus776@gmail.com'));

