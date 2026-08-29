-- ============================================================================
-- Migration: Add 'tech' workspace support & QA Audits Protocol storage
-- Description: Updates check constraints on profiles, team_invites, and documents
--              to include 'tech', and creates tech_qa_audits table.
-- ============================================================================

-- 1. PROFILES.WORKSPACE CHECK CONSTRAINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_workspace_check') THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_workspace_check;
    END IF;
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing', 'tech'));
END $$;

-- 2. TEAM_INVITES.WORKSPACE CHECK CONSTRAINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_invites_workspace_check') THEN
        ALTER TABLE public.team_invites DROP CONSTRAINT team_invites_workspace_check;
    END IF;
    ALTER TABLE public.team_invites
        ADD CONSTRAINT team_invites_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing', 'tech'));
END $$;

-- 3. DOCUMENTS.WORKSPACE CHECK CONSTRAINT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_workspace_check') THEN
        ALTER TABLE public.documents DROP CONSTRAINT documents_workspace_check;
    END IF;
    ALTER TABLE public.documents
        ADD CONSTRAINT documents_workspace_check CHECK (workspace IS NULL OR workspace IN ('prospection', 'managing', 'tech'));
END $$;

-- 4. TECH_QA_AUDITS TABLE (for 20-Point QC protocol runs & validation history)
CREATE TABLE IF NOT EXISTS public.tech_qa_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    target_url TEXT,
    environment TEXT NOT NULL DEFAULT 'production', -- 'production', 'staging', 'preview'
    passed_points INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL DEFAULT 20,
    score_percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress', -- 'passed', 'failed', 'in_progress', 'warning'
    checklist_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    audited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    auditor_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS tech_qa_audits_project_idx ON public.tech_qa_audits(project_id);
CREATE INDEX IF NOT EXISTS tech_qa_audits_created_idx ON public.tech_qa_audits(created_at DESC);

-- Enable RLS
ALTER TABLE public.tech_qa_audits ENABLE ROW LEVEL SECURITY;

-- Policies: Authenticated users can view and create QA audits
DROP POLICY IF EXISTS "Authenticated users can read tech_qa_audits" ON public.tech_qa_audits;
CREATE POLICY "Authenticated users can read tech_qa_audits"
    ON public.tech_qa_audits
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tech_qa_audits" ON public.tech_qa_audits;
CREATE POLICY "Authenticated users can insert tech_qa_audits"
    ON public.tech_qa_audits
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update tech_qa_audits" ON public.tech_qa_audits;
CREATE POLICY "Authenticated users can update tech_qa_audits"
    ON public.tech_qa_audits
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
