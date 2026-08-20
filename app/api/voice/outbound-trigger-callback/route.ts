import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initiateOutboundCall } from '@/lib/services/elevenlabs';

// Lazily instantiated -- see leads/step-1/route.ts for why.
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Called by QStash after a lead is qualified (see app/api/leads/step-2/route.ts,
// which schedules this via lib/services/qstash.ts) -- same shared-secret
// verification pattern as app/api/leads/sms-followup-callback/route.ts.
export async function POST(req: Request) {
  const supabase = getSupabase();
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { intakeLeadId } = await req.json();
  if (!intakeLeadId) {
    return NextResponse.json({ error: 'intakeLeadId requis' }, { status: 400 });
  }

  const { data: lead, error } = await supabase
    .from('intake_leads')
    .select('id, first_name, phone, status, voice_follow_up_status')
    .eq('id', intakeLeadId)
    .maybeSingle();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 });
  }

  // Race guard: the lead may have converted (or been discarded) in the
  // 5+ minutes since qualification.
  if (lead.status === 'converted' || lead.status === 'discarded') {
    await supabase.from('intake_leads').update({ voice_follow_up_status: 'skipped_converted' }).eq('id', lead.id);
    return NextResponse.json({ skipped: true, reason: 'already_converted_or_discarded' });
  }

  if (lead.voice_follow_up_status === 'sent') {
    return NextResponse.json({ skipped: true, reason: 'already_sent' });
  }

  const { data: config } = await supabase
    .from('voice_agent_config')
    .select('auto_trigger_enabled')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!config?.auto_trigger_enabled) {
    await supabase.from('intake_leads').update({ voice_follow_up_status: 'skipped_disabled' }).eq('id', lead.id);
    return NextResponse.json({ skipped: true, reason: 'auto_trigger_disabled' });
  }

  const { conversationId, error: callError } = await initiateOutboundCall(lead.phone, {
    intake_lead_id: lead.id,
    first_name: lead.first_name,
  });

  await supabase
    .from('intake_leads')
    .update({ voice_follow_up_status: conversationId ? 'sent' : callError?.includes('non configuré') ? 'skipped_no_config' : 'failed' })
    .eq('id', lead.id);

  if (!conversationId) {
    console.error('[voice/outbound-trigger-callback] ElevenLabs outbound call failed:', callError);
    return NextResponse.json({ sent: false, error: callError }, { status: 502 });
  }

  return NextResponse.json({ sent: true, conversationId });
}
