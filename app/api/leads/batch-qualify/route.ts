import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeLeadQualification } from '../[id]/qualify/route';

export const runtime = 'nodejs';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // optional body
  }

  const supabase = getSupabase();
  let query = supabase.from('leads').select('*');

  if (Array.isArray(body.leadIds) && body.leadIds.length > 0) {
    query = query.in('id', body.leadIds);
  } else if (body.onlyUnqualified === true) {
    query = query.is('ai_score', null);
  } else {
    // default: limit to 50 leads to prevent timeouts
    query = query.limit(50);
  }

  const { data: leads, error } = await query;
  if (error || !leads) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des leads.' }, { status: 500 });
  }

  let qualifiedCount = 0;
  let promotedCount = 0;

  for (const lead of leads) {
    const { score, qualification } = computeLeadQualification(lead);

    const updatePayload: Record<string, any> = {
      ai_score: score,
      ai_qualification_notes: qualification,
      updated_at: new Date().toISOString(),
    };

    if (score >= 70 && lead.stage === 'nouveau') {
      updatePayload.stage = 'qualification';
      updatePayload.status = 'Contacté';
      promotedCount += 1;
    }

    await supabase.from('leads').update(updatePayload).eq('id', lead.id);
    qualifiedCount += 1;
  }

  return NextResponse.json({
    success: true,
    total_qualified: qualifiedCount,
    total_promoted: promotedCount,
  });
}
