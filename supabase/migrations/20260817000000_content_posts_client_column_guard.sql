-- Security fix, found during a self-review of the 2026-08-16 RLS work
-- (20260816000000_pending_consolidated.sql, already deployed at the time
-- this was found -- that's why this is its own new migration rather than
-- an edit to that file: the Supabase CLI tracks applied migrations by
-- filename, so editing an already-pushed file would silently never ship).
--
-- content_posts_client_approve (in the deployed migration) lets a client
-- UPDATE their own content_posts row, scoped correctly by client_id at the
-- row level -- but Postgres RLS has no native column-level policy. A raw
-- REST PATCH from a client's own session could still have overwritten
-- title/video_url/status/caption/etc. on that row, not just
-- client_approval/client_feedback as the portal UI intends. This trigger
-- closes that gap: when the acting user is a client, any column other
-- than client_approval/client_feedback must be unchanged, or the update
-- is rejected outright. Team/admin sessions and the service-role key
-- (both resolve client_id_for(auth.uid()) to NULL) are never subject to
-- this and keep full write access as before.
CREATE OR REPLACE FUNCTION public.enforce_content_posts_client_columns()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.client_id_for(auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.title IS DISTINCT FROM OLD.title
    OR NEW.format IS DISTINCT FROM OLD.format
    OR NEW.platform IS DISTINCT FROM OLD.platform
    OR NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url
    OR NEW.video_url IS DISTINCT FROM OLD.video_url
    OR NEW.caption IS DISTINCT FROM OLD.caption
    OR NEW.hashtags IS DISTINCT FROM OLD.hashtags
    OR NEW.internal_notes IS DISTINCT FROM OLD.internal_notes
    OR NEW.native_url IS DISTINCT FROM OLD.native_url
    OR NEW.client_id IS DISTINCT FROM OLD.client_id
  THEN
    RAISE EXCEPTION 'Un client ne peut modifier que client_approval et client_feedback sur ce contenu.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS content_posts_client_columns_guard ON public.content_posts;
CREATE TRIGGER content_posts_client_columns_guard
  BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_content_posts_client_columns();
