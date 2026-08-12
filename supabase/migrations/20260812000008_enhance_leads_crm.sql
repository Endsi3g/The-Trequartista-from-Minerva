-- Migration: Enhance Leads CRM with financial values, stages, and auto-conversion to clients/projects
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'nouveau',
  ADD COLUMN IF NOT EXISTS mrr_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS one_time_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS probability_pct INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger function: Auto-create Client & Project when lead moves to 'gagne'
CREATE OR REPLACE FUNCTION public.convert_lead_to_client_on_won()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_client_id UUID;
BEGIN
  IF NEW.status = 'Gagné' OR NEW.stage = 'gagne' THEN
    -- Check if client record already exists for this lead
    IF NEW.client_id IS NULL THEN
      INSERT INTO public.clients (name, contact_email, health_score, status, onboarding_progress)
      VALUES (
        COALESCE(NEW.company_name, NEW.client_name, NEW.contact_name),
        NEW.contact_email,
        'bon',
        'actif',
        100
      )
      RETURNING id INTO new_client_id;

      NEW.client_id := new_client_id;
    END IF;

    -- Create default project for this won lead
    INSERT INTO public.projects (client_id, name, status, health, launch_score)
    VALUES (
      COALESCE(NEW.client_id, new_client_id),
      COALESCE(NEW.company_name, NEW.client_name) || ' - Project Onboarding',
      'en_cours',
      'vert',
      85
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_convert_lead_on_won ON public.leads;
CREATE TRIGGER trigger_convert_lead_on_won
  BEFORE UPDATE OF status, stage ON public.leads
  FOR EACH ROW
  WHEN (NEW.status = 'Gagné' OR NEW.stage = 'gagne')
  EXECUTE FUNCTION public.convert_lead_to_client_on_won();
