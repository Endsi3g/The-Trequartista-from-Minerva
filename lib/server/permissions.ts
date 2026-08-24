import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

type Guard = { user: { id: string }; error: null } | { user: null; error: NextResponse };

// Centralizes the "authenticated + admin" check that used to be
// hand-rolled identically across ~9 API routes (fetch user, fetch
// profile.role, compare to 'admin', 401/403). Behavior-preserving --
// same status codes and messages as before, just one implementation.
export async function requireAdmin(supabase: SupabaseClient): Promise<Guard> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return { user: null, error: NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 }) };
  }
  return { user: { id: user.id }, error: null };
}

// Admin-or-member check (opus-clip/create is the one route gated this way
// instead of admin-only -- blocks client-role users, not members).
export async function requireTeamMember(supabase: SupabaseClient): Promise<Guard> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'member') {
    return { user: null, error: NextResponse.json({ error: 'Réservé à l’équipe interne.' }, { status: 403 }) };
  }
  return { user: { id: user.id }, error: null };
}
