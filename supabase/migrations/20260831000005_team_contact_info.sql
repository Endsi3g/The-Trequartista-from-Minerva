-- Every team member must be reachable outside the app: a direct phone
-- number (email already exists and is guaranteed via Supabase Auth, but a
-- company inbox nobody checks daily isn't "easy to contact") plus an
-- optional Instagram link for quick DM-based contact. Enforced going
-- forward at /team/join (new invites require a phone number); existing
-- members are nudged via the onboarding checklist and the admin /team
-- directory rather than retroactively locked out.
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS instagram_url TEXT;
