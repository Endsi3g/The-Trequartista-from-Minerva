import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || !token.trim()) {
      return NextResponse.json({ valid: false, error: 'Token manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: invite, error } = await supabase
      .from('client_invites')
      .select('*, client:clients(name)')
      .eq('token', token.trim())
      .maybeSingle();

    if (error) {
      console.error('[API Client Invite Verify] DB error:', error);
      return NextResponse.json({ valid: false, error: 'Erreur base de données' }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ valid: false, error: 'Invitation introuvable' }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ valid: false, error: 'Cette invitation a déjà été utilisée' }, { status: 410 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Cette invitation a expiré' }, { status: 410 });
    }

    const clientName = (invite as any).client?.name || 'Client';

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        token: invite.token,
        client_id: invite.client_id,
        client_name: clientName,
        expires_at: invite.expires_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
