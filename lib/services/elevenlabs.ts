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

// Initiates an outbound call from the agent to a lead's phone number via
// ElevenLabs' Twilio-backed outbound-calling endpoint. Requires the agent to
// have a phone number registered in ElevenLabs' dashboard (Agent > Phone
// Numbers) -- ELEVENLABS_AGENT_PHONE_NUMBER_ID. Honest no-op when either the
// base config or the phone number ID is missing, mirroring
// getConversationToken()'s degrade pattern.
export async function initiateOutboundCall(
  toNumber: string,
  clientData?: Record<string, unknown>
): Promise<{ conversationId: string | null; error?: string }> {
  const config = getElevenLabsConfig();
  if ('error' in config) return { conversationId: null, error: config.error };

  const phoneNumberId = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    return { conversationId: null, error: 'ELEVENLABS_AGENT_PHONE_NUMBER_ID non configuré' };
  }

  const res = await fetch(`${ELEVENLABS_API_BASE}/v1/convai/twilio/outbound-call`, {
    method: 'POST',
    headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: config.agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: toNumber,
      ...(clientData ? { conversation_initiation_client_data: clientData } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { conversationId: null, error: `ElevenLabs a refusé l'appel sortant (${res.status}): ${errText}` };
  }

  const data = (await res.json()) as { conversation_id?: string };
  return { conversationId: data.conversation_id ?? null };
}

// Text-to-speech generation for content (Reel voiceovers, etc.) -- returns
// raw MP3 bytes on success. Honest degrade when unconfigured, same pattern
// as the rest of this file.
export async function synthesizeSpeech(
  text: string,
  voiceId: string
): Promise<{ audio: Buffer | null; error?: string }> {
  const config = getElevenLabsConfig();
  if ('error' in config) return { audio: null, error: config.error };

  const res = await fetch(`${ELEVENLABS_API_BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: 'POST',
    headers: { 'xi-api-key': config.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    return { audio: null, error: `ElevenLabs a refusé la synthèse vocale (${res.status}): ${errText}` };
  }

  const arrayBuffer = await res.arrayBuffer();
  return { audio: Buffer.from(arrayBuffer) };
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
