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
