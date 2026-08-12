-- Migration: Extend content_posts for the dedicated Reel detail page
-- (platform, real video hosting, caption/hashtags, internal notes, native
-- link, metrics, and an auto-tracked status history)

ALTER TABLE public.content_posts
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS caption TEXT,
  ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS native_url TEXT,
  ADD COLUMN IF NOT EXISTS metrics_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metrics_likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.track_content_post_status_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status_history := jsonb_build_array(jsonb_build_object('status', NEW.status, 'changed_at', NOW()));
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_history := COALESCE(OLD.status_history, '[]'::jsonb) ||
      jsonb_build_object('status', NEW.status, 'changed_at', NOW());
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_content_post_status_history ON public.content_posts;
CREATE TRIGGER trigger_content_post_status_history
  BEFORE INSERT OR UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.track_content_post_status_history();
