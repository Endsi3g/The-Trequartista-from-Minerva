import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { requireTeamMember } from '@/lib/server/permissions';
import { generateGeminiText } from '@/lib/services/gemini';
import { getIsoWeekStart } from '@/lib/utils/dates';

// Called (fire-and-forget) from /chat whenever a member sends a message in
// their private "coach" channel. Files the reply against whichever
// standup/weekly-checkin row is still waiting on an open_answer, then folds
// it into a running per-member memory summary (via Gemini) so the next
// daily/weekly prompt can reference recent context instead of starting
// cold -- same lazy/graceful-degradation spirit as the rest of the Gemini
// integration: if Gemini isn't configured, the reply is still recorded,
// just without a memory update.
export async function POST(req: Request) {
  const authed = await createServerClient();
  const guard = await requireTeamMember(authed);
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }

  const userId = guard.user.id;
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getIsoWeekStart(new Date());

  const { data: standup } = await authed
    .from('standup_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .is('open_answer', null)
    .maybeSingle();

  let filed = false;
  if (standup) {
    await authed.from('standup_responses').update({ open_answer: message }).eq('id', standup.id);
    filed = true;
  } else {
    const { data: checkin } = await authed
      .from('checkin_weekly_responses')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .is('open_answer', null)
      .maybeSingle();
    if (checkin) {
      await authed.from('checkin_weekly_responses').update({ open_answer: message }).eq('id', checkin.id);
      filed = true;
    }
  }

  const { data: existingMemory } = await authed
    .from('coach_member_memory')
    .select('summary')
    .eq('user_id', userId)
    .maybeSingle();
  const previousSummary = existingMemory?.summary || '';

  const updatedSummary = await generateGeminiText(
    `Tu es la mémoire personnelle de "Coach Minerva", un coach IA interne d'agence. Voici ce qu'on savait déjà de ce membre : "${previousSummary || '(rien pour l\'instant)'}". Il vient de répondre ceci au check-in du ${today} : "${message}". Mets à jour le résumé en 2-3 phrases courtes, en français, factuel (objectifs, blocages récurrents, préférences) -- pas de sentiment excessif. Réponds uniquement avec le résumé mis à jour, sans préambule.`,
    previousSummary
  );

  await authed
    .from('coach_member_memory')
    .upsert([{ user_id: userId, summary: updatedSummary, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });

  return NextResponse.json({ ok: true, filed });
}
