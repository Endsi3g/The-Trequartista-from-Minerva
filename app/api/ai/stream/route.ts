import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireTeamMember } from '@/lib/server/permissions';
import { getGeminiClient, GEMINI_MODEL, GEMINI_NOT_CONFIGURED_ERROR } from '@/lib/services/gemini';
import { buildAiPrompt, logAiGeneration, type NotionAiStreamRequest } from '@/lib/services/ai-stream';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authed = await createServerClient();
  const guard = await requireTeamMember(authed);
  if (guard.error) return guard.error;

  const client = getGeminiClient();
  if (!client) {
    return NextResponse.json({ error: GEMINI_NOT_CONFIGURED_ERROR }, { status: 501 });
  }

  let body: NotionAiStreamRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide.' }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ error: 'Action IA manquante.' }, { status: 400 });
  }

  const promptText = buildAiPrompt(body);
  const inputLength = promptText.length;
  let fullOutput = '';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let responseStream;
        try {
          responseStream = await client.models.generateContentStream({
            model: GEMINI_MODEL,
            contents: promptText,
          });
        } catch (initialErr) {
          console.warn(`[Notion AI] ${GEMINI_MODEL} stream failed, attempting fallback:`, initialErr);
          responseStream = await client.models.generateContentStream({
            model: 'gemini-3.6-flash',
            contents: promptText,
          });
        }

        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          if (text) {
            fullOutput += text;
            const sseEvent = `data: ${JSON.stringify({ text, done: false })}\n\n`;
            controller.enqueue(encoder.encode(sseEvent));
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: '', done: true })}\n\n`));
        controller.close();

        const durationMs = Date.now() - startTime;
        logAiGeneration({
          userId: guard.user.id,
          workspace: body.workspace,
          action: body.action,
          promptPreview: body.prompt || body.customInstruction || body.action,
          inputLength,
          outputLength: fullOutput.length,
          durationMs,
          status: 'success',
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Erreur streaming IA inconnue.';
        console.error('[Notion AI] Stream error:', err);
        const sseError = `data: ${JSON.stringify({ error: errorMsg, done: true })}\n\n`;
        controller.enqueue(encoder.encode(sseError));
        controller.close();

        const durationMs = Date.now() - startTime;
        logAiGeneration({
          userId: guard.user.id,
          workspace: body.workspace,
          action: body.action,
          promptPreview: body.prompt || body.customInstruction || body.action,
          inputLength,
          outputLength: fullOutput.length,
          durationMs,
          status: 'error',
          errorMessage: errorMsg,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
