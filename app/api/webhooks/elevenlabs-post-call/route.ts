import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyElevenLabsWebhookSignature } from '@/lib/services/elevenlabs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseSecret);

export const runtime = 'nodejs';

// Receives the ElevenLabs post-call webhook for the "Minerva Agent" (Alex)
// -- must be configured in the ElevenLabs dashboard (Agent → Webhooks) with
// this route's public URL, and ELEVENLABS_WEBHOOK_SECRET set to whatever
// signing secret that dashboard screen generates. The exact payload shape
// below (data_collection_results) is ElevenLabs' documented structure for
// post-call transcript webhooks as of 2026-08 -- worth re-verifying against
// a real payload the first time a call actually completes, since this has
// not been exercised against a live webhook yet.
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('elevenlabs-signature');

  if (!verifyElevenLabsWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Signature invalide ou webhook non configuré.' }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: {
      conversation_id?: string;
      analysis?: {
        data_collection_results?: Record<string, { value?: unknown } | unknown>;
      };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON invalide.' }, { status: 400 });
  }

  const results = payload.data?.analysis?.data_collection_results;
  if (!results) {
    // Not every webhook event carries collected data (e.g. a call that
    // never got past the opener) -- ack without creating a lead.
    return NextResponse.json({ received: true, skipped: 'no_data_collection_results' });
  }

  const getValue = (key: string): string | null => {
    const entry = results[key] as { value?: unknown } | undefined;
    const v = entry?.value;
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const getBool = (key: string): boolean => {
    const entry = results[key] as { value?: unknown } | undefined;
    return entry?.value === true || entry?.value === 'true';
  };

  const prospectName = getValue('prospect_name');
  const prospectPhone = getValue('prospect_phone_number');
  if (!prospectName || !prospectPhone) {
    return NextResponse.json({ received: true, skipped: 'missing_name_or_phone' });
  }

  const discoveryCallScheduled = getBool('discovery_call_scheduled');

  const { error } = await supabase.from('intake_leads').insert({
    first_name: prospectName,
    phone: prospectPhone,
    email: getValue('prospect_email'),
    source: 'elevenlabs_voice',
    status: discoveryCallScheduled ? 'qualified' : 'step1_abandoned',
    qualification_data: {
      business_type: getValue('business_type'),
      service_requested: getValue('project_need'),
      discovery_call_scheduled: discoveryCallScheduled,
      elevenlabs_conversation_id: payload.data?.conversation_id ?? null,
    },
  });

  if (error) {
    console.error('[elevenlabs-post-call] insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, created: true });
}
