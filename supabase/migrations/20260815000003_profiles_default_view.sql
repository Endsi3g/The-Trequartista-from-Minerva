-- Onboarding 1 (5-step wizard) lets a new member pick their default
-- landing view -- previously this choice was thrown away after a single
-- redirect (never persisted), so it had no effect on future logins.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_view TEXT;
