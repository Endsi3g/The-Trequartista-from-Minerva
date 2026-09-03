import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`;
}

const OPT_OUT_KEYWORDS = ['stop', 'stopall', 'unsubscribe', 'cancel', 'end', 'quit', 'arret', 'arrêt', 'refuser'];

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let from = '';
    let body = '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      from = (formData.get('From') as string) || '';
      body = (formData.get('Body') as string) || '';
    } else {
      const json = await req.json().catch(() => ({}));
      from = json.From || json.from || '';
      body = json.Body || json.body || '';
    }

    const cleanBody = body.trim().toLowerCase();
    const isOptOut = OPT_OUT_KEYWORDS.some((kw) => cleanBody === kw || cleanBody.startsWith(`${kw} `));

    if (isOptOut && from) {
      const normalizedPhone = normalizePhone(from);
      const supabase = getSupabase();

      // Trouver les leads correspondants
      const { data: matchedLeads } = await supabase
        .from('leads')
        .select('id, contact_name, company_name')
        .or(`phone.eq.${normalizedPhone},phone.eq.${from}`);

      if (matchedLeads && matchedLeads.length > 0) {
        for (const lead of matchedLeads) {
          await supabase
            .from('leads')
            .update({ consent_sms: false, updated_at: new Date().toISOString() })
            .eq('id', lead.id);

          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'sms_opt_out',
            payload: {
              raw_incoming_body: body,
              from_phone: from,
              received_at: new Date().toISOString(),
            },
          });
        }
      }
    }

    // Réponse TwiML valide
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (err: any) {
    console.error('[Twilio Webhook] Erreur:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
