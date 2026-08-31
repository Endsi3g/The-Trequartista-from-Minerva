import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { generateGeminiText } from '@/lib/services/gemini';
import type { CoachTaskSnapshotItem } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// A small honest rotation used when Gemini isn't configured -- real UI
// copy, not fabricated business data, so the daily nudge still works
// without an AI key (same graceful-degradation spirit as the rest of the
// app: a feature should still be useful with the AI layer switched off).
const FALLBACK_QUESTIONS = [
  "Sur quoi comptes-tu avancer aujourd'hui en priorité ?",
  "Y a-t-il un blocage sur lequel tu voudrais de l'aide aujourd'hui ?",
  "Qu'est-ce qui te ferait dire que ta journée est réussie ?",
];

// Runs daily via Vercel Cron (see vercel.json), same auth pattern as
// task-reminders: Vercel signs the request with Authorization: Bearer
// $CRON_SECRET when CRON_SECRET is set.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);
  const today = new Date().toISOString().slice(0, 10);

  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('approved', true)
    .in('role', ['admin', 'member']);
  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }
  if (!members || members.length === 0) {
    return NextResponse.json({ posted: 0, reason: 'Aucun membre actif' });
  }

  let posted = 0;
  for (const member of members) {
    // Idempotent: a re-run (manual trigger, cron retry) skips members
    // already prompted today instead of double-posting.
    const { data: existing } = await supabase
      .from('standup_responses')
      .select('id')
      .eq('user_id', member.id)
      .eq('date', today)
      .maybeSingle();
    if (existing) continue;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, status, priority')
      .eq('assignee_id', member.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(8);

    const snapshot: CoachTaskSnapshotItem[] = (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      status: t.status,
      priority: t.priority,
    }));

    const openQuestion = await generateGeminiText(
      `Tu es "Coach Minerva", le coach IA interne d'une agence de marketing/automatisation. Rédige UNE seule question ouverte, courte (1 phrase, en français, tutoiement), chaleureuse et concrète pour lancer le point quotidien de ${member.full_name || 'ce membre'}, qui a ${snapshot.length} tâche(s) active(s) aujourd'hui. Réponds uniquement avec la question, sans guillemets ni préambule.`,
      FALLBACK_QUESTIONS[new Date().getDate() % FALLBACK_QUESTIONS.length]
    );

    const taskLines = snapshot.length
      ? snapshot.map((t) => `• ${t.title}${t.due_date ? ` (échéance ${t.due_date})` : ''}`).join('\n')
      : "Aucune tâche active assignée pour l'instant.";

    const body = `Bonjour ${member.full_name || ''} 👋 Voici tes tâches en cours :\n${taskLines}\n\n${openQuestion}`;

    await supabase.from('team_chat_messages').insert([
      { channel_type: 'coach', channel_id: member.id, sender_id: null, body },
    ]);
    await supabase.from('standup_responses').insert([
      { user_id: member.id, date: today, task_snapshot: snapshot },
    ]);
    posted++;
  }

  return NextResponse.json({ posted, members: members.length });
}
