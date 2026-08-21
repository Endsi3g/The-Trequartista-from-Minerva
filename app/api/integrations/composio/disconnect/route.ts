import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { disconnectConnection } from '@/lib/services/composio';
import { requireAdmin } from '@/lib/server/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;

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
