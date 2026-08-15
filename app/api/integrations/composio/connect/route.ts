import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { initiateConnection } from '@/lib/services/composio';

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
  const toolkitSlug = body?.toolkit as string | undefined;
  if (!toolkitSlug) {
    return NextResponse.json({ error: 'Paramètre "toolkit" manquant.' }, { status: 400 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { redirectUrl, error } = await initiateConnection(toolkitSlug, `${origin}/integrations`);

  if (error || !redirectUrl) {
    return NextResponse.json({ error: error ?? 'Aucune URL de redirection reçue.' }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl });
}
