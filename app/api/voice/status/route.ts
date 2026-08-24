import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getElevenLabsConfig } from '@/lib/services/elevenlabs';

export const runtime = 'nodejs';

// Lets the client know whether the voice agent is actually usable, without
// ever leaking the API key itself -- getElevenLabsConfig() stays server-only.
export async function GET() {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const config = getElevenLabsConfig();
  const outboundConfigured = 'error' in config ? false : Boolean(process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID);

  return NextResponse.json({
    configured: !('error' in config),
    outboundConfigured,
  });
}
