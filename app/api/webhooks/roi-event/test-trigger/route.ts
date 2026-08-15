import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Lets an admin trigger a REAL call to /api/webhooks/roi-event from the
// Integrations page without exposing CENTURIONS_WEBHOOK_SECRET to the
// browser -- this route holds the secret server-side and forwards a
// correctly-shaped request, then relays the real response back.
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

  const { clientId } = await req.json().catch(() => ({ clientId: null }));
  if (!clientId) {
    return NextResponse.json({ error: 'clientId manquant' }, { status: 400 });
  }

  const secret = process.env.CENTURIONS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CENTURIONS_WEBHOOK_SECRET non configuré côté serveur.' }, { status: 500 });
  }

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${origin}/api/webhooks/roi-event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      clientId,
      eventType: 'lead.created',
      data: {},
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
