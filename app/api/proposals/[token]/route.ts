import { NextRequest, NextResponse } from 'next/server';
import { fetchProposalByToken, signCommercialProposal } from '@/lib/services/proposals';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const proposal = await fetchProposalByToken(token);

    if (!proposal) {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
    }

    return NextResponse.json({ proposal });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement proposition';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;
    const body = await req.json();
    const { signerName, signatureDataUrl } = body;

    if (!signerName || !signerName.trim()) {
      return NextResponse.json({ error: 'Nom du signataire obligatoire' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await signCommercialProposal(token, {
      signerName: signerName.trim(),
      signatureDataUrl,
      signerIp: ip,
    });

    if (!result.success || !result.proposal) {
      return NextResponse.json({ error: 'Échec de la signature' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      message: 'Proposition signée et validée avec succès.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur signature proposition';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
