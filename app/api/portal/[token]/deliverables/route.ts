import { NextRequest, NextResponse } from 'next/server';
import { fetchClientPortalData, submitDeliverableReview } from '@/lib/services/client-portal';
import type { DeliverableStatus } from '@/lib/types';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    const body = await req.json();

    const { deliverable_id, status, feedback_notes } = body;

    if (!deliverable_id || !status) {
      return NextResponse.json(
        { error: 'Les champs deliverable_id et status sont requis.' },
        { status: 400 }
      );
    }

    // Verify token validity
    const portalData = await fetchClientPortalData(token);
    if (!portalData) {
      return NextResponse.json({ error: 'Portail client non autorisé.' }, { status: 403 });
    }

    const success = await submitDeliverableReview(
      deliverable_id,
      status as DeliverableStatus,
      feedback_notes
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Échec de l’enregistrement de votre retour.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: status === 'approved' ? 'Livrable approuvé avec succès !' : 'Demande de modifications enregistrée.',
    });
  } catch (error: any) {
    console.error('[API /api/portal/[token]/deliverables POST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du traitement de l’approbation' },
      { status: 500 }
    );
  }
}
