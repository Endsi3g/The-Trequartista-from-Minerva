-- ============================================================================
-- Migration: Add DELETE policy on team_invites & clean up permissions
-- Description: Ensures authenticated admins can cleanly DELETE team_invites
-- ============================================================================

-- Enable DELETE on team_invites for authenticated users
DROP POLICY IF EXISTS "Authenticated users can delete team_invites" ON public.team_invites;
CREATE POLICY "Authenticated users can delete team_invites"
    ON public.team_invites
    FOR DELETE
    TO authenticated
    USING (true);

-- Ensure proposals table has full CRUD policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'proposals') THEN
        ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Authenticated users can manage proposals" ON public.proposals;
        CREATE POLICY "Authenticated users can manage proposals"
            ON public.proposals
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;
