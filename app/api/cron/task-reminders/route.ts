import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Runs daily via Vercel Cron (see vercel.json). Vercel signs cron requests
// with an Authorization: Bearer $CRON_SECRET header when CRON_SECRET is
// set -- verified below so this endpoint can't be triggered by anyone who
// finds the URL.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ sent: 0, reason: 'VAPID non configurée' }, { status: 200 });
  }
  webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);

  const today = new Date().toISOString().slice(0, 10);
  const { data: overdueTasks, error } = await supabase
    .from('tasks')
    .select('id, title, assignee_id, due_date')
    .lt('due_date', today)
    .neq('status', 'done')
    .not('assignee_id', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!overdueTasks || overdueTasks.length === 0) {
    return NextResponse.json({ sent: 0, overdue: 0 });
  }

  const byAssignee = new Map<string, typeof overdueTasks>();
  for (const task of overdueTasks) {
    if (!task.assignee_id) continue;
    const list = byAssignee.get(task.assignee_id) || [];
    list.push(task);
    byAssignee.set(task.assignee_id, list);
  }

  let sent = 0;
  for (const [assigneeId, tasks] of byAssignee) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', assigneeId);
    if (!subs?.length) continue;

    const body =
      tasks.length === 1
        ? `« ${tasks[0].title} » est en retard.`
        : `${tasks.length} tâches en retard vous sont assignées.`;
    const payload = JSON.stringify({ title: 'Tâche en retard', body, url: '/tasks' });

    const staleIds: string[] = [];
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
      }
    }
    if (staleIds.length) {
      await supabase.from('push_subscriptions').delete().in('id', staleIds);
    }
  }

  return NextResponse.json({ sent, overdue: overdueTasks.length, assignees: byAssignee.size });
}
