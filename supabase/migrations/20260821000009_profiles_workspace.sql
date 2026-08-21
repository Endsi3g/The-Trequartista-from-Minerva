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
