-- ============================================================================
-- Migration: 20260904150000_cleanup_test_and_client_profiles.sql
-- Description: Lock team onboarding so unapproved users cannot join company.
--              Clean test bots and client accounts from profiles table.
-- ============================================================================

-- 1. Ensure approved column exists on profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Update handle_new_user() to default approved to FALSE for all new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_superadmin BOOLEAN;
BEGIN
    is_superadmin := (LOWER(NEW.email) = 'kbelceus776@gmail.com');

    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, approved)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/initials/svg?seed=' || encode(digest(NEW.email, 'sha256'), 'hex')),
        CASE WHEN is_superadmin THEN 'admin' ELSE 'member' END,
        CASE WHEN is_superadmin THEN TRUE ELSE FALSE END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reclassify Client accounts so they never pollute internal company staff
UPDATE public.profiles
SET role = 'client', approved = FALSE
WHERE LOWER(full_name) IN ('client contact', 'vates')
   OR (LOWER(full_name) = 'kael' AND role = 'client');

-- 4. Deactivate and unapprove test bot accounts
UPDATE public.profiles
SET approved = FALSE
WHERE LOWER(full_name) IN ('agent tester', 'qa audit visuel')
   OR LOWER(full_name) LIKE '%agent tester%'
   OR LOWER(full_name) LIKE '%qa audit%'
   OR LOWER(email) LIKE '%test%'
   OR LOWER(email) LIKE '%agent%';

-- 5. Deduplicate Kael Belceus: Ensure primary CEO account is active Admin, unapprove duplicates
UPDATE public.profiles
SET role = 'admin', approved = TRUE
WHERE LOWER(email) = 'kbelceus776@gmail.com';

UPDATE public.profiles
SET approved = FALSE
WHERE (LOWER(full_name) LIKE '%kael belceus%' OR LOWER(full_name) = 'kael')
  AND LOWER(email) != 'kbelceus776@gmail.com';

-- 6. Ensure the 5 official Minerva core team members are approved and configured
UPDATE public.profiles
SET approved = TRUE, role = 'member', department = 'Tech & IA'
WHERE LOWER(full_name) LIKE '%manpreet singh%';

UPDATE public.profiles
SET approved = TRUE, role = 'member', department = 'Marketing'
WHERE LOWER(full_name) = 'rayan' OR LOWER(full_name) LIKE 'rayan %';

UPDATE public.profiles
SET approved = TRUE, role = 'member', department = 'Ventes'
WHERE LOWER(full_name) LIKE '%samuel olamide adeleke%' OR LOWER(full_name) LIKE '%samuel adeleke%';

UPDATE public.profiles
SET approved = TRUE, role = 'member', department = 'Operations'
WHERE LOWER(full_name) LIKE '%amine yahya karroubi%' OR LOWER(full_name) LIKE '%amine karroubi%';
