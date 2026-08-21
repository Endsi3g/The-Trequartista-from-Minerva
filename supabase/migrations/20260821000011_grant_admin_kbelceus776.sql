-- ============================================================================
-- GRANT ADMIN: kbelceus776@gmail.com
-- Direct profiles update only -- confirmed live (same pattern used
-- successfully everywhere else this session, e.g. Team page's
-- handleRoleChange). The allowed_emails table's live shape doesn't match
-- this repo's consolidated migration (no `role` column live, per the
-- actual deploy error), so that best-effort future-proofing step is
-- dropped rather than guessed at further. Idempotent -- safe to re-run.
-- ============================================================================

UPDATE public.profiles
SET role = 'admin', approved = TRUE
WHERE email = 'kbelceus776@gmail.com';
