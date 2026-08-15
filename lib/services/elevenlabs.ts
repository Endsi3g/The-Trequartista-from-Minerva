import crypto from 'node:crypto';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io';

export function getElevenLabsConfig(): { apiKey: string; agentId: string } | { error: string } {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return { error: 'ElevenLabs non configuré (ELEVENLABS_API_KEY / ELEVENLABS_AGENT_ID manquants)' };
  }
  return { apiKey, agentId };
}

// Mints a short-lived WebRTC conversation token server-side so the raw
// ElevenLabs API key never reaches the browser -- the widget calls
// startSession({ conversationToken }) with this instead of an agentId.
export async function getConversationToken(): Promise<{ token: string | null; error?: string }> {
  const config = getElevenLabsConfig();
  if ('error' in config) return { token: null, error: config.error };

  const res = await fetch(
    `${ELEVENLABS_API_BASE}/v1/convai/conversation/token?agent_id=${encodeURIComponent(config.agentId)}`,
    { headers: { 'xi-api-key': config.apiKey } }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { token: null, error: `ElevenLabs a refusé la demande (${res.status}): ${errText}` };
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    return { token: null, error: 'Aucun jeton reçu de ElevenLabs.' };
  }
  return { token: data.token };
}

// ElevenLabs signs post-call webhooks as `t=<unix>,v0=<hmac>` over
// `${timestamp}.${rawBody}` with the workspace webhook secret (HMAC-SHA256).
export function verifyElevenLabsWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const providedSig = parts.v0;
  if (!timestamp || !providedSig) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(providedSig);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
