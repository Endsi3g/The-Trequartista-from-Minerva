import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function verifyAuth(req: Request): boolean {
  const expectedSecret = process.env.REACH_SYNC_SECRET || process.env.CRON_SECRET || 'minerva_reach_sync_secret_2026';
  const authHeader = req.headers.get('authorization');
  const customHeader = req.headers.get('x-reach-sync-secret');

  if (customHeader === expectedSecret) return true;
  if (authHeader && (authHeader === `Bearer ${expectedSecret}` || authHeader === expectedSecret)) return true;

  return false;
}

export async function GET() {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .not('reach_id', 'is', null);

  return NextResponse.json({
    status: 'online',
    product: 'Minerva Reach Sync Gateway',
    endpoint: '/api/leads/reach-sync',
    synced_leads_count: error ? 0 : count || 0,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  if (!verifyAuth(req)) {
    // If not authenticated via shared secret, check if the request is from an internal authenticated session
    const supabase = getSupabase();
    const cookieHeader = req.headers.get('cookie') || '';
    if (!cookieHeader.includes('sb-')) {
      return NextResponse.json(
        { error: 'Accès non autorisé. Clé secrète REACH_SYNC_SECRET requise.' },
        { status: 401 }
      );
    }
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide.' }, { status: 400 });
  }

  const rawLeads: any[] = Array.isArray(body)
    ? body
    : Array.isArray(body.leads)
    ? body.leads
    : body
    ? [body]
    : [];

  if (rawLeads.length === 0) {
    return NextResponse.json({ error: 'Aucun lead fourni pour la synchronisation.' }, { status: 400 });
  }

  const supabase = getSupabase();
  let createdCount = 0;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const item of rawLeads) {
    const companyName = item.company_name || item.name || item.restaurant_name || 'Commerce Inconnu';
    const contactName = item.contact_name || item.owner_name || companyName;
    const phone = item.phone || item.contact_phone || null;
    const email = item.email || item.contact_email || null;
    const reachId = item.reach_id || item.id || null;
    const address = item.address || item.city || item.neighbourhood || 'Grand Montréal';
    const notesText = item.notes || item.signal || item.description || `Synchronisé depuis Minerva Reach (${address})`;

    try {
      // 1. Check if lead already exists by reach_id
      let existingLeadId: string | null = null;

      if (reachId) {
        const { data: byReach } = await supabase
          .from('leads')
          .select('id')
          .eq('reach_id', reachId)
          .maybeSingle();
        if (byReach) existingLeadId = byReach.id;
      }

      // 2. Fallback check by company_name
      if (!existingLeadId) {
        const { data: byName } = await supabase
          .from('leads')
          .select('id')
          .ilike('company_name', companyName)
          .maybeSingle();
        if (byName) existingLeadId = byName.id;
      }

      if (existingLeadId) {
        // Update existing lead
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
          reach_id: reachId,
        };
        if (phone) updatePayload.phone = phone;
        if (email) updatePayload.email = email;

        await supabase.from('leads').update(updatePayload).eq('id', existingLeadId);
        updatedCount += 1;
      } else {
        // Insert new lead
        const insertPayload = {
          company_name: companyName,
          contact_name: contactName,
          phone,
          email,
          reach_id: reachId,
          service_requested: item.service_requested || 'Minerva Flow & Acquisition',
          status: 'Nouveau',
          stage: 'nouveau',
          mrr_value: Number(item.mrr_value) || 250,
          one_time_value: Number(item.one_time_value) || 1500,
          source: 'Minerva Reach',
          probability_pct: 25,
          notes: JSON.stringify([
            {
              id: `note-${Date.now()}`,
              author: 'Minerva Reach',
              text: notesText,
              created_at: new Date().toISOString(),
            },
          ]),
          metadata: {
            synced_from: 'minerva-reach',
            neighbourhood: address,
            google_maps_url: item.google_maps_url || null,
            rating: item.rating || null,
            reviews_count: item.reviews_count || null,
          },
        };

        const { error: insertError } = await supabase.from('leads').insert([insertPayload]);
        if (insertError) {
          errors.push(`Erreur pour ${companyName}: ${insertError.message}`);
        } else {
          createdCount += 1;
        }
      }
    } catch (err: any) {
      errors.push(`Exception pour ${companyName}: ${err.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    created: createdCount,
    updated: updatedCount,
    total_processed: rawLeads.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
