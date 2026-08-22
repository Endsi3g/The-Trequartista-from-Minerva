-- Adds self-service networking fields to public.contacts: a profile photo,
-- the 3 optional networking-questionnaire answers, a follow-up status, and
-- a provenance flag -- backing the public /reseau self-submission form.
-- No new RLS policy: public submissions go through a service-role API
-- route (app/api/network-contacts/submit), so contacts stays
-- authenticated-only exactly as before.

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS how_can_i_help TEXT,
  ADD COLUMN IF NOT EXISTS biggest_problem TEXT,
  ADD COLUMN IF NOT EXISTS open_to_collaborate BOOLEAN,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT
    CHECK (preferred_contact_method IN ('email', 'reseaux_sociaux', 'site_web', 'autre')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'a_contacter'
    CHECK (status IN ('a_contacter', 'rencontre_proposee', 'entrevue_minerva', 'collaboration_en_cours')),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'self_submitted'));
