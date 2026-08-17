-- Team chat: 1-on-1 DM channels between members, plus image/voice/GIF
-- attachments on any channel (project, client, or member). Extends
-- 20260817000006_team_chat.sql rather than editing it -- that migration
-- may already be applied, and the CLI tracks migrations by filename, not
-- content hash, so an edit to an already-applied file would silently
-- never re-run.

-- One row per unique pair of team members. user_a/user_b are always
-- stored in a canonical (sorted) order so there's exactly one channel per
-- pair regardless of who starts the conversation -- app code sorts the two
-- ids client-side before every read/write (see getOrCreateDmChannel in
-- lib/services/supabase-data.ts).
CREATE TABLE IF NOT EXISTS public.team_chat_dm_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_chat_dm_channels_ordered CHECK (user_a < user_b),
  CONSTRAINT team_chat_dm_channels_unique UNIQUE (user_a, user_b)
);

ALTER TABLE public.team_chat_dm_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_chat_dm_channels_participants" ON public.team_chat_dm_channels;
CREATE POLICY "team_chat_dm_channels_participants" ON public.team_chat_dm_channels
  FOR ALL TO authenticated
  USING (auth.uid() IN (user_a, user_b))
  WITH CHECK (auth.uid() IN (user_a, user_b));

-- Widen channel_type to allow 'member' (a DM, channel_id = a
-- team_chat_dm_channels.id) alongside the existing 'project'/'client'.
ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check
  CHECK (channel_type IN ('project', 'client', 'member'));

-- Attachments: image/voice-note/GIF/file uploads to the team-chat-media
-- bucket. body becomes optional since an attachment-only message (no
-- caption) is a normal case; the new check keeps a message from being
-- entirely empty.
ALTER TABLE public.team_chat_messages ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.team_chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.team_chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT
  CHECK (attachment_type IN ('image', 'audio', 'gif', 'file'));
ALTER TABLE public.team_chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_has_content;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_has_content
  CHECK (body IS NOT NULL AND body <> '' OR attachment_url IS NOT NULL);

-- Replace the team-only policy: project/client channels keep the existing
-- "any admin or member" access; 'member' channels (DMs) are additionally
-- restricted to the two participants -- a DM is private between the two
-- people in it, not visible to every admin/member the way a project or
-- client channel is.
DROP POLICY IF EXISTS "team_chat_messages_team" ON public.team_chat_messages;
CREATE POLICY "team_chat_messages_team" ON public.team_chat_messages
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
    AND (
      channel_type IN ('project', 'client')
      OR (channel_type = 'member' AND EXISTS (
        SELECT 1 FROM public.team_chat_dm_channels dc
        WHERE dc.id = team_chat_messages.channel_id
          AND auth.uid() IN (dc.user_a, dc.user_b)
      ))
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
    AND (
      channel_type IN ('project', 'client')
      OR (channel_type = 'member' AND EXISTS (
        SELECT 1 FROM public.team_chat_dm_channels dc
        WHERE dc.id = team_chat_messages.channel_id
          AND auth.uid() IN (dc.user_a, dc.user_b)
      ))
    )
  );

-- Storage: the team-chat-media bucket itself has no SQL equivalent for
-- CREATE (same limitation noted in 20260813000009_storage_bucket_policies.sql)
-- -- it must be created manually in the Supabase dashboard before this
-- migration is deployed, as a PUBLIC bucket (same convention as
-- client-assets/team-documents/academy-media). The flag + RLS below are
-- real SQL and belong here once the bucket exists.
UPDATE storage.buckets SET public = true WHERE id = 'team-chat-media';

CREATE POLICY "public_read_team_chat_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'team-chat-media');

CREATE POLICY "team_write_chat_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'team-chat-media' AND public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "team_update_chat_media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'team-chat-media' AND public.client_id_for(auth.uid()) IS NULL);
CREATE POLICY "team_delete_chat_media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'team-chat-media' AND public.client_id_for(auth.uid()) IS NULL);
