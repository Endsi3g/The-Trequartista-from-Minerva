-- Fix: profiles table schema collision between 20260811000000_init_centurions.sql
-- and 20260812000001_profiles_and_roles.sql.
--
-- The second migration's `CREATE TABLE IF NOT EXISTS public.profiles` was a
-- silent no-op, because the table already existed from the init migration
-- with a different shape. The approved/updated_at columns were therefore
-- never created, which broke two things in production:
--   1. handle_new_user() inserts a row with `approved = FALSE`, but the
--      column didn't exist, so every signup failed.
--   2. proxy.ts reads `profiles.approved` to gate access; a missing column
--      makes that query error out, which the old fail-open logic treated
--      as "let the user through" — the entire approval system was inert.
--
-- This migration reconciles the schema in place instead of dropping/
-- recreating the table, so it is safe to run against a database that
-- already has real rows.

-- 1. Add the columns the approval flow depends on.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. job_title/department were NOT NULL with no default in the original
--    schema; handle_new_user() never sets them, which would otherwise
--    still fail every signup even after (1).
ALTER TABLE public.profiles ALTER COLUMN job_title DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN department DROP NOT NULL;

-- 3. Normalize `role` to the lowercase admin/member convention used by
--    handle_new_user() and every RLS policy written since (allowed_emails,
--    profiles_select_admin, profiles_update_admin all compare against
--    'admin'). Old capitalized values map: Admin -> admin, everything
--    else -> member.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles
  SET role = CASE WHEN LOWER(role) = 'admin' THEN 'admin' ELSE 'member' END
  WHERE role IS NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'member'));

-- 4. Retire the original blanket-read policy from the init migration. RLS
--    policies for the same command combine via OR, so as long as this one
--    existed it silently overrode the newer profiles_select_own /
--    profiles_select_admin policies — every authenticated user could read
--    every profile regardless of the "own row or admin" intent.
DROP POLICY IF EXISTS "Allow team read profiles" ON public.profiles;

-- 5. Promote a specific account to admin so the approval UI is usable
--    immediately after this migration runs. Replace the email below with
--    a real account before applying, or run this UPDATE manually once you
--    know which user should be the first admin.
-- UPDATE public.profiles SET role = 'admin', approved = TRUE WHERE email = 'admin@minervaflow.com';
