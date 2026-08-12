-- Add per-owner scoping to user_api_keys. Without a user_id column, RLS
-- has no way to restrict a key to its creator, which is what let every
-- authenticated (and previously even anonymous) caller list every user's
-- webhook keys via the "Allow public select" policy.
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS user_api_keys_user_id_idx ON public.user_api_keys (user_id);

COMMENT ON COLUMN public.user_api_keys.user_id IS
  'Owner of the key, required for RLS scoping (see 20260812000004_harden_rls_policies.sql). '
  'Rows with NULL predate the security hardening pass, were stored in plaintext, and should be revoked manually.';

COMMENT ON COLUMN public.user_api_keys.key_hash IS
  'SHA-256 hash of the API key, hex-encoded. The application now hashes before insert; '
  'this column no longer stores plaintext keys for rows created after the hardening pass.';
