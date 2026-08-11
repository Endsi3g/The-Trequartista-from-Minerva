-- Migration: Content Posts & Video Media Metadata Expansion

ALTER TABLE public.content_posts
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Instagram',
  ADD COLUMN IF NOT EXISTS script_notes TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS metrics_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metrics_clicks INTEGER DEFAULT 0;

-- Attach Audit Trigger if missing
DROP TRIGGER IF EXISTS trigger_audit_content_posts ON public.content_posts;
CREATE TRIGGER trigger_audit_content_posts
  AFTER INSERT OR UPDATE OR DELETE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_posts;
