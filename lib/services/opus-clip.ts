import crypto from 'crypto';

// OpusClip API — turns a long-form video into short clips. Direct REST,
// no SDK (same pattern as Twilio/Brevo/Calendly). Requires a Pro/Max/
// Business plan for API access; 1 credit = 1 minute of source video,
// 10-credit minimum per project. Docs: https://help.opus.pro/api-reference
//
// Field names below (project id location, "Get Clips" response shape) are
// best-effort against OpusClip's public docs -- their schema pages didn't
// fully render for us to confirm exact field names, so this is worth
// re-verifying against a real response the first time a project actually
// completes (same caveat already accepted for the ElevenLabs webhook in
// this codebase; see lib/services/elevenlabs.ts).
const OPUS_API_BASE = 'https://api.opus.pro/api';

function getApiKey(): string {
  const key = process.env.OPUS_CLIP_API_KEY;
  if (!key) {
    throw new Error('Opus Clip non configuré : la variable OPUS_CLIP_API_KEY est manquante.');
  }
  return key;
}

export async function createOpusClipProject(
  videoUrl: string,
  title: string,
  webhookUrl: string
): Promise<{ projectId: string } | { error: string }> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Opus Clip non configuré' };
  }

  try {
    const res = await fetch(`${OPUS_API_BASE}/clip-projects`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        uploadedVideoAttr: { title },
        conclusionActions: [{ type: 'WEBHOOK', url: webhookUrl, notifyFailure: true }],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `Opus Clip a refusé la demande (${res.status}) : ${text || res.statusText}` };
    }
    const data = await res.json();
    const projectId: string | undefined = data?.id ?? data?.projectId ?? data?.project_id ?? data?.project?.id;
    if (!projectId) {
      return { error: 'Réponse Opus Clip inattendue : identifiant de projet introuvable.' };
    }
    return { projectId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur réseau vers Opus Clip.' };
  }
}

export interface OpusClipResult {
  id: string;
  title: string;
  videoUrl: string;
}

// "Get Clips" endpoint path is a reasonable extrapolation from the
// documented /api/clip-projects creation endpoint -- confirm against a
// real project once OPUS_CLIP_API_KEY is set and a first project runs.
export async function fetchOpusClipClips(projectId: string): Promise<{ clips: OpusClipResult[] } | { error: string }> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Opus Clip non configuré' };
  }

  try {
    const res = await fetch(`${OPUS_API_BASE}/clip-projects/${projectId}/clips`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { error: `Opus Clip : impossible de récupérer les clips (${res.status}) : ${text || res.statusText}` };
    }
    const data = await res.json();
    const list: unknown[] = Array.isArray(data) ? data : (data?.clips ?? data?.items ?? []);
    const clips: OpusClipResult[] = list
      .map((raw): OpusClipResult | null => {
        const c = raw as Record<string, unknown>;
        const id = (c.id ?? c.clipId) as string | undefined;
        const videoUrl = (c.videoUrl ?? c.downloadUrl ?? c.renderUrl ?? c.url) as string | undefined;
        if (!id || !videoUrl) return null;
        return { id, title: (c.title ?? c.name ?? 'Clip Opus') as string, videoUrl };
      })
      .filter((c): c is OpusClipResult => c !== null);
    return { clips };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Erreur réseau vers Opus Clip.' };
  }
}

// Verification per OpusClip's documented scheme: HMAC-SHA256(secret,
// body + salt), constant-time compared. Headers: X-Opus-Signature,
// X-Opus-Salt, X-Opus-Timestamp.
export function verifyOpusClipWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  saltHeader: string | null
): boolean {
  const secret = process.env.OPUS_CLIP_WEBHOOK_SECRET;
  if (!secret || !signatureHeader || !saltHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody + saltHeader).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

// Best-effort extraction of the project id from a completion webhook body
// -- tries every field name shape OpusClip's docs referenced across
// different pages, since the exact webhook payload schema wasn't
// confirmable ahead of a live payload.
export function extractProjectIdFromWebhook(payload: unknown): string | null {
  const p = payload as Record<string, unknown> | null;
  if (!p) return null;
  const direct = p.id ?? p.projectId ?? p.project_id;
  if (typeof direct === 'string') return direct;
  const nested = (p.project as Record<string, unknown> | undefined)?.id;
  if (typeof nested === 'string') return nested;
  const data = (p.data as Record<string, unknown> | undefined);
  if (typeof data?.id === 'string') return data.id as string;
  if (typeof data?.projectId === 'string') return data.projectId as string;
  return null;
}
