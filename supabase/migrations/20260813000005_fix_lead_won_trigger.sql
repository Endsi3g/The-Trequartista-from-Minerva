-- Fix: convert_lead_to_client_on_won() was inserting into columns that
-- don't exist on clients/projects (health_score, onboarding_progress,
-- status='actif', launch_score) and skipping real NOT NULL columns
-- (industry, contact_name, current_stage, due_date). Every attempt to
-- mark a lead "Gagné" threw a Postgres error and the whole update failed
-- silently in the UI (LeadDetailDrawer/KanbanBoard don't surface DB
-- errors -- see the same migration batch's supabase-data.ts fix).
CREATE OR REPLACE FUNCTION public.convert_lead_to_client_on_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_client_id UUID;
BEGIN
  IF NEW.status = 'Gagné' OR NEW.stage = 'gagne' THEN
    IF NEW.client_id IS NULL THEN
      INSERT INTO public.clients (name, industry, status, health_status, contact_name, contact_email)
      VALUES (
        COALESCE(NEW.company_name, NEW.client_name, NEW.contact_name),
        COALESCE(NEW.service_requested, 'Non spécifié'),
        'Onboarding',
        'On Track',
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
      (NOW() + INTERVAL '30 days')::date
    );
  END IF;

  RETURN NEW;
END;
$$;
