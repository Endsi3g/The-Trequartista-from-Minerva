-- 1:1 AI help chatbot on /help (chantier 6): a team member asks a question
-- about the app and gets an answer grounded in the rebuilt Academy content
-- (chantier 3), without needing to ask Kael directly. Runs on Gemini, same
-- as Coach Minerva (chantier 5) -- see lib/services/gemini.ts.
--
-- One flat table, not a separate "conversations" table: a member's whole
-- history is just every row with their user_id, ordered by created_at.
-- Kael can see who asked what (no anonymization -- explicit product
-- decision) to spot real gaps in the Academy content.
CREATE TABLE IF NOT EXISTS public.help_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS help_chat_messages_user_idx ON public.help_chat_messages (user_id, created_at);

ALTER TABLE public.help_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "help_chat_messages_select" ON public.help_chat_messages;
CREATE POLICY "help_chat_messages_select" ON public.help_chat_messages FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "help_chat_messages_insert" ON public.help_chat_messages;
CREATE POLICY "help_chat_messages_insert" ON public.help_chat_messages FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());
