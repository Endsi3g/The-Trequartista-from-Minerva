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
      .from('team_invites')
      .select('*')
      .eq('token', token.trim())
      .maybeSingle();

    if (error) {
      console.error('[API Team Invite Verify] DB error:', error);
      return NextResponse.json({ valid: false, error: 'Erreur base de données' }, { status: 500 });
    }

    if (!invite) {
      return NextResponse.json({ valid: false, error: 'Invitation introuvable' }, { status: 404 });
    }

    if (invite.used_at) {
      // Not a dead end -- someone whose account already exists is
      // re-clicking their own (bookmarked) invite link instead of finding
      // the app's real login URL. Hand back who redeemed it so the join
      // page can offer a login form instead of an "invalid link" error.
      let usedByEmail: string | null = null;
      let usedByName: string | null = null;
      if (invite.used_by) {
        const { data: usedByProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', invite.used_by)
          .maybeSingle();
        usedByEmail = usedByProfile?.email ?? null;
        usedByName = usedByProfile?.full_name ?? null;
      }
      return NextResponse.json({
        valid: false,
        used: true,
        usedByEmail,
        usedByName,
        workspace: invite.workspace || (invite.department?.toLowerCase().includes('tech') ? 'tech' : null),
      });
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Cette invitation a expiré' }, { status: 410 });
    }

    let customRoleName: string | null = null;
    if (invite.custom_role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('name')
        .eq('id', invite.custom_role_id)
        .maybeSingle();
      if (roleData) {
        customRoleName = roleData.name;
      }
    }

    return NextResponse.json({
      valid: true,
      invite: {
        id: invite.id,
        token: invite.token,
        role: invite.role,
        department: invite.department,
        custom_role_id: invite.custom_role_id,
        custom_role_name: customRoleName,
        workspace: invite.workspace || (invite.department?.toLowerCase().includes('tech') ? 'tech' : null),
        expires_at: invite.expires_at,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ valid: false, error: message }, { status: 500 });
  }
}
