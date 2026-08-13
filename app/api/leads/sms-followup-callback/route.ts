import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSms } from '@/lib/services/twilio';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Draft copy -- proposed by Claude per the user's "rédige, j'ajusterai"
// answer; edit freely before relying on it in production.
function followUpMessage(firstName: string): string {
  return `Bonjour ${firstName}, ici l'équipe Minerva 👋 On a remarqué que votre demande n'était pas terminée. Une question, un doute ? Répondez directement à ce message, on est là pour vous aider !`;
}

// Called by QStash ~5 minutes after step-1 (see lib/services/qstash.ts).
// Verified with a shared secret header rather than QStash's signature
// scheme for now, matching the CRON_SECRET pattern already used by
// app/api/cron/task-reminders/route.ts -- swap for @upstash/qstash's
// Receiver.verify() once the endpoint is live behind a real public URL.
export async function POST(req: Request) {
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
    .select('id, first_name, phone, status, sms_follow_up_status')
    .eq('id', intakeLeadId)
    .maybeSingle();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 });
  }

  // Race guard: step-2 may have qualified this lead in the meantime.
  if (lead.status === 'qualified' || lead.status === 'converted') {
    await supabase.from('intake_leads').update({ sms_follow_up_status: 'skipped_qualified' }).eq('id', lead.id);
    return NextResponse.json({ skipped: true, reason: 'already_qualified' });
  }

  if (lead.sms_follow_up_status === 'sent') {
    return NextResponse.json({ skipped: true, reason: 'already_sent' });
  }

  const { sent, error: smsError } = await sendSms(lead.phone, followUpMessage(lead.first_name));

  await supabase
    .from('intake_leads')
    .update({
      sms_follow_up_status: sent ? 'sent' : 'failed',
      sms_follow_up_sent_at: sent ? new Date().toISOString() : null,
    })
    .eq('id', lead.id);

  if (!sent) {
    console.error('[sms-followup-callback] Twilio send failed:', smsError);
    return NextResponse.json({ sent: false, error: smsError }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}
