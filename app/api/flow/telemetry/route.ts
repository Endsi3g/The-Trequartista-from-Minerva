import { NextResponse } from 'next/server';
import { fetchFlowRestaurants, computeFlowTelemetrySummary } from '@/lib/services/minerva-flow';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const restaurants = await fetchFlowRestaurants();
    const summary = computeFlowTelemetrySummary(restaurants);

    return NextResponse.json({
      summary,
      restaurants,
      connected_app_url: 'https://minerva-flow.vercel.app/overview',
      framer_landing_url: 'https://minervaflow.framer.website/',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur télémétrie Minerva Flow';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
