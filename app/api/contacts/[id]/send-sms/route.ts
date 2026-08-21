import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendSms } from '@/lib/services/twilio';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'message requis' }, { status: 400 });
  }

  const { data: contact } = await authed.from('contacts').select('phone, full_name').eq('id', id).maybeSingle();
  if (!contact?.phone) {
    return NextResponse.json({ error: 'Ce contact n\'a pas de numéro de téléphone.' }, { status: 400 });
  }

  const { sent, error } = await sendSms(contact.phone, message);
  if (!sent) {
    return NextResponse.json({ error: error ?? 'Erreur inconnue' }, { status: 502 });
  }

  await authed.from('contact_notes').insert([{ contact_id: id, body: message, channel: 'sms', created_by: user.id }]);

  return NextResponse.json({ sent: true });
}
