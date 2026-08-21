import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { initiateConnection } from '@/lib/services/composio';
import { requireAdmin } from '@/lib/server/permissions';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireAdmin(authed);
  if (guard.error) return guard.error;

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
