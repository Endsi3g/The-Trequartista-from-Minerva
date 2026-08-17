-- Found during a full-app audit (2026-08-17): convert_lead_to_client_on_won()
-- (20260812000008_enhance_leads_crm.sql) still wrote to clients/projects
-- columns from an earlier schema iteration -- health_score/onboarding_progress
-- and status='actif' on clients (current schema: health_status with a
-- Ready/On Track/At Risk check, status with an Active/Onboarding/Paused/
-- Archived check, no health_score/onboarding_progress columns at all), and
-- projects.status/health='vert'/launch_score (current schema: current_stage
-- with its own check, health with Ready/On Track/Needs Review, progress_pct,
-- no status/launch_score columns). Both inserts also skipped several NOT
-- NULL columns (clients.industry/health_status/contact_name, projects.
-- current_stage/health/due_date). Any lead marked "Gagné / Signé" would
-- have hit a hard Postgres error and the status change itself would have
-- rolled back with it -- this was never exercised, so it never surfaced.
--
-- mrr comes from the lead's own mrr_value (real, already-captured data);
-- industry has no source field on leads, so it's left as an honest
-- "Non spécifié" for the team to fill in from the client's own "Modifier
-- la fiche" form, not fabricated. due_date defaults to 30 days out, the
-- same onboarding horizon used elsewhere for freshly-created projects.
CREATE OR REPLACE FUNCTION public.convert_lead_to_client_on_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_client_id UUID;
BEGIN
  IF NEW.status = 'Gagné' OR NEW.stage = 'gagne' THEN
    IF NEW.client_id IS NULL THEN
      INSERT INTO public.clients (name, industry, status, health_status, mrr, contact_name, contact_email)
      VALUES (
        COALESCE(NEW.company_name, NEW.client_name, NEW.contact_name),
        'Non spécifié',
        'Onboarding',
        'On Track',
        COALESCE(NEW.mrr_value, 0),
        NEW.contact_name,
        NEW.contact_email
      )
      RETURNING id INTO new_client_id;

      NEW.client_id := new_client_id;
    END IF;

    INSERT INTO public.projects (client_id, name, current_stage, health, progress_pct, due_date)
    VALUES (
      COALESCE(NEW.client_id, new_client_id),
      COALESCE(NEW.company_name, NEW.client_name) || ' - Onboarding',
      'Onboarding',
      'On Track',
      0,
      (NOW() + INTERVAL '30 days')::DATE
    );
  END IF;

  RETURN NEW;
END;
$$;
