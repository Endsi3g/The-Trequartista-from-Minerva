import { NextRequest, NextResponse } from 'next/server';
import { fetchTeamCommissions, calculateHybridCommission } from '@/lib/services/revops-team';
import { getSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const commissions = await fetchTeamCommissions();
    return NextResponse.json({ commissions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement commissions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, commissionId, dealBaseAmountCad, mrrMonthlyCad, monthlyAchievedTotalCad } = body;

    if (action === 'calculate') {
      const calc = calculateHybridCommission(dealBaseAmountCad, mrrMonthlyCad, monthlyAchievedTotalCad);
      return NextResponse.json({ calculation: calc });
    }

    if (action === 'update_status' && commissionId) {
      const { status } = body;
      await getSupabase()
        .from('team_commissions')
        .update({
          status,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', commissionId);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur modification commission';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
