import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initiateOutboundCall } from '@/lib/services/elevenlabs';

export const runtime = 'nodejs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leadId } = await params;
  if (!leadId) {
    return NextResponse.json({ error: 'leadId requis' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .maybeSingle();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 });
  }

  const phone = lead.phone || lead.contact_phone;
  if (!phone) {
    return NextResponse.json(
      { error: 'Ce prospect ne possède aucun numéro de téléphone renseigné.' },
      { status: 400 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // optional body
  }

  const simulate = body.simulate === true || !process.env.ELEVENLABS_API_KEY;

  let conversationId: string | null = null;
  let callError: string | undefined;

  if (simulate) {
    // Simulated successful call dispatch for testing & development
    conversationId = `sim_conv_${Date.now()}`;
  } else {
    const res = await initiateOutboundCall(phone, {
      lead_id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      custom_instruction: body.custom_instruction,
    });
    conversationId = res.conversationId;
    callError = res.error;
  }

  if (!conversationId) {
    return NextResponse.json(
      {
        error: callError || "Impossible d'initier l'appel ElevenLabs.",
        details: 'Vérifiez vos variables ELEVENLABS_API_KEY et ELEVENLABS_AGENT_PHONE_NUMBER_ID.',
      },
      { status: 502 }
    );
  }

  // Parse existing notes
  let existingNotes: any[] = [];
  if (Array.isArray(lead.notes)) {
    existingNotes = lead.notes;
  } else if (typeof lead.notes === 'string' && lead.notes.startsWith('[')) {
    try {
      existingNotes = JSON.parse(lead.notes);
    } catch {
      existingNotes = [];
    }
  }

  const newNote = {
    id: `call-note-${Date.now()}`,
    author: 'Agent Vocal IA (ElevenLabs)',
    text: `Appel sortant de qualification initié vers ${phone} (ID: ${conversationId})${simulate ? ' [Mode Simulation]' : ''}`,
    created_at: new Date().toISOString(),
  };

  const updatedNotes = [newNote, ...existingNotes];

  // Update lead status and stage
  const updatePayload: Record<string, any> = {
    voice_call_status: 'calling',
    voice_call_id: conversationId,
    notes: JSON.stringify(updatedNotes),
    updated_at: new Date().toISOString(),
  };

  if (lead.stage === 'nouveau') {
    updatePayload.stage = 'qualification';
    updatePayload.status = 'Contacté';
  }

  await supabase.from('leads').update(updatePayload).eq('id', lead.id);

  // Also log into voice_calls table if available
  try {
    await supabase.from('voice_calls').insert([
      {
        elevenlabs_conversation_id: conversationId,
        status: 'completed',
        duration_seconds: simulate ? 45 : null,
        outcome: `Appel sortant vers ${lead.company_name} (${phone})`,
      },
    ]);
  } catch (logErr) {
    console.warn('[voice/call] voice_calls insert fallback:', logErr);
  }

  return NextResponse.json({
    success: true,
    conversationId,
    simulated: simulate,
    phone,
    stage: updatePayload.stage || lead.stage,
    message: `Appel de qualification IA lancé avec succès vers ${phone}`,
  });
}
