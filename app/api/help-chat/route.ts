import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireTeamMember } from '@/lib/server/permissions';
import { getGeminiClient, GEMINI_MODEL, GEMINI_NOT_CONFIGURED_ERROR, generateGeminiText } from '@/lib/services/gemini';
import { findRelevantSops, buildHelpChatPrompt, HELP_CHAT_SYSTEM_INSTRUCTION, HELP_CHAT_TOOL_DECLARATIONS, executeHelpChatTool } from '@/lib/services/help-chat';
import type { AcademySOP } from '@/lib/types';
import type { Content } from '@google/genai';

// 1:1 AI help chatbot -- powers both /help's own flat Q&A log and the
// floating AI assistant panel (components/shell/AiAssistantSpeedDial.tsx).
// Grounded in the rebuilt Academy content (chantier 3). Same lazy-client /
// explicit 501 pattern as app/api/audits/[id]/extract/route.ts, but Gemini
// rather than Claude per an explicit product decision (see
// lib/services/gemini.ts).
//
// `conversationId` is optional and distinguishes the two callers: /help's
// page never sends the key at all, so its rows keep conversation_id NULL
// and history stays flat exactly as before chantier "assistant panel v2".
// The floating panel always sends the key -- a string to continue an
// existing conversation, or `null` to start a fresh one (which gets
// auto-titled from the first message).
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

  // Image/PDF attachment from the AI panel's "+" button. The URL is
  // client-supplied, so it's only ever fetched server-side if it points at
  // our own Storage bucket -- anything else is ignored rather than fetched,
  // to avoid this route being usable as an open SSRF proxy.
  let attachmentPart: { inlineData: { data: string; mimeType: string } } | null = null;
  const attachmentUrl = typeof body?.attachmentUrl === 'string' ? body.attachmentUrl : null;
  const attachmentMimeType = typeof body?.attachmentMimeType === 'string' ? body.attachmentMimeType : '';
  const trustedAttachmentPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/team-chat-media/ai-assistant/`;
  const isSupportedAttachmentType = attachmentMimeType.startsWith('image/') || attachmentMimeType === 'application/pdf';
  if (attachmentUrl && isSupportedAttachmentType && attachmentUrl.startsWith(trustedAttachmentPrefix)) {
    try {
      const fileRes = await fetch(attachmentUrl);
      if (fileRes.ok) {
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        // Gemini's inline-data limit is well under this; a generous cap
        // here just avoids sending something clearly oversized.
        if (buffer.byteLength <= 15 * 1024 * 1024) {
          attachmentPart = { inlineData: { data: buffer.toString('base64'), mimeType: attachmentMimeType } };
        }
      }
    } catch (err) {
      console.warn('[help-chat] Could not fetch attachment for Gemini:', err);
    }
  }

  const isConversationAware = !!body && Object.prototype.hasOwnProperty.call(body, 'conversationId');
  let conversationId: string | null = isConversationAware && typeof body.conversationId === 'string' ? body.conversationId : null;
  let isNewConversation = false;
  // Flips to false if `ai_conversations`/`conversation_id` isn't deployed
  // yet (the migration ships in this same PR but needs a manual
  // `npm run deploy:supabase` run) -- degrades to the flat /help history
  // instead of failing the whole request or writing to a column that
  // doesn't exist.
  let conversationsSupported = isConversationAware;

  if (isConversationAware && !conversationId) {
    const { data: created, error: createErr } = await authed
      .from('ai_conversations')
      .insert([{ user_id: guard.user.id, title: 'Nouvelle discussion' }])
      .select('id')
      .single();
    if (createErr) {
      if (!isMissingSchemaError(createErr)) {
        return NextResponse.json({ error: 'Impossible de créer la conversation.' }, { status: 500 });
      }
      conversationsSupported = false;
    } else if (created) {
      conversationId = created.id;
      isNewConversation = true;
    }
  }

  const { data: sops } = await authed.from('academy_sops').select('*');

  let historyRows: { role: string; content: string }[] = [];
  if (conversationsSupported && conversationId && !isNewConversation) {
    const { data } = await authed
      .from('help_chat_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(6);
    historyRows = data || [];
  } else if (!conversationsSupported) {
    const { data } = await authed
      .from('help_chat_messages')
      .select('role, content')
      .eq('user_id', guard.user.id)
      .order('created_at', { ascending: false })
      .limit(6);
    historyRows = data || [];
  }

  const relevantSops = findRelevantSops((sops || []) as AcademySOP[], message);
  const history = (historyRows as { role: 'user' | 'assistant'; content: string }[]).reverse();
  const prompt = buildHelpChatPrompt(message, relevantSops, history);

  // Static role/rules/app-context text lives in systemInstruction instead
  // of being concatenated into `contents` on every call -- identical bytes
  // on every request, so the API can treat it as a stable, reusable prefix
  // rather than fresh input tokens each time (the main token-efficiency
  // lever available here; formal explicit context caching isn't practical
  // at this content's size).
  const toolConfig = {
    systemInstruction: HELP_CHAT_SYSTEM_INSTRUCTION,
    tools: [{ functionDeclarations: HELP_CHAT_TOOL_DECLARATIONS }],
  };
  // Genuinely distinct from GEMINI_MODEL -- a model-specific outage (as
  // opposed to a transient error retried on the same model) needs a
  // different model id to actually fall back to anything.
  const models = [GEMINI_MODEL, 'gemini-3.7-flash'];

  let answer = '';
  let lastErr: unknown = null;
  for (const model of models) {
    try {
      let contents: Content[] = [
        { role: 'user', parts: attachmentPart ? [{ text: prompt }, attachmentPart] : [{ text: prompt }] },
      ];
      let response = await client.models.generateContent({ model, contents, config: toolConfig });

      // At most one tool round-trip: enough for "search then answer" or
      // "create then confirm" without letting the model loop indefinitely
      // (and without paying for a second call on the common no-tool path).
      if (response.functionCalls && response.functionCalls.length > 0) {
        const modelTurn = response.candidates?.[0]?.content;
        const functionResponseParts = await Promise.all(
          response.functionCalls.map(async (call) => {
            const result = await executeHelpChatTool(authed, guard.user.id, call.name || '', call.args || {});
            return { functionResponse: { name: call.name, response: result } };
          })
        );
        contents = [...contents, ...(modelTurn ? [modelTurn] : []), { role: 'user', parts: functionResponseParts }];
        response = await client.models.generateContent({ model, contents, config: toolConfig });
      }

      answer = response.text?.trim() || "Je n'ai pas pu générer de réponse -- reformule ta question ou demande directement à l'équipe via /chat.";
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!answer) {
    console.error('[help-chat] Gemini call failed on all models:', lastErr);
    return NextResponse.json({ error: "L'IA n'a pas pu répondre pour l'instant. Réessaie dans un moment." }, { status: 502 });
  }

  const userMessageRow: Record<string, unknown> = { user_id: guard.user.id, role: 'user', content: message };
  const assistantMessageRow: Record<string, unknown> = { user_id: guard.user.id, role: 'assistant', content: answer };
  if (conversationsSupported) {
    userMessageRow.conversation_id = conversationId;
    assistantMessageRow.conversation_id = conversationId;
  }
  await authed.from('help_chat_messages').insert([userMessageRow, assistantMessageRow]);

  let title: string | undefined;
  if (conversationsSupported && conversationId) {
    if (isNewConversation) {
      title = await generateGeminiText(
        `Résume ce message en un titre de conversation ultra-court (3-6 mots, en français, pas de ponctuation finale) : "${message}"`,
        message.slice(0, 40)
      );
      await authed.from('ai_conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', conversationId);
    } else {
      await authed.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
    }
  }

  return NextResponse.json({
    answer,
    sources: relevantSops.map((s) => ({ id: s.id, title: s.title })),
    ...(conversationsSupported ? { conversationId, title } : {}),
  });
}

// PostgREST/Postgres error signature for a table or column that doesn't
// exist yet -- distinguishes "the ai_conversations migration hasn't been
// deployed" (degrade gracefully) from a real database error (surface it).
function isMissingSchemaError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === '42P01' || error.code === '42703') return true;
  const message = error.message || '';
  return message.includes('does not exist') || message.includes('schema cache');
}
