import { NextRequest, NextResponse } from 'next/server';
import { createStudioServiceOrder } from '@/lib/services/studio-marketplace';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, packageId, notes } = body;

    if (!clientId || !packageId) {
      return NextResponse.json({ error: 'clientId et packageId requis' }, { status: 400 });
    }

    const order = await createStudioServiceOrder({
      clientId,
      packageId,
      notes,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur enregistrement commande studio';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
