import { NextRequest, NextResponse } from 'next/server';
import { sendEmailServerSide } from '@/lib/services/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants : to, subject, html/text.' },
        { status: 400 }
      );
    }

    const result = await sendEmailServerSide({ to, subject, html, text });
    if (!result.success) {
      return NextResponse.json(result, { status: result.error?.includes('non configuré') ? 503 : 502 });
    }
    return NextResponse.json({ ...result, provider: 'resend' });
  } catch (err) {
    console.error('[Email Send API Exception]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur interne';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
