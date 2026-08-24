import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { fetchLinkPreview } from '@/lib/services/link-preview';

export const runtime = 'nodejs';

// Server-side so YOUTUBE_API_KEY never reaches the browser and so the
// client never hits oEmbed endpoints directly (avoids CORS surprises).
export async function GET(req: Request) {
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const url = new URL(req.url).searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url requis' }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);
  return NextResponse.json(preview);
}
