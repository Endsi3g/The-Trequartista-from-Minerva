-- One performance review row per team member -- required for the
-- upsert(onConflict: 'profile_id') used by updateNext1on1Date() to work;
-- without a unique constraint Postgres rejects ON CONFLICT entirely.
ALTER TABLE public.team_performance_reviews
  ADD CONSTRAINT team_performance_reviews_profile_id_key UNIQUE (profile_id);
