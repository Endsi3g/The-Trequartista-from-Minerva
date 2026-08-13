-- Acquisition system, part 1: pre-qualification lead intake, distinct from
-- the sales-pipeline `leads` table (which has NOT NULL contact_name/
-- service_requested/etc. that a bare "prénom + téléphone" Étape-1
-- submission can't satisfy).
CREATE TABLE public.intake_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'step1_abandoned'
    CHECK (status IN ('step1_abandoned', 'qualified', 'converted', 'discarded')),
  qualification_data JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'framer',
  sms_follow_up_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sms_follow_up_status IN ('pending', 'sent', 'failed', 'skipped_qualified', 'skipped_no_config')),
  sms_follow_up_sent_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX intake_leads_phone_idx ON public.intake_leads(phone);
CREATE INDEX intake_leads_status_idx ON public.intake_leads(status);

ALTER TABLE public.intake_leads ENABLE ROW LEVEL SECURITY;
-- No anon policy: writes only ever happen via the service-role webhook
-- routes (Framer has no session, so the browser-facing endpoints use a
-- service-role client directly). Team reads/writes once qualified.
CREATE POLICY "intake_leads_team_all" ON public.intake_leads
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

DROP TRIGGER IF EXISTS trigger_audit_intake_leads ON public.intake_leads;
CREATE TRIGGER trigger_audit_intake_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.intake_leads
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Bridge: qualifying an intake lead auto-creates a real CRM pipeline card,
-- mirroring convert_lead_to_client_on_won()'s SECURITY DEFINER pattern.
CREATE OR REPLACE FUNCTION public.bridge_intake_lead_to_crm()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_lead_id UUID;
BEGIN
  IF NEW.status = 'qualified' AND (OLD.status IS DISTINCT FROM 'qualified') AND NEW.crm_lead_id IS NULL THEN
    INSERT INTO public.leads (client_name, contact_name, contact_email, contact_phone, service_requested, score_grade, status, stage, notes)
    VALUES (
      NEW.first_name,
      NEW.first_name,
      COALESCE(NEW.email, ''),
      NEW.phone,
      COALESCE(NEW.qualification_data->>'service_requested', 'Diagnostic à qualifier'),
      'B',
      'Nouveau',
      'nouveau',
      '[]'::jsonb
    )
    RETURNING id INTO new_lead_id;

    NEW.crm_lead_id := new_lead_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_bridge_intake_lead_to_crm ON public.intake_leads;
CREATE TRIGGER trigger_bridge_intake_lead_to_crm
  BEFORE UPDATE OF status ON public.intake_leads
  FOR EACH ROW
  WHEN (NEW.status = 'qualified')
  EXECUTE FUNCTION public.bridge_intake_lead_to_crm();
