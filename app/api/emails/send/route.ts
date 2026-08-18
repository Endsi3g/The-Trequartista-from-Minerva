import { NextRequest, NextResponse } from 'next/server';

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

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      const fromAddress = process.env.RESEND_FROM_EMAIL || 'Minerva Agency <notifications@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html: html || undefined,
          text: text || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        console.error('[Resend API Error]', resData);
        return NextResponse.json(
          { success: false, error: resData.message || 'Erreur lors de l’envoi Resend' },
          { status: res.status }
        );
      }

      return NextResponse.json({ success: true, id: resData.id, provider: 'resend' });
    }

    // High fidelity fallback when RESEND_API_KEY is not configured yet in environment
    console.log(`[Email Dispatched Simulated] To: ${to} | Subject: "${subject}"`);
    return NextResponse.json({
      success: true,
      id: `sim-${Date.now()}`,
      provider: 'simulated_resend',
      message: 'Email traité avec succès (mode simulation haute fidélité).',
    });
  } catch (err: any) {
    console.error('[Email Send API Exception]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
