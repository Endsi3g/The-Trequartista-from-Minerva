import { NextRequest, NextResponse } from 'next/server';
import { fetchClientPortalData } from '@/lib/services/client-portal';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: 'Token de portail requis.' }, { status: 400 });
    }

    const data = await fetchClientPortalData(token);

    if (!data) {
      return NextResponse.json(
        { error: 'Portail client introuvable ou accès désactivé.' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API /api/portal/[token] GET] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors de la récupération des données du portail' },
      { status: 500 }
    );
  }
}
