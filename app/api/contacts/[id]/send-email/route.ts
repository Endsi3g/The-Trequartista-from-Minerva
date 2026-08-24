import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { sendEmailServerSide } from '@/lib/services/email-service';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authed = await createServerClient();
  const { data: { user } } = await authed.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: { subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const subject = body.subject?.trim();
  const message = body.message?.trim();
  if (!subject || !message) {
    return NextResponse.json({ error: 'subject et message requis' }, { status: 400 });
  }

  const { data: contact } = await authed.from('contacts').select('email, full_name').eq('id', id).maybeSingle();
  if (!contact?.email) {
    return NextResponse.json({ error: "Ce contact n'a pas d'adresse courriel." }, { status: 400 });
  }

  const result = await sendEmailServerSide({
    to: contact.email,
    subject,
    text: message,
    html: message.replace(/\n/g, '<br />'),
  });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.error?.includes('non configuré') ? 503 : 502 });
  }

  await authed.from('contact_notes').insert([{ contact_id: id, body: `${subject}\n\n${message}`, channel: 'email', created_by: user.id }]);

  return NextResponse.json({ sent: true });
}
