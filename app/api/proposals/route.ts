import { NextRequest, NextResponse } from 'next/server';
import { fetchProposals, createProposal } from '@/lib/services/proposals';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proposals = await fetchProposals();
    return NextResponse.json({ proposals });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement des propositions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      client_name,
      client_email,
      client_company,
      client_id,
      lead_id,
      deliverables,
      scope_phases,
      total_monthly_cad,
      terms_and_conditions,
    } = body;

    if (!title || !client_name || !deliverables || deliverables.length === 0) {
      return NextResponse.json(
        { error: 'Titre, nom du client et au moins un livrable requis.' },
        { status: 400 }
      );
    }

    const proposal = await createProposal({
      title,
      client_name,
      client_email,
      client_company,
      client_id,
      lead_id,
      deliverables,
      scope_phases: scope_phases || [],
      total_monthly_cad,
      terms_and_conditions,
    });

    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création proposition';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
