import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!id) {
    return NextResponse.json({ error: 'ID manquant' }, { status: 400, headers });
  }

  const supabase = getSupabase();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, company_name, contact_name, email, phone, city, call_at, status, qualification_tier, qualification_score, intervention_checklist')
    .eq('id', id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404, headers });
  }

  return NextResponse.json({ lead }, { status: 200, headers });
}
