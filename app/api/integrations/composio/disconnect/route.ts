import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { disconnectConnection } from '@/lib/services/composio';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: profile } = await authed.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const connectedAccountId = body?.connectedAccountId as string | undefined;
  if (!connectedAccountId) {
    return NextResponse.json({ error: 'Paramètre "connectedAccountId" manquant.' }, { status: 400 });
  }

  const { success, error } = await disconnectConnection(connectedAccountId);
  if (!success) {
    return NextResponse.json({ error: error ?? 'Échec de la déconnexion.' }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
