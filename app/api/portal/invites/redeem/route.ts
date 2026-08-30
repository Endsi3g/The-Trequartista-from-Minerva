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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json({ success: false, error: 'Token ou identifiant utilisateur manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch the invite
    const { data: invite, error: fetchErr } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token.trim())
      .maybeSingle();

    if (fetchErr || !invite) {
      return NextResponse.json({ success: false, error: 'Invitation introuvable' }, { status: 404 });
    }

    if (invite.used_at) {
      return NextResponse.json({ success: false, error: 'Invitation déjà utilisée' }, { status: 410 });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Invitation expirée' }, { status: 410 });
    }

    // 2. Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: 'client',
        client_id: invite.client_id,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('[API Client Invite Redeem] Error updating profile:', profileError);
      return NextResponse.json({ success: false, error: 'Erreur mise à jour profil' }, { status: 500 });
    }

    // 3. Mark invite as used
    await supabase
      .from('client_invites')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('token', token.trim());

    return NextResponse.json({
      success: true,
      clientId: invite.client_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
