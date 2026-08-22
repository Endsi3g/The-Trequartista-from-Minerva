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
