-- Migration: User Feedback System & Realtime Persistence

CREATE TABLE IF NOT EXISTS public.user_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT DEFAULT 'Utilisateur Minerva',
  user_email TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category TEXT DEFAULT 'Général',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on user_feedbacks"
  ON public.user_feedbacks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read on user_feedbacks"
  ON public.user_feedbacks FOR SELECT
  USING (true);

-- Attach Audit Trigger
DROP TRIGGER IF EXISTS trigger_audit_user_feedbacks ON public.user_feedbacks;
CREATE TRIGGER trigger_audit_user_feedbacks
  AFTER INSERT OR UPDATE OR DELETE ON public.user_feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_feedbacks;
