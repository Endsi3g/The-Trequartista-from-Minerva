-- Migration: Client CRM & Leads Pipeline Table

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  service_requested TEXT NOT NULL,
  score_grade TEXT NOT NULL CHECK (score_grade IN ('A', 'B', 'C', 'D')),
  status TEXT NOT NULL CHECK (status IN ('Nouveau', 'Contacté', 'RDV Fixé', 'Gagné', 'Perdu')),
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow team read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow team write leads" ON public.leads FOR ALL USING (true);

-- Attach Audit Trigger
DROP TRIGGER IF EXISTS trigger_audit_leads ON public.leads;
CREATE TRIGGER trigger_audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
