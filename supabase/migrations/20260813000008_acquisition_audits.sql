-- Acquisition system, part 2: AI audit engine data model.
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_lead_id UUID REFERENCES public.intake_leads(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  crm_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  prospect_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_transcript'
    CHECK (status IN ('awaiting_transcript', 'transcript_ready', 'extracting', 'extracted', 'reviewed', 'proposal_sent')),
  transcript_source TEXT CHECK (transcript_source IN ('granola', 'manual_paste')),
  transcript_raw TEXT,
  transcript_fetched_at TIMESTAMPTZ,
  extraction_raw JSONB,
  extraction_error TEXT,
  view_token TEXT UNIQUE,
  view_token_expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- No unique constraint on client_id: a client can accumulate several
-- audits over time (re-audit, new service line, etc.).
CREATE INDEX audits_client_id_idx ON public.audits(client_id);
CREATE INDEX audits_view_token_idx ON public.audits(view_token);

CREATE TABLE public.audit_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  role_involved TEXT,
  is_bottleneck BOOLEAN DEFAULT FALSE,
  is_duplicate_entry BOOLEAN DEFAULT FALSE,
  source_quote TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE public.audit_cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  role_name TEXT NOT NULL,
  hours_wasted_per_week NUMERIC(6,2) NOT NULL,
  hourly_rate_cad NUMERIC(8,2),
  annual_cost_cad NUMERIC(10,2),
  source_quote TEXT
);

CREATE TABLE public.audit_tool_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  category TEXT,
  has_rest_api BOOLEAN,
  has_graphql_api BOOLEAN,
  integration_feasibility TEXT DEFAULT 'unknown' CHECK (integration_feasibility IN ('high', 'medium', 'low', 'unknown')),
  notes TEXT
);

CREATE TABLE public.audit_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  impact_score SMALLINT NOT NULL CHECK (impact_score BETWEEN 1 AND 10),
  effort_score SMALLINT NOT NULL CHECK (effort_score BETWEEN 1 AND 10),
  sort_order INTEGER DEFAULT 0
);

-- Client-facing interactivity on the token-gated /audit/view page. Never
-- exposed to anon RLS -- all reads/writes for that page go through
-- service-role API routes that validate the token server-side first.
CREATE TABLE public.audit_initiative_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES public.audit_initiatives(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('interested', 'not_priority')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (initiative_id)
);

CREATE TABLE public.audit_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('process_step', 'cost_item', 'initiative', 'general')),
  target_id UUID,
  author TEXT NOT NULL DEFAULT 'Client',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_tool_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_initiative_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audits_team_all" ON public.audits
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_process_steps_team_all" ON public.audit_process_steps
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_cost_items_team_all" ON public.audit_cost_items
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_tool_findings_team_all" ON public.audit_tool_findings
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_initiatives_team_all" ON public.audit_initiatives
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_initiative_reactions_team_all" ON public.audit_initiative_reactions
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "audit_comments_team_all" ON public.audit_comments
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

DROP TRIGGER IF EXISTS trigger_audit_audits ON public.audits;
CREATE TRIGGER trigger_audit_audits
  AFTER INSERT OR UPDATE OR DELETE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Editable reference data: role hourly rates and the tool-compatibility
-- dictionary. Kept as real tables (not hardcoded/env vars) so an admin
-- can correct a rate or add a tool without a redeploy.
CREATE TABLE public.role_hourly_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL UNIQUE,
  hourly_rate_cad NUMERIC(8,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.tool_compatibility_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL UNIQUE,
  category TEXT,
  has_rest_api BOOLEAN,
  has_graphql_api BOOLEAN,
  integration_feasibility TEXT DEFAULT 'unknown' CHECK (integration_feasibility IN ('high', 'medium', 'low', 'unknown')),
  api_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.role_hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_compatibility_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_hourly_rates_select_team" ON public.role_hourly_rates
  FOR SELECT TO authenticated USING (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "role_hourly_rates_write_admin" ON public.role_hourly_rates
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "tool_compatibility_select_team" ON public.tool_compatibility_dictionary
  FOR SELECT TO authenticated USING (public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "tool_compatibility_write_admin" ON public.tool_compatibility_dictionary
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Proposals
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'generated', 'sent', 'failed')),
  pdf_storage_path TEXT,
  calendly_link TEXT,
  brevo_message_id TEXT,
  sent_at TIMESTAMPTZ,
  send_error TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_team_all" ON public.proposals
  FOR ALL TO authenticated
  USING (public.client_id_for(auth.uid()) IS NULL)
  WITH CHECK (public.client_id_for(auth.uid()) IS NULL);

DROP TRIGGER IF EXISTS trigger_audit_proposals ON public.proposals;
CREATE TRIGGER trigger_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();
