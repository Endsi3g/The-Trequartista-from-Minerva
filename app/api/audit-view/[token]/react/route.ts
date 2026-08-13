import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ReactSchema = z.object({
  initiativeId: z.string().uuid(),
  reaction: z.enum(['interested', 'not_priority']),
});

async function resolveAudit(token: string) {
  const { data } = await supabase.from('audits').select('id, view_token_expires_at').eq('view_token', token).maybeSingle();
  if (!data) return null;
  if (data.view_token_expires_at && new Date(data.view_token_expires_at) < new Date()) return null;
  return data;
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip = getClientIp(req);
  const { limited } = checkRateLimit(ip, `audit-react-${token}`, 30, 60_000);
  if (limited) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  }

  const audit = await resolveAudit(token);
  if (!audit) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
  }

  const parsed = ReactSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides.' }, { status: 400 });
  }

  // Confirm the initiative actually belongs to this audit -- the token
  // only authorizes acting on findings within its own audit.
  const { data: initiative } = await supabase.from('audit_initiatives').select('id').eq('id', parsed.data.initiativeId).eq('audit_id', audit.id).maybeSingle();
  if (!initiative) {
    return NextResponse.json({ error: 'Initiative introuvable pour cet audit.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('audit_initiative_reactions')
    .upsert({ initiative_id: parsed.data.initiativeId, reaction: parsed.data.reaction }, { onConflict: 'initiative_id' });

  if (error) {
    return NextResponse.json({ error: "Impossible d'enregistrer la réaction." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
