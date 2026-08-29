-- ============================================================================
-- MINERVA TREQUARTISTA — SCRIPT DE DÉPLOIEMENT COMBINÉ
-- Régénéré le 2026-08-21 en concaténant, dans l'ordre, le contenu exact et
-- vérifié de chaque fichier de supabase/migrations/ encore en attente
-- (20260821000000 à 20260821000015 — la base 20260820000000_consolidated_
-- schema.sql est déjà confirmée live et n'est PAS incluse ici).
--
-- Chaque section est idempotente (IF NOT EXISTS / DROP POLICY IF EXISTS /
-- INSERT ... WHERE NOT EXISTS) -- ce script peut être relancé sans risque
-- même si certaines sections sont déjà appliquées.
--
-- 20260821000011_grant_admin_kbelceus776.sql est délibérément OMIS : il
-- matchait sur profiles.email (no-op silencieux si cette colonne était
-- vide/périmée pour ce compte -- exactement ce qui s'est produit).
-- 20260821000015 à la toute fin le remplace avec une jointure sur
-- auth.users.id, la source canonique de l'email de connexion.
--
-- À copier-coller et exécuter dans l'éditeur SQL de votre tableau de bord
-- Supabase : https://supabase.com/dashboard/project/_/sql
-- ============================================================================


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


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260827000000_plane_integration.sql
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.tasks
    ADD COLUMN IF NOT EXISTS plane_issue_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_sequence_id INT,
    ADD COLUMN IF NOT EXISTS plane_state_id TEXT,
    ADD COLUMN IF NOT EXISTS plane_priority TEXT,
    ADD COLUMN IF NOT EXISTS plane_synced_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.plane_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_plane_issue_id ON public.tasks(plane_issue_id);
CREATE INDEX IF NOT EXISTS idx_plane_sync_logs_created_at ON public.plane_sync_logs(created_at DESC);

ALTER TABLE public.plane_sync_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'plane_sync_logs' AND policyname = 'Allow admin read plane_sync_logs'
    ) THEN
        CREATE POLICY "Allow admin read plane_sync_logs" ON public.plane_sync_logs
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260828000000_invoicing_and_client_portal.sql
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'invoice' CHECK (type IN ('invoice', 'quote', 'retainer', 'credit_note')),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
    paid_at TIMESTAMPTZ,
    subtotal_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_tps_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax_tvq_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stripe_payment_link_url TEXT,
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(8,2) NOT NULL DEFAULT 1.00,
    unit_price_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_cad NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    asset_url TEXT NOT NULL,
    preview_image_url TEXT,
    type TEXT NOT NULL DEFAULT 'document' CHECK (type IN ('design', 'video', 'document', 'report', 'code')),
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
    author_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'in_progress', 'resolved')),
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

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_authenticated_full_access') THEN
        CREATE POLICY "invoices_authenticated_full_access" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_items' AND policyname = 'invoice_items_authenticated_full_access') THEN
        CREATE POLICY "invoice_items_authenticated_full_access" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_deliverables' AND policyname = 'deliverables_authenticated_full_access') THEN
        CREATE POLICY "deliverables_authenticated_full_access" ON public.client_deliverables FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_portal_messages' AND policyname = 'portal_messages_authenticated_full_access') THEN
        CREATE POLICY "portal_messages_authenticated_full_access" ON public.client_portal_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260828000001_leads_columns_sync.sql
-- ═══════════════════════════════════════════════════════════════════════
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

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow select on leads for authenticated') THEN
        CREATE POLICY "Allow select on leads for authenticated" ON public.leads FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow insert on leads for authenticated') THEN
        CREATE POLICY "Allow insert on leads for authenticated" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Allow update on leads for authenticated') THEN
        CREATE POLICY "Allow update on leads for authenticated" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260828000002_minerva_flow_and_studio.sql
-- ═══════════════════════════════════════════════════════════════════════
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
CREATE INDEX IF NOT EXISTS idx_flow_restaurants_client_id ON public.minerva_flow_restaurants(client_id);
CREATE INDEX IF NOT EXISTS idx_studio_orders_client_id ON public.studio_service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_audits_token ON public.restaurant_audits(audit_token);

ALTER TABLE public.minerva_flow_restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_audits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'minerva_flow_restaurants' AND policyname = 'flow_restaurants_auth_all') THEN
        CREATE POLICY "flow_restaurants_auth_all" ON public.minerva_flow_restaurants FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_service_packages' AND policyname = 'studio_packages_read_all') THEN
        CREATE POLICY "studio_packages_read_all" ON public.studio_service_packages FOR SELECT TO authenticated, anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'studio_service_orders' AND policyname = 'studio_orders_auth_all') THEN
        CREATE POLICY "studio_orders_auth_all" ON public.studio_service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_audits' AND policyname = 'restaurant_audits_all') THEN
        CREATE POLICY "restaurant_audits_all" ON public.restaurant_audits FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260828000003_proposals_and_esignature.sql
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS public.proposals
    ADD COLUMN IF NOT EXISTS proposal_number TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Proposition Commerciale Minerva',
    ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT 'Client',
    ADD COLUMN IF NOT EXISTS client_email TEXT,
    ADD COLUMN IF NOT EXISTS client_company TEXT,
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
    ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_proposals_token ON public.proposals(token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_auth_all'
    ) THEN
        CREATE POLICY "proposals_auth_all" ON public.proposals
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_anon_read_token'
    ) THEN
        CREATE POLICY "proposals_anon_read_token" ON public.proposals
            FOR SELECT TO anon USING (token IS NOT NULL);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'proposals_anon_update_sign'
    ) THEN
        CREATE POLICY "proposals_anon_update_sign" ON public.proposals
            FOR UPDATE TO anon USING (token IS NOT NULL) WITH CHECK (token IS NOT NULL);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════
-- SOURCE: supabase/migrations/20260828000004_revops_and_team_commissions.sql
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.team_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    deal_title TEXT NOT NULL,
    base_amount_cad NUMERIC(10,2) NOT NULL,
    commission_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    commission_amount_cad NUMERIC(10,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'setup' CHECK (type IN ('setup', 'mrr_recurring', 'bonus_quota')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_capacity_profiles (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL DEFAULT 'generalist' CHECK (specialty IN ('video_production', 'web_framer', 'ads_acquisition', 'pos_operations', 'generalist')),
    weekly_hours_capacity INTEGER NOT NULL DEFAULT 35,
    monthly_quota_cad NUMERIC(10,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_commissions_profile_id ON public.team_commissions(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_commissions_status ON public.team_commissions(status);
CREATE INDEX IF NOT EXISTS idx_team_commissions_proposal_id ON public.team_commissions(proposal_id);

ALTER TABLE public.team_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_capacity_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_commissions' AND policyname = 'team_commissions_auth_all'
    ) THEN
        CREATE POLICY "team_commissions_auth_all" ON public.team_commissions
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'team_capacity_profiles' AND policyname = 'team_capacity_auth_all'
    ) THEN
        CREATE POLICY "team_capacity_auth_all" ON public.team_capacity_profiles
            FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;





