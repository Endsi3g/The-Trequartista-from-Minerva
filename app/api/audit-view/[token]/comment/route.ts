import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Lazily instantiated -- see audit-view/[token]/route.ts for why.
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const CommentSchema = z.object({
  targetType: z.enum(['process_step', 'cost_item', 'initiative', 'general']),
  targetId: z.string().uuid().optional(),
  author: z.string().trim().min(1).max(120).default('Client'),
  body: z.string().trim().min(1).max(2000),
});

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = getSupabase();
  const { token } = await params;
  const ip = getClientIp(req);
  const { limited } = checkRateLimit(ip, `audit-comment-${token}`, 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429 });
  }

  const { data: audit } = await supabase.from('audits').select('id, view_token_expires_at').eq('view_token', token).maybeSingle();
  if (!audit || (audit.view_token_expires_at && new Date(audit.view_token_expires_at) < new Date())) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 });
  }

  const parsed = CommentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides.' }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from('audit_comments')
    .insert([{ audit_id: audit.id, target_type: parsed.data.targetType, target_id: parsed.data.targetId ?? null, author: parsed.data.author, body: parsed.data.body }])
    .select()
    .single();

  if (error || !comment) {
    return NextResponse.json({ error: "Impossible d'enregistrer le commentaire." }, { status: 500 });
  }

  return NextResponse.json({ comment });
}
