import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { fetchInstagramProfile } from '@/lib/services/apify-instagram';

const RequestSchema = z.object({
  input: z.string().trim().min(1, 'Lien ou identifiant requis').max(300),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'instagram-fetch', 15, 60_000);
  if (limited) {
    return NextResponse.json(
      { error: 'Trop de requêtes, veuillez réessayer dans quelques instants.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format de requête invalide.' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Paramètre manquant.' },
      { status: 400 }
    );
  }

  try {
    const profile = await fetchInstagramProfile(parsed.data.input);
    return NextResponse.json({ success: true, data: profile });
  } catch (error: any) {
    const message = error?.message || 'Erreur lors de la récupération du compte Instagram.';
    console.error('[API /api/instagram/fetch] Error:', message);

    if (message.includes('APIFY_API_KEY_MISSING')) {
      return NextResponse.json(
        {
          error: 'Le service d\'import Instagram nécessite la clé APIFY_API_KEY.',
          code: 'APIFY_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
