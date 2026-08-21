-- ============================================================================
-- GRANT ADMIN: kbelceus776@gmail.com
-- Same pattern as the original founder bootstrap seed (allowed_emails +
-- direct profiles update). Idempotent -- safe to re-run.
-- ============================================================================

UPDATE public.profiles
SET role = 'admin', approved = TRUE
WHERE email = 'kbelceus776@gmail.com';

INSERT INTO public.allowed_emails (email, role, auto_approve, notes)
VALUES ('kbelceus776@gmail.com', 'admin', TRUE, 'Admin complet accordé le 2026-08-21')
ON CONFLICT (email) DO UPDATE SET role = 'admin', auto_approve = TRUE;
