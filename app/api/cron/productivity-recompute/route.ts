import { NextResponse } from 'next/server';
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { computeProductivityScores, currentPeriodMonth, type ProductivityMilestoneKey } from '@/lib/services/productivity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

const MILESTONE_MESSAGES: Record<ProductivityMilestoneKey, (details: Record<string, unknown>) => { title: string; body: string }> = {
  rank_1: () => ({ title: '🏆 #1 au classement !', body: 'Tu prends la tête du classement de productivité ce mois-ci.' }),
  top_3: (d) => ({ title: '🥉 Top 3 !', body: `Tu entres dans le top 3 (rang #${d.current_rank}) du classement ce mois-ci.` }),
  personal_best: () => ({ title: '📈 Nouveau record personnel', body: 'Tu viens de battre ton meilleur score mensuel de productivité.' }),
};

async function sendPush(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  staleIds: string[]
): Promise<boolean> {
  const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').eq('user_id', userId);
  if (!subs?.length) return false;
  const payload = JSON.stringify({ title, body, url: '/classement' });
  let any = false;
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
      any = true;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
    }
  }
  return any;
}

// Runs daily via Vercel Cron. Recomputes the current month's leaderboard
// from real tables (tasks/leads/tech_qa_audits -- see
// lib/services/productivity.ts), then notifies members whose rank moved
// or who hit a milestone (#1, entered the top 3, personal best).
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);
  const { rankChanges, newMilestones } = await computeProductivityScores(supabase, currentPeriodMonth());

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ rankChanges: rankChanges.length, milestones: newMilestones.length, pushed: 0, reason: 'VAPID non configurée' });
  }
  webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);

  const milestoneByUser = new Map(newMilestones.map((m) => [m.user_id, m]));
  let pushed = 0;
  const staleIds: string[] = [];
  const notified = new Set<string>();

  for (const change of rankChanges) {
    const milestone = milestoneByUser.get(change.user_id);
    let title: string;
    let body: string;
    if (milestone) {
      const msg = MILESTONE_MESSAGES[milestone.milestone_key](milestone.details);
      title = msg.title;
      body = msg.body;
    } else if (change.previous_rank === null) {
      title = 'Classement mis à jour';
      body = `Tu entres au classement à la position #${change.current_rank}.`;
    } else {
      const wentUp = change.current_rank < change.previous_rank;
      title = 'Classement mis à jour';
      body = `Tu es ${wentUp ? 'monté' : 'descendu'} à la position #${change.current_rank} (précédemment #${change.previous_rank}).`;
    }
    if (await sendPush(supabase, change.user_id, title, body, staleIds)) pushed++;
    notified.add(change.user_id);
  }

  for (const milestone of newMilestones) {
    if (notified.has(milestone.user_id)) continue;
    const msg = MILESTONE_MESSAGES[milestone.milestone_key](milestone.details);
    if (await sendPush(supabase, milestone.user_id, msg.title, msg.body, staleIds)) pushed++;
  }

  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  return NextResponse.json({ rankChanges: rankChanges.length, milestones: newMilestones.length, pushed });
}
