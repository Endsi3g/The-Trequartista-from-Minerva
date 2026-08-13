import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { scheduleDelayedCallback } from '@/lib/services/qstash';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const Step1Schema = z.object({
  firstName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(30),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`; // assume North American number
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  // No shared secret is possible here -- a Framer form is a browser POST
  // with no server-side session, so anything embedded in the published
  // site's JS is inherently public. Rate limiting is the only practical
  // abuse guard for this endpoint.
  const ip = getClientIp(req);
  const { limited, retryAfterSeconds } = checkRateLimit(ip, 'leads-step-1', 10, 60_000);
  if (limited) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429, headers: { ...headers, 'Retry-After': String(retryAfterSeconds) } });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers });
  }

  const parsed = Step1Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Champs invalides', details: parsed.error.flatten() }, { status: 400, headers });
  }

  const phone = normalizePhone(parsed.data.phone);

  const { data: lead, error } = await supabase
    .from('intake_leads')
    .insert([{ first_name: parsed.data.firstName, phone, status: 'step1_abandoned', source: 'framer' }])
    .select('id')
    .single();

  if (error || !lead) {
    console.error('[leads/step-1] Insert error:', error);
    return NextResponse.json({ error: "Impossible d'enregistrer ce lead." }, { status: 500, headers });
  }

  // Best-effort: schedule the 5-minute SMS follow-up via QStash. A missing
  // QSTASH_TOKEN degrades honestly (recorded, not silently dropped) rather
  // than pretending a follow-up is coming.
  const { scheduled, error: scheduleError } = await scheduleDelayedCallback(
    '/api/leads/sms-followup-callback',
    { intakeLeadId: lead.id },
    300
  );
  if (!scheduled) {
    console.warn('[leads/step-1] SMS follow-up not scheduled:', scheduleError);
    await supabase.from('intake_leads').update({ sms_follow_up_status: 'skipped_no_config' }).eq('id', lead.id);
  }

  return NextResponse.json({ leadId: lead.id }, { status: 201, headers });
}
