import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { generateGeminiText } from '@/lib/services/gemini';
import type { CoachTaskSnapshotItem } from '@/lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// A small honest rotation used when Gemini isn't configured -- real UI
// copy, not fabricated business data, so the daily nudge still works
// without an AI key (same graceful-degradation spirit as the rest of the
// app: a feature should still be useful with the AI layer switched off).
const FALLBACK_QUESTIONS = [
  "Sur quoi comptes-tu avancer aujourd'hui en priorité ?",
  "Y a-t-il un blocage sur lequel tu voudrais de l'aide aujourd'hui ?",
  "Qu'est-ce qui te ferait dire que ta journée est réussie ?",
];

// A member is flagged "ghosting" once they've missed this many consecutive
// prior daily check-ins (today's freshly-posted prompt doesn't count yet),
// or gone this many days without signing in at all -- whichever trips
// first. Deliberately simple thresholds for v1; tune once real usage data
// exists rather than guessing at a more elaborate scoring model upfront.
const GHOST_MISSED_CHECKINS_THRESHOLD = 2;
const GHOST_INACTIVITY_DAYS_THRESHOLD = 3;
const GHOST_RENUDGE_HOURS = 24;

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

  // One lookup for everyone's last sign-in, used by the ghost check below --
  // cheaper than one auth.admin.getUserById call per member.
  const lastSignInByUserId = new Map<string, string | null>();
  try {
    const { data: userList } = await supabase.auth.admin.listUsers({ perPage: 200 });
    for (const u of userList?.users || []) {
      lastSignInByUserId.set(u.id, u.last_sign_in_at || null);
    }
  } catch (err) {
    console.warn('[coach-bot-daily] Could not list auth users for ghost detection:', err);
  }

  let posted = 0;
  let ghosting = 0;
  let nudged = 0;

  for (const member of members) {
    // Idempotent: a re-run (manual trigger, cron retry) skips members
    // already prompted today instead of double-posting.
    const { data: existing } = await supabase
      .from('standup_responses')
      .select('id')
      .eq('user_id', member.id)
      .eq('date', today)
      .maybeSingle();

    if (!existing) {
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

      const { data: memory } = await supabase
        .from('coach_member_memory')
        .select('summary')
        .eq('user_id', member.id)
        .maybeSingle();
      const memoryLine = memory?.summary
        ? `Ce qu'on sait déjà de ce membre : "${memory.summary}". `
        : '';

      const openQuestion = await generateGeminiText(
        `Tu es "Coach Minerva", le coach IA interne d'une agence de marketing/automatisation. ${memoryLine}Rédige UNE seule question ouverte, courte (1 phrase, en français, tutoiement), chaleureuse et concrète pour lancer le point quotidien de ${member.full_name || 'ce membre'}, qui a ${snapshot.length} tâche(s) active(s) aujourd'hui. Réponds uniquement avec la question, sans guillemets ni préambule.`,
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

    // ── Anti-ghost detection (independent of whether today's prompt was
    // just posted) ──
    const { data: priorStandups } = await supabase
      .from('standup_responses')
      .select('open_answer')
      .eq('user_id', member.id)
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(GHOST_MISSED_CHECKINS_THRESHOLD);

    const consecutiveMissed =
      (priorStandups || []).length >= GHOST_MISSED_CHECKINS_THRESHOLD &&
      (priorStandups || []).every((s) => !s.open_answer)
        ? GHOST_MISSED_CHECKINS_THRESHOLD
        : 0;

    const lastActivityAt = lastSignInByUserId.get(member.id) || null;
    const inactivityDays = lastActivityAt
      ? (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity;

    const isGhosting = consecutiveMissed >= GHOST_MISSED_CHECKINS_THRESHOLD || inactivityDays >= GHOST_INACTIVITY_DAYS_THRESHOLD;
    if (isGhosting) ghosting++;

    const { data: existingGhostStatus } = await supabase
      .from('coach_ghost_status')
      .select('last_nudged_at')
      .eq('user_id', member.id)
      .maybeSingle();

    const hoursSinceLastNudge = existingGhostStatus?.last_nudged_at
      ? (Date.now() - new Date(existingGhostStatus.last_nudged_at).getTime()) / (1000 * 60 * 60)
      : Infinity;

    let nudgedNow = false;
    if (isGhosting && hoursSinceLastNudge >= GHOST_RENUDGE_HOURS && vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth_key')
        .eq('user_id', member.id);
      if (subs?.length) {
        const payload = JSON.stringify({
          title: 'Coach Minerva 👋',
          body: "On ne t'a pas vu depuis un moment -- tout va bien ? Un petit mot dans ton canal Coach Minerva aiderait l'équipe à savoir où tu en es.",
          url: '/chat',
        });
        const staleIds: string[] = [];
        for (const sub of subs) {
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
            nudgedNow = true;
          } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
          }
        }
        if (staleIds.length) {
          await supabase.from('push_subscriptions').delete().in('id', staleIds);
        }
      }
    }
    if (nudgedNow) nudged++;

    await supabase.from('coach_ghost_status').upsert(
      [
        {
          user_id: member.id,
          consecutive_missed_checkins: consecutiveMissed,
          last_activity_at: lastActivityAt,
          is_ghosting: isGhosting,
          last_nudged_at: nudgedNow ? new Date().toISOString() : existingGhostStatus?.last_nudged_at || null,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'user_id' }
    );
  }

  return NextResponse.json({ posted, members: members.length, ghosting, nudged });
}
