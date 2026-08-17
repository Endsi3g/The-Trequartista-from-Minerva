-- Internal team chat, channels per project/client (as opposed to one
-- global room) -- e.g. the conversation about "Toitures Beauchemin" stays
-- attached to that client, not mixed into everyone else's.
CREATE TABLE IF NOT EXISTS public.team_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_type TEXT NOT NULL CHECK (channel_type IN ('project', 'client')),
  channel_id UUID NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_chat_messages_channel_idx
  ON public.team_chat_messages(channel_type, channel_id, created_at);

ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;

-- Internal only -- client-portal accounts never reach /chat and have no
-- reason to see agency-internal discussion about any client's account.
DROP POLICY IF EXISTS "team_chat_messages_team" ON public.team_chat_messages;
CREATE POLICY "team_chat_messages_team" ON public.team_chat_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member')));
