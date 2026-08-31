-- Native Slack-like additions to the team chat (reactions, threaded
-- replies, @mentions with an unread indicator, topic channels), plus a
-- fix for a real data-loss bug: the TS layer wrote channel_type='member'
-- for DM messages, but the existing CHECK constraint only allowed
-- ('project','client','dm') -- every DM insert was silently rejected and
-- fell through to sendTeamChatMessage's client-only optimistic fallback,
-- meaning DM messages were never actually persisted. The app code in this
-- same PR now writes 'dm' consistently; this migration widens the
-- constraint to also accept the new 'topic' channel kind.

ALTER TABLE public.team_chat_messages DROP CONSTRAINT IF EXISTS team_chat_messages_channel_type_check;
ALTER TABLE public.team_chat_messages ADD CONSTRAINT team_chat_messages_channel_type_check
    CHECK (channel_type IN ('project', 'client', 'dm', 'topic'));

ALTER TABLE public.team_chat_messages
    ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.team_chat_messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS team_chat_messages_parent_idx ON public.team_chat_messages (parent_message_id);

-- Table: team_chat_reactions
CREATE TABLE IF NOT EXISTS public.team_chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT team_chat_reactions_unique UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS team_chat_reactions_message_idx ON public.team_chat_reactions (message_id);

ALTER TABLE public.team_chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_chat_reactions_select" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_select" ON public.team_chat_reactions FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR public.member_can(auth.uid(), 'view_chat') OR user_id = auth.uid());

DROP POLICY IF EXISTS "team_chat_reactions_insert" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_insert" ON public.team_chat_reactions FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "team_chat_reactions_delete" ON public.team_chat_reactions;
CREATE POLICY "team_chat_reactions_delete" ON public.team_chat_reactions FOR DELETE TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- Table: team_chat_mentions (an "unread mentions" indicator -- neither the
-- dead `alerts` table nor `push_subscriptions` retain any read state)
CREATE TABLE IF NOT EXISTS public.team_chat_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.team_chat_messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_chat_mentions_user_idx ON public.team_chat_mentions (mentioned_user_id, read_at);

ALTER TABLE public.team_chat_mentions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_chat_mentions_select" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_select" ON public.team_chat_mentions FOR SELECT TO authenticated
    USING (mentioned_user_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "team_chat_mentions_insert" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_insert" ON public.team_chat_mentions FOR INSERT TO authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "team_chat_mentions_update" ON public.team_chat_mentions;
CREATE POLICY "team_chat_mentions_update" ON public.team_chat_mentions FOR UPDATE TO authenticated
    USING (mentioned_user_id = auth.uid());
