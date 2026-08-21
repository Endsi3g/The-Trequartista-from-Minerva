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
