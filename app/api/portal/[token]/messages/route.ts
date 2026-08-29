import { NextRequest, NextResponse } from 'next/server';
import { fetchClientPortalData, sendPortalMessage } from '@/lib/services/client-portal';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await req.json();

    const { author_name, author_email, subject, message } = body;

    if (!author_name || !message) {
      return NextResponse.json(
        { error: 'Votre nom et le message sont obligatoires.' },
        { status: 400 }
      );
    }

    const portalData = await fetchClientPortalData(token);
    if (!portalData) {
      return NextResponse.json({ error: 'Portail client non autorisé.' }, { status: 403 });
    }

    const created = await sendPortalMessage(portalData.client.id, {
      author_name,
      author_email: author_email || portalData.client.email || undefined,
      subject,
      message,
    });

    if (!created) {
      return NextResponse.json(
        { error: 'Impossible d’envoyer votre message pour le moment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Votre message a été transmis à l’équipe Minerva avec succès !',
      data: created,
    });
  } catch (error: any) {
    console.error('[API /api/portal/[token]/messages POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de l’envoi du message' },
      { status: 500 }
    );
  }
}
