-- Storage RLS policies for the app's 4 buckets (client-assets,
-- team-documents, academy-media, proposals). Buckets themselves are
-- created manually in the Supabase dashboard (no SQL equivalent), but
-- storage.objects RLS is real SQL and belongs in a migration like
-- everything else -- confirmed missing entirely: live testing this
-- session hit "new row violates row-level security policy" on a plain
-- authenticated upload to team-documents, meaning no INSERT policy
-- existed at all (default-deny), and avatars/videos/SOP media were
-- never readable without a public SELECT policy either.

-- storage.objects already has RLS enabled by default on every Supabase
-- project (Supabase turns it on at project creation) -- the migration
-- role isn't the table owner, so ALTER TABLE ... ENABLE ROW LEVEL
-- SECURITY here fails with "must be owner of table objects" and isn't
-- needed anyway.

-- getPublicUrl() always builds a /storage/v1/object/public/... URL,
-- which Supabase serves purely based on storage.buckets.public -- it does
-- NOT consult RLS at all. A SELECT policy alone (below) is not enough;
-- the bucket-level flag has to be flipped too, which is exactly what the
-- dashboard's "Public bucket" toggle does under the hood.
UPDATE storage.buckets SET public = true WHERE id IN ('client-assets', 'team-documents', 'academy-media');
UPDATE storage.buckets SET public = false WHERE id = 'proposals';

-- Public read for the 3 buckets whose files are displayed via
-- getPublicUrl() with no session (avatars, client assets/videos,
-- academy SOP media) -- kept for the authenticated/signed-URL access
-- path too, not just the public one above.
CREATE POLICY "public_read_client_assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'client-assets');
CREATE POLICY "public_read_team_documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'team-documents');
CREATE POLICY "public_read_academy_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'academy-media');

-- proposals is deliberately NOT public -- it holds real prospect
-- financial figures (hidden-cost estimates, direct quotes). Only
-- internal team can read; nothing ever links a client directly to a
-- file in this bucket (the PDF is emailed as an attachment, not linked).
CREATE POLICY "team_read_proposals" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'proposals' AND public.client_id_for(auth.uid()) IS NULL);

-- Team-only write (insert/update/delete) across the 3 upload-from-the-
-- browser buckets. UPDATE is required alongside INSERT because several
-- upload call sites use upsert:true. proposals has no write policy here
-- on purpose -- it's written exclusively by the service-role client in
-- /api/proposals/[auditId]/generate, which bypasses RLS entirely.
CREATE POLICY "team_write_assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('client-assets', 'team-documents', 'academy-media') AND public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "team_update_assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('client-assets', 'team-documents', 'academy-media') AND public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "team_delete_assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('client-assets', 'team-documents', 'academy-media') AND public.client_id_for(auth.uid()) IS NULL);
