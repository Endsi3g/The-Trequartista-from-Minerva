-- Conversation history + auto-titling for the floating AI assistant panel
-- (components/shell/AiAssistantSpeedDial.tsx). Additive on top of the
-- existing flat help_chat_messages table (chantier 6) -- /help's own Q&A
-- UI keeps working unchanged (it never sends a conversationId, so its rows
-- keep conversation_id NULL and its history stays flat, exactly as before).
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nouvelle discussion',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_idx ON public.ai_conversations (user_id, updated_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_conversations_select" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select" ON public.ai_conversations FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "ai_conversations_insert" ON public.ai_conversations;
CREATE POLICY "ai_conversations_insert" ON public.ai_conversations FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_conversations_update" ON public.ai_conversations;
CREATE POLICY "ai_conversations_update" ON public.ai_conversations FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

ALTER TABLE public.help_chat_messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS help_chat_messages_conversation_idx ON public.help_chat_messages (conversation_id, created_at);
