import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazily instantiated -- a module-scope createClient() call with a `!`
// assertion throws during `next build`'s page-data collection when
// SUPABASE_SERVICE_ROLE_KEY isn't present in the build environment (e.g.
// CI), even though it's only ever needed at request time.
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Public, token-gated read for the client-facing audit deliverable. No
// account required, and audits/audit_* tables carry no anon RLS policy at
// all -- this service-role route is the only way in, and it validates the
// token + expiry itself before returning anything.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const supabase = getSupabase();
  const { token } = await params;

  const { data: audit, error } = await supabase
    .from('audits')
    .select('*')
    .eq('view_token', token)
    .maybeSingle();

  if (error || !audit) {
    return NextResponse.json({ error: 'Lien invalide.' }, { status: 404 });
  }

  if (audit.view_token_expires_at && new Date(audit.view_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Ce lien a expiré.' }, { status: 410 });
  }

  const [{ data: processSteps }, { data: costItems }, { data: toolFindings }, { data: initiatives }, { data: comments }, { data: proposal }] = await Promise.all([
    supabase.from('audit_process_steps').select('*').eq('audit_id', audit.id).order('sort_order'),
    supabase.from('audit_cost_items').select('*').eq('audit_id', audit.id),
    supabase.from('audit_tool_findings').select('*').eq('audit_id', audit.id),
    supabase.from('audit_initiatives').select('*').eq('audit_id', audit.id).order('sort_order'),
    supabase.from('audit_comments').select('*').eq('audit_id', audit.id).order('created_at'),
    supabase.from('proposals').select('calendly_link').eq('audit_id', audit.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const initiativeIds = (initiatives || []).map((i: { id: string }) => i.id);
  const { data: reactions } = initiativeIds.length
    ? await supabase.from('audit_initiative_reactions').select('*').in('initiative_id', initiativeIds)
    : { data: [] };

  return NextResponse.json({
    audit: {
      id: audit.id,
      prospect_name: audit.prospect_name,
      status: audit.status,
      created_at: audit.created_at,
    },
    process_steps: processSteps || [],
    cost_items: costItems || [],
    tool_findings: toolFindings || [],
    initiatives: initiatives || [],
    reactions: reactions || [],
    comments: comments || [],
    calendly_link: proposal?.calendly_link || null,
  });
}
