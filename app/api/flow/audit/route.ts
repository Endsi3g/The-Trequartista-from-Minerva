import { NextRequest, NextResponse } from 'next/server';
import { createRestaurantAudit } from '@/lib/services/minerva-flow';
import { addLead } from '@/lib/services/supabase-data';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      restaurant_name,
      contact_name,
      email,
      phone,
      monthly_ubereats_volume_cad,
      commission_rate_pct,
      website_url,
      gmb_rating,
    } = body;

    if (!restaurant_name || !contact_name) {
      return NextResponse.json(
        { error: 'Nom du restaurant et contact obligatoires.' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const volume = Number(monthly_ubereats_volume_cad) || 15000;
    const rate = Number(commission_rate_pct) || 28;

    // 1. Create Restaurant Audit record
    const audit = await createRestaurantAudit({
      restaurant_name,
      contact_name,
      email,
      phone,
      monthly_ubereats_volume_cad: volume,
      commission_rate_pct: rate,
      website_url,
      gmb_rating,
    });

    // 2. Automatically create CRM Lead in Trequartista Pipeline
    await addLead({
      client_name: restaurant_name,
      company_name: restaurant_name,
      contact_name,
      contact_email: email || '',
      contact_phone: phone || '',
      service_requested: 'Minerva Flow & Audit Commissions UberEats',
      score_grade: 'A',
      status: 'Nouveau',
      stage: 'nouveau',
      mrr_value: 149,
      one_time_value: 650,
      probability_pct: 30,
      notes: [],
    });

    return NextResponse.json(
      {
        success: true,
        audit,
        audit_url: `/audit/resto/${audit.audit_token}`,
      },
      {
        status: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur calcul audit';
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
