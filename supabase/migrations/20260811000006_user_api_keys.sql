-- Migration: User Webhook API Keys Table & Security

CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT DEFAULT 'Alex Tremblay',
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['webhook:write', 'roi:read'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on user_api_keys"
  ON public.user_api_keys FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public select on user_api_keys"
  ON public.user_api_keys FOR SELECT
  USING (true);

-- Attach Audit Trigger
DROP TRIGGER IF EXISTS trigger_audit_user_api_keys ON public.user_api_keys;
CREATE TRIGGER trigger_audit_user_api_keys
  AFTER INSERT OR UPDATE OR DELETE ON public.user_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_api_keys;
