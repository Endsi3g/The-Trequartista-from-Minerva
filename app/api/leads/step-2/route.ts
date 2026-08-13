import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// leadId is the robust path (Framer carries the id returned by step-1
// forward into step-2). If the form can't do that, phone is a fallback
// match -- fragile (collisions, resubmissions) but keeps the funnel
// working without requiring Framer-side changes first.
const Step2Schema = z.object({
  leadId: z.string().uuid().optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.string().trim().email(),
}).catchall(z.unknown()).refine((d) => d.leadId || d.phone, {
  message: 'leadId ou phone requis',
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'leads-step-2', 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429, headers: { ...headers, 'Retry-After': String(retryAfterSeconds) } });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers });
  }

  const parsed = Step2Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400, headers });
  }

  const { leadId, phone, email, ...qualificationFields } = parsed.data as Record<string, unknown> & { leadId?: string; phone?: string; email: string };

  let query = supabase.from('intake_leads').select('id, status').limit(1);
  query = leadId ? query.eq('id', leadId) : query.eq('phone', normalizePhone(phone as string)).order('created_at', { ascending: false });

  const { data: matches, error: findError } = await query;
  if (findError || !matches || matches.length === 0) {
    return NextResponse.json({ error: 'Lead introuvable -- soumettez d\'abord l\'Étape 1.' }, { status: 404, headers });
  }

  const target = matches[0];

  const { error: updateError } = await supabase
    .from('intake_leads')
    .update({
      email,
      qualification_data: qualificationFields,
      status: 'qualified',
      qualified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', target.id);

  if (updateError) {
    console.error('[leads/step-2] Update error:', updateError);
    return NextResponse.json({ error: 'Impossible de mettre à jour ce lead.' }, { status: 500, headers });
  }

  return NextResponse.json({ leadId: target.id, status: 'qualified' }, { status: 200, headers });
}
