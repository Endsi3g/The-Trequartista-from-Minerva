import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { generateGeminiText } from '@/lib/services/gemini';
import { getIsoWeekStart } from '@/lib/utils/dates';
import type { CoachTaskSnapshotItem, AvailabilityPollSlot } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const FALLBACK_QUESTIONS = [
  "Qu'est-ce qui a le mieux fonctionné cette semaine ? Et qu'est-ce qui a coincé ?",
  "De quoi aurais-tu besoin la semaine prochaine pour avancer plus vite ?",
  "Sur une échelle de 1 à 10, comment s'est passée ta semaine -- et pourquoi ce chiffre ?",
];

// Three candidate slots on the Monday/Tuesday/Wednesday of NEXT week, at
// 10h/14h -- an in-app availability poll, never a real calendar
// integration (explicit product decision).
function buildProposedSlots(): AvailabilityPollSlot[] {
  const thisWeekMonday = new Date(`${getIsoWeekStart(new Date())}T00:00:00Z`);
  const nextMonday = new Date(thisWeekMonday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  const candidates: { dayOffset: number; hour: number }[] = [
    { dayOffset: 0, hour: 10 },
    { dayOffset: 1, hour: 14 },
    { dayOffset: 2, hour: 10 },
  ];

  return candidates.map(({ dayOffset, hour }) => {
    const d = new Date(nextMonday);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    d.setUTCHours(hour, 0, 0, 0);
    const label = d.toLocaleString('fr-CA', {
      timeZone: 'America/Toronto',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
    return { label: label.charAt(0).toUpperCase() + label.slice(1), iso: d.toISOString() };
  });
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);
  const weekStart = getIsoWeekStart(new Date());
  const todayStart = new Date().toISOString().slice(0, 10);

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

  // One shared poll per week's run, not one per member -- created once,
  // idempotent across a re-run the same day.
  let pollId: string | null = null;
  const { data: existingPoll } = await supabase
    .from('availability_polls')
    .select('id')
    .gte('created_at', `${todayStart}T00:00:00Z`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingPoll) {
    pollId = existingPoll.id;
  } else {
    const { data: createdPoll, error: pollError } = await supabase
      .from('availability_polls')
      .insert([{ created_by: null, question: "Créneau pour l'appel d'équipe hebdo", proposed_slots: buildProposedSlots() }])
      .select('id')
      .single();
    if (pollError) {
      return NextResponse.json({ error: pollError.message }, { status: 500 });
    }
    pollId = createdPoll.id;
  }

  let posted = 0;
  for (const member of members) {
    const { data: existing } = await supabase
      .from('checkin_weekly_responses')
      .select('id')
      .eq('user_id', member.id)
      .eq('week_start', weekStart)
      .maybeSingle();
    if (existing) continue;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, status, priority')
      .eq('assigned_to', member.id)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(10);

    const snapshot: CoachTaskSnapshotItem[] = (tasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      status: t.status,
      priority: t.priority,
    }));

    const openQuestion = await generateGeminiText(
      `Tu es "Coach Minerva", le coach IA interne d'une agence de marketing/automatisation. Rédige UNE seule question ouverte, courte (1 phrase, en français, tutoiement), pour le check-in hebdomadaire de ${member.full_name || 'ce membre'}, qui termine la semaine avec ${snapshot.length} tâche(s) encore active(s). Réponds uniquement avec la question, sans guillemets ni préambule.`,
      FALLBACK_QUESTIONS[new Date().getDate() % FALLBACK_QUESTIONS.length]
    );

    const taskLines = snapshot.length
      ? snapshot.map((t) => `• ${t.title}${t.due_date ? ` (échéance ${t.due_date})` : ''}`).join('\n')
      : "Aucune tâche active en ce moment.";

    const checkinBody = `Point hebdo, ${member.full_name || ''} 📋 Tâches encore actives :\n${taskLines}\n\n${openQuestion}`;
    await supabase.from('team_chat_messages').insert([
      { channel_type: 'coach', channel_id: member.id, sender_id: null, body: checkinBody },
    ]);

    const pollBody = "On planifie un appel d'équipe la semaine prochaine -- vote pour ton créneau préféré ci-dessous 👇";
    await supabase.from('team_chat_messages').insert([
      { channel_type: 'coach', channel_id: member.id, sender_id: null, body: pollBody, poll_id: pollId },
    ]);

    await supabase.from('checkin_weekly_responses').insert([
      { user_id: member.id, week_start: weekStart, task_snapshot: snapshot },
    ]);
    posted++;
  }

  return NextResponse.json({ posted, members: members.length, pollId });
}
