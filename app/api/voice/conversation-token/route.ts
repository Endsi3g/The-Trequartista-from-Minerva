import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getConversationToken } from '@/lib/services/elevenlabs';

export const runtime = 'nodejs';

export async function GET() {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { token, error } = await getConversationToken();
  if (error || !token) {
    return NextResponse.json({ error: error ?? 'Erreur inconnue' }, { status: 502 });
  }

  return NextResponse.json({ token });
}
