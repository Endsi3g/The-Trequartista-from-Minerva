import { NextResponse } from 'next/server';
import { fetchStudioPackages } from '@/lib/services/studio-marketplace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packages = await fetchStudioPackages();
    return NextResponse.json({ packages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement catalogue studio';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
