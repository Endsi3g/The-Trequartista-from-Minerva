import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { COMPOSIO_APPS, fetchConnectionStatuses } from '@/lib/services/composio';

export const runtime = 'nodejs';

export async function GET() {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { statuses, error } = await fetchConnectionStatuses();
  return NextResponse.json({ apps: COMPOSIO_APPS, statuses, error: error ?? null });
}
