-- Migration: Audit Logs Table, Postgres Triggers, and Realtime Publications

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  actor_name TEXT NOT NULL DEFAULT 'Système',
  actor_email TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow team read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow team write audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 3. Automatic Audit Logging Function for Table Changes
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS TRIGGER AS $$
DECLARE
  rec_id TEXT;
  action_type TEXT;
  details_payload JSONB;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    rec_id := OLD.id::text;
    action_type := TG_TABLE_NAME || '_deleted';
    details_payload := row_to_json(OLD)::jsonb;
  ELSIF (TG_OP = 'UPDATE') THEN
    rec_id := NEW.id::text;
    action_type := TG_TABLE_NAME || '_updated';
    details_payload := jsonb_build_object('old', row_to_json(OLD)::jsonb, 'new', row_to_json(NEW)::jsonb);
  ELSIF (TG_OP = 'INSERT') THEN
    rec_id := NEW.id::text;
    action_type := TG_TABLE_NAME || '_created';
    details_payload := row_to_json(NEW)::jsonb;
  END IF;

  INSERT INTO public.audit_logs (action, table_name, record_id, actor_name, details)
  VALUES (action_type, TG_TABLE_NAME, rec_id, 'Centurions DB Trigger', details_payload);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers on Key Operational Tables
DROP TRIGGER IF EXISTS trigger_audit_clients ON public.clients;
CREATE TRIGGER trigger_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP TRIGGER IF EXISTS trigger_audit_projects ON public.projects;
CREATE TRIGGER trigger_audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP TRIGGER IF EXISTS trigger_audit_launch_checks ON public.project_launch_checks;
CREATE TRIGGER trigger_audit_launch_checks
  AFTER INSERT OR UPDATE OR DELETE ON public.project_launch_checks
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- 5. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_launch_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_posts;
