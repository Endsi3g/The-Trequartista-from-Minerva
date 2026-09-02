import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { currentPeriodMonth } from '@/lib/services/productivity';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Runs every Friday via Vercel Cron -- a personal recap of the current
// month's live rank/points, so nobody has to open /classement to know
// where they stand.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  if (!vapidPublicKey || !vapidPrivateKey) {
    return NextResponse.json({ sent: 0, reason: 'VAPID non configurée' });
  }
  webpush.setVapidDetails('mailto:equipe@minervaflow.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createServiceClient(supabaseUrl, supabaseSecret);
  const periodMonthStr = currentPeriodMonth().toISOString().slice(0, 10);

  const { data: scores } = await supabase
    .from('productivity_scores')
    .select('user_id, total_points, current_rank')
    .eq('period_month', periodMonthStr);

  if (!scores?.length) {
    return NextResponse.json({ sent: 0, reason: 'Aucun score ce mois-ci' });
  }

  let sent = 0;
  const staleIds: string[] = [];
  for (const s of scores) {
    const { data: subs } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').eq('user_id', s.user_id);
    if (!subs?.length) continue;
    const payload = JSON.stringify({
      title: 'Récap hebdo — Classement',
      body: `Cette semaine : #${s.current_rank} avec ${s.total_points} points ce mois-ci.`,
      url: '/classement',
    });
    for (const sub of subs) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } }, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) staleIds.push(sub.id);
      }
    }
  }
  if (staleIds.length) {
    await supabase.from('push_subscriptions').delete().in('id', staleIds);
  }

  return NextResponse.json({ sent });
}
