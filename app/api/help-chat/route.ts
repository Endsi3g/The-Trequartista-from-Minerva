import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireTeamMember } from '@/lib/server/permissions';
import { getGeminiClient, GEMINI_MODEL, GEMINI_NOT_CONFIGURED_ERROR } from '@/lib/services/gemini';
import { findRelevantSops, buildHelpChatPrompt } from '@/lib/services/help-chat';
import type { AcademySOP } from '@/lib/types';

// 1:1 AI help chatbot on /help -- a team member asks a question about the
// app and gets an answer grounded in the rebuilt Academy content (chantier
// 3), without needing to ask Kael directly. Same lazy-client / explicit
// 501 pattern as app/api/audits/[id]/extract/route.ts, but Gemini rather
// than Claude per an explicit product decision (see lib/services/gemini.ts).
export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireTeamMember(authed);
  if (guard.error) return guard.error;

  const client = getGeminiClient();
  if (!client) {
    return NextResponse.json({ error: GEMINI_NOT_CONFIGURED_ERROR }, { status: 501 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  const [{ data: sops }, { data: historyRows }] = await Promise.all([
    authed.from('academy_sops').select('*'),
    authed
      .from('help_chat_messages')
      .select('role, content')
      .eq('user_id', guard.user.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const relevantSops = findRelevantSops((sops || []) as AcademySOP[], message);
  const history = ((historyRows || []) as { role: 'user' | 'assistant'; content: string }[]).reverse();
  const prompt = buildHelpChatPrompt(message, relevantSops, history);

  let answer: string;
  try {
    const response = await client.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    answer = response.text?.trim() || "Je n'ai pas pu générer de réponse -- reformule ta question ou demande directement à l'équipe via /chat.";
  } catch (err) {
    console.error('[help-chat] Gemini call failed:', err);
    return NextResponse.json({ error: "L'IA n'a pas pu répondre pour l'instant. Réessaie dans un moment." }, { status: 502 });
  }

  await authed.from('help_chat_messages').insert([
    { user_id: guard.user.id, role: 'user', content: message },
    { user_id: guard.user.id, role: 'assistant', content: answer },
  ]);

  return NextResponse.json({ answer, sources: relevantSops.map((s) => ({ id: s.id, title: s.title })) });
}
