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
    const { token, userId, phone, instagramUrl } = body;

    if (!token || !userId) {
      return NextResponse.json({ success: false, error: 'Token ou identifiant utilisateur manquant' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch the invite
    const { data: invite, error: fetchErr } = await supabase
      .from('team_invites')
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

    // 2. Prepare profile updates
    const workspaceTarget = invite.workspace || (invite.department?.toLowerCase().includes('tech') ? 'tech' : null);
    const profileUpdate: Record<string, unknown> = {
      role: invite.role || 'member',
      department: invite.department,
      custom_role_id: invite.custom_role_id,
      workspace: workspaceTarget,
    };
    // Only ever set when actively filled -- avoids a 400 on the whole save
    // if the `phone`/`instagram_url` migration hasn't landed live yet
    // (same pattern as addClient/updateClient's optional-field stripping).
    if (phone) profileUpdate.phone = phone;
    if (instagramUrl) profileUpdate.instagram_url = instagramUrl;

    // 3. Update profile with resilient retry if workspace constraint check fails
    let { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (profileError && (profileError.code === '23514' || profileError.message?.includes('workspace_check'))) {
      delete profileUpdate.workspace;
      const retryRes = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
      profileError = retryRes.error;
    }

    // If the phone/instagram columns themselves aren't live yet, retry
    // once without them rather than failing the whole invite redemption.
    if (profileError && (profileError.code === 'PGRST204' || profileError.message?.includes('phone') || profileError.message?.includes('instagram_url'))) {
      delete profileUpdate.phone;
      delete profileUpdate.instagram_url;
      const retryRes = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
      profileError = retryRes.error;
    }

    if (profileError) {
      console.error('[API Team Invite Redeem] Error updating profile:', profileError);
      return NextResponse.json({ success: false, error: 'Erreur mise à jour profil' }, { status: 500 });
    }

    // 4. Mark invite as used
    await supabase
      .from('team_invites')
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq('token', token.trim());

    // 5. Translate custom role permissions if applicable
    if (invite.custom_role_id) {
      try {
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('id', invite.custom_role_id)
          .maybeSingle();

        if (roleData && roleData.permissions && Array.isArray(roleData.permissions)) {
          const rows = roleData.permissions.map((action_key: string) => ({
            user_id: userId,
            action_key,
            granted: true,
          }));
          await supabase.from('app_permissions').delete().eq('user_id', userId);
          if (rows.length > 0) {
            await supabase.from('app_permissions').insert(rows);
          }
        }
      } catch (permErr) {
        console.warn('[API Team Invite Redeem] Could not sync custom role permissions:', permErr);
      }
    }

    return NextResponse.json({
      success: true,
      workspace: workspaceTarget,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
