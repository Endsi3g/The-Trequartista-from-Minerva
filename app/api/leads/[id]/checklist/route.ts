import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { corsHeaders, handleCorsPreflight } from '@/lib/cors';
import type { InterventionChecklistItem } from '@/lib/leads/scoring';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const ChecklistUpdateSchema = z.object({
  stepId: z.string(),
  completed: z.boolean(),
  notes: z.string().optional().nullable(),
  completedBy: z.string().optional().nullable(),
});

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!id) {
    return NextResponse.json({ error: 'ID requis' }, { status: 400, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400, headers });
  }

  const parsed = ChecklistUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400, headers });
  }

  const { stepId, completed, notes, completedBy } = parsed.data;
  const supabase = getSupabase();

  // 1. Récupérer le lead et sa checklist actuelle
  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('id, company_name, contact_name, status, stage, intervention_checklist')
    .eq('id', id)
    .single();

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead introuvable' }, { status: 404, headers });
  }

  const currentChecklist: InterventionChecklistItem[] = Array.isArray(lead.intervention_checklist)
    ? (lead.intervention_checklist as InterventionChecklistItem[])
    : [];

  const updatedChecklist = currentChecklist.map((item) => {
    if (item.id === stepId) {
      return {
        ...item,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
        completedBy: completed ? (completedBy || 'Technicien') : null,
        notes: notes !== undefined ? notes : item.notes,
      };
    }
    return item;
  });

  // Vérifier si toutes les étapes sont maintenant complétées (passage à trial_active)
  const allCompleted = updatedChecklist.length > 0 && updatedChecklist.every((item) => item.completed);

  const updates: Record<string, any> = {
    intervention_checklist: updatedChecklist,
    updated_at: new Date().toISOString(),
  };

  if (allCompleted) {
    updates.status = 'Qualifié';
    updates.stage = 'qualification';
  }

  const { error: updateErr } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500, headers });
  }

  // 2. Logging dans lead_events
  await supabase.from('lead_events').insert({
    lead_id: id,
    event_type: allCompleted ? 'trial_activated' : 'checklist_updated',
    payload: {
      stepId,
      completed,
      allCompleted,
      completedBy: completedBy || 'Technicien',
    },
  });

  return NextResponse.json(
    {
      success: true,
      checklist: updatedChecklist,
      allCompleted,
      status: updates.status || lead.status,
    },
    { status: 200, headers }
  );
}
