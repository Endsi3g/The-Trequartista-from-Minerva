import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Granola transcript auto-fetch via Composio. NOT wired to a live call yet:
// the Composio tools available interactively (GRANOLA_MCP_GET_MEETING_TRANSCRIPT
// etc.) are exposed through an MCP/agent session, and whether Composio's
// separate server SDK (composio-core / @composio/client) can call the same
// actions non-interactively from a plain Vercel function, with this
// project's connected Granola account, has not been verified against a
// real meeting ID -- that spike needs to happen before this can go live.
// Manual paste (PATCH /api/audits/[id] via updateAudit) is the supported
// path in the meantime and always works regardless of this endpoint.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: auditId } = await params;
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const { data: profile } = await authed.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux administrateurs.' }, { status: 403 });
  }

  const composioKey = process.env.COMPOSIO_API_KEY;
  if (!composioKey) {
    return NextResponse.json(
      {
        error: "La récupération automatique via Granola n'est pas encore configurée sur cet environnement (COMPOSIO_API_KEY manquante, et l'appel serveur Composio→Granola n'a pas encore été validé). Collez la transcription manuellement en attendant.",
      },
      { status: 501 }
    );
  }

  // Placeholder for when the spike above is done and COMPOSIO_API_KEY is
  // real: call Composio's server SDK here to run
  // GRANOLA_MCP_GET_MEETING_TRANSCRIPT for this audit's linked meeting,
  // then persist via authed.from('audits').update({ transcript_raw, transcript_source: 'granola', transcript_fetched_at }).eq('id', auditId).
  void auditId;
  return NextResponse.json({ error: 'Intégration Granola non implémentée.' }, { status: 501 });
}
